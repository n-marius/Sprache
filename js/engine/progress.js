// Fortschritt, Tagesziel, Streak, Pacing, Meisterschaft (Paket Engine). Signaturen/Rückgabeformen verbindlich (Views).
// Didaktik: docs/research-didactics.md §6.3/§6.4. Uhr: engine/util.js (now/setClock), Lerntag-Grenze 04:00.
import { dayKey as utilDayKey, now, addDays, dayDiff, parseDay, weekStart } from './util.js';
import { retrievability, isDue, strengthLevel } from './srs.js';

export const MAX_FREEZES = 2;
export const FREEZE_EVERY = 7;
export const WEEK_TARGET = 5;
export const MAX_NEW_PER_DAY = 10;
export const REVIEW_DAY_THRESHOLD = 80;
export const MASTERY_LABELS = ['Neu', 'Begonnen', 'Gelernt', 'Gefestigt', 'Gemeistert'];

/** 'YYYY-MM-DD' des Lerntags (Tagesgrenze 04:00 Ortszeit). Akzeptiert Date, ms oder nichts (= jetzt). */
export function dayKey(date) {
  if (date instanceof Date) return utilDayKey(date.getTime());
  return utilDayKey(typeof date === 'number' ? date : now());
}

// ---------------- Streak ----------------
function streakObj(s) {
  const st = (s.streak ||= { current: 0, best: 0, lastDay: null, freezes: 1, freezeUsed: [] });
  if (!Array.isArray(st.freezeUsed)) st.freezeUsed = [];
  if (typeof st.freezes !== 'number') st.freezes = 0;
  return st;
}

/**
 * Lerntag `today` als Streak-Tag verbuchen (mutiert state; innerhalb von store.update aufrufen).
 * - Folgetag: +1. Lücke: automatische Freezes decken verpasste Tage (je 7 Streak-Tage +1, max. 2).
 * - Ohne ausreichende Freezes: Streak neu ab 1; war es genau 1 verpasster Tag, ist er innerhalb von 48 h
 *   per doppeltem Tagesziel reparierbar (streak.repair).
 * → { extended, current, repaired }
 */
export function applyStreak(s, today = dayKey()) {
  const st = streakObj(s);
  const goal = s.settings?.dailyGoal || 15;
  let extended = false, repaired = false;
  if (st.lastDay !== today) {
    const gap = st.lastDay ? dayDiff(st.lastDay, today) : null;
    if (gap === null) { st.current = 1; extended = true; }
    else if (gap > 0) {
      if (gap === 1) st.current = (st.current || 0) + 1;
      else {
        const missed = [];
        for (let i = 1; i < gap; i++) missed.push(addDays(st.lastDay, i));
        if (st.freezes >= missed.length) {
          st.freezes -= missed.length;
          st.freezeUsed.push(...missed);
          st.current = (st.current || 0) + 1;
        } else {
          st.repair = missed.length === 1 && st.current > 0
            ? { prev: st.current, missed, until: addDays(missed[0], 2) } : null;
          st.current = 1;
        }
      }
      extended = true;
      if (st.current > 0 && st.current % FREEZE_EVERY === 0) st.freezes = Math.min(MAX_FREEZES, st.freezes + 1);
    }
    if (gap === null || gap > 0) st.lastDay = today;
  }
  if (st.repair) {
    const tasks = s.days?.[today]?.tasks || 0;
    if (today > st.repair.until) st.repair = null;
    else if (st.lastDay === today && tasks >= 2 * goal) {
      st.current = st.repair.prev + st.current;
      st.freezeUsed.push(...st.repair.missed);
      st.repair = null;
      repaired = true;
    }
  }
  st.best = Math.max(st.best || 0, st.current || 0);
  st.freezeUsed = st.freezeUsed.slice(-60);
  return { extended, current: st.current, repaired };
}

