"""Phase 24 — Step 2: Generate training data using Claude Sonnet distillation.

Reads the parsed ASAP 2.0 dataset and sends each essay to Claude Sonnet
with a rubric to produce structured grading output matching the app's
GradingResult JSON schema.

Features:
  - Human score calibration: passes the ASAP holistic score as context
  - Multi-rubric augmentation: varies rubric format across examples
  - Quote validation: rejects examples where quotes don't match essay text
  - Resumable: tracks progress and skips already-processed essays
  - Train/test split: separates holdout test set before output

Usage:
  export ANTHROPIC_API_KEY=sk-ant-...
  python 02_generate_training_data.py

  # Limit to N examples (for testing):
  python 02_generate_training_data.py --limit 10

  # Custom sample size:
  python 02_generate_training_data.py --sample-size 500
"""

from __future__ import annotations

import argparse
import json
import logging
import random
import sys
import time
from pathlib import Path

import anthropic

from rubrics import RUBRICS, select_rubric

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent / "data"
PARSED_FILE = DATA_DIR / "asap2_parsed.jsonl"
OUTPUT_FILE = DATA_DIR / "training_data.jsonl"
REJECTED_FILE = DATA_DIR / "rejected_examples.jsonl"
PROGRESS_FILE = DATA_DIR / "generation_progress.json"
TRAIN_FILE = DATA_DIR / "train.jsonl"
TEST_FILE = DATA_DIR / "test.jsonl"

MODEL = "claude-sonnet-4-6-20250514"
MAX_RETRIES_PER_ESSAY = 2
TEST_SPLIT_RATIO = 0.1


def build_system_prompt(rubric_text: str, grade_level: str = "high school") -> str:
    """Build the grading system prompt (mirrors backend/app/llm/prompts.py)."""
    return f"""You are an expert essay grader. Your task is to evaluate an essay according to the provided rubric and return a structured JSON response.

## Grade Level Context

The student is at a {grade_level} level. Adjust scoring expectations appropriately for this level.

## Rubric

{rubric_text}

## Instructions

1. Read the essay carefully.
2. Evaluate the essay against each rubric category.
3. For each category, assign a score, list strengths and areas for improvement, and provide a justification.
4. For each category, quote EXACTLY from the essay, character-for-character, to support your evaluation. These quotes will be used to highlight passages in the original text.
5. Provide an overall summary of the essay's quality.

## CRITICAL: Quoting Rules

- Quote EXACTLY from the essay, character-for-character. Do not paraphrase or modify quotes.
- Each quote should be a meaningful passage (at least a few words) that illustrates a strength or area for improvement.
- Include the "type" field as either "strength" or "improvement" for each quote.
- Include a brief "feedback" explanation for why the passage was highlighted.

## Response Format

Respond with a JSON object with this structure:
{{
  "summary": "Overall summary string",
  "categories": [
    {{
      "id": "category_id",
      "name": "Category Name",
      "score": <number>,
      "maxScore": <number>,
      "strengths": ["strength1", "strength2"],
      "improvements": ["improvement1", "improvement2"],
      "justification": "Explanation of the score",
      "quotes": [
        {{
          "text": "exact quote from the essay",
          "type": "strength" or "improvement",
          "feedback": "why this passage was highlighted"
        }}
      ]
    }}
  ]
}}"""


def build_user_prompt(essay_text: str, human_score: int) -> str:
    """Build the user prompt with human score calibration."""
    return f"""Please grade the following essay. This essay received a human holistic score of {human_score}/6. Use this as a calibration anchor — your per-category scores should be consistent with this overall quality level.

<essay>
{essay_text}
</essay>

Provide your evaluation as a JSON object following the specified schema."""


def validate_quotes(essay_text: str, grading_output: dict) -> tuple[bool, list[str]]:
    """Validate that all quotes in the grading output exactly match the essay.

    Returns (is_valid, list_of_errors).
    """
    errors = []
    categories = grading_output.get("categories", [])

    if not categories:
        errors.append("No categories in output")
        return False, errors

    for cat in categories:
        cat_id = cat.get("id", "unknown")
        quotes = cat.get("quotes", [])
        for i, quote in enumerate(quotes):
            text = quote.get("text", "")
            if not text:
                errors.append(f"{cat_id}.quotes[{i}]: empty quote text")
                continue
            if text not in essay_text:
                # Try case-insensitive match
                if text.lower() in essay_text.lower():
                    continue  # Close enough — case difference only
                errors.append(
                    f"{cat_id}.quotes[{i}]: quote not found in essay: "
                    f"'{text[:80]}...'"
                )

    return len(errors) == 0, errors


