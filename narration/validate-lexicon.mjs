#!/usr/bin/env node
// validate-lexicon.mjs — fail the build if a lexicon entry claims verification it cannot prove.
//
// WHY THIS EXISTS (2026-07-14):
//   Two pronunciations shipped wrong for weeks because their STATUS asserted correctness
//   that no evidence supported:
//     - "Atar" -> "Aytar"     carried status:confirmed since 2026-06-24. Nobody had ever
//                              listened. It rendered as "Itar" 227 times across 14 chapters.
//     - "breathed" -> "breethed" carried status:locked, inherited with an empty note. It
//                              rendered a SOFT th where the word needs a HARD one.
//   The defect was not a missing status word. It was that a status could be recorded WITHOUT
//   the evidence that justifies it, and no reader could tell "someone listened" apart from
//   "someone typed it confidently".
//
// THE INVARIANT THIS ENFORCES:
//   ear-confirmed is INVALID unless a verification block exists naming HOW, on WHICH VOICE,
//   and WHEN. You cannot express the Aytar bug in this schema.
//
// The voice matters: an ear-confirmation is only valid for the voice it was heard on.
// Every entry confirmed on 2026-07-14 was heard on kokoro/bm_george and on nothing else.
// If the book is ever re-voiced, `verification.voice` is what tells you the whole lexicon
// needs re-hearing rather than silently expiring.
//
// USAGE:  node narration/validate-lexicon.mjs [path/to/pronunciation.json]
// EXIT :  0 = clean, 1 = violations found, 2 = file unreadable

import { readFileSync } from 'node:fs';

const VALID = new Set(['unverified', 'ear-confirmed', 'rejected']);
const path = process.argv[2] ??
  '/Users/johnliddy/Desktop/Projects/novel-production-template/narration/pronunciation.json';

let lex;
try {
  lex = JSON.parse(readFileSync(path, 'utf8'));
} catch (e) {
  console.error(`FATAL: cannot read/parse ${path}\n  ${e.message}`);
  process.exit(2);
}

const errors = [];
const warn = [];

for (const [key, v] of Object.entries(lex)) {
  if (typeof v === 'string') { warn.push(`${key}: bare-string entry, no status`); continue; }

  const status = v.status;

  if (!VALID.has(status)) {
    errors.push(`${key}: status "${status}" is not one of ${[...VALID].join(' | ')}`);
    // "locked" is called out by name: it READS as "settled, do not touch" and MEANS
    // "nobody ever checked". That ambiguity is exactly what hid the breathed bug.
    if (status === 'locked') {
      errors.push(`${key}:   -> "locked" is a workflow label, not evidence. Demote to "unverified".`);
    }
    continue;
  }

  if (!v.say || typeof v.say !== 'string' || !v.say.trim()) {
    errors.push(`${key}: no usable "say" — narrate.mjs will silently leave the word as written`);
  }

  // THE CORE RULE.
  if (status === 'ear-confirmed') {
    const ver = v.verification;
    if (!ver || typeof ver !== 'object') {
      errors.push(`${key}: status "ear-confirmed" with NO verification block. This is the Aytar bug.`);
    } else {
      for (const f of ['method', 'voice', 'date']) {
        if (!ver[f]) errors.push(`${key}: ear-confirmed but verification.${f} is missing`);
      }
    }
  }

  // A rejected entry must say what is wrong with it, or the next person re-ships it.
  if (status === 'rejected' && !v.note?.trim()) {
    errors.push(`${key}: status "rejected" with no note explaining WHY. It will be reinstated by someone.`);
  }
}

const n = Object.keys(lex).length;
if (errors.length) {
  console.error(`\nLEXICON INVALID — ${errors.length} violation(s) across ${n} entries:\n`);
  for (const e of errors) console.error('  ✗ ' + e);
  console.error('');
  process.exit(1);
}

const counts = {};
for (const v of Object.values(lex)) counts[v.status] = (counts[v.status] ?? 0) + 1;
console.log(`LEXICON OK — ${n} entries`);
for (const [s, c] of Object.entries(counts).sort()) console.log(`  ${s.padEnd(14)} ${c}`);
if (warn.length) { console.log(''); for (const w of warn) console.log('  ! ' + w); }
