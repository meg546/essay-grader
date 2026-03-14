"""Integration tests for POST /api/suggestions endpoint."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, patch

import httpx
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


_MOCK_SUGGESTION_RESPONSE = json.dumps(
    {
        "message": "The word 'recieve' is misspelled; the correct spelling follows the i-before-e rule.",
        "suggestions": ["receive"],
    }
)

SAMPLE_REQUEST = {
    "flaggedText": "recieve",
    "sentenceContext": "I recieve the package yesterday.",
    "category": "spelling",
}


async def _register_and_get_token(client: AsyncClient) -> dict[str, str]:
    """Register a user and return auth headers."""
    resp = await client.post(
        "/api/auth/register",
        json={
            "email": "suggestions@test.com",
            "password": "TestPass123!",
        },
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_suggestions_returns_message_and_suggestions(client: AsyncClient):
    """POST /api/suggestions with valid auth + body returns 200 with message and suggestions."""
    headers = await _register_and_get_token(client)
    mock_llm = AsyncMock()
    mock_llm.complete = AsyncMock(return_value=_MOCK_SUGGESTION_RESPONSE)

    with patch("app.routes.suggestions.get_llm_client", return_value=mock_llm):
        resp = await client.post(
            "/api/suggestions",
            json=SAMPLE_REQUEST,
            headers=headers,
        )

    assert resp.status_code == 200
    body = resp.json()
    assert "message" in body
    assert "suggestions" in body
    assert isinstance(body["message"], str)
    assert isinstance(body["suggestions"], list)
    assert len(body["suggestions"]) >= 1


@pytest.mark.asyncio
async def test_suggestions_requires_auth(client: AsyncClient):
    """POST /api/suggestions without auth token returns 401."""
    resp = await client.post(
        "/api/suggestions",
        json=SAMPLE_REQUEST,
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_suggestions_handles_malformed_llm_json(client: AsyncClient):
    """POST /api/suggestions handles malformed LLM JSON by returning safe fallback (not 500)."""
    headers = await _register_and_get_token(client)
    mock_llm = AsyncMock()
    mock_llm.complete = AsyncMock(return_value="this is not valid json at all {{{{")

    with patch("app.routes.suggestions.get_llm_client", return_value=mock_llm):
        resp = await client.post(
            "/api/suggestions",
            json=SAMPLE_REQUEST,
            headers=headers,
        )

    assert resp.status_code == 200
    body = resp.json()
    assert body["message"] == "Unable to generate suggestions"
    assert body["suggestions"] == []


@pytest.mark.asyncio
async def test_suggestions_handles_ollama_connect_error(client: AsyncClient):
    """POST /api/suggestions handles Ollama ConnectError by returning 503."""
    headers = await _register_and_get_token(client)
    mock_llm = AsyncMock()
    mock_llm.complete = AsyncMock(side_effect=httpx.ConnectError("Connection refused"))

    with patch("app.routes.suggestions.get_llm_client", return_value=mock_llm):
        resp = await client.post(
            "/api/suggestions",
            json=SAMPLE_REQUEST,
            headers=headers,
        )

    assert resp.status_code == 503
    assert "unavailable" in resp.json()["detail"].lower()
