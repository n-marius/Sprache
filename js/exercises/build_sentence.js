// Satzbau mit Wortbausteinen (Duolingo-artig). dir 'de-uk': deutscher Satz → ukrainische Bausteine;
// dir 'uk-de': ukrainischer Satz (antippbar, Audio) → deutsche Bausteine. Kein freies Tippen.
import { h, ukText, deText, chipBuilder, wordTokens, sameSentence, hintDe } from './common.js';

export const selfChecking = false;

export function instructionKey(ex) {
  return ex.dir === 'uk-de' ? 'translate_to_de' : 'translate_to_uk';
}

export function render(ex, ctx) {
  const toUk = ex.dir !== 'uk-de';
  const lang = toUk ? 'uk' : 'de';
  const answer = String(ex.answer ?? '');
  const accept = [answer, ...(Array.isArray(ex.accept) ? ex.accept : [])].filter(Boolean);
  const words = [...wordTokens(answer, lang), ...(ex.distractors || []).map(String)];

  // ---------- Prompt ----------
  let prompt;
  if (toUk) {
    prompt = h('div', { class: 'exb-prompt exb-prompt-de' },
      h('div', { class: 'exb-bubble' }, deText(ex.prompt, { cls: 'exb-prompt-text' })));
  } else {
    prompt = h('div', { class: 'exb-prompt exb-prompt-uk' },
      ctx.speaker(ex.prompt, { size: 'l', autoplay: true }),
      h('div', { class: 'exb-bubble' }, ukText(ex.prompt, { cls: 'exb-prompt-text' })));
  }

  const builder = chipBuilder({ words, lang, ctx, speak: lang === 'uk' && !ctx.listenOff, onChange: has => ctx.setReady(has) });
  const hint = hintDe(ex.hint_de, ctx, 'exb-hint');

  const el = h('div', { class: ['exb', 'exb-build', toUk ? 'is-to-uk' : 'is-to-de'] },
    prompt, hint, h('div', { class: 'exb-build-wrap' }, builder.el));
  ctx.setReady(false);

  let result = null;
  return {
    el,
    getAnswer: () => builder.text(),
    check() {
      if (result) return result;
      const user = builder.text();
      const correct = accept.some(a => sameSentence(user, a, lang));
      builder.reveal(correct);
      el.classList.add(correct ? 'is-correct' : 'is-wrong');
      result = {
        correct,
        userAnswer: user,
        solution_uk: toUk ? answer : String(ex.prompt ?? ''),
        solution_de: toUk ? String(ex.prompt ?? '') : answer,
      };
      if (ex.hint_de && !correct) result.explanation_de = ex.hint_de;
      if (ex.explanation_de) result.explanation_de = ex.explanation_de;
      return result;
    },
    destroy() { builder.destroy(); },
  };
}
