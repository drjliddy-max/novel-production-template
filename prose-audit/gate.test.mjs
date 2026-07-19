// gate.test.mjs - deterministic invariant tests for the evidence-first adjudication gate.
//
// Proves two defects are corrected and every invariant fails closed:
// (1) "not contradicted" can never become SUPPORTED (evidence-first);
// (2) a resolvable-but-IRRELEVANT reference cannot make an invented/absent entity CONTRADICTED
//     (evidence-reference relevance / entity presence).
// Synthetic model outputs are fed directly to the pure gate (no live model): fast and reproducible.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gate, toEvidenceState, resolveEntity, refRelevant, buildIndex } from './gate.mjs';

// Map with names + aliases so the gate can resolve claimed entities deterministically. "the Luthans" is
// a shared alias of two places (rise + mts) on purpose.
const MAP = {
  places: [
    { place_id: 'cirshe', canonical_name: 'Cirshe', aliases: [] },
    { place_id: 'luthan-rise', canonical_name: 'Luthan Rise', aliases: ['Luthan Hills', 'the Luthans'] },
    { place_id: 'luthan-mts', canonical_name: 'Luthan Mts', aliases: ['Luthan Mountains', 'the Luthans'] },
    { place_id: 'putakta', canonical_name: 'Putakta', aliases: [] },
    { place_id: 'fort-luthan', canonical_name: 'Fort Luthan', aliases: [], contained_by: 'luthan-rise' },
  ],
  routes: [
    { route_id: 'cirshe-putakta-sea', from_place: 'cirshe', to_place: 'putakta' },
    { route_id: 'great-western-road', name: 'great-western-road', from_place: 'cirshe', to_place: 'fort-luthan' },
  ],
};
// A well-formed model output; a supported/contradicted component carries an `entity` (required now).
const out = (o = {}) => ({
  claim_components: [{ component: 'x', status: 'supported', entity: 'Luthan Rise', evidence_ref: 'luthan-rise', note: '' }],
  source_addresses_claim: true, figurative: false, ambiguous: false, confidence: 0.9, rationale: 'the map supports this',
  ...o,
});
const decide = (o) => gate(o, MAP).decision_state;

