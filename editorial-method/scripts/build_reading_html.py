#!/usr/bin/env python3
"""
build_reading_html.py — clean reading HTML of the edited manuscript.

Emits a faithful, escaped HTML rendering of the edited master with the structural
markers turned into headings (Part = h1, Chapter = h2) and the author's title page
preserved as written. Feed this to pandoc (`-f html -t docx`) to get a usable Word
file with proper heading styles — going through HTML (not markdown) avoids pandoc
mis-parsing the prose (e.g. the `*`-prefixed author note at line 6189).

Usage:  python3 scripts/build_reading_html.py SRC OUT.html [START END]
        (START END optional; 1-based inclusive line range, e.g. a single chapter)
"""
import sys
import re
import html

PART_RE = re.compile(r"^=== PART:\s*(.+?)\s*===\s*$")
CHAP_RE = re.compile(r"^\[CHAPTER\s+(\w+)\]\s*$")
TITLE = "Reluctant Successions"


def main():
    lines = open(sys.argv[1], encoding="utf-8").read().splitlines()
    if len(sys.argv) >= 5:
        start, end = int(sys.argv[3]), int(sys.argv[4])
        src = lines[start - 1:end]
        seen_part = start > 1          # a mid-book range is body, not front matter
    else:
        src, seen_part = lines, False
    out = []
    for raw in src:
        if not raw.strip():
            continue
        m = PART_RE.match(raw)
        if m:
            seen_part = True
            out.append(f'<h1>{html.escape(m.group(1))}</h1>')
            continue
        m = CHAP_RE.match(raw)
        if m:
            out.append(f'<h2>Chapter {html.escape(m.group(1))}</h2>')
            continue
        if not seen_part:                       # title page — preserve as written
            esc = html.escape(raw)
            out.append(f'<p><strong>{esc}</strong></p>' if raw.strip() == TITLE
                       else f'<p>{esc}</p>')
        else:
            out.append(f'<p>{html.escape(raw)}</p>')
    doc = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
           f'<title>{TITLE}</title></head><body>\n' + "\n".join(out) +
           "\n</body></html>\n")
    open(sys.argv[2], "w", encoding="utf-8").write(doc)
    print(f"wrote {sys.argv[2]} — {len(out)} blocks")


if __name__ == "__main__":
    main()
