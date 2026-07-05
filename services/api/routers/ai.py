"""
POST /ai/explain   — Explicación de un documento médico
POST /ai/summarize — Resumen de múltiples documentos de una persona
"""
from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import firestore

from core.security import verify_firebase_token
from core.firebase import get_firestore
from core.config import get_settings
from services.ai.factory import get_default_provider, get_fallback_provider
from services.ai.safety_guardrails import add_disclaimer, check_safety
from services.privacy.data_minimizer import minimize_document
from models.documents import (
    AIExplainRequest, AIExplainResponse,
    AISummarizeRequest, AISummarizeResponse,
)

router = APIRouter(prefix="/ai", tags=["ai"])

MEDICAL_DISCLAIMER = (
    "Esta explicación es solo orientativa y no reemplaza la valoración "
    "de un médico profesional. Los rangos pueden variar según el laboratorio, "
    "la edad, el sexo y el contexto clínico."
)


def _build_explain_prompt(req: AIExplainRequest) -> str:
    persona_ctx = ""
    if req.age_range:
        persona_ctx += f"Paciente: {req.age_range}"
    if req.biological_sex:
        persona_ctx += f", sexo {req.biological_sex}"

    return f"""Eres un asistente de salud familiar. Tu función es explicar documentos médicos
de forma clara y accesible para personas sin formación médica.

REGLAS ESTRICTAS:
- NO diagnostiques enfermedades específicas
- NO prescribas ni sugieras medicamentos concretos
- NO uses afirmaciones como "tienes", "padeces", "debes tomar"
- SÍ puedes sugerir consultar con el médico si algo parece relevante
- Responde en español colombiano, tono cálido y accesible

{persona_ctx}
Tipo de documento: {req.doc_type}

Texto del documento (anonimizado):
{req.extracted_text[:4000]}

Responde en JSON con esta estructura exacta:
{{
  "summary": "resumen en 2-3 oraciones simples",
  "key_findings": ["hallazgo 1", "hallazgo 2"],
  "follow_up_suggestions": ["sugerencia 1", "sugerencia 2"]
}}"""


def _build_summarize_prompt(texts: list[str], req: AISummarizeRequest) -> str:
    persona_ctx = ""
    if req.age_range:
        persona_ctx = f"Paciente: {req.age_range}"
    if req.biological_sex:
        persona_ctx += f", sexo {req.biological_sex}"

    combined = "\n\n---\n\n".join(texts[:5])  # Máx 5 docs

    return f"""Eres un asistente de salud familiar. Analiza estos {len(texts)} documentos médicos
y proporciona un resumen integrado del estado de salud, sin diagnosticar.

REGLAS: No diagnostiques, no prescribas medicamentos, usa lenguaje accesible, español colombiano.

{persona_ctx}

Documentos (anonimizados):
{combined[:5000]}

Responde en JSON:
{{
  "summary": "resumen global en 3-4 oraciones",
  "patterns": ["patrón observado 1", "patrón 2"],
  "recommendations": ["recomendación general 1", "recomendación 2"]
}}"""


@router.post("/explain", response_model=AIExplainResponse)
async def explain_document(
    req: AIExplainRequest,
    token: dict = Depends(verify_firebase_token),
):
    uid: str = token["uid"]
    settings = get_settings()

    # Verificar que el doc pertenece al usuario
    db = get_firestore()
    doc_snap = db.collection("users").document(uid).collection("documents").document(req.doc_id).get()
    if not doc_snap.exists:
        raise HTTPException(404, "Documento no encontrado")

    prompt = _build_explain_prompt(req)
    schema = {
        "summary": "string",
        "key_findings": ["string"],
        "follow_up_suggestions": ["string"],
    }

    provider = get_default_provider()
    provider_name = type(provider).__name__

    try:
        result = await provider.generate_structured_json(prompt, schema)
    except Exception:
        # Fallback a segundo proveedor
        provider = get_fallback_provider()
        provider_name = type(provider).__name__
        try:
            result = await provider.generate_structured_json(prompt, schema)
        except Exception as e:
            raise HTTPException(503, f"Servicio IA no disponible: {str(e)}")

    # Safety check en la respuesta
    full_text = " ".join([
        result.get("summary", ""),
        *result.get("key_findings", []),
        *result.get("follow_up_suggestions", []),
    ])
    safety = check_safety(full_text)
    if not safety["safe"]:
        # Sanitizar — eliminar respuesta y usar genérica
        result = {
            "summary": "El documento fue procesado. Consulta con tu médico para una interpretación detallada.",
            "key_findings": [],
            "follow_up_suggestions": ["Consulta con tu médico tratante."],
        }

    # Guardar resumen en Firestore (sin el texto original del doc)
    if settings.ai_store_responses:
        db.collection("users").document(uid).collection("documents").document(req.doc_id).set({
            "aiSummary": result.get("summary"),
            "aiKeyFindings": result.get("key_findings", []),
            "aiSuggestions": result.get("follow_up_suggestions", []),
            "aiProvider": provider_name,
            "aiProcessedAt": firestore.SERVER_TIMESTAMP,
            "aiReady": True,
        }, merge=True)

    return AIExplainResponse(
        doc_id=req.doc_id,
        summary=result.get("summary", ""),
        key_findings=result.get("key_findings", []),
        follow_up_suggestions=result.get("follow_up_suggestions", []),
        disclaimer=MEDICAL_DISCLAIMER,
        provider=provider_name,
    )


@router.post("/summarize", response_model=AISummarizeResponse)
async def summarize_documents(
    req: AISummarizeRequest,
    token: dict = Depends(verify_firebase_token),
):
    uid: str = token["uid"]
    db = get_firestore()

    # Cargar textos extraídos — solo los del usuario
    texts: list[str] = []
    for doc_id in req.doc_ids[:10]:
        snap = db.collection("users").document(uid).collection("documents").document(doc_id).get()
        if snap.exists:
            text = snap.to_dict().get("extractedText") or snap.to_dict().get("notes") or ""
            if text:
                texts.append(text[:1000])

    if not texts:
        raise HTTPException(422, "No hay texto extraído en los documentos seleccionados.")

    prompt = _build_summarize_prompt(texts, req)
    schema = {
        "summary": "string",
        "patterns": ["string"],
        "recommendations": ["string"],
    }

    provider = get_default_provider()
    provider_name = type(provider).__name__

    try:
        result = await provider.generate_structured_json(prompt, schema)
    except Exception:
        provider = get_fallback_provider()
        provider_name = type(provider).__name__
        result = await provider.generate_structured_json(prompt, schema)

    return AISummarizeResponse(
        summary=result.get("summary", ""),
        patterns=result.get("patterns", []),
        recommendations=result.get("recommendations", []),
        disclaimer=MEDICAL_DISCLAIMER,
        provider=provider_name,
    )
