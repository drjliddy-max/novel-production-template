// audiobook-status.test.mjs — the tracker is the thing that decides whether the
// audiobook on disk is trustworthy, so it gets tested against real fixture trees.
//
// Two failures this suite exists to prevent, both of which actually happened:
//
//   1. STALE-SETTINGS forever. The tracker required manifest.quotes_stripped, a
//      field nothing ever wrote. Every unit reported stale and NO render could
//      clear it -- the flag was unfalsifiable, so it meant nothing.
//   2. Invisible orphan chunk .txt files. A re-narrate that produced fewer chunks
//      left the old tail on disk. The tracker derived its chunk set from the
//      directory listing, so the strays looked like real chunks with missing audio.
//
// Both are now provenance-driven: the manifest is the authority on which chunks
// exist, and the render receipt (_voice.json) is the authority on how the audio
// was made.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { audioFingerprint } from '../lexicon-audio.mjs';

const TOOL = fileURLToPath(new URL('../audiobook-status.mjs', import.meta.url));
const sha = (s) => createHash('sha256').update(s).digest('hex');

const SOURCE = '# Ch\n\nFirst paragraph.\n\nLast paragraph.\n';
const LEXICON = JSON.stringify({ Quatora: 'kwa-TOR-a' }, null, 2) + '\n';

/**
 * Build a fixture book. Returns { root, manuscripts, lexicon }.
 * Each unit spec: { chunks, txt, wavs, voice, source, lexHash, pad, manifest }
 *  - chunks: how many chunks the MANIFEST declares
 *  - txt:    which chunk stems actually exist on disk (default: all manifest chunks)
 *  - wavs:   which wav stems actually exist on disk   (default: all manifest chunks)
 */
function build(units) {
  const base = mkdtempSync(join(tmpdir(), 'abstatus-'));
  const root = join(base, 'audiobook');
  const manuscripts = join(base, 'manuscripts');
  const lexicon = join(base, 'lexicon.json');
  mkdirSync(root, { recursive: true });
  mkdirSync(manuscripts, { recursive: true });
  writeFileSync(lexicon, LEXICON);
  writeFileSync(join(manuscripts, 'ch.md'), SOURCE);

  for (const [name, u] of Object.entries(units)) {
    const dir = join(root, name);
    mkdirSync(join(dir, 'chunks'), { recursive: true });
    mkdirSync(join(dir, 'audio'), { recursive: true });

    const width = u.pad ?? 4;
    const pad = (i) => String(i).padStart(width, '0');
    const n = u.chunks ?? 2;
    const all = Array.from({ length: n }, (_, i) => pad(i + 1));

    const manifestChunks = all.map((stem, i) => ({ i: i + 1, file: `chunks/${stem}.txt`, chars: 10 }));
    const manifest = u.manifest ?? {
      source: join(manuscripts, 'ch.md'),
      sources: { sourceSha256: u.source ?? sha(SOURCE) },
      lexiconSha256: u.lexHash === null ? undefined : (u.lexHash ?? sha(LEXICON)),
      voice_profile: u.voiceProfile ?? 'bm_george',
      chunk_count: n,
      chunks: manifestChunks,
    };
    if (u.lexHash === null) delete manifest.lexiconSha256;

    writeFileSync(join(dir, 'manifest.json'), u.rawManifest ?? JSON.stringify(manifest, null, 2));

    for (const stem of u.txt ?? all) writeFileSync(join(dir, 'chunks', `${stem}.txt`), 'text\n');
    for (const stem of u.wavs ?? all) writeFileSync(join(dir, 'audio', `${stem}.wav`), 'RIFF');
    for (const [f, body] of Object.entries(u.extraFiles ?? {})) writeFileSync(join(dir, f), body);

    if (u.voice !== null) {
      writeFileSync(
        join(dir, 'audio', '_voice.json'),
        JSON.stringify({
          engine: 'kokoro',
          voice: 'bm_george',
          quotes_stripped: true,
          mode: 'story-narration',
          renderedAt: '2026-07-12T12:00:00.000Z',
          ...(u.voice ?? {}),
        })
      );
    }
  }
  return { base, root, manuscripts, lexicon };
}

