// Meldungen + Export: Datenmodell, Text-Format, Backup bauen/prüfen/einspielen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultState, migrate } from '../../js/store.js';
import { CATEGORIES, createReport, addReport, deleteReport, deviceInfo, exerciseSummary, formatReportsText, attachedData } from '../../js/services/reports.js';
import { reportsToText, buildBackup, parseBackup, applyBackup, backupSummary } from '../../js/services/export.js';

export function fakeApp(patch = {}) {
  const state = defaultState();
  Object.assign(state.settings, patch.settings || {});
  const store = {
    state,
    update(fn) { fn(this.state); this.state.updatedAt = new Date().toISOString(); },
    exportData() { return structuredClone(this.state); },
    importData(obj) { this.state = migrate(structuredClone(obj)); },
  };
  const content = { base: 'tests/fixtures/', isFixture: true, getMeta: id => id === 'a1-1-01' ? { title_uk: 'Приві́т!', title_de: 'Hallo!' } : null };
  return { store, content, version: '9.9.9' };
}

const EX = { id: 'e05', type: 'mc_translate', dir: 'de-uk', prompt: 'Hallo!', options: ['Приві́т!', 'Бува́й!', 'Дя́кую!'], vocab: ['pryvit'], difficulty: 1 };

test('CATEGORIES ist ein Array von Labels', () => {
  assert.ok(CATEGORIES.length >= 8);
  assert.ok(CATEGORIES.every(c => typeof c === 'string'));
  assert.ok(CATEGORIES.includes('Betonung falsch'));
});

test('createReport hängt Kontext an', () => {
  const app = fakeApp();
  const r = createReport({ lessonId: 'a1-1-01', ex: EX, userAnswer: 'Бува́й!', category: 'Übersetzung falsch', text: '  passt nicht ', app, device: 'Test' });
  assert.equal(r.category, 'Übersetzung falsch');
  assert.equal(r.text, 'passt nicht');
  assert.equal(r.exId, 'e05');
  assert.equal(r.exType, 'mc_translate');
  assert.equal(r.lessonTitle, 'Приві́т! (Hallo!)');
  assert.equal(r.appVersion, '9.9.9');
  assert.equal(r.contentBase, 'tests/fixtures/');
  assert.equal(r.isFixture, true);
  assert.deepEqual(r.exercise, EX);
  assert.notEqual(r.exercise, EX, 'Kopie, keine Referenz');
  assert.equal(r.syncedAt, null);
  assert.ok(!('text' in attachedData(r)));
});

test('Einführungskarte / Tipp / generiert', () => {
  const app = fakeApp();
  const intro = createReport({ lessonId: 'a1-1-01', ex: { key: 'i1', kind: 'intro', vocab: { id: 'kava', uk: 'ка́ва', de: 'Kaffee' } }, app });
  assert.equal(intro.exType, 'intro');
  assert.equal(intro.exId, 'i1');
  assert.match(exerciseSummary(intro.exercise), /ка́ва/);
  const tip = createReport({ ex: { id: 't1', type: 'tip', title_de: 'Betonung' }, app });
  assert.equal(tip.exType, 'tip');
  const gen = createReport({ ex: { ...EX, generated: true }, userAnswer: { a: 1 }, app });
  assert.equal(gen.generated, true);
  assert.equal(gen.userAnswer, '{"a":1}');
  assert.equal(createReport({ category: 'Quatsch', app }).category, 'Quatsch');
  assert.equal(createReport({ app }).category, 'Sonstiges');
});

test('addReport (neueste zuerst) und deleteReport', () => {
  const app = fakeApp();
  const a = addReport(app, { lessonId: 'a1-1-01', ex: EX, category: 'Sonstiges' });
  const b = addReport(app, { lessonId: 'a1-1-01', ex: EX, category: 'Betonung falsch' });
  assert.equal(app.store.state.reports[0].id, b.id);
  deleteReport(app, b.id);
  assert.deepEqual(app.store.state.reports.map(r => r.id), [a.id]);
});

