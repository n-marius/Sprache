// FSRS-light (FSRS-6-Default-Gewichte, Ziel-Retention 0,90) – siehe docs/research-didactics.md §6.2.
// Karten: state.srs.vocab[vocabId], state.srs.ex['lessonId/exId'].
// Card = { S, D, state:'new'|'learning'|'review', reps, lapses, last, due, intro, seen, ok, prod, lastAt, lastRating }
//   S/D: Stabilität (Tage) / Schwierigkeit (1–10), null solange noch nie bewertet
//   last: Lerntag des letzten FSRS-Updates, due: Lerntag der nächsten Fälligkeit, intro: Lerntag der Einführung
//   seen/ok: alle bewerteten Abrufe/richtige (auch am selben Tag), prod: richtige Produktionen (Sprechen/Satzbau DE→UK)
import { dayDiff, addDays, hashStr, clamp, now } from './util.js';

export const W = [0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001,
  1.8722, 0.1666, 0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014,
  1.8729, 0.5425, 0.0912, 0.0658, 0.1542];
export const DECAY = -W[20];
export const FACTOR = Math.pow(0.9, 1 / DECAY) - 1;
export const TARGET_R = 0.9;
export const MAX_INTERVAL = 365;
export const RATING = { AGAIN: 1, HARD: 2, GOOD: 3, EASY: 4 };

export function retrievabilityAt(t, S) {
  if (!S || S <= 0) return 0;
  return Math.pow(1 + FACTOR * Math.max(0, t) / S, DECAY);
}
export function initStability(G) { return W[G - 1]; }
export function initDifficulty(G) { return clamp(W[4] - Math.exp(W[5] * (G - 1)) + 1, 1, 10); }
export function nextDifficulty(D, G) {
  const d1 = D + (-W[6] * (G - 3)) * (10 - D) / 9;
  return clamp(W[7] * initDifficulty(4) + (1 - W[7]) * d1, 1, 10);
}
export function nextStability(S, D, R, G) {
  let s;
  if (G === 1) {
    const long = W[11] * Math.pow(D, -W[12]) * (Math.pow(S + 1, W[13]) - 1) * Math.exp(W[14] * (1 - R));
    s = Math.min(long, S / Math.exp(W[17] * W[18]));
  } else {
    s = S * (1 + Math.exp(W[8]) * (11 - D) * Math.pow(S, -W[9]) * (Math.exp(W[10] * (1 - R)) - 1)
      * (G === 2 ? W[15] : 1) * (G === 4 ? W[16] : 1));
  }
  return Math.max(s, 0.01);
}
/** Intervall in Tagen (≈ S bei r=0,9); ab 3 Tagen ±5 % deterministischer Fuzz. */
export function intervalDays(S, fuzzKey = '') {
  let iv = S / FACTOR * (Math.pow(TARGET_R, 1 / DECAY) - 1);
  iv = clamp(Math.round(iv), 1, MAX_INTERVAL);
  if (iv >= 3 && fuzzKey) {
    const f = (hashStr(fuzzKey) % 1001) / 1000 * 0.1 - 0.05; // −5 % … +5 %
    iv = clamp(Math.round(iv * (1 + f)), 1, MAX_INTERVAL);
  }
  return iv;
}

export function newCard(today) {
  return { S: null, D: null, state: 'new', reps: 0, lapses: 0, last: null, due: today, intro: today, seen: 0, ok: 0, prod: 0, lastAt: null, lastRating: null };
}
export function elapsedDays(card, today) { return card && card.last ? Math.max(0, dayDiff(card.last, today)) : 0; }
export function retrievability(card, today) {
  if (!card || !card.S) return 0;
  return retrievabilityAt(elapsedDays(card, today), card.S);
}
export function isDue(card, today) { return !!card && (!card.due || card.due <= today); }

/**
 * Bewertung anwenden. Nur der erste bewertete Abruf pro Karte und Lerntag ändert S/D
 * (spätere steuern nur die Session). Erster Abruf einer neuen Karte: höchstens Good.
 * Mutiert und liefert die Karte.
 */
export function applyRating(card, G, today, { id = '', ms = now(), productive = false, correct = G > 1 } = {}) {
  card.seen = (card.seen || 0) + 1;
  if (correct) card.ok = (card.ok || 0) + 1;
  if (correct && productive) card.prod = (card.prod || 0) + 1;
  card.lastAt = ms;
  if (card.reps > 0 && card.last === today) return card; // gleicher Tag: kein FSRS-Update
  if (!card.reps || card.S == null) {
    G = Math.min(G, 3);
    card.S = initStability(G);
    card.D = initDifficulty(G);
  } else {
    const R = retrievabilityAt(elapsedDays(card, today), card.S);
    const S = nextStability(card.S, card.D, R, G);
    card.D = nextDifficulty(card.D, G);
    card.S = S;
  }
  if (G === 1 && card.reps > 0) card.lapses = (card.lapses || 0) + 1;
  card.reps = (card.reps || 0) + 1;
  card.state = G === 1 ? 'learning' : 'review';
  card.last = today;
  card.lastRating = G;
  card.due = addDays(today, intervalDays(card.S, `${id}:${card.reps}`));
  return card;
}