function run(fx, { apply = false, trackedOnly = false } = {}) {
  const args = [TOOL, fx.root, '--manuscripts', fx.manuscripts, '--lexicon', fx.lexicon];
  if (apply) args.push('--apply');
  if (trackedOnly) args.push('--tracked-only');
  try {
    const out = execFileSync(process.execPath, args, { encoding: 'utf8' });
    return { out, code: 0 };
  } catch (e) {
    return { out: (e.stdout ?? '') + (e.stderr ?? ''), code: e.status };
  }
}

// --------------------------------------------------------------------------
// Baseline: a clean unit is CURRENT and the book exits 0 with nothing obsolete.
// --------------------------------------------------------------------------
test('clean unit is CURRENT, zero obsolete, exit 0', () => {
  const fx = build({ ch01: {} });
  const { out, code } = run(fx);
  assert.match(out, /ch01\s+CURRENT/);
  assert.match(out, /summary: 1 current, 0 stale, 0 incomplete, 0 no-provenance, 0 malformed/);
  assert.match(out, /obsolete .*: 0 files/);
  assert.equal(code, 0);
  rmSync(fx.base, { recursive: true, force: true });
});

test('renderedAt date is surfaced (legibility), but currency is hash-proven', () => {
  const fx = build({ ch01: {} });
  const { out } = run(fx);
  assert.match(out, /rendered 2026-07-12 12:00Z/);
  rmSync(fx.base, { recursive: true, force: true });
});

// --------------------------------------------------------------------------
// Orphan detection — the manifest, not the directory, defines the valid set.
// --------------------------------------------------------------------------
test('extra .txt only -> orphan chunk txt, reported with path+reason, NOT deleted read-only', () => {
  const fx = build({ ch01: { chunks: 2, txt: ['0001', '0002', '0003'] } });
  const { out, code } = run(fx);
  assert.match(out, /orphan-txt=1/);
  assert.match(out, /chunks\/0003\.txt\s+<- orphan chunk txt \(not referenced by manifest\)/);
  assert.equal(code, 1, 'not the zero-state');
  assert.ok(existsSync(join(fx.root, 'ch01', 'chunks', '0003.txt')), 'read-only must not delete');
  rmSync(fx.base, { recursive: true, force: true });
});

test('extra .wav only -> orphan wav', () => {
  const fx = build({ ch01: { chunks: 2, wavs: ['0001', '0002', '0009'] } });
  const { out } = run(fx);
  assert.match(out, /orphan-wav=1/);
  assert.match(out, /audio\/0009\.wav\s+<- orphan wav \(no manifest chunk\)/);
  rmSync(fx.base, { recursive: true, force: true });
});

test('extra matching .txt AND .wav -> both flagged obsolete', () => {
  const fx = build({ ch01: { chunks: 2, txt: ['0001', '0002', '0003'], wavs: ['0001', '0002', '0003'] } });
  const { out } = run(fx);
  assert.match(out, /orphan-txt=1/);
  assert.match(out, /orphan-wav=1/);
  assert.match(out, /obsolete .*: 2 files/);
  rmSync(fx.base, { recursive: true, force: true });
});

test('exact-duplicate orphan (stale older split leaving a repeated tail) is obsolete', () => {
  // The real ch09a case: chunk 0130 was a byte-identical repeat of the true final
  // chunk 0129, left by an older narration. Duplicated content must not be
  // mistaken for real narration.
  const fx = build({
    ch09a: { chunks: 2, txt: ['0001', '0002', '0003'] },
  });
  writeFileSync(join(fx.root, 'ch09a', 'chunks', '0003.txt'), 'text\n'); // identical to 0002
  const { out } = run(fx);
  assert.match(out, /orphan-txt=1/);
  assert.match(out, /0003\.txt\s+<- orphan chunk txt/);
  rmSync(fx.base, { recursive: true, force: true });
});

