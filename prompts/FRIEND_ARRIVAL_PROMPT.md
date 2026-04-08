# Friend Arrival Prompt

Paste this into Codex on the author's Mac.

Use it after the author has the `novel-production-template` folder available locally and the manuscript PDF is on the Desktop.

```text
You are setting up my Mac for a complete AI-assisted novel editing and Amazon KDP publishing workflow.

Context:
- I am on a Mac.
- My manuscript currently exists as a PDF on my Desktop.
- I want a private GitHub repo for my book.
- I want this treated like a software project with Git, project files, prompts, scripts, exports, and reviewable changes.
- I want the setup to pause only when human login, authorization, legal, billing, or other account actions are required.
- I want to use Codex as the primary setup/tooling agent, and Claude Code may also be installed as an optional secondary tool.

Your job is to guide and execute the full setup in order.

Please do the following:

1. Inspect the local `novel-production-template` folder and confirm the key setup files are present.
2. Use the guided setup workflow in `scripts/guided_setup.sh` if available.
3. For each step:
   - execute everything that can be automated
   - pause clearly for any human-required steps
   - after each pause, continue to the next step
4. Ensure the machine has the required tools installed:
   - Homebrew
   - git
   - pandoc
   - poppler / pdftotext
   - python3
   - node
   - GitHub CLI
   - VS Code
   - Codex
   - Claude Code if possible
5. Ensure `~/Desktop/Projects` exists as the main workspace for this and future books.
6. Help create or sign in to GitHub, then create a new private repository for this book from the public `novel-production-template` GitHub template.
7. Clone the new private repo into `~/Desktop/Projects`.
8. Open the cloned repo in VS Code.
9. Help me sign in to Codex, and optionally Claude Code.
10. Find the manuscript PDF on my Desktop and move or copy it into the cloned repo as `input/original-manuscript.pdf` without modifying the original.
11. Read these files before editing:
   - README.md
   - SETUP_AND_HANDOFF.md
   - FULL_PUBLISHING_PIPELINE.md
   - PROJECT_RULES.md
   - AMAZON_KDP.md
   - AGENTS.md
   - CLAUDE.md
   - style-guide/AUTHOR_VOICE.md
12. Import the PDF into editable chapter Markdown files using the repo scripts.
13. If chapter splitting is imperfect, normalize the chapter files without changing story meaning beyond extraction cleanup.
14. Create or update any missing working files in `reviews/`, `support/`, and metadata docs as needed.
15. Perform the first editorial pass on the first 1-2 chapters only:
   - fix OCR and extraction problems
   - fix grammar and punctuation
   - preserve my voice
   - note unclear or risky passages separately
16. Build manuscript exports and verify that HTML and DOCX files are generated successfully.
17. Summarize:
   - what was installed
   - what repo was created
   - what files were imported
   - what edits were made
   - what still requires my human attention
18. Commit the setup and first-pass changes in sensible Git commits if appropriate.

Important working rules:
- Do not overwrite the original manuscript PDF on my Desktop.
- Treat the chapter Markdown files as the source of truth after import.
- Keep edits reviewable and Git-friendly.
- Ask before making developmental plot changes.
- Be conservative and accurate around Amazon KDP AI disclosure, rights, and metadata decisions.
- Use the docs in this repo as the operational guide.

If any step is blocked by authentication or account creation, stop at that step, explain exactly what I need to do, and continue immediately after I confirm it is complete.
```
