# Task: local-AI lexicon-growth helper (reuse existing systems — do NOT build a new one)

## Goal
Wire the **local AI** into the shared pronunciation lexicon so it does the labor of *growing* it: scan a manuscript, propose pronunciation entries for words a TTS narrator would mispronounce, and fill reference metadata — all as **drafts for operator review**, never auto-applied.

## HARD RULES (read before writing any code)
1. **Do not invent, create, or duplicate systems. Reuse what exists.** Inventory first, extend second.
   - **Local-AI client (use this):** `voice-engine/src/ollama.mjs` — `generate(prompt, {model, system})`, default model **`gpt-oss:20b`**, `OLLAMA_URL` env. This is the established narration text-lane. Optionally route through the LiteLLM router at `ollama/routing/` (`:4000`) for token accounting.
   - **Lexicon logic (use this):** `voice-engine/src/lexicon.mjs` — `applyLexicon`, `lexiconCoverage`.
   - **The master lexicon (the single source — read/append here):** `novel-production-template/narration/pronunciation.json`. Rich format: `{ "Word": { "say": "<respelling>", "ipa": "", "status": "locked|confirmed|draft", "note": "", "source": "" } }`. Engine consumes `.say`. See `narration/README.md`.
2. **Local AI DRAFTS, the operator CONFIRMS.** Everything this tool emits is `status: "draft"` written to a SEPARATE review file (e.g. `narration/candidates/<book>-<chapter>.json`). It NEVER writes into `pronunciation.json` directly and NEVER promotes to `locked`/`confirmed`.
3. **Never invent a pronunciation for an invented proper noun.** The model cannot know how "Aerendyl", "Quarlilis", etc. are meant to sound. For any word the model does not recognize as a real word, it must output `needs_operator_ear: true` with NO guessed respelling — only flag it. It may draft respellings/IPA only for **real** words it genuinely knows (e.g. `geas`, Latin/archaic/foreign terms).
4. **Do not bulk-load common words.** Only propose entries for words likely mispronounced AND not already in the master. The engine already says ordinary words correctly; a wrong respelling breaks what works.
5. Follow the repo's existing conventions and gates: if you add code to `voice-engine`, it is Node ESM, **zero runtime deps**, must pass `npm test` + `guard:deps`/`guard:em-dash`/`guard:no-media`, and land via **PR + green CI** (protected main). No em/en dashes in authored files there.

## Behavior
Two modes (one small tool, reusing the above — likely a new `voice-engine/bin/lexicon-candidates.mjs` that imports `src/ollama.mjs` + `src/lexicon.mjs`, OR a Python script in `narration/` if you prefer that repo's pipeline — pick the smaller footprint, do not duplicate the ollama client):

1. **Candidate pass** — input: a manuscript `.md` path + the master lexicon. Extract candidate words NOT already in the master (proper-noun signal: capitalized mid-sentence; plus obvious homographs/foreign terms). Ask local AI to, per candidate, return strict JSON: `{ word, is_real_word, respelling_if_real, ipa_if_real, reason, needs_operator_ear }`. Write a review file of drafts. Print a summary (N candidates, M real-word drafts, K needing the operator's ear).
2. **IPA backfill** — for existing master entries with empty `ipa` that are real words, fill `ipa` (draft) from the **CMU Pronouncing Dictionary** (public domain, ~134k, ARPAbet→IPA) and/or local AI. Output a review file; do not write the master directly.

## Acceptance
- Reuses `ollama.mjs` (gpt-oss:20b) — no second local-AI client created.
- Emits drafts to a review file; `pronunciation.json` untouched by the tool.
- On `the-war-for-paratua/manuscripts/book1/01_coup.md`: correctly flags the invented names as `needs_operator_ear` (no guessed respellings) and, if any real obscure word is present, drafts a respelling for it.
- Tests for the pure parts (candidate extraction, JSON parsing) pass; CI green if in voice-engine.
- Documented in `narration/README.md` (the growth workflow section).

## Context to read first
- `novel-production-template/narration/README.md` (the lexicon doctrine + format).
- Memory/feedback: the lexicon is canon-owned, single accumulating source across all books + audio + video; engines consume, only add as needed.
- `Projects/ollama/LOCAL_AI_OPERATING_SYSTEM.md` (local-AI doctrine: bounded worker, evidence-first, human confirmation).
