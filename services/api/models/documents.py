from pydantic import BaseModel, Field
from typing import Literal


class ExtractResponse(BaseModel):
    doc_id: str
    extracted_text: str
    page_count: int
    char_count: int
    method: Literal["pdf_text", "ocr", "none"]


class AIExplainRequest(BaseModel):
    doc_id: str
    extracted_text: str = Field(max_length=8000)
    doc_type: str
    # Datos anónimos de la persona — nunca nombre/UID/email
    age_range: str | None = None
    biological_sex: str | None = None


class AIExplainResponse(BaseModel):
    doc_id: str
    summary: str
    key_findings: list[str]
    follow_up_suggestions: list[str]
    disclaimer: str
    provider: str


class AISummarizeRequest(BaseModel):
    doc_ids: list[str] = Field(min_length=1, max_length=20)
    # Datos anónimos
    age_range: str | None = None
    biological_sex: str | None = None


class AISummarizeResponse(BaseModel):
    summary: str
    patterns: list[str]
    recommendations: list[str]
    disclaimer: str
    provider: str