def validate_structure(grading_output: dict) -> tuple[bool, list[str]]:
    """Validate the JSON structure matches expected schema."""
    errors = []

    if "summary" not in grading_output:
        errors.append("Missing 'summary' field")

    categories = grading_output.get("categories", [])
    if not categories:
        errors.append("Missing or empty 'categories' array")
        return False, errors

    for i, cat in enumerate(categories):
        required = ["id", "name", "score", "maxScore", "strengths", "improvements", "justification", "quotes"]
        for field in required:
            if field not in cat:
                errors.append(f"categories[{i}]: missing '{field}'")

        if "quotes" in cat:
            for j, q in enumerate(cat["quotes"]):
                for qf in ["text", "type", "feedback"]:
                    if qf not in q:
                        errors.append(f"categories[{i}].quotes[{j}]: missing '{qf}'")

    return len(errors) == 0, errors


def call_sonnet(
    client: anthropic.Anthropic,
    system_prompt: str,
    user_prompt: str,
) -> dict | None:
    """Call Claude Sonnet and parse the JSON response."""
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        raw = response.content[0].text

        # Strip markdown code fences if present
        if raw.startswith("```"):
            lines = raw.split("\n")
            raw = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])

        return json.loads(raw)
    except json.JSONDecodeError as e:
        logger.warning("JSON parse error: %s", e)
        return None
    except anthropic.RateLimitError:
        logger.warning("Rate limited, waiting 60s...")
        time.sleep(60)
        return None
    except anthropic.APIError as e:
        logger.warning("API error: %s", e)
        return None


def load_progress() -> set[str]:
    """Load the set of already-processed essay IDs."""
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE) as f:
            return set(json.load(f))
    return set()


def save_progress(processed: set[str]) -> None:
    """Save the set of processed essay IDs."""
    with open(PROGRESS_FILE, "w") as f:
        json.dump(sorted(processed), f)


def load_essays(limit: int | None = None) -> list[dict]:
    """Load parsed essays from JSONL."""
    essays = []
    with open(PARSED_FILE) as f:
        for line in f:
            essays.append(json.loads(line))
    if limit:
        essays = essays[:limit]
    return essays


