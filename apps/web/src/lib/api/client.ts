/**
 * Cliente HTTP para el backend FastAPI de MiSalud FamilIA.
 * Adjunta automáticamente el token Firebase en cada request.
 */
import { auth } from "@/lib/firebase/config";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function getToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuario no autenticado");
  return user.getIdToken();
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail ?? `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Tipos de respuesta ─────────────────────────────────────────────────────

export interface ExtractResponse {
  doc_id: string;
  extracted_text: string;
  page_count: number;
  char_count: number;
  method: "pdf_text" | "ocr" | "none";
}

export interface AIExplainResponse {
  doc_id: string;
  summary: string;
  key_findings: string[];
  follow_up_suggestions: string[];
  disclaimer: string;
  provider: string;
}

export interface AISummarizeResponse {
  summary: string;
  patterns: string[];
  recommendations: string[];
  disclaimer: string;
  provider: string;
}

export type AdminPlanId = "free_trial" | "economico" | "familiar" | "premium";
export type AdminSubscriptionStatus = "trial" | "trial_expired" | "active" | "past_due" | "cancelled";

export interface AdminSubscriptionUpdateResponse {
  ok: boolean;
  target_uid: string;
  target_email?: string;
  plan: AdminPlanId;
  subscription_status: AdminSubscriptionStatus;
  limits: {
    maxDocuments: number;
    maxStorageBytes: number;
    maxAiTokensMonth: number;
    maxAiRequestsMonth: number;
  };
}

// ── Endpoints ──────────────────────────────────────────────────────────────

/**
 * Sube un archivo al backend para extraer su texto (OCR / PDF).
 * El archivo ya debe estar en Firebase Storage — aquí se extrae el texto.
 */
export async function extractDocument(
  docId: string,
  file: File
): Promise<ExtractResponse> {
  const form = new FormData();
  form.append("file", file);
  return request<ExtractResponse>(
    `/documents/extract?doc_id=${encodeURIComponent(docId)}`,
    { method: "POST", body: form }
  );
}

/**
 * Pide a la IA que explique un documento médico.
 * Solo envía datos anónimos (rango de edad, sexo biológico).
 */
export async function explainDocument(params: {
  doc_id: string;
  extracted_text: string;
  doc_type: string;
  age_range?: string;
  biological_sex?: string;
}): Promise<AIExplainResponse> {
  return request<AIExplainResponse>("/ai/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

/**
 * Pide a la IA un resumen de varios documentos de una persona.
 */
export async function summarizeDocuments(params: {
  doc_ids: string[];
  age_range?: string;
  biological_sex?: string;
}): Promise<AISummarizeResponse> {
  return request<AISummarizeResponse>("/ai/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export async function updateAdminSubscription(params: {
  target_uid?: string;
  target_email?: string;
  plan: AdminPlanId;
  subscription_status: AdminSubscriptionStatus;
  reason?: string;
}): Promise<AdminSubscriptionUpdateResponse> {
  return request<AdminSubscriptionUpdateResponse>("/admin/subscriptions/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}