/** Anzeige-Sicht auf den Streak (ohne Mutation): projiziert Freezes für verpasste Tage. */
export function streakView(s, today = dayKey()) {
  const st = s.streak || {};
  const goal = s.settings?.dailyGoal || 15;
  const base = { current: st.current || 0, best: st.best || 0, freezes: st.freezes || 0, atRisk: false, repairable: false,
    repairGoal: 2 * goal, frozenDays: [...(st.freezeUsed || [])], doneToday: st.lastDay === today };
  if (!st.lastDay) return { ...base, current: 0 };
  const gap = dayDiff(st.lastDay, today);
  if (gap <= 0) {
    if (st.repair && today <= st.repair.until) base.repairable = true;
    return base;
  }
  if (gap === 1) return { ...base, atRisk: base.current > 0 };
  const missed = [];
  for (let i = 1; i < gap; i++) missed.push(addDays(st.lastDay, i));
  if (base.freezes >= missed.length) {
    return { ...base, atRisk: true, freezes: base.freezes - missed.length, frozenDays: [...base.frozenDays, ...missed] };
  }
  return { ...base, current: 0, atRisk: false, repairable: missed.length === 1 && (st.current || 0) > 0 };
}

// ---------------- Tagesstatistik ----------------
function introducedVocab(app) {
  const cards = app.store.state.srs?.vocab || {};
  return [...app.content.vocabById.values()].filter(v => cards[v.id]);
}

/** Anzahl fälliger Vokabelkarten (nur Vokabeln geladener Lektionen). */
export function dueCount(app, today = dayKey()) {
  const cards = app.store.state.srs?.vocab || {};
  let n = 0;
  for (const v of app.content.vocabById.values()) if (cards[v.id] && isDue(cards[v.id], today)) n++;
  return n;
}

/**
 * → { goal, done, met, correct, minutes,
 *     streak: {current, best, freezes, atRisk, repairable},
 *     week: [{day, label:'Mo', done, met, isToday, frozen}], weekGoal: {daysMet, target},
 *     dueCount, newAvailable }
 *   zusätzlich: dueExCount, reviewDay (bool: > 80 fällig → keine neuen Wörter), newToday, pacing
 */
export function todayStats(app) {
  const s = app.store.state;
  const today = dayKey();
  const d = s.days?.[today] || {};
  const goal = s.settings?.dailyGoal || 15;
  const labels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const streak = streakView(s, today);
  const frozen = new Set(streak.frozenDays);
  const ws = weekStart(today);
  const week = labels.map((label, i) => {
    const day = addDays(ws, i);
    const x = s.days?.[day] || {};
    return { day, label, done: x.tasks || 0, met: (x.tasks || 0) >= goal, isToday: day === today, frozen: frozen.has(day), future: day > today };
  });
  const due = dueCount(app, today);
  let dueEx = 0;
  for (const c of Object.values(s.srs?.ex || {})) if (isDue(c, today)) dueEx++;
  const newToday = d.newWords || 0;
  const reviewDay = due > REVIEW_DAY_THRESHOLD;
  let notIntroduced = 0;
  const cards = s.srs?.vocab || {};
  for (const l of app.content.readyLessons()) {
    if (!isUnlocked(app, l.id)) continue;
    for (const v of app.content.getLesson(l.id)?.vocab || []) if (!cards[v.id]) notIntroduced++;
  }
  const perSession = s.settings?.newWordsPerSession || 5;
  const newAvailable = reviewDay ? 0 : Math.max(0, Math.min(perSession, notIntroduced, MAX_NEW_PER_DAY - newToday));
  return {
    goal, done: d.tasks || 0, met: (d.tasks || 0) >= goal, correct: d.correct || 0, minutes: Math.round((d.ms || 0) / 60000),
    sessions: d.sessions || 0,
    streak: { current: streak.current, best: streak.best, freezes: streak.freezes, atRisk: streak.atRisk && !streak.doneToday,
      repairable: streak.repairable, repairGoal: streak.repairGoal },
    week, weekGoal: { daysMet: week.filter(w => w.met).length, target: WEEK_TARGET },
    dueCount: due, dueExCount: dueEx, newAvailable, newToday, reviewDay,
    pacing: pacing(app),
  };
}

// ---------------- Pacing ----------------
const DAY_MS = 86400e3;
const dayNum = key => Math.round(parseDay(key).getTime() / DAY_MS);

