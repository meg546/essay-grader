"""Tests verifying Pydantic schemas produce camelCase JSON matching frontend TypeScript types."""

from app.schemas.grading import CategoryScore, GradingResult, HighlightRange
from app.schemas.history import HistoryItem


class TestHighlightRange:
    def test_camel_case_keys(self):
        h = HighlightRange(
            start=0, end=10, category_id="cat-1", type="strength", feedback="Good"
        )
        data = h.model_dump(by_alias=True)
        assert set(data.keys()) == {"start", "end", "categoryId", "type", "feedback"}

    def test_snake_case_instantiation(self):
        h = HighlightRange(
            start=0, end=10, category_id="cat-1", type="strength", feedback="Good"
        )
        assert h.category_id == "cat-1"


class TestCategoryScore:
    def test_camel_case_keys(self):
        cs = CategoryScore(
            id="cat-1",
            name="Grammar",
            score=8.0,
            max_score=10.0,
            strengths=["Good grammar"],
            improvements=["Watch commas"],
            justification="Solid work",
            highlights=[],
        )
        data = cs.model_dump(by_alias=True)
        assert set(data.keys()) == {
            "id",
            "name",
            "score",
            "maxScore",
            "strengths",
            "improvements",
            "justification",
            "highlights",
        }

    def test_snake_case_instantiation(self):
        cs = CategoryScore(
            id="cat-1",
            name="Grammar",
            score=8.0,
            max_score=10.0,
            strengths=[],
            improvements=[],
            justification="OK",
            highlights=[],
        )
        assert cs.max_score == 10.0


class TestGradingResult:
    def test_camel_case_keys(self):
        gr = GradingResult(
            id="result-1",
            essay_text="Full essay text here.",
            essay_excerpt="Full essay...",
            overall_score=85.0,
            max_score=100.0,
            summary="Great essay",
            categories=[],
            graded_at="2026-01-01T00:00:00Z",
        )
        data = gr.model_dump(by_alias=True)
        assert set(data.keys()) == {
            "id",
            "essayText",
            "essayExcerpt",
            "overallScore",
            "maxScore",
            "summary",
            "categories",
            "gradedAt",
        }

    def test_snake_case_instantiation(self):
        gr = GradingResult(
            id="result-1",
            essay_text="text",
            essay_excerpt="excerpt",
            overall_score=85.0,
            max_score=100.0,
            summary="summary",
            categories=[],
            graded_at="2026-01-01T00:00:00Z",
        )
        assert gr.overall_score == 85.0
        assert gr.essay_text == "text"

    def test_nested_serialization(self):
        highlight = HighlightRange(
            start=0, end=5, category_id="cat-1", type="strength", feedback="Nice"
        )
        category = CategoryScore(
            id="cat-1",
            name="Grammar",
            score=9.0,
            max_score=10.0,
            strengths=["Good"],
            improvements=[],
            justification="Excellent",
            highlights=[highlight],
        )
        gr = GradingResult(
            id="result-1",
            essay_text="text",
            essay_excerpt="excerpt",
            overall_score=90.0,
            max_score=100.0,
            summary="Well done",
            categories=[category],
            graded_at="2026-01-01T00:00:00Z",
        )
        data = gr.model_dump(by_alias=True)
        cat_data = data["categories"][0]
        assert "maxScore" in cat_data
        assert "categoryId" in cat_data["highlights"][0]


class TestHistoryItem:
    def test_camel_case_keys(self):
        hi = HistoryItem(
            id="hist-1",
            essay_excerpt="Some excerpt...",
            overall_score=75.0,
            max_score=100.0,
            category_count=4,
            graded_at="2026-01-01T00:00:00Z",
        )
        data = hi.model_dump(by_alias=True)
        assert set(data.keys()) == {
            "id",
            "essayExcerpt",
            "overallScore",
            "maxScore",
            "categoryCount",
            "gradedAt",
        }

    def test_snake_case_instantiation(self):
        hi = HistoryItem(
            id="hist-1",
            essay_excerpt="excerpt",
            overall_score=75.0,
            max_score=100.0,
            category_count=4,
            graded_at="2026-01-01T00:00:00Z",
        )
        assert hi.category_count == 4
