// Lern-Sessions (Paket Engine): Lektions- und Wiederholungs-Session. API laut docs/ARCHITECTURE.md.
// Didaktik: docs/research-didactics.md §6.1 (Nutzer-Vorgaben: ~15 bewertete Aufgaben, 5 neue Wörter).
//
// Item = { key, kind:'intro', vocab, lessonId }
//      | { key, kind:'tip', grammar, lessonId }                      (Tipp-Karte, unbewertet)
//      | { key, kind:'exercise', ex, lessonId, generated?, stage, review?, retry? }
import * as srs from './srs.js';
import { now, mulberry32, hashStr, shuffle, clamp } from './util.js';
import { generate, generateForStage, defaultPool, stageForCard } from './review-gen.js';
import { dayKey, lessonMastery, applyStreak, nextLesson, MAX_NEW_PER_DAY, REVIEW_DAY_THRESHOLD } from './progress.js';

export const STAGES = ['recognize', 'recall', 'produce'];
export const REVIEW_SHARE = 0.25;       // Anteil alter/fälliger Elemente in Lektions-Sessions (~20–30 %)
export const MAX_EXTRA_ATTEMPTS = 2;    // Zusatzversuche je Fehler-Item
export const DAILY_REVIEW_LIMIT = 60;
const HEAVY = new Set(['chat', 'reading', 'order_dialog']);

function cfgOf(app, opts) {
  const s = app.store.state.settings || {};
  const int = (v, lo, hi, d) => (Number.isFinite(+v) && +v > 0 ? clamp(Math.round(+v), lo, hi) : d);
  return {
    size: int(opts.size ?? s.sessionSize, 3, 50, 15),
    newWords: int(opts.newWords ?? s.newWordsPerSession, 1, MAX_NEW_PER_DAY, 5),
    goal: int(s.dailyGoal, 1, 500, 15),
  };
}
function ensureDay(s, day) {
  const d = (s.days[day] ||= {});
  for (const k of ['tasks', 'correct', 'ms', 'newWords', 'sessions']) if (typeof d[k] !== 'number') d[k] = 0;
  return d;
}
function ensureLesson(s, id) {
  const l = (s.lessons[id] ||= { sessions: 0, completedAt: null, lastAt: null, exSeen: {} });
  l.exSeen ||= {};
  if (typeof l.sessions !== 'number') l.sessions = 0;
  return l;
}
const exItem = (ex, lessonId, stage, extra = {}) => ({
  key: ex.generated ? `gen:${ex.id}` : `${lessonId}/${ex.id}`,
  kind: 'exercise', ex, lessonId, stage: stage || srs.exerciseCategory(ex),
  ...(ex.generated ? { generated: true } : {}), ...extra,
});
const vocabOfLesson = (app, lessonId) => (app.content.getLesson(lessonId)?.vocab || []).map(v => ({ ...v, lessonId }));

/** Lektionsaufgaben, deren Vokabeln (dieser Lektion) alle bekannt sind. */
function eligibleExercises(lesson, lessonId, known) {
  const ids = new Set(lesson.vocab.map(v => v.id));
  return lesson.exercises.filter(ex => srs.exVocab(ex).every(id => !ids.has(id) || known(id)));
}

/**
 * Alte Elemente früherer Lektionen für das Interleaving: fällige zuerst (niedrigste R), dann schwächste.
 * → [Item] (generierte Aufgaben + frühere Lektionsaufgaben)
 */
