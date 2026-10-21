import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as srs from '../../js/engine/srs.js';
import { dayKey, addDays, dayDiff, setClock } from '../../js/engine/util.js';
import { setDay } from './engine-fake-app.mjs';

test('util: Lerntag-Grenze 04:00, addDays/dayDiff', () => {
  assert.equal(dayKey(new Date(2026, 9, 22, 3, 59).getTime()), '2026-10-21');
  assert.equal(dayKey(new Date(2026, 9, 22, 4, 0).getTime()), '2026-10-22');
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(dayDiff('2026-12-30', '2027-01-02'), 3);
  setClock(null);
});

test('FSRS: Intervall ≈ S bei Ziel-Retention 0,9; Startwerte', () => {
  assert.equal(srs.intervalDays(10), 10);
  assert.ok(Math.abs(srs.retrievabilityAt(10, 10) - 0.9) < 1e-9);
  assert.equal(srs.initStability(3), 2.3065);
});

test('applyRating: erster Abruf max. Good, gleicher Tag ohne FSRS-Update, Again → learning', () => {
  setDay('2026-10-21');
  const c = srs.newCard('2026-10-21');
  srs.applyRating(c, 4, '2026-10-21', { id: 'x' });
  assert.equal(c.S, srs.initStability(3));
  assert.equal(c.due, '2026-10-23');
  const S = c.S;
  srs.applyRating(c, 1, '2026-10-21', { id: 'x', correct: false });
  assert.equal(c.S, S, 'gleicher Lerntag ändert S nicht');
  assert.equal(c.seen, 2);
  srs.applyRating(c, 3, '2026-10-23', { id: 'x' });
  assert.ok(c.S > S, 'Erfolg am Fälligkeitstag erhöht S');
  srs.applyRating(c, 1, '2026-11-20', { id: 'x', correct: false });
  assert.equal(c.state, 'learning');
  assert.equal(c.lapses, 1);
});

test('deriveRating laut Tabelle', () => {
  const mcUkDe = { type: 'mc_translate', dir: 'uk-de' }, mcDeUk = { type: 'mc_translate', dir: 'de-uk' };
  const speak = { type: 'speak' }, build = { type: 'build_sentence', dir: 'de-uk' };
  const rev = { state: 'review', S: 5 };
  assert.equal(srs.deriveRating(mcUkDe, { correct: false }), 1);
  assert.equal(srs.deriveRating(mcUkDe, { correct: true }, null), 3);
  assert.equal(srs.deriveRating(mcUkDe, { correct: true }, rev), 2);
  assert.equal(srs.deriveRating(mcDeUk, { correct: true }, rev), 3);
  assert.equal(srs.deriveRating(mcDeUk, { correct: true, hinted: true }, rev), 2);
  assert.equal(srs.deriveRating(build, { correct: true, durationMs: 3000 }, rev), 4);
  assert.equal(srs.deriveRating(speak, { correct: true, durationMs: 3000 }, rev), 3);
  assert.equal(srs.deriveRating(speak, { skipped: true }), null);
});

test('recordResult: nur eingeführte Vokabeln, generierte ohne Aufgabenkarte, skipped ohne Wirkung', () => {
  const s = { vocab: { a: srs.newCard('2026-10-21') }, ex: {} };
  const ex = { id: 'e01', type: 'mc_translate', dir: 'de-uk', vocab: ['a', 'b'] };
  let out = srs.recordResult(s, { ex, lessonId: 'L' }, { correct: true }, '2026-10-21');
  assert.ok(s.ex['L/e01']);
  assert.deepEqual(Object.keys(out.ratings), ['a']);
  assert.ok(!s.vocab.b);
  out = srs.recordResult(s, { ex: { ...ex, id: 'g-a-x', generated: true }, lessonId: 'L', generated: true }, { correct: true }, '2026-10-21');
  assert.ok(!s.ex['L/g-a-x']);
  const before = JSON.stringify(s);
  srs.recordResult(s, { ex, lessonId: 'L' }, { skipped: true, correct: false }, '2026-10-22');
  assert.equal(JSON.stringify(s), before);
});

test('strengthLevel', () => {
  assert.equal(srs.strengthLevel(null, '2026-10-21'), 0);
  assert.equal(srs.strengthLevel(srs.newCard('2026-10-21'), '2026-10-21'), 1);
  assert.equal(srs.strengthLevel({ reps: 3, S: 30, state: 'review', last: '2026-10-21' }, '2026-10-22'), 4);
});
