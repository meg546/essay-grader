from __future__ import annotations

import httpx

from app.config import Settings


class OllamaClient:
    """LLM client for Ollama using its OpenAI-compatible API."""

    def __init__(self, settings: Settings) -> None:
        self.model = settings.model_name
        self._client = httpx.AsyncClient(
            base_url=f"{settings.model_endpoint}/v1",
            timeout=httpx.Timeout(120.0, connect=10.0),
        )

    async def complete(
        self, system_prompt: str, user_prompt: str, json_schema: dict
    ) -> str:
        """POST to /v1/chat/completions and return the content string."""
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.3,
        }
        try:
            return await self._post(payload)
        except (httpx.ConnectError, httpx.TimeoutException):
            # Retry once on connection/timeout errors
            return await self._post(payload)

    async def _post(self, payload: dict) -> str:
        response = await self._client.post("/chat/completions", json=payload)
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
