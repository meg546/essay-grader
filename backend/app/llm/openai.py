from __future__ import annotations

import openai

from app.config import Settings


class OpenAIClient:
    """LLM client using the OpenAI SDK (async)."""

    def __init__(self, settings: Settings) -> None:
        self.model = settings.model_name
        self._client = openai.AsyncOpenAI(api_key=settings.openai_api_key)

    async def complete(
        self, system_prompt: str, user_prompt: str, json_schema: dict
    ) -> str:
        """Use chat completions with JSON response format."""
        kwargs = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "grading_result",
                    "schema": json_schema,
                    "strict": False,
                },
            },
            "temperature": 0.3,
        }
        try:
            return await self._call(kwargs)
        except (openai.APIConnectionError, openai.APITimeoutError):
            # Retry once on connection/timeout errors
            return await self._call(kwargs)

    async def _call(self, kwargs: dict) -> str:
        response = await self._client.chat.completions.create(**kwargs)
        return response.choices[0].message.content
