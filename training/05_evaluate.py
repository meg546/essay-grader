"""Phase 27 — Evaluate fine-tuned model against human scores and Sonnet baseline.

Grades the holdout test set with both the fine-tuned model (via Ollama) and
Claude Sonnet, then compares:
  - QWK (quadratic weighted kappa) against human holistic scores
  - Quote accuracy (% of quotes that exactly match essay text)
  - Per-rubric-type breakdown

Usage:
  # Evaluate fine-tuned model only:
  python 05_evaluate.py

  # Compare against Sonnet baseline:
  python 05_evaluate.py --compare-sonnet

  # Specify Ollama model name:
  python 05_evaluate.py --ollama-model essay-grader
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
import time
from pathlib import Path

import httpx
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent / "data"
TEST_FILE = DATA_DIR / "test.jsonl"
RESULTS_DIR = Path(__file__).parent / "evaluation"


def quadratic_weighted_kappa(y_true: list[int], y_pred: list[int]) -> float:
    """Calculate quadratic weighted kappa between two lists of scores."""
    from sklearn.metrics import cohen_kappa_score
    return cohen_kappa_score(y_true, y_pred, weights="quadratic")


def grade_with_ollama(
    essay_text: str,
    system_prompt: str,
    user_prompt: str,
    model: str = "essay-grader",
    endpoint: str = "http://localhost:11434",
) -> dict | None:
    """Grade an essay using the fine-tuned model via Ollama."""
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.3,
        "stream": False,
    }
    try:
        resp = httpx.post(
            f"{endpoint}/v1/chat/completions",
            json=payload,
            timeout=120.0,
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        return json.loads(content)
    except Exception as e:
        logger.warning("Ollama error: %s", e)
        return None


def grade_with_sonnet(
    essay_text: str,
    system_prompt: str,
    user_prompt: str,
) -> dict | None:
    """Grade an essay using Claude Sonnet."""
    import anthropic

    client = anthropic.Anthropic()
    try:
        response = client.messages.create(
            model="claude-sonnet-4-6-20250514",
            max_tokens=4096,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        raw = response.content[0].text
        if raw.startswith("```"):
            lines = raw.split("\n")
            raw = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])
        return json.loads(raw)
    except Exception as e:
        logger.warning("Sonnet error: %s", e)
        return None


def compute_overall_score(grading: dict) -> int:
    """Compute a normalized overall score (1-6) from the grading output."""
    categories = grading.get("categories", [])
    if not categories:
        return 3  # Default mid-range

    total_score = sum(c.get("score", 0) for c in categories)
    total_max = sum(c.get("maxScore", 25) for c in categories)

    if total_max == 0:
        return 3

    # Normalize to 1-6 scale
    ratio = total_score / total_max
    return max(1, min(6, round(ratio * 5 + 1)))


def check_quote_accuracy(essay_text: str, grading: dict) -> tuple[int, int]:
    """Check how many quotes exactly match the essay text.

    Returns (exact_matches, total_quotes).
    """
    exact = 0
    total = 0
    for cat in grading.get("categories", []):
        for quote in cat.get("quotes", []):
            text = quote.get("text", "")
            if not text:
                continue
            total += 1
            if text in essay_text:
                exact += 1
    return exact, total


def load_test_data() -> list[dict]:
    """Load test examples from JSONL."""
    examples = []
    with open(TEST_FILE) as f:
        for line in f:
            examples.append(json.loads(line))
    return examples


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate fine-tuned model")
    parser.add_argument(
        "--ollama-model",
        default="essay-grader",
        help="Ollama model name (default: essay-grader)",
    )
    parser.add_argument(
        "--ollama-endpoint",
        default="http://localhost:11434",
        help="Ollama endpoint (default: http://localhost:11434)",
    )
    parser.add_argument(
        "--compare-sonnet",
        action="store_true",
        help="Also evaluate with Sonnet for comparison",
    )
    parser.add_argument(
        "--limit",
        type=int,
        help="Limit number of test examples",
    )
    args = parser.parse_args()

    if not TEST_FILE.exists():
        print(f"Error: {TEST_FILE} not found. Run 02_generate_training_data.py first.", file=sys.stderr)
        sys.exit(1)

    test_data = load_test_data()
    if args.limit:
        test_data = test_data[:args.limit]

    logger.info("Evaluating %d test examples", len(test_data))

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    # Evaluate fine-tuned model
    ft_human_scores = []
    ft_pred_scores = []
    ft_quote_exact = 0
    ft_quote_total = 0
    ft_results = []

    for i, example in enumerate(test_data):
        conversations = example["conversations"]
        system_prompt = conversations[0]["content"]
        user_prompt = conversations[1]["content"]
        essay_text = ""
        # Extract essay text from user prompt
        if "<essay>" in user_prompt:
            essay_text = user_prompt.split("<essay>")[1].split("</essay>")[0].strip()

        grading = grade_with_ollama(
            essay_text, system_prompt, user_prompt,
            model=args.ollama_model, endpoint=args.ollama_endpoint,
        )

        if grading is None:
            logger.warning("Failed to grade essay %d", i)
            continue

        human_score = example["human_score"]
        pred_score = compute_overall_score(grading)

        ft_human_scores.append(human_score)
        ft_pred_scores.append(pred_score)

        exact, total = check_quote_accuracy(essay_text, grading)
        ft_quote_exact += exact
        ft_quote_total += total

        ft_results.append({
            "essay_id": example.get("essay_id", i),
            "human_score": human_score,
            "predicted_score": pred_score,
            "quote_exact": exact,
            "quote_total": total,
        })

        if (i + 1) % 10 == 0:
            logger.info("Fine-tuned model: %d/%d complete", i + 1, len(test_data))

    # Evaluate Sonnet baseline (optional)
    sonnet_results = []
    if args.compare_sonnet:
        logger.info("\nEvaluating Sonnet baseline...")
        sn_human_scores = []
        sn_pred_scores = []
        sn_quote_exact = 0
        sn_quote_total = 0

        for i, example in enumerate(test_data):
            conversations = example["conversations"]
            system_prompt = conversations[0]["content"]
            user_prompt = conversations[1]["content"]
            essay_text = ""
            if "<essay>" in user_prompt:
                essay_text = user_prompt.split("<essay>")[1].split("</essay>")[0].strip()

            grading = grade_with_sonnet(essay_text, system_prompt, user_prompt)
            if grading is None:
                continue

            human_score = example["human_score"]
            pred_score = compute_overall_score(grading)

            sn_human_scores.append(human_score)
            sn_pred_scores.append(pred_score)

            exact, total = check_quote_accuracy(essay_text, grading)
            sn_quote_exact += exact
            sn_quote_total += total

            sonnet_results.append({
                "essay_id": example.get("essay_id", i),
                "human_score": human_score,
                "predicted_score": pred_score,
                "quote_exact": exact,
                "quote_total": total,
            })

            if (i + 1) % 10 == 0:
                logger.info("Sonnet: %d/%d complete", i + 1, len(test_data))

            time.sleep(0.5)  # Rate limit

    # Generate report
    report = generate_report(
        ft_human_scores, ft_pred_scores, ft_quote_exact, ft_quote_total,
        sonnet_results, args.compare_sonnet,
    )

    report_path = RESULTS_DIR / "evaluation_report.md"
    report_path.write_text(report)
    print(report)
    logger.info("Report saved to: %s", report_path)

    # Save raw results
    results_path = RESULTS_DIR / "results.json"
    with open(results_path, "w") as f:
        json.dump({
            "fine_tuned": ft_results,
            "sonnet": sonnet_results,
        }, f, indent=2)


def generate_report(
    ft_human: list[int], ft_pred: list[int],
    ft_qe: int, ft_qt: int,
    sonnet_results: list[dict],
    compare_sonnet: bool,
) -> str:
    """Generate a markdown evaluation report."""
    lines = [
        "# Evaluation Report: Essay Grader Fine-Tuned Model",
        "",
        "## Fine-Tuned Model Results",
        "",
        f"- **Test examples:** {len(ft_human)}",
    ]

    if len(ft_human) >= 2:
        qwk = quadratic_weighted_kappa(ft_human, ft_pred)
        lines.append(f"- **QWK vs human scores:** {qwk:.4f}")
    else:
        lines.append("- **QWK:** Insufficient data")

    quote_acc = (ft_qe / ft_qt * 100) if ft_qt > 0 else 0
    lines.extend([
        f"- **Quote accuracy:** {ft_qe}/{ft_qt} ({quote_acc:.1f}% exact match)",
        "",
    ])

    if len(ft_human) >= 2:
        mae = np.mean(np.abs(np.array(ft_human) - np.array(ft_pred)))
        lines.append(f"- **Mean absolute error:** {mae:.2f} (on 1-6 scale)")
        lines.append("")

    if compare_sonnet and sonnet_results:
        sn_human = [r["human_score"] for r in sonnet_results]
        sn_pred = [r["predicted_score"] for r in sonnet_results]
        sn_qe = sum(r["quote_exact"] for r in sonnet_results)
        sn_qt = sum(r["quote_total"] for r in sonnet_results)

        lines.extend([
            "## Sonnet Baseline Results",
            "",
            f"- **Test examples:** {len(sn_human)}",
        ])

        if len(sn_human) >= 2:
            sn_qwk = quadratic_weighted_kappa(sn_human, sn_pred)
            lines.append(f"- **QWK vs human scores:** {sn_qwk:.4f}")

        sn_quote_acc = (sn_qe / sn_qt * 100) if sn_qt > 0 else 0
        lines.extend([
            f"- **Quote accuracy:** {sn_qe}/{sn_qt} ({sn_quote_acc:.1f}% exact match)",
            "",
            "## Comparison",
            "",
            "| Metric | Fine-Tuned | Sonnet |",
            "|--------|-----------|--------|",
        ])

        if len(ft_human) >= 2 and len(sn_human) >= 2:
            ft_qwk = quadratic_weighted_kappa(ft_human, ft_pred)
            sn_qwk_val = quadratic_weighted_kappa(sn_human, sn_pred)
            lines.append(f"| QWK | {ft_qwk:.4f} | {sn_qwk_val:.4f} |")

        lines.append(f"| Quote accuracy | {quote_acc:.1f}% | {sn_quote_acc:.1f}% |")

        if len(ft_human) >= 2:
            ft_mae = np.mean(np.abs(np.array(ft_human) - np.array(ft_pred)))
            sn_mae = np.mean(np.abs(np.array(sn_human) - np.array(sn_pred)))
            lines.append(f"| MAE | {ft_mae:.2f} | {sn_mae:.2f} |")

        lines.append("")

    return "\n".join(lines)


if __name__ == "__main__":
    main()
