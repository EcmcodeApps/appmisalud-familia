import json
from .base_provider import AIProvider


class MockProvider(AIProvider):
    """Proveedor mock para desarrollo local sin consumir APIs de IA."""

    async def generate_text(self, prompt: str) -> str:
        return (
            "[MOCK] Esta es una respuesta simulada para desarrollo. "
            "Esta explicación es solo orientativa y no reemplaza la valoración de un médico."
        )

    async def generate_structured_json(self, prompt: str, schema: dict) -> dict:
        return {"mock": True, "message": "Respuesta estructurada simulada"}

    async def classify_safety(self, prompt: str) -> dict:
        return {"safe": True, "flags": [], "provider": "mock"}
