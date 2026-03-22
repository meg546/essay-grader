from __future__ import annotations

from typing import Protocol

from app.config import Settings


class LLMClient(Protocol):
    """Protocol for LLM provider adapters."""

    async def complete(
        self, system_prompt: str, user_prompt: str, json_schema: dict | None
    ) -> str:
        """Send a prompt to the LLM and return raw JSON string or plain text."""
        ...


def get_llm_client(settings: Settings) -> LLMClient:
    """Factory that returns the correct LLM adapter based on settings.model_provider."""
    return _build_client(settings.model_provider, settings)


def get_suggestions_llm_client(settings: Settings) -> LLMClient:
    """Factory for the inline-suggestions LLM.

    Uses SUGGESTIONS_MODEL_PROVIDER / SUGGESTIONS_MODEL_NAME / SUGGESTIONS_MODEL_ENDPOINT
    env vars when set, otherwise falls back to the main LLM config.
    """
    provider = settings.suggestions_model_provider or settings.model_provider
    return _build_client(provider, settings, suggestions=True)


def _build_client(
    provider: str, settings: Settings, *, suggestions: bool = False
) -> LLMClient:
    match provider:
        case "ollama":
            from .ollama import OllamaClient

            return OllamaClient(settings, suggestions=suggestions)
        case "anthropic":
            from .anthropic import AnthropicClient

            return AnthropicClient(settings)
        case "openai":
            from .openai import OpenAIClient

            return OpenAIClient(settings)
        case _:
            raise ValueError(
                f"Unknown model provider: {provider!r}. "
                "Must be one of: ollama, anthropic, openai"
            )
