# Prose Audit Capability - Specification (implementation-ready, paper-only)

**Status:** APPROVED design for a reusable prose-audit capability. This document is a specification.
It authorizes NO production tool build by itself. Implementation is a separately authorized phase.

**Home:** `novel-production-template` (the durable, project-neutral capability). Consumers (books,
`the-participation-effect`, blogs, future manuscripts) enable only the modules they support.
`the-war-for-paratua` is the first consumer and validation corpus, not the home of the implementation.

**Reuse contract (check-before-create):** this capability WRAPS and GENERALIZES existing assets; it does
not replace working ones or create a competing source of truth. See section I.

**Companion artifacts (this repo):**
- `schemas/prose-audit-finding.schema.json` - the Finding contract (section F).
- `schemas/prose-audit-map.schema.json` - the portable Map contract (section E).
- `fixtures/prose-audit/geography-contract-fixtures.json` - geography ground-truth fixtures.
- Pilot evidence: `the-war-for-paratua/PROSE_AUDIT_GEOGRAPHY_PILOT_2026-07-17.md`.

**Writing convention:** ASCII-only; no em or en dashes in this doc (portfolio rule). This constraint is
for the tool's own artifacts, never for manuscript prose the tool only reads.

---

## A. Capability boundaries

**Included (what the capability may do):**
- Deterministic mechanical checks (dash guard, banned-token lint, structural lints) - reusing existing
  scripts where they exist.
- Repetition and near-duplication detection (verbatim, near-duplicate, and heard-echo repeats).
- Consistency checks for characters, timeline/sequence, artifacts, locations, and terminology, against
  the project's structured canon and reviewed ledgers.
- Geography checks: terrain words, bearings, containment, adjacency, and route/mode characterization,
  against the portable map (section E).
- AI-writing-tell indicators (section H).
- Evidence-classified recommendations (section B, F). Output is findings and recommended human actions.

**Excluded (what the capability must never do):**
- Silent manuscript rewriting. The tool never edits prose. It recommends; a human edits.
- Automatic canon or map modification. The tool never writes to canon/ledgers/map.
- Unsupported declarations of literary quality ("this chapter is good/publishable").
- Treating probabilistic LLM output as verified fact (see B and G).
- Replacing human editorial judgment. Literary calls are surfaced, not decided.
- Paid-model escalation without an explicit, separately authorized policy (see G).

---

## B. Evidence states

Every finding carries exactly one evidence state. The state governs the language the finding may use.
No finding may say "verified", "confirmed", "passed", or equivalent unless it is in a state whose
requirements below are met and cited.

| State | Meaning | Required evidence |
|---|---|---|
| `VERIFIED` | The claim was checked and is consistent, OR a contradiction is deterministically proven. | A deterministic check (rule/lookup) with a named authoritative record. An LLM alone may NOT set VERIFIED; a deterministic corroboration is required. |
| `LIKELY` | A contradiction/concern is probably real but rests partly on judgment. | Named authoritative record + adjudicator rationale + confidence >= 0.5. Typical for LLM-adjudicated contradictions. |
| `NEEDS_REVIEW` | Genuinely ambiguous, or the authoritative source is silent. Defer to a human. | Named reason for ambiguity or a recorded gap in the authoritative source. Never asserts a contradiction. |
| `STALE` | The finding was computed against an input that has since changed. | Evidence of drift (source sha / mtime / text delta) vs the record the finding cited. |
| `BLOCKED` | The check cannot be completed with available inputs. | The named missing input (absent canon, no map relationship, unavailable model). Never faked into a pass. |
| `FALSE_POSITIVE_RISK` | A candidate the extractor surfaced that adjudication judges is probably NOT a real issue. | Named reason (figurative language, alias, intentional in-world exception). Recorded so the extractor can be tuned; not reported as a contradiction. |

Promotion rule: an LLM-only conclusion may be at most `LIKELY` (for a concern) or `NEEDS_REVIEW`
(for ambiguity). `VERIFIED` and a firm not-an-issue require deterministic corroboration.

**Evidence-sufficiency rule (see section J):** "not contradicted" is NOT "verified". A claim reaches a
clean/supported state only when the retrieved authority AFFIRMATIVELY supports it. Absence of
contradictory evidence, and model confidence, are never sufficient on their own.

---

## C. Modular architecture

Eight modules. Each exposes a stable input/output contract so a project can enable only what it supports.
All modules emit zero or more Findings (section F) and never mutate inputs.

