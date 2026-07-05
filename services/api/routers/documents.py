"""
POST /documents/extract
  Recibe un archivo (PDF o imagen), extrae el texto y lo guarda en Firestore.
  Nunca almacena el texto en logs ni lo envía a terceros en este endpoint.
"""
import io
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from firebase_admin import firestore, storage

from core.security import verify_firebase_token
from core.firebase import get_firestore, get_storage
from core.config import get_settings
from models.documents import ExtractResponse

router = APIRouter(prefix="/documents", tags=["documents"])


def _extract_pdf(data: bytes) -> tuple[str, int]:
    from pypdf import PdfReader
    reader = PdfReader(io.BytesIO(data))
    pages = [p.extract_text() or "" for p in reader.pages]
    return "\n".join(pages), len(reader.pages)


def _extract_image_ocr(data: bytes) -> str:
    try:
        import pytesseract
        from PIL import Image
        img = Image.open(io.BytesIO(data))
        return pytesseract.image_to_string(img, lang="spa")
    except Exception:
        return ""


@router.post("/extract", response_model=ExtractResponse)
async def extract_document(
    doc_id: str,
    file: UploadFile = File(...),
    token: dict = Depends(verify_firebase_token),
):
    settings = get_settings()
    uid: str = token["uid"]

    # Validar tamaño
    data = await file.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(data) > max_bytes:
        raise HTTPException(413, f"Archivo mayor a {settings.max_upload_mb} MB")

    content_type = file.content_type or ""
    filename = file.filename or "doc"

    # Extraer texto
    extracted = ""
    pages = 1
    method: str

    if "pdf" in content_type or filename.lower().endswith(".pdf"):
        extracted, pages = _extract_pdf(data)
        method = "pdf_text" if extracted.strip() else "none"
    elif content_type.startswith("image/"):
        extracted = _extract_image_ocr(data)
        method = "ocr" if extracted.strip() else "none"
    else:
        method = "none"

    extracted = extracted[:10000]  # Límite de seguridad

    # Guardar en Firestore (solo el texto extraído, sin PII)
    db = get_firestore()
    doc_ref = db.collection("users").document(uid).collection("documents").document(doc_id)
    doc_ref.set({
        "extractedText": extracted,
        "extractMethod": method,
        "extractedAt": firestore.SERVER_TIMESTAMP,
    }, merge=True)

    return ExtractResponse(
        doc_id=doc_id,
        extracted_text=extracted,
        page_count=pages,
        char_count=len(extracted),
        method=method,
    )
