// gate.mjs - the deterministic evidence-first adjudication gate for the prose-audit capability.
//
// WHY THIS EXISTS (defects it corrects):
// (1) v1: "not proven contradictory" collapsed into "consistent". Absence of contradiction is NOT
//     affirmative support. Confidence is advisory only.
// (2) revision defect: a resolvable-but-IRRELEVANT evidence_ref let an invented/absent entity become a
//     false CONTRADICTED (fixture syn-invented-place-zarnuth). A reference must not only RESOLVE, it must
//     be RELEVANT to the material entity the component is about.
//
// The gate computes an EVIDENCE-FIRST decision from the model's STRUCTURED fields (never the model's own
// final label, never confidence). Decision states: CONTRADICTED, SUPPORTED, INSUFFICIENT_EVIDENCE,
// AMBIGUOUS, NOT_APPLICABLE, ADJUDICATION_ERROR.
//
// Core rule: SUPPORTED requires that every material component is AFFIRMATIVELY supported by a resolvable
// AND relevant authoritative record, and the source addresses the claim. A CONTRADICTED verdict requires
// affirmative contradictory evidence that is resolvable AND relevant to the claimed entity. An entity
// absent from the map routes to INSUFFICIENT_EVIDENCE; absence never becomes contradiction.
//
// Pure and side-effect free. Never edits prose, canon, or the map.

export const DECISION_STATES = [
  'CONTRADICTED', 'SUPPORTED', 'INSUFFICIENT_EVIDENCE', 'AMBIGUOUS', 'NOT_APPLICABLE', 'ADJUDICATION_ERROR',
];
const COMPONENT_STATES = ['supported', 'contradicted', 'unresolved', 'not_applicable'];

export function toEvidenceState(decision) {
  switch (decision) {
    case 'CONTRADICTED': return 'LIKELY';
    case 'SUPPORTED': return 'VERIFIED';
    case 'INSUFFICIENT_EVIDENCE': return 'NEEDS_REVIEW';
    case 'AMBIGUOUS': return 'NEEDS_REVIEW';
    case 'NOT_APPLICABLE': return 'FALSE_POSITIVE_RISK';
    case 'ADJUDICATION_ERROR': return 'BLOCKED';
    default: return 'BLOCKED';
  }
}

const INSUFFICIENCY_RE = /\b(insufficient|unverifiable|not specif|does not specif|doesn't specif|silent|unknown|ambiguous|cannot (?:confirm|verify)|can't (?:confirm|verify)|no (?:evidence|information|record)|neither confirm)/i;
export function rationaleFlagsInsufficiency(rationale) {
  return typeof rationale === 'string' && INSUFFICIENCY_RE.test(rationale);
}

