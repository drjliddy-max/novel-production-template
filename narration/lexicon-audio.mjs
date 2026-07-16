// lexicon-audio.mjs — the AUDIO-RELEVANT projection of a pronunciation lexicon.
//
// WHY THIS EXISTS
// ---------------------------------------------------------------------------
// A render's audio depends on ONE thing in the lexicon: the `say` respelling that
// each key substitutes into the narrated text (see voice-engine/src/lexicon.mjs
// applyLexicon, which reads ONLY `say`). Everything else in an entry — `status`,
// `note`, `verification`, `ipa`, `source` — is human/evidence metadata the
// synthesizer never sees.
//
// The audiobook tracker used to judge lexicon currency by hashing the WHOLE
// lexicon file. That flipped the hash on ANY edit, so a metadata-only migration
// (status: locked -> unverified) or a one-word `say` correction re-staled all 26
// Book I units at once — even the chapters that do not contain the changed word.
// That is the false-positive the handoff kept flagging as "the real fix, still
// not done".
//
// The fix: judge currency on what the lexicon actually DOES to a unit's text.
// `firedSayMap` is the exact set of (key -> say) substitutions that fire against a
// given source, in applyLexicon's order; `audioFingerprint` hashes only that set.
// Consequences:
//   - a metadata-only edit changes no `say` -> identical fingerprint -> CURRENT.
//   - a `say` change stales ONLY the units whose source contains that key.
//
// MIRRORS voice-engine/src/lexicon.mjs applyLexicon step-for-step (longest key
// first, \bkey\b, case-sensitive, `say`-only, empty/absent `say` is a no-op). The
// two repos are not code-linked, so this is a deliberate duplicate; a golden test
// vector (lexicon-audio.test.mjs, and voice-engine/test/lexicon.test.mjs) pins the
// two copies to the same bytes. If you edit one, edit both and update the vector.

import { createHash } from 'node:crypto';

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Resolve an entry to its respelling: plain-string form, or rich { say } form
// (reading only `say`). null when there is no usable respelling — matching
// applyLexicon, which then leaves the original word intact.
function resolveSay(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && typeof value.say === 'string') return value.say;
  return null;
}

// The (key -> say) substitutions that ACTUALLY fire against `text`, in the same
// longest-first, mutate-as-you-go order applyLexicon uses. A key whose `say` is
// absent or empty is a no-op (mirrors applyLexicon's `if (!say) continue`). A key
// that does not occur in `text` is omitted, which is what makes a `say` change
// stale only the units that contain that key.
export function firedSayMap(text, lexicon) {
  if (!lexicon) return {};
  let out = text;
  const fired = {};
  const keys = Object.keys(lexicon).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    const say = resolveSay(lexicon[key]);
    if (!say) continue; // no respelling (or empty) — leave the original word, do not fingerprint it
    const re = new RegExp(`\\b${escapeRegex(key)}\\b`, 'g');
    if (re.test(out)) {
      fired[key] = say;
      out = out.replace(new RegExp(`\\b${escapeRegex(key)}\\b`, 'g'), say);
    }
  }
  return fired;
}

// A content hash over ONLY the audio-relevant substitutions that fire against
// `text`. Canonicalized (keys sorted) so it is stable across lexicon key order and
// metadata churn. null when no lexicon applied — parity with the whole-file
// lexiconSha256, which is also null then. This is what a manifest stamps as
// `lexiconAudioSha256` and what the tracker recomputes to prove a unit is current.
export function audioFingerprint(text, lexicon) {
  if (!lexicon) return null;
  const fired = firedSayMap(text, lexicon);
  const canon = JSON.stringify(fired, Object.keys(fired).sort());
  return createHash('sha256').update(canon).digest('hex');
}
