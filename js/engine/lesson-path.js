// Lektionspfad (lektionsunabhängig): 1. Lernen (Erklärung Schritt für Schritt mit Prüffragen je Schritt),
// 2. Üben (mehrere Übungsrunden, bis alle Aufgaben der Lektion bearbeitet sind), 3. Prüfung (Abschlusstest).
// Die nächste Lektion wird erst nach bestandener Prüfung freigeschaltet (completedAt).
import { tokenize } from '../lib/uk-text.js';
import { shuffle } from './util.js';

export const PASS_MARK = 0.8;          // Bestehensgrenze der Prüfung
export const ROUND_SIZE = 15;          // bewertete Aufgaben je Übungsrunde
export const TEST_SIZE = 20;           // Aufgaben je Prüfung
// Aufgabentypen mit geringem Lernwert (reines Wiedererkennen) werden in Übung und Prüfung gedeckelt
export const LOW_VALUE = new Set(['picture_choice', 'match_pairs']);
// Bevorzugt in der Prüfung: Verstehen im Kontext und eigene Produktion
const TEST_PRIORITY = { reading: 5, chat: 5, structured_input: 5, cloze: 4, build_sentence: 4, order_dialog: 3, true_false: 2, mc_translate: 2, listening: 2, speak: 2, match_pairs: 0, picture_choice: 0 };

const words = uk => tokenize(uk || '').filter(p => p.word).map(p => p.text);

/** Stand des Lektionspfads → { learned, practice: {seen, total, rounds, round, done}, test: {passed, best, attempts} , step } */
export function pathState(app, lessonId) {
  const lesson = app.content.getLesson(lessonId);
  const st = app.store.state.lessons?.[lessonId] || {};
  const authored = (lesson?.exercises || []).filter(e => !LOW_VALUE.has(e.type));
  const seen = authored.filter(e => st.exSeen?.[e.id]?.n).length;
  const total = authored.length;
  const rounds = Math.max(1, Math.ceil(total / ROUND_SIZE));
  const round = Math.min(rounds, Math.floor(seen / ROUND_SIZE) + 1);
  const practiceDone = total > 0 && seen >= total * 0.9;
  const learned = !!st.taughtAt;
  const passed = !!st.completedAt;
  const step = !learned ? 'learn' : !practiceDone && !passed ? 'practice' : !passed ? 'test' : 'done';
  return {
    learned, step,
    practice: { seen, total, rounds, round, done: practiceDone },
    test: { passed, best: st.testBest ?? null, attempts: st.testAttempts || 0, last: st.testLast ?? null },
  };
}

/** Prüffragen zu einem Erklärungsabschnitt aus dessen Beispielen: Verstehen (uk→de) und eigenes Bilden (de→uk). */
export function checksForSection(section, allExamples, rng, { n = 2 } = {}) {
  const ex = (section.examples || []).filter(e => e.uk && e.de);
  if (!ex.length) return [];
  const pick = shuffle(ex, rng).slice(0, n);
  const out = [];
  pick.forEach((e, i) => {
    const others = shuffle(allExamples.filter(o => o.de !== e.de), rng);
    if (i % 2 === 0 && others.length >= 2) {
      out.push({ id: `teach-${section.concept || 'x'}-${i}-mc`, type: 'mc_translate', dir: 'uk-de', generated: true, noSrs: true, vocab: [],
        prompt: e.uk, options: [e.de, ...[...new Set(others.map(o => o.de))].slice(0, 2)] });
    } else {
      const own = words(e.uk);
      if (own.length < 2) return;
      const distractors = [...new Set(others.flatMap(o => words(o.uk)))].filter(w => !own.includes(w)).slice(0, 3);
      out.push({ id: `teach-${section.concept || 'x'}-${i}-bs`, type: 'build_sentence', dir: 'de-uk', generated: true, noSrs: true, vocab: [],
        prompt: e.de, answer: e.uk, distractors });
    }
  });
  return out;
}

/** Items des Lernschritts: je Abschnitt eine Lehrkarte, danach 1–2 Prüffragen. */
export function teachItems(lesson, rng) {
  const secs = lesson?.explanation?.sections || [];
  const allEx = secs.flatMap(s => s.examples || []).filter(e => e.uk && e.de);
  const items = [];
  secs.forEach((s, i) => {
    items.push({ key: `teach:${lesson.id}:${i}`, kind: 'teach', section: s, index: i, count: secs.length, lessonId: lesson.id });
    for (const ex of checksForSection(s, allEx, rng)) items.push({ key: `gen:${ex.id}`, kind: 'exercise', ex, lessonId: lesson.id, stage: 'recall', generated: true });
  });
  return items;
}

/** Aufgaben der Prüfung: deckt möglichst alle Vokabeln ab, bevorzugt Kontext- und Produktionsaufgaben. */
export function testExercises(lesson, rng, { size = TEST_SIZE } = {}) {
  const pool = shuffle((lesson?.exercises || []).filter(e => (TEST_PRIORITY[e.type] ?? 1) > 0), rng);
  const uncovered = new Set((lesson?.vocab || []).map(v => v.id));
  const chosen = [];
  const typeCount = {};
  while (chosen.length < size && pool.length) {
    let best = -1, bestScore = -Infinity;
    pool.forEach((e, i) => {
      const cover = (e.vocab || []).filter(id => uncovered.has(id)).length;
      const score = cover * 3 + (TEST_PRIORITY[e.type] ?? 1) - (typeCount[e.type] || 0) * 2.5 + rng();
      if (score > bestScore) { bestScore = score; best = i; }
    });
    const [e] = pool.splice(best, 1);
    chosen.push(e);
    typeCount[e.type] = (typeCount[e.type] || 0) + 1;
    (e.vocab || []).forEach(id => uncovered.delete(id));
  }
  return chosen;
}
