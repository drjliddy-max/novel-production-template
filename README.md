# Novel Production Template

This repository turns an unpublished novel from a source PDF into an editable, reviewable, exportable manuscript pipeline.

## What This Repo Is For

- Keep the original manuscript source safe in `input/`
- Convert the book into chapter-based Markdown in `manuscript/chapters/`
- Review AI edits as diffs in Git
- Track voice, continuity, and publishing requirements in project files
- Export clean HTML and DOCX builds for review and Amazon KDP preparation

## Scope

The full PDF-to-KDP pipeline is novel-specific. The voice and editorial pieces (`style-guide/` and `prompts/`) are reusable across all of John Liddy's written work, including:

- Books (long-form, full pipeline)
- Blog articles (short-form, voice-aware drafting)
- Book chapters being edited (pass-based editing)
- Outreach copy and emails

For voice rules, read [`style-guide/JOHN_LIDDY_VOICE.md`](style-guide/JOHN_LIDDY_VOICE.md). It is the canonical source of truth for John's writing voice across every form.

For drafting a new article, use [`prompts/ARTICLE_DRAFT_PROMPT.md`](prompts/ARTICLE_DRAFT_PROMPT.md).

For editing a book chapter, use [`prompts/CHAPTER_EDIT_PROMPT.md`](prompts/CHAPTER_EDIT_PROMPT.md).

## Recommended Tools

- `git`
- VS Code
- Codex and/or Claude Code
- `pandoc`
- `pdftotext`
- `python3`

## Repository Layout

```text
input/                  original source files, including the author's PDF
manuscript/
  chapters/             chapter source files in Markdown
  front-matter/         title page, copyright, dedication, etc.
  back-matter/          acknowledgements, about the author, etc.
output/                 generated HTML and DOCX exports
prompts/                reusable prompts for AI-assisted editing
reviews/                chapter review notes and change logs
scripts/                import and build scripts
style-guide/            author voice and editorial guidance
support/                extracted text and working notes
```

## Day One Setup

1. Put the source PDF into `input/` and rename it to something clear like `original-manuscript.pdf`.
2. Run `scripts/extract_pdf.sh input/original-manuscript.pdf`.
3. Review the files generated in `manuscript/chapters/`.
4. Fill in `style-guide/AUTHOR_VOICE.md` and `PROJECT_RULES.md`.
5. Start AI editing one chapter at a time.
6. Run `scripts/build_manuscript.sh` to generate review exports in `output/`.

## Editorial Workflow

Use small, reviewable passes instead of asking the AI to rewrite the whole novel at once.

Recommended passes:

1. Extraction cleanup
2. Grammar and punctuation
3. Line edit for clarity and rhythm
4. Consistency and continuity
5. Amazon KDP formatting prep
6. Final human approval

## Git Workflow

- Commit after each meaningful pass
- Use branches for larger experiments
- Review AI changes as diffs before accepting them
- Keep the source PDF unchanged after import

## First Prompt

Open `prompts/FIRST_RUN_CODEX_PROMPT.md` on the author's machine and paste it into Codex or Claude Code to kick off the repo setup and first editing pass.

## Start Here

For the full operator guide, open:

- `SETUP_AND_HANDOFF.md` for workstation and repo setup
- `FULL_PUBLISHING_PIPELINE.md` for the end-to-end book workflow
- `KDP_TITLE_SETUP_WORKSHEET.md` for Amazon KDP form preparation
- `AUTOMATION_GUIDE.md` for one-command Mac setup and automation boundaries
- `SESSION_ZERO_CHECKLIST.md` for the live onboarding session
- `KDP_SUBMISSION_CHECKLIST.md` for the final Amazon upload session
- `BOOK_METADATA_TEMPLATE.md` for title, description, keywords, and author bio prep
- `COVER_REQUIREMENTS.md` for print and ebook cover decisions
- `PUBLISH_TEMPLATE.md` for publishing this repo to GitHub
- `prompts/FRIEND_ARRIVAL_PROMPT.md` for the copy-paste Codex setup prompt on the author's Mac
