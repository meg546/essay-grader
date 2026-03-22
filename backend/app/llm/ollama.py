from __future__ import annotations

import httpx

from app.config import Settings


class OllamaClient:
    """LLM client for Ollama using its OpenAI-compatible API."""

    def __init__(self, settings: Settings, *, suggestions: bool = False) -> None:
        if suggestions and settings.suggestions_model_name:
            self.model = settings.suggestions_model_name
        else:
            self.model = settings.model_name

        endpoint = (
            settings.suggestions_model_endpoint
            if suggestions and settings.suggestions_model_endpoint
            else settings.model_endpoint
        )
        self._client = httpx.AsyncClient(
            base_url=f"{endpoint}/v1",
            timeout=httpx.Timeout(120.0, connect=10.0),
        )

    async def complete(
        self, system_prompt: str, user_prompt: str, json_schema: dict | None
    ) -> str:
        """POST to /v1/chat/completions and return the content string."""
        if json_schema is None:
            plain_payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.7,
            }
            try:
                return await self._post(plain_payload)
            except (httpx.ConnectError, httpx.TimeoutException):
                return await self._post(plain_payload)

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {
                "type": "json_object",
                "schema": json_schema,
            },
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