// ---- evidence-first invariants (defect 1) ----
test('affirmative support (entity resolves + relevant ref) -> SUPPORTED', () => { assert.equal(decide(out()), 'SUPPORTED'); });
test('INV source-silence: source does not address claim -> INSUFFICIENT_EVIDENCE', () => { assert.equal(decide(out({ source_addresses_claim: false })), 'INSUFFICIENT_EVIDENCE'); });
test('INV rationale/verdict mismatch -> INSUFFICIENT_EVIDENCE', () => { assert.equal(decide(out({ rationale: 'The map does not specify this, leaving it unverifiable.' })), 'INSUFFICIENT_EVIDENCE'); });
test('INV evidence-reference: supported with null evidence_ref -> INSUFFICIENT_EVIDENCE', () => { assert.equal(decide(out({ claim_components: [{ status: 'supported', entity: 'Luthan Rise', evidence_ref: null }] })), 'INSUFFICIENT_EVIDENCE'); });
test('INV coverage: one supported + one unresolved -> INSUFFICIENT_EVIDENCE', () => { assert.equal(decide(out({ claim_components: [{ status: 'supported', entity: 'Luthan Rise', evidence_ref: 'luthan-rise' }, { status: 'unresolved', evidence_ref: null }] })), 'INSUFFICIENT_EVIDENCE'); });
test('INV fail-closed: null -> ADJUDICATION_ERROR', () => { assert.equal(decide(null), 'ADJUDICATION_ERROR'); });
test('INV fail-closed: missing claim_components -> ADJUDICATION_ERROR', () => { assert.equal(gate({ source_addresses_claim: true, figurative: false }, MAP).decision_state, 'ADJUDICATION_ERROR'); });
test('INV fail-closed: bad component status -> ADJUDICATION_ERROR', () => { assert.equal(decide(out({ claim_components: [{ status: 'maybe', entity: 'Cirshe', evidence_ref: 'cirshe' }] })), 'ADJUDICATION_ERROR'); });
test('INV fail-closed: missing boolean fields -> ADJUDICATION_ERROR', () => { assert.equal(gate({ claim_components: [{ status: 'supported', entity: 'Cirshe', evidence_ref: 'cirshe' }] }, MAP).decision_state, 'ADJUDICATION_ERROR'); });
test('INV figurative -> NOT_APPLICABLE', () => { assert.equal(decide(out({ figurative: true, claim_components: [{ status: 'not_applicable', evidence_ref: null }] })), 'NOT_APPLICABLE'); });
test('contradiction with resolvable+relevant ref -> CONTRADICTED', () => { assert.equal(decide(out({ claim_components: [{ status: 'contradicted', entity: 'Luthan Mts', evidence_ref: 'luthan-mts' }] })), 'CONTRADICTED'); });
test('conflicting authority (same ref supported+contradicted) -> ADJUDICATION_ERROR', () => { assert.equal(decide(out({ claim_components: [{ status: 'supported', entity: 'Putakta', evidence_ref: 'putakta' }, { status: 'contradicted', entity: 'Putakta', evidence_ref: 'putakta' }] })), 'ADJUDICATION_ERROR'); });
test('high-confidence-unsupported: 0.95 but source silent -> INSUFFICIENT_EVIDENCE', () => { assert.equal(decide(out({ confidence: 0.95, source_addresses_claim: false })), 'INSUFFICIENT_EVIDENCE'); });
test('low-confidence-correct: 0.2 but contradicted+relevant -> CONTRADICTED', () => { assert.equal(decide(out({ confidence: 0.2, claim_components: [{ status: 'contradicted', entity: 'Luthan Mts', evidence_ref: 'luthan-mts' }] })), 'CONTRADICTED'); });
test('genuine reading ambiguity -> AMBIGUOUS', () => { assert.equal(decide(out({ ambiguous: true, claim_components: [{ status: 'unresolved', evidence_ref: 'cirshe-putakta-sea' }] })), 'AMBIGUOUS'); });
test('compound: one supported + one contradicted (both relevant) -> CONTRADICTED', () => { assert.equal(decide(out({ claim_components: [{ status: 'supported', entity: 'Fort Luthan', evidence_ref: 'fort-luthan' }, { status: 'contradicted', entity: 'Putakta', evidence_ref: 'cirshe-putakta-sea' }] })), 'CONTRADICTED'); });
test('decision -> evidence-taxonomy mapping', () => {
  assert.equal(toEvidenceState('CONTRADICTED'), 'LIKELY');
  assert.equal(toEvidenceState('SUPPORTED'), 'VERIFIED');
  assert.equal(toEvidenceState('INSUFFICIENT_EVIDENCE'), 'NEEDS_REVIEW');
  assert.equal(toEvidenceState('AMBIGUOUS'), 'NEEDS_REVIEW');
  assert.equal(toEvidenceState('NOT_APPLICABLE'), 'FALSE_POSITIVE_RISK');
  assert.equal(toEvidenceState('ADJUDICATION_ERROR'), 'BLOCKED');
});

// ---- evidence-reference relevance / entity presence (defect 2) ----
const idx = buildIndex(MAP);

test('resolveEntity: name/alias/absent/shared', () => {
  assert.deepEqual(resolveEntity('Luthan Rise', idx), ['luthan-rise']);
  assert.deepEqual(resolveEntity('Luthan Mountains', idx), ['luthan-mts']); // alias
  assert.deepEqual(resolveEntity('Zarnuth', idx), []);                       // absent
  assert.equal(resolveEntity('the Luthans', idx).length, 2);                 // shared alias
});
test('refRelevant: self / route-endpoint / containment / irrelevant', () => {
  assert.equal(refRelevant('putakta', 'putakta', idx), true);
  assert.equal(refRelevant('putakta', 'cirshe-putakta-sea', idx), true);     // route endpoint
  assert.equal(refRelevant('fort-luthan', 'luthan-rise', idx), true);        // containment
  assert.equal(refRelevant('putakta', 'fort-luthan', idx), false);           // irrelevant
});