// Normalize an entity name for deterministic matching: lowercase, drop a leading "the", strip
// punctuation, collapse whitespace. "the Luthan Mountains" -> "luthan mountains".
// Hyphens/underscores are normalized to spaces so a kebab id ("great-western-road") and a spoken name
// ("Great Western Road") match. Then drop a leading "the", strip other punctuation, collapse whitespace.
function normName(s) {
  return String(s || '').toLowerCase().replace(/[-_]/g, ' ').replace(/^the\s+/, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

export function buildIndex(mapContext) {
  const places = mapContext?.places || [];
  const routes = mapContext?.routes || [];
  const placesById = Object.fromEntries(places.map((p) => [p.place_id, p]));
  const routesById = Object.fromEntries(routes.map((r) => [r.route_id, r]));
  const nameToIds = {}; // normalized name/alias -> Set(place_id | route_id)
  for (const p of places) {
    for (const nm of [p.place_id, p.canonical_name, ...(p.aliases || [])]) {
      const k = normName(nm);
      if (k) (nameToIds[k] ||= new Set()).add(p.place_id);
    }
  }
  // Named routes (roads, sea routes) are material entities too, so a component about "the Great Western
  // Road" resolves to its route_id instead of failing entity-presence.
  for (const r of routes) {
    for (const nm of [r.route_id, r.name].filter(Boolean)) {
      const k = normName(nm);
      if (k) (nameToIds[k] ||= new Set()).add(r.route_id);
    }
  }
  return { placeIds: new Set(places.map((p) => p.place_id)), routeIds: new Set(routes.map((r) => r.route_id)), placesById, routesById, nameToIds };
}

function resolvable(ref, idx) {
  return typeof ref === 'string' && ref.length > 0 && (idx.placeIds.has(ref) || idx.routeIds.has(ref));
}

// Resolve a claimed entity NAME to map place ids. [] = absent/invented, [x] = unique, [x,y,...] = a
// shared/ambiguous alias. Deterministic name/alias matching only; NOT semantic similarity.
export function resolveEntity(name, idx) {
  const set = idx.nameToIds[normName(name)];
  return set ? [...set] : [];
}

// Is evidence_ref RELEVANT to the resolved entity place? Relevant when the ref IS the entity, is a route
// with the entity as an endpoint, or is a place in a documented containment/adjacency relation with it.
// This is what stops a resolvable-but-unrelated ref (e.g. citing "cirshe" to contradict invented "Zarnuth").
export function refRelevant(entityPlaceId, ref, idx) {
  if (ref === entityPlaceId) return true;
  const route = idx.routesById[ref];
  if (route && (route.from_place === entityPlaceId || route.to_place === entityPlaceId)) return true;
  const P = idx.placesById[entityPlaceId];
  const R = idx.placesById[ref];
  if (P && (P.contained_by === ref || (P.adjacency || []).includes(ref))) return true;
  if (R && (R.contained_by === entityPlaceId || (R.adjacency || []).includes(entityPlaceId))) return true;
  return false;
}

// gate(modelOutput, mapContext) -> { decision_state, evidence_state, invariants_applied[], reasons[], coverage }
// modelOutput.claim_components: [{ component, status, entity, evidence_ref, note }]
//   entity: the primary named place/feature the component is ABOUT (required for a supported/contradicted
//   verdict to stand; missing entity on a decisive component fails closed).
export function gate(modelOutput, mapContext) {
  const invariants = [];
  const reasons = [];
  const done = (decision) => ({
    decision_state: decision, evidence_state: toEvidenceState(decision),
    invariants_applied: [...new Set(invariants)], reasons,
    coverage: Array.isArray(modelOutput?.claim_components) ? modelOutput.claim_components : [],
  });

  // Invariant 5 - fail closed on malformed / missing structure.
  if (!modelOutput || typeof modelOutput !== 'object') { invariants.push('fail-closed'); reasons.push('no model output'); return done('ADJUDICATION_ERROR'); }
  const comps = modelOutput.claim_components;
  if (!Array.isArray(comps) || comps.length === 0) { invariants.push('fail-closed'); reasons.push('missing/empty claim_components'); return done('ADJUDICATION_ERROR'); }
  if (typeof modelOutput.source_addresses_claim !== 'boolean' || typeof modelOutput.figurative !== 'boolean') { invariants.push('fail-closed'); reasons.push('missing boolean fields'); return done('ADJUDICATION_ERROR'); }
  for (const c of comps) { if (!c || !COMPONENT_STATES.includes(c.status)) { invariants.push('fail-closed'); reasons.push('bad component status'); return done('ADJUDICATION_ERROR'); } }

  const idx = buildIndex(mapContext);

  // Conflicting authority: same evidence_ref asserted both supported and contradicted -> fail closed.
  const byRef = {};
  for (const c of comps) { if (c.evidence_ref) (byRef[c.evidence_ref] ||= new Set()).add(c.status); }
  for (const [ref, statuses] of Object.entries(byRef)) {
    if (statuses.has('supported') && statuses.has('contradicted')) { invariants.push('fail-closed'); reasons.push(`conflicting authority on ${ref}`); return done('ADJUDICATION_ERROR'); }
  }

  // --- Evidence-reference RELEVANCE / entity-presence pre-pass (the revision fix) ---
  // Every supported/contradicted component must name a material entity that (a) exists on the map and
  // (b) is the thing its evidence_ref actually addresses. Otherwise reclassify it to `unresolved` so it
  // can neither support nor contradict. Absence and irrelevance never become a decision.
  let entityAmbiguous = false;
  const eff = comps.map((c) => ({ ...c }));
  for (const c of eff) {
    if (c.status !== 'supported' && c.status !== 'contradicted') continue;
    if (typeof c.entity !== 'string' || !c.entity.trim()) { c.status = 'unresolved'; c._relevance = 'missing-entity-metadata'; invariants.push('reference-relevance'); continue; }
    const ids = resolveEntity(c.entity, idx);
    if (ids.length === 0) { c.status = 'unresolved'; c._relevance = 'entity-absent'; invariants.push('entity-presence'); continue; }
    if (ids.length > 1) { entityAmbiguous = true; c.status = 'unresolved'; c._relevance = 'shared-alias'; invariants.push('reference-relevance'); continue; }
    if (!resolvable(c.evidence_ref, idx) || !refRelevant(ids[0], c.evidence_ref, idx)) { c.status = 'unresolved'; c._relevance = 'irrelevant-evidence'; invariants.push('reference-relevance'); continue; }
    // resolved + relevant: the component's evidence stands.
  }

  // Invariant 6 - figurative / non-geographic language is not a geographic claim, so it can never be a
  // contradiction. Checked BEFORE the contradiction check so that a model which flags figurative AND
  // (inconsistently) marks a component contradicted still resolves to NOT_APPLICABLE, not a false
  // CONTRADICTED.
  if (modelOutput.figurative === true) { invariants.push('figurative'); reasons.push('figurative/non-geographic language'); return done('NOT_APPLICABLE'); }

  // Invariant 3 - a contradiction only stands with resolvable AND relevant evidence (post pre-pass).
  const realContradictions = eff.filter((c) => c.status === 'contradicted' && resolvable(c.evidence_ref, idx));
  if (realContradictions.length > 0) { invariants.push('evidence-reference'); reasons.push(`contradicted with relevant evidence: ${realContradictions.map((c) => c.evidence_ref).join(',')}`); return done('CONTRADICTED'); }

  // Affirmative support: every component supported with a resolvable+relevant ref, source addresses claim.
  const allSupported = eff.every((c) => c.status === 'supported' && resolvable(c.evidence_ref, idx));
  const anyUnresolved = eff.some((c) => c.status === 'unresolved');
  if (allSupported && modelOutput.source_addresses_claim === true && !anyUnresolved) {
    if (rationaleFlagsInsufficiency(modelOutput.rationale)) { invariants.push('rationale-verdict-consistency'); reasons.push('rationale declares insufficient/ambiguous evidence despite a supported verdict'); return done('INSUFFICIENT_EVIDENCE'); }
    invariants.push('affirmative-support'); reasons.push('all components supported with relevant evidence and source addresses the claim'); return done('SUPPORTED');
  }

  // A shared/ambiguous alias entity defers to a human (rather than guessing or erroring).
  if (entityAmbiguous) { invariants.push('ambiguity'); reasons.push('shared/ambiguous alias entity'); return done('AMBIGUOUS'); }
  // Invariant 1 - source silence.
  if (modelOutput.source_addresses_claim === false) { invariants.push('source-silence'); reasons.push('authority does not address the claim'); return done('INSUFFICIENT_EVIDENCE'); }
  // Genuine reading ambiguity (source present, multiple readings).
  if (modelOutput.ambiguous === true) { invariants.push('ambiguity'); reasons.push('genuine reading ambiguity'); return done('AMBIGUOUS'); }
  // Invariant 4 - coverage: an unresolved material component means not fully supported.
  if (anyUnresolved) { invariants.push('coverage'); reasons.push('unresolved material component (absent/irrelevant/silent)'); return done('INSUFFICIENT_EVIDENCE'); }
  invariants.push('fail-closed'); reasons.push('no affirmative support established'); return done('INSUFFICIENT_EVIDENCE');
}
