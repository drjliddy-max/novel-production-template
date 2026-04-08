#!/bin/bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: scripts/extract_pdf.sh input/original-manuscript.pdf"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
INPUT_PDF="$1"
RAW_DIR="$ROOT_DIR/support/raw"
TMP_DIR="$ROOT_DIR/support/tmp"
RAW_TXT="$RAW_DIR/extracted.txt"

mkdir -p "$RAW_DIR" "$TMP_DIR" "$ROOT_DIR/manuscript/chapters"

if ! command -v pdftotext >/dev/null 2>&1; then
  echo "Error: pdftotext is required but was not found."
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "Error: python3 is required but was not found."
  exit 1
fi

echo "Extracting text from $INPUT_PDF"
pdftotext -layout "$INPUT_PDF" "$RAW_TXT"

echo "Splitting extracted text into chapter files"
python3 "$ROOT_DIR/scripts/split_chapters.py" "$RAW_TXT" "$ROOT_DIR/manuscript/chapters"

echo "Done."
echo "Raw text: $RAW_TXT"
echo "Chapters: $ROOT_DIR/manuscript/chapters"
