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


def _normalize_string_list(items: list) -> list[str]:
    """Coerce LLM output to list of strings. Some models return [{quote: "...", ...}] instead of ["..."]."""
    result = []
    for item in items:
        if isinstance(item, str):
            result.append(item)
        elif isinstance(item, dict):
            result.append(item.get("quote", item.get("text", str(item))))
        else:
            result.append(str(item))
    return result


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
        tone: str = "academic",
    ) -> GradingResult:
        """Grade an essay using the LLM.

        Args:
            essay_text: The essay text to grade.
            rubric_text: Optional custom rubric text. Uses default if None.
            grade_level: Student grade level (e.g., "college", "high school").
            tone: Feedback tone (e.g., "academic", "professional").

        Returns:
            A validated GradingResult with computed highlight offsets.

        Raises:
            ValueError: If the LLM returns invalid JSON after one retry.
        """
        system_prompt = build_system_prompt(grade_level, rubric_text, tone)
        user_prompt = build_user_prompt(essay_text)
        schema = build_grading_schema()

        # Call LLM with one retry on JSON parse failure
        parsed = await self._call_llm_with_retry(system_prompt, user_prompt, schema)

        # Normalize LLM response: some models return {catId: {...}} instead of {categories: [...]}
        llm_categories = parsed.get("categories", [])
        if not llm_categories and isinstance(parsed, dict):
            # Check if top-level keys are category objects (flat format)
            candidate = []
            for key, val in parsed.items():
                if key == "summary":
                    continue
                if isinstance(val, dict) and "score" in val:
                    val.setdefault("id", key)
                    val.setdefault("name", key.replace("_", " ").title())
                    val.setdefault("maxScore", 25)
                    # Normalize "areas for improvement" -> "improvements"
                    if "areas for improvement" in val and "improvements" not in val:
                        val["improvements"] = val.pop("areas for improvement")
                    # Normalize quotes field -- check alternative key names
                    if "quotes" not in val:
                        for alt_key in ("highlighted_passages", "evidence_quotes", "evidence"):
                            if alt_key in val and isinstance(val[alt_key], list):
                                val["quotes"] = val.pop(alt_key)
                                break
                        else:
                            val["quotes"] = []  # Ensure key exists even if empty
                    candidate.append(val)
            if candidate:
                llm_categories = candidate

        # Synthesize quotes from strengths/improvements when LLM omits the quotes array
        for cat in llm_categories:
            quotes = cat.get("quotes", [])
            if not quotes:
                synthesized: list[dict] = []
                for s in cat.get("strengths", []):
                    if isinstance(s, str) and len(s) > 10:
                        synthesized.append({"text": s, "type": "strength", "feedback": ""})
                for imp in cat.get("improvements", []):
                    if isinstance(imp, str) and len(imp) > 10:
                        synthesized.append({"text": imp, "type": "improvement", "feedback": ""})
                cat["quotes"] = synthesized

        # Compute highlight offsets from LLM quotes
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
            import logging
            logging.getLogger(__name__).warning("LLM raw response (attempt %d): %s", attempt, raw[:500] if raw else "EMPTY")
            try:
                return json.loads(raw)
            except (json.JSONDecodeError, TypeError) as e:
                logging.getLogger(__name__).warning("JSON parse error (attempt %d): %s", attempt, e)
                if attempt == 1:
                    raise ValueError(f"LLM returned invalid JSON after retry: {raw[:200] if raw else 'EMPTY'}")
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
                    strengths=_normalize_string_list(cat.get("strengths", [])),
                    improvements=_normalize_string_list(cat.get("improvements", [])),
                    justification=cat.get("justification", ""),
                    highlights=highlights,
                )
            )
        return result
