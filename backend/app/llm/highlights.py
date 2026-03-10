"""Quote-to-offset matching for essay highlight generation.

Uses a two-pass approach: exact match first, then fuzzy fallback.
Highlights below the confidence threshold are dropped gracefully.
"""

import logging
from difflib import SequenceMatcher

logger = logging.getLogger(__name__)


def find_passage_offset(
    essay_text: str, quoted_text: str, threshold: float = 0.6
) -> tuple[int, int] | None:
    """Find the character offset of a quoted passage in the essay.

    Pass 1: Case-insensitive exact substring match.
    Pass 2: Fuzzy sliding window using difflib.SequenceMatcher.

    Args:
        essay_text: The full essay text to search in.
        quoted_text: The quoted passage to find.
        threshold: Minimum similarity ratio for fuzzy matching (0.0-1.0).

    Returns:
        Tuple of (start, end) character offsets, or None if no match found.
    """
    if not essay_text or not quoted_text:
        return None

    # Pass 1: Case-insensitive exact match
    lower_essay = essay_text.lower()
    lower_quote = quoted_text.lower()
    idx = lower_essay.find(lower_quote)
    if idx != -1:
        return (idx, idx + len(quoted_text))

    # Pass 2: Fuzzy sliding window
    quote_len = len(quoted_text)
    if quote_len > len(essay_text):
        return None

    step = max(1, quote_len // 4)
    best_ratio = 0.0
    best_start = 0

    for start in range(0, len(essay_text) - quote_len + 1, step):
        window = essay_text[start : start + quote_len]
        ratio = SequenceMatcher(None, window.lower(), lower_quote).ratio()
        if ratio > best_ratio:
            best_ratio = ratio
            best_start = start

    if best_ratio >= threshold:
        return (best_start, best_start + quote_len)

    return None


def compute_highlights(
    essay_text: str, categories_with_quotes: list[dict]
) -> dict[str, list[dict]]:
    """Convert LLM quote arrays to highlight ranges with character offsets.

    Takes the LLM output categories (which have "quotes" arrays with text
    passages) and computes HighlightRange-compatible dicts with start/end
    offsets into the original essay text.

    Quotes that don't match above the threshold are silently dropped.

    Args:
        essay_text: The original essay text.
        categories_with_quotes: List of category dicts from LLM output,
            each containing a "quotes" array with "text", "type", and
            "feedback" fields.

    Returns:
        Dict mapping category_id to list of highlight dicts with
        start, end, category_id, type, and feedback fields.
    """
    result: dict[str, list[dict]] = {}

    for category in categories_with_quotes:
        category_id = category.get("id", "")
        quotes = category.get("quotes", [])
        if not quotes:
            logger.warning(
                "Category '%s' has no quotes -- highlights will be empty for this category",
                category_id,
            )
        highlights: list[dict] = []

        for quote in quotes:
            text = quote.get("text", "")
            if not text:
                continue

            offsets = find_passage_offset(essay_text, text)
            if offsets is None:
                # Drop unmatched quotes gracefully
                continue

            start, end = offsets
            highlights.append(
                {
                    "start": start,
                    "end": end,
                    "category_id": category_id,
                    "type": quote.get("type", "strength"),
                    "feedback": quote.get("feedback", ""),
                }
            )

        if highlights:
            result[category_id] = highlights

    return result
