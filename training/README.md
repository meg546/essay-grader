# Essay Grader — Model Fine-Tuning Pipeline

Fine-tune a local essay grading model via distillation from Claude Sonnet using the ASAP 2.0 dataset.

## Prerequisites

- Python 3.12+
- Kaggle API credentials (`~/.kaggle/kaggle.json`)
- Anthropic API key (`ANTHROPIC_API_KEY` env var)
- NVIDIA GPU with 24GB+ VRAM (RTX 4090 recommended) for training
- Ollama installed locally

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Download and parse ASAP 2.0 dataset
python 01_download_dataset.py

# 3. Generate training data via Sonnet distillation (~$17 for 500 examples)
export ANTHROPIC_API_KEY=sk-ant-...
python 02_generate_training_data.py --sample-size 500

# 4. Fine-tune (on machine with GPU)
pip install unsloth
pip install --no-deps trl peft accelerate bitsandbytes
python 03_train.py --model 3b    # ~1-2 hours on 4090
# or
python 03_train.py --model 7b    # ~3-4 hours on 4090

# 5. Export to GGUF and create Ollama model
python 04_export.py --model 3b
ollama create essay-grader -f export/Modelfile

# 6. Update backend to use fine-tuned model
# In backend/.env:
#   MODEL_NAME=essay-grader

# 7. Evaluate
python 05_evaluate.py --compare-sonnet
```

## Pipeline Steps

| Step | Script | What It Does | Cost |
|------|--------|-------------|------|
| 1 | `01_download_dataset.py` | Downloads ASAP 2.0 from Kaggle, parses to JSONL | Free |
| 2 | `02_generate_training_data.py` | Sends essays to Sonnet, validates quotes, splits train/test | ~$17 (500 examples) |
| 3 | `03_train.py` | QLoRA fine-tunes Qwen 2.5 3B or 7B with Unsloth | Free (local GPU) |
| 4 | `04_export.py` | Exports to Q4_K_M GGUF, generates Ollama Modelfile | Free |
| 5 | `05_evaluate.py` | Compares against human scores and Sonnet baseline | ~$6 (with --compare-sonnet) |

## Architecture

```
training/
├── 01_download_dataset.py    # Dataset download & parsing
├── 02_generate_training_data.py  # Sonnet distillation
├── 03_train.py               # QLoRA fine-tuning
├── 04_export.py              # GGUF export + Ollama Modelfile
├── 05_evaluate.py            # Evaluation pipeline
├── rubrics.py                # Multi-rubric templates
├── requirements.txt          # Python dependencies
├── data/                     # Generated data (gitignored)
│   ├── raw/                  # Raw ASAP 2.0 files
│   ├── asap2_parsed.jsonl    # Parsed dataset
│   ├── training_data.jsonl   # All generated examples
│   ├── train.jsonl           # Training split
│   └── test.jsonl            # Holdout test split
├── checkpoints/              # Training checkpoints (gitignored)
├── export/                   # GGUF files + Modelfile (gitignored)
└── evaluation/               # Evaluation reports
```

## Key Design Decisions

- **Multi-rubric augmentation**: Training data uses 4 different rubric formats (4-category, holistic 6-point, simplified 3-category, analytical 5-trait) so the model generalizes to arbitrary rubrics
- **Human score calibration**: ASAP 2.0 human holistic scores are passed to Sonnet as calibration anchors
- **Quote validation**: Training examples where quotes don't exactly match the essay text are rejected
- **Higher LoRA rank on attention**: Attention layers (q/k/v/o_proj) get rank 64 by default vs 32 for FFN layers, improving exact-quote copying from context
- **Resumable generation**: Progress is saved every 10 essays; re-running skips already-processed essays
