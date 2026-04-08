#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CHAPTER_DIR="$ROOT_DIR/manuscript/chapters"
FRONT_DIR="$ROOT_DIR/manuscript/front-matter"
BACK_DIR="$ROOT_DIR/manuscript/back-matter"
OUT_DIR="$ROOT_DIR/output"
TMP_FILE="/tmp/novel_manuscript_combined.md"

mkdir -p "$OUT_DIR"

if ! command -v pandoc >/dev/null 2>&1; then
  echo "Error: pandoc is required but was not found."
  exit 1
fi

> "$TMP_FILE"

append_dir() {
  local dir="$1"
  if [ -d "$dir" ]; then
    while IFS= read -r file; do
      [ -n "$file" ] || continue
      cat "$file" >> "$TMP_FILE"
      printf "\n\n" >> "$TMP_FILE"
    done < <(find "$dir" -maxdepth 1 -type f -name '*.md' | sort)
  fi
}

append_dir "$FRONT_DIR"
append_dir "$CHAPTER_DIR"
append_dir "$BACK_DIR"

pandoc "$TMP_FILE" --standalone -o "$OUT_DIR/manuscript.html"
pandoc "$TMP_FILE" --standalone -o "$OUT_DIR/manuscript.docx"

echo "Built:"
echo "  $OUT_DIR/manuscript.html"
echo "  $OUT_DIR/manuscript.docx"
