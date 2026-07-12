#!/usr/bin/env node
// audiobook-status.mjs — KNOW which voice files are current / stale / invalid,
// and clean the obsolete ones so the disk always holds exactly the correct set.
//
// ---------------------------------------------------------------------------
// STALENESS IS COMPUTED, NEVER GUESSED, AND NEVER FROM MTIMES.
// ---------------------------------------------------------------------------
// Two provenance receipts back every unit:
//
//   manifest.json          (git-tracked, deterministic, written by narrate.mjs)
//     sources.sourceSha256 - the manuscript chapter the text came from
//     lexiconSha256        - the pronunciation lexicon that was applied
//     chunks[].file        - the AUTHORITATIVE list of chunk files
//
//   audio/_voice.json      (gitignored, disk-only, written by generate.mjs)
//     quotes_stripped      - story-narration neutralizes double-quote dialogue
//                            cues so the reader holds one steady narrator voice
//     mode / voice / seed  - the synthesis settings
//     renderedAt           - WHEN the audio was made (legibility only; currency
//                            is proven by hashes, never by this date)
//
// A unit is:
//   CURRENT       - source + lexicon hashes match, settings proven correct, audio complete
//   STALE         - the manuscript, the lexicon, or the render settings no longer match
//   INCOMPLETE    - a manifest-referenced chunk .txt or .wav is missing
//   NO-PROVENANCE - a receipt is missing, so currency CANNOT be proven (re-render to stamp)
//   MALFORMED     - manifest unreadable/invalid; the unit is quarantined and never swept
//
// ---------------------------------------------------------------------------
// OBSOLETE FILES (what --apply deletes)
// ---------------------------------------------------------------------------
// The valid set is derived from the MANIFEST, not from a numeric count and not
// from the directory listing. Anything in the unit that the manifest does not
// reference is obsolete:
//
//   orphan chunk .txt - a chunks/NNNN.txt the manifest does not list. Left behind
//                       when a re-narrate produces FEWER chunks than before (the
//                       old tail lingers). The audio is unaffected, but the stray
//                       text misreports the unit's size and can be mistaken for a
//                       missing-audio gap. These are git-TRACKED, so deleting them
//                       shows up in git status and must be committed.
//   orphan .wav       - an audio/NNNN.wav with no manifest chunk NNNN.
//   stale backups     - *OLD* / *pre-lexicon* mp3s.
//   transient logs    - book-level *.log.
//
// A manifest-referenced chunk is NEVER deleted. A malformed/missing manifest
// disables ALL deletion for that unit (fail safe, not fail open). --apply is
// idempotent: a second run finds nothing.
//
// Usage:
//   node audiobook-status.mjs <audiobook-root> --manuscripts <dir> --lexicon <master.json> [--apply]
//   --apply  actually delete the obsolete files (default is a read-only report)

import { readFileSync, existsSync, readdirSync, statSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, basename } from 'node:path';

function arg(name, def) { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : def; }
const ROOT = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const MANU = arg('--manuscripts');
const LEX = arg('--lexicon');
const APPLY = process.argv.includes('--apply');
// --tracked-only: judge ONLY what git actually carries (manifests, chunk .txt, script).
//
// This exists so a CI gate is possible at all. The audio (wavs, mp3s) and the render
// receipt (audio/_voice.json) are gitignored, so on a CI runner they do not exist. A
// full check there would see zero wavs, call all 26 units INCOMPLETE, and fail forever
// -- a check that can never pass, which is the exact failure class this tool was fixed
// to eliminate. So CI enforces the drift that CAN be committed (a manuscript edited
// without re-narrating, a lexicon bumped without re-rendering, orphan chunk files, a
// malformed manifest), and the FULL zero-state (audio present, receipts stamped) is
// enforced locally where the audio actually lives.
const TRACKED_ONLY = process.argv.includes('--tracked-only');
if (!ROOT || !MANU || !LEX) {
  console.error('usage: node audiobook-status.mjs <audiobook-root> --manuscripts <dir> --lexicon <master.json> [--apply] [--tracked-only]');
  process.exit(2);
}
if (TRACKED_ONLY && APPLY) {
  console.error('refusing: --tracked-only is a read-only CI gate; it must never delete. Drop --apply.');
  process.exit(2);
}

