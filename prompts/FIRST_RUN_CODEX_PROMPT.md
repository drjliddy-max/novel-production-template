# First-Run Prompt For Codex Or Claude Code

Use this prompt on the author's computer after the private repo is cloned and the source PDF has been added to `input/`.

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
