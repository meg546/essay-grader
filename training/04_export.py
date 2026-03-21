"""Phase 26 — Export fine-tuned model to GGUF and create Ollama Modelfile.

Quantizes the trained LoRA adapter + base model to GGUF format (Q4_K_M)
and generates an Ollama Modelfile for one-command deployment.

Usage:
  python 04_export.py --model 3b
  python 04_export.py --model 7b

  # Then import into Ollama:
  ollama create essay-grader -f training/export/Modelfile
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

CHECKPOINT_DIR = Path(__file__).parent / "checkpoints"
EXPORT_DIR = Path(__file__).parent / "export"

MODEL_MAP = {
    "3b": "unsloth/Qwen2.5-3B-Instruct-bnb-4bit",
    "7b": "unsloth/Qwen2.5-7B-Instruct-bnb-4bit",
}

MODELFILE_TEMPLATE = """FROM {gguf_path}

# Essay grading model fine-tuned from Qwen 2.5 {size} via QLoRA distillation
PARAMETER temperature 0.3
PARAMETER num_predict 4096
PARAMETER stop <|im_end|>
PARAMETER stop <|endoftext|>

SYSTEM \"\"\"You are an expert essay grader. Evaluate essays according to the provided rubric and return a structured JSON response with categories, scores, strengths, improvements, justifications, and exact quotes from the essay.\"\"\"
"""


def main() -> None:
    parser = argparse.ArgumentParser(description="Export fine-tuned model to GGUF")
    parser.add_argument(
        "--model",
        choices=["3b", "7b"],
        default="3b",
        help="Model size to export (default: 3b)",
    )
    parser.add_argument(
        "--quantization",
        default="q4_k_m",
        help="GGUF quantization method (default: q4_k_m)",
    )
    args = parser.parse_args()

    checkpoint_name = f"essay-grader-qwen2.5-{args.model}"
    checkpoint_path = CHECKPOINT_DIR / checkpoint_name

    if not checkpoint_path.exists():
        print(
            f"Error: Checkpoint not found at {checkpoint_path}\n"
            f"Run training first: python 03_train.py --model {args.model}",
            file=sys.stderr,
        )
        sys.exit(1)

    try:
        from unsloth import FastLanguageModel
    except ImportError:
        print(
            "Error: unsloth not installed. Install with:\n"
            "  pip install unsloth",
            file=sys.stderr,
        )
        sys.exit(1)

    export_name = f"essay-grader-{args.model}"
    export_path = EXPORT_DIR / export_name

    print(f"{'=' * 60}")
    print(f"Exporting to GGUF")
    print(f"{'=' * 60}")
    print(f"  Checkpoint:    {checkpoint_path}")
    print(f"  Quantization:  {args.quantization}")
    print(f"  Output:        {export_path}")
    print(f"{'=' * 60}")

    # Load the fine-tuned model
    print("\nLoading fine-tuned model...")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=str(checkpoint_path),
        max_seq_length=4096,
        load_in_4bit=True,
    )

    # Export to GGUF
    print(f"\nExporting to GGUF ({args.quantization})...")
    export_path.mkdir(parents=True, exist_ok=True)
    model.save_pretrained_gguf(
        str(export_path),
        tokenizer,
        quantization_method=args.quantization,
    )

    # Find the generated GGUF file
    gguf_files = list(export_path.glob("*.gguf"))
    if not gguf_files:
        print("Error: No GGUF file generated!", file=sys.stderr)
        sys.exit(1)

    gguf_file = gguf_files[0]
    print(f"GGUF file: {gguf_file}")
    print(f"Size: {gguf_file.stat().st_size / 1024 / 1024:.0f} MB")

    # Generate Ollama Modelfile
    modelfile_path = EXPORT_DIR / "Modelfile"
    modelfile_content = MODELFILE_TEMPLATE.format(
        gguf_path=gguf_file.resolve(),
        size=args.model.upper(),
    )
    modelfile_path.write_text(modelfile_content)
    print(f"Modelfile: {modelfile_path}")

    print(f"\n{'=' * 60}")
    print("Export complete!")
    print(f"{'=' * 60}")
    print(f"\nTo import into Ollama:")
    print(f"  ollama create essay-grader -f {modelfile_path}")
    print(f"\nThen update your backend .env:")
    print(f"  MODEL_NAME=essay-grader")
    print(f"\nTo evaluate:")
    print(f"  python 05_evaluate.py --model {args.model}")


if __name__ == "__main__":
    main()
