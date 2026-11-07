import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLessonSession, createTeachSession, createTestSession } from '../../js/engine/session.js';
import { pathState, testExercises, LOW_VALUE } from '../../js/engine/lesson-path.js';
import { isUnlocked } from '../../js/engine/progress.js';
import { makeApp, setDay, play } from './engine-fake-app.mjs';

test('Lernschritt: Lehrkarten je Abschnitt, danach taughtAt', () => {
  setDay('2026-10-21');
  const app = makeApp();
  const s = createTeachSession(app, 'a1-1-01', { seed: 2 });
  const teach = s.items.filter(i => i.kind === 'teach');
  assert.equal(teach.length, app.content.getLesson('a1-1-01').explanation.sections.length);
  play(s);
  assert.ok(app.store.state.lessons['a1-1-01'].taughtAt);
  assert.equal(pathState(app, 'a1-1-01').learned, true);
});

test('Übung: Wiedererkennungs-Typen höchstens 1× je Session', () => {
  setDay('2026-10-21');
  const app = makeApp();
  const s = createLessonSession(app, 'a1-1-01', { seed: 5 });
  for (const t of LOW_VALUE) assert.ok(s.items.filter(i => i.kind === 'exercise' && i.ex.type === t).length <= 1, t);
});

test('Prüfung: nicht bestanden → gesperrt; bestanden (≥80 %) → nächste Lektion frei', () => {
  setDay('2026-10-21');
  const app = makeApp();
  assert.ok(testExercises(app.content.getLesson('a1-1-01'), Math.random).length > 0);
  let n = 0;
  play(createTestSession(app, 'a1-1-01', { seed: 3 }), () => ({ correct: (n++ % 2) === 0, userAnswer: 'x', durationMs: 3000 }));
  assert.equal(isUnlocked(app, 'a1-1-02'), false);
  assert.equal(pathState(app, 'a1-1-01').test.attempts, 1);
  const sum = createTestSession(app, 'a1-1-01', { seed: 4 });
  play(sum);
  assert.ok(app.store.state.lessons['a1-1-01'].completedAt);
  assert.equal(isUnlocked(app, 'a1-1-02'), true);
});