function oldItems(app, { n, lessonIds, today, rng, excludeKeys = new Set() }) {
  if (n <= 0) return [];
  const st = app.store.state;
  const cards = st.srs.vocab;
  const cands = [];
  for (const v of app.content.vocabById.values()) {
    const c = cards[v.id];
    if (!c || !lessonIds.has(v.lessonId)) continue;
    cands.push({ v, c, due: srs.isDue(c, today), R: srs.retrievability(c, today), r: rng() });
  }
  cands.sort((a, b) => (b.due - a.due) || (a.R - b.R) || (a.r - b.r));
  const out = [];
  const usedVocab = new Set();
  for (const { v, c } of cands) {
    if (out.length >= n) break;
    if (usedVocab.has(v.id)) continue;
    let item = null;
    if (rng() < 0.5) {
      const lesson = app.content.getLesson(v.lessonId);
      const exs = lesson ? eligibleExercises(lesson, v.lessonId, id => !!cards[id])
        .filter(ex => srs.exVocab(ex).includes(v.id) && !excludeKeys.has(`${v.lessonId}/${ex.id}`)) : [];
      if (exs.length) {
        const seen = st.lessons[v.lessonId]?.exSeen || {};
        const scored = exs.map(ex => {
          const ec = st.srs.ex[srs.exCardKey(v.lessonId, ex)];
          return { ex, w: (ec && srs.isDue(ec, today) ? -5 : 0) + (seen[ex.id]?.n || 0) + (HEAVY.has(ex.type) ? 2 : 0) + rng() * 2 };
        }).sort((a, b) => a.w - b.w);
        item = exItem(scored[0].ex, v.lessonId, null, { review: true });
      }
    }
    if (!item) {
      const ex = rng() < 0.2 ? generate(app, v, rng() < 0.5 ? 'heard' : 'meaning', { rng }) : null;
      const g = ex || generateForStage(app, v, stageForCard(c, rng), { rng });
      if (g) item = exItem(g, v.lessonId, null, { review: true });
    }
    if (!item || excludeKeys.has(item.key)) continue;
    excludeKeys.add(item.key);
    for (const id of srs.exVocab(item.ex)) usedVocab.add(id);
    out.push(item);
  }
  return out;
}

/** Aufeinanderfolgende Aufgaben zur selben Vokabel möglichst trennen (≥ 1–2 andere dazwischen). */
function spread(items) {
  const a = items.slice();
  const share = (x, y) => x && y && srs.exVocab(x.ex).some(id => srs.exVocab(y.ex).includes(id));
  for (let i = 1; i < a.length; i++) {
    if (!share(a[i], a[i - 1]) && !share(a[i], a[i - 2])) continue;
    for (let j = i + 1; j < a.length; j++) {
      if (!share(a[j], a[i - 1]) && !share(a[j], a[i - 2])) {
        // nur ziehen, wenn dadurch keine Einführungsreihenfolge verletzt wird (gleiche oder spätere Priorität erlaubt)
        if ((a[j]._p ?? 0) - (a[i]._p ?? 0) > 2.5) break;
        const [x] = a.splice(j, 1); a.splice(i, 0, x); break;
      }
    }
  }
  return a;
}

/**
 * Lektions-Session.
 * opts: { seed, size, newWords, type (nur diesen Aufgabentyp – Entwicklung) }
 */
