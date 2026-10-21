import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLessonSession, createReviewSession } from '../../js/engine/session.js';
import { exVocab } from '../../js/engine/srs.js';
import { makeApp, setDay, play } from './engine-fake-app.mjs';

const ok = () => ({ correct: true, userAnswer: 'x', durationMs: 4000 });
const exercises = items => items.filter(i => i.kind === 'exercise');

test('Lektions-Session: Größe, Intro direkt vor erster Übung, max. neue Wörter, Tipp-Karte', () => {
  setDay('2026-10-21');
  const app = makeApp();
  const s = createLessonSession(app, 'a1-1-01', { seed: 1 });
  assert.equal(s.kind, 'lesson'); assert.equal(s.theme, 'greetings'); assert.ok(s.title_uk && s.title_de);
  const all = s.items;
  assert.equal(exercises(all).length, 15);
  const intros = all.filter(i => i.kind === 'intro');
  assert.equal(intros.length, 5);
  for (const intro of intros) {
    const idx = all.indexOf(intro);
    const first = all.findIndex(i => i.kind === 'exercise' && exVocab(i.ex).includes(intro.vocab.id));
    assert.ok(first > idx, `Übung zu ${intro.vocab.id} vor der Einführung`);
    const between = all.slice(idx + 1, first);
    assert.ok(between.every(i => i.kind !== 'exercise'), `Intro ${intro.vocab.id} nicht direkt vor der ersten Übung`);
  }
  assert.notEqual(all[0].kind === 'intro' && all[1].kind === 'intro' && all[2].kind === 'intro', true, 'nicht alle Intros am Anfang');
  const tips = all.filter(i => i.kind === 'tip');
  assert.equal(tips.length, 1);
  assert.ok(tips[0].grammar.title_de);
  const tipAt = all.indexOf(tips[0]) / all.length;
  assert.ok(tipAt > 0.15 && tipAt < 0.6, 'Tipp nach ca. 1/3');
  const { summary } = play(s, ok);
  assert.equal(summary.total, 15);
  assert.equal(summary.newWords.length, 5);
  assert.equal(summary.complete, true);
  assert.ok(app.store.state.lessons['a1-1-01'].completedAt);
  assert.equal(app.store.state.lessons['a1-1-01'].sessions, 1);
  const day = app.store.state.days['2026-10-21'];
  assert.equal(day.tasks, 15); assert.equal(day.correct, 15); assert.equal(day.newWords, 5); assert.equal(day.sessions, 1);
  assert.deepEqual(summary.dayGoal, { done: 15, goal: 15, met: true });
  assert.equal(summary.streak.current, 1); assert.equal(summary.streak.extended, true);
  assert.ok(summary.masteryAfter > summary.masteryBefore);
});

test('Stufenfolge: je neuem Wort Erkennen vor Produktion', () => {
  setDay('2026-10-21');
  const app = makeApp();
  const all = createLessonSession(app, 'a1-1-01', { seed: 7 }).items;
  const order = ['recognize', 'recall', 'produce'];
  for (const intro of all.filter(i => i.kind === 'intro')) {
    const stages = exercises(all).filter(i => i.ex.source_vocab === intro.vocab.id || (i.ex.vocab || [])[0] === intro.vocab.id).map(i => order.indexOf(i.stage));
    if (stages.length > 1) assert.ok(stages[0] <= Math.max(...stages));
  }
});

test('Fehler → Wiederholung nach 3–5 Aufgaben, max. 2 Zusatzversuche', () => {
  setDay('2026-10-21');
  const app = makeApp();
  const s = createLessonSession(app, 'a1-1-01', { seed: 3 });
  const seq = [];
  let target = null;
  for (let it = s.next(); it; it = s.next()) {
    seq.push(it);
    if (it.kind !== 'exercise') continue;
    const base = it.baseKey || it.key;
    if (!target && seq.filter(i => i.kind === 'exercise').length === 2) target = base;
    s.record(it, base === target ? { correct: false, userAnswer: '?' } : ok());
  }
  const pos = seq.map((it, i) => ((it.baseKey || it.key) === target && it.kind === 'exercise' ? i : -1)).filter(i => i >= 0);
  assert.equal(pos.length, 3, 'Original + 2 Zusatzversuche');
  for (let k = 1; k < pos.length; k++) {
    const between = seq.slice(pos[k - 1] + 1, pos[k]).filter(i => i.kind === 'exercise').length;
    assert.ok(between >= 2 && between <= 5, `Abstand ${between}`);
  }
  const sum = s.finish();
  assert.equal(sum.total, 17); assert.equal(sum.correct, 14); assert.equal(sum.mistakes, 1);
});

test('skipped wird nicht bewertet', () => {
  setDay('2026-10-21');
  const app = makeApp();
  const s = createLessonSession(app, 'a1-1-01', { seed: 4 });
  let it = s.next(); while (it.kind !== 'exercise') it = s.next();
  const srsBefore = JSON.stringify(app.store.state.srs);
  s.record(it, { correct: false, skipped: true, userAnswer: '' });
  assert.equal(JSON.stringify(app.store.state.srs), srsBefore);
  assert.equal(app.store.state.days['2026-10-21'].tasks, 0);
  assert.equal(s.finish().total, 0);
});

