"""Tests for GradingService orchestration with mocked LLM."""

import json

import pytest

from app.services.grading import GradingService

SAMPLE_ESSAY = (
    "The impact of technology on education has been profound and far-reaching. "
    "Digital tools have transformed how students learn, enabling access to vast "
    "resources and facilitating collaborative learning across geographical boundaries. "
    "However, the digital divide remains a significant challenge, as not all students "
    "have equal access to technology. Schools must invest in infrastructure and training "
    "to ensure equitable outcomes for all learners."
)

VALID_LLM_RESPONSE = json.dumps(
    {
        "summary": "A well-structured essay on technology in education with clear arguments.",
        "categories": [
            {
                "id": "thesis",
                "name": "Thesis & Argument",
                "score": 20,
                "maxScore": 25,
                "strengths": ["Clear thesis statement"],
                "improvements": ["Could be more specific"],
                "justification": "The thesis is clear but could be narrower.",
                "quotes": [
                    {
                        "text": "The impact of technology on education has been profound and far-reaching",
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
                "strengths": ["Mentions specific challenges"],
                "improvements": ["Needs more citations"],
                "justification": "Some evidence but lacks depth.",
                "quotes": [
                    {
                        "text": "the digital divide remains a significant challenge",
                        "type": "improvement",
                        "feedback": "Good point but needs supporting data",
                    }
                ],
            },
            {
                "id": "organization",
                "name": "Organization & Structure",
                "score": 22,
                "maxScore": 25,
                "strengths": ["Logical flow"],
                "improvements": ["Transitions could be smoother"],
                "justification": "Well organized overall.",
                "quotes": [],
            },
            {
                "id": "language",
                "name": "Language & Mechanics",
                "score": 21,
                "maxScore": 25,
                "strengths": ["Varied vocabulary"],
                "improvements": ["Some repetition"],
                "justification": "Good language use with minor issues.",
                "quotes": [
                    {
                        "text": "facilitating collaborative learning across geographical boundaries",
                        "type": "strength",
                        "feedback": "Sophisticated vocabulary",
                    }
                ],
            },
        ],
    }
)


class MockLLMClient:
    """Mock LLM client that returns predetermined responses."""

    def __init__(self, responses: list[str]):
        self._responses = list(responses)
        self._call_count = 0

    async def complete(
        self, system_prompt: str, user_prompt: str, json_schema: dict
    ) -> str:
        idx = min(self._call_count, len(self._responses) - 1)
        self._call_count += 1
        return self._responses[idx]

    @property
    def call_count(self) -> int:
        return self._call_count


@pytest.fixture
def valid_client() -> MockLLMClient:
    return MockLLMClient([VALID_LLM_RESPONSE])


@pytest.fixture
def service(valid_client: MockLLMClient) -> GradingService:
    return GradingService(valid_client)


async def test_grade_returns_valid_grading_result(service: GradingService):
    result = await service.grade(SAMPLE_ESSAY, None, "college")
    assert result.overall_score == 81  # 20+18+22+21
    assert result.max_score == 100  # 25*4
    assert result.summary == "A well-structured essay on technology in education with clear arguments."
    assert len(result.categories) == 4
    assert result.categories[0].name == "Thesis & Argument"


async def test_grade_computes_highlight_offsets(service: GradingService):
    result = await service.grade(SAMPLE_ESSAY, None, "college")
    # Thesis category should have one highlight with valid offsets
    thesis_cat = result.categories[0]
    assert len(thesis_cat.highlights) == 1
    h = thesis_cat.highlights[0]
    assert h.start == 0  # "The impact..." is at the start
    assert h.end > h.start
    # Verify the highlighted text matches
    assert SAMPLE_ESSAY[h.start : h.end] == "The impact of technology on education has been profound and far-reaching"


async def test_grade_retries_on_invalid_json():
    client = MockLLMClient(["not valid json{{{", VALID_LLM_RESPONSE])
    service = GradingService(client)
    result = await service.grade(SAMPLE_ESSAY, None, "college")
    # Should succeed on retry
    assert result.overall_score == 81
    assert client.call_count == 2


async def test_grade_raises_on_persistent_failure():
    client = MockLLMClient(["bad json", "still bad json"])
    service = GradingService(client)
    with pytest.raises(ValueError, match="invalid JSON after retry"):
        await service.grade(SAMPLE_ESSAY, None, "college")
    assert client.call_count == 2


async def test_grade_uses_default_rubric_when_none(service: GradingService):
    result = await service.grade(SAMPLE_ESSAY, None, "high school")
    # Should still produce a valid result
    assert result.overall_score > 0
    assert len(result.categories) == 4


async def test_grade_populates_id_and_metadata(service: GradingService):
    result = await service.grade(SAMPLE_ESSAY, None, "college")
    # id should be a UUID-like string
    assert len(result.id) == 36  # UUID format: 8-4-4-4-12
    assert "-" in result.id
    # essay_text should match input
    assert result.essay_text == SAMPLE_ESSAY
    # essay_excerpt should be first ~100 chars + "..."
    assert result.essay_excerpt == SAMPLE_ESSAY[:100] + "..."
    # graded_at should be an ISO timestamp
    assert "T" in result.graded_at
    assert result.graded_at.endswith("+00:00") or result.graded_at.endswith("Z")