| # | Module | Input contract | Output |
|---|---|---|---|
| 1 | `style-lint` | manuscript text + rule set (dash guard, banned tokens, structural lints) | Findings (module=style-lint), deterministic |
| 2 | `repetition` | manuscript text (+ optional prior-chapter corpus) | Findings (module=repetition): verbatim / near-dup / heard-echo |
| 3 | `entity-consistency` | manuscript text + structured canon (characters, names, artifacts) + ledgers | Findings (module=entity-consistency) |
| 4 | `timeline-consistency` | manuscript text + structured timeline/calendar | Findings (module=timeline-consistency) |
| 5 | `geography-consistency` | manuscript text + portable map (section E) | Findings (module=geography-consistency) |
| 6 | `ai-tell` | manuscript text + voice rules + tell indicators (section H) | Findings (module=ai-tell) |
| 7 | `adjudication` | a candidate + retrieved authoritative context | an evidence-state + confidence + rationale (section G) |
| 8 | `report` | a set of Findings | a human report + a machine-readable findings array |

Modules 1-6 are producers; module 7 is the shared adjudicator they call for anything non-deterministic;
module 8 is the sink. A pipeline runs producers, routes non-deterministic candidates through
adjudication, and hands the classified findings to report.

Standard producer contract: `run(text, context, config) -> Finding[]`. Standard adjudication contract:
`adjudicate(candidate, authoritative_context) -> { evidence_state, confidence, rationale, false_positive_risk, llm_provenance? }`.

---

## D. Source hierarchy (precedence)

When sources disagree, higher wins. An LLM-extracted claim is evidence about what the prose SAYS; it is
never promoted to canon.

1. **Structured canon** (project `canon/data/*.yaml`, operator-locked rulings).
2. **Structured map** (the portable map index, section E; derived from the authoritative map image + canon).
3. **Reviewed ledgers** (`THREADS.md`, `POV_LEDGER.md`, `ARTIFACT_LEDGER.md`, `DEFINED_LOCATIONS.md`,
   `CHARACTER_GUIDE.md`, `WORLD_BIBLE.md`, `CANON_GLOSSARY.md`).
4. **Manuscript text** (the thing under audit; the subject, not the authority).
5. **Derived indexes** (search indexes, extracted term lists).
6. **LLM-extracted claims** (what the prose asserts, per a model). Evidence about the text only.
7. **Prior audit reports** (context and dedup; never authority over 1-3).

If 1-3 are silent on a point, the correct output is `NEEDS_REVIEW`/`BLOCKED`, never a fabricated
contradiction and never an invented canon fact.

---

## E. Generalized geography schema

Defined by `schemas/prose-audit-map.schema.json`. It is a portable, project-neutral, DERIVED index of an
authoritative map (for Paratua: `canon/pages/geography/map_of_paratua.md` + the campaign map image). It
never replaces that source of truth. Design points:

- **Places** carry: `place_id`, `canonical_name`, `aliases`, `confusable_with`, `place_type`, `terrain[]`,
  `contained_by`, optional `coordinates` (grid, with `uncertainty`), `relative_bearings[]` (qualitative,
  from a reference place), `adjacency[]`, and `provenance` (source_ref + certainty).
- **Routes** carry: endpoints, `mode` (land/river/sea/mixed/air), `sea_character` (coastal vs
  open-crossing), `bearing`, `required_crossings[]`, `barriers_avoided[]`, `uncertainty`, `provenance`.
- **No false precision.** Coordinates are optional; qualitative bearings and adjacency work without them.
  Every relationship carries a certainty. `unknown` is a first-class value.
- **Confusable places** (e.g. `luthan-rise` hills vs `luthan-mts` mountains) are modeled explicitly so
  the highest-value checks (terrain-word and bearing conflation) are cheap and reliable.

Checks the geography module derives from this schema: terrain-word vs `terrain[]`; prose bearing vs
`relative_bearings`/route `bearing`; containment/adjacency violations; route mode/`sea_character`
mischaracterization (the Cirshe->Putakta "across the ocean" vs coastal-south case); missing
`required_crossings`.

---

## F. Finding schema

Defined by `schemas/prose-audit-finding.schema.json`. Every finding includes: `finding_id` (stable,
deterministic - `PA-<module>-<workkey>-<hash8>`), `module`, `severity`, `confidence`, `evidence_state`,
`location` (path/chapter/line/excerpt), `extracted_claim`, `authoritative_record` (nullable),
`concern`, `evidence_refs` (>=1), `recommended_action`, `false_positive_risk` (level + reason), and
`llm_provenance` (present iff a model participated: role, runtime, model, prompt_id, elapsed_ms,
structured_output_valid). Severity (impact) and confidence (belief) are independent axes.

