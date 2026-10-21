// Lexikon-Index: glossary-common + vocab (inkl. forms) + glossary aller Lektionen.
// Lookup-Schlüssel = normalizeWord(uk); mehrere Einträge je Schlüssel (Homographen) möglich.
import { normalizeWord } from './lib/uk-text.js';

export class Lexicon {
  constructor() { this.map = new Map(); }

  add(entry) {
    if (!entry || !entry.uk) return;
    const key = normalizeWord(entry.uk);
    if (!key) return;
    const e = {
      uk: entry.uk,
      lemma: entry.lemma || entry.uk,
      de: entry.de || '',
      pos: entry.pos || '',
      info: entry.info || '',
      emoji: entry.emoji || '',
      vocabId: entry.vocabId || null,
      lessonId: entry.lessonId || null,
    };
    const list = this.map.get(key) || [];
    const dup = list.find(x => normalizeWord(x.lemma) === normalizeWord(e.lemma) && x.de === e.de && x.info === e.info);
    if (dup) { if (!dup.vocabId && e.vocabId) dup.vocabId = e.vocabId; return; }
    list.push(e);
    this.map.set(key, list);
  }

  /** Einträge für ein Wort (beliebige Schreibung, mit/ohne Betonung). */
  lookup(word) {
    const key = normalizeWord(String(word || ''));
    return this.map.get(key) || [];
  }

  has(word) { return this.lookup(word).length > 0; }
  get size() { return this.map.size; }
}

export function buildLexicon(content) {
  const lex = new Lexicon();
  for (const g of content.glossaryCommon || []) lex.add(g);
  for (const meta of content.lessonList) {
    const data = content.lessons.get(meta.id);
    if (!data) continue;
    for (const v of data.vocab) {
      lex.add({ uk: v.uk, lemma: v.uk, de: v.de, pos: v.pos, info: v.info, emoji: v.emoji, vocabId: v.id, lessonId: meta.id });
      for (const f of v.forms || []) {
        lex.add({ uk: f.uk, lemma: v.uk, de: v.de, pos: v.pos, info: f.info, vocabId: v.id, lessonId: meta.id });
      }
    }
    for (const g of data.glossary) lex.add({ ...g, lessonId: meta.id });
  }
  return lex;
}
