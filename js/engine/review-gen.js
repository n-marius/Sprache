// Generierte Wiederholungsaufgaben aus Vokabeln (vertragskonform, docs/CONTRACT.md) – Paket Engine.
// Jede Aufgabe: { id:'g-<vocabId>-<art>', type, vocab:[…], difficulty, generated:true, source_vocab, … }
// Auswahl-Optionen: richtige Option an Index 0 (die Komponenten mischen).
import { normalizeWord, words as ukWords } from '../lib/uk-text.js';
import { shuffle } from './util.js';
import { isListenOff, isSpeakOff } from '../audio-mode.js';

/** Arten generierter Aufgaben → Kategorie (wie srs.exerciseCategory). */
export const GEN_KINDS = {
  'mc-uk-de': 'recognize',
  'heard': 'recognize',
  'meaning': 'recognize',
  'pic': 'recognize',
  'pairs': 'recognize',
  'build-uk-de': 'recognize',
  'mc-de-uk': 'recall',
  'build-de-uk': 'produce',
  'speak': 'produce',
};
/** Bevorzugte Arten je Stufe (Reihenfolge = Vorrang bei gleichem Zufall). */
export const KINDS_BY_STAGE = {
  recognize: ['mc-uk-de', 'meaning', 'heard', 'pic', 'pairs', 'build-uk-de'],
  recall: ['mc-de-uk', 'heard'],
  produce: ['speak', 'build-de-uk'],
};

