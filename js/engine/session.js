// STUB (Engine-Agent ersetzt): einfache Session = Einführung aller Vokabeln + alle Aufgaben der Lektion in Reihenfolge.
export function createLessonSession(app, lessonId) {
  const lesson = app.content.getLesson(lessonId);
  const items = [
    ...lesson.vocab.slice(0, 3).map(v => ({ key: 'intro:' + v.id, kind: 'intro', vocab: v, lessonId })),
    ...lesson.exercises.map(ex => ({ key: lessonId + '/' + ex.id, kind: 'exercise', ex, lessonId })),
  ];
  return makeSession(app, 'lesson', lessonId, lesson, items);
}
export function createReviewSession(app) {
  const first = app.content.readyLessons()[0];
  return createLessonSession(app, first.id);
}
function makeSession(app, kind, lessonId, lesson, items) {
  let i = 0, correct = 0, total = 0; const t0 = Date.now();
  const q = new URLSearchParams(location.search);
  if (q.get('type')) items = items.filter(it => it.kind === 'exercise' && it.ex.type === q.get('type'));
  return {
    kind, lessonId, theme: lesson.theme, title_uk: lesson.title_uk, title_de: lesson.title_de,
    next() { return items[i++] || null; },
    record(item, r) { if (item.kind === 'exercise' && !r.skipped) { total++; if (r.correct) correct++; } },
    progress() { return Math.min(1, i / items.length); },
    remaining() { return items.length - i; },
    finish() { return { kind, lessonId, theme: lesson.theme, total, correct, accuracy: total ? correct / total : 1, newWords: lesson.vocab.slice(0, 3), reviewedWords: 0, durationMs: Date.now() - t0, masteryBefore: 0, masteryAfter: 0.2, streak: { current: 1, extended: true }, dayGoal: { done: total, goal: 15, met: total >= 15 } }; },
  };
}