test('valid FINAL chunk is never mistaken for an orphan', () => {
  const fx = build({ ch01: { chunks: 3 } });
  const { out, code } = run(fx);
  assert.match(out, /ch01\s+CURRENT/);
  assert.match(out, /orphan-txt=0/);
  assert.equal(code, 0);
  rmSync(fx.base, { recursive: true, force: true });
});

test('zero-padding width is taken from the manifest (3-digit pads work)', () => {
  const fx = build({ ch01: { chunks: 2, pad: 3, txt: ['001', '002', '003'] } });
  const { out } = run(fx);
  assert.match(out, /orphan-txt=1/);
  assert.match(out, /chunks\/003\.txt/);
  rmSync(fx.base, { recursive: true, force: true });
});

// --------------------------------------------------------------------------
// Gaps — a MISSING manifest-referenced file is incomplete, never deletable.
// --------------------------------------------------------------------------
test('missing expected chunk txt -> INCOMPLETE, reported, and NOT deleted', () => {
  const fx = build({ ch01: { chunks: 3, txt: ['0001', '0003'] } });
  const { out, code } = run(fx);
  assert.match(out, /INCOMPLETE \(missing 1 chunk txt\)/);
  assert.match(out, /MISSING chunk txt: chunks\/0002\.txt \(manifest-referenced; NOT deleted\)/);
  assert.equal(code, 1);
  rmSync(fx.base, { recursive: true, force: true });
});

test('missing wav -> INCOMPLETE (interrupted render)', () => {
  const fx = build({ ch01: { chunks: 4, wavs: ['0001'] } });
  const { out } = run(fx);
  assert.match(out, /INCOMPLETE \(1\/4 wavs\)/);
  rmSync(fx.base, { recursive: true, force: true });
});

// --------------------------------------------------------------------------
// Settings drift — the exact class of bug that made everything permanently stale.
// --------------------------------------------------------------------------
test('correct current settings -> CURRENT', () => {
  const fx = build({ ch01: { voice: { quotes_stripped: true } } });
  assert.match(run(fx).out, /ch01\s+CURRENT/);
  rmSync(fx.base, { recursive: true, force: true });
});

test('genuinely stale settings (quote-strip OFF) -> STALE-SETTINGS', () => {
  const fx = build({ ch01: { voice: { quotes_stripped: false, mode: 'raw' } } });
  const { out, code } = run(fx);
  assert.match(out, /STALE-SETTINGS \(no quote-strip\)/);
  assert.equal(code, 1);
  rmSync(fx.base, { recursive: true, force: true });
});

test('missing legacy setting metadata (no render receipt) -> NO-PROVENANCE, never CURRENT', () => {
  // The pre-fix world: audio exists, hashes match, but nothing recorded HOW it was
  // rendered. That must not silently pass as current.
  const fx = build({ ch01: { voice: null } });
  const { out, code } = run(fx);
  assert.match(out, /NO-PROVENANCE \(no render receipt\)/);
  assert.doesNotMatch(out, /ch01\s+CURRENT/);
  assert.equal(code, 1);
  rmSync(fx.base, { recursive: true, force: true });
});

test('changed voice -> STALE-SETTINGS (audio is not the book voice)', () => {
  const fx = build({ ch01: { voice: { voice: 'af_sky' } } });
  assert.match(run(fx).out, /STALE-SETTINGS \(voice af_sky != bm_george\)/);
  rmSync(fx.base, { recursive: true, force: true });
});

test('changed source -> STALE (manuscript changed)', () => {
  const fx = build({ ch01: { source: sha('# Ch\n\nDIFFERENT.\n') } });
  assert.match(run(fx).out, /STALE \(manuscript changed\)/);
  rmSync(fx.base, { recursive: true, force: true });
});

test('changed lexicon -> STALE (lexicon changed)', () => {
  const fx = build({ ch01: { lexHash: sha('{"Other":"oh-ther"}') } });
  assert.match(run(fx).out, /STALE \(lexicon changed\)/);
  rmSync(fx.base, { recursive: true, force: true });
});

