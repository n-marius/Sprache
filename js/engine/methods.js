// Lektionsunabhängige Lernmethoden, die die App automatisch aus den Daten jeder Lektion erzeugt:
//  - makeInfer: Erschließen vor dem Lernen (Pretesting) aus vocab.example
//  - makeBackTranslation: stille Rückübersetzung aus lesson.story.lines (Zeilen mit uk + de)
import { tokenize, normalizeWord } from '../lib/uk-text.js';
import { shuffle } from './util.js';

const words = uk => tokenize(uk || '').filter(p => p.word);

/** Pretest-Aufgabe zu einem neuen Wort, wenn sein Beispielsatz genug Kontext bietet; sonst null. */
export function makeInfer(v, pool, rng, isKnown = () => true) {
  const ex = v.example;
  if (!ex?.uk || !ex?.de) return null;
  const keys = new Set([v.uk, ...(v.forms || []).map(f => f.uk)].flatMap(u => words(u).map(w => w.key)));
  const toks = words(ex.uk);
  const target = toks.filter(t => keys.has(t.key)).map(t => t.key);
  const context = toks.filter(t => !keys.has(t.key));
  // Erschließen braucht verständlichen Kontext: mind. 2 Kontextwörter, davon mind. die Hälfte schon bekannt
  const known = context.filter(t => isKnown(t.key)).length;
  if (!target.length || context.length < 2 || known < 2 || known < context.length / 2) return null;
  const others = shuffle(pool.filter(p => p.id !== v.id && p.de && p.de !== v.de), rng).map(p => p.de);
  const distract = [...new Set(others)].slice(0, 2);
  if (distract.length < 2) return null;
  return {
    id: `inf-${v.id}`, type: 'infer', generated: true, noSrs: true, source_vocab: v.id, vocab: [v.id],
    sentence_uk: ex.uk, sentence_de: ex.de, target_keys: [...new Set(target)], options: [v.de, ...distract],
  };
}

/** Rückübersetzung von 3 aufeinanderfolgenden Zeilen des Leittexts; sonst null. */
export function makeBackTranslation(lesson, rng, { size = 3 } = {}) {
  const lines = (lesson?.story?.lines || []).filter(l => l.uk && l.de && !l.scene);
  if (lines.length < size) return null;
  const start = Math.floor(rng() * (lines.length - size + 1));
  const pick = lines.slice(start, start + size);
  const used = new Set(pick.flatMap(l => words(l.uk).map(w => normalizeWord(w.text))));
  const distractors = shuffle([...new Set(lines.flatMap(l => words(l.uk).map(w => w.text)))]
    .filter(w => !used.has(normalizeWord(w))), rng).slice(0, 4);
  return {
    id: `bt-${lesson.id}-${start}`, type: 'back_translation', generated: true, noSrs: true, vocab: [],
    title_uk: lesson.story.title_uk || lesson.title_uk,
    lines: pick.map(l => ({ who: l.who || null, uk: l.uk, de: l.de })),
    context: start > 0 ? { who: lines[start - 1].who || null, uk: lines[start - 1].uk } : null,
    distractors,
  };
}

/** key → bekannt? (Wort gehört zu einer Vokabel, die schon im SRS ist). */
export function knownKeyTest(app) {
  const cards = app.store.state.srs?.vocab || {};
  const map = new Map();
  for (const v of app.content.vocabById.values()) {
    for (const u of [v.uk, ...(v.forms || []).map(f => f.uk)]) for (const w of words(u)) if (!map.has(w.key)) map.set(w.key, v.id);
  }
  return key => { const id = map.get(key); return !!id && !!cards[id]; };
}
