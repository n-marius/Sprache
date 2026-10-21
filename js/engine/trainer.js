// Vokabeltrainer (Paket Trainer): lektionsunabhängig, eigenes FSRS-light-SRS je Richtung.
// Karten: state.srs.trainer['<vocabId>|de-uk' | '<vocabId>|uk-de' | 'm:<minedId>|<dir>'] (Card-Format aus srs.js).
// Neue Trainer-Karten übernehmen S/D/letzten Lerntag der Lektions-Vokabelkarte (falls vorhanden).
// Abgleich: Ein Trainer-„Gut“/„Leicht“ in DE→UK aktualisiert eine FÄLLIGE Lektionskarte schwach (als Good, 1× pro Tag
// über die FSRS-Regel „erster Abruf pro Lerntag“); „Nochmal“ im Trainer straft die Lektionskarte nicht.
// Manuelle Markierung „schwierig“: state.trainer.marked[vocabId] = true.
import * as srs from './srs.js';
import { now, mulberry32, hashStr, shuffle, addDays, dayDiff } from './util.js';
import { dayKey, isUnlocked, applyStreak } from './progress.js';
import { pickDistractors, deShort } from './review-gen.js';
import { listMined } from '../services/mining.js';
import { isListenOff } from '../audio-mode.js';

export const MAX_CARDS = 20;
export const MAX_NEW = 10;
export const DIRS = ['de-uk', 'uk-de'];
export const RATING_LABELS = { 1: 'Nochmal', 2: 'Schwer', 3: 'Gut', 4: 'Leicht' };
const MAX_REPEATS = 2;

export const cardKey = (entry, dir) => `${entry.kind === 'sentence' ? 'm:' + entry.id : entry.id}|${dir}`;

function tstate(s) {
  s.srs ||= { vocab: {}, ex: {} };
  s.srs.trainer ||= {};
  s.trainer ||= {};
  s.trainer.marked ||= {};
  s.trainer.prefs ||= {};
  return s;
}
const trainerCards = app => app.store.state.srs?.trainer || {};

// ---------------- Einträge ----------------
/** Vokabel → Trainer-Eintrag */
function vocabEntry(v) {
  return { kind: 'vocab', id: v.id, uk: v.uk, de: v.de, pos: v.pos, info: v.info, emoji: v.emoji || null,
    example: v.example || null, forms: v.forms || [], lessonId: v.lessonId, vocab: v };
}
/** Gesammelter Satz → Eintrag (Fokuswort für die Lücke) */
function sentenceEntry(m) {
  return { kind: 'sentence', id: m.id, uk: m.uk, de: m.de, focus: m.focus || null, lessonId: m.lessonId || null, mined: m };
}

/** Vokabeln aller freigeschalteten Lektionen (Kursreihenfolge). */
export function unlockedVocab(app) {
  const out = [];
  for (const l of app.content.readyLessons()) {
    if (!isUnlocked(app, l.id)) continue;
    for (const v of app.content.getLesson(l.id)?.vocab || []) {
      const full = app.content.vocabById.get(v.id);
      if (full && full.lessonId === l.id) out.push(full);
    }
  }
  return out;
}

/** Ist ein Eintrag „schwierig“? (manuell markiert, viele Fehler oder niedrige Stabilität trotz Wiederholungen) */
export function isHard(app, entry) {
  const st = app.store.state;
  if (entry.kind === 'vocab' && st.trainer?.marked?.[entry.id]) return true;
  const cards = [trainerCards(app)[cardKey(entry, 'de-uk')], trainerCards(app)[cardKey(entry, 'uk-de')]];
  if (entry.kind === 'vocab') cards.push(st.srs?.vocab?.[entry.id]);
  return cards.some(c => c && ((c.lapses || 0) >= 2 || ((c.reps || 0) >= 3 && (c.S || 0) < 3) || (c.reps > 0 && c.lastRating === 1)));
}

export function isMarked(app, vocabId) { return !!app.store.state.trainer?.marked?.[vocabId]; }
export function toggleMarked(app, vocabId, on) {
  let val;
  app.store.update(s => { tstate(s); val = on ?? !s.trainer.marked[vocabId]; if (val) s.trainer.marked[vocabId] = true; else delete s.trainer.marked[vocabId]; });
  return val;
}

