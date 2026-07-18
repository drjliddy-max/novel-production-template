// gate.test.mjs - deterministic invariant tests for the evidence-first adjudication gate.
//
// These prove the REVISE defect is corrected: "not contradicted" can never become SUPPORTED, and every
// deterministic invariant fails closed. Synthetic model outputs are fed directly to the pure gate (no
// live model), so the tests are fast and reproducible.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gate, toEvidenceState } from './gate.mjs';

const MAP = {
  places: [
    { place_id: 'cirshe' }, { place_id: 'luthan-rise' }, { place_id: 'luthan-mts' }, { place_id: 'putakta' }, { place_id: 'fort-luthan' },
  ],
  routes: [{ route_id: 'cirshe-putakta-sea' }],
};
// A well-formed model output with sensible defaults; override per test.
const out = (o = {}) => ({
  claim_components: [{ component: 'x', status: 'supported', evidence_ref: 'luthan-rise', note: '' }],
  source_addresses_claim: true,
  figurative: false,
  ambiguous: false,
  confidence: 0.9,
  rationale: 'the map supports this',
  ...o,
});
const decide = (o) => gate(o, MAP).decision_state;

test('affirmative support -> SUPPORTED', () => {
  assert.equal(decide(out()), 'SUPPORTED');
});

test('INVARIANT 1 source-silence: source does not address claim -> INSUFFICIENT_EVIDENCE (never SUPPORTED)', () => {
  assert.equal(decide(out({ source_addresses_claim: false })), 'INSUFFICIENT_EVIDENCE');
});

test('INVARIANT 2 rationale/verdict mismatch: supported verdict + "does not specify" rationale -> INSUFFICIENT_EVIDENCE', () => {
  assert.equal(decide(out({ rationale: 'The map does not specify the east/west location, leaving it unverifiable.' })), 'INSUFFICIENT_EVIDENCE');
});

test('INVARIANT 3 evidence-reference: supported with a null evidence_ref -> not SUPPORTED (INSUFFICIENT_EVIDENCE)', () => {
  assert.equal(decide(out({ claim_components: [{ component: 'x', status: 'supported', evidence_ref: null }] })), 'INSUFFICIENT_EVIDENCE');
});

test('INVARIANT 3 evidence-reference: supported ref that does not resolve on the map -> not SUPPORTED', () => {
  assert.equal(decide(out({ claim_components: [{ component: 'x', status: 'supported', evidence_ref: 'zarnuth-invented' }] })), 'INSUFFICIENT_EVIDENCE');
});

test('INVARIANT 4 coverage: one supported + one unresolved -> INSUFFICIENT_EVIDENCE (not fully supported)', () => {
  assert.equal(decide(out({ claim_components: [
    { component: 'a', status: 'supported', evidence_ref: 'cirshe' },
    { component: 'b', status: 'unresolved', evidence_ref: null },
  ] })), 'INSUFFICIENT_EVIDENCE');
});

test('INVARIANT 5 fail-closed: null output -> ADJUDICATION_ERROR', () => {
  assert.equal(decide(null), 'ADJUDICATION_ERROR');
});
test('INVARIANT 5 fail-closed: missing claim_components -> ADJUDICATION_ERROR', () => {
  assert.equal(gate({ source_addresses_claim: true, figurative: false }, MAP).decision_state, 'ADJUDICATION_ERROR');
});
test('INVARIANT 5 fail-closed: bad component status -> ADJUDICATION_ERROR', () => {
  assert.equal(decide(out({ claim_components: [{ component: 'x', status: 'maybe', evidence_ref: 'cirshe' }] })), 'ADJUDICATION_ERROR');
});
test('INVARIANT 5 fail-closed: missing boolean fields -> ADJUDICATION_ERROR', () => {
  assert.equal(gate({ claim_components: [{ component: 'x', status: 'supported', evidence_ref: 'cirshe' }] }, MAP).decision_state, 'ADJUDICATION_ERROR');
});

test('INVARIANT 6 figurative: figurative language, nothing contradicted -> NOT_APPLICABLE', () => {
  assert.equal(decide(out({ figurative: true, claim_components: [{ component: 'riverbed simile', status: 'not_applicable', evidence_ref: null }] })), 'NOT_APPLICABLE');
});

test('contradiction with a resolvable reference -> CONTRADICTED', () => {
  assert.equal(decide(out({ claim_components: [{ component: 'luthan mts to the south', status: 'contradicted', evidence_ref: 'luthan-mts' }] })), 'CONTRADICTED');
});

test('contradiction with an UNRESOLVABLE reference (invented place) -> INSUFFICIENT_EVIDENCE (does not stand)', () => {
  assert.equal(decide(out({ claim_components: [{ component: 'zarnuth east of cirshe', status: 'contradicted', evidence_ref: 'zarnuth-invented' }] })), 'INSUFFICIENT_EVIDENCE');
});

test('conflicting authority: same ref both supported and contradicted -> ADJUDICATION_ERROR', () => {
  assert.equal(decide(out({ claim_components: [
    { component: 'a', status: 'supported', evidence_ref: 'putakta' },
    { component: 'b', status: 'contradicted', evidence_ref: 'putakta' },
  ] })), 'ADJUDICATION_ERROR');
});

test('CATEGORY high-confidence-unsupported: confidence 0.95 but source silent -> INSUFFICIENT_EVIDENCE (confidence is advisory)', () => {
  assert.equal(decide(out({ confidence: 0.95, source_addresses_claim: false })), 'INSUFFICIENT_EVIDENCE');
});

test('CATEGORY low-confidence-correct: confidence 0.2 but contradicted+resolvable -> CONTRADICTED (confidence does not block)', () => {
  assert.equal(decide(out({ confidence: 0.2, claim_components: [{ component: 'x', status: 'contradicted', evidence_ref: 'luthan-mts' }] })), 'CONTRADICTED');
});

test('genuine ambiguity: source addresses, ambiguous=true, no full support -> AMBIGUOUS', () => {
  assert.equal(decide(out({ ambiguous: true, claim_components: [{ component: 'crossed', status: 'unresolved', evidence_ref: 'cirshe-putakta-sea' }] })), 'AMBIGUOUS');
});

test('compound partial: one supported + one contradicted -> CONTRADICTED (contradiction wins)', () => {
  assert.equal(decide(out({ claim_components: [
    { component: 'south to fort luthan', status: 'supported', evidence_ref: 'fort-luthan' },
    { component: 'across ocean to putakta', status: 'contradicted', evidence_ref: 'cirshe-putakta-sea' },
  ] })), 'CONTRADICTED');
});

test('decision -> evidence-taxonomy mapping is exhaustive and correct', () => {
  assert.equal(toEvidenceState('CONTRADICTED'), 'LIKELY');
  assert.equal(toEvidenceState('SUPPORTED'), 'VERIFIED');
  assert.equal(toEvidenceState('INSUFFICIENT_EVIDENCE'), 'NEEDS_REVIEW');
  assert.equal(toEvidenceState('AMBIGUOUS'), 'NEEDS_REVIEW');
  assert.equal(toEvidenceState('NOT_APPLICABLE'), 'FALSE_POSITIVE_RISK');
  assert.equal(toEvidenceState('ADJUDICATION_ERROR'), 'BLOCKED');
});
