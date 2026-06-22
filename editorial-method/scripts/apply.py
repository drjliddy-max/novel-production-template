#!/usr/bin/env python3
"""Apply verified copyedit replacements to the edited master.

Reads JSON list of [old, new] (or [old, new, expected_count]) pairs from stdin.
Each `old` must occur exactly `expected_count` (default 1) times in the file, or
it is SKIPPED with a warning (never a silent wrong replacement). Prints a summary.

Target file resolution: $MANUSCRIPT env var, else first CLI arg, else
../manuscript/edited.txt (relative to this script). Set it per project.

Usage:
  MANUSCRIPT=path/to/edited.txt python3 scripts/apply.py <<'JSON'
  [["with he strength", "with the strength"], ["had insured this", "had ensured this"]]
  JSON
"""
import json, sys, os

_default = os.path.join(os.path.dirname(__file__), "..", "manuscript", "edited.txt")
P = os.environ.get("MANUSCRIPT") or (sys.argv[1] if len(sys.argv) > 1 else _default)
pairs = json.load(sys.stdin)
s = open(P, encoding="utf-8").read()

applied, skipped = 0, []
for pair in pairs:
    old, new = pair[0], pair[1]
    exp = pair[2] if len(pair) > 2 else 1
    n = s.count(old)
    if n != exp:
        skipped.append((old, n, exp))
        continue
    s = s.replace(old, new)
    applied += 1

open(P, "w", encoding="utf-8").write(s)
print(f"applied: {applied}/{len(pairs)}")
if skipped:
    print("SKIPPED (count mismatch — fix context and rerun):")
    for old, n, exp in skipped:
        print(f"  found {n}x (expected {exp}): {old[:60]!r}")
