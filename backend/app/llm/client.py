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
    match settings.model_provider:
        case "ollama":
            from .ollama import OllamaClient

            return OllamaClient(settings)
        case "anthropic":
            from .anthropic import AnthropicClient

            return AnthropicClient(settings)
        case "openai":
            from .openai import OpenAIClient

            return OpenAIClient(settings)
        case _:
            raise ValueError(
                f"Unknown model provider: {settings.model_provider!r}. "
                "Must be one of: ollama, anthropic, openai"
            )
