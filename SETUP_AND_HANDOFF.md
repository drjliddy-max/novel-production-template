# Setup And Handoff Guide

This is the single reference document for turning an author's source PDF into a working AI-assisted editing and Amazon KDP release pipeline.

Use this guide when setting up the workflow for a friend or client on their own Mac.

## Goal

By the end of setup, the author should have:

- a GitHub account
- a private GitHub repository for their book
- a local project folder on their Mac
- VS Code installed and working
- Codex installed and ready
- Claude Code installed as an optional second tool
- the source PDF safely stored in the repo
- editable chapter Markdown files generated from the PDF
- a repeatable editing and export pipeline for Amazon KDP

## Repo Strategy

Use two repositories:

1. `novel-production-template`
   - public
   - contains reusable workflow, scripts, and instructions
   - should be marked as a GitHub template repository

2. the author's actual book repo
   - private
   - created from the template
   - contains the author's manuscript and working files

Do not put the author's unpublished manuscript in a public repository.

## Template Repo Location

The local template repo is here:

[`/Users/johnliddy/Desktop/Projects/novel-production-template`](/Users/johnliddy/Desktop/Projects/novel-production-template)

Key files:

- [`README.md`](/Users/johnliddy/Desktop/Projects/novel-production-template/README.md)
- [`FULL_PUBLISHING_PIPELINE.md`](/Users/johnliddy/Desktop/Projects/novel-production-template/FULL_PUBLISHING_PIPELINE.md)
- [`KDP_TITLE_SETUP_WORKSHEET.md`](/Users/johnliddy/Desktop/Projects/novel-production-template/KDP_TITLE_SETUP_WORKSHEET.md)
- [`AUTOMATION_GUIDE.md`](/Users/johnliddy/Desktop/Projects/novel-production-template/AUTOMATION_GUIDE.md)
- [`SESSION_ZERO_CHECKLIST.md`](/Users/johnliddy/Desktop/Projects/novel-production-template/SESSION_ZERO_CHECKLIST.md)
- [`KDP_SUBMISSION_CHECKLIST.md`](/Users/johnliddy/Desktop/Projects/novel-production-template/KDP_SUBMISSION_CHECKLIST.md)
- [`BOOK_METADATA_TEMPLATE.md`](/Users/johnliddy/Desktop/Projects/novel-production-template/BOOK_METADATA_TEMPLATE.md)
- [`COVER_REQUIREMENTS.md`](/Users/johnliddy/Desktop/Projects/novel-production-template/COVER_REQUIREMENTS.md)
- [`PROJECT_RULES.md`](/Users/johnliddy/Desktop/Projects/novel-production-template/PROJECT_RULES.md)
- [`AMAZON_KDP.md`](/Users/johnliddy/Desktop/Projects/novel-production-template/AMAZON_KDP.md)
- [`AGENTS.md`](/Users/johnliddy/Desktop/Projects/novel-production-template/AGENTS.md)
- [`CLAUDE.md`](/Users/johnliddy/Desktop/Projects/novel-production-template/CLAUDE.md)
- [`prompts/FIRST_RUN_CODEX_PROMPT.md`](/Users/johnliddy/Desktop/Projects/novel-production-template/prompts/FIRST_RUN_CODEX_PROMPT.md)
- [`scripts/extract_pdf.sh`](/Users/johnliddy/Desktop/Projects/novel-production-template/scripts/extract_pdf.sh)
- [`scripts/build_manuscript.sh`](/Users/johnliddy/Desktop/Projects/novel-production-template/scripts/build_manuscript.sh)
- [`scripts/bootstrap_mac.sh`](/Users/johnliddy/Desktop/Projects/novel-production-template/scripts/bootstrap_mac.sh)
- [`scripts/guided_setup.sh`](/Users/johnliddy/Desktop/Projects/novel-production-template/scripts/guided_setup.sh)

## Phase 1: Before The Author Arrives

