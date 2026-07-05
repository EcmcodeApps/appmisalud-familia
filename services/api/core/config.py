from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_env: str = "development"
    api_allowed_origins: str = "http://localhost:3000"

    firebase_project_id: str = ""
    firebase_client_email: str = ""
    firebase_private_key: str = ""
    firebase_storage_bucket: str = ""

    ai_default_provider: str = "mock"
    ai_fallback_provider: str = "openai"
    ai_second_opinion_provider: str = "grok"
    ai_enable_second_opinion: bool = False
    ai_max_tokens_per_request: int = 4000
    ai_store_prompts: bool = False
    ai_store_responses: bool = True

    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"

    openai_api_key: str = ""
    openai_model: str = "gpt-4.1-mini"

    xai_api_key: str = ""
    xai_base_url: str = "https://api.x.ai/v1"
    grok_model: str = "grok-3"

    max_upload_mb: int = 20
    rate_limit_per_minute: int = 30

    @property
    def allowed_origins(self) -> list[str]:
        return [o.strip() for o in self.api_allowed_origins.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
