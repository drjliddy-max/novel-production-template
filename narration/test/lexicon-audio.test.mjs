// lexicon-audio.test.mjs — the audio-relevant lexicon fingerprint is what decides
// whether a metadata-only lexicon edit re-stales the whole audiobook. This suite
// exists to prevent the exact false-positive it was written to kill: a schema
// migration (status: locked -> unverified) that changed ZERO pronunciations but
// re-staled all 26 Book I units under the old whole-file hash.
//
// It also carries the GOLDEN VECTOR that pins this file byte-for-byte to the copy in
// voice-engine/src/lexicon.mjs. narrate.mjs (voice-engine) stamps the fingerprint and
// audiobook-status.mjs (here) recomputes it; if the two implementations drift, a unit
// renders "current" against a fingerprint the tracker computes differently and the
// gate lies. The golden vector fails loudly if either copy is edited without the other.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { firedSayMap, audioFingerprint } from '../lexicon-audio.mjs';

// ---------------------------------------------------------------------------
// GOLDEN VECTOR — must be identical in voice-engine/test/lexicon.test.mjs.
// Regenerate BOTH sides together if the algorithm ever legitimately changes.
// ---------------------------------------------------------------------------
const GOLDEN_TEXT =
  "Aerendyl walked to Cirshe. Aerendyl's road passed the Face of Ritilia and Ritilia beyond.";
const GOLDEN_LEX = {
  Aerendyl: { say: 'Airrendil', status: 'locked', note: 'meta only' },
  Cirshe: 'Kirsha',
  'Face of Ritilia': { say: 'Face of Rit-ill-ee-a' },
  Ritilia: { say: 'Rit-ill-ee-a' },
  Unused: { say: 'Zzz' },
  Empty: { say: '' },
  NoSay: { note: 'awaiting ear' },
};
const GOLDEN_HASH = 'f956a12fd6c37f1a8f5d26e3e90a26661631294155ed7f107af9caa6dd6c76ac';

test('GOLDEN: audioFingerprint is stable (cross-repo pin with voice-engine)', () => {
  assert.equal(audioFingerprint(GOLDEN_TEXT, GOLDEN_LEX), GOLDEN_HASH);
});

test('firedSayMap captures only keys present in the text, with their say', () => {
  const fired = firedSayMap(GOLDEN_TEXT, GOLDEN_LEX);
  assert.deepEqual(Object.keys(fired).sort(), ['Aerendyl', 'Cirshe', 'Face of Ritilia', 'Ritilia']);
  assert.equal(fired.Aerendyl, 'Airrendil'); // rich {say} form
  assert.equal(fired.Cirshe, 'Kirsha');       // plain-string form
  assert.equal(fired.Unused, undefined);       // not in text -> omitted
  assert.equal(fired.Empty, undefined);        // empty say -> no-op
  assert.equal(fired.NoSay, undefined);        // no say at all -> no-op
});

// --- the property the whole fix turns on ------------------------------------

test('metadata-only edit does NOT change the fingerprint', () => {
  const before = audioFingerprint(GOLDEN_TEXT, GOLDEN_LEX);
  const after = JSON.parse(JSON.stringify(GOLDEN_LEX));
  after.Aerendyl.status = 'unverified';
  after.Aerendyl.note = 'schema migration 2026-07-14';
  after.Aerendyl.verification = { method: 'listening', date: '2026-07-14' };
  after.Cirshe = { say: 'Kirsha', status: 'unverified' }; // string -> rich form, same say
  assert.equal(audioFingerprint(GOLDEN_TEXT, after), before);
});

test('a say-change to a key IN the text DOES change the fingerprint (must re-render)', () => {
  const before = audioFingerprint(GOLDEN_TEXT, GOLDEN_LEX);
  const after = JSON.parse(JSON.stringify(GOLDEN_LEX));
  after.Cirshe = 'Keersh';
  assert.notEqual(audioFingerprint(GOLDEN_TEXT, after), before);
});

test('a say-change to a key NOT in the text does NOT change the fingerprint', () => {
  const before = audioFingerprint(GOLDEN_TEXT, GOLDEN_LEX);
  const after = JSON.parse(JSON.stringify(GOLDEN_LEX));
  after.Unused = { say: 'Yyy' };
  assert.equal(audioFingerprint(GOLDEN_TEXT, after), before);
});

test('fingerprint is stable across lexicon key ORDER (canonicalized)', () => {
  const reordered = {};
  for (const k of Object.keys(GOLDEN_LEX).reverse()) reordered[k] = GOLDEN_LEX[k];
  assert.equal(audioFingerprint(GOLDEN_TEXT, reordered), GOLDEN_HASH);
});

test('word-boundary + case-sensitive, matching applyLexicon', () => {
  // substring is not a match; lowercase is not a match; possessive IS a match.
  const lex = { Cir: 'X', cirshe: 'Y', Cirshe: 'Z' };
  const fired = firedSayMap('Cirshe cirshe Cirshelike Cirshe’s', lex);
  assert.equal(fired.Cirshe, 'Z');
  assert.equal(fired.cirshe, 'Y'); // the lowercase token exists in the text
  assert.equal(fired.Cir, undefined); // only appears inside Cirshe/Cirshelike -> no whole-word hit
});

test('no lexicon -> null fingerprint (parity with whole-file null)', () => {
  assert.equal(audioFingerprint('anything', null), null);
});
