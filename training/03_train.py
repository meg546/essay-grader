"""Phase 25 — Fine-tune Qwen 2.5 with QLoRA using Unsloth.

Trains a LoRA adapter on the Sonnet-distilled essay grading dataset.
Supports both 3B and 7B base models.

Usage:
  # Train 3B model (faster, ~1-2 hours on 4090):
  python 03_train.py --model 3b

  # Train 7B model (better quality, ~3-4 hours on 4090):
  python 03_train.py --model 7b

  # Custom LoRA rank:
  python 03_train.py --model 3b --lora-rank 64

  # Custom epochs:
  python 03_train.py --model 7b --epochs 5
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"
TRAIN_FILE = DATA_DIR / "train.jsonl"
OUTPUT_DIR = Path(__file__).parent / "checkpoints"

MODEL_MAP = {
    "3b": "unsloth/Qwen2.5-3B-Instruct-bnb-4bit",
    "7b": "unsloth/Qwen2.5-7B-Instruct-bnb-4bit",
}

# Default LoRA ranks — higher for attention layers (better quote fidelity)
DEFAULT_ATTN_RANK = 64
DEFAULT_FFN_RANK = 32


def load_training_data(path: Path) -> list[dict]:
    """Load training examples from JSONL."""
    examples = []
    with open(path) as f:
        for line in f:
            ex = json.loads(line)
            examples.append(ex)
    print(f"Loaded {len(examples)} training examples")
    return examples


def format_for_training(examples: list[dict], tokenizer) -> list[str]:
    """Convert training examples to chat-template formatted strings."""
    texts = []
    for ex in examples:
        conversations = ex["conversations"]
        # Convert to the format expected by apply_chat_template
        messages = []
        for turn in conversations:
            messages.append({
                "role": turn["role"],
                "content": turn["content"],
            })
        text = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=False,
        )
        texts.append(text)
    return texts


def main() -> None:
    parser = argparse.ArgumentParser(description="Fine-tune Qwen 2.5 with QLoRA")
    parser.add_argument(
        "--model",
        choices=["3b", "7b"],
        default="3b",
        help="Base model size (default: 3b)",
    )
    parser.add_argument(
        "--lora-rank",
        type=int,
        default=None,
        help=f"LoRA rank for attention layers (default: {DEFAULT_ATTN_RANK})",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=3,
        help="Number of training epochs (default: 3)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=4,
        help="Per-device batch size (default: 4)",
    )
    parser.add_argument(
        "--lr",
        type=float,
        default=2e-4,
        help="Learning rate (default: 2e-4)",
    )
    parser.add_argument(
        "--max-seq-length",
        type=int,
        default=4096,
        help="Maximum sequence length (default: 4096)",
    )
    args = parser.parse_args()

    if not TRAIN_FILE.exists():
        print(f"Error: {TRAIN_FILE} not found. Run 02_generate_training_data.py first.", file=sys.stderr)
        sys.exit(1)

    # Import here so the script can show --help without GPU
    try:
        from unsloth import FastLanguageModel
    except ImportError:
        print(
            "Error: unsloth not installed. Install with:\n"
            "  pip install unsloth\n"
            "  pip install --no-deps trl peft accelerate bitsandbytes",
            file=sys.stderr,
        )
        sys.exit(1)

    from datasets import Dataset
    from trl import SFTConfig, SFTTrainer

    model_name = MODEL_MAP[args.model]
    attn_rank = args.lora_rank or DEFAULT_ATTN_RANK
    output_name = f"essay-grader-qwen2.5-{args.model}"
    output_path = OUTPUT_DIR / output_name

    print(f"{'=' * 60}")
    print(f"Fine-tuning Configuration")
    print(f"{'=' * 60}")
    print(f"  Base model:     {model_name}")
    print(f"  LoRA rank:      {attn_rank} (attention), {attn_rank // 2} (FFN)")
    print(f"  Epochs:         {args.epochs}")
    print(f"  Batch size:     {args.batch_size}")
    print(f"  Learning rate:  {args.lr}")
    print(f"  Max seq length: {args.max_seq_length}")
    print(f"  Output:         {output_path}")
    print(f"{'=' * 60}")

    # Load model in 4-bit
    print(f"\nLoading {model_name}...")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=model_name,
        max_seq_length=args.max_seq_length,
        load_in_4bit=True,
    )

    # Configure LoRA with higher rank on attention layers
    print("Configuring LoRA adapters...")
    model = FastLanguageModel.get_peft_model(
        model,
        r=attn_rank,
        target_modules=[
            "q_proj", "k_proj", "v_proj", "o_proj",  # Attention — high rank for quote fidelity
            "gate_proj", "up_proj", "down_proj",       # FFN
        ],
        lora_alpha=attn_rank * 2,  # Standard: alpha = 2 * rank
        lora_dropout=0,  # Must be 0 for Unsloth optimized kernels
        bias="none",     # Must be "none" for Unsloth optimized kernels
        use_gradient_checkpointing="unsloth",  # The string "unsloth" (not True) — 30% less VRAM
        random_state=42,
        max_seq_length=args.max_seq_length,
    )

    # Load and format training data
    print("Loading training data...")
    raw_examples = load_training_data(TRAIN_FILE)
    formatted_texts = format_for_training(raw_examples, tokenizer)

    dataset = Dataset.from_dict({"text": formatted_texts})
    print(f"Dataset size: {len(dataset)} examples")

    # Configure trainer
    output_path.mkdir(parents=True, exist_ok=True)

    training_args = SFTConfig(
        output_dir=str(output_path),
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=4,
        num_train_epochs=args.epochs,
        learning_rate=args.lr,
        warmup_ratio=0.05,
        logging_steps=10,
        save_steps=100,
        save_total_limit=3,
        max_seq_length=args.max_seq_length,
        optim="adamw_8bit",
        seed=42,
        bf16=True,   # RTX 4090 (Ampere) has native BF16 support
        fp16=False,  # Never mix with bf16
    )

    trainer = SFTTrainer(
        model=model,
        train_dataset=dataset,
        tokenizer=tokenizer,
        args=training_args,
    )

    # Train
    print("\nStarting training...")
    stats = trainer.train()

    print(f"\n{'=' * 60}")
    print("Training complete!")
    print(f"  Loss: {stats.training_loss:.4f}")
    print(f"  Steps: {stats.global_step}")
    print(f"  Runtime: {stats.metrics['train_runtime']:.0f}s")
    print(f"{'=' * 60}")

    # Save the adapter
    model.save_pretrained(str(output_path))
    tokenizer.save_pretrained(str(output_path))
    print(f"Adapter saved to: {output_path}")

    print(f"\nNext step: python 04_export.py --model {args.model}")


if __name__ == "__main__":
    main()
