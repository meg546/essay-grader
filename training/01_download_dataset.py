"""Phase 24 — Step 1: Download and parse the ASAP 2.0 dataset from Kaggle.

Produces a standardized JSONL file with one essay per line:
  { "essay_id", "essay_text", "human_score", "prompt_id", "grade_level" }

Usage:
  # Requires Kaggle API credentials (~/.kaggle/kaggle.json)
  python 01_download_dataset.py

  # Or specify a local zip if already downloaded:
  python 01_download_dataset.py --local-zip /path/to/asap-2-0.zip
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import zipfile
from pathlib import Path

import pandas as pd

OUTPUT_DIR = Path(__file__).parent / "data"
RAW_DIR = OUTPUT_DIR / "raw"
PARSED_FILE = OUTPUT_DIR / "asap2_parsed.jsonl"

KAGGLE_DATASET = "lburleigh/asap-2-0"


def download_from_kaggle(dest: Path) -> Path:
    """Download the ASAP 2.0 dataset zip from Kaggle."""
    dest.mkdir(parents=True, exist_ok=True)
    print(f"Downloading {KAGGLE_DATASET} from Kaggle...")
    subprocess.run(
        ["kaggle", "datasets", "download", "-d", KAGGLE_DATASET, "-p", str(dest)],
        check=True,
    )
    zip_files = list(dest.glob("*.zip"))
    if not zip_files:
        print("Error: No zip file found after download.", file=sys.stderr)
        sys.exit(1)
    return zip_files[0]


def extract_zip(zip_path: Path, dest: Path) -> None:
    """Extract the dataset zip."""
    dest.mkdir(parents=True, exist_ok=True)
    print(f"Extracting {zip_path.name}...")
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(dest)


def find_csv(directory: Path) -> Path:
    """Find the training CSV in the extracted files."""
    # Look for common ASAP 2.0 file names
    candidates = [
        "ASAP_2_Final_github_train.csv",
        "train.csv",
    ]
    for name in candidates:
        for path in directory.rglob(name):
            return path

    # Fallback: find any CSV
    csvs = list(directory.rglob("*.csv"))
    if csvs:
        print(f"Using CSV: {csvs[0].name}")
        return csvs[0]

    print("Error: No CSV file found in extracted data.", file=sys.stderr)
    sys.exit(1)


def parse_dataset(csv_path: Path) -> pd.DataFrame:
    """Parse the ASAP 2.0 CSV into a standardized format."""
    print(f"Parsing {csv_path.name}...")
    df = pd.read_csv(csv_path)

    print(f"  Columns found: {list(df.columns)}")
    print(f"  Total rows: {len(df)}")

    # Normalize column names (handle various naming conventions)
    col_map = {}
    for col in df.columns:
        lower = col.lower().strip()
        if lower in ("full_text", "essay_text", "essay", "text"):
            col_map[col] = "essay_text"
        elif lower in ("holistic_essay_score", "score", "overall_score", "grade"):
            col_map[col] = "human_score"
        elif lower in ("essay_id", "essay_id_comp", "id"):
            col_map[col] = "essay_id"
        elif lower in ("prompt_name", "prompt_id", "prompt", "assignment"):
            col_map[col] = "prompt_id"
        elif lower in ("grade_level", "grade"):
            # Only map if we haven't already mapped something to human_score
            if "grade_level" not in col_map.values():
                col_map[col] = "grade_level"

    df = df.rename(columns=col_map)

    # Ensure required columns exist
    if "essay_text" not in df.columns:
        print(f"Error: Could not find essay text column. Available: {list(df.columns)}", file=sys.stderr)
        sys.exit(1)

    if "human_score" not in df.columns:
        print(f"Error: Could not find score column. Available: {list(df.columns)}", file=sys.stderr)
        sys.exit(1)

    # Fill missing columns with defaults
    if "essay_id" not in df.columns:
        df["essay_id"] = [f"essay_{i}" for i in range(len(df))]

    if "prompt_id" not in df.columns:
        df["prompt_id"] = "unknown"

    if "grade_level" not in df.columns:
        df["grade_level"] = "high school"

    # Clean up
    df = df.dropna(subset=["essay_text", "human_score"])
    df["human_score"] = df["human_score"].astype(int)
    df["essay_text"] = df["essay_text"].astype(str).str.strip()

    # Filter out empty essays
    df = df[df["essay_text"].str.len() > 50]

    print(f"  Parsed essays: {len(df)}")
    print(f"  Score distribution:\n{df['human_score'].value_counts().sort_index().to_string()}")
    print(f"  Prompts: {df['prompt_id'].nunique()}")

    return df[["essay_id", "essay_text", "human_score", "prompt_id", "grade_level"]]


def save_jsonl(df: pd.DataFrame, output_path: Path) -> None:
    """Save DataFrame to JSONL format."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        for _, row in df.iterrows():
            f.write(json.dumps(row.to_dict(), ensure_ascii=False) + "\n")
    print(f"Saved {len(df)} essays to {output_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Download and parse ASAP 2.0 dataset")
    parser.add_argument(
        "--local-zip",
        type=Path,
        help="Path to already-downloaded zip file (skips Kaggle download)",
    )
    args = parser.parse_args()

    if args.local_zip:
        zip_path = args.local_zip
    else:
        zip_path = download_from_kaggle(RAW_DIR)

    extract_zip(zip_path, RAW_DIR)
    csv_path = find_csv(RAW_DIR)
    df = parse_dataset(csv_path)
    save_jsonl(df, PARSED_FILE)

    print(f"\nDone! Dataset ready at: {PARSED_FILE}")
    print(f"Next step: python 02_generate_training_data.py")


if __name__ == "__main__":
    main()
