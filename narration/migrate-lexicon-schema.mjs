#!/usr/bin/env node
// migrate-lexicon-schema.mjs — one-time migration to the evidence-bearing lexicon schema.
//
// DO NOT RUN WHILE A RENDER IS IN FLIGHT. render-book.sh re-reads pronunciation.json on every
// unit; rewriting it mid-render risks a torn read (truncate-then-write) that yields invalid or
// PARTIAL JSON. A partial parse silently drops pronunciations and ships a chapter that looks
// rendered and is not. Check first:  pgrep -f render-book.sh
//
// WHAT IT DOES
//   old                     new
//   ---                     ---
//   status: confirmed   ->  status: unverified      (see DEMOTION POLICY)
//   status: locked      ->  status: unverified      ("locked" is deleted; it was a workflow
//                                                    label masquerading as evidence)
//   status: draft       ->  status: unverified
//   status: needs-ear-check -> status: unverified
//   (heard today)       ->  status: ear-confirmed + verification{method,voice,date}
//
// DEMOTION POLICY — read this before objecting to the scale of it.
//   Only entries the operator confirmed BY EAR on 2026-07-14 keep a verified status. Everything
//   else becomes `unverified`, INCLUDING entries whose source claims an earlier operator A/B.
//   Why: "Atar" carried  status:confirmed  and  source:"operator A/B, 2026-06-24"  — and it was
//   WRONG, rendering as "Itar" 227 times. That one fact discredits the recorded June claims as a
//   class: we cannot tell, from the file, which of them were genuinely heard and which were
//   asserted. So they get re-earned by listening rather than grandfathered on their own say-so.
//   `unverified` does not mean "wrong". It means "no evidence in hand". That is the honest state.
//
// USAGE:  node narration/migrate-lexicon-schema.mjs [--apply]
//         (default is a DRY RUN — prints the diff and writes nothing)

import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';

const LEX = '/Users/johnliddy/Desktop/Projects/novel-production-template/narration/pronunciation.json';
const APPLY = process.argv.includes('--apply');

// Heard by the operator on Kokoro bm_george, 2026-07-14, in this session. These are the ONLY
// entries with evidence behind them.
const HEARD_TODAY = new Set([
  // the five names
  'Quasition', 'Dariticus', 'Secrulaur', 'Tuesasche', 'Atar',
  // the th-sweep finding
  'Netheron',
  // the breath family
  'breath', 'breaths', 'Breath', 'Breaths',
  'breathe', 'Breathe', 'breathing', 'Breathing', 'breathed', 'Breathed',
  // the homograph guard + the soft-th reference
  'lead-lined', 'Lead-lined', 'Luthan', 'Luthans',
]);

const VERIFICATION = {
  method: 'listening',
  voice: 'kokoro/bm_george',
  date: '2026-07-14',
};

const lex = JSON.parse(readFileSync(LEX, 'utf8'));
const out = {};
const moved = { 'ear-confirmed': [], unverified: [] };

for (const [key, v] of Object.entries(lex)) {
  const e = typeof v === 'string' ? { say: v, ipa: '', note: '', source: '' } : { ...v };

  if (HEARD_TODAY.has(key)) {
    e.status = 'ear-confirmed';
    e.verification = { ...VERIFICATION };
    moved['ear-confirmed'].push(key);
  } else {
    const prior = e.status;
    e.status = 'unverified';
    delete e.verification;
    if (prior && prior !== 'unverified') {
      e.note = (e.note ? e.note + ' ' : '') +
        `[schema migration 2026-07-14: prior status "${prior}" carried no listening evidence and was ` +
        `demoted to unverified. Not known wrong — simply never heard on the target voice.]`;
    }
    moved.unverified.push(key);
  }
  out[key] = e;
}

console.log(`\n${Object.keys(lex).length} entries\n`);
console.log(`  ear-confirmed  ${moved['ear-confirmed'].length}  (heard 2026-07-14 on kokoro/bm_george)`);
for (const k of moved['ear-confirmed']) console.log(`      ✓ ${k}`);
console.log(`\n  unverified     ${moved.unverified.length}  (no listening evidence on record)`);
console.log(`      ${moved.unverified.join(', ')}`);

if (!APPLY) {
  console.log('\nDRY RUN — nothing written. Re-run with --apply to migrate.');
  console.log('Then validate:  node narration/validate-lexicon.mjs\n');
  process.exit(0);
}

copyFileSync(LEX, LEX + '.pre-schema-migration.bak');
writeFileSync(LEX, JSON.stringify(out, null, 2) + '\n');
console.log(`\nMIGRATED. Backup: ${LEX}.pre-schema-migration.bak`);
console.log('Now run:  node narration/validate-lexicon.mjs\n');
