#!/usr/bin/env python3
"""
educate_quotes.py — final smart-quote typeset pass.

Normalizes a manuscript's mixed straight/curly quotes to UNIFORM typographic
("educated") quotes:  "  ”  ‘  ’

Method (two stages, deterministic):
  1. De-educate: collapse every existing curly quote back to its straight form,
     so we start from one uniform baseline and never have to guess which
     pre-existing curly quotes were right.
  2. Educate: apply the canonical SmartyPants `educate_quotes` rules to decide
     opening vs closing, plus EXPLICIT handling for archaic leading-apostrophe
     elisions ('Tis, 'twas, 'em, 'cause, 'neath, 'gainst, 'round, decade '97)
     that plain SmartyPants mis-converts into opening single quotes.

This is a pure character-class transform: it changes ONLY quote characters.
Word count and line count are invariant — that is the primary safety check.

Usage:  python3 scripts/educate_quotes.py <file>          # in place
        python3 scripts/educate_quotes.py <file> --dry     # report only, no write
"""
import re
import sys

# Leading-apostrophe elisions SmartyPants mishandles. Matched case-insensitively
# after a non-word boundary; the ' becomes a right-single (apostrophe).
ELISIONS = r"tis|twas|twere|til|em|cause|round|gainst|neath|bout|nother"

PUNCT_CLASS = r"""[!"#\$\%'()*+,\-.\/:;<=>?\@\[\\\]\^_`{|}~]"""
CLOSE_CLASS = r"""[^\ \t\r\n\[\{\(\-]"""


def deeducate(text: str) -> str:
    """Collapse all curly quotes to straight, for a uniform baseline."""
    return (text
            .replace("“", '"').replace("”", '"')   # “ ”  -> "
            .replace("‘", "'").replace("’", "'"))   # ‘ ’  -> '


def educate(text: str) -> str:
    # --- pre-pass: force right-single apostrophe on archaic elisions & decades ---
    # e.g.  'Tis  'twas  'em  'cause  ...  and  '97
    text = re.sub(r"(?i)(?<![A-Za-z0-9])'(?=(?:%s)\b)" % ELISIONS, "’", text)
    text = re.sub(r"(?<![A-Za-z0-9])'(?=\d{2}s?\b)", "’", text)

    # --- single quotes ---
    # opening single: after whitespace / dash / start, before a word char
    text = re.sub(r"(^|[\s\-–—([{“])'(?=\w)", r"\1‘", text)
    # closing single / apostrophe: after a closing-class char, not before ws/s/digit
    text = re.sub(r"(%s)'(?!\s|s\b|\d)" % CLOSE_CLASS, r"\1’", text)
    # closing single before whitespace or possessive-plural s-boundary
    text = re.sub(r"(%s)'(\s|s\b)" % CLOSE_CLASS, r"\1’\2", text)
    # any remaining straight single -> opening single
    text = text.replace("'", "‘")

    # --- double quotes ---
    # opening double: after whitespace / dash / start, before a word char
    text = re.sub(r'(^|[\s\-–—([{‘])"(?=\w)', r"\1“", text)
    # closing double: before whitespace
    text = re.sub(r'"(?=\s)', "”", text)
    # closing double: after a closing-class char
    text = re.sub(r'(%s)"' % CLOSE_CLASS, r"\1”", text)
    # any remaining straight double -> opening double
    text = text.replace('"', "“")
    return text


def main():
    if len(sys.argv) < 2:
        sys.exit("usage: educate_quotes.py <file> [--dry]")
    path = sys.argv[1]
    dry = "--dry" in sys.argv[2:]
    with open(path, encoding="utf-8") as fh:
        src = fh.read()
    out = educate(deeducate(src))

    def counts(s):
        return {
            'straight"': s.count('"'), "straight'": s.count("'"),
            "“": s.count("“"), "”": s.count("”"),
            "‘": s.count("‘"), "’": s.count("’"),
            "words": len(s.split()), "lines": s.count("\n"),
        }

    before, after = counts(src), counts(out)
    print("            before -> after")
    for k in before:
        print(f"  {k:>10}: {before[k]:>6} -> {after[k]:>6}")
    if before["words"] != after["words"] or before["lines"] != after["lines"]:
        sys.exit("ABORT: word/line count changed — not a pure quote transform.")
    if after['straight"'] or after["straight'"]:
        sys.exit("ABORT: straight quotes remain after educate.")
    if dry:
        print("dry run — no write.")
        return
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(out)
    print("written.")


if __name__ == "__main__":
    main()
