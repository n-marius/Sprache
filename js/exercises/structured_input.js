// Aufgabentyp „structured_input“ (Processing Instruction nach VanPatten): Serie kurzer Sätze, deren Bedeutung
// nur über die Form erschließbar ist (z. B. ти- oder ви-Form → wer wird angesprochen?). Sofortiges Feedback je Satz.
// ex: { prompt_uk, prompt_de, choices:[{id, uk, emoji}], items:[{uk, de, answer, why_de}], listen? }
import { h, ukText, deText, icon, reducedMotion, uiLabel } from './common.js';
import { anim } from '../ui/anim.js';
import { haptic } from '../ui/haptics.js';

export const selfChecking = true;
export const instructionKey = () => 'structured_input';

const wait = ms => new Promise(r => setTimeout(r, ms));

export function render(ex, ctx) {
  const items = (ctx.shuffle || (a => a))((ex.items || []).slice());
  const listen = !!ex.listen && !ctx.listenOff && !!ctx.app?.tts?.speak;
  let alive = true, idx = 0, right = 0, reasonsAsked = 0, reasonsRight = 0;
  const wrong = [];

  const counter = h('div', { class: 'si-count t-foot' });
  const prompt = h('div', { class: 'si-prompt' }, ukText(ex.prompt_uk || ''), ex.prompt_de ? deText(ex.prompt_de, { cls: 'si-prompt-de' }) : null);
  const sentence = h('div', { class: 'si-sentence' });
  const feedback = h('div', { class: 'si-feedback', 'aria-live': 'polite' });
  const buttons = (ex.choices || []).map(c => h('button', {
    type: 'button', class: 'option si-choice', 'data-id': c.id,
    on: { click: () => pick(c.id) },
  }, c.emoji ? h('span', { class: 'si-emoji', 'aria-hidden': 'true' }, c.emoji) : null, ukText(c.uk, { tap: false })));
  const el = h('div', { class: 'si' }, prompt, counter, sentence, h('div', { class: 'si-choices' }, buttons), feedback);
  let locked = false;

  function show() {
    const it = items[idx];
    counter.textContent = `${idx + 1} / ${items.length}`;
    feedback.replaceChildren();
    buttons.forEach(b => { b.classList.remove('is-correct', 'is-wrong', 'is-dimmed', 'is-disabled'); });
    const text = ukText(it.uk, { cls: 'si-uk' });
    if (listen) {
      text.hidden = true;
      sentence.replaceChildren(ctx.speaker(it.uk, { size: 'l', autoplay: true }), text);
    } else sentence.replaceChildren(text, ctx.speaker(it.uk, { size: 's' }));
    locked = false;
  }

  async function pick(id) {
    if (locked || !alive) return;
    locked = true;
    const it = items[idx];
    const ok = id === it.answer;
    if (ok) right++; else wrong.push(it.uk);
    buttons.forEach(b => {
      b.classList.add('is-disabled');
      if (b.dataset.id === it.answer) b.classList.add('is-correct');
      else if (b.dataset.id === id) b.classList.add('is-wrong');
      else b.classList.add('is-dimmed');
    });
    haptic(ok ? 'success' : 'error');
    const btn = buttons.find(b => b.dataset.id === id);
    if (ok) anim.correct(btn, { sparks: false }); else anim.wrong(btn);
    const t = sentence.querySelector('.si-uk'); if (t) t.hidden = false;
    // Selbsterklärung: „Чому́?“ – woran erkennt man es? (nur wenn die Aufgabe Gründe definiert)
    if (ex.reasons && it.reason) {
      const why = await askReason(it);
      if (!alive) return;
      if (!why) wrong.push(`${it.uk} (Begründung)`); else reasonsRight++;
      reasonsAsked++;
    }
    feedback.replaceChildren(h('div', { class: ['si-why', ok ? 'is-ok' : 'is-bad'] },
      icon(ok ? 'check' : 'bulb'), h('div', it.de ? deText(it.de, { cls: 'si-de' }) : null, it.why_de ? deText(it.why_de, { tag: 'p' }) : null)));
    await wait(reducedMotion() ? 700 : ok ? 1300 : 2600);
    if (!alive) return;
    idx++;
    if (idx < items.length) { show(); return; }
    ctx.complete({
      correct: wrong.length === 0,
      score: (items.length + reasonsAsked) ? (right + reasonsRight) / (items.length + reasonsAsked) : 1,
      userAnswer: `${right} / ${items.length} richtig` + (reasonsAsked ? `, Begründung ${reasonsRight} / ${reasonsAsked}` : ''),
      explanation_de: wrong.length ? `Nochmals ansehen: ${wrong.join(' · ')}` : undefined,
    });
  }

  function askReason(it) {
    return new Promise(resolve => {
      const correct = ex.reasons.find(r => r.id === it.reason);
      const others = (ctx.shuffle || (a => a))(ex.reasons.filter(r => r.id !== it.reason)).slice(0, 2);
      const opts = (ctx.shuffle || (a => a))([correct, ...others].filter(Boolean));
      const btns = opts.map(r => h('button', { type: 'button', class: 'option si-reason', on: { click: () => {
        btns.forEach(b => b.classList.add('is-disabled'));
        const ok = r.id === it.reason;
        btns.forEach((b, i) => { if (opts[i].id === it.reason) b.classList.add('is-correct'); else if (opts[i] === r) b.classList.add('is-wrong'); else b.classList.add('is-dimmed'); });
        haptic(ok ? 'success' : 'error');
        setTimeout(() => resolve(ok), reducedMotion() ? 300 : ok ? 700 : 1400);
      } } }, deText(r.de)));
      feedback.replaceChildren(h('div', { class: 'si-reasons' }, h('div', { class: 'si-reasons-q' }, uiLabel('why_q', { layout: 'inline' })), btns));
    });
  }

  show();
  return { el, getAnswer: () => `${right} / ${items.length}`, destroy() { alive = false; } };
}
