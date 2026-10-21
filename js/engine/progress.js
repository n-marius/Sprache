// STUB mit verbindlicher API (Engine-Agent ersetzt die Implementierung, Signaturen bleiben).
import { DAY_START_HOUR } from '../config.js';

/** 'YYYY-MM-DD' des Lerntags (Tagesgrenze 04:00 Ortszeit). */
export function dayKey(date = new Date()) {
  const d = new Date(date.getTime() - DAY_START_HOUR * 3600e3);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * → { goal, done, met, correct, minutes,
 *     streak: {current, best, freezes, atRisk, repairable},
 *     week: [{day, label:'Mo', done, met, isToday, frozen}], weekGoal: {daysMet, target},
 *     dueCount, newAvailable }
 */
export function todayStats(app) {
  const s = app.store.state;
  const today = s.days[dayKey()] || { tasks: 0, correct: 0, ms: 0 };
  const goal = s.settings.dailyGoal;
  const labels = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5);
    const k = dayKey(d); const x = s.days[k] || { tasks: 0 };
    week.push({ day: k, label: labels[d.getDay()], done: x.tasks, met: x.tasks >= goal, isToday: i === 0, frozen: false });
  }
  return {
    goal, done: today.tasks, met: today.tasks >= goal, correct: today.correct, minutes: Math.round(today.ms / 60000),
    streak: { current: s.streak.current, best: s.streak.best, freezes: s.streak.freezes, atRisk: false, repairable: false },
    week, weekGoal: { daysMet: week.filter(w => w.met).length, target: 5 },
    dueCount: 0, newAvailable: 5,
  };
}

/**
 * → { status:'ahead'|'on_track'|'behind', diffLessons, label, lessonsDone, lessonsExpected, lessonsTotal,
 *     fraction, expectedFraction, daysLeft, targetDate, currentPhase:{id,title_uk,title_de,start,end}, recommendedPerWeek }
 */
export function pacing(app) {
  const list = app.content.lessonList;
  const done = list.filter(l => app.store.state.lessons[l.id]?.completedAt).length;
  const target = new Date(app.store.state.settings.targetDate);
  const daysLeft = Math.max(0, Math.ceil((target - Date.now()) / 864e5));
  const phase = app.content.phases[0];
  return { status: 'on_track', diffLessons: 0, label: 'im Plan', lessonsDone: done, lessonsExpected: done, lessonsTotal: list.length,
    fraction: done / list.length, expectedFraction: done / list.length, daysLeft, targetDate: app.store.state.settings.targetDate,
    currentPhase: phase, recommendedPerWeek: 2 };
}

/** → { level: 0..4, fraction: 0..1, label } */
export function lessonMastery(app, lessonId) {
  const l = app.store.state.lessons[lessonId];
  const level = l?.completedAt ? 1 : 0;
  return { level, fraction: level / 4, label: ['Neu', 'Begonnen', 'Gefestigt', 'Sicher', 'Gemeistert'][level] };
}

/** Weiche Sperre: true, wenn empfohlen/freigeschaltet. Geplante Lektionen → false. */
export function isUnlocked(app, lessonId) {
  const ready = app.content.readyLessons();
  const i = ready.findIndex(l => l.id === lessonId);
  if (i < 0) return false;
  return i === 0 || !!app.store.state.lessons[ready[i - 1].id]?.completedAt;
}

/** Lektion, mit der „Weiterlernen“ fortsetzt (erste nicht gemeisterte freigeschaltete). */
export function nextLesson(app) {
  const ready = app.content.readyLessons();
  return ready.find(l => !app.store.state.lessons[l.id]?.completedAt) || ready[ready.length - 1] || null;
}

/** → [{vocab, lessonId, introduced, strength: 0..1, due: Date|null, card}] (alle Vokabeln geladener Lektionen) */
export function wordList(app) {
  return [...app.content.vocabById.values()].map(v => {
    const card = app.store.state.srs.vocab[v.id] || null;
    return { vocab: v, lessonId: v.lessonId, introduced: !!card, strength: card ? 0.5 : 0, due: null, card };
  });
}

/** → { introduced, total, strong } */
export function vocabStats(app) {
  const w = wordList(app);
  return { introduced: w.filter(x => x.introduced).length, total: w.length, strong: w.filter(x => x.strength >= 0.8).length };
}
