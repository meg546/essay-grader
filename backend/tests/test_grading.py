"""Integration tests for POST /api/grade endpoint."""

from __future__ import annotations

import io
import json
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

# Known valid LLM response JSON that GradingService will parse
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


async def _register_and_get_token(client: AsyncClient) -> dict[str, str]:
    """Register a user and return auth headers."""
    resp = await client.post(
        "/api/auth/register",
        json={
            "email": "grader@test.com",
            "password": "TestPass123!",
        },
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _mock_llm_client():
    """Create a mock LLM client that returns known grading JSON."""
    mock = AsyncMock()
    mock.complete = AsyncMock(return_value=_MOCK_LLM_RESPONSE)
    return mock


@pytest.fixture
def patch_llm():
    """Patch get_llm_client to return a mock LLM client."""
    mock_client = _mock_llm_client()
    with patch("app.routes.grading.get_llm_client", return_value=mock_client) as p:
        p.mock_client = mock_client
        yield p


@pytest.mark.asyncio
async def test_grade_essay_returns_full_result(client: AsyncClient, patch_llm):
    """POST /api/grade with essay_text and valid auth returns 200 with GradingResult JSON."""
    headers = await _register_and_get_token(client)
    resp = await client.post(
        "/api/grade",
        data={"essay_text": SAMPLE_ESSAY},
        headers=headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    # Verify GradingResult shape (camelCase keys)
    assert "id" in body
    assert "essayText" in body
    assert "essayExcerpt" in body
    assert "overallScore" in body
    assert "maxScore" in body
    assert "summary" in body
    assert "categories" in body
    assert "gradedAt" in body
    assert len(body["categories"]) == 4
    # Check a category shape
    cat = body["categories"][0]
    assert "id" in cat
    assert "name" in cat
    assert "score" in cat
    assert "maxScore" in cat
    assert "strengths" in cat
    assert "improvements" in cat
    assert "justification" in cat
    assert "highlights" in cat


@pytest.mark.asyncio
async def test_grade_requires_auth(client: AsyncClient, patch_llm):
    """POST /api/grade without token returns 401."""
    resp = await client.post(
        "/api/grade",
        data={"essay_text": SAMPLE_ESSAY},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_grade_requires_essay(client: AsyncClient, patch_llm):
    """POST /api/grade without essay_text or essay_file returns 422."""
    headers = await _register_and_get_token(client)
    resp = await client.post(
        "/api/grade",
        data={"grade_level": "college"},
        headers=headers,
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_grade_with_rubric_text(client: AsyncClient, patch_llm):
    """POST /api/grade with rubric_text produces result using that rubric."""
    headers = await _register_and_get_token(client)
    resp = await client.post(
        "/api/grade",
        data={
            "essay_text": SAMPLE_ESSAY,
            "rubric_text": "Grade on creativity and originality only.",
        },
        headers=headers,
    )
    assert resp.status_code == 200
    # Verify the LLM was called (the mock was invoked)
    patch_llm.mock_client.complete.assert_called()


@pytest.mark.asyncio
async def test_grade_with_pdf_upload(client: AsyncClient, patch_llm):
    """POST /api/grade with essay_file (PDF) extracts text and grades."""
    headers = await _register_and_get_token(client)

    # Build a valid PDF with enough text
    essay_for_pdf = SAMPLE_ESSAY
    pdf_content = (
        b"%PDF-1.4\n"
        b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
        b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]"
        b"/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n"
    )
    text_stream = f"BT /F1 12 Tf 100 700 Td ({essay_for_pdf}) Tj ET".encode()
    stream_obj = f"4 0 obj<</Length {len(text_stream)}>>stream\n".encode() + text_stream + b"\nendstream endobj\n"
    font_obj = b"5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"

    full_pdf = pdf_content + stream_obj + font_obj
    full_pdf += b"xref\n0 6\n"
    full_pdf += b"0000000000 65535 f \n" * 6
    full_pdf += b"trailer<</Size 6/Root 1 0 R>>\nstartxref\n0\n%%EOF"

    resp = await client.post(
        "/api/grade",
        files={"essay_file": ("essay.pdf", io.BytesIO(full_pdf), "application/pdf")},
        headers=headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "overallScore" in body


@pytest.mark.asyncio
async def test_grade_level_affects_prompt(client: AsyncClient, patch_llm):
    """POST /api/grade with different grade_level values changes the system prompt."""
    headers = await _register_and_get_token(client)

    # First call with "elementary"
    await client.post(
        "/api/grade",
        data={"essay_text": SAMPLE_ESSAY, "grade_level": "elementary"},
        headers=headers,
    )
    call_args_1 = patch_llm.mock_client.complete.call_args_list[-1]
    system_prompt_1 = call_args_1[0][0] if call_args_1[0] else call_args_1[1].get("system_prompt", "")

    # Second call with "graduate"
    await client.post(
        "/api/grade",
        data={"essay_text": SAMPLE_ESSAY, "grade_level": "graduate"},
        headers=headers,
    )
    call_args_2 = patch_llm.mock_client.complete.call_args_list[-1]
    system_prompt_2 = call_args_2[0][0] if call_args_2[0] else call_args_2[1].get("system_prompt", "")

    assert system_prompt_1 != system_prompt_2
    assert "elementary" in system_prompt_1.lower()
    assert "graduate" in system_prompt_2.lower()


@pytest.mark.asyncio
async def test_grade_default_grade_level(client: AsyncClient, patch_llm):
    """POST /api/grade without grade_level defaults to 'college'."""
    headers = await _register_and_get_token(client)
    await client.post(
        "/api/grade",
        data={"essay_text": SAMPLE_ESSAY},
        headers=headers,
    )
    call_args = patch_llm.mock_client.complete.call_args_list[-1]
    system_prompt = call_args[0][0] if call_args[0] else call_args[1].get("system_prompt", "")
    assert "college" in system_prompt.lower()


@pytest.mark.asyncio
async def test_grade_saves_submission(client: AsyncClient, patch_llm):
    """POST /api/grade auto-saves result to submissions table."""
    headers = await _register_and_get_token(client)
    resp = await client.post(
        "/api/grade",
        data={"essay_text": SAMPLE_ESSAY},
        headers=headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    # ID should be a valid UUID (from saved submission)
    import uuid as _uuid

    _uuid.UUID(body["id"])  # raises if invalid

    # Verify submission exists in DB
    from app.models.submission import Submission
    from sqlalchemy import select
    from tests.conftest import test_session_factory

    async with test_session_factory() as session:
        result = await session.execute(select(Submission))
        submissions = result.scalars().all()
        assert len(submissions) == 1
        assert str(submissions[0].id) == body["id"]
        assert submissions[0].overall_score == body["overallScore"]