const sha = (p) => (existsSync(p) ? createHash('sha256').update(readFileSync(p)).digest('hex') : null);
const human = (n) => (n > 1e6 ? (n / 1e6).toFixed(0) + 'M' : (n / 1e3).toFixed(0) + 'K');
const lexHash = sha(LEX);

const obsolete = [];   // { path, reason }
let freed = 0;
let stale = 0, incomplete = 0, noProv = 0, current = 0, malformed = 0;
let retained = 0;      // manifest-backed files deliberately kept

const markObsolete = (p, reason) => {
  if (!existsSync(p)) return;
  obsolete.push({ path: p, reason });
  freed += statSync(p).size;
};

console.log(`master lexicon: ${basename(LEX)} (${lexHash?.slice(0, 12)})\n`);

// A unit = a subdir of ROOT holding a manifest.json.
const unitDirs = readdirSync(ROOT)
  .map((d) => join(ROOT, d))
  .filter((d) => statSync(d).isDirectory() && existsSync(join(d, 'manifest.json')))
  .sort();

for (const dir of unitDirs) {
  const ch = basename(dir);

  // --- Fail safe on a bad manifest: quarantine the unit, sweep NOTHING in it. ---
  let man;
  try {
    man = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
    if (!man || typeof man !== 'object' || !Array.isArray(man.chunks)) throw new Error('no chunks[] array');
  } catch (e) {
    malformed++;
    console.log(`${ch.padEnd(8)} MALFORMED (${e.message}) -- quarantined, nothing swept here`);
    continue;
  }

  // --- The AUTHORITATIVE chunk set comes from the manifest, by explicit filename. ---
  // chunks[].file is "chunks/NNNN.txt". Fall back to zero-padded index only if a
  // legacy manifest omits it. Padding width is taken from the recorded names so
  // any zero-pad convention works.
  const pad = (i, w) => String(i).padStart(w, '0');
  const padW = (() => {
    const f = man.chunks.find((c) => c?.file)?.file;
    const m = f && basename(f).match(/^(\d+)\.txt$/);
    return m ? m[1].length : 4;
  })();
  const manifestTxt = new Set();  // "0001.txt"
  const manifestStem = new Set(); // "0001"
  for (const c of man.chunks) {
    const stem = c?.file ? basename(c.file).replace(/\.txt$/, '') : pad(c.i, padW);
    manifestStem.add(stem);
    manifestTxt.add(`${stem}.txt`);
  }

  const chunkDir = join(dir, 'chunks');
  const audioDir = join(dir, 'audio');
  const diskTxt = existsSync(chunkDir) ? readdirSync(chunkDir).filter((f) => f.endsWith('.txt')) : [];
  const diskWav = existsSync(audioDir) ? readdirSync(audioDir).filter((f) => f.endsWith('.wav')) : [];

  // Extra text files the manifest does not reference -> obsolete orphans.
  const orphanTxt = diskTxt.filter((f) => !manifestTxt.has(f)).sort();
  // Extra wavs with no manifest chunk -> obsolete orphans.
  const orphanWav = diskWav.filter((f) => !manifestStem.has(f.replace(/\.wav$/, ''))).sort();
  // Manifest-referenced files that are MISSING -> gaps (never deleted; reported).
  const missingTxt = [...manifestTxt].filter((f) => !diskTxt.includes(f)).sort();
  const missingWav = [...manifestStem].filter((s) => !diskWav.includes(`${s}.wav`)).sort();

  retained += manifestTxt.size - missingTxt.length;

  // --- Render-settings receipt (disk-only, beside the audio it describes). ---
  let voice = null;
  try {
    const vp = join(audioDir, '_voice.json');
    if (existsSync(vp)) voice = JSON.parse(readFileSync(vp, 'utf8'));
  } catch { voice = null; }

  const srcFile = man.source ? join(MANU, basename(man.source)) : null;
  const curSrc = srcFile ? sha(srcFile) : null;
  const recSrc = man?.sources?.sourceSha256 || man?.sourceSha256 || null;
  const recLex = man?.lexiconSha256 ?? null;

  let status;
  if (!recSrc) { status = 'NO-PROVENANCE (no source hash)'; noProv++; }
  else if (curSrc && recSrc !== curSrc) { status = 'STALE (manuscript changed)'; stale++; }
  else if (recLex === null) { status = 'NO-PROVENANCE (no lexicon hash)'; noProv++; }
  else if (recLex !== lexHash) { status = 'STALE (lexicon changed)'; stale++; }
  // CI mode stops here: everything below this line inspects gitignored artifacts
  // (the render receipt and the wavs), which do not exist on a CI runner.
  else if (TRACKED_ONLY) {
    if (missingTxt.length) { status = `INCOMPLETE (missing ${missingTxt.length} chunk txt)`; incomplete++; }
    else { status = 'TRACKED-OK'; current++; }
  }
  // Settings drift. The narration standard is one steady narrator voice, i.e. the
  // double-quote dialogue cues are stripped from the synthesis feed. A render
  // without that carries a dialogue voice-shift and is effectively stale even
  // when its text hashes match. Proven by the render's own receipt, not assumed.
  else if (!voice) { status = 'NO-PROVENANCE (no render receipt)'; noProv++; }
  else if (voice.quotes_stripped !== true) { status = 'STALE-SETTINGS (no quote-strip)'; stale++; }
  // Voice drift: the manifest records the voice the narration was PREPARED for;
  // the render receipt records the voice actually SYNTHESIZED. If they disagree,
  // the audio is not the book's voice, however current its text hashes are.
  else if (man.voice_profile && voice.voice && man.voice_profile !== voice.voice) {
    status = `STALE-SETTINGS (voice ${voice.voice} != ${man.voice_profile})`; stale++;
  }
  else if (missingTxt.length) { status = `INCOMPLETE (missing ${missingTxt.length} chunk txt)`; incomplete++; }
  else if (missingWav.length) { status = `INCOMPLETE (${diskWav.length - orphanWav.length}/${manifestStem.size} wavs)`; incomplete++; }
  else { status = 'CURRENT'; current++; }

  const when = voice?.renderedAt ? ` rendered ${voice.renderedAt.slice(0, 16).replace('T', ' ')}Z` : '';
  console.log(`${ch.padEnd(8)} ${status}${when}`);
  console.log(`         manifest-chunks=${manifestStem.size} txt=${diskTxt.length} wavs=${diskWav.length} orphan-txt=${orphanTxt.length} orphan-wav=${orphanWav.length}`);
  for (const f of missingTxt) console.log(`         MISSING chunk txt: chunks/${f} (manifest-referenced; NOT deleted)`);

  for (const f of orphanTxt) markObsolete(join(chunkDir, f), 'orphan chunk txt (not referenced by manifest)');
  for (const f of orphanWav) markObsolete(join(audioDir, f), 'orphan wav (no manifest chunk)');
  for (const f of readdirSync(dir).filter((f) => /\.mp3$/.test(f) && /OLD|pre-lexicon/i.test(f))) {
    markObsolete(join(dir, f), 'stale backup mp3');
  }
}

