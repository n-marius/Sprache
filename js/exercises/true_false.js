// Richtig oder falsch: optionaler Kontext (Karte) + ukrainische Aussage → zwei große Buttons.
import { h, ukText, deText, icon, singleChoice, promptBlock, exCard, hintDe, isolate, feedbackAnim } from './common.js';

export const selfChecking = false;
export function instructionKey() { return 'true_false'; }

export function render(ex, ctx) {
  const answer = ex.answer === true;
  const tTrue = ctx.t('true'), tFalse = ctx.t('false');
  const items = [
    { value: true, correct: answer === true, s: tTrue },
    { value: false, correct: answer === false, s: tFalse },
  ];

  let context = null;
  if (ex.context_uk) {
    const sp = ctx.speaker(ex.context_uk, { size: 's', autoplay: false });
    context = exCard(
      h('div', { class: 'ex-card-row' },
        isolate(sp),
        h('div', { class: 'ex-card-body' }, ukText(ex.context_uk, { cls: 'ex-context-uk' }), hintDe(ex.context_de, ctx))),
    );
    context.classList.add('ex-tf-context');
  }
  const statement = promptBlock({ text: ex.statement_uk, lang: 'uk', ctx, ex, tap: true, autoplay: !ex.context_uk, cls: 'ex-tf-statement' });

  const sc = singleChoice({
    items,
    cls: 'ex-tf',
    renderItem: it => h('span', { class: ['ex-tf-inner', it.value ? 'is-true' : 'is-false'] },
      h('span', { class: 'ex-tf-icon' }, icon(it.value ? 'check' : 'x')),
      ukText(it.s.uk, { tap: false, cls: 'ex-tf-label' }),
      deText(it.s.de, { cls: 'ex-tf-sub' })),
    onSelect: () => ctx.setReady(true),
  });

  const el = h('div', { class: 'ex ex-true-false' }, context, statement.el, sc.el);
  let result = null;

  return {
    el,
    getAnswer: () => (sc.selected ? sc.selected.s.uk : ''),
    check() {
      if (result) return result;
      const chosen = sc.selected;
      const correct = !!chosen?.correct;
      sc.reveal();
      feedbackAnim(sc.buttons[sc.index], correct);
      const sol = answer ? tTrue : tFalse;
      result = {
        correct, score: correct ? 1 : 0,
        userAnswer: chosen ? chosen.s.uk : '',
        solution_uk: sol.uk,
        solution_de: sol.de,
        explanation_de: ex.explanation_de || undefined,
      };
      return result;
    },
    destroy() { sc.destroy(); },
  };
}