/** Einträge eines Umfangs: 'due' | 'all' | 'lesson:<id>' | 'hard' | 'mined' */
export function entriesFor(app, scope = 'due') {
  const unlocked = unlockedVocab(app).map(vocabEntry);
  const sentences = listMined(app).filter(m => m && m.uk).map(sentenceEntry);
  if (scope === 'mined') return sentences;
  if (scope.startsWith('lesson:')) {
    const id = scope.slice(7);
    return (app.content.getLesson(id)?.vocab || []).map(v => app.content.vocabById.get(v.id)).filter(Boolean).map(vocabEntry);
  }
  if (scope === 'hard') return [...unlocked, ...sentences].filter(e => isHard(app, e));
  if (scope === 'all') return unlocked;
  // due: alles, was gelernt wurde/fällig sein kann – freigeschaltete Vokabeln + Sätze
  return [...unlocked, ...sentences];
}

/** Neue Trainer-Karte (Start aus der Lektionskarte, wenn vorhanden). */
export function seedCard(app, entry, dir, today = dayKey()) {
  const c = srs.newCard(today);
  const lc = entry.kind === 'vocab' ? app.store.state.srs?.vocab?.[entry.id] : null;
  if (lc && lc.S && lc.reps > 0 && lc.last) {
    // UK→DE (Erkennen) ist leichter als DE→UK (Abruf): volle bzw. 70 % der Lektionsstabilität
    c.S = Math.max(0.5, lc.S * (dir === 'uk-de' ? 1 : 0.7));
    c.D = lc.D;
    c.reps = 1;
    c.state = 'review';
    c.last = lc.last;
    c.due = addDays(lc.last, srs.intervalDays(c.S));
    c.seeded = true;
  }
  return c;
}

/** Fällig in Richtung dir? Neue Karten (ohne Trainer-Karte) zählen als „neu“, nicht als fällig. */
function cardInfo(app, entry, dir, today) {
  const key = cardKey(entry, dir);
  const card = trainerCards(app)[key] || null;
  const seeded = card ? null : seedCard(app, entry, dir, today);
  const eff = card || (seeded.reps ? seeded : null);
  return { key, card, seeded, isNew: !eff, due: eff ? srs.isDue(eff, today) : false, R: eff ? srs.retrievability(eff, today) : 0 };
}

// ---------------- Statistik ----------------
/** → { due, learned, hard, sentences, total, newAvailable, lessons:[{id,title_de,title_uk,count}] } */
export function trainerStats(app) {
  const today = dayKey();
  const unlocked = unlockedVocab(app).map(vocabEntry);
  const sentences = listMined(app).filter(m => m && m.uk).map(sentenceEntry);
  let due = 0, learned = 0, hard = 0, fresh = 0;
  for (const e of [...unlocked, ...sentences]) {
    const a = cardInfo(app, e, 'de-uk', today), b = cardInfo(app, e, 'uk-de', today);
    if (a.due || b.due) due++;
    if (!a.isNew || !b.isNew) learned++; else fresh++;
    if (isHard(app, e)) hard++;
  }
  const lessons = app.content.readyLessons().filter(l => isUnlocked(app, l.id))
    .map(l => ({ id: l.id, title_de: l.title_de, title_uk: l.title_uk, theme: l.theme, count: (app.content.getLesson(l.id)?.vocab || []).length }));
  return { due, learned, hard, sentences: sentences.length, total: unlocked.length, newAvailable: fresh, lessons };
}

/** Anzahl Karten, die eine Runde mit diesem Umfang hätte (für die Auswahl-Liste). */
export function scopeCount(app, scope) {
  if (scope === 'due') return trainerStats(app).due;
  return entriesFor(app, scope).length;
}

// ---------------- Intervalle ----------------
export function formatInterval(days) {
  if (days <= 0) return '< 1 T';
  if (days < 30) return `${days} T`;
  if (days < 365) return `${Math.round(days / 30.4)} Mon.`;
  return `${(days / 365).toFixed(1).replace('.', ',')} J.`;
}

