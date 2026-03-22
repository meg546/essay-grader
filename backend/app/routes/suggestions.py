"""POST /api/suggestions endpoint — LLM-powered grammar suggestion generation."""

from __future__ import annotations

import json

import httpx
from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import get_current_user
from app.config import get_settings
from app.llm.client import get_suggestions_llm_client
from app.models.user import User
from app.schemas.suggestions import SuggestionRequest, SuggestionResponse

router = APIRouter(tags=["suggestions"])

_SYSTEM_PROMPT = """You are a grammar assistant. Given a flagged text issue in an essay, explain the problem briefly and suggest 1-3 specific corrections.

Rules:
- Explanation must be 1 sentence, max 20 words
- Suggestions must be exact replacement text (the corrected version of the flagged text only)
- Return 1-3 suggestions, ordered best-first
- Do not include the surrounding sentence in suggestions"""

_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "message": {"type": "string"},
        "suggestions": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["message", "suggestions"],
}


@router.post("/suggestions", response_model=SuggestionResponse)
async def get_suggestions(
    body: SuggestionRequest,
    user: User = Depends(get_current_user),
) -> SuggestionResponse:
    """Return LLM-generated explanation and fix suggestions for a flagged grammar/spelling issue."""
    settings = get_settings()
    llm = get_suggestions_llm_client(settings)

    user_prompt = (
        f'Flagged text: "{body.flagged_text}"\n'
        f'Context: "{body.sentence_context}"\n'
        f"Category: {body.category}"
    )

    try:
        raw = await llm.complete(
            system_prompt=_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            json_schema=_JSON_SCHEMA,
        )
        parsed = json.loads(raw)
        return SuggestionResponse(**parsed)
    except (httpx.ConnectError, httpx.TimeoutException) as exc:
        raise HTTPException(
            status_code=503,
            detail="Model server unavailable",
        ) from exc
    except (ValueError, KeyError, TypeError):
        return SuggestionResponse(
            message="Unable to generate suggestions",
            suggestions=[],
        )