---

## G. Local-first semantic adjudication

Provider-neutral interface; **Ollama is the initial local runtime** (per the portfolio local-first
mandate). The pipeline separates four concerns, each independently testable:

1. **Extraction** - pull candidate claims from prose (deterministic where possible; a local model may
   assist for fuzzy claims). Output: candidate claims with locations.
2. **Retrieval** - fetch the authoritative context for a candidate (the map/canon/ledger records it must
   be judged against). Deterministic lookup by place_id / entity / date.
3. **Adjudication** - a local model classifies the candidate against the retrieved context into an
   evidence-state + confidence + rationale + false_positive_risk. **Structured output is validated**
   against a fixed output contract; an invalid or unparseable response is `BLOCKED`, never guessed.
4. **Reporting** - assemble findings; no model writes prose or canon.

Rules:
- A local model may **classify or recommend**. It may **never** silently edit prose or canon.
- LLM-only conclusions are capped at `LIKELY`/`NEEDS_REVIEW` (section B promotion rule).
- Every model-touched finding records `llm_provenance` (runtime, model, prompt_id, elapsed_ms,
  structured_output_valid).
- **Paid escalation** (a frontier model) is a separately authorized exception for genuinely hard literary
  judgment only, logged per the local-first mandate. Not enabled by default and not required for the
  mechanical/geography modules.

---

## H. AI-writing-tell policy

Treat tells as **indicators, not proof of authorship**. The tool never asserts "this was AI-generated."
It names a textual symptom and its editing relevance. Indicators (the video's four signs plus project
rules):

1. **Overused / low-information vocabulary** (delve, tapestry, realm, meticulous, intricate, underscore,
   pivotal, beacon, multifaceted, commence, ...). Project-extensible banned/limited list.
2. **Excessive structural symmetry** (every list item / paragraph the same length and shape).
3. **Vague, sanded-down generalization** (specifics filed off; no concrete detail).
4. **Absence of concrete perspective, stakes, or distinctive voice.**