test('Text-Export: Kopf, Blöcke, JSON eingerückt, neueste oben', () => {
  const app = fakeApp();
  const r1 = createReport({ lessonId: 'a1-1-01', ex: EX, category: 'Sonstiges', text: 'erste', app, now: new Date('2026-10-21T10:00:00Z'), device: 'iPhone' });
  const r2 = createReport({ lessonId: 'a1-1-01', ex: EX, category: 'Betonung falsch', text: 'zweite\nZeile', userAnswer: 'Бува́й!', app, now: new Date('2026-10-22T10:00:00Z'), device: 'iPad' });
  const txt = reportsToText([r1, r2], { appVersion: '9.9.9', now: new Date('2026-10-23T08:00:00Z') });
  assert.match(txt, /^Мова – Meldungen/);
  assert.match(txt, /App-Version:\s+9\.9\.9/);
  assert.match(txt, /Anzahl:\s+2 Meldungen/);
  assert.ok(txt.indexOf('#2 · Betonung falsch') < txt.indexOf('#1 · Sonstiges'));
  assert.match(txt, /2026-10-22T10:00:00.000Z/);
  assert.match(txt, /Nutzerantwort:\s+Бува́й!/);
  assert.match(txt, /\n {2}zweite\n {2}Zeile/);
  assert.match(txt, /\n {4}"type": "mc_translate"/);
  assert.match(txt, /Gerät:\s+iPad/);
  assert.match(formatReportsText([]), /Keine Meldungen/);
});

test('deviceInfo erkennt iPhone/iPad', () => {
  const iphone = deviceInfo({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1', standalone: true }, {});
  assert.equal(iphone, 'iPhone · iOS 17.4 · Safari · Home-Bildschirm');
  const ipad = deviceInfo({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15', maxTouchPoints: 5 }, {});
  assert.equal(ipad, 'iPad · iPadOS 17.2 · Safari');
});

test('Backup ohne Token, Prüfung, Einspielen behält lokale Sync-Daten', () => {
  const app = fakeApp({ settings: { gistToken: 'ghp_secret', gistId: 'g1', gistAutoSync: true } });
  app.store.state.lessons['a1-1-01'] = { sessions: 2, completedAt: '2026-10-21T10:00:00Z', storySeenAt: 'x', explainedAt: 'y' };
  app.store.state.mined = [{ id: 'm1', uk: 'Я п’ю́ ка́ву.', de: 'Ich trinke Kaffee.' }];
  app.store.state.srs.trainer = { m1: { due: 1 } };
  const b = buildBackup(app.store, { appVersion: '9.9.9' });
  assert.equal(b.format, 'mova-backup');
  assert.equal(b.state.settings.gistToken, '');
  assert.equal(app.store.state.settings.gistToken, 'ghp_secret', 'Original unverändert');
  const json = JSON.stringify(b);
  assert.ok(!json.includes('ghp_secret'));

  const parsed = parseBackup(json);
  assert.equal(parsed.lessons['a1-1-01'].explainedAt, 'y');
  assert.match(backupSummary(parsed, b.exportedAt), /1 Lektion abgeschlossen/);

  const other = fakeApp({ settings: { gistToken: 'ghp_other', gistId: 'g2' } });
  other.store.state.meta.lastSyncAt = 'S';
  applyBackup(other.store, parsed);
  const s = other.store.state;
  assert.equal(s.settings.gistToken, 'ghp_other');
  assert.equal(s.settings.gistId, 'g2');
  assert.equal(s.settings.gistAutoSync, false);
  assert.equal(s.meta.lastSyncAt, 'S');
  assert.equal(s.lessons['a1-1-01'].storySeenAt, 'x');
  assert.equal(s.mined.length, 1);
  assert.deepEqual(s.srs.trainer, { m1: { due: 1 } });
});

test('parseBackup lehnt Ungültiges ab', () => {
  assert.throws(() => parseBackup('{kein json'), /kein gültiges JSON/);
  assert.throws(() => parseBackup('[]'), /kein Мова-Backup/);
  assert.throws(() => parseBackup({ format: 'anders' }), /Unbekanntes Dateiformat/);
  assert.throws(() => parseBackup({ format: 'mova-backup', formatVersion: 99, state: {} }), /neueren App-Version/);
  assert.throws(() => parseBackup({ schema: 1 }), /Zustand fehlt/);
  assert.throws(() => parseBackup({ schema: 1, settings: {}, reports: {} }), /reports/);
  // roher Zustand (ohne Hülle) wird akzeptiert
  assert.equal(parseBackup(defaultState()).schema, 1);
});
