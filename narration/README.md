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

## Status

Seeded 2026-06-24 from the operator's locked Book I canon list (41 entries) + words ear-confirmed this session (`geas`, `Atar`, the `breathe` verb forms). `ipa` fields pending the CMU-dict batch fill (local-AI task).