Plus existing project rules: the long-dash guard (`check_no_long_dashes.py`) and the project voice
standard (`voice.md` for Paratua; `style-guide/JOHN_LIDDY_VOICE.md` for John's nonfiction).

Anti-pattern, forbidden: simplistic scoring such as "one em dash = AI". A finding must explain the
symptom and why it matters editorially, at an honest confidence, without an authorship claim. Signs 3-4
are usually `NEEDS_REVIEW` (they require human taste); signs 1-2 and the dash guard can be deterministic.

---

## I. Integration and migration plan

**Reuse decisions (per component):**

| Existing asset (the-war-for-paratua unless noted) | Decision |
|---|---|
| `check_no_long_dashes.py`, `strip_long_dashes.py` | REUSE unchanged (wrapped by `style-lint`). |
| `check_canon.py` (canon-data validator) | REUSE unchanged; `entity-consistency` calls it as a deterministic sub-check. |
| `canon/data/*.yaml`, `canon/pages/geography/map_of_paratua.md` | REUSE as the authoritative source. The portable map (section E) is a DERIVED index of it, not a copy. No duplication. |
| Ledgers (`THREADS`, `POV_LEDGER`, `ARTIFACT_LEDGER`, `DEFINED_LOCATIONS`, `CHARACTER_GUIDE`, `WORLD_BIBLE`, `CANON_GLOSSARY`) | REUSE as reviewed-ledger sources. |
| `GEOGRAPHY_AUDIT_2026-06-16.md` | REUSE as prior-audit context + a truth source for pilot expectations. |
| `scripts/local-book-editing-audit.sh.WIP` (evidence taxonomy, deterministic envelope) | GENERALIZE. Its taxonomy and "no success word without evidence" contract become this capability's core; the Paratua WIP becomes a thin CONSUMER/adapter that calls the generalized modules with Paratua config. |
| `novel-production-template/editorial-method/EDITING_PLAYBOOK.md`, `prompts/CHAPTER_EDIT_PROMPT.md` | REUSE as the human-facing editorial method the tool's recommendations feed into. |
| Any paid third-party editor (Marlowe, AutoCrit, ...) | NOT adopted. Optional one-off external ground-truth cross-check only, per the adversarial-verify rule. |

**No competing source of truth:** canon and map data stay in the consumer repo. The capability reads
them and builds a derived index; it never forks or re-hosts them.

**Versioning + config + rollout:**
- `schema_version` on map and findings; capability semver in `package.json`.
- Per-consumer config declares: repo paths to canon/map/ledgers/manuscripts, enabled modules, the local
  model + runtime, and the banned-token list. A project enables only the modules it can source.
- **Validation gates:** schemas parse (jq) and validate (ajv where available); fixtures parse and each
  fixture's `map_context` validates against the map schema; finding ids unique; evidence_refs resolve;
  `node --test` suite green (mirrors the existing npt test convention).
- **Fixtures-first:** the geography fixtures (this repo) are the acceptance corpus. A module ships only
  when it reproduces the fixtures' expected evidence-states within the pilot's agreed tolerance.
- **Rollout stages:** (1) geography module on Paratua (highest value, best-sourced); (2) style-lint +
  repetition (mostly deterministic); (3) entity + timeline; (4) ai-tell; (5) second consumer
  (`the-participation-effect`) to prove generalization.

**Migration end-state:** the Paratua WIP audit script is retired in favor of a Paratua config + adapter
over this capability; canon/map/ledgers are untouched and remain canonical in `the-war-for-paratua`.

---

## J. Evidence-first decision contract (revision, 2026-07-17)

The v1 pilot exposed a contract defect: a model verdict of "not contradicted" was allowed to become
"consistent", even when the authoritative source was silent or insufficient. This section defines the
corrected contract. Reference implementation: `prose-audit/gate.mjs` (+ `prose-audit/gate.test.mjs`).

**Decision states** (project-neutral; the adjudication module classifies into exactly one):

| decision_state | Meaning | Evidence taxonomy (section B) |
|---|---|---|
| `CONTRADICTED` | An authoritative record directly contradicts a material component (with a resolvable reference). | `LIKELY` (LLM); `VERIFIED` only with deterministic corroboration. |
| `SUPPORTED` | Every material component is AFFIRMATIVELY supported by a resolvable authoritative record AND the source addresses the claim. | `VERIFIED`. |
| `INSUFFICIENT_EVIDENCE` | The source is silent on, or does not cover, a material part of the claim. | `NEEDS_REVIEW` (or `BLOCKED`). |
| `AMBIGUOUS` | The source addresses the claim but it admits more than one valid reading. | `NEEDS_REVIEW`. |
| `NOT_APPLICABLE` | Figurative or non-geographic language; not a checkable geographic claim. | `FALSE_POSITIVE_RISK`. |
| `ADJUDICATION_ERROR` | Malformed output, missing fields, unresolved references, or internally inconsistent authority. | `BLOCKED`. |

**The evidence-sufficiency rule:** a claim is `SUPPORTED` ONLY when the retrieved authority affirmatively
supports every material component. Absence of contradictory evidence is NOT support. Model confidence is
advisory metadata and is NEVER the gate.

**Deterministic invariants** (applied after the model, computed from STRUCTURED fields, not free text
where possible; each fails closed):

1. **Source silence.** If the authority does not address a material part of the claim
   (`source_addresses_claim=false`), the result cannot be `SUPPORTED` (-> `INSUFFICIENT_EVIDENCE`).
2. **Rationale/verdict consistency.** If the structured coverage is clean but the rationale declares
   missing/ambiguous/unverifiable evidence, downgrade a would-be `SUPPORTED` to `INSUFFICIENT_EVIDENCE`.
   Structured coverage fields are primary; the rationale scan is a secondary backstop, downgrade-only.
3. **Evidence reference.** `SUPPORTED` and `CONTRADICTED` require at least one resolvable authoritative
   reference (a place_id/route_id present in the map). A contradiction citing an invented place does not
   stand.
4. **Coverage.** Every material component is marked supported/contradicted/unresolved/not_applicable. If
   any material component is unresolved, the claim cannot be fully `SUPPORTED`.
5. **Fail closed.** Invalid JSON, missing fields, unresolved place IDs, missing authoritative records, or
   internally inconsistent fields (same reference asserted both supported and contradicted) produce
   `ADJUDICATION_ERROR`, never a clean result.
6. **Figurative language.** Nonliteral terrain/route language does not become a geographic contradiction
   without adequate contextual evidence (-> `NOT_APPLICABLE`).

This contract is model-neutral: the schema and gate encode evidence sufficiency, not any model's
behavior. The adjudicator model only fills the structured fields; the gate decides.