/** Plan: jede Lektion (inkl. „planned“) bekommt ein Soll-Datum, gleichmäßig innerhalb ihrer Phase. */
export function lessonPlan(app) {
  const out = [];
  for (const p of app.content.phases || []) {
    const ls = p.lessons || [];
    if (!ls.length || !p.start || !p.end) { for (const l of ls) out.push({ id: l.id, phaseId: p.id, due: p.end || p.start || null }); continue; }
    const a = dayNum(p.start), b = dayNum(p.end) + 1; // Ende inklusive
    ls.forEach((l, i) => {
      const dn = a + Math.round(((i + 1) * (b - a)) / ls.length) - 1;
      out.push({ id: l.id, phaseId: p.id, dueNum: dn });
    });
  }
  return out;
}

function fmtLessons(n) { return n === 1 ? '1 Lektion' : `${n} Lektionen`; }

/**
 * → { status:'ahead'|'on_track'|'behind', diffLessons, label, lessonsDone, lessonsExpected, lessonsTotal,
 *     fraction, expectedFraction, daysLeft, targetDate, currentPhase:{id,title_uk,title_de,start,end}, recommendedPerWeek }
 * Soll aus dem Phasenplan des Curriculums; ein abweichendes settings.targetDate staucht/streckt den Plan linear.
 */
export function pacing(app) {
  const s = app.store.state;
  const list = app.content.lessonList || [];
  const total = list.length;
  const today = dayKey();
  const done = list.filter(l => s.lessons?.[l.id]?.completedAt).length;
  const plan = lessonPlan(app).filter(x => typeof x.dueNum === 'number');
  const phases = app.content.phases || [];
  const planStart = phases[0]?.start ? dayNum(phases[0].start) : dayNum(today);
  const planEnd = plan.length ? Math.max(...plan.map(x => x.dueNum)) : planStart;
  const targetDate = s.settings?.targetDate || app.content.curriculum?.targetDate || null;
  const target = targetDate ? dayNum(targetDate) : planEnd;
  const t = dayNum(today);
  // Heute auf die Plan-Zeitachse abbilden (Zieldatum ≠ Planende → linear skalieren)
  const scale = target > planStart ? (planEnd - planStart) / (target - planStart) : 1;
  const planT = planStart + (t - planStart) * scale;
  const expected = Math.min(total, plan.filter(x => x.dueNum <= planT + 1e-9).length);
  const diff = done - expected;
  const status = diff >= 1 ? 'ahead' : diff <= -1 ? 'behind' : 'on_track';
  const label = diff === 0 ? 'im Plan' : diff > 0 ? `${fmtLessons(diff)} voraus` : `${fmtLessons(-diff)} Rückstand`;
  const daysLeft = targetDate ? Math.max(0, target - t) : 0;
  const weeksLeft = Math.max(1, daysLeft / 7);
  const recommendedPerWeek = Math.max(0, Math.ceil(((total - done) / weeksLeft) * 10) / 10);
  let cur = phases.find(p => p.start && p.end && planT >= dayNum(p.start) && planT <= dayNum(p.end) + 1);
  if (!cur) cur = planT < planStart ? phases[0] : phases[phases.length - 1];
  return {
    status, diffLessons: diff, label, lessonsDone: done, lessonsExpected: expected, lessonsTotal: total,
    fraction: total ? done / total : 0, expectedFraction: total ? expected / total : 0,
    daysLeft, targetDate,
    currentPhase: cur ? { id: cur.id, title_uk: cur.title_uk, title_de: cur.title_de, start: cur.start, end: cur.end } : null,
    recommendedPerWeek,
  };
}

// ---------------- Meisterschaft ----------------
/**
 * Stufen (Research §6.4): 0 Neu · 1 Begonnen (Vokabeln eingeführt) · 2 Gelernt (alle eingeführt, jede ≥1× produktiv
 * richtig bzw. S ≥ 7) · 3 Gefestigt (≥80 % S ≥ 7) · 4 Gemeistert (≥90 % S ≥ 21, keine R < 0,8).
 * → { level: 0..4, fraction: 0..1, label, introduced, total }
 */
