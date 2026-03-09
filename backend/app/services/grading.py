"""GradingService orchestrating prompt -> LLM -> validate -> highlights."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from app.llm.highlights import compute_highlights
from app.llm.prompts import build_grading_schema, build_system_prompt, build_user_prompt
from app.schemas.grading import CategoryScore, GradingResult, HighlightRange

if TYPE_CHECKING:
    from app.llm.client import LLMClient


class GradingService:
    """Orchestrates the full essay grading pipeline.

    Flow: build prompts -> call LLM -> parse JSON -> compute highlights -> return GradingResult.
    """

    def __init__(self, llm_client: LLMClient) -> None:
        self._llm = llm_client

    async def grade(
        self,
        essay_text: str,
        rubric_text: str | None,
        grade_level: str,
    ) -> GradingResult:
        """Grade an essay using the LLM.

        Args:
            essay_text: The essay text to grade.
            rubric_text: Optional custom rubric text. Uses default if None.
            grade_level: Student grade level (e.g., "college", "high school").

        Returns:
            A validated GradingResult with computed highlight offsets.

        Raises:
            ValueError: If the LLM returns invalid JSON after one retry.
        """
        system_prompt = build_system_prompt(grade_level, rubric_text)
        user_prompt = build_user_prompt(essay_text)
        schema = build_grading_schema()

        # Call LLM with one retry on JSON parse failure
        parsed = await self._call_llm_with_retry(system_prompt, user_prompt, schema)

        # Compute highlight offsets from LLM quotes
        llm_categories = parsed.get("categories", [])
        highlights_by_category = compute_highlights(essay_text, llm_categories)

        # Build the final GradingResult
        categories = self._build_categories(llm_categories, highlights_by_category)
        overall_score = sum(c.score for c in categories)
        max_score = sum(c.max_score for c in categories)

        excerpt = essay_text[:100] + "..." if len(essay_text) > 100 else essay_text

        return GradingResult(
            id=str(uuid.uuid4()),
            essay_text=essay_text,
            essay_excerpt=excerpt,
            overall_score=overall_score,
            max_score=max_score,
            summary=parsed.get("summary", ""),
            categories=categories,
            graded_at=datetime.now(timezone.utc).isoformat(),
        )

    async def _call_llm_with_retry(
        self,
        system_prompt: str,
        user_prompt: str,
        schema: dict,
    ) -> dict:
        """Call the LLM and parse JSON, retrying once on failure."""
        for attempt in range(2):
            raw = await self._llm.complete(system_prompt, user_prompt, schema)
            try:
                return json.loads(raw)
            except (json.JSONDecodeError, TypeError):
                if attempt == 1:
                    raise ValueError("LLM returned invalid JSON after retry")
        # Unreachable, but satisfies type checker
        raise ValueError("LLM returned invalid JSON after retry")  # pragma: no cover

    def _build_categories(
        self,
        llm_categories: list[dict],
        highlights_by_category: dict[str, list[dict]],
    ) -> list[CategoryScore]:
        """Convert LLM output categories to CategoryScore models with highlights."""
        result = []
        for cat in llm_categories:
            cat_id = cat.get("id", "")
            highlight_dicts = highlights_by_category.get(cat_id, [])
            highlights = [
                HighlightRange(
                    start=h["start"],
                    end=h["end"],
                    category_id=h["category_id"],
                    type=h["type"],
                    feedback=h["feedback"],
                )
                for h in highlight_dicts
            ]
            result.append(
                CategoryScore(
                    id=cat_id,
                    name=cat.get("name", ""),
                    score=cat.get("score", 0),
                    max_score=cat.get("maxScore", 0),
                    strengths=cat.get("strengths", []),
                    improvements=cat.get("improvements", []),
                    justification=cat.get("justification", ""),
                    highlights=highlights,
                )
            )
        return result
