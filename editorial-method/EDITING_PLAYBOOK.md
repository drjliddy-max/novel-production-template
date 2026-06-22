# Manuscript Copyedit / Line-Edit Playbook

A reusable, portable process for copyediting + line-editing a long fiction manuscript
**without injecting new errors and without flattening the author's voice.** Distilled from
the live edit of Richard Dinicola's *Reluctant Successions* (≈209k words, 38 chapters).

> Copy this file + `scripts/apply.py` into any new book project and follow it top to bottom.
> The next book this is intended for: **Brad's *Tale of Paratua*** (project paused pending Brad's
> full updated manuscript).

---

## 0. Mission & non-negotiables

- **Voice-preserving copyedit + line-edit.** Fix mechanical errors; tighten only clear
  overwriting/filter-word redundancy. Do **not** restructure the author's deliberately ornate,
  hypotactic, lyrical sentences. Preserve the author's voice 100%.
- **Never inject a new error into clean prose.** Every change is verified against the immutable
  source before and after. The fastest way to ruin a manuscript is to "correct" a word that was
  already perfect (see HARD RULE below).
- **When in doubt, FLAG — don't change.** Ambiguous wording, possible continuity issues, and
  author-only decisions get logged for the author, never silently rewritten.

---

## 1. HARD RULE — extraction must be ligature-safe and fidelity-verified

**Discovered the hard way. Never to be repeated.**

`pdftotext` (poppler) **silently drops `fi` / `fl` / `ff` ligatures** on many book fonts:
"fixed" → "xed", "flame" → "ame", "confines" → "con nes", plus stray lone `fi`/`fl` fragments.
No error is raised; most text looks fine, so the corruption is easy to miss. Editing on that
corrupted text "corrects" words that are perfect in the original — the opposite of the job.

Rules:
1. **Never** use `pdftotext` as the extraction source. Use a **ligature-safe extractor** —
   **PyMuPDF (`fitz`)** is the reference here (`mutool` also acceptable).
2. **Always verify extraction fidelity before trusting the text.** Grep the output for ligature
   words (`fixed`, `flame`, `confines`, `first`, `office`, `difficult`, `affliction`) and for
   stray lone `fi`/`fl` fragments on their own. If they're broken, the extraction is unusable.
3. Generalizes to all machine-extracted/transformed text: verify against the source before
   editing or asserting anything about it.

Quick PyMuPDF probe (run before committing to a manuscript):
```bash
python3 - <<'PY'
import fitz
d = fitz.open("source/<book>.pdf")
print("pages:", d.page_count)
for i in range(d.page_count):
    t = d[i].get_text().strip()
    if len(t) > 100:
        print(t[:600]); break
PY
# then grep the full extraction for ligature words and lone fi/fl fragments
```

If the PDF is **image-only / scanned** (no text layer), this process does **not** apply —
OCR + a different verification regime is required. Stop and flag.

---

## 2. File layout (one project per book)

```
<book>/
  source/<book>.pdf                       # the original (READ-ONLY; never edit)
  manuscript/<book>-clean.txt             # clean master — IMMUTABLE editing base (PyMuPDF, ligatures intact)
  manuscript/<book>-edited.txt            # THE DELIVERABLE — transformed in place from the clean master
  editorial/STYLE_SHEET.md                # canonical names + conventions (source of truth)
  editorial/CHANGELOG.md                  # substantive changes logged per global pass + per chapter
  editorial/EDITING_PLAYBOOK.md           # this file
  scripts/apply.py                        # verified replace helper (count-safe; see §5)
  RESUME_HERE.md                          # cold-start handoff: progress, line map, rules, open flags
  CLAUDE.md                               # project instructions (points here)
```

Why edit the master **in place** (not chapter-by-chapter rewrite): transforming the clean master
with targeted string replacements preserves every unchanged byte exactly, so the only risk surface
is the specific text you intended to change — the lowest-fidelity-risk approach for a copyedit.