export function createLessonSession(app, lessonId, opts = {}) {
  const c = app.content;
  const lesson = c.getLesson(lessonId);
  if (!lesson) throw new Error(`Lektion nicht geladen: ${lessonId}`);
  const st = app.store.state;
  const today = dayKey();
  const cfg = cfgOf(app, opts);
  const lst = st.lessons[lessonId] || {};
  const seed = opts.seed ?? hashStr(`${lessonId}:${lst.sessions || 0}:${now()}`);
  const rng = mulberry32(seed);
  const cards = st.srs.vocab;
  const lessonVocab = vocabOfLesson(app, lessonId);
  const lessonVocabIds = new Set(lessonVocab.map(v => v.id));

  // ---- neue Wörter (Tageslimit 10; bei > 80 fälligen keine neuen, außer die Lektion wäre sonst nicht startbar)
  let due = 0;
  for (const v of c.vocabById.values()) if (cards[v.id] && srs.isDue(cards[v.id], today)) due++;
  const newToday = st.days[today]?.newWords || 0;
  let nNew = due > REVIEW_DAY_THRESHOLD ? 0 : Math.min(cfg.newWords, Math.max(0, MAX_NEW_PER_DAY - newToday));
  const notIntro = lessonVocab.filter(v => !cards[v.id]);
  if (!nNew && notIntro.length && !lessonVocab.some(v => cards[v.id])) nNew = Math.min(2, cfg.newWords);
  const newVocab = notIntro.slice(0, nNew);
  const newRank = new Map(newVocab.map((v, i) => [v.id, i]));
  const known = id => !!cards[id] || newRank.has(id);
  const pool = defaultPool(app, lessonVocab[0] || null);

  // ---- Anteil alter Elemente
  const before = new Set(c.lessonsBefore(lessonId).map(l => l.id));
  const usedKeys = new Set();
  const nOldWanted = before.size ? Math.max(3, Math.round(cfg.size * REVIEW_SHARE)) : 0;
  let old = opts.type ? [] : oldItems(app, { n: Math.min(nOldWanted, Math.floor(cfg.size / 2)), lessonIds: before, today, rng, excludeKeys: usedKeys });
  const C = cfg.size - old.length;

  // ---- Kern: Lektionsaufgaben + Stufenfolge je neuem Wort
  const exSeen = lst.exSeen || {};
  const info = eligibleExercises(lesson, lessonId, known)
    .filter(ex => !opts.type || ex.type === opts.type)
    .map(ex => {
      const ec = st.srs.ex[srs.exCardKey(lessonId, ex)];
      return { ex, cat: srs.exerciseCategory(ex), seen: exSeen[ex.id]?.n || 0, dueEx: !!ec && srs.isDue(ec, today),
        ids: srs.exVocab(ex).filter(id => lessonVocabIds.has(id)), r: rng() };
    });
  const score = (e, stage) => e.seen * 10 - (e.dueEx ? 4 : 0) + (e.ex.difficulty || 1) * 1.5
    + (stage === 'recognize' && HEAVY.has(e.ex.type) ? 4 : 0) + e.r * 4;
  const core = [];
  const taken = new Set();
  const cover = new Map();
  const maxP = Math.max(4, newVocab.length + 4);
  const prioOf = (ids, cat) => {
    let p = -1;
    for (const id of ids) if (newRank.has(id)) p = Math.max(p, newRank.get(id) + 2 * STAGES.indexOf(cat));
    return p;
  };
  const add = (item, p) => {
    if (usedKeys.has(item.key)) return false;
    usedKeys.add(item.key);
    item._p = p;
    core.push(item);
    for (const id of srs.exVocab(item.ex)) if (newRank.has(id)) (cover.get(id) || cover.set(id, new Set()).get(id)).add(item.stage);
    return true;
  };
  if (!opts.type) {
    for (const [si, stage] of STAGES.entries()) {
      for (const v of newVocab) {
        if (core.length >= C) break;
        if (cover.get(v.id)?.has(stage)) continue;
        const p = newRank.get(v.id) + 2 * si;
        const cands = info.filter(e => !taken.has(e) && e.cat === stage && e.ids.includes(v.id))
          .sort((a, b) => score(a, stage) - score(b, stage));
        if (cands.length) { taken.add(cands[0]); add(exItem(cands[0].ex, lessonId, stage), Math.max(p, prioOf(cands[0].ids, stage))); continue; }
        const g = generateForStage(app, v, stage, { pool, rng });
        if (g) add(exItem(g, lessonId), p);
      }
    }
  }
  // Auffüllen: wenig gesehene Lektionsaufgaben, dann generierte zu schwachen Lektionsvokabeln
  const rest = info.filter(e => !taken.has(e)).sort((a, b) => score(a, a.cat) - score(b, b.cat));
  for (const e of rest) {
    if (core.length >= C) break;
    taken.add(e);
    const pNew = prioOf(e.ids, e.cat);
    const p = pNew >= 0 ? pNew + 0.5 : STAGES.indexOf(e.cat) * (maxP / 3) + rng() * (maxP / 2);
    add(exItem(e.ex, lessonId), p);
  }
  if (core.length < C && !opts.type) {
    const weak = lessonVocab.filter(v => known(v.id))
      .map(v => ({ v, R: cards[v.id] ? srs.retrievability(cards[v.id], today) : 0, r: rng() }))
      .sort((a, b) => (a.R - b.R) || (a.r - b.r));
    for (let round = 0; round < 3 && core.length < C; round++) {
      for (const { v } of weak) {
        if (core.length >= C) break;
        const stage = cards[v.id] ? stageForCard(cards[v.id], rng) : STAGES[round];
        const g = generateForStage(app, v, stage, { pool, rng, avoid: new Set(core.filter(i => i.generated && i.ex.source_vocab === v.id).map(i => i.ex.id.split('-').slice(2).join('-'))) });
        if (g) add(exItem(g, lessonId), STAGES.indexOf(srs.exerciseCategory(g)) * (maxP / 3) + rng() * maxP / 2);
      }
    }
  }
  core.sort((a, b) => a._p - b._p);
  let seq = spread(core);

  // ---- alte Elemente gleichmäßig einstreuen (nicht ganz am Anfang)
  if (old.length) {
    const out = [];
    const step = (seq.length + old.length) / (old.length + 1);
    let oi = 0;
    for (let i = 0, pos = 0; pos < seq.length + old.length; pos++) {
      if (oi < old.length && pos >= Math.round(step * (oi + 1)) - 1 && pos > 0) out.push(old[oi++]);
      else if (i < seq.length) out.push(seq[i++]);
      else out.push(old[oi++]);
    }
    seq = out;
  }

  // ---- Einführungen direkt vor der ersten Übung des Worts
  const items = [];
  const introduced = new Set();
  for (const it of seq) {
    for (const id of srs.exVocab(it.ex)) {
      if (newRank.has(id) && !introduced.has(id)) {
        introduced.add(id);
        items.push({ key: `intro:${id}`, kind: 'intro', vocab: newVocab[newRank.get(id)], lessonId });
      }
    }
    items.push(it);
  }

  // ---- Tipp-Karte (eine Grammatik-Karte pro Session, nach ~1/3)
  if (lesson.grammar?.length && !opts.type) {
    const gi = (lst.sessions || 0) % lesson.grammar.length;
    let at = Math.max(1, Math.round(items.length / 3));
    while (at < items.length && items[at - 1]?.kind === 'intro') at++;
    items.splice(at, 0, { key: `tip:${lessonId}:${gi}`, kind: 'tip', grammar: lesson.grammar[gi], lessonId });
  }
  for (const it of items) delete it._p;

  return runtime(app, {
    kind: 'lesson', lessonId, theme: lesson.theme, title_uk: lesson.title_uk, title_de: lesson.title_de,
    items, rng, today, cfg, seed, pool,
  });
}

