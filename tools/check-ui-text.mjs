// Prüft das UI-Wörterbuch (js/ui-text.js): jedes ukrainische Wort muss im Lexikon auflösbar sein
// (glossary-common + vocab/forms/glossary aller Lektionen), Betonung (genau ein U+0301 bei mehrsilbigen
// Wörtern, keins bei einsilbigen, nur nach Vokal), Apostroph ’ (U+2019), deutsche Bedeutung vorhanden.
// Aufruf: node tools/check-ui-text.mjs [--content=content]
import fs from 'node:fs';
import path from 'node:path';
import { UI } from '../js/ui-text.js';
import { tokenize, normalizeWord, STRESS } from '../js/lib/uk-text.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const base = path.join(ROOT, process.argv.find(a => a.startsWith('--content='))?.slice(10) || 'content');
const read = f => JSON.parse(fs.readFileSync(path.join(base, f), 'utf8'));

const VOWELS = new Set([...'аеєиіїоуюя']);
const BAD_APOS = /[ʼ'`´‘]/;
const PRECOMPOSED = /[À-ɏ]/;

const keys = new Set();
const addKey = uk => { if (uk) keys.add(normalizeWord(uk)); };
for (const g of read('glossary-common.json')) addKey(g.uk);
// Zusätzliche Glossar-Dateien (z. B. Entwürfe von Subagenten): --extra=a.json,b.json (absolute Pfade)
const extra = process.argv.find(a => a.startsWith('--extra='))?.slice(8).split(',').filter(Boolean) || [];
for (const f of extra) for (const g of JSON.parse(fs.readFileSync(f, 'utf8'))) addKey(g.uk);
const cur = read('curriculum.json');
let lessons = 0;
for (const p of cur.phases || []) for (const l of p.lessons || []) {
  if (!l.file || !fs.existsSync(path.join(base, l.file))) continue;
  let data;
  try { data = read(l.file); } catch (e) { console.warn(`⚠ ${l.file}: ${e.message}`); continue; }
  lessons++;
  for (const v of data.vocab || []) { addKey(v.uk); for (const f of v.forms || []) addKey(f.uk); }
  for (const g of data.glossary || []) addKey(g.uk);
}

const errors = [];
let words = 0;
for (const [key, v] of Object.entries(UI)) {
  const where = `UI.${key}`;
  if (!v || typeof v.uk !== 'string' || !v.uk.trim()) { errors.push(`${where}: uk fehlt`); continue; }
  if (typeof v.de !== 'string' || !v.de.trim()) errors.push(`${where}: de fehlt`);
  const uk = v.uk.normalize('NFC');
  if (BAD_APOS.test(uk)) errors.push(`${where}: falscher Apostroph (nur ’ U+2019) in „${uk}“`);
  if (PRECOMPOSED.test(uk)) errors.push(`${where}: lateinisches/vorkomponiertes Zeichen in „${uk}“`);
  for (const p of tokenize(uk)) {
    if (!p.word) { if (p.text.includes(STRESS)) errors.push(`${where}: Betonungszeichen außerhalb eines Wortes`); continue; }
    words++;
    const chars = [...p.text.normalize('NFC')];
    const syl = chars.filter(c => VOWELS.has(c.toLowerCase())).length;
    const marks = chars.filter(c => c === STRESS).length;
    if (syl >= 2 && marks !== 1) errors.push(`${where}: ${marks ? 'mehrfache' : 'fehlende'} Betonung „${p.text}“`);
    if (syl < 2 && marks > 0) errors.push(`${where}: einsilbiges Wort mit Betonung „${p.text}“`);
    chars.forEach((c, i) => { if (c === STRESS && (i === 0 || !VOWELS.has(chars[i - 1].toLowerCase()))) errors.push(`${where}: Betonung nicht nach Vokal „${p.text}“`); });
    if (!keys.has(p.key)) errors.push(`${where}: „${p.text}“ nicht im Lexikon (glossary-common.json ergänzen)`);
  }
}

if (errors.length) {
  for (const e of errors) console.error('✗ ' + e);
  console.error(`\n${errors.length} Fehler – ${Object.keys(UI).length} UI-Einträge, ${words} Wörter, ${lessons} Lektion(en).`);
  process.exit(1);
}
console.log(`OK – ${Object.keys(UI).length} UI-Einträge, ${words} Wörter geprüft (${keys.size} Lexikon-Schlüssel, ${lessons} Lektion(en)).`);
