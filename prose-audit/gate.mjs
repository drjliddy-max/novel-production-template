// gate.mjs - the deterministic evidence-first adjudication gate for the prose-audit capability.
//
// WHY THIS EXISTS (the REVISE defect it corrects):
// The v1 pilot let "not proven contradictory" collapse into "consistent", even when the authoritative
// source was silent or insufficient. A model verdict of is_contradiction=false was trusted directly.
// This gate replaces that binary model with an EVIDENCE-FIRST state model computed deterministically
// from the model's STRUCTURED fields (never from the model's own final label, never from confidence).
//
// Decision states (project-neutral): CONTRADICTED, SUPPORTED, INSUFFICIENT_EVIDENCE, AMBIGUOUS,
// NOT_APPLICABLE, ADJUDICATION_ERROR.
//
// Core rule: a claim is SUPPORTED only when the retrieved authority AFFIRMATIVELY supports every
// material component (each with a resolvable evidence reference) AND the source addresses the claim.
// Absence of contradictory evidence is NOT affirmative support. Confidence is advisory metadata only.
//
// This is pure and side-effect free. It never edits prose, canon, or the map.

export const DECISION_STATES = [
  'CONTRADICTED', 'SUPPORTED', 'INSUFFICIENT_EVIDENCE', 'AMBIGUOUS', 'NOT_APPLICABLE', 'ADJUDICATION_ERROR',
];
const COMPONENT_STATES = ['supported', 'contradicted', 'unresolved', 'not_applicable'];

// Map a decision state into the prose-audit evidence taxonomy (see PROSE_AUDIT_CAPABILITY_SPEC.md B/J).
export function toEvidenceState(decision) {
  switch (decision) {
    case 'CONTRADICTED': return 'LIKELY';            // LLM-adjudicated; deterministic corroboration could raise to VERIFIED
    case 'SUPPORTED': return 'VERIFIED';             // reached only after the deterministic sufficiency invariants pass
    case 'INSUFFICIENT_EVIDENCE': return 'NEEDS_REVIEW';
    case 'AMBIGUOUS': return 'NEEDS_REVIEW';
    case 'NOT_APPLICABLE': return 'FALSE_POSITIVE_RISK';
    case 'ADJUDICATION_ERROR': return 'BLOCKED';
    default: return 'BLOCKED';
  }
}

// Structured rationale-insufficiency backstop (invariant 2). Prefer structured coverage fields; this is
// a secondary catch for the exact v1 defect (rationale said "unverifiable" while the verdict claimed
// support). Applied ONLY to downgrade a would-be SUPPORTED, never to upgrade anything.
const INSUFFICIENCY_RE = /\b(insufficient|unverifiable|not specif|does not specif|doesn't specif|silent|unknown|ambiguous|cannot (?:confirm|verify)|can't (?:confirm|verify)|no (?:evidence|information|record)|neither confirm)/i;
export function rationaleFlagsInsufficiency(rationale) {
  return typeof rationale === 'string' && INSUFFICIENCY_RE.test(rationale);
}

function resolvable(ref, mapIndex) {
  return typeof ref === 'string' && ref.length > 0 && (mapIndex.places.has(ref) || mapIndex.routes.has(ref));
}

function buildIndex(mapContext) {
  return {
    places: new Set((mapContext?.places || []).map((p) => p.place_id)),
    routes: new Set((mapContext?.routes || []).map((r) => r.route_id)),
  };
}