/**
 * Wiederholungs-Session: fällige Vokabeln (niedrigste R zuerst, Tageslimit 60), sonst die schwächsten.
 * Mischt generierte Aufgaben und passende Lektionsaufgaben. Ohne eingeführte Vokabeln → Lektions-Session.
 * opts: { seed, size }
 */
export function createReviewSession(app, opts = {}) {
  const st = app.store.state;
  const today = dayKey();
  const cfg = cfgOf(app, opts);
  const cards = st.srs.vocab;
  const seed = opts.seed ?? hashStr(`review:${now()}`);
  const rng = mulberry32(seed);
  const all = [...app.content.vocabById.values()].filter(v => cards[v.id]);
  if (!all.length) {
    const l = nextLesson(app) || app.content.readyLessons()[0];
    return createLessonSession(app, l.id, opts);
  }
  const reviewsToday = st.days[today]?.reviews || 0;
  const cap = Math.max(0, DAILY_REVIEW_LIMIT - reviewsToday);
  const lessonIds = new Set(app.content.readyLessons().map(l => l.id));
  const cands = all.map(v => ({ v, due: srs.isDue(cards[v.id], today), R: srs.retrievability(cards[v.id], today) }));
  const dueN = cands.filter(x => x.due).length;
  let items = oldItems(app, { n: Math.min(cfg.size, Math.max(dueN ? Math.min(dueN, cap) : 0, cfg.size)), lessonIds, today, rng });
  items = spread(shuffle(items, rng));
  const counts = {};
  for (const it of items) { const th = app.content.getLesson(it.lessonId)?.theme; if (th) counts[th] = (counts[th] || 0) + 1; }
  const theme = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || app.content.readyLessons()[0]?.theme || 'greetings';
  return runtime(app, {
    kind: 'review', lessonId: null, theme, title_uk: 'Повто́рення', title_de: 'Wiederholung',
    items, rng, today, cfg, seed, dueCount: dueN,
  });
}