test('missing lexicon hash -> NO-PROVENANCE (lexicon drift would be undetectable)', () => {
  const fx = build({ ch01: { lexHash: null } });
  assert.match(run(fx).out, /NO-PROVENANCE \(no lexicon hash\)/);
  rmSync(fx.base, { recursive: true, force: true });
});

// --------------------------------------------------------------------------
// Malformed manifests — fail SAFE (quarantine), never fail open (sweep).
// --------------------------------------------------------------------------
test('malformed manifest -> MALFORMED, and NOTHING in that unit is swept', () => {
  const fx = build({ ch01: { rawManifest: '{ this is not json', txt: ['0001', '0002', '0077'] } });
  const { out, code } = run(fx);
  assert.match(out, /ch01\s+MALFORMED/);
  assert.match(out, /quarantined, nothing swept here/);
  assert.match(out, /obsolete .*: 0 files/, 'a broken manifest must not authorize deletions');
  assert.equal(code, 1);
  rmSync(fx.base, { recursive: true, force: true });
});

test('manifest without chunks[] -> MALFORMED, not a crash', () => {
  const fx = build({ ch01: { rawManifest: JSON.stringify({ source: 'x' }) } });
  const { out } = run(fx);
  assert.match(out, /MALFORMED \(no chunks\[\] array\)/);
  rmSync(fx.base, { recursive: true, force: true });
});

// --------------------------------------------------------------------------
// --apply: deletes exactly the obsolete, keeps every manifest-backed file,
// and is idempotent (the second run is a proven no-op).
// --------------------------------------------------------------------------
test('--apply removes only obsolete files, never a manifest-referenced chunk', () => {
  const fx = build({
    ch01: { chunks: 2, txt: ['0001', '0002', '0003'], wavs: ['0001', '0002', '0008'] },
  });
  const before = run(fx);
  assert.match(before.out, /obsolete .*: 2 files/);

  const applied = run(fx, { apply: true });
  assert.match(applied.out, /deleted: 2 obsolete file\(s\)/);
  assert.match(applied.out, /retained: 2 manifest-backed chunk file\(s\)/);

  // the orphans are gone
  assert.ok(!existsSync(join(fx.root, 'ch01', 'chunks', '0003.txt')));
  assert.ok(!existsSync(join(fx.root, 'ch01', 'audio', '0008.wav')));
  // every manifest-referenced chunk survives
  assert.ok(existsSync(join(fx.root, 'ch01', 'chunks', '0001.txt')));
  assert.ok(existsSync(join(fx.root, 'ch01', 'chunks', '0002.txt')));
  assert.ok(existsSync(join(fx.root, 'ch01', 'audio', '0001.wav')));
  assert.ok(existsSync(join(fx.root, 'ch01', 'audio', '0002.wav')));
  rmSync(fx.base, { recursive: true, force: true });
});

test('--apply is idempotent: the second run finds nothing and exits 0', () => {
  const fx = build({ ch01: { chunks: 2, txt: ['0001', '0002', '0003'] } });
  const first = run(fx, { apply: true });
  assert.match(first.out, /deleted: 1 obsolete file\(s\)/);

  const second = run(fx, { apply: true });
  assert.match(second.out, /: 0 files/);
  assert.doesNotMatch(second.out, /deleted:/);
  assert.equal(second.code, 0, 'after cleanup the book is in the zero-state');

  const third = run(fx); // read-only re-check
  assert.match(third.out, /ch01\s+CURRENT/);
  assert.equal(third.code, 0);
  rmSync(fx.base, { recursive: true, force: true });
});

test('--apply on an already-clean unit is a no-op (no deletions, exit 0)', () => {
  const fx = build({ ch01: {} });
  const { out, code } = run(fx, { apply: true });
  assert.match(out, /: 0 files/);
  assert.doesNotMatch(out, /deleted:/);
  assert.equal(code, 0);
  assert.equal(readdirSync(join(fx.root, 'ch01', 'chunks')).length, 2);
  rmSync(fx.base, { recursive: true, force: true });
});

