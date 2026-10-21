// Lückentext: Lücken {{…}} als Slots im Fließtext, Optionen der aktiven Lücke als Bausteine darunter.
import { h, ukText, deText, hintDe, revealToggle, shuffledOptions, keyHandler, digitOf, isolate } from './common.js';
import { normalizeWord } from '../lib/uk-text.js';
import { haptic } from '../ui/haptics.js';
import { anim } from '../ui/anim.js';

export const selfChecking = false;
export function instructionKey() { return 'fill_gap'; }

const GAP = /\{\{(.+?)\}\}/g;

/** Zerlegt den Text in [{text}|{gap: i, answer}]. */
export function parseCloze(text) {
  const parts = [];
  let last = 0, n = 0;
  const src = String(text ?? '');
  for (const m of src.matchAll(GAP)) {
    if (m.index > last) parts.push({ text: src.slice(last, m.index) });
    parts.push({ gap: n++, answer: m[1].trim() });
    last = m.index + m[0].length;
  }
  if (last < src.length) parts.push({ text: src.slice(last) });
  return parts;
}

export function render(ex, ctx) {
  const parts = parseCloze(ex.text);
  const gaps = parts.filter(p => p.gap != null);
  const full = parts.map(p => (p.gap != null ? p.answer : p.text)).join('');
  const opts = gaps.map((g, i) => {
    const list = (ex.options?.[i]?.length ? ex.options[i] : [g.answer]).map(String);
    return shuffledOptions(list, ctx);
  });
  const fills = gaps.map(() => null);
  let active = gaps.length ? 0 : -1;
  let locked = false;

  // ---------- Satz mit Slots ----------
  const slotEls = [];
  const sentence = h('p', { class: 'exb-cloze-text' });
  for (const p of parts) {
    if (p.gap == null) { sentence.append(ukText(p.text)); continue; }
    const i = p.gap;
    const slot = h('button', {
      type: 'button', class: 'exb-gap', 'aria-label': `Lücke ${i + 1}`,
      on: { click: () => tapGap(i) },
    }, h('span', { class: 'exb-gap-fill' }), h('span', { class: 'exb-gap-fix', hidden: true }));
    const longest = Math.max(2, ...opts[i].map(o => [...o.value.normalize('NFD').replace(/\p{M}/gu, '')].length));
    slot.style.setProperty('--gap-w', `${(longest * 0.58 + 1).toFixed(2)}em`);
    slotEls.push(slot);
    sentence.append(slot);
  }

  const speakWrap = h('div', { class: 'exb-cloze-speak', hidden: true });
  const card = h('div', { class: 'exb-cloze-card' }, speakWrap, sentence);

  const optsEl = h('div', { class: 'exb-cloze-opts', role: 'group', 'aria-label': 'Auswahl' });
  const optsLabel = h('div', { class: 'exb-cloze-opts-label' });
  const bankEl = h('div', { class: 'exb-cloze-bank' }, optsLabel, optsEl);

  const extras = [];
  if (ex.translation_de) {
    const rt = revealToggle({ content: deText(ex.translation_de, { cls: 'exb-cloze-de' }), cls: 'exb-reveal' });
    extras.push(rt.el);
  }
  const hint = hintDe(ex.hint_de, ctx, 'exb-hint');

  const el = h('div', { class: 'exb exb-cloze' }, card, extras, hint,
    bankEl);

  function nextEmpty(from) {
    for (let k = 1; k <= gaps.length; k++) {
      const j = (from + k) % gaps.length;
      if (fills[j] == null) return j;
    }
    return -1;
  }

  function paint() {
    slotEls.forEach((s, i) => {
      s.classList.toggle('is-active', i === active && !locked);
      s.classList.toggle('is-filled', fills[i] != null);
      const f = s.querySelector('.exb-gap-fill');
      f.replaceChildren(fills[i] != null ? ukText(fills[i], { tap: false }) : '');
    });
    optsEl.replaceChildren();
    if (active >= 0 && !locked) {
      optsLabel.textContent = gaps.length > 1 ? `Lücke ${active + 1} von ${gaps.length}` : '';
      optsLabel.hidden = gaps.length < 2;
      opts[active].forEach((o, k) => {
        const picked = fills[active] === o.value;
        optsEl.append(h('button', {
          type: 'button', class: ['chip', 'ex-chip', 'exb-opt', picked && 'is-picked'],
          'aria-pressed': String(picked),
          on: { click: () => pick(k) },
        }, ukText(o.value, { tap: false })));
      });
    }
    ctx.setReady(!locked && fills.every(f => f != null));
  }

  function pick(k) {
    if (locked || active < 0) return;
    const i = active;
    fills[i] = opts[i][k].value;
    haptic('select');
    const n = nextEmpty(i);
    if (n >= 0) active = n;
    paint();
    anim.pop(slotEls[i]);
  }

  function tapGap(i) {
    if (locked) return;
    fills[i] = null; // gefüllte Lücke leeren, leere aktivieren
    active = i;
    haptic('light');
    paint();
  }

  const off = keyHandler(e => {
    if (locked || active < 0) return;
    const n = digitOf(e);
    if (n && n <= opts[active].length) { pick(n - 1); return true; }
    if (e.key === 'Backspace') {
      const j = fills[active] != null ? active : [...fills.keys()].reverse().find(x => fills[x] != null);
      if (j != null) { tapGap(j); return true; }
    }
  });

  paint();

  let result = null;
  return {
    el,
    getAnswer: () => userSentence(),
    check() {
      if (result) return result;
      locked = true; off();
      const ok = gaps.map((g, i) => fills[i] != null && normalizeWord(fills[i]) === normalizeWord(g.answer));
      const correct = ok.every(Boolean);
      paint();
      el.classList.add('is-locked', correct ? 'is-correct' : 'is-wrong');
      slotEls.forEach((s, i) => {
        s.disabled = true;
        s.classList.add(ok[i] ? 'is-correct' : 'is-wrong');
        if (!ok[i]) {
          const fix = s.querySelector('.exb-gap-fix');
          fix.replaceChildren(ukText(gaps[i].answer, { tap: false }));
          fix.hidden = false;
        }
      });
      bankEl.hidden = true;
      speakWrap.append(isolate(ctx.speaker(full, { size: 'm', autoplay: true })));
      speakWrap.hidden = false;
      result = {
        correct,
        score: gaps.length ? ok.filter(Boolean).length / gaps.length : (correct ? 1 : 0),
        userAnswer: userSentence(),
        solution_uk: full,
      };
      if (ex.translation_de) result.solution_de = ex.translation_de;
      if (ex.explanation_de) result.explanation_de = ex.explanation_de;
      else if (ex.hint_de && !correct) result.explanation_de = ex.hint_de;
      return result;
    },
    destroy() { off(); },
  };

  function userSentence() {
    return parts.map(p => (p.gap != null ? (fills[p.gap] ?? '…') : p.text)).join('');
  }
}
