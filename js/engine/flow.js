// Ablauf-Helfer (Koordinator): Lektionsstart = Geschichte (Ankertext) → Erklärung → Übungs-Session.
// Beim ersten Start einer Lektion werden Geschichte und Erklärung gezeigt; danach direkt die Session.
function lessonState(s, id) { return (s.lessons[id] ||= { sessions: 0, completedAt: null, lastAt: null, exSeen: {} }); }

/** Nächster Schritt für den Start einer Lektion: 'story' | 'explain' | 'session'. */
export function nextStep(app, lessonId) {
  const st = app.store.state.lessons[lessonId] || {};
  const lesson = app.content.getLesson(lessonId);
  if (lesson?.story && !st.storySeenAt) return 'story';
  if (lesson?.explanation && !st.explainedAt) return 'explain';
  return 'session';
}

/** Startet eine Lektion (Story/Erklärung beim ersten Mal mit ?start=1, danach Session). */
export function startLesson(app, lessonId) {
  const id = encodeURIComponent(lessonId);
  const step = nextStep(app, lessonId);
  if (step === 'story') app.navigate(`#/story/${id}?start=1`);
  else if (step === 'explain') app.navigate(`#/explain/${id}?start=1`);
  else app.navigate(`#/session/lesson/${id}`);
}

/** Von views/story.js nach dem Lesen aufgerufen; mit start=true geht es zum nächsten Schritt. */
export function markStorySeen(app, lessonId, { proceed = false } = {}) {
  app.store.update(s => { const l = lessonState(s, lessonId); if (!l.storySeenAt) l.storySeenAt = new Date().toISOString(); });
  if (proceed) startLesson(app, lessonId);
}

/** Von views/explain.js aufgerufen; mit proceed=true geht es zur Session. */
export function markExplained(app, lessonId, { proceed = false } = {}) {
  app.store.update(s => { const l = lessonState(s, lessonId); if (!l.explainedAt) l.explainedAt = new Date().toISOString(); });
  if (proceed) startLesson(app, lessonId);
}