export function lessonMastery(app, lessonId) {
  const lesson = app.content.getLesson(lessonId);
  const ls = app.store.state.lessons?.[lessonId];
  const vocab = lesson?.vocab || [];
  const cards = app.store.state.srs?.vocab || {};
  const today = dayKey();
  const total = vocab.length;
  const cs = vocab.map(v => cards[v.id]).filter(Boolean);
  const introduced = cs.length;
  const mk = (level, partial) => ({ level, fraction: Math.min(1, (level + Math.max(0, Math.min(1, partial))) / 4),
    label: MASTERY_LABELS[level], introduced, total });
  if (!lesson || !total) return mk(ls?.completedAt ? 1 : 0, 0);
  if (!introduced && !ls?.sessions) return mk(0, 0);
  if (introduced < total) return mk(introduced ? 1 : 0, introduced ? (introduced / total) * 0.5 : 0);
  const learned = c => (c.prod || 0) >= 1 || (c.S || 0) >= 7;
  const nLearned = cs.filter(learned).length;
  if (nLearned < total) return mk(1, 0.5 + 0.5 * nLearned / total);
  const s7 = cs.filter(c => (c.S || 0) >= 7).length;
  if (s7 < 0.8 * total) return mk(2, s7 / (0.8 * total));
  const s21 = cs.filter(c => (c.S || 0) >= 21).length;
  const weak = cs.some(c => retrievability(c, today) < 0.8);
  if (s21 < 0.9 * total || weak) return mk(3, weak ? Math.min(0.9, s21 / (0.9 * total)) : s21 / (0.9 * total));
  return mk(4, 0);
}

// ---------------- Freischaltung / nächste Lektion ----------------
/** Weiche Sperre: true, wenn empfohlen/freigeschaltet. Geplante Lektionen → false. */
export function isUnlocked(app, lessonId) {
  const ready = app.content.readyLessons();
  const i = ready.findIndex(l => l.id === lessonId);
  if (i < 0) return false;
  if (i === 0) return true;
  const st = app.store.state.lessons || {};
  if (st[lessonId]?.sessions > 0) return true;
  return !!st[ready[i - 1].id]?.completedAt;
}

/** Lektion, mit der „Weiterlernen“ fortsetzt: erste freigeschaltete noch nicht abgeschlossene, sonst schwächste. */
export function nextLesson(app) {
  const ready = app.content.readyLessons();
  const st = app.store.state.lessons || {};
  const open = ready.find(l => isUnlocked(app, l.id) && !st[l.id]?.completedAt);
  if (open) return open;
  let best = null, bestLevel = 5;
  for (const l of ready) {
    if (!isUnlocked(app, l.id)) continue;
    const m = lessonMastery(app, l.id).level;
    if (m < bestLevel) { best = l; bestLevel = m; }
  }
  return best || ready[ready.length - 1] || null;
}

// ---------------- Wörter ----------------
/** → [{vocab, lessonId, introduced, strength: 0..1, level: 0..4, due: Date|null, dueKey, isDue, card}] */
export function wordList(app) {
  const cards = app.store.state.srs?.vocab || {};
  const today = dayKey();
  return [...app.content.vocabById.values()].map(v => {
    const card = cards[v.id] || null;
    const level = strengthLevel(card, today);
    return { vocab: v, lessonId: v.lessonId, introduced: !!card, strength: level / 4, level,
      due: card?.due ? parseDay(card.due) : null, dueKey: card?.due || null, isDue: !!card && isDue(card, today), card };
  });
}

/** → { introduced, total, strong, recognized, spoken, due } */
export function vocabStats(app) {
  const w = wordList(app);
  return {
    introduced: w.filter(x => x.introduced).length,
    total: w.length,
    strong: w.filter(x => x.strength >= 0.75).length,
    recognized: w.filter(x => (x.card?.ok || 0) >= 1).length,
    spoken: w.filter(x => (x.card?.prod || 0) >= 1).length,
    due: w.filter(x => x.isDue).length,
  };
}

export { introducedVocab };
