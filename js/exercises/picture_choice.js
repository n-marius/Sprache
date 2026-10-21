// Bild wählen: ukrainisches Wort/Satz → 2×2-Raster großer Emoji-Kacheln; deutsche Labels erst nach dem Prüfen.
import { h, deText, singleChoice, shuffledOptions, promptBlock, feedbackAnim } from './common.js';

export const selfChecking = false;
export function instructionKey() { return 'choose_picture'; }

export function render(ex, ctx) {
  const options = ex.options || [];
  const items = shuffledOptions(options, ctx);
  const prompt = promptBlock({ text: ex.prompt_uk, lang: 'uk', ctx, ex, autoplay: true });

  const sc = singleChoice({
    items,
    cls: `ex-pic-grid n-${items.length}`,
    renderItem: it => h('span', { class: 'ex-pic' },
      h('span', { class: 'ex-pic-emoji emoji', 'aria-hidden': 'true' }, it.value.emoji),
      deText(it.value.de, { cls: 'ex-pic-label' })),
    onSelect: () => ctx.setReady(true),
  });
  // Ohne Label vorlesen lassen (Screenreader), aber nicht verraten: nur Position
  sc.buttons.forEach((b, i) => b.setAttribute('aria-label', `Bild ${i + 1}: ${items[i].value.emoji}`));

  const el = h('div', { class: 'ex ex-picture-choice' }, prompt.el, sc.el);
  let result = null;
  const label = o => (o ? `${o.emoji} ${o.de}` : '');

  return {
    el,
    getAnswer: () => label(sc.selected?.value),
    check() {
      if (result) return result;
      const chosen = sc.selected;
      const correct = !!chosen?.correct;
      sc.reveal();
      sc.el.classList.add('is-revealed');
      sc.buttons.forEach((b, i) => b.setAttribute('aria-label', label(items[i].value)));
      feedbackAnim(sc.buttons[sc.index], correct);
      result = {
        correct, score: correct ? 1 : 0,
        userAnswer: label(chosen?.value),
        solution_uk: ex.prompt_uk,
        solution_de: options[0] ? `${options[0].emoji} ${options[0].de}` : '',
      };
      return result;
    },
    destroy() { sc.destroy(); },
  };
}