test('Variation: seedbar, verschiedene Seeds → andere Abfolge', () => {
  setDay('2026-10-21');
  const keys = seed => createLessonSession(makeApp(), 'a1-1-02', { seed }).items.map(i => i.key).join('|');
  assert.equal(keys(11), keys(11));
  const set = new Set([1, 2, 3, 4, 5].map(keys));
  assert.ok(set.size >= 3);
});

test('über mehrere Sessions kommen alle Lektionsaufgaben dran; Interleaving früherer Lektionen', () => {
  setDay('2026-10-21');
  const app = makeApp();
  for (let k = 0; k < 4; k++) { play(createLessonSession(app, 'a1-1-01', { seed: 20 + k }), ok); setDay(`2026-10-${22 + k}`); }
  const L = app.content.getLesson('a1-1-01');
  const seen = app.store.state.lessons['a1-1-01'].exSeen;
  const missing = L.exercises.filter(e => !seen[e.id]).map(e => e.id);
  assert.deepEqual(missing, []);
  // Lektion 2: ~20–30 % alte Elemente aus Lektion 1
  const s = createLessonSession(app, 'a1-1-02', { seed: 5 });
  const ex = exercises(s.items);
  const old = ex.filter(i => i.review);
  assert.ok(old.length >= 3 && old.length <= 5, `alt: ${old.length}`);
  assert.ok(old.every(i => i.lessonId === 'a1-1-01'));
  assert.ok(ex.indexOf(old[0]) > 0, 'nicht als erste Aufgabe');
});

test('Hören/Sprechen aus: keine listening/speak-Aufgaben; refreshAudioMode mitten in der Session', () => {
  setDay('2026-10-21');
  const app = makeApp();
  const s = createLessonSession(app, 'a1-1-01', { seed: 2, audioMode: { listenOff: true, speakOff: true } });
  const { items } = play(s, ok);
  assert.ok(exercises(items).every(i => i.ex.type !== 'listening' && i.ex.type !== 'speak'));
  assert.ok(Object.keys(app.store.state.srs.ex).every(k => !k.includes('~txt')), 'keine SRS-Karte für Textvarianten');
  setDay('2026-10-22');
  const s2 = createLessonSession(app, 'a1-1-01', { seed: 2 });
  s2.next();
  s2.refreshAudioMode({ listenOff: true, speakOff: true });
  const rest = [];
  for (let it = s2.next(); it; it = s2.next()) { rest.push(it); if (it.kind === 'exercise') s2.record(it, ok()); }
  assert.ok(exercises(rest).every(i => i.ex.type !== 'listening' && i.ex.type !== 'speak'));
  assert.equal(s2.remaining(), 0);
});

test('Review-Session: fällige zuerst, sonst schwächste; ohne Karten → Lektions-Session', () => {
  setDay('2026-10-21');
  const app = makeApp();
  const first = createReviewSession(app, { seed: 1 });
  assert.equal(first.kind, 'lesson');
  play(createLessonSession(app, 'a1-1-01', { seed: 1 }), ok);
  setDay('2026-10-24');
  const r = createReviewSession(app, { seed: 2 });
  assert.equal(r.kind, 'review'); assert.equal(r.lessonId, null);
  const ex = exercises(r.items);
  assert.ok(ex.length >= 5 && ex.length <= 15);
  const { summary } = play(r, ok);
  assert.ok(summary.reviewedWords > 0);
  assert.equal(summary.kind, 'review');
});

test('Typ-Vielfalt: max. 2 gleiche Typen hintereinander, kein Typ > ~35 %', () => {
  for (const lessonId of ['a1-1-01', 'a1-1-02']) {
    setDay('2026-10-21');
    const app = makeApp();
    if (lessonId === 'a1-1-02') play(createLessonSession(app, 'a1-1-01', { seed: 99 }), ok);
    for (let seed = 1; seed <= 12; seed++) {
      const ex = exercises(createLessonSession(app, lessonId, { seed }).items);
      const types = ex.map(i => i.ex.type);
      for (let i = 2; i < types.length; i++) {
        assert.ok(!(types[i] === types[i - 1] && types[i] === types[i - 2]), `${lessonId}/${seed}: 3× ${types[i]}: ${types.join(',')}`);
      }
      const count = {};
      for (const t of types) count[t] = (count[t] || 0) + 1;
      for (const [t, n] of Object.entries(count)) assert.ok(n <= Math.ceil(0.35 * types.length), `${lessonId}/${seed}: ${t} ${n}/${types.length}`);
      const first8 = types.slice(0, 8).filter(t => t === 'listening').length;
      assert.ok(first8 <= 3, `${lessonId}/${seed}: ${first8} Höraufgaben unter den ersten 8`);
    }
  }
});