---

## 3. Bootstrap a new book

1. Copy the source PDF into `source/`. Confirm it has a real text layer (§1).
2. Build the **clean master** with PyMuPDF: extract page text with ligatures intact, reflow
   paragraphs (join hard-wrapped lines within a paragraph; keep blank lines between paragraphs),
   repair obvious extraction artifacts (page numbers on their own lines, running headers/footers).
3. **Verify fidelity** (§1 grep). Delete any `pdftotext` output so no one edits from it by accident.
4. `cp manuscript/<book>-clean.txt manuscript/<book>-edited.txt` — the deliverable starts identical.
5. Build the **chapter line map**: record the line number of every `[CHAPTER n]` / part header in
   the edited master. Transforms (string replace) **do not change line count**, so the map stays
   stable for the whole edit. Put it in `RESUME_HERE.md`.
6. Seed `STYLE_SHEET.md` from a frequency scan of proper nouns (dominant spelling wins unless noted)
   + the project's character/place/term list. Frequency scan that doubles as a drift-detector and
   glossary seed:
   ```bash
   grep -oE '\b[A-Z][a-z]{3,}\b' manuscript/<book>-clean.txt | sort | uniq -c | sort -rn | head -80
   ```
6b. **Build an editorial glossary / name-bible** (`editorial/GLOSSARY.md`) — People / Places / Gods /
   Orders & Races / Magic terms / Artifacts. It is a high-value consistency tool (catches spelling
   drift like Irgoss/Igross, Persean/Persian, Haledonn/Halledon at a glance), a continuity bible
   (pins facts: which god is which gender, who is whose father, deliberate wordplay to preserve),
   and — for a series or shared world — the canon reference across sibling books. A **reader-facing**
   glossary/appendix is a separate, **author-decision** artifact: offer it at the end, don't impose.
7. Copy `scripts/apply.py` and this playbook in. `git init`; initial commit.

---

## 4. The method

### 4a. Global passes first (scripted, whole-book, mechanical-only)
High-volume, low-judgment categories done once across the whole book, each verified by diff +
spot-check and logged as a numbered pass:
- **Proper-noun consistency** — fix spelling drift to the dominant/canonical form (e.g. `Sea Erie`→`Sea Aerie`).
- **Dialogue punctuation** — terminal period before a speech tag becomes a comma inside the quote
  (`"...Sleep." he said.` → `"...Sleep," he said.`); tag verb stays lowercase. Keep `?`/`!`.
  Use a **conservative tag-verb whitelist** (said/asked/replied/whispered…). Action-prone verbs
  (breathed/returned/began) are handled per-chapter, not globally — they're often not tags.
- A common-noun or single-token normalization only when the dominant form is overwhelming and you
  have audited every occurrence (e.g. `Company`→`company`, 314 vs 20).

### 4b. Per-chapter loop (the bulk of the work)
For each chapter, in order:
1. **Read** the chapter from the edited master using the line map.
2. **Identify context-dependent fixes** (see §6 categories).
3. **Apply** via `scripts/apply.py` (§5).
4. **Verify** (§7): word-token diff vs clean master shows only intended changes; word-count parity matches.
5. **Log** to `CHANGELOG.md` (categorized, with FLAGs).
6. **Commit** per chapter or per pair/part; push; keep main clean.

### 4c. Final passes (after all chapters)
1. Whole-book word-count parity check vs clean master (expect a small net decrease from closed
   hyphenated compounds + removed duplicate words).
2. **Deferred consistency sweep** — resolve the items parked during the per-chapter loop
   (even-split compound forms, British/American variants, etc.). Decide once, normalize globally.
