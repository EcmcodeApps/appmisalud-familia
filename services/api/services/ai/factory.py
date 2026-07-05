from functools import lru_cache
from .base_provider import AIProvider
from .mock_provider import MockProvider
from core.config import get_settings


@lru_cache()
def get_provider(name: str | None = None) -> AIProvider:
    s = get_settings()
    provider_name = name or s.ai_default_provider

    if provider_name == "deepseek" and s.deepseek_api_key:
        from .deepseek_provider import DeepSeekProvider
        return DeepSeekProvider()

    if provider_name == "openai" and s.openai_api_key:
        from .openai_provider import OpenAIProvider
        return OpenAIProvider()

    if provider_name == "grok" and s.xai_api_key:
        from .grok_provider import GrokProvider
        return GrokProvider()

    # Fallback silencioso a mock si no hay key configurada
    return MockProvider()


def get_default_provider() -> AIProvider:
    return get_provider()


def get_fallback_provider() -> AIProvider:
    return get_provider(get_settings().ai_fallback_provider)
