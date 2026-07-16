#!/usr/bin/env node
// stamp-audio-fingerprint.mjs — add/refresh the AUDIO-RELEVANT lexicon fingerprint
// (`lexiconAudioSha256`) on audiobook manifests, safely.
//
// WHY: manifests written before the audio-fingerprint scheme carry only the
// whole-file `lexiconSha256`, so audiobook-status.mjs falls back to the whole-file
// compare and reports them STALE on any lexicon edit. This one-time migration stamps
// each manifest with the fingerprint of the (key -> say) substitutions that actually
// fire against its source. Going forward, narrate.mjs stamps it at render time, so
// this tool is only for migrating legacy manifests (or re-stamping proven false
// alarms). See lexicon-audio.mjs for the fingerprint definition.
//
// SAFETY — it refuses to declare a unit current when it might not be:
//   - manuscript drift: if the manifest's recorded sourceSha256 no longer matches the
//     source on disk, the unit is genuinely stale -> REFUSE (re-render, don't re-stamp).
//   - say-change (only when --against <render-time lexicon> is given): if the unit's
//     audio fingerprint differs between the render-time lexicon and the current one, a
//     pronunciation that this unit USES actually changed -> REFUSE (re-render).
// A metadata-only lexicon edit produces an identical fingerprint, so those units stamp
// cleanly. This is the handoff's "re-stamp the false alarms" procedure, made rigorous.
//
// Usage:
//   node stamp-audio-fingerprint.mjs <audiobook-root> --manuscripts <dir> \
//        --lexicon <master.json> [--against <render-time-lexicon.json>] [--apply]
//   (read-only report by default; --apply writes the manifests)

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, basename } from 'node:path';
import { audioFingerprint } from './lexicon-audio.mjs';

function arg(name) { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : undefined; }
const ROOT = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const MANU = arg('--manuscripts');
const LEX = arg('--lexicon');
const AGAINST = arg('--against');
const APPLY = process.argv.includes('--apply');
if (!ROOT || !MANU || !LEX) {
  console.error('usage: node stamp-audio-fingerprint.mjs <audiobook-root> --manuscripts <dir> --lexicon <master.json> [--against <old.json>] [--apply]');
  process.exit(2);
}

const sha = (p) => (existsSync(p) ? createHash('sha256').update(readFileSync(p)).digest('hex') : null);
const master = JSON.parse(readFileSync(LEX, 'utf8'));
const against = AGAINST ? JSON.parse(readFileSync(AGAINST, 'utf8')) : null;

// Rebuild the manifest object inserting/replacing lexiconAudioSha256 immediately
// after lexiconSha256 (or after `sources`), preserving all other key order.
function withAudioHash(man, hash) {
  const out = {};
  let inserted = false;
  for (const [k, v] of Object.entries(man)) {
    if (k === 'lexiconAudioSha256') continue; // drop any existing; re-add in canonical slot
    out[k] = v;
    if (!inserted && (k === 'lexiconSha256' || (!('lexiconSha256' in man) && k === 'sources'))) {
      out.lexiconAudioSha256 = hash;
      inserted = true;
    }
  }
  if (!inserted) out.lexiconAudioSha256 = hash;
  return out;
}

const units = readdirSync(ROOT).map((d) => join(ROOT, d))
  .filter((d) => statSync(d).isDirectory() && existsSync(join(d, 'manifest.json'))).sort();

let toStamp = 0, already = 0, refused = 0;
for (const dir of units) {
  const ch = basename(dir);
  const mp = join(dir, 'manifest.json');
  let man;
  try { man = JSON.parse(readFileSync(mp, 'utf8')); }
  catch (e) { console.log(`${ch.padEnd(7)} REFUSE  (manifest unreadable: ${e.message})`); refused++; continue; }

  const srcFile = man.source ? join(MANU, basename(man.source)) : null;
  if (!srcFile || !existsSync(srcFile)) { console.log(`${ch.padEnd(7)} REFUSE  (source not found: ${man.source})`); refused++; continue; }

  const recSrc = man?.sources?.sourceSha256 || man?.sourceSha256 || null;
  if (recSrc && recSrc !== sha(srcFile)) {
    console.log(`${ch.padEnd(7)} REFUSE  (manuscript changed since render — re-render, don't re-stamp)`); refused++; continue;
  }

  const srcText = readFileSync(srcFile, 'utf8');
  const cur = audioFingerprint(srcText, master);
  if (against) {
    const old = audioFingerprint(srcText, against);
    if (old !== cur) {
      console.log(`${ch.padEnd(7)} REFUSE  (a say-value this unit USES changed — re-render, don't re-stamp)`); refused++; continue;
    }
  }

  if (man.lexiconAudioSha256 === cur) { console.log(`${ch.padEnd(7)} ok      (already ${cur.slice(0, 12)})`); already++; continue; }
  console.log(`${ch.padEnd(7)} STAMP   ${cur.slice(0, 12)}${man.lexiconAudioSha256 ? ` (was ${String(man.lexiconAudioSha256).slice(0, 12)})` : ' (new)'}`);
  toStamp++;
  if (APPLY) writeFileSync(mp, JSON.stringify(withAudioHash(man, cur), null, 2) + '\n', 'utf8');
}

console.log(`\n${APPLY ? 'STAMPED' : 'would stamp'}: ${toStamp} | already current: ${already} | REFUSED: ${refused}`);
if (!APPLY && toStamp) console.log('re-run with --apply to write.');
process.exit(refused ? 1 : 0);