// Book-level transient logs.
for (const f of readdirSync(ROOT).filter((f) => statSync(join(ROOT, f)).isFile() && /\.log$/.test(f))) {
  markObsolete(join(ROOT, f), 'transient log');
}

console.log(`\nsummary: ${current} current, ${stale} stale, ${incomplete} incomplete, ${noProv} no-provenance, ${malformed} malformed`);
console.log(`${APPLY ? 'DELETING' : 'obsolete (read-only; --apply to delete)'}: ${obsolete.length} files, ~${human(freed)}`);
for (const o of obsolete) console.log(`   ${o.path.replace(ROOT, '.')}  <- ${o.reason}`);

if (APPLY && obsolete.length) {
  for (const o of obsolete) rmSync(o.path, { force: true });
  console.log(`deleted: ${obsolete.length} obsolete file(s).`);
}
console.log(`retained: ${retained} manifest-backed chunk file(s) (never deleted).`);

// Combined/deliverable MP3s are NOT auto-deleted (they are sendable artifacts);
// re-assemble them after a re-render and remove the prior one by hand.

// Non-zero exit when the book is not in the clean zero-state, so CI/scripts can gate
// on it. After --apply the obsolete files are gone, so they no longer count against
// cleanliness -- which is what makes `--apply` followed by a re-run a proven no-op.
const remainingObsolete = APPLY ? 0 : obsolete.length;
const clean = stale === 0 && incomplete === 0 && noProv === 0 && malformed === 0 && remainingObsolete === 0;
process.exit(clean ? 0 : 1);
