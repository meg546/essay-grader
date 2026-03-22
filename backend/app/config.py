from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent.parent.parent / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/essaygrader"
    cors_origins: list[str] = ["http://localhost:5173"]
    debug: bool = False

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 24

    # LLM inference settings
    model_provider: Literal["ollama", "anthropic", "openai"] = "ollama"
    model_name: str = "llama3.2:3b"
    model_endpoint: str = "http://localhost:11434"
    anthropic_api_key: str = ""
    openai_api_key: str = ""

    # Separate LLM settings for inline suggestions (falls back to main settings)
    suggestions_model_provider: Literal["ollama", "anthropic", "openai"] | None = None
    suggestions_model_name: str | None = None
    suggestions_model_endpoint: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()
