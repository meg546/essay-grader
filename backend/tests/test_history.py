"""Integration tests for history endpoints (list, detail, delete)."""

from __future__ import annotations

import json
import uuid
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from app.main import app

# Duplicated from test_grading.py to avoid import coupling
_MOCK_LLM_RESPONSE = json.dumps(
    {
        "summary": "A well-structured essay with clear argumentation.",
        "categories": [
            {
                "id": "thesis",
                "name": "Thesis & Argument",
                "score": 20,
                "maxScore": 25,
                "strengths": ["Clear thesis statement"],
                "improvements": ["Could be more specific"],
                "justification": "The thesis is clear but could be refined.",
                "quotes": [
                    {
                        "text": "The importance of education cannot be overstated",
                        "type": "strength",
                        "feedback": "Strong opening thesis",
                    }
                ],
            },
            {
                "id": "evidence",
                "name": "Evidence & Support",
                "score": 18,
                "maxScore": 25,
                "strengths": ["Uses relevant examples"],
                "improvements": ["Needs more citations"],
                "justification": "Evidence is present but not well-cited.",
                "quotes": [],
            },
            {
                "id": "organization",
                "name": "Organization & Structure",
                "score": 22,
                "maxScore": 25,
                "strengths": ["Logical flow"],
                "improvements": ["Transitions could be smoother"],
                "justification": "Well-organized overall.",
                "quotes": [],
            },
            {
                "id": "language",
                "name": "Language & Mechanics",
                "score": 19,
                "maxScore": 25,
                "strengths": ["Good vocabulary"],
                "improvements": ["Some grammatical errors"],
                "justification": "Generally well-written with minor errors.",
                "quotes": [],
            },
        ],
    }
)

SAMPLE_ESSAY = (
    "The importance of education cannot be overstated. "
    "Education empowers individuals to develop critical thinking skills, "
    "gain knowledge, and contribute meaningfully to society. "
    "Throughout history, societies that invested in education have prospered. "
    "In conclusion, education remains the cornerstone of progress."
)


def _mock_llm_client():
    mock = AsyncMock()
    mock.complete = AsyncMock(return_value=_MOCK_LLM_RESPONSE)
    return mock


@pytest.fixture
def patch_llm():
    mock_client = _mock_llm_client()
    with patch("app.routes.grading.get_llm_client", return_value=mock_client) as p:
        p.mock_client = mock_client
        yield p


async def _register_and_get_token(
    client: AsyncClient, email: str = "history@test.com"
) -> dict[str, str]:
    resp = await client.post(
        "/api/auth/register",
        json={"email": email, "password": "TestPass123!"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


async def _grade_essay(client: AsyncClient, headers: dict[str, str]) -> dict:
    resp = await client.post(
        "/api/grade",
        data={"essay_text": SAMPLE_ESSAY},
        headers=headers,
    )
    assert resp.status_code == 200
    return resp.json()


# ---------- List endpoint ----------


@pytest.mark.asyncio
async def test_history_empty(client: AsyncClient, patch_llm):
    headers = await _register_and_get_token(client)
    resp = await client.get("/api/history", headers=headers)
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_history_after_grading(client: AsyncClient, patch_llm):
    headers = await _register_and_get_token(client)
    graded = await _grade_essay(client, headers)

    resp = await client.get("/api/history", headers=headers)
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    item = items[0]
    # Verify camelCase HistoryItem shape
    assert item["id"] == graded["id"]
    assert "essayExcerpt" in item
    assert "overallScore" in item
    assert "maxScore" in item
    assert "categoryCount" in item
    assert "gradedAt" in item


@pytest.mark.asyncio
async def test_history_sorted_newest_first(client: AsyncClient, patch_llm):
    headers = await _register_and_get_token(client)
    first = await _grade_essay(client, headers)
    second = await _grade_essay(client, headers)

    resp = await client.get("/api/history", headers=headers)
    items = resp.json()
    assert len(items) == 2
    # Newest first
    assert items[0]["id"] == second["id"]
    assert items[1]["id"] == first["id"]


# ---------- Detail endpoint ----------


@pytest.mark.asyncio
async def test_history_detail(client: AsyncClient, patch_llm):
    headers = await _register_and_get_token(client)
    graded = await _grade_essay(client, headers)

    resp = await client.get(f"/api/history/{graded['id']}", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    # Should return full GradingResult shape (camelCase from JSONB)
    assert "essayText" in body
    assert "categories" in body
    assert "overallScore" in body
    assert "summary" in body
    assert "gradedAt" in body


@pytest.mark.asyncio
async def test_history_detail_not_found(client: AsyncClient, patch_llm):
    headers = await _register_and_get_token(client)
    fake_id = str(uuid.uuid4())
    resp = await client.get(f"/api/history/{fake_id}", headers=headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_history_detail_other_user(client: AsyncClient, patch_llm):
    # User A grades an essay
    headers_a = await _register_and_get_token(client, email="usera@test.com")
    graded = await _grade_essay(client, headers_a)

    # User B tries to access User A's submission
    headers_b = await _register_and_get_token(client, email="userb@test.com")
    resp = await client.get(f"/api/history/{graded['id']}", headers=headers_b)
    assert resp.status_code == 404


# ---------- Delete endpoint ----------


@pytest.mark.asyncio
async def test_delete_submission(client: AsyncClient, patch_llm):
    headers = await _register_and_get_token(client)
    graded = await _grade_essay(client, headers)

    resp = await client.delete(f"/api/history/{graded['id']}", headers=headers)
    assert resp.status_code == 204

    # Verify it's gone
    resp = await client.get("/api/history", headers=headers)
    assert resp.json() == []


@pytest.mark.asyncio
async def test_delete_not_found(client: AsyncClient, patch_llm):
    headers = await _register_and_get_token(client)
    fake_id = str(uuid.uuid4())
    resp = await client.delete(f"/api/history/{fake_id}", headers=headers)
    assert resp.status_code == 404


# ---------- Auth required ----------


@pytest.mark.asyncio
async def test_history_requires_auth(client: AsyncClient):
    resp = await client.get("/api/history")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_history_detail_requires_auth(client: AsyncClient):
    fake_id = str(uuid.uuid4())
    resp = await client.get(f"/api/history/{fake_id}")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_delete_requires_auth(client: AsyncClient):
    fake_id = str(uuid.uuid4())
    resp = await client.delete(f"/api/history/{fake_id}")
    assert resp.status_code == 401