test('--apply sweeps stale backup mp3s and transient logs', () => {
  const fx = build({ ch01: { extraFiles: { 'Chapter-01-OLD.mp3': 'x', 'Chapter-01.mp3': 'keep' } } });
  writeFileSync(join(fx.root, 'render.log'), 'noise');
  const { out } = run(fx);
  assert.match(out, /Chapter-01-OLD\.mp3\s+<- stale backup mp3/);
  assert.match(out, /render\.log\s+<- transient log/);
  run(fx, { apply: true });
  assert.ok(!existsSync(join(fx.root, 'ch01', 'Chapter-01-OLD.mp3')));
  assert.ok(existsSync(join(fx.root, 'ch01', 'Chapter-01.mp3')), 'deliverable mp3 is never auto-deleted');
  rmSync(fx.base, { recursive: true, force: true });
});

// --------------------------------------------------------------------------
// --tracked-only: the CI gate.
//
// Audio and render receipts are gitignored, so on a CI runner they do not exist.
// A full check there would call every unit INCOMPLETE and fail forever -- a gate
// that can never pass is the same bug we just removed. CI therefore judges only
// what git actually carries, and must still catch the drift that CAN be committed.
// --------------------------------------------------------------------------
function stripAudio(fx, unit) {
  rmSync(join(fx.root, unit, 'audio'), { recursive: true, force: true });
}

test('--tracked-only PASSES when audio+receipt are absent (as on a CI runner)', () => {
  const fx = build({ ch01: {} });
  stripAudio(fx, 'ch01');
  const full = run(fx);
  assert.equal(full.code, 1, 'the FULL check correctly fails with no audio');

  const ci = run(fx, { trackedOnly: true });
  assert.match(ci.out, /ch01\s+TRACKED-OK/);
  assert.equal(ci.code, 0, 'the CI gate must be satisfiable without the audio');
  rmSync(fx.base, { recursive: true, force: true });
});

test('--tracked-only still FAILS on a manuscript edited without re-narrating', () => {
  const fx = build({ ch01: { source: sha('# Ch\n\nEDITED.\n') } });
  stripAudio(fx, 'ch01');
  const { out, code } = run(fx, { trackedOnly: true });
  assert.match(out, /STALE \(manuscript changed\)/);
  assert.equal(code, 1);
  rmSync(fx.base, { recursive: true, force: true });
});

test('--tracked-only still FAILS on a lexicon bumped without re-rendering', () => {
  const fx = build({ ch01: { lexHash: sha('{"New":"noo"}') } });
  stripAudio(fx, 'ch01');
  const { out, code } = run(fx, { trackedOnly: true });
  assert.match(out, /STALE \(lexicon changed\)/);
  assert.equal(code, 1);
  rmSync(fx.base, { recursive: true, force: true });
});

test('--tracked-only still FAILS on committed orphan chunk .txt files', () => {
  const fx = build({ ch01: { chunks: 2, txt: ['0001', '0002', '0003'] } });
  stripAudio(fx, 'ch01');
  const { out, code } = run(fx, { trackedOnly: true });
  assert.match(out, /orphan chunk txt/);
  assert.equal(code, 1);
  rmSync(fx.base, { recursive: true, force: true });
});

test('--tracked-only still FAILS on a malformed manifest', () => {
  const fx = build({ ch01: { rawManifest: '{ broken' } });
  stripAudio(fx, 'ch01');
  const { out, code } = run(fx, { trackedOnly: true });
  assert.match(out, /MALFORMED/);
  assert.equal(code, 1);
  rmSync(fx.base, { recursive: true, force: true });
});

test('--tracked-only REFUSES --apply (a CI gate must never delete)', () => {
  const fx = build({ ch01: { chunks: 2, txt: ['0001', '0002', '0003'] } });
  const args = [TOOL, fx.root, '--manuscripts', fx.manuscripts, '--lexicon', fx.lexicon, '--tracked-only', '--apply'];
  let code = 0, out = '';
  try { execFileSync(process.execPath, args, { encoding: 'utf8' }); }
  catch (e) { code = e.status; out = (e.stdout ?? '') + (e.stderr ?? ''); }
  assert.equal(code, 2);
  assert.match(out, /refusing: --tracked-only is a read-only CI gate/);
  assert.ok(existsSync(join(fx.root, 'ch01', 'chunks', '0003.txt')), 'nothing may be deleted');
  rmSync(fx.base, { recursive: true, force: true });
});