test('CAT invented entity + resolvable UNRELATED ref -> not CONTRADICTED, INSUFFICIENT_EVIDENCE', () => {
  assert.equal(decide(out({ source_addresses_claim: false, claim_components: [{ status: 'contradicted', entity: 'Zarnuth', evidence_ref: 'cirshe' }] })), 'INSUFFICIENT_EVIDENCE');
});
test('CAT invented entity + HIGH confidence -> still INSUFFICIENT_EVIDENCE (confidence advisory)', () => {
  assert.equal(decide(out({ confidence: 0.99, source_addresses_claim: false, claim_components: [{ status: 'contradicted', entity: 'Zarnuth', evidence_ref: 'cirshe' }] })), 'INSUFFICIENT_EVIDENCE');
});
test('CAT known entity + IRRELEVANT ref -> fails closed (INSUFFICIENT_EVIDENCE)', () => {
  assert.equal(decide(out({ claim_components: [{ status: 'supported', entity: 'Putakta', evidence_ref: 'fort-luthan' }] })), 'INSUFFICIENT_EVIDENCE');
});
test('CAT known entity + directly relevant SUPPORTING ref -> SUPPORTED', () => {
  assert.equal(decide(out({ claim_components: [{ status: 'supported', entity: 'Putakta', evidence_ref: 'putakta' }] })), 'SUPPORTED');
});
test('CAT known entity + directly relevant CONTRADICTORY ref -> CONTRADICTED', () => {
  assert.equal(decide(out({ claim_components: [{ status: 'contradicted', entity: 'Luthan Mts', evidence_ref: 'luthan-mts' }] })), 'CONTRADICTED');
});
test('CAT unambiguous ALIAS resolves -> relevant evidence accepted (CONTRADICTED)', () => {
  assert.equal(decide(out({ claim_components: [{ status: 'contradicted', entity: 'Luthan Mountains', evidence_ref: 'luthan-mts' }] })), 'CONTRADICTED');
});
test('CAT shared/ambiguous ALIAS -> AMBIGUOUS (defer, not guess or error)', () => {
  assert.equal(decide(out({ claim_components: [{ status: 'contradicted', entity: 'the Luthans', evidence_ref: 'luthan-mts' }] })), 'AMBIGUOUS');
});
test('CAT compound: only one component has relevant evidence -> not fully SUPPORTED', () => {
  assert.equal(decide(out({ claim_components: [{ status: 'supported', entity: 'Luthan Rise', evidence_ref: 'luthan-rise' }, { status: 'supported', entity: 'Zarnuth', evidence_ref: 'cirshe' }] })), 'INSUFFICIENT_EVIDENCE');
});
test('CAT source-silent entity -> INSUFFICIENT_EVIDENCE', () => {
  assert.equal(decide(out({ source_addresses_claim: false, claim_components: [{ status: 'unresolved', evidence_ref: null }] })), 'INSUFFICIENT_EVIDENCE');
});
test('CAT malformed/missing relevance metadata (no entity on a decisive component) -> fail closed', () => {
  assert.equal(decide(out({ claim_components: [{ status: 'contradicted', evidence_ref: 'luthan-mts' }] })), 'INSUFFICIENT_EVIDENCE');
});
test('legit contradiction unaffected: entity + relevant ref still CONTRADICTED even if source_addresses false-ish', () => {
  // A real contradiction (Luthan Mts placed south) stands on relevant evidence regardless of the silence flag.
  assert.equal(decide(out({ source_addresses_claim: false, claim_components: [{ status: 'contradicted', entity: 'Luthan Mts', evidence_ref: 'luthan-mts' }] })), 'CONTRADICTED');
});

// ---- regression fixes surfaced by the v3 live pilot ----
test('FIX figurative dominates: figurative=true AND a (spurious) contradicted component -> NOT_APPLICABLE', () => {
  // The ch10 river-metaphor case: the model flagged figurative=true but also marked components
  // contradicted. Figurative must win, not produce a false CONTRADICTED.
  assert.equal(decide(out({ figurative: true, claim_components: [{ status: 'contradicted', entity: 'Cirshe', evidence_ref: 'cirshe' }] })), 'NOT_APPLICABLE');
});
test('FIX route entity: a named ROUTE entity resolves and its route ref is relevant -> SUPPORTED', () => {
  // The luthan-rise case: a component about "Great Western Road" (a route) must resolve, not fail entity-presence.
  assert.equal(decide(out({ claim_components: [{ status: 'supported', entity: 'Great Western Road', evidence_ref: 'great-western-road' }] })), 'SUPPORTED');
});
test('FIX normName unifies kebab id and spoken name', () => {
  assert.deepEqual(resolveEntity('Great Western Road', idx), ['great-western-road']);
  assert.deepEqual(resolveEntity('great-western-road', idx), ['great-western-road']);
  assert.deepEqual(resolveEntity('Luthan Rise', idx), ['luthan-rise']);
});
