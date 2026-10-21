// Ablauf-Helfer (Koordinator): Lektionsstart mit Erklärung vor dem ersten Start.
/** Startet eine Lektion: beim ersten Mal zuerst die Erklärungsseite (#/explain/<id>?start=1). */
export function startLesson(app, lessonId) {
  const seen = app.store.state.lessons[lessonId]?.explainedAt;
  const lesson = app.content.getLesson(lessonId);
  if (!seen && lesson?.explanation) app.navigate(`#/explain/${encodeURIComponent(lessonId)}?start=1`);
  else app.navigate(`#/session/lesson/${encodeURIComponent(lessonId)}`);
}
/** Markiert die Erklärung als gelesen (von views/explain.js aufgerufen). */
export function markExplained(app, lessonId) {
  app.store.update(s => {
    const l = (s.lessons[lessonId] ||= { sessions: 0, completedAt: null, lastAt: null, exSeen: {} });
    if (!l.explainedAt) l.explainedAt = new Date().toISOString();
  });
}
