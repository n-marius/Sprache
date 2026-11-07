// Aufgabentyp „reading“ – Lesetext mit Verständnisfragen (mc / tf). Prüfung über check().
import { h, ukText, deText, singleChoice, shuffledOptions, hintDe, revealToggle, uiLabel, holdLabel } from './common.js';
import { anim } from '../ui/anim.js';

export const selfChecking = false;
export const instructionKey = () => 'read_and_answer';

export function render(ex, ctx) {
  const questions = Array.isArray(ex.questions) ? ex.questions : [];
  const tLabel = k => ctx.t?.(k)?.uk || (k === 'true' ? 'Пра́вда' : 'Непра́вда');

  // ---------- Textkarte ----------
  const reveal = ex.text_de ? revealToggle({ content: deText(ex.text_de, { tag: 'p', cls: 'exd-read-de' }) }) : null;
  const card = h('article', { class: 'card exd-read-card' },
    h('div', { class: 'exd-read-head' },
      h('h3', { class: 'exd-read-title' }, ukText(ex.title_uk || '')),
      h('div', { class: 'exd-read-audio' },
        ctx.speaker(ex.text_uk, { size: 'm' }),
        ctx.speaker(ex.text_uk, { size: 'm', slow: true }))),
    h('p', { class: 'exd-read-text' }, ukText(ex.text_uk || '')),
    ex.mode === 'comprehension' ? null : reveal?.el);

  // ---------- Fragen ----------
  const qs = questions.map((q, n) => {
    const items = q.kind === 'tf'
      ? [true, false].map(v => ({ value: v, label: tLabel(v ? 'true' : 'false'), correct: v === !!q.answer }))
      : shuffledOptions(q.options || [], ctx).map(o => ({ ...o, label: o.value }));
    const choice = singleChoice({
      items,
      keyboard: false,
      keys: false,
      cls: q.kind === 'tf' ? 'exd-tf' : 'exd-mc',
      renderItem: it => ukText(it.label, { tap: false }),
      onSelect: () => update(),
    });
    const box = h('section', { class: 'exd-q', 'aria-label': `Frage ${n + 1}` },
      h('div', { class: 'exd-q-head' },
        h('span', { class: 'exd-q-num', 'aria-hidden': 'true' }, String(n + 1)),
        h('div', { class: 'exd-q-text' },
          h('div', { class: 'exd-q-uk' }, ukText(q.q_uk || '')),
          hintDe(q.q_de, ctx))),
      choice.el);
    return { q, choice, box, items };
  });

  // Verständnis-Modus: erst lesen (Tipp: nicht jedes Wort nötig), dann erscheinen die Fragen.
  const qWrap = h('div', { class: 'exd-questions' }, qs.map(x => x.box));
  const gist = ex.mode === 'comprehension';
  let gate = null;
  if (gist) {
    qWrap.hidden = true;
    gate = h('div', { class: 'exd-read-gate' },
      h('p', { class: 'exd-read-tip' }, uiLabel('read_whole')),
      h('button', { type: 'button', class: 'btn btn-blue btn-block', on: { click: () => { gate.remove(); qWrap.hidden = false; try { qWrap.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch {} } } }, holdLabel('to_questions')));
  }
  const el = h('div', { class: ['exd-read', gist && 'is-gist'] }, card, gate, qWrap);

  function update() { ctx.setReady(qs.length > 0 && qs.every(x => x.choice.selected)); }
  update();

  const correctLabel = x => x.items.find(i => i.correct)?.label ?? '';
  const answerLabel = x => x.choice.selected?.label ?? '–';

  return {
    el,
    getAnswer: () => qs.map((x, i) => `${i + 1}. ${answerLabel(x)}`).join('; '),
    check() {
      let right = 0;
      for (const x of qs) {
        const ok = !!x.choice.selected?.correct;
        if (ok) right++;
        x.choice.reveal();
        x.box.classList.add(ok ? 'is-correct' : 'is-wrong');
        if (ok) anim.correct(x.box, { sparks: false }); else anim.wrong(x.box);
      }
      if (gist && reveal) card.append(reveal.el); // Übersetzung erst nach dem Beantworten
      const wrong = qs.filter(x => !x.choice.selected?.correct);
      return {
        correct: right === qs.length,
        score: qs.length ? right / qs.length : 1,
        userAnswer: qs.map((x, i) => `${i + 1}. ${answerLabel(x)}`).join('; '),
        solution_uk: qs.map((x, i) => `${i + 1}. ${correctLabel(x)}`).join('; '),
        explanation_de: wrong.length
          ? wrong.map(x => `Frage ${qs.indexOf(x) + 1}${x.q.q_de ? ` („${x.q.q_de}“)` : ''}: richtig ist ${correctLabel(x)}`).join('\n')
          : undefined,
      };
    },
    destroy() { qs.forEach(x => x.choice.destroy()); },
  };
}
