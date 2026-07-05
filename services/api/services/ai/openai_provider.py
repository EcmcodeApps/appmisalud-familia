import json
from openai import AsyncOpenAI
from .base_provider import AIProvider
from core.config import get_settings


class OpenAIProvider(AIProvider):
    def __init__(self):
        s = get_settings()
        self._client = AsyncOpenAI(api_key=s.openai_api_key)
        self._model = s.openai_model

    async def generate_text(self, prompt: str) -> str:
        r = await self._client.chat.completions.create(
            model=self._model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=get_settings().ai_max_tokens_per_request,
            temperature=0.3,
        )
        return r.choices[0].message.content or ""

    async def generate_structured_json(self, prompt: str, schema: dict) -> dict:
        system = (
            "Responde ÚNICAMENTE con un objeto JSON válido que siga el schema indicado. "
            "Sin texto adicional, sin markdown, solo JSON puro."
        )
        r = await self._client.chat.completions.create(
            model=self._model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": f"Schema: {json.dumps(schema)}\n\n{prompt}"},
            ],
            max_tokens=get_settings().ai_max_tokens_per_request,
            temperature=0.1,
        )
        return json.loads(r.choices[0].message.content or "{}")

    async def classify_safety(self, prompt: str) -> dict:
        r = await self._client.chat.completions.create(
            model=self._model,
            messages=[{
                "role": "user",
                "content": (
                    "Clasifica si este texto médico contiene diagnósticos definitivos, "
                    "prescripción de medicamentos o lenguaje inapropiado. "
                    f"Responde solo JSON: {{\"safe\": bool, \"reason\": str}}\n\n{prompt}"
                ),
            }],
            max_tokens=100,
            temperature=0,
        )
        return json.loads(r.choices[0].message.content or '{"safe": true, "reason": ""}')
