// Prüft Fixtures (und echte Inhalte, falls vorhanden): Struktur, Lexikon-Abdeckung aller ukrainischen Wörter.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { tokenize } from '../../js/lib/uk-text.js';
import { buildLexicon } from '../../js/lexicon.js';

const ROOT = path.resolve(import.meta.dirname, '../..');
const TYPES = ['mc_translate', 'build_sentence', 'cloze', 'chat', 'reading', 'listening', 'speak', 'match_pairs', 'picture_choice', 'true_false', 'order_dialog'];

function loadBase(base) {
  const dir = path.join(ROOT, base);
  const read = f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const curriculum = read('curriculum.json');
  const phases = curriculum.phases;
  const lessonList = phases.flatMap(p => p.lessons.map(l => ({ ...l, phaseId: p.id })));
  const lessons = new Map();
  for (const l of lessonList) if (l.status === 'ready') lessons.set(l.id, read(l.file));
  return { curriculum, phases, lessonList, lessons, glossaryCommon: read('glossary-common.json'), uiStrings: read('ui-strings.json') };
}

function* ukStrings(obj, keyPath = '') {
  if (typeof obj === 'string') { if (/[Ѐ-ӿ]/.test(obj)) yield [keyPath, obj]; return; }
  if (Array.isArray(obj)) { for (let i = 0; i < obj.length; i++) yield* ukStrings(obj[i], `${keyPath}[${i}]`); return; }
  if (obj && typeof obj === 'object') for (const [k, v] of Object.entries(obj)) yield* ukStrings(v, keyPath ? `${keyPath}.${k}` : k);
}

// Echte Inhalte nur mit CHECK_CONTENT=1 prüfen (dafür gibt es tools/validate-content.mjs).
for (const base of process.env.CHECK_CONTENT ? ['tests/fixtures', 'content'] : ['tests/fixtures']) {
  if (!fs.existsSync(path.join(ROOT, base, 'curriculum.json'))) continue;
  test(`${base}: Lexikon deckt alle ukrainischen Wörter ab`, () => {
    const c = loadBase(base);
    const lex = buildLexicon(c);
    const missing = new Set();
    const scan = obj => { for (const [, s] of ukStrings(obj)) for (const p of tokenize(s.replace(/\{\{|\}\}/g, ''))) if (p.word && !lex.has(p.text)) missing.add(p.text); };
    scan(c.uiStrings);
    for (const l of c.lessons.values()) scan({ ...l, glossary: undefined });
    assert.deepEqual([...missing], [], 'fehlende Lexikon-Einträge');
  });
  if (base === 'tests/fixtures') test('fixtures: alle Aufgabentypen vertreten, Optionen gültig', () => {
    const c = loadBase(base);
    const seen = new Set();
    for (const l of c.lessons.values()) for (const ex of l.exercises) {
      seen.add(ex.type);
      assert.ok(ex.id && Array.isArray(ex.vocab), ex.id);
    }
    for (const t of TYPES) assert.ok(seen.has(t), `Typ fehlt: ${t}`);
    for (const [, s] of ukStrings([...c.lessons.values()])) {
      assert.ok(!/[áéíóúýÁÉÍÓÚÝ]/.test(s), `vorkomponierter Akzent: ${s}`);
      assert.ok(!/[ʼ']/.test(s), `falscher Apostroph: ${s}`);
    }
  });
}