// ---------- Aufgabentyp → Kategorie → Bewertung ----------
/** 'recognize' (Wiedererkennen) | 'recall' (gestützter Abruf) | 'produce' (Produktion) */
export function exerciseCategory(ex) {
  if (!ex) return 'recognize';
  switch (ex.type) {
    case 'mc_translate': return ex.dir === 'de-uk' ? 'recall' : 'recognize';
    case 'build_sentence': return ex.dir === 'uk-de' ? 'recognize' : 'produce';
    case 'listening': return ex.mode === 'build' ? 'recall' : 'recognize';
    case 'cloze': case 'chat': return 'recall';
    case 'speak': return 'produce';
    default: return 'recognize'; // match_pairs, picture_choice, true_false, reading, order_dialog
  }
}
export const STAGE = { recognize: 0, recall: 1, produce: 2 };

/**
 * Rating 1–4 aus Aufgabe + Ergebnis (Tabelle „Bewertung aus Aufgabentyp“). null = nicht bewerten (skipped).
 */
export function deriveRating(ex, result, card) {
  if (!result || result.skipped) return null;
  if (!result.correct) return RATING.AGAIN;
  const cat = exerciseCategory(ex);
  const isReview = card && card.state === 'review';
  if (cat === 'recognize') return result.hinted ? RATING.HARD : (isReview ? RATING.HARD : RATING.GOOD);
  if (result.hinted || (typeof result.score === 'number' && result.score < 0.75)) return RATING.HARD;
  if (cat === 'produce' && ex.type !== 'speak' && isReview && (card.S || 0) >= 3
    && typeof result.durationMs === 'number' && result.durationMs > 0 && result.durationMs < 5000) return RATING.EASY;
  return RATING.GOOD;
}

/** Vokabel-IDs, die eine Aufgabe übt. */
export function exVocab(ex) {
  const ids = Array.isArray(ex?.vocab) ? ex.vocab.slice() : [];
  if (ex?.source_vocab && !ids.includes(ex.source_vocab)) ids.unshift(ex.source_vocab);
  return ids;
}
export function exCardKey(lessonId, ex) { return `${lessonId}/${ex.id}`; }

/**
 * Ergebnis einer Aufgabe in den SRS-Zustand schreiben (mutiert srs = state.srs).
 * - Vertragsaufgaben: Karte srs.ex['lessonId/exId'] + eingeführte Vokabelkarten
 * - generierte Aufgaben: nur Vokabelkarten
 * Vokabeln werden nur bewertet, wenn sie eingeführt sind (Karte existiert).
 * Bei falscher Antwort ohne vocabResults und > 2 Vokabeln ist unklar, woran es lag → Vokabeln bleiben unbewertet.
 */
export function recordResult(srs, { ex, lessonId, generated }, result, today, ms = now()) {
  const out = { ratings: {}, exRating: null, reviewed: 0 };
  if (!result || result.skipped) return out;
  const productive = exerciseCategory(ex) === 'produce';
  if (!generated && !ex.generated && lessonId) {
    const key = exCardKey(lessonId, ex);
    const card = srs.ex[key] || (srs.ex[key] = newCard(today));
    const wasReview = card.reps > 0 && card.last !== today;
    const G = deriveRating(ex, result, card);
    if (G) { applyRating(card, G, today, { id: key, ms, productive, correct: !!result.correct }); out.exRating = G; if (wasReview) out.reviewed++; }
  }
  const ids = exVocab(ex);
  const vr = result.vocabResults && typeof result.vocabResults === 'object' ? result.vocabResults : null;
  for (const id of ids) {
    const card = srs.vocab[id];
    if (!card) continue;
    let r = result;
    if (vr && id in vr) r = { ...result, correct: !!vr[id] };
    else if (!result.correct && ids.length > 2) continue;
    const wasReview = card.reps > 0 && card.last !== today;
    const G = deriveRating(ex, r, card);
    if (!G) continue;
    applyRating(card, G, today, { id, ms, productive, correct: !!r.correct });
    out.ratings[id] = G;
    if (wasReview) out.reviewed++;
  }
  return out;
}

// ---------- Anzeige ----------
/** Stärke 0–4 (wie Meisterschaftsstufen): 0 nicht eingeführt, 1 neu/wackelig, 2 S<7, 3 S<21, 4 S≥21 & R≥0,8 */
export function strengthLevel(card, today) {
  if (!card) return 0;
  if (!card.reps || !card.S) return 1;
  const R = retrievability(card, today);
  if (card.state === 'learning' || R < 0.7 || card.S < 2) return 1;
  if (card.S < 7) return 2;
  if (card.S < 21 || R < 0.8) return 3;
  return 4;
}
export const STRENGTH_LABEL = ['nicht eingeführt', 'neu', 'im Aufbau', 'gefestigt', 'sicher'];
