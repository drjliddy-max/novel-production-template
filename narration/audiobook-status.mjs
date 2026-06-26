#!/usr/bin/env node
// audiobook-status.mjs — KNOW which voice files are current / stale / invalid,
// and clean the obsolete ones so the disk always holds the correct set.
//
// Staleness is COMPUTED, never hand-maintained: each render's manifest.json
// records the manuscript hash (sourceSha256) and the lexicon hash (lexiconSha256)
// it was produced from. This tool re-hashes the CURRENT manuscript + master
// lexicon and compares. A chapter is:
//   CURRENT     - recorded hashes match the current source + lexicon, audio complete
//   STALE       - manuscript or lexicon changed since the render (audio is invalid)
//   INCOMPLETE  - fewer wavs than chunks (a render was interrupted)
//   NO-PROVENANCE - the manifest lacks hashes (cannot be proven current; re-stamp)
//
// Obsolete files (safe to delete): *OLD* / *pre-lexicon* backups, orphan wavs
// (a NNNN.wav with no current chunk NNNN.txt, left by a render with a different
// chunk count), and transient *_*.log files.
//
// Usage:
//   node audiobook-status.mjs <audiobook-root> --manuscripts <dir> --lexicon <master.json> [--apply]
//   --apply  actually delete the obsolete files (default is read-only report)
//
// Audio (wav/mp3) is gitignored on disk; this tool manages that disk set. The
// committed text artifacts (chunks/manifest/script) are never touched.

import { readFileSync, existsSync, readdirSync, statSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, basename } from 'node:path';

function arg(name, def) { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : def; }
const ROOT = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const MANU = arg('--manuscripts');
const LEX = arg('--lexicon');
const APPLY = process.argv.includes('--apply');
if (!ROOT || !MANU || !LEX) {
  console.error('usage: node audiobook-status.mjs <audiobook-root> --manuscripts <dir> --lexicon <master.json> [--apply]');
  process.exit(2);
}

const sha = (p) => (existsSync(p) ? createHash('sha256').update(readFileSync(p)).digest('hex') : null);
const human = (n) => (n > 1e6 ? (n / 1e6).toFixed(0) + 'M' : (n / 1e3).toFixed(0) + 'K');
const lexHash = sha(LEX);
const obsolete = [];
let freed = 0;
let stale = 0, incomplete = 0, noProv = 0, current = 0;

console.log(`master lexicon: ${basename(LEX)} (${lexHash?.slice(0, 12)})\n`);

// Each chapter = a subdir of ROOT that has a manifest.json.
const chapterDirs = readdirSync(ROOT).map((d) => join(ROOT, d)).filter((d) => statSync(d).isDirectory() && existsSync(join(d, 'manifest.json')));
for (const dir of chapterDirs) {
  const ch = basename(dir);
  const man = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
  const srcFile = man.source ? join(MANU, basename(man.source)) : null;
  const curSrc = srcFile ? sha(srcFile) : null;
  const recSrc = man?.sources?.sourceSha256 || man?.sourceSha256 || null;
  const recLex = man?.lexiconSha256 || null;
  const chunkNums = new Set(existsSync(join(dir, 'chunks')) ? readdirSync(join(dir, 'chunks')).filter((f) => f.endsWith('.txt')).map((f) => f.replace('.txt', '')) : []);
  const wavs = existsSync(join(dir, 'audio')) ? readdirSync(join(dir, 'audio')).filter((f) => f.endsWith('.wav')) : [];
  const orphanWavs = wavs.filter((w) => !chunkNums.has(w.replace('.wav', '')));

  let status;
  if (!recSrc) { status = 'NO-PROVENANCE'; noProv++; }
  else if (curSrc && recSrc !== curSrc) { status = 'STALE (manuscript changed)'; stale++; }
  else if (recLex && recLex !== lexHash) { status = 'STALE (lexicon changed)'; stale++; }
  // Settings drift: a render whose hashes match but whose render SETTINGS no longer
  // match the standard is still effectively stale (it sounds wrong). The narration
  // standard is one steady voice = quotes stripped; a render without it carries the
  // dialogue voice-shift even though its source/lexicon are current.
  else if (man.quotes_stripped !== true) { status = 'STALE-SETTINGS (no quote-strip)'; stale++; }
  else if (wavs.length < chunkNums.size) { status = `INCOMPLETE (${wavs.length}/${chunkNums.size})`; incomplete++; }
  else { status = 'CURRENT'; current++; }

  console.log(`${ch.padEnd(8)} ${status}`);
  console.log(`         chunks=${chunkNums.size} wavs=${wavs.length} orphan-wavs=${orphanWavs.length}`);
  for (const w of orphanWavs) { const p = join(dir, 'audio', w); obsolete.push(p); freed += statSync(p).size; }
  for (const f of readdirSync(dir).filter((f) => /\.mp3$/.test(f) && /OLD|pre-lexicon/i.test(f))) {
    const p = join(dir, f); console.log(`         obsolete backup: ${f} (${human(statSync(p).size)})`); obsolete.push(p); freed += statSync(p).size;
  }
}

// Book-level transient logs.
for (const f of readdirSync(ROOT).filter((f) => statSync(join(ROOT, f)).isFile() && /\.log$/.test(f))) {
  const p = join(ROOT, f); console.log(`\n(log) ${f} (${human(statSync(p).size)}) <-- transient`); obsolete.push(p); freed += statSync(p).size;
}

console.log(`\nsummary: ${current} current, ${stale} stale, ${incomplete} incomplete, ${noProv} no-provenance`);
console.log(`${APPLY ? 'DELETING' : 'obsolete (read-only; --apply to delete)'}: ${obsolete.length} files, ~${human(freed)}`);
for (const p of obsolete) console.log(`   ${p.replace(ROOT, '.')}`);
if (APPLY && obsolete.length) { for (const p of obsolete) rmSync(p, { force: true }); console.log('deleted.'); }
// Combined/deliverable MP3s are NOT auto-deleted (they are sendable artifacts);
// re-assemble them after a re-render and remove the prior one by hand.
