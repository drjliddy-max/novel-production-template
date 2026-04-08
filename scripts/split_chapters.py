#!/usr/bin/env python3
import re
import sys
from pathlib import Path


def slugify(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r"[^a-z0-9]+", "_", text)
    return text.strip("_") or "untitled"


def clean_lines(text: str) -> str:
    lines = [line.rstrip() for line in text.splitlines()]
    while lines and not lines[0]:
        lines.pop(0)
    while lines and not lines[-1]:
        lines.pop()
    return "\n".join(lines) + "\n"


def main() -> int:
    if len(sys.argv) != 3:
      print("Usage: split_chapters.py <raw_txt> <output_dir>")
      return 1

    raw_path = Path(sys.argv[1])
    out_dir = Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)

    text = raw_path.read_text(encoding="utf-8", errors="ignore")

    heading_pattern = re.compile(
        r"(?im)^(prologue|epilogue|chapter\s+\d+|chapter\s+[ivxlcdm]+)\s*(?:[:.-]\s*(.+))?$"
    )

    matches = list(heading_pattern.finditer(text))

    for old_file in out_dir.glob("*.md"):
        old_file.unlink()

    if not matches:
        fallback = out_dir / "00_full_manuscript.md"
        fallback.write_text(clean_lines(text), encoding="utf-8")
        print(f"No chapter headings detected. Wrote fallback file: {fallback.name}")
        return 0

    for index, match in enumerate(matches):
        start = match.start()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        heading = match.group(1).strip()
        subtitle = (match.group(2) or "").strip()
        title = heading.title() if not subtitle else f"{heading.title()}: {subtitle}"
        body = text[start:end].strip()

        number = f"{index:02d}"
        filename = f"{number}_{slugify(title)}.md"
        chapter_text = f"# {title}\n\n{clean_lines(body)}"
        (out_dir / filename).write_text(chapter_text, encoding="utf-8")
        print(f"Wrote {filename}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
