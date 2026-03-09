from __future__ import annotations

import json

import anthropic

from app.config import Settings


class AnthropicClient:
    """LLM client using the Anthropic SDK (async)."""

    def __init__(self, settings: Settings) -> None:
        self.model = settings.model_name
        self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def complete(
        self, system_prompt: str, user_prompt: str, json_schema: dict
    ) -> str:
        """Use tool_use pattern to get structured JSON from Claude."""
        kwargs = {
            "model": self.model,
            "max_tokens": 4096,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_prompt}],
            "tools": [
                {
                    "name": "submit_grading_result",
                    "description": "Submit the grading result",
                    "input_schema": json_schema,
                }
            ],
            "tool_choice": {
                "type": "tool",
                "name": "submit_grading_result",
            },
        }
        try:
            return await self._call(kwargs)
        except (anthropic.APIConnectionError, anthropic.APITimeoutError):
            # Retry once on connection/timeout errors
            return await self._call(kwargs)

    async def _call(self, kwargs: dict) -> str:
        response = await self._client.messages.create(**kwargs)
        # Extract tool_use block input
        for block in response.content:
            if block.type == "tool_use":
                return json.dumps(block.input)
        raise ValueError("No tool_use block found in Anthropic response")