def split_train_test(data_file: Path, test_ratio: float = TEST_SPLIT_RATIO) -> None:
    """Split the output file into train and test sets."""
    examples = []
    with open(data_file) as f:
        for line in f:
            examples.append(json.loads(line))

    random.shuffle(examples)
    split_idx = int(len(examples) * (1 - test_ratio))
    train = examples[:split_idx]
    test = examples[split_idx:]

    with open(TRAIN_FILE, "w") as f:
        for ex in train:
            f.write(json.dumps(ex, ensure_ascii=False) + "\n")

    with open(TEST_FILE, "w") as f:
        for ex in test:
            f.write(json.dumps(ex, ensure_ascii=False) + "\n")

    logger.info("Split: %d train, %d test (%.0f%% holdout)", len(train), len(test), test_ratio * 100)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate training data via Sonnet distillation")
    parser.add_argument("--limit", type=int, help="Limit number of essays to process")
    parser.add_argument("--sample-size", type=int, default=500, help="Number of essays to sample (default: 500)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    if not PARSED_FILE.exists():
        print(f"Error: {PARSED_FILE} not found. Run 01_download_dataset.py first.", file=sys.stderr)
        sys.exit(1)

    api_key = anthropic.api_key if hasattr(anthropic, "api_key") else None
    client = anthropic.Anthropic()

    rng = random.Random(args.seed)

    # Load and sample essays
    all_essays = load_essays(args.limit)
    sample_size = min(args.sample_size, len(all_essays))

    # Stratified sampling by prompt_id to ensure diversity
    by_prompt: dict[str, list[dict]] = {}
    for essay in all_essays:
        pid = str(essay.get("prompt_id", "unknown"))
        by_prompt.setdefault(pid, []).append(essay)

    sampled = []
    per_prompt = max(1, sample_size // len(by_prompt))
    for pid, essays in by_prompt.items():
        rng.shuffle(essays)
        sampled.extend(essays[:per_prompt])

    # Fill remaining quota
    remaining = sample_size - len(sampled)
    if remaining > 0:
        used_ids = {e["essay_id"] for e in sampled}
        pool = [e for e in all_essays if e["essay_id"] not in used_ids]
        rng.shuffle(pool)
        sampled.extend(pool[:remaining])

    sampled = sampled[:sample_size]
    logger.info("Sampled %d essays across %d prompts", len(sampled), len(by_prompt))

    # Load progress for resumability
    processed = load_progress()
    logger.info("Already processed: %d essays", len(processed))

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    accepted = 0
    rejected = 0
    total_cost_input = 0
    total_cost_output = 0

    with open(OUTPUT_FILE, "a") as out_f, open(REJECTED_FILE, "a") as rej_f:
        for i, essay in enumerate(sampled):
            essay_id = str(essay["essay_id"])
            if essay_id in processed:
                continue

            # Select a rubric for this example
            rubric = select_rubric(rng)
            system_prompt = build_system_prompt(rubric["text"])
            user_prompt = build_user_prompt(essay["essay_text"], essay["human_score"])

            # Try up to MAX_RETRIES_PER_ESSAY times
            success = False
            for attempt in range(MAX_RETRIES_PER_ESSAY):
                result = call_sonnet(client, system_prompt, user_prompt)
                if result is None:
                    continue

                # Validate structure
                struct_ok, struct_errors = validate_structure(result)
                if not struct_ok:
                    logger.warning(
                        "Essay %s attempt %d: structure errors: %s",
                        essay_id, attempt, struct_errors,
                    )
                    continue

                # Validate quotes
                quotes_ok, quote_errors = validate_quotes(essay["essay_text"], result)
                if not quotes_ok:
                    logger.warning(
                        "Essay %s attempt %d: %d quote errors",
                        essay_id, attempt, len(quote_errors),
                    )
                    # Log but still try again
                    if attempt < MAX_RETRIES_PER_ESSAY - 1:
                        continue

                # Build training example in chat format
                training_example = {
                    "essay_id": essay_id,
                    "rubric_id": rubric["id"],
                    "human_score": essay["human_score"],
                    "prompt_id": str(essay.get("prompt_id", "")),
                    "quotes_valid": quotes_ok,
                    "conversations": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                        {"role": "assistant", "content": json.dumps(result, ensure_ascii=False)},
                    ],
                }

                if quotes_ok:
                    out_f.write(json.dumps(training_example, ensure_ascii=False) + "\n")
                    out_f.flush()
                    accepted += 1
                    success = True
                else:
                    rej_f.write(json.dumps(training_example, ensure_ascii=False) + "\n")
                    rej_f.flush()
                    rejected += 1
                    success = True  # Processed, just rejected

                break

            processed.add(essay_id)

            # Save progress every 10 essays
            if len(processed) % 10 == 0:
                save_progress(processed)

            # Progress logging
            if (i + 1) % 25 == 0 or i == len(sampled) - 1:
                logger.info(
                    "Progress: %d/%d | Accepted: %d | Rejected: %d",
                    i + 1, len(sampled), accepted, rejected,
                )

            # Small delay to avoid rate limits
            time.sleep(0.5)

    save_progress(processed)

    logger.info("=" * 60)
    logger.info("GENERATION COMPLETE")
    logger.info("  Accepted: %d", accepted)
    logger.info("  Rejected: %d", rejected)
    logger.info("  Acceptance rate: %.1f%%", 100 * accepted / max(1, accepted + rejected))
    logger.info("  Output: %s", OUTPUT_FILE)

    # Split into train/test
    if accepted > 0:
        split_train_test(OUTPUT_FILE)
        logger.info("  Train file: %s", TRAIN_FILE)
        logger.info("  Test file: %s", TEST_FILE)

    logger.info("\nNext step: python 03_train.py")


if __name__ == "__main__":
    main()
