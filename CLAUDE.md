# CLAUDE.md

This project treats a novel like a software repository.

## Mission

Convert the author's manuscript from source files into clean, chapter-based Markdown, then assist with editing, continuity review, and export prep for Amazon KDP.

## Rules

- Preserve the author's intent and voice
- Prefer precise edits over full rewrites
- Work chapter by chapter
- Keep every major change reviewable
- Flag ambiguity instead of guessing

## Editing Passes

1. Extraction cleanup
2. Grammar and punctuation
3. Line editing
4. Continuity pass
5. KDP preparation

## Files To Respect

- `PROJECT_RULES.md`
- `style-guide/AUTHOR_VOICE.md` (or `style-guide/JOHN_LIDDY_VOICE.md` for John Liddy's projects)
- `AMAZON_KDP.md`
- `reviews/continuity-log.md`

## Voice (For John Liddy's Projects)

When working in this repo for John Liddy's writing (books, articles, or any other form), read `style-guide/JOHN_LIDDY_VOICE.md` before making any edits or drafting any text. It is the canonical voice standard for all his written work across every surface. Voice violations are not acceptable. If a draft fails any rule in that file, rewrite it before showing it to him.

For drafting articles, use `prompts/ARTICLE_DRAFT_PROMPT.md`.
For editing book chapters, use `prompts/CHAPTER_EDIT_PROMPT.md`.

## When Unsure

Stop and ask the author a short, concrete question rather than making irreversible narrative choices.