// ---------------- Laufzeit (gemeinsam) ----------------
function runtime(app, m) {
  const { kind, lessonId, rng, today, cfg } = m;
  const queue = m.items;
  let pos = 0;
  const t0 = now();
  const stats = { total: 0, correct: 0, skipped: 0, ms: 0 };
  const attempts = new Map();     // baseKey → Zusatzversuche
  const wrongKeys = new Set();
  const newWords = [];
  const reviewed = new Set();
  let extended = false;
  let summary = null;
  const masteryBefore = lessonId ? lessonMastery(app, lessonId) : null;

  function introduce(it) {
    const id = it.vocab.id;
    app.store.update(s => {
      if (!s.srs.vocab[id]) { s.srs.vocab[id] = srs.newCard(today); ensureDay(s, today).newWords++; }
    });
    if (!newWords.some(v => v.id === id)) newWords.push(it.vocab);
  }

  function requeue(item) {
    const base = item.baseKey || item.key;
    const n = attempts.get(base) || 0;
    if (n >= MAX_EXTRA_ATTEMPTS) return null;
    attempts.set(base, n + 1);
    let ex = item.ex;
    // Zweiter Zusatzversuch oder zufällig: andere Form derselben Vokabel
    const vid = item.ex.source_vocab || srs.exVocab(item.ex).find(id => app.store.state.srs.vocab[id]);
    const v = vid && app.content.vocabById.get(vid);
    if (v && (n === 1 || rng() < 0.35)) {
      const art = item.generated ? item.ex.id.slice(`g-${vid}-`.length) : null;
      const g = generateForStage(app, v, item.stage === 'produce' ? 'recall' : item.stage, { pool: m.pool, rng, avoid: art ? new Set([art]) : undefined });
      if (g) ex = g;
    }
    const copy = {
      ...exItem(ex, ex.generated ? v?.lessonId || item.lessonId : item.lessonId, ex === item.ex ? item.stage : null, item.review ? { review: true } : {}),
      key: `${base}#r${n + 1}`, baseKey: base, retry: n + 1,
    };
    const gap = 3 + Math.floor(rng() * 3); // nach 3–5 Aufgaben
    const at = Math.min(queue.length, pos + gap);
    queue.splice(at, 0, copy);
    return copy;
  }

  const session = {
    kind, lessonId, theme: m.theme, title_uk: m.title_uk, title_de: m.title_de, seed: m.seed,
    get items() { return queue.slice(); },
    next() {
      if (pos >= queue.length) return null;
      const it = queue[pos++];
      if (it.kind === 'intro') introduce(it);
      return it;
    },
    /** Ergebnis verbuchen. → { requeued: Item|null, ratings } */
    record(item, result) {
      if (!item || item.kind !== 'exercise' || !result || item._done) return { requeued: null, ratings: {} };
      item._done = true;
      const ms = clamp(Math.round(+result.durationMs || 0), 0, 180000);
      stats.ms += ms;
      if (result.skipped) {
        stats.skipped++;
        app.store.update(s => { ensureDay(s, today).ms += ms; });
        return { requeued: null, ratings: {} };
      }
      const ts = now();
      let out = null;
      let goalReached = false;
      app.store.update(s => {
        const day = ensureDay(s, today);
        out = srs.recordResult(s.srs, item, result, today, ts);
        day.tasks++;
        if (result.correct) day.correct++;
        day.ms += ms;
        if (out.reviewed) day.reviews = (day.reviews || 0) + out.reviewed;
        if (!item.generated && !item.ex.generated && item.lessonId) {
          const L = ensureLesson(s, item.lessonId);
          const e = (L.exSeen[item.ex.id] ||= { n: 0, ok: 0, lastAt: null });
          e.n++; if (result.correct) e.ok++; e.lastAt = ts;
        }
        if (day.tasks >= (s.settings?.dailyGoal || cfg.goal)) { goalReached = true; if (applyStreak(s, today).extended) extended = true; }
      });
      stats.total++;
      if (result.correct) stats.correct++;
      const introducedNow = new Set(newWords.map(v => v.id));
      for (const id of Object.keys(out?.ratings || {})) if (!introducedNow.has(id)) reviewed.add(id);
      let requeued = null;
      if (!result.correct) { wrongKeys.add(item.baseKey || item.key); requeued = requeue(item); }
      return { requeued, ratings: out?.ratings || {}, goalReached };
    },
    progress() {
      if (!queue.length) return 1;
      let done = 0;
      for (let i = 0; i < pos; i++) { const it = queue[i]; if (it.kind !== 'exercise' || it._done) done++; }
      return Math.min(1, done / queue.length);
    },
    remaining() { return queue.filter(it => it.kind === 'exercise' && !it._done).length; },
    finish() {
      if (summary) return summary;
      const complete = pos >= queue.length;
      const iso = new Date(now()).toISOString();
      let firstCompletion = false;
      app.store.update(s => {
        const day = ensureDay(s, today);
        if (stats.total > 0) day.sessions++;
        if (lessonId && (stats.total > 0 || complete)) {
          const L = ensureLesson(s, lessonId);
          L.sessions++;
          L.lastAt = iso;
          if (complete && !L.completedAt) { L.completedAt = iso; firstCompletion = true; }
        }
        if (stats.total > 0 && applyStreak(s, today).extended) extended = true;
      });
      const s = app.store.state;
      const day = s.days[today] || {};
      const goal = s.settings?.dailyGoal || cfg.goal;
      const masteryAfter = lessonId ? lessonMastery(app, lessonId) : null;
      summary = {
        kind, lessonId, theme: m.theme, title_uk: m.title_uk, title_de: m.title_de,
        total: stats.total, correct: stats.correct, accuracy: stats.total ? stats.correct / stats.total : 1,
        skipped: stats.skipped, mistakes: wrongKeys.size,
        newWords: newWords.slice(), reviewedWords: reviewed.size,
        durationMs: Math.max(stats.ms, 0) || Math.max(0, now() - t0),
        masteryBefore: masteryBefore ? masteryBefore.fraction : 0, masteryAfter: masteryAfter ? masteryAfter.fraction : 0,
        masteryLevelBefore: masteryBefore, masteryLevelAfter: masteryAfter,
        complete, firstCompletion,
        streak: { current: s.streak?.current || 0, best: s.streak?.best || 0, freezes: s.streak?.freezes || 0, extended },
        dayGoal: { done: day.tasks || 0, goal, met: (day.tasks || 0) >= goal },
      };
      return summary;
    },
  };
  return session;
}