/** Nächstes Intervall je Bewertung → {1:{days,label},…,4}. „Nochmal“ = in dieser Runde erneut (< 1 T bzw. 1 T). */
export function previewIntervals(app, item, today = dayKey()) {
  const base = item.card || trainerCards(app)[item.key] || seedCard(app, item.entry, item.dir, today);
  const out = {};
  for (const G of [1, 2, 3, 4]) {
    const c = structuredClone(base);
    srs.applyRating(c, G, today, { id: item.key });
    const days = Math.max(0, dayDiff(today, c.due));
    out[G] = { days, label: G === 1 ? '< 1 T' : formatInterval(days) };
  }
  return out;
}

// ---------------- Runde ----------------
/**
 * createTrainerRound(app, {dir:'de-uk'|'uk-de'|'mixed', scope, mode:'card'|'choice'|'listen', seed, max, maxNew})
 * → { dir, scope, mode, items, next(), rate(item, G, {ms}), answer(item, correct, {ms}), choices(item), preview(item),
 *     progress(), remaining(), finish() → Summary }
 * Item = { key, entry, dir, isNew, retry? }  Summary = { total, counts:{1,2,3,4}, correct, newCards, durationMs, … }
 */
export function createTrainerRound(app, opts = {}) {
  const dirOpt = opts.dir || 'de-uk';
  const scope = opts.scope || 'due';
  let mode = opts.mode || 'card';
  if (mode === 'listen' && isListenOff(app)) mode = 'choice';
  const max = opts.max || MAX_CARDS;
  const maxNew = opts.maxNew ?? MAX_NEW;
  const today = dayKey();
  const rng = mulberry32(opts.seed ?? hashStr(`trainer:${scope}:${dirOpt}:${now()}`));
  let entries = entriesFor(app, scope);
  // Hörmodus: nur Vokabeln (Bedeutung zum Gehörten); Sätze im Karten-/Auswahlmodus
  if (mode === 'listen') entries = entries.filter(e => e.kind === 'vocab');

  const cands = [];
  for (const e of entries) {
    let dirs = dirOpt === 'mixed' ? DIRS : [dirOpt];
    if (mode === 'listen') dirs = ['uk-de'];
    const infos = dirs.map(d => ({ d, ...cardInfo(app, e, d, today) }));
    // gemischt: fällige Richtung bevorzugen, sonst zufällig
    const pickInfo = dirOpt === 'mixed' && mode !== 'listen'
      ? (infos.filter(x => x.due).sort((a, b) => a.R - b.R)[0] || infos[Math.floor(rng() * infos.length)])
      : infos[0];
    cands.push({ e, ...pickInfo, hard: isHard(app, e), r: rng() });
  }
  const due = cands.filter(c => c.due).sort((a, b) => a.R - b.R || a.r - b.r);
  const fresh = cands.filter(c => c.isNew).sort((a, b) => a.r - b.r); // Kursreihenfolge leicht gemischt
  fresh.sort((a, b) => (entries.indexOf(a.e) - entries.indexOf(b.e)) + (a.r - b.r) * 6);
  const ahead = cands.filter(c => !c.due && !c.isNew).sort((a, b) => a.R - b.R || a.r - b.r);
  let chosen;
  if (scope === 'due') chosen = [...due.slice(0, max), ...fresh.slice(0, Math.min(maxNew, Math.max(0, max - due.length)))];
  else if (scope === 'hard') chosen = [...due, ...ahead, ...fresh].slice(0, max);
  else chosen = [...due, ...fresh.slice(0, maxNew), ...ahead].slice(0, max);
  const queue = shuffle(chosen, rng).map(c => ({ key: c.key, entry: c.e, dir: c.d, isNew: c.isNew, hard: c.hard }));

  let pos = 0;
  const t0 = now();
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const stats = { total: 0, correct: 0, newCards: 0, ms: 0, lessonSynced: 0 };
  const repeats = new Map();
  let extended = false;
  let summary = null;

  function rate(item, G, { ms = 0 } = {}) {
    if (!item || item._done || !G) return { requeued: null };
    item._done = true;
    G = Math.max(1, Math.min(4, Math.round(G)));
    const dur = Math.max(0, Math.min(180000, Math.round(ms || 0)));
    let synced = false;
    app.store.update(s => {
      tstate(s);
      let c = s.srs.trainer[item.key];
      if (!c) { c = s.srs.trainer[item.key] = seedCard(app, item.entry, item.dir, today); stats.newCards++; }
      srs.applyRating(c, G, today, { id: item.key, productive: item.dir === 'de-uk', correct: G > 1 });
      // schwacher Abgleich mit der Lektionskarte (nur DE→UK, nur bei Erfolg, nur wenn fällig)
      if (item.entry.kind === 'vocab' && item.dir === 'de-uk' && G >= 3) {
        const lc = s.srs.vocab[item.entry.id];
        if (lc && lc.reps > 0 && lc.last !== today && srs.isDue(lc, today)) {
          srs.applyRating(lc, 3, today, { id: item.entry.id, productive: true, correct: true });
          synced = true;
        }
      }
      const day = (s.days[today] ||= { tasks: 0, correct: 0, ms: 0, newWords: 0, sessions: 0 });
      day.tasks = (day.tasks || 0) + 1;
      if (G > 1) day.correct = (day.correct || 0) + 1;
      day.ms = (day.ms || 0) + dur;
      day.trainer = (day.trainer || 0) + 1;
      if (day.tasks >= (s.settings?.dailyGoal || 15) && applyStreak(s, today).extended) extended = true;
    });
    counts[G]++;
    stats.total++;
    if (G > 1) stats.correct++;
    stats.ms += dur;
    if (synced) stats.lessonSynced++;
    let requeued = null;
    if (G === 1) {
      const n = repeats.get(item.key) || 0;
      if (n < MAX_REPEATS) {
        repeats.set(item.key, n + 1);
        requeued = { key: item.key, entry: item.entry, dir: item.dir, isNew: false, hard: true, retry: n + 1 };
        queue.splice(Math.min(queue.length, pos + 3 + Math.floor(rng() * 3)), 0, requeued);
      }
    }
    return { requeued };
  }

  return {
    dir: dirOpt, scope, mode,
    get items() { return queue.slice(); },
    get size() { return queue.length; },
    next() { return pos < queue.length ? queue[pos++] : null; },
    rate,
    /** Auswahl/Hören: richtig → Gut (bei Wiederholungs-Karte mit Hinweis Schwer), falsch → Nochmal */
    answer(item, correct, { ms = 0, hinted = false } = {}) { return rate(item, correct ? (hinted ? 2 : 3) : 1, { ms }); },
    preview: item => previewIntervals(app, item, today),
    choices: item => buildChoices(app, item, rng, mode),
    progress() {
      if (!queue.length) return 1;
      return Math.min(1, queue.filter(i => i._done).length / queue.length);
    },
    remaining() { return queue.filter(i => !i._done).length; },
    finish() {
      if (summary) return summary;
      if (stats.total > 0) {
        app.store.update(s => {
          tstate(s);
          s.trainer.rounds = (s.trainer.rounds || 0) + 1;
          s.trainer.lastAt = new Date(now()).toISOString();
          if (applyStreak(s, today).extended) extended = true;
        });
      }
      const day = app.store.state.days?.[today] || {};
      const goal = app.store.state.settings?.dailyGoal || 15;
      summary = {
        kind: 'trainer', dir: dirOpt, scope, mode,
        total: stats.total, correct: stats.correct, accuracy: stats.total ? stats.correct / stats.total : 1,
        counts: { ...counts }, newCards: stats.newCards, lessonSynced: stats.lessonSynced,
        durationMs: stats.ms || Math.max(0, now() - t0),
        streak: { current: app.store.state.streak?.current || 0, extended },
        dayGoal: { done: day.tasks || 0, goal, met: (day.tasks || 0) >= goal },
      };
      return summary;
    },
  };
}

