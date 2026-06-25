---
type: narration-lexicon
tags: [publishing, narration, pronunciation, moc]
hub: "[[PUBLISHING]]"
status: active
---

# Pronunciation lexicon (shared, single source of truth)

`pronunciation.json` is the **one master pronunciation lexicon** for the whole publishing operation — every audiobook narration and every video narration, across every book and all future work. Confirm a word's pronunciation **once**, add it here, and it is correct **everywhere that word ever appears**.

## Why it lives here

`novel-production-template` is the shared editing + voice layer (`[[PUBLISHING]]` §2-3), already "→ all books". The narration engines are content-free and **consume** this file; they never hold their own copy. (Operator rule 2026-06-24: canon-owned lexicon, single accumulating source across all surfaces; engines consume, only add as needed.)

## How the engines use it

`voice-engine` (and the coming `video-engine`) apply it before synthesis:

```
node bin/narrate.mjs <chapter.md> --out <dir> \
  --lexicon <abs-path>/novel-production-template/narration/pronunciation.json \
  [--lexicon <work-specific-override.json>]
```

Multiple `--lexicon` files merge left to right, so a rare same-spelling collision across universes is handled by a thin per-work override; the master stays universal. Matching is **whole-word, case-sensitive**, so a master holding every confirmed word is safe to apply to any text — an entry only fires when its word is present.

## Format (rich)

Each entry carries the speakable respelling the engine uses plus reference metadata:

```json
"Aerendyl": {
  "say": "Airrendil",        // what the engine is fed (respelling; Kokoro has no phoneme input)
  "ipa": "",                  // canonical reference; future-proofs a phoneme-capable engine (e.g. video)
  "status": "locked",         // locked (canon) | confirmed (ear-confirmed) | draft (proposed)
  "note": "ER-un-dyl",        // human target-sound note
  "source": "canon: the-war-for-paratua/audiobook/book1/lexicon.json"
}
```

The engine reads only `say` and tolerates a plain string value too, so migration is gradual. The `ipa` / `note` / `status` / `source` fields are for humans, provenance, and a future phoneme engine.

## Growing the lexicon (the labor model)

- **Invented proper nouns** (Aerendyl, Nargathon, Quarlilis…): no dictionary has them — confirmed by the operator's ear / book canon only.
- **Real words** the engine mispronounces (e.g. `geas`): use the **CMU Pronouncing Dictionary** (public domain, ~134k words, ARPAbet) as a reference — local AI looks up the IPA and converts it to a respelling for one-tap operator confirm, and batch-fills the `ipa` field. Do **not** bulk-load common-word respellings (the engine already says them right; a wrong respelling breaks what works).
- **Per-book candidate pass (local-AI labor):** scan each manuscript for likely-mispronounced words (homographs, Latin/archaic/foreign terms, names), cross-check the dictionary + a test render, and pre-draft respellings for review. This is how the list grows by many words per book without hand-A/B-ing each.

### The candidate tool (local-AI drafts, operator confirms)

`voice-engine/bin/lexicon-candidates.mjs` does the candidate-pass labor. It reuses the engine's own local-AI text lane (`gpt-oss:20b` via `src/ollama.mjs`) and writes **drafts only** to a separate review file under `narration/candidates/`. It never writes `pronunciation.json`, and it never guesses a pronunciation for an invented proper noun (those are flagged `needs_operator_ear` with no respelling, because no dictionary can know how "Aerendyl" or "Quarlilis" is meant to sound).

```
# Candidate pass over a chapter (drafts -> narration/candidates/<book>-<chapter>.json)
node voice-engine/bin/lexicon-candidates.mjs \
  the-war-for-paratua/manuscripts/book1/01_coup.md \
  --lexicon novel-production-template/narration/pronunciation.json \
  --out novel-production-template/narration/candidates \
  --book paratua --chapter 01

# Add specific obscure real words to judge alongside the proper nouns
  ... --also geas,chaise,dais

# Offline safe floor: no model, just flag every new proper noun for the ear
  ... --no-llm

# Backfill IPA for master entries that have an empty ipa field (drafts only)
node voice-engine/bin/lexicon-candidates.mjs --backfill-ipa \
  --lexicon novel-production-template/narration/pronunciation.json \
  --out novel-production-template/narration/candidates
```

Each draft entry mirrors the master shape (`say` / `ipa` / `status` / `note` / `source`) plus review-only fields (`is_real_word`, `needs_operator_ear`), with `status: "draft"`. **The workflow:** run the pass, confirm the real-word respellings by ear and supply the invented-name respellings the operator's ear settles, then lift the confirmed `say`/`ipa`/`note`/`source` into `pronunciation.json` and promote `status` to `confirmed`/`locked`. The candidates file is throwaway once lifted.

## Status

Seeded 2026-06-24 from the operator's locked Book I canon list (41 entries) + words ear-confirmed this session (`geas`, `Atar`, the `breathe` verb forms). `ipa` fields pending the CMU-dict batch fill (local-AI task).
