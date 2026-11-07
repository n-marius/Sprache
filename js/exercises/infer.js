// Aufgabentyp „infer“ (Pretesting / Erschließen vor dem Lernen): Ein neues Wort steht in einem Satz; man rät die
// Bedeutung aus dem Kontext, bevor es eingeführt wird. Falsches Raten ist erwünscht (wird nicht ins SRS gebucht).
// ex: { sentence_uk, sentence_de, target_keys:[normalisierte Wörter], options:[de… (Index 0 richtig)], noSrs:true }
import { h, ukText, deText, singleChoice, shuffledOptions, uiLabel } from './common.js';

export const selfChecking = false;
export const instructionKey = () => 'infer';

export function render(ex, ctx) {
  const targets = new Set(ex.target_keys || []);
  const sentence = ukText(ex.sentence_uk || '', { cls: 'inf-sentence' });
  // Zielwort hervorheben und nicht antippbar machen (sonst wäre die Lösung sichtbar)
  for (const w of sentence.querySelectorAll('.w')) {
    if (targets.has(w.dataset.k)) { w.classList.add('inf-target'); w.classList.remove('w'); }
  }
  const items = shuffledOptions(ex.options || [], ctx);
  const choice = singleChoice({ items, cls: 'exd-mc', renderItem: it => deText(it.value), onSelect: () => ctx.setReady(true) });
  const el = h('div', { class: 'inf' },
    h('div', { class: 'card inf-card' }, sentence, h('p', { class: 'inf-tip t-foot' }, uiLabel('infer_tip'))),
    choice.el);
  return {
    el,
    getAnswer: () => choice.selected?.value ?? '',
    check() {
      choice.reveal();
      const ok = !!choice.selected?.correct;
      return {
        correct: ok,
        userAnswer: choice.selected?.value ?? '',
        solution_de: ex.options?.[0],
        solution_uk: ex.sentence_uk,
        explanation_de: `${ex.sentence_de}${ok ? '' : ' – Gleich lernst du das Wort genauer kennen.'}`,
      };
    },
    destroy() { choice.destroy(); },
  };
}
