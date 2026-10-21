// Hören: großer Lautsprecher + langsam; Modi choose_meaning (DE-Optionen), choose_heard (UK-Optionen), build (Wortbausteine).
import { h, ukText, deText, singleChoice, shuffledOptions, chipBuilder, wordTokens, sameSentence, shortOptions, feedbackAnim, isolate } from './common.js';

export const selfChecking = false;
export function instructionKey(ex) { return ex.mode === 'build' ? 'listen_and_build' : 'listen_and_choose'; }

export function render(ex, ctx) {
  const audio = ex.audio_uk || '';
  const mode = ex.mode === 'build' || ex.mode === 'choose_heard' ? ex.mode : 'choose_meaning';

  const big = ctx.speaker(audio, { size: 'l', autoplay: true });
  const slow = ctx.speaker(audio, { size: 'm', slow: true });
  big.classList.add('ex-listen-main');
  slow.classList.add('ex-listen-slow');
  const transcript = h('div', { class: 'ex-transcript', hidden: true });
  const stage = h('div', { class: 'ex-listen' },
    h('div', { class: 'ex-listen-btns' }, isolate(big), isolate(slow)),
    transcript);

  let answerEl, sc = null, cb = null;
  if (mode === 'build') {
    const words = [...wordTokens(audio, 'uk'), ...(ex.distractors || [])];
    cb = chipBuilder({ words, lang: 'uk', ctx, onChange: has => ctx.setReady(has) });
    answerEl = cb.el;
  } else {
    const options = ex.options || [];
    const heard = mode === 'choose_heard';
    sc = singleChoice({
      items: shuffledOptions(options, ctx),
      cls: ['ex-listen-options', shortOptions(options) && 'is-short'].filter(Boolean).join(' '),
      renderItem: it => (heard ? ukText(it.value, { tap: false }) : deText(it.value)),
      onSelect: () => ctx.setReady(true),
    });
    answerEl = sc.el;
  }

  const el = h('div', { class: ['ex', 'ex-listening', `mode-${mode}`] }, stage, answerEl);
  let result = null;

  return {
    el,
    getAnswer: () => (cb ? cb.text() : sc.selected?.value ?? ''),
    check() {
      if (result) return result;
      let correct, userAnswer;
      if (cb) {
        userAnswer = cb.text();
        correct = [audio, ...(ex.accept || [])].some(a => sameSentence(userAnswer, a, 'uk'));
        cb.reveal(correct);
        feedbackAnim(cb.el.querySelector('.ex-build-answer'), correct);
      } else {
        const chosen = sc.selected;
        correct = !!chosen?.correct;
        userAnswer = chosen?.value ?? '';
        sc.reveal();
        feedbackAnim(sc.buttons[sc.index], correct);
      }
      transcript.append(ukText(audio));
      transcript.hidden = false;
      result = { correct, score: correct ? 1 : 0, userAnswer, solution_uk: audio };
      if (mode === 'choose_meaning' && ex.options?.[0]) result.solution_de = ex.options[0];
      if (ex.translation_de) result.solution_de = ex.translation_de;
      return result;
    },
    destroy() { sc?.destroy(); cb?.destroy(); },
  };
}