const DE_WORD = /[\p{L}\p{N}’'-]+/gu;
const deKey = s => String(s ?? '').normalize('NFC').toLowerCase().replace(/[!?.,;:„“"«»()…–—]/g, '').replace(/\s+/g, ' ').trim();
const ukKey = s => ukWords(String(s ?? '')).join(' ') || normalizeWord(String(s ?? ''));
const deWords = s => (String(s ?? '').normalize('NFC').match(DE_WORD) || []);

/** Standard-Pool für Distraktoren: Vokabeln der Lektion des Worts und aller früheren + alle eingeführten. */
export function defaultPool(app, vocab) {
  const c = app.content;
  const out = new Map();
  const lessonIds = new Set();
  if (vocab?.lessonId) {
    for (const l of c.lessonsBefore(vocab.lessonId)) lessonIds.add(l.id);
    lessonIds.add(vocab.lessonId);
  }
  const introduced = app.store?.state?.srs?.vocab || {};
  for (const v of c.vocabById.values()) {
    if (lessonIds.has(v.lessonId) || introduced[v.id]) out.set(v.id, v);
  }
  if (out.size < 6) for (const v of c.vocabById.values()) out.set(v.id, v);
  return [...out.values()];
}

/**
 * Distraktoren wählen: andere Vokabeln, gleiche pos bevorzugt, gleiche Lektion leicht bevorzugt,
 * keine Duplikate (uk nach normalizeWord, de case-insensitiv) – auch nicht zur richtigen Antwort.
 */
export function pickDistractors(vocab, pool, n, rng = Math.random, { need = v => true } = {}) {
  const usedUk = new Set([ukKey(vocab.uk)]);
  const usedDe = new Set([deKey(vocab.de)]);
  const cands = shuffle(pool.filter(v => v && v.id !== vocab.id && need(v)), rng)
    .map(v => ({ v, w: (v.pos === vocab.pos ? 2 : 0) + (v.lessonId === vocab.lessonId ? 0.5 : 0) + rng() * 0.8 }))
    .sort((a, b) => b.w - a.w);
  const out = [];
  for (const { v } of cands) {
    const ku = ukKey(v.uk), kd = deKey(v.de);
    if (!ku || !kd || usedUk.has(ku) || usedDe.has(kd)) continue;
    usedUk.add(ku); usedDe.add(kd);
    out.push(v);
    if (out.length >= n) break;
  }
  return out;
}

function base(vocab, art, type, difficulty, extra) {
  return { id: `g-${vocab.id}-${art}`, type, vocab: [vocab.id], difficulty, generated: true, source_vocab: vocab.id, ...extra };
}

/**
 * Eine Aufgabe der Art `art` für `vocab` erzeugen. → Aufgabe | null (wenn nicht sinnvoll möglich).
 * opts: { pool:[vocab] (Distraktor-Quelle), rng }
 */
export function generate(app, vocab, art, { pool, rng = Math.random } = {}) {
  if (!vocab || !vocab.uk || !vocab.de) return null;
  pool = pool || defaultPool(app, vocab);
  switch (art) {
    case 'mc-de-uk': case 'mc-uk-de': {
      const d = pickDistractors(vocab, pool, 3, rng);
      if (d.length < 2) return null;
      const deUk = art === 'mc-de-uk';
      return base(vocab, art, 'mc_translate', deUk ? 2 : 1, {
        dir: deUk ? 'de-uk' : 'uk-de',
        prompt: deUk ? vocab.de : vocab.uk,
        options: deUk ? [vocab.uk, ...d.map(v => v.uk)] : [vocab.de, ...d.map(v => v.de)],
      });
    }
    case 'heard': case 'meaning': {
      const d = pickDistractors(vocab, pool, 3, rng);
      if (d.length < 2) return null;
      return base(vocab, art, 'listening', 1, {
        mode: art === 'heard' ? 'choose_heard' : 'choose_meaning',
        audio_uk: vocab.uk,
        options: art === 'heard' ? [vocab.uk, ...d.map(v => v.uk)] : [vocab.de, ...d.map(v => v.de)],
      });
    }
    case 'pic': {
      if (!vocab.emoji) return null;
      const usedEmoji = new Set([vocab.emoji]);
      const d = pickDistractors(vocab, pool, 6, rng, { need: v => !!v.emoji })
        .filter(v => !usedEmoji.has(v.emoji) && usedEmoji.add(v.emoji)).slice(0, 3);
      if (d.length < 2) return null;
      return base(vocab, art, 'picture_choice', 1, {
        prompt_uk: vocab.uk,
        options: [{ emoji: vocab.emoji, de: vocab.de }, ...d.map(v => ({ emoji: v.emoji, de: v.de }))],
      });
    }
    case 'pairs': {
      const n = 3 + (rng() < 0.5 ? 1 : 0); // 4–5 Paare
      const d = pickDistractors(vocab, pool, n, rng);
      if (d.length < 3) return null;
      const all = [vocab, ...d];
      return base(vocab, art, 'match_pairs', 1, {
        vocab: all.map(v => v.id),
        pairs: all.map(v => ({ uk: v.uk, de: v.de })),
      });
    }
    case 'build-de-uk': case 'build-uk-de': {
      const ex = vocab.example;
      if (!ex || !ex.uk || !ex.de) return null;
      const deUk = art === 'build-de-uk';
      const answer = deUk ? ex.uk : ex.de;
      const answerWords = deUk ? ukWords(answer) : deWords(answer).map(w => w.toLowerCase());
      if (answerWords.length < 2) return null;
      const have = new Set(answerWords);
      const cands = [];
      for (const v of shuffle(pool.filter(v => v.id !== vocab.id), rng)) {
        const src = deUk ? [v.uk, ...(v.forms || []).map(f => f.uk)] : [v.de];
        for (const s of src) {
          if (deUk) { for (const p of String(s).split(/\s+/)) { const w = (p.match(/[Ѐ-ӿ́’'ʼ-]+/u) || [])[0]; if (w) cands.push(w); } }
          else for (const w of deWords(s)) cands.push(w);
        }
      }
      const distractors = [];
      for (const w of cands) {
        const k = deUk ? normalizeWord(w) : w.toLowerCase();
        if (!k || have.has(k)) continue;
        have.add(k); distractors.push(w);
        if (distractors.length >= 3) break;
      }
      if (distractors.length < 2) return null;
      return base(vocab, art, 'build_sentence', deUk ? 3 : 2, {
        dir: deUk ? 'de-uk' : 'uk-de',
        prompt: deUk ? ex.de : ex.uk,
        answer,
        distractors,
      });
    }
    case 'speak': {
      const ex = vocab.example;
      const uk = ex?.uk || vocab.uk, de = ex?.de || vocab.de;
      return base(vocab, art, 'speak', ex?.uk ? 2 : 1, { uk, de });
    }
    default: return null;
  }
}

/**
 * Aufgabe einer Stufe ('recognize'|'recall'|'produce') erzeugen; probiert die Arten der Stufe in
 * zufälliger (gewichteter) Reihenfolge, fällt bei Bedarf auf leichtere Stufen zurück.
 * opts: { pool, rng, avoid:Set<art> }
 */
export function generateForStage(app, vocab, stage, { pool, rng = Math.random, avoid } = {}) {
  const order = ['produce', 'recall', 'recognize'];
  const start = Math.max(0, order.indexOf(stage));
  for (const st of order.slice(start)) {
    const arts = shuffle(KINDS_BY_STAGE[st], rng).filter(a => !avoid || !avoid.has(a));
    for (const a of arts) {
      const ex = generate(app, vocab, a, { pool, rng });
      if (ex) return ex;
    }
  }
  return null;
}

/** Alle möglichen generierten Aufgaben zu einer Vokabel (z. B. für Tests/Trainer). */
export function generateAll(app, vocab, opts = {}) {
  return Object.keys(GEN_KINDS).map(a => generate(app, vocab, a, opts)).filter(Boolean);
}

/** Stufe einer Vokabel für Wiederholungen nach Stabilität (Research §6.1): S<3 → Erkennen/Abruf, sonst Produktion. */
export function stageForCard(card, rng = Math.random) {
  if (!card || !card.S || card.state === 'learning') return rng() < 0.5 ? 'recognize' : 'recall';
  if (card.S < 3) return rng() < 0.35 ? 'recognize' : 'recall';
  return rng() < 0.7 ? 'produce' : 'recall';
}

// ---------------- „Gerade kein Ton“: Hör-/Sprechaufgaben durch Textvarianten ersetzen ----------------
/** {listenOff, speakOff} aus js/audio-mode.js (oder übergeben). */
export function audioModeOf(app, mode) {
  if (mode && typeof mode === 'object') return { listenOff: !!mode.listenOff, speakOff: !!mode.speakOff };
  return { listenOff: isListenOff(app), speakOff: isSpeakOff(app) };
}

function findVocabFor(app, uk) {
  const k = ukKey(uk);
  if (!k) return { v: null, viaExample: null };
  let viaExample = null;
  for (const v of app.content.vocabById.values()) {
    if (ukKey(v.uk) === k) return { v, viaExample: null };
    if (!viaExample && v.example?.uk && ukKey(v.example.uk) === k) viaExample = v;
  }
  return { v: null, viaExample };
}

function adapted(orig, ex) {
  if (!ex) return null;
  const { id: genId, source_vocab, ...rest } = ex;
  return { ...rest, id: `${orig.id}~txt`, vocab: (orig.vocab && orig.vocab.length ? orig.vocab : ex.vocab),
    difficulty: orig.difficulty || ex.difficulty || 1, ...(orig.hint_de ? { hint_de: orig.hint_de } : {}),
    generated: true, adapted: true, orig_id: orig.id, ...(source_vocab ? { source_vocab } : {}) };
}

function ukDistractors(app, answer, pool, rng, given = []) {
  const have = new Set(ukWords(answer));
  const out = [];
  const cand = [...given, ...shuffle(pool, rng).flatMap(v => [v.uk, ...(v.forms || []).map(f => f.uk)])];
  for (const s of cand) {
    for (const p of String(s).split(/\s+/)) {
      const w = (p.match(/[Ѐ-ӿ́’'ʼ-]+/u) || [])[0];
      const k = w && normalizeWord(w);
      if (!k || have.has(k)) continue;
      have.add(k); out.push(w);
      if (out.length >= 3) return out;
    }
  }
  return out;
}

/**
 * Aufgabe an den Audio-Modus anpassen. → dieselbe Aufgabe (nichts zu tun) | Textvariante (id `<orig>~txt`,
 * adapted:true, generated:true → kein SRS-Eintrag für die Originalkarte) | null (auslassen).
 * mode: {listenOff, speakOff} (Default: aus js/audio-mode.js); opts: {rng, pool}
 */
export function adaptForAudio(app, ex, mode, { rng = Math.random, pool } = {}) {
  if (!ex) return null;
  const { listenOff, speakOff } = audioModeOf(app, mode);
  const vid = ex.source_vocab || (ex.vocab || [])[0];
  const v0 = vid ? app.content.vocabById.get(vid) : null;
  pool = pool || (v0 ? defaultPool(app, v0) : [...app.content.vocabById.values()]);
  if (ex.type === 'listening' && listenOff) {
    if (ex.generated && v0) return generate(app, v0, 'mc-uk-de', { pool, rng }) || generate(app, v0, 'pic', { pool, rng });
    if (ex.mode === 'choose_meaning' && Array.isArray(ex.options) && ex.options.length >= 2) {
      return adapted(ex, { type: 'mc_translate', dir: 'uk-de', prompt: ex.audio_uk, options: ex.options.slice() });
    }
    if (ex.mode === 'choose_heard') {
      const { v } = findVocabFor(app, ex.audio_uk);
      const g = v ? generate(app, v, 'mc-uk-de', { pool, rng }) : null;
      return g ? adapted(ex, { ...g, prompt: ex.audio_uk }) : null;
    }
    if (ex.mode === 'build') {
      const { v, viaExample } = findVocabFor(app, ex.audio_uk);
      const de = viaExample?.example?.de || (v && ukWords(ex.audio_uk).length > 1 ? v.de : null);
      if (!de) return null;
      const distractors = ukDistractors(app, ex.audio_uk, pool, rng, ex.distractors || []);
      if (distractors.length < 2) return null;
      return adapted(ex, { type: 'build_sentence', dir: 'de-uk', prompt: de, answer: ex.audio_uk, distractors });
    }
    return null;
  }
  if (ex.type === 'speak' && speakOff) {
    if (!ex.uk || !ex.de) return null;
    const distractors = ukDistractors(app, ex.uk, pool, rng);
    if (distractors.length >= 2) return adapted(ex, { type: 'build_sentence', dir: 'de-uk', prompt: ex.de, answer: ex.uk, distractors });
    return v0 ? (generate(app, v0, 'mc-de-uk', { pool, rng }) || null) : null;
  }
  return ex;
}
