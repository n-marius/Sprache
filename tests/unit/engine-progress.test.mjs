import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as P from '../../js/engine/progress.js';
import { createLessonSession } from '../../js/engine/session.js';
import { makeApp, setDay, play } from './engine-fake-app.mjs';

const visit = (app, day, tasks = 15) => {
  setDay(day);
  app.store.update(s => { s.days[day] = { tasks, correct: tasks, ms: 0, newWords: 0, sessions: 1 }; P.applyStreak(s, day); });
  return app.store.state.streak;
};

test('dayKey: Date, ms, Grenze 04:00', () => {
  assert.equal(P.dayKey(new Date(2026, 9, 22, 2, 0)), '2026-10-21');
  assert.equal(P.dayKey(new Date(2026, 9, 22, 5, 0).getTime()), '2026-10-22');
});

test('Streak: Folgetage, Freeze bei Lücke, Freeze-Verdienst je 7 Tage (max. 2)', () => {
  const app = makeApp();
  visit(app, '2026-10-21'); visit(app, '2026-10-22');
  assert.equal(app.store.state.streak.current, 2);
  visit(app, '2026-10-22');
  assert.equal(app.store.state.streak.current, 2, 'gleicher Tag zählt einmal');
  // 23. verpasst → Freeze (Start: 1)
  let st = visit(app, '2026-10-24');
  assert.equal(st.current, 3); assert.equal(st.freezes, 0); assert.deepEqual(st.freezeUsed, ['2026-10-23']);
  for (let d = 25; d <= 28; d++) st = visit(app, `2026-10-${d}`);
  assert.equal(st.current, 7); assert.equal(st.freezes, 1, 'Freeze nach 7 Tagen');
  for (let d = 29; d <= 31; d++) st = visit(app, `2026-10-${d}`);
  for (let d = 1; d <= 4; d++) st = visit(app, `2026-11-0${d}`);
  assert.equal(st.current, 14); assert.equal(st.freezes, 2);
  for (let d = 5; d <= 11; d++) st = visit(app, `2026-11-${String(d).padStart(2, '0')}`);
  assert.equal(st.freezes, 2, 'max. 2');
  assert.equal(st.best, 21);
});

test('Streak: Abbruch ohne Freeze, Reparatur mit doppeltem Tagesziel innerhalb 48 h', () => {
  const app = makeApp();
  app.store.state.streak.freezes = 0;
  visit(app, '2026-10-21'); visit(app, '2026-10-22'); visit(app, '2026-10-23');
  setDay('2026-10-25');
  const view = P.streakView(app.store.state, '2026-10-25');
  assert.equal(view.current, 0); assert.equal(view.repairable, true);
  let st = visit(app, '2026-10-25', 15);
  assert.equal(st.current, 1); assert.ok(st.repair);
  assert.equal(P.todayStats(app).streak.repairable, true);
  st = visit(app, '2026-10-25', 30);
  assert.equal(st.current, 4, 'repariert: 3 + heute'); assert.equal(st.repair, null);
  // zwei Tage verpasst → nicht reparierbar
  st = visit(app, '2026-10-28');
  assert.equal(st.current, 1); assert.ok(!st.repair);
});

test('todayStats: Form und Wochenpunkte', () => {
  const app = makeApp();
  setDay('2026-10-21');
  play(createLessonSession(app, 'a1-1-01', { seed: 1 }));
  const t = P.todayStats(app);
  assert.equal(t.goal, 15); assert.equal(t.done, 15); assert.equal(t.met, true);
  assert.equal(t.streak.current, 1); assert.equal(t.streak.atRisk, false);
  assert.equal(t.week.length, 7); assert.equal(t.week[0].label, 'Mo');
  assert.equal(t.week.find(w => w.isToday).day, '2026-10-21');
  assert.equal(t.weekGoal.target, 5); assert.equal(t.weekGoal.daysMet, 1);
  assert.equal(t.newAvailable, 5, 'min(5 pro Session, Tageslimit 10-5)');
  setDay('2026-10-22');
  assert.equal(P.todayStats(app).streak.atRisk, true);
});

test('Pacing: Plan aus Phasen, Status/Label, Zieldatum skaliert', () => {
  const app = makeApp();
  setDay('2026-10-21');
  let p = P.pacing(app);
  assert.equal(p.status, 'on_track'); assert.equal(p.label, 'im Plan'); assert.equal(p.lessonsTotal, 8);
  assert.equal(p.currentPhase.id, 'A1.1'); assert.equal(p.targetDate, '2027-04-30');
  // A1.1: 4 Lektionen über 72 Tage → je 18 Tage. Am 15.11. sind 1 erwartet.
  setDay('2026-11-15');
  p = P.pacing(app);
  assert.equal(p.lessonsExpected, 1); assert.equal(p.status, 'behind'); assert.equal(p.label, '1 Lektion Rückstand');
  app.store.state.lessons['a1-1-01'] = { sessions: 1, completedAt: 'x', exSeen: {} };
  app.store.state.lessons['a1-1-02'] = { sessions: 1, completedAt: 'x', exSeen: {} };
  assert.equal(P.pacing(app).label, '1 Lektion voraus');
  setDay('2027-02-01');
  p = P.pacing(app);
  assert.equal(p.currentPhase.id, 'A1.2');
  assert.equal(p.diffLessons, 2 - p.lessonsExpected);
  assert.match(p.label, /Lektionen Rückstand/);
  // früheres Zieldatum → höheres Soll
  const before = p.lessonsExpected;
  app.store.state.settings.targetDate = '2027-02-28';
  assert.ok(P.pacing(app).lessonsExpected > before);
  setDay('2027-05-01');
  assert.equal(P.pacing(app).lessonsExpected, 8);
});

test('Freischaltung, nächste Lektion, Meisterschaft, Wortliste', () => {
  const app = makeApp();
  setDay('2026-10-21');
  assert.equal(P.isUnlocked(app, 'a1-1-01'), true);
  assert.equal(P.isUnlocked(app, 'a1-1-02'), false);
  assert.equal(P.isUnlocked(app, 'a1-1-03'), false, 'geplant nie');
  assert.equal(P.nextLesson(app).id, 'a1-1-01');
  assert.equal(P.lessonMastery(app, 'a1-1-01').level, 0);
  play(createLessonSession(app, 'a1-1-01', { seed: 1 }));
  assert.equal(P.isUnlocked(app, 'a1-1-02'), true);
  assert.equal(P.nextLesson(app).id, 'a1-1-02');
  const m = P.lessonMastery(app, 'a1-1-01');
  assert.equal(m.level, 1); assert.equal(m.label, 'Begonnen'); assert.ok(m.fraction > 0.25 && m.fraction < 0.5);
  // künstlich: alle Karten stabil → Gemeistert
  for (const v of app.content.getLesson('a1-1-01').vocab) app.store.state.srs.vocab[v.id] = { S: 40, D: 5, reps: 5, state: 'review', last: '2026-10-21', due: '2026-12-01', prod: 1, ok: 5 };
  assert.equal(P.lessonMastery(app, 'a1-1-01').level, 4);
  setDay('2027-08-01'); // R fällt → „auffrischen“
  assert.ok(P.lessonMastery(app, 'a1-1-01').level < 4);
  const w = P.wordList(app);
  assert.equal(w.length, app.content.vocabById.size);
  assert.ok(w.find(x => x.vocab.id === 'pryvit').due instanceof Date);
  const vs = P.vocabStats(app);
  assert.equal(vs.introduced, 9); assert.equal(vs.total, 17);
});
