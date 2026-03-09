"""Tests for prompt builders and highlight offset matching."""

import pytest

from app.llm.highlights import compute_highlights, find_passage_offset
from app.llm.prompts import (
    DEFAULT_RUBRIC,
    build_grading_schema,
    build_system_prompt,
    build_user_prompt,
)


# --- find_passage_offset tests ---


def test_exact_match():
    start, end = find_passage_offset("The quick brown fox", "quick brown")
    assert (start, end) == (4, 15)


def test_case_insensitive_match():
    result = find_passage_offset("The Quick Brown Fox", "quick brown")
    assert result is not None
    start, end = result
    # Should find the match at position 4-15 regardless of case
    assert start == 4
    assert end == 15


def test_fuzzy_match():
    result = find_passage_offset("The quick brown fox", "the quik brown fox")
    assert result is not None
    start, end = result
    # Should return approximate offsets covering the fuzzy match
    assert start >= 0
    assert end <= len("The quick brown fox")
    assert end > start


def test_no_match_below_threshold():
    result = find_passage_offset("Hello world", "completely different text")
    assert result is None


# --- compute_highlights tests ---


def test_compute_highlights_maps_quotes_to_offsets():
    essay = "The quick brown fox jumps over the lazy dog."
    categories = [
        {
            "id": "cat-1",
            "name": "Grammar",
            "score": 20,
            "maxScore": 25,
            "strengths": ["Good"],
            "improvements": ["Could improve"],
            "justification": "Decent",
            "quotes": [
                {
                    "text": "quick brown fox",
                    "type": "strength",
                    "feedback": "Great imagery",
                },
            ],
        },
    ]
    result = compute_highlights(essay, categories)
    assert "cat-1" in result
    highlights = result["cat-1"]
    assert len(highlights) == 1
    h = highlights[0]
    assert h["start"] == 4
    assert h["end"] == 19
    assert h["category_id"] == "cat-1"
    assert h["type"] == "strength"
    assert h["feedback"] == "Great imagery"


def test_compute_highlights_drops_unmatched():
    essay = "The quick brown fox jumps over the lazy dog."
    categories = [
        {
            "id": "cat-1",
            "name": "Grammar",
            "score": 20,
            "maxScore": 25,
            "strengths": [],
            "improvements": [],
            "justification": "Ok",
            "quotes": [
                {
                    "text": "completely unrelated passage nowhere in essay",
                    "type": "improvement",
                    "feedback": "Not found",
                },
            ],
        },
    ]
    result = compute_highlights(essay, categories)
    # Unmatched quote should be dropped, not cause an error
    assert result.get("cat-1", []) == []


# --- Prompt builder tests ---


def test_build_system_prompt_includes_grade_level():
    prompt = build_system_prompt("college", None)
    assert "college" in prompt.lower()


def test_build_system_prompt_uses_default_rubric():
    prompt = build_system_prompt("high school", None)
    # Should include default rubric content
    assert "Thesis" in prompt or "thesis" in prompt
    assert "Evidence" in prompt or "evidence" in prompt


def test_build_system_prompt_uses_provided_rubric():
    prompt = build_system_prompt("college", "Custom rubric with special criteria")
    assert "Custom rubric with special criteria" in prompt


def test_build_user_prompt_wraps_essay():
    prompt = build_user_prompt("My essay about dogs.")
    assert "My essay about dogs." in prompt


def test_build_grading_schema_returns_dict():
    schema = build_grading_schema()
    assert isinstance(schema, dict)
    # Should define categories with quotes
    assert "properties" in schema or "type" in schema


def test_default_rubric_has_four_categories():
    rubric = DEFAULT_RUBRIC
    # Should mention all four categories
    assert "Thesis" in rubric
    assert "Evidence" in rubric
    assert "Organization" in rubric
    assert "Language" in rubric or "Mechanics" in rubric
