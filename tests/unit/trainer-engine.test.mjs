import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../../js/engine/trainer.js';
import { createLessonSession } from '../../js/engine/session.js';
import { makeApp, setDay, play } from './engine-fake-app.mjs';

function withProgress() {
  setDay('2026-10-21');
  const app = makeApp();
  play(createLessonSession(app, 'a1-1-01', { seed: 1 }));
  return app;
}

test('ohne Fortschritt: nur erste Lektion freigeschaltet, neue Karten begrenzt', () => {
  setDay('2026-10-21');
  const app = makeApp();
  const st = T.trainerStats(app);
  assert.equal(st.due, 0); assert.equal(st.learned, 0); assert.equal(st.total, 9);
  const r = T.createTrainerRound(app, { scope: 'due', dir: 'de-uk', seed: 1, maxNew: 5 });
  assert.equal(r.items.length, 5);
  assert.ok(r.items.every(i => i.isNew && i.dir === 'de-uk'));
});

test('Karten starten mit Stabilität der Lektionskarte; Runde max. 20; Bewertung + Intervalle', () => {
  const app = withProgress();
  setDay('2026-10-24');
  const r = T.createTrainerRound(app, { scope: 'all', dir: 'mixed', seed: 2 });
  assert.ok(r.items.length > 0 && r.items.length <= T.MAX_CARDS);
  const it = r.next();
  const pv = r.preview(it);
  assert.equal(pv[1].label, '< 1 T');
  assert.ok(pv[4].days >= pv[3].days && pv[3].days >= pv[2].days, JSON.stringify(pv));
  const seeded = T.seedCard(app, it.entry, it.dir, '2026-10-24');
  if (app.store.state.srs.vocab[it.entry.id]?.S) assert.ok(seeded.S > 0 && seeded.reps === 1);
  r.rate(it, 3, { ms: 2000 });
  assert.ok(app.store.state.srs.trainer[it.key]);
  const before = r.items.length;
  const it2 = r.next();
  const { requeued } = r.rate(it2, 1);
  assert.ok(requeued);
  assert.equal(r.items.length, before + 1);
  for (let x = r.next(); x; x = r.next()) r.rate(x, 3);
  const sum = r.finish();
  assert.equal(sum.counts[1], 1);
  assert.equal(sum.total, before + 1);
  assert.ok(app.store.state.days['2026-10-24'].trainer > 0);
});

test('Auswahl: Index 0 richtig, keine Duplikate; Hören erzwingt UK→DE', () => {
  const app = withProgress();
  const r = T.createTrainerRound(app, { scope: 'all', dir: 'de-uk', mode: 'choice', seed: 3 });
  for (let it = r.next(); it; it = r.next()) {
    const c = r.choices(it);
    assert.ok(c && c.options.length >= 3);
    assert.equal(c.options[0].text, it.entry.uk);
    assert.equal(new Set(c.options.map(o => o.text)).size, c.options.length);
  }
  const l = T.createTrainerRound(app, { scope: 'all', dir: 'de-uk', mode: 'listen', seed: 3 });
  assert.ok(l.items.every(i => i.dir === 'uk-de'));
  assert.equal(l.choices(l.next()).audio, l.items[0].entry.uk);
});

test('Schwierig: markiert oder viele Fehler; Sätze mit Lücke', () => {
  const app = withProgress();
  assert.equal(T.scopeCount(app, 'hard'), 0);
  T.toggleMarked(app, 'pryvit', true);
  assert.equal(T.scopeCount(app, 'hard'), 1);
  app.store.state.mined = [{ id: 'm1', uk: 'Я п’ю́ ка́ву.', de: 'Ich trinke Kaffee.', focus: 'ка́ву' }];
  assert.equal(T.trainerStats(app).sentences, 1);
  const r = T.createTrainerRound(app, { scope: 'mined', dir: 'de-uk', seed: 1 });
  const it = r.next();
  const f = T.cardFaces(it);
  assert.equal(f.front.gap.gap, 'ка́ву');
  assert.equal(T.gapSentence('Я п’ю ка́ву.', 'КАВУ').gap, 'ка́ву');
});

test('DE→UK-Gut aktualisiert fällige Lektionskarte schwach', () => {
  const app = withProgress();
  setDay('2026-11-20');
  const lc = app.store.state.srs.vocab.pryvit;
  const lastBefore = lc.last;
  const r = T.createTrainerRound(app, { scope: 'lesson:a1-1-01', dir: 'de-uk', seed: 1 });
  const it = r.items.find(i => i.entry.id === 'pryvit');
  r.rate(it, 3);
  assert.equal(app.store.state.srs.vocab.pryvit.last, '2026-11-20');
  assert.notEqual(lastBefore, '2026-11-20');
});
