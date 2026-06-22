#!/usr/bin/env python3
"""
redline_html.py — human-readable HTML redline of editorial changes.

Compares a line range of the clean master against the edited master and emits a
self-contained HTML file: deletions in red strikethrough, insertions in green
underline, word by word.

DIFF IS LINE-ALIGNED. The editing method preserves line count exactly (every
transform is an in-place substring/character replacement), so clean line i always
corresponds to edited line i. Only lines that actually changed are word-diffed —
this is fast on the whole book, where a token-level whole-file diff is O(n*m).

Quote-style differences (straight vs curly) are normalized away on BOTH sides
first, so the redline shows only SUBSTANTIVE edits — not the cosmetic smart-quote
typeset pass. Comma/period punctuation edits are NOT normalized, so the dialogue-
punctuation fixes remain visible (the author should see those).

Structural markers (`=== PART: X ===`, `[CHAPTER N]`) render as headings.

Usage:
  python3 scripts/redline_html.py CLEAN EDITED START END OUT.html "Title"
  python3 scripts/redline_html.py CLEAN EDITED 1 0 OUT.html "Title"   # 0 = to EOF
"""
import sys
import re
import html
import difflib

PART_RE = re.compile(r"^=== PART:\s*(.+?)\s*===\s*$")
CHAP_RE = re.compile(r"^\[CHAPTER\s+(\w+)\]\s*$")


def deeducate(t: str) -> str:
    return (t.replace("“", '"').replace("”", '"')
             .replace("‘", "'").replace("’", "'"))


def tokens(t: str):
    return re.findall(r"\S+|\s+", t)


def diff_line(a: str, b: str):
    """Word-level redline of one changed line. Returns (html, dels, ins)."""
    ta, tb = tokens(a), tokens(b)
    sm = difflib.SequenceMatcher(None, ta, tb, autojunk=False)
    out, d, i = [], 0, 0
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        old, new = "".join(ta[i1:i2]), "".join(tb[j1:j2])
        if tag == "equal":
            out.append(html.escape(old))
        elif tag == "delete":
            out.append(f"<del>{html.escape(old)}</del>"); d += 1
        elif tag == "insert":
            out.append(f"<ins>{html.escape(new)}</ins>"); i += 1
        elif tag == "replace":
            out.append(f"<del>{html.escape(old)}</del><ins>{html.escape(new)}</ins>")
            d += 1; i += 1
    return "".join(out), d, i


def main():
    clean_f, edited_f, start, end, out, title = sys.argv[1:7]
    start, end = int(start), int(end)
    clean = open(clean_f, encoding="utf-8").read().splitlines()
    edited = open(edited_f, encoding="utf-8").read().splitlines()
    hi = len(edited) if end == 0 else end
    parts, dels, ins = [], 0, 0
    for idx in range(start - 1, hi):
        raw = edited[idx]
        m = PART_RE.match(raw)
        if m:
            parts.append(f'<h1 class="part">{html.escape(m.group(1))}</h1>')
            continue
        m = CHAP_RE.match(raw)
        if m:
            parts.append(f'<h2 class="chap">Chapter {html.escape(m.group(1))}</h2>')
            continue
        c = deeducate(clean[idx]) if idx < len(clean) else ""
        e = deeducate(raw)
        if c == e:
            parts.append(html.escape(raw) + "\n")
        else:
            seg, d, i = diff_line(c, e)
            parts.append(seg + "\n")
            dels += d; ins += i

    doc = f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>{html.escape(title)}</title><style>
body{{font:18px/1.75 Georgia,'Times New Roman',serif;max-width:820px;margin:36px auto;padding:0 22px;color:#222}}
h1.part{{font:600 26px sans-serif;margin:48px 0 8px;padding-top:24px;border-top:2px solid #ccc}}
h2.chap{{font:600 20px sans-serif;color:#444;margin:36px 0 6px}}
.legend{{font:14px/1.5 sans-serif;background:#f6f6f6;border:1px solid #ddd;padding:12px 16px;border-radius:8px;margin:0 0 28px;position:sticky;top:0}}
.legend del,.legend ins{{padding:0 2px}}
del{{color:#b00020;text-decoration:line-through;background:#fdecee}}
ins{{color:#0a7d2c;text-decoration:underline;background:#eafaef}}
.txt{{white-space:pre-wrap}}
</style></head><body>
<h1 style="font:600 22px sans-serif;border:none">{html.escape(title)}</h1>
<div class="legend"><b>Redline legend:</b> <del>red strikethrough = removed</del> &nbsp;
<ins>green underline = added</ins>.<br>
Quote-style (straight vs curly) is normalized out, so only substantive edits are shown.
Total changed segments: <b>{dels}</b> removed / <b>{ins}</b> added.</div>
<div class="txt">{''.join(parts)}</div>
</body></html>"""
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(doc)
    print(f"wrote {out} — {dels} deletions / {ins} insertions")


if __name__ == "__main__":
    main()