3. **Smart-quote typeset pass** — normalize the manuscript's mixed straight/curly quotes to uniform
   typographic quotes. **Do this only at the very end** — do NOT hand-normalize quotes per chapter.
   Use `scripts/educate_quotes.py <file>` (canonical SmartyPants `educate_quotes` rules + explicit
   archaic-elision handling for `'Tis`/`'twas`/`'em`/`'cause`/decades, which plain SmartyPants
   mis-converts to opening quotes). It de-educates curly→straight for a uniform baseline, then
   educates once. It is a pure character-class transform: it **aborts** if word/line count changes
   or any straight quote remains — run `--dry` first, then for real. Open doubles exceeding close
   doubles is normal (multi-paragraph speeches open each paragraph but close once).
4. Compile the **author flag list** (everything left for the author to decide).
5. Build the **glossary** from the now-consistent text (continuity bible; optional reader-facing appendix).

### 4d. Author delivery package (the presentation / sign-off step)
The author must be able to **see, understand, and sign off** on the edit — never ask an author to
blind-accept a wholesale replacement of their manuscript.

**Sign-off model — pick one (operator/author call):**
- **Read-only redline (implemented for *Reluctant Successions*).** Author reviews a redline (PDF +
  HTML) and replies "approved." Simplest; opens anywhere; right when the author just wants to look
  and bless it. Not interactive (no in-doc accept/reject).
- **Tracked-changes `.docx`.** Native Word revisions (`w:ins`/`w:del`); author hits *Accept All*
  (= sign-off) or rejects individual changes. More work to build (emit OOXML revision runs from a
  word-level diff, or `pandoc` CriticMarkup → docx; **verify pandoc's behavior, don't assume**).
  Reach for this only if the author wants to accept/reject change-by-change.