// ---------------- Darstellung ----------------
/** Satz mit Lücke beim Fokuswort: → {before, gap, after} (gap = Fokuswort aus dem Satz) | null */
export function gapSentence(uk, focus) {
  if (!uk || !focus) return null;
  const norm = s => s.normalize('NFD').replace(/́/g, '').normalize('NFC').toLowerCase().replace(/[ʼ'`´‘’]/g, '’');
  const target = norm(focus);
  const re = /[Ѐ-ӿ](?:[Ѐ-ӿ́ʼ'’‘-]*[Ѐ-ӿ́])?/g;
  for (const m of uk.normalize('NFC').matchAll(re)) {
    if (norm(m[0]) === target) {
      const src = uk.normalize('NFC');
      return { before: src.slice(0, m.index), gap: m[0], after: src.slice(m.index + m[0].length) };
    }
  }
  return null;
}

/** Vorder-/Rückseite eines Items → {front:{uk?|de?, lang}, back:{uk, de}, gap?} */
export function cardFaces(item) {
  const e = item.entry;
  if (e.kind === 'sentence') {
    const gap = gapSentence(e.uk, e.focus);
    if (item.dir === 'de-uk') return { front: { lang: 'de', text: e.de, gap }, back: { uk: e.uk, de: e.de }, sentence: true };
    return { front: { lang: 'uk', text: e.uk }, back: { uk: e.uk, de: e.de }, sentence: true };
  }
  if (item.dir === 'de-uk') return { front: { lang: 'de', text: e.de, emoji: e.emoji }, back: { uk: e.uk, de: e.de, example: e.example } };
  return { front: { lang: 'uk', text: e.uk }, back: { uk: e.uk, de: e.de, emoji: e.emoji, example: e.example } };
}

/** 4 Auswahl-Optionen (Index 0 = richtig; die View mischt) → {prompt, promptLang, options:[{text, lang}], audio?} | null */
function buildChoices(app, item, rng, mode) {
  const e = item.entry;
  const pool = [...app.content.vocabById.values()];
  if (e.kind === 'sentence') {
    // Satz: DE→UK = Fokuswort wählen; UK→DE = Übersetzung aus anderen Sätzen/Beispielen
    if (item.dir === 'de-uk') {
      const gap = gapSentence(e.uk, e.focus);
      if (!gap) return null;
      const fake = { id: '_m', uk: gap.gap, de: '\u0000' + e.id, pos: null };
      const d = pickDistractors(fake, pool, 3, rng);
      if (d.length < 2) return null;
      return { prompt: e.de, promptLang: 'de', gap, options: [gap.gap, ...d.map(v => v.uk)].map(text => ({ text, lang: 'uk' })) };
    }
    const others = shuffle([...listMined(app).filter(m => m.id !== e.id && m.de && m.de !== e.de).map(m => m.de),
      ...pool.filter(v => v.example?.de && v.example.de !== e.de).map(v => v.example.de)], rng);
    const opts = [...new Set(others)].slice(0, 3);
    if (opts.length < 2) return null;
    return { prompt: e.uk, promptLang: 'uk', options: [e.de, ...opts].map(text => ({ text, lang: 'de' })) };
  }
  const v = e.vocab || app.content.vocabById.get(e.id);
  const d = pickDistractors(v, pool, 3, rng);
  if (d.length < 2) return null;
  if (mode === 'listen' || item.dir === 'uk-de') {
    return { prompt: v.uk, promptLang: 'uk', audio: mode === 'listen' ? v.uk : null, options: [deShort(v.de), ...d.map(x => deShort(x.de))].map(text => ({ text, lang: 'de' })) };
  }
  return { prompt: v.de, promptLang: 'de', emoji: v.emoji || null, options: [v.uk, ...d.map(x => x.uk)].map(text => ({ text, lang: 'uk' })) };
}

/** Gespeicherte Auswahl der Startseite */
export function getPrefs(app) {
  const p = app.store.state.trainer?.prefs || {};
  return { dir: p.dir || 'de-uk', scope: p.scope || 'due', mode: p.mode || 'card' };
}
export function setPrefs(app, patch) {
  app.store.update(s => { tstate(s); Object.assign(s.trainer.prefs, patch); }, { silent: true });
}