// --------------------------------------------------------------------------
// AUDIO-RELEVANT lexicon fingerprint (lexiconAudioSha256).
//
// The bug this section kills: the tracker judged lexicon currency by hashing the
// WHOLE lexicon file, so a metadata-only migration (status: locked -> unverified)
// re-staled all 26 Book I units without changing one pronunciation. A one-word
// `say` fix re-staled every chapter, not just the ones containing the word.
//
// With lexiconAudioSha256 present, currency is judged on the (key -> say)
// substitutions that actually fire against the unit's source.
// --------------------------------------------------------------------------

// A fixture with a chosen source text and lexicon OBJECT, and a manifest that stamps
// the audio fingerprint of (source x lexicon). The master lexicon file the tool reads
// starts equal to that object; a test then mutates the FILE and asserts the verdict.
function buildAudio({ source, lexicon, audioHash, includeWholeFileHash = true }) {
  const base = mkdtempSync(join(tmpdir(), 'abaudio-'));
  const root = join(base, 'audiobook');
  const manuscripts = join(base, 'manuscripts');
  const lexicon_path = join(base, 'lexicon.json');
  mkdirSync(join(root, 'ch01', 'chunks'), { recursive: true });
  mkdirSync(join(root, 'ch01', 'audio'), { recursive: true });
  mkdirSync(manuscripts, { recursive: true });
  const lexText = JSON.stringify(lexicon, null, 2) + '\n';
  writeFileSync(lexicon_path, lexText);
  writeFileSync(join(manuscripts, 'ch.md'), source);

  const manifest = {
    source: join(manuscripts, 'ch.md'),
    sources: { sourceSha256: sha(source) },
    ...(includeWholeFileHash ? { lexiconSha256: sha(lexText) } : {}),
    lexiconAudioSha256: audioHash ?? audioFingerprint(source, lexicon),
    voice_profile: 'bm_george',
    chunk_count: 1,
    chunks: [{ i: 1, file: 'chunks/0001.txt', chars: 10 }],
  };
  writeFileSync(join(root, 'ch01', 'manifest.json'), JSON.stringify(manifest, null, 2));
  writeFileSync(join(root, 'ch01', 'chunks', '0001.txt'), 'text\n');
  writeFileSync(join(root, 'ch01', 'audio', '0001.wav'), 'RIFF');
  writeFileSync(join(root, 'ch01', 'audio', '_voice.json'), JSON.stringify({
    engine: 'kokoro', voice: 'bm_george', quotes_stripped: true,
    mode: 'story-narration', renderedAt: '2026-07-12T12:00:00.000Z',
  }));
  return { base, root, manuscripts, lexicon: lexicon_path };
}

const SRC = '# Ch\n\nAerendyl rode to Cirshe and passed the Face of Ritilia.\n';
const LEX0 = {
  Aerendyl: { say: 'Airrendil', status: 'locked', note: '' },
  Cirshe: { say: 'Kirsha', status: 'locked' },
  'Face of Ritilia': { say: 'Face of Rit-ill-ee-a', status: 'confirmed' },
  Unused: { say: 'Zzz', status: 'locked' }, // never appears in SRC
};

test('audio fingerprint present + lexicon unchanged -> CURRENT', () => {
  const fx = buildAudio({ source: SRC, lexicon: LEX0 });
  const { out, code } = run(fx);
  assert.match(out, /ch01\s+CURRENT/);
  assert.equal(code, 0);
  rmSync(fx.base, { recursive: true, force: true });
});