### 1. Publish the template repo

Create a new public GitHub repository named `novel-production-template`.

Then push the local template repo:

```bash
cd /Users/johnliddy/Desktop/Projects/novel-production-template
git add .
git commit -m "Initial novel production template"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/novel-production-template.git
git push -u origin main
```

After pushing, go to GitHub and enable the repository's template setting.

### 2. Keep this checklist available

Have these ready:

- the GitHub URL of the public template repo
- the author's source PDF
- the first-run prompt from [`prompts/FIRST_RUN_CODEX_PROMPT.md`](/Users/johnliddy/Desktop/Projects/novel-production-template/prompts/FIRST_RUN_CODEX_PROMPT.md)
- this handoff document

## Phase 2: On The Author's Mac

### 1. Create a projects folder

Create a long-term workspace:

```text
~/Desktop/Projects/
```

Recommended structure:

```text
~/Desktop/Projects/
  current-book/
  future-book-2/
  future-book-3/
```

### 2. Set up GitHub

If the author does not already have a GitHub account:

1. Sign up at [github.com](https://github.com/)
2. Verify the account
3. Sign in through the browser

If desired, also configure Git locally:

```bash
git config --global user.name "Author Name"
git config --global user.email "author@example.com"
```

### 3. Install VS Code

Install from:

[Visual Studio Code](https://code.visualstudio.com/)

After installation:

- open VS Code once
- allow requested permissions if macOS prompts for them

### 4. Install Homebrew if needed

Check whether Homebrew exists:

```bash
brew --version
```

If it is not installed, install it from:

[Homebrew](https://brew.sh/)

### 5. Install command-line tools

Install the core tools:

```bash
brew install git pandoc poppler python node
brew install --cask visual-studio-code
```

Notes:

- `poppler` provides `pdftotext`
- `pandoc` builds DOCX and HTML exports
- `node` is needed for Codex and Claude Code CLI installs

### 6. Install Codex

Install Codex with npm:

```bash
npm install -g @openai/codex
```

Then authenticate as needed on the author's machine.

### 7. Install Claude Code

Install Claude Code:

```bash
npm install -g @anthropic-ai/claude-code
```

Then authenticate if the author wants Claude Code available too.

### 8. Create the author's private book repo from the template

In the browser:

1. Open the public `novel-production-template` repo
2. Click `Use this template`
3. Create a new repository under the author's GitHub account
4. Make the new repository `Private`

### 9. Clone the author's private repo locally

From `~/Desktop/Projects`:

```bash
cd ~/Desktop/Projects
git clone https://github.com/AUTHOR-USERNAME/AUTHOR-BOOK-REPO.git
cd AUTHOR-BOOK-REPO
```

### 10. Add the manuscript PDF

Place the author's source manuscript PDF into:

```text
input/
```

Recommended filename:

```text
input/original-manuscript.pdf
```

Do not overwrite this file later. Keep it as the source artifact.

### 11. Open the repo in VS Code

From the repo root:

```bash
code .
```

If the `code` command is not yet installed, use VS Code's command palette and run:

`Shell Command: Install 'code' command in PATH`

## Phase 3: First Codex Session

### First-run prompt

Paste this into Codex or Claude Code:

```text
This repository is my novel production workspace. Help me turn the source PDF in input/ into a full editing and release pipeline for Amazon KDP.

Please do the following in order:

1. Inspect the repository structure and confirm the working files.
2. Find the source PDF in input/ and import it into editable Markdown chapter files using the provided scripts.
3. If chapter splitting is imperfect, normalize the chapter files without changing the wording beyond extraction cleanup.
4. Read PROJECT_RULES.md, style-guide/AUTHOR_VOICE.md, AMAZON_KDP.md, AGENTS.md, and CLAUDE.md before editing.
5. Create any missing working notes in reviews/ and support/.
6. Begin the first editing pass on the first 1-2 chapters only:
   - fix OCR or extraction issues
   - fix grammar and punctuation
   - preserve my voice
   - note any unclear passages separately
7. Summarize what changed and identify any questions for me before continuing to more chapters.
8. After the first pass, run the manuscript build script and verify that HTML and DOCX exports are generated.

Treat this like a software project:
- use Git-friendly, reviewable edits
- do not overwrite the original PDF
- keep chapter files as the source of truth
- ask before making developmental story changes
```

## Phase 4: Same-Day Outcome

The target outcome for the first session is:

1. the PDF is stored in `input/`
2. extracted text is saved in `support/raw/`
3. chapter files exist in `manuscript/chapters/`
4. author voice notes exist in `style-guide/AUTHOR_VOICE.md`
5. the first 1-2 chapters have gone through the initial cleanup pass
6. export files are generated in `output/`
7. the repo is committed and pushed to the author's private GitHub repository

## Suggested First Commit Sequence

After the initial import:

```bash
git add .
git commit -m "Import manuscript PDF and initial chapter extraction"
git push
```

After the first editing pass:

```bash
git add .
git commit -m "First editorial cleanup pass on opening chapters"
git push
```

## Recommended Ongoing Workflow

Use AI in passes, not as a one-shot rewrite.

Recommended sequence:

1. extraction cleanup
2. grammar and punctuation
3. line editing for clarity and rhythm
4. continuity and consistency review
5. export cleanup for KDP
6. final human review

Keep each pass small enough to review in Git.

## Tool Roles

Recommended use:

- Codex
  - repo setup
  - file organization
  - scripts
  - manuscript import and build flow
  - structured editing passes

- Claude Code
  - optional second opinion on prose edits
  - chapter-level editing passes
  - alternate editorial suggestions

Using both is fine as long as the repo files remain the source of truth.

## Important Constraints

- The manuscript source of truth becomes the Markdown chapters after import, not the PDF
- The original PDF should remain unchanged
- Do not publish the actual manuscript in a public repository
- Review all AI edits before treating them as final
- Be conservative with Amazon KDP AI disclosure questions

## Amazon KDP Notes

As of April 8, 2026:

- AI-assisted editing is generally treated differently from AI-generated content
- if the model creates substantial original text, review KDP disclosure questions carefully during upload
- print and ebook exports should be reviewed separately before submission

Use [`AMAZON_KDP.md`](/Users/johnliddy/Desktop/Projects/novel-production-template/AMAZON_KDP.md) as the working checklist.

## Troubleshooting

### `pdftotext` not found

Install `poppler`:

```bash
brew install poppler
```

### `pandoc` not found

Install `pandoc`:

```bash
brew install pandoc
```

### `codex` not found

Install Codex:

```bash
npm install -g @openai/codex
```

### `claude` not found

Install Claude Code:

```bash
npm install -g @anthropic-ai/claude-code
```

### VS Code `code` command not found

Install it from inside VS Code with:

`Shell Command: Install 'code' command in PATH`

## Official References

- [OpenAI Codex get started](https://openai.com/codex/get-started/)
- [OpenAI Codex CLI getting started](https://help.openai.com/en/articles/11096431-openai-codex-cli-getting-started?_bhlid=0d9d0d1e74d790e7361f4b02f89f8d868e0a398a)
- [OpenAI Codex app](https://openai.com/index/introducing-the-codex-app/)
- [Claude Code setup](https://docs.anthropic.com/en/docs/claude-code/getting-started)
- [Visual Studio Code](https://code.visualstudio.com/)
- [GitHub](https://github.com/)
- [Homebrew](https://brew.sh/)
- [Amazon KDP manuscript formatting](https://kdp.amazon.com/help?topicId=G200645680)
- [Amazon KDP print submission guidelines](https://kdp.amazon.com/en_US/help/topic/G201857950)
- [Amazon KDP content guidelines](https://kdp.amazon.com/en_US/help/topic/G200672390)
