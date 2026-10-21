// Entwickler-Testseite: #/dev/exercise?lesson=a1-1-01&ex=e07  (oder &type=chat → erste Aufgabe des Typs)
// Rendert eine einzelne Aufgabe mit Prüfen-Button und zeigt das Result-Objekt. Nicht für Nutzer verlinkt.
import { h, ukText, deText } from '../ui/dom.js';
import { getExercise, instructionFor } from '../exercises/index.js';
import { makeCtx } from '../exercises/ctx.js';

export async function render(params, app) {
  const q = params.query;
  const lessonId = q.get('lesson') || app.content.readyLessons()[0].id;
  const lesson = app.content.getLesson(lessonId);
  const ex = q.get('ex') ? lesson.exercises.find(e => e.id === q.get('ex')) : lesson.exercises.find(e => e.type === q.get('type')) || lesson.exercises[0];
  const mod = await getExercise(ex.type);
  const out = h('pre', { class: 'dev-result', style: { whiteSpace: 'pre-wrap', fontSize: '12px', padding: '12px', background: 'var(--surface)', borderRadius: '12px' } });
  const btn = h('button', { class: 'btn btn-primary btn-block', disabled: true, id: 'dev-check' }, app.t('check').uk);
  const show = r => { out.textContent = JSON.stringify(r, null, 2); btn.disabled = true; out.dataset.done = '1'; };
  const ctx = makeCtx(app, { lessonId, ex, onReady: v => { btn.disabled = !v; }, onComplete: show, seed: 42 });
  const key = instructionFor(ex, mod);
  const ctrl = mod.render(ex, ctx);
  btn.addEventListener('click', async () => show(await ctrl.check?.()));
  return {
    el: h('div', { class: 'dev-exercise', style: { padding: 'calc(env(safe-area-inset-top) + 16px) 16px 32px', maxWidth: '680px', margin: '0 auto' } },
      h('div', { class: 't-foot t-2' }, `${lessonId} · ${ex.id} · ${ex.type}`),
      h('h2', { class: 't-title3', style: { margin: '8px 0 2px' } }, ukText(app.t(key).uk)),
      h('div', { class: 'hint-de', style: { marginBottom: '16px' } }, deText(app.t(key).de)),
      ctrl.el,
      h('div', { style: { marginTop: '24px' } }, mod.selfChecking ? null : btn),
      h('div', { style: { marginTop: '16px' } }, out)),
    destroy: () => ctrl.destroy?.(),
  };
}