**Skeptic / unknown-reaction strategy — sample-first, two phases:**
Leading with a 600-page full redline reads as "you changed thousands of things in my book."
- **Phase 1:** send ONE strong chapter (the opener) three ways — *Your Original*, *After Edit*,
  *Redline* — to prove **value** (clean fixes) and **voice preservation** (the redline is ~95% the
  author's untouched black text). Bundle it (plus the glossary and the continuity to-do as bonuses)
  into a **single labeled PDF** so it is one attachment. Ask: "tell me if you want me to continue."
- **Phase 2 (on "continue"):** send the full redline + edited manuscript + author flag list + glossary.

**Implemented toolchain (all in `scripts/` + system tools):**
- `scripts/redline_html.py CLEAN EDITED START END OUT.html "Title"` — line-aligned word-diff redline
  (red strike = removed, green underline = added). **Normalizes quote-style out on both sides** so
  the redline shows only substantive edits, not the cosmetic smart-quote pass. `START END` = a line
  range (one chapter) or `1 0` for the whole book. Line-aligned because every transform preserves
  line count (fast; a whole-file token diff is O(n*m) and will hang).
- `scripts/build_reading_html.py SRC OUT.html [START END]` — clean reading HTML (markers → Part/
  Chapter headings) for "Your Original" (from clean master) and "After Edit" (from edited master).
- **HTML → PDF:** headless Chrome —
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu
  --no-pdf-header-footer --print-to-pdf=OUT.pdf "file://ABS/PATH.html"`. (No wkhtmltopdf/weasyprint/
  LaTeX needed; Chrome gives full-fidelity color.)
- **Markdown → PDF** (glossary, flag list): `pandoc -s X.md -c css --embed-resources -o tmp.html`
  then the Chrome step. **`.md` → `.docx`** (manuscript): `build_reading_html.py` then
  `pandoc -f html -t docx` (HTML route avoids pandoc mis-parsing prose, e.g. a `*`-prefixed line).
- **Merge PDFs with labeled dividers:** PyMuPDF (`fitz`) — `new_page()` + `insert_text()` for a
  divider before each section, then `insert_pdf()`. Used to build the single "Sample and Extras" PDF.

**Email draft via Gmail MCP — workflow + hard limits (learned on this project):**
- `create_draft` makes a text/HTML draft. **It CANNOT attach files to a draft, and there is NO
  edit-draft or delete-draft tool.** So: (1) finalize the body BEFORE creating (every revision is a
  new draft you must delete by hand); (2) author attaches the bundled PDF / `.docx` MANUALLY in
  Gmail; (3) set a placeholder recipient (operator's own address) and swap in the real recipient at
  send time. Never claim files were attached — they weren't.
- Provide both `body` (plain) and `htmlBody` (bold/lists). Keep the operator's prose rules (e.g. no
  em/en dashes).

**Always include, and disclose honestly:**
- **Clean edited manuscript** in `.docx`. **Formatting caveat:** if the clean master was extracted
  from PDF to `.txt`, italics/emphasis are lost — say so; offer "apply the redline to your own
  formatted master" as the alternative. Never present a flattened `.txt`/`.docx` as print-ready.
- **Author flag list** (`AUTHOR_FLAGS.md`) as the to-do; **glossary** as a bonus; optionally the style sheet.
- **Plain-English cover note** (the email body), NOT the raw CHANGELOG. State scope: **copyedit/
  line-edit**, voice-preserved, **not** developmental, **not** a third-party proofread. Give the
  before/after word count (nothing cut) and confirm the original is untouched.

All generated artifacts live in `delivery/` (tracked; only `delivery/_*.html` intermediates ignored),
with a `README.md` manifest + `Cover Email (draft).md`. See `delivery/sample/` for the Phase-1 package.

---

## 5. `apply.py` — the count-safe replace contract

`apply.py` reads a JSON list of `[old, new]` (or `[old, new, expected_count]`) pairs from stdin and
applies them to the edited master. **Each `old` must occur exactly `expected_count` (default 1)
times, or it is SKIPPED with a warning — never a silent wrong replacement.**

```bash
python3 scripts/apply.py <<'JSON'
[
  ["had insured this", "had ensured this"],
  ["reigns", "reins", 9]
]
JSON
```

Operating rules:
- Give each `old` **enough surrounding context to be unique** in the whole file (a bare `"reins"`
  will collide; `"the reigns of his horse"` won't). When a string genuinely recurs, pass the
  expected count as the 3rd element.
- A skip means your quoted context was wrong (usually capitalization or an adjacent word) — fix the
  context and rerun just that pair. Skips are the safety net working, not a failure.
- For shell safety, pipe the JSON via heredoc; for commit messages with apostrophes use
  `git commit -F <file>` (heredoc + `-m "$(...)"` breaks on apostrophes).

---

## 6. Editing categories (what to actually fix)

- **Homophones (context-dependent — verify each, never global-replace):** reins/reigns, peeked/peaked/piqued,
  berth/birth, ensured/insured, effect/affect, through/thorough, desert/dessert, draught/drought,
  canvas/canvass, waist/waste, breach/breech, from/form, barred/bared, than/that, lose/loose,
  scent/sent, scar/scare, herd/heard, scent, gait/gate, bred/bread, pale/pail, fair/fare,
  cache/catch, allude/elude, bear/bare, razed/raised, mane/mien.
- **Verb form / agreement:** dropped tense (`lead`→`led`, `manifest`→`manifested`), subject-verb
  (`images...was`→`were`), duplicate verbs (`grew traveled`→`traveled`).
- **Dropped / duplicated words:** missing articles/pronouns (`he`, `a`, `the`, `of`, `that`),
  doubled words (`in the in the`, `he saw he saw`, `an a`).
- **Compound modifiers — hyphenate before a noun:** knife-edged, blood-stained, wild-eyed,
  rock-strewn, steel-tipped, well-trained, sun-drenched, gray-haired, half-hearted, deep-set, etc.
  Leave predicate-position and `-ly` adverb pairs open. Per Chicago, leave `half brother` open.
- **Closed compounds where dominant:** moonlit, downhill, earshot, crossfire, passersby, bedroll,
  breastplate, backtrack, handmade, waterline (check the book's own dominant form first).
- **Possessives:** `horses hooves`→`horses' hooves`, `day's ride`, `arm's length`, `moment's notice`.
- **Punctuation:** clear comma splices (LIGHT touch — keep the author's rhythmic splices), missing
  terminal periods/`?`, missing closing quotes (a *dropped quote mark* is a real fix, distinct from
  quote-style normalization), serial/intro/nonrestrictive commas, sentence-boundary in dialogue tags
  (`he said, "And` → `he said. "And` when the second quoted span is a new sentence).
- **Continuity:** wrong character name in a beat, mismatched titles/objects — fix only when the
  surrounding text makes the intent unambiguous; otherwise FLAG.

---

## 7. Verification protocol (run after every chapter)

```bash
# 1. Word-token diff: every < / > pair must be an intended fix or a known global-pass change.
diff <(sed -n 'A,Bp' manuscript/<book>-clean.txt  | tr ' ' '\n') \
     <(sed -n 'A,Bp' manuscript/<book>-edited.txt | tr ' ' '\n') \
  | grep -E '^[<>]' | paste - - | grep -vE '\."	|,"$'   # filters the global dialogue-comma noise

# 2. Word-count parity for the chapter range; the delta must equal your intended net.
sed -n 'A,Bp' manuscript/<book>-clean.txt  | wc -w
sed -n 'A,Bp' manuscript/<book>-edited.txt | wc -w
```
Predict the net word-count change before checking (closed compounds −1 each, dropped-word
restorations +1 each, removed duplicates −1 each). If the observed delta doesn't match the
prediction, something unintended happened — investigate before committing. **No content is ever
lost**; the only deltas are explainable mechanical edits.

---

## 8. Consistency-decision rule

When a name/term/compound appears in more than one form, scan the **whole book** for frequency:
- **Clear dominant (e.g. 8 vs 2):** normalize to the dominant form. Fix the local instance now; if
  strays live in already-locked chapters, **defer** the global normalization to §4c rather than
  reaching back mid-stream.
- **Even split (e.g. 3 vs 3) with both valid English:** don't impose a choice mid-stream — **defer**
  to the final consistency pass and decide once.
- **Author's coinage / creature or place name:** if the author is inconsistent, **FLAG for the
  author** — don't pick for them. Fix only unambiguous typos (wrong letter order) to the dominant form.
- **Deliberate authorial choices are preserved** (e.g. a metal/mettle wordplay, an archaic spelling).
  Record them in the style sheet so they're never "corrected" later.

---

## 9. Status / reporting language

Match claims to evidence. For this work the meaningful, defensible level is **"Locally verified"**:
diff shows only intended changes + word-count parity holds. Do not call a chapter "done/perfect";
say "applied & diff-verified, parity X→Y, no content lost." Open questions go to the FLAG list, not
into silent edits.

---

## 10. Bootstrapping checklist (copy/paste for the next book)

- [ ] Source PDF in `source/`; confirmed real text layer (§1 probe)
- [ ] PyMuPDF clean master built; **ligature fidelity grep passed**; `pdftotext` output deleted
- [ ] `edited` master = copy of `clean`
- [ ] Chapter line map recorded in `RESUME_HERE.md`
- [ ] `STYLE_SHEET.md` seeded from frequency scan + project term list
- [ ] `scripts/apply.py` + this playbook copied in
- [ ] `CHANGELOG.md` started; global passes run + logged
- [ ] Per-chapter loop underway; each chapter diff-verified + parity-checked + committed
- [ ] Final: whole-book parity, deferred-consistency sweep, smart-quote pass, author flag list, glossary
- [ ] Delivery: tracked-changes `.docx` (piloted on 1 chapter first), optional PDF redline companion,
      clean manuscript with formatting caveat disclosed, plain-English cover note with scope stated
