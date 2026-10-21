// Übersetzung wählen (de-uk: deutscher Prompt → ukrainische Optionen; uk-de: ukrainischer Prompt → deutsche Optionen).
import { h, ukText, deText, singleChoice, shuffledOptions, promptBlock, speakIfAutoplay, shortOptions, feedbackAnim } from './common.js';

export const selfChecking = false;
export function instructionKey() { return 'choose_translation'; }

export function render(ex, ctx) {
  const toUk = ex.dir !== 'uk-de';
  const options = ex.options || [];
  const items = shuffledOptions(options, ctx);
  const prompt = toUk
    ? promptBlock({ text: ex.prompt, lang: 'de', ctx, ex, speaker: false })
    : promptBlock({ text: ex.prompt, lang: 'uk', ctx, ex, autoplay: true });

  const sc = singleChoice({
    items,
    cls: ['ex-mc', shortOptions(options) && 'is-short'].filter(Boolean).join(' '),
    renderItem: it => (toUk ? ukText(it.value, { tap: false }) : deText(it.value)),
    onSelect: it => { if (toUk) speakIfAutoplay(it.value, ctx); ctx.setReady(true); },
  });

  const el = h('div', { class: ['ex', 'ex-mc-translate', toUk ? 'dir-de-uk' : 'dir-uk-de'] }, prompt.el, sc.el);
  let result = null;

  return {
    el,
    getAnswer: () => sc.selected?.value ?? '',
    check() {
      if (result) return result;
      const chosen = sc.selected;
      const correct = !!chosen?.correct;
      sc.reveal();
      feedbackAnim(sc.buttons[sc.index], correct);
      result = {
        correct, score: correct ? 1 : 0,
        userAnswer: chosen?.value ?? '',
        solution_uk: toUk ? options[0] : ex.prompt,
        solution_de: toUk ? ex.prompt : options[0],
      };
      return result;
    },
    destroy() { sc.destroy(); },
  };
}
