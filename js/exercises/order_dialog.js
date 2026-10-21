// Dialog ordnen: gemischte Zeilen-Karten unten antippen → oben als Chat-Verlauf (A links, B rechts) einsortieren.
import { h, ukText, deText, hintsOn, shuffleNotIdentity, isolate, keyHandler, digitOf } from './common.js';
import { normalizeSentence } from '../lib/uk-text.js';
import { haptic } from '../ui/haptics.js';
import { anim } from '../ui/anim.js';

export const selfChecking = false;
export function instructionKey() { return 'order_dialog'; }

export function render(ex, ctx) {
  const lines = (ex.lines || []).map((l, i) => ({ uk: String(l.uk ?? ''), de: String(l.de ?? ''), i }));
  const bank = shuffleNotIdentity(lines, ctx, (a, b) => a.i === b.i);
  const showDe = hintsOn(ctx);
  const placed = []; // Einträge aus bank (Reihenfolge = Dialog)
  let locked = false;

  const dialog = h('div', { class: 'exb-dialog', role: 'list', 'aria-label': 'Dialog' });
  const bankEl = h('div', { class: 'exb-dlg-bank', role: 'list' });

  const cards = bank.map((ln, k) => {
    const card = h('div', {
      class: 'exb-dlg-card', role: 'button', tabindex: '0',
      on: { click: () => place(k), keydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); place(k); } } },
    },
      h('span', { class: 'exb-dlg-key', 'aria-hidden': 'true' }, String(k + 1)),
      h('div', { class: 'exb-dlg-texts' },
        ukText(ln.uk, { tap: false, cls: 'exb-dlg-uk' }),
        showDe && ln.de ? deText(ln.de, { cls: 'exb-dlg-de' }) : null),
      isolate(ctx.speaker(ln.uk, { size: 's' })));
    bankEl.append(card);
    return card;
  });

  function bubble(ln, pos) {
    const side = pos % 2 === 0 ? 'a' : 'b';
    const b = h('div', {
      class: ['exb-msg', `is-${side}`], role: 'listitem',
    },
      h('span', { class: 'exb-avatar', 'aria-hidden': 'true' }, side.toUpperCase()),
      h('div', {
        class: 'exb-msg-bubble', role: 'button', tabindex: '0', 'aria-label': `Zeile ${pos + 1} zurücknehmen`,
        on: { click: () => unplace(pos), keydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); unplace(pos); } } },
      },
        ukText(ln.uk, { tap: false, cls: 'exb-msg-uk' }),
        showDe && ln.de ? deText(ln.de, { cls: 'exb-msg-de' }) : null),
      isolate(ctx.speaker(ln.uk, { size: 's' })));
    return b;
  }

  function paint(newPos = -1) {
    dialog.replaceChildren();
    placed.forEach((k, pos) => {
      const b = bubble(bank[k], pos);
      dialog.append(b);
      if (pos === newPos) anim.pop(b.querySelector('.exb-msg-bubble'));
    });
    for (let pos = placed.length; pos < lines.length; pos++) {
      const side = pos % 2 === 0 ? 'a' : 'b';
      dialog.append(h('div', { class: ['exb-msg', 'is-empty', `is-${side}`], 'aria-hidden': 'true' },
        h('span', { class: 'exb-avatar' }, side.toUpperCase()),
        h('div', { class: 'exb-msg-bubble' }, pos === placed.length ? '…' : '')));
    }
    cards.forEach((c, k) => {
      const used = placed.includes(k);
      c.classList.toggle('is-used', used);
      c.setAttribute('aria-hidden', String(used));
      c.tabIndex = used ? -1 : 0;
    });
    ctx.setReady(!locked && placed.length === lines.length);
  }

  function place(k) {
    if (locked || placed.includes(k)) return;
    placed.push(k);
    haptic('select');
    if (!ctx.listenOff && ctx.settings?.autoplay !== false) ctx.app?.tts?.speak?.(bank[k].uk)?.catch?.(() => {});
    paint(placed.length - 1);
  }
  function unplace(pos) {
    if (locked || pos < 0 || pos >= placed.length) return;
    placed.splice(pos, 1);
    haptic('light');
    paint();
  }

  const off = keyHandler(e => {
    if (locked) return;
    const n = digitOf(e);
    if (n && n <= cards.length) { place(n - 1); return true; }
    if (e.key === 'Backspace' && placed.length) { unplace(placed.length - 1); return true; }
  });

  const el = h('div', { class: 'exb exb-order' },
    h('div', { class: 'exb-dialog-wrap' }, dialog),
    bankEl);
  paint();

  const join = arr => arr.join(' – ');
  let result = null;
  return {
    el,
    getAnswer: () => join(placed.map(k => bank[k].uk)),
    check() {
      if (result) return result;
      locked = true; off();
      const ok = placed.map((k, pos) => normalizeSentence(bank[k].uk) === normalizeSentence(lines[pos].uk));
      const correct = placed.length === lines.length && ok.every(Boolean);
      paint();
      el.classList.add('is-locked', correct ? 'is-correct' : 'is-wrong');
      [...dialog.querySelectorAll('.exb-msg:not(.is-empty)')].forEach((m, pos) => {
        m.classList.add(ok[pos] ? 'is-correct' : 'is-wrong');
        m.querySelector('.exb-msg-bubble').removeAttribute('role');
      });
      bankEl.hidden = true;
      result = {
        correct,
        score: lines.length ? ok.filter(Boolean).length / lines.length : 0,
        userAnswer: join(placed.map(k => bank[k].uk)),
        solution_uk: join(lines.map(l => l.uk)),
        solution_de: join(lines.map(l => l.de).filter(Boolean)),
      };
      if (ex.explanation_de) result.explanation_de = ex.explanation_de;
      return result;
    },
    destroy() { off(); },
  };
}