test('metadata-only lexicon edit (status/note/verification) -> stays CURRENT (the fix)', () => {
  const fx = buildAudio({ source: SRC, lexicon: LEX0 });
  // Simulate the real schema migration: every entry demoted, notes appended, whole-file
  // hash changes -- but no `say` changes. The OLD tracker called this STALE for all units.
  const migrated = JSON.parse(JSON.stringify(LEX0));
  for (const k of Object.keys(migrated)) {
    migrated[k].status = 'unverified';
    migrated[k].note = (migrated[k].note || '') + ' [schema migration 2026-07-14]';
    migrated[k].verification = { method: 'listening', voice: 'kokoro/bm_george', date: '2026-07-14' };
  }
  writeFileSync(fx.lexicon, JSON.stringify(migrated, null, 2) + '\n');
  const { out, code } = run(fx);
  assert.match(out, /ch01\s+CURRENT/, 'a metadata-only lexicon edit must NOT stale the unit');
  assert.equal(code, 0);
  rmSync(fx.base, { recursive: true, force: true });
});

test('say-change to a key the source CONTAINS -> STALE (must re-render)', () => {
  const fx = buildAudio({ source: SRC, lexicon: LEX0 });
  const changed = JSON.parse(JSON.stringify(LEX0));
  changed.Cirshe.say = 'Keersh'; // Cirshe appears in SRC
  writeFileSync(fx.lexicon, JSON.stringify(changed, null, 2) + '\n');
  const { out, code } = run(fx);
  assert.match(out, /ch01\s+STALE \(lexicon changed\)/);
  assert.equal(code, 1);
  rmSync(fx.base, { recursive: true, force: true });
});

test('say-change to a key the source does NOT contain -> stays CURRENT (only affected chapters stale)', () => {
  const fx = buildAudio({ source: SRC, lexicon: LEX0 });
  const changed = JSON.parse(JSON.stringify(LEX0));
  changed.Unused.say = 'Qqq'; // Unused never appears in SRC
  writeFileSync(fx.lexicon, JSON.stringify(changed, null, 2) + '\n');
  const { out, code } = run(fx);
  assert.match(out, /ch01\s+CURRENT/, 'a word this unit does not contain must not stale it');
  assert.equal(code, 0);
  rmSync(fx.base, { recursive: true, force: true });
});

test('audio fingerprint works in --tracked-only (CI): metadata edit stays TRACKED-OK', () => {
  const fx = buildAudio({ source: SRC, lexicon: LEX0 });
  rmSync(join(fx.root, 'ch01', 'audio'), { recursive: true, force: true }); // as on a CI runner
  const migrated = JSON.parse(JSON.stringify(LEX0));
  for (const k of Object.keys(migrated)) migrated[k].status = 'unverified';
  writeFileSync(fx.lexicon, JSON.stringify(migrated, null, 2) + '\n');
  const { out, code } = run(fx, { trackedOnly: true });
  assert.match(out, /ch01\s+TRACKED-OK/);
  assert.equal(code, 0);
  rmSync(fx.base, { recursive: true, force: true });
});

test('legacy manifest (no lexiconAudioSha256) still uses the whole-file compare', () => {
  // Back-compat: before re-stamping, a unit with only lexiconSha256 must behave exactly
  // as before -- a changed lexicon file is STALE.
  const fx = buildAudio({ source: SRC, lexicon: LEX0 });
  // strip the audio hash to simulate a legacy manifest
  const mp = join(fx.root, 'ch01', 'manifest.json');
  const man = JSON.parse(readFileSync(mp, 'utf8'));
  delete man.lexiconAudioSha256;
  writeFileSync(mp, JSON.stringify(man, null, 2));
  // any file change (even metadata) trips the whole-file hash for a legacy manifest
  const migrated = JSON.parse(JSON.stringify(LEX0));
  migrated.Aerendyl.status = 'unverified';
  writeFileSync(fx.lexicon, JSON.stringify(migrated, null, 2) + '\n');
  const { out, code } = run(fx);
  assert.match(out, /ch01\s+STALE \(lexicon changed\)/);
  assert.equal(code, 1);
  rmSync(fx.base, { recursive: true, force: true });
});
