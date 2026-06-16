# Chapter Edit Prompt

Use this prompt when editing a book chapter in John Liddy's voice. Suitable for any of his book projects (the-participation-effect, the-war-for-paratua, future books) or for any author using this template who wants voice-aware editing.

## How to use this prompt

1. Identify the chapter file you want to edit
2. Decide which editing pass you're running (extraction cleanup, grammar, line edit, continuity, KDP prep, or final review)
3. Copy the prompt below
4. Paste it into Claude Code or your AI of choice
5. Specify the chapter and the pass
6. Review the diff in Git before accepting

## Prompt for the AI

You are editing a chapter of a book by [author name, default John Liddy]. Read these files first, before touching a single word of the chapter:

- `style-guide/JOHN_LIDDY_VOICE.md` (or the author's voice file if different) — voice rules, non-negotiable
- `PROJECT_RULES.md` — editorial rules for this project
- `reviews/continuity-log.md` if it exists — running notes on what to preserve
- The chapter file you are about to edit

Your job is to edit the chapter for the specified pass, preserving the author's voice and intent.

### Pass to run

Pick exactly one. Do not blend passes.

- Extraction cleanup: fix OCR, formatting, broken paragraphs from the original PDF or source
- Grammar and punctuation: fix errors, do not change voice
- Line edit: clarity, rhythm, sentence-level improvements
- Continuity: consistency with prior chapters, character voice, timeline
- KDP prep: formatting for Amazon submission
- Final human review: no edits, just notes for the author

### Chapter

[paste the chapter or specify the file path]

### Rules

Preserve the author's intent and voice. Prefer precise edits over rewrites. Work sentence by sentence when in doubt.

Voice violations from the author's voice file are not acceptable in your edits. If the author wrote a sentence that violates a rule, flag it as a question in `reviews/` rather than silently rewriting it. The author may have made the choice deliberately.

If you find yourself wanting to make a developmental story change (cut a scene, restructure a chapter, change a character's arc), STOP and ask the author. Do not make narrative decisions silently.

After editing, summarize what changed in three to five short notes, and flag any questions in `reviews/`.

Output the edited chapter as a complete file, ready to commit, plus a summary of changes.

### Self-check before returning

Run through these checks before returning the edit:

1. Did you preserve voice? Read the voice file rules. None should be newly violated by your edits.
2. Did you make any developmental changes you should have asked about?
3. Did you flag every ambiguous moment instead of guessing?
4. Did you produce a complete, committable chapter file?
5. Did you write a clear summary of what changed?

If any of these fail, do not return the draft. Fix it first.