// gate(modelOutput, mapContext) -> { decision_state, evidence_state, invariants_applied[], reasons[], coverage }
// modelOutput contract (produced by the adjudicator model, validated here):
//   claim_components: [{ component, status, evidence_ref, note }]
//   source_addresses_claim: boolean
//   figurative: boolean
//   ambiguous: boolean
//   confidence: number (advisory only)
//   rationale: string
export function gate(modelOutput, mapContext) {
  const invariants = [];
  const reasons = [];
  const done = (decision) => ({
    decision_state: decision,
    evidence_state: toEvidenceState(decision),
    invariants_applied: invariants,
    reasons,
    coverage: Array.isArray(modelOutput?.claim_components) ? modelOutput.claim_components : [],
  });

  // Invariant 5 - fail closed on malformed / missing structure.
  if (!modelOutput || typeof modelOutput !== 'object') { invariants.push('fail-closed'); reasons.push('no model output'); return done('ADJUDICATION_ERROR'); }
  const comps = modelOutput.claim_components;
  if (!Array.isArray(comps) || comps.length === 0) { invariants.push('fail-closed'); reasons.push('missing/empty claim_components'); return done('ADJUDICATION_ERROR'); }
  if (typeof modelOutput.source_addresses_claim !== 'boolean' || typeof modelOutput.figurative !== 'boolean') {
    invariants.push('fail-closed'); reasons.push('missing boolean fields'); return done('ADJUDICATION_ERROR');
  }
  for (const c of comps) {
    if (!c || !COMPONENT_STATES.includes(c.status)) { invariants.push('fail-closed'); reasons.push('bad component status'); return done('ADJUDICATION_ERROR'); }
  }
  const idx = buildIndex(mapContext);

  // Internal inconsistency: same evidence_ref asserted both supported and contradicted (conflicting authority).
  const byRef = {};
  for (const c of comps) {
    if (!c.evidence_ref) continue;
    (byRef[c.evidence_ref] ||= new Set()).add(c.status);
  }
  for (const [ref, statuses] of Object.entries(byRef)) {
    if (statuses.has('supported') && statuses.has('contradicted')) {
      invariants.push('fail-closed'); reasons.push(`conflicting authority on ${ref}`); return done('ADJUDICATION_ERROR');
    }
  }

  // Invariant 3 - a contradiction only stands with a resolvable authoritative reference.
  const realContradictions = comps.filter((c) => c.status === 'contradicted' && resolvable(c.evidence_ref, idx));
  const unresolvableContradictions = comps.filter((c) => c.status === 'contradicted' && !resolvable(c.evidence_ref, idx));
  if (realContradictions.length > 0) {
    invariants.push('evidence-reference');
    reasons.push(`contradicted with resolvable evidence: ${realContradictions.map((c) => c.evidence_ref).join(',')}`);
    return done('CONTRADICTED');
  }

  // Invariant 6 - figurative / non-geographic language is not a contradiction; nothing contradicted stands.
  if (modelOutput.figurative === true) { invariants.push('figurative'); reasons.push('figurative/non-geographic language'); return done('NOT_APPLICABLE'); }

  // Affirmative support: every component supported, each with a resolvable ref, and the source addresses the claim.
  const allSupportedWithRef = comps.every((c) => c.status === 'supported' && resolvable(c.evidence_ref, idx));
  const anyUnresolved = comps.some((c) => c.status === 'unresolved');
  if (allSupportedWithRef && modelOutput.source_addresses_claim === true && !anyUnresolved) {
    // Invariant 2 - rationale/verdict consistency: a "supported" verdict whose rationale declares
    // missing/ambiguous/unverifiable evidence is downgraded (structured coverage was clean, but the
    // free-text rationale contradicts it, so fail closed rather than assert support).
    if (rationaleFlagsInsufficiency(modelOutput.rationale)) {
      invariants.push('rationale-verdict-consistency'); reasons.push('rationale declares insufficient/ambiguous evidence despite a supported verdict');
      return done('INSUFFICIENT_EVIDENCE');
    }
    invariants.push('affirmative-support');
    reasons.push('all components supported with resolvable evidence and source addresses the claim');
    return done('SUPPORTED');
  }

  // Invariant 1 - source silence: the source does not address the claim -> cannot be supported.
  if (modelOutput.source_addresses_claim === false) {
    invariants.push('source-silence'); reasons.push('authority does not address the claim'); return done('INSUFFICIENT_EVIDENCE');
  }
  // Genuine reading ambiguity (source present, claim admits multiple readings).
  if (modelOutput.ambiguous === true) { invariants.push('ambiguity'); reasons.push('genuine reading ambiguity'); return done('AMBIGUOUS'); }
  // Invariant 4 - coverage: an unresolved material component means not fully supported.
  if (anyUnresolved) { invariants.push('coverage'); reasons.push('unresolved material component'); return done('INSUFFICIENT_EVIDENCE'); }
  // A claimed contradiction without a resolvable reference cannot stand as CONTRADICTED (invariant 3).
  if (unresolvableContradictions.length > 0) {
    invariants.push('evidence-reference'); reasons.push('contradiction lacked a resolvable authoritative reference'); return done('INSUFFICIENT_EVIDENCE');
  }
  // Default: fail closed to insufficient rather than inventing a clean result.
  invariants.push('fail-closed'); reasons.push('no affirmative support established'); return done('INSUFFICIENT_EVIDENCE');
}
