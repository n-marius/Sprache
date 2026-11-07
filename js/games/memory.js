// Paare-Memory: Karten verdeckt, je zwei aufdecken. Paare: Wort ↔ Bedeutung oder Form ↔ Form (z. B. du ↔ Sie).
// pairs: [{a, b, aLang:'uk'|'de', bLang}]
import { h, ukText, deText } from '../ui/dom.js';
import { anim } from '../ui/anim.js';
import { haptic } from '../ui/haptics.js';
import { uiLabel } from '../ui/ui-label.js';
import { uiF, pluralUk } from '../ui-text-g2.js';

export function memory(app, pairs, { onDone } = {}) {
  const cards = pairs.flatMap((p, i) => [
    { pair: i, text: p.a, lang: p.aLang || 'uk', tag: p.aTag },
    { pair: i, text: p.b, lang: p.bLang || 'de', tag: p.bTag },
  ]).sort(() => Math.random() - 0.5);
  let open = [], found = 0, moves = 0, busy = false;

  const els = cards.map((c, i) => {
    const face = h('div', { class: 'mm-face' },
      c.tag ? h('span', { class: 'mm-tag' }, c.tag) : null,
      c.lang === 'uk' ? ukText(c.text, { tap: false }) : deText(c.text));
    return h('button', { type: 'button', class: 'mm-card no-tap', 'aria-label': 'Karte', on: { click: () => flip(i) } },
      h('div', { class: 'mm-back', 'aria-hidden': 'true' }, '?'), face);
  });
  const status = h('div', { class: 'mm-status t-foot' });
  const doneBox = h('div', { class: 'mm-done', hidden: true });
  const upd = () => { status.replaceChildren(uiLabel(uiF('mm_status', { f: found, n: pairs.length, P: pluralUk(pairs.length, 'pair'), m: moves, M: pluralUk(moves, 'move') }), { layout: 'inline' })); };

  function flip(i) {
    const el = els[i];
    if (busy || el.classList.contains('is-open') || el.classList.contains('is-found')) return;
    el.classList.add('is-open');
    haptic('select');
    open.push(i);
    if (open.length < 2) return;
    moves++;
    const [a, b] = open;
    open = [];
    if (cards[a].pair === cards[b].pair && a !== b) {
      found++;
      [a, b].forEach(k => { els[k].classList.add('is-found'); anim.correct(els[k], { sparks: false }); });
      haptic('success');
      upd();
      if (found === pairs.length) finish();
    } else {
      busy = true;
      [a, b].forEach(k => els[k].classList.add('is-miss'));
      setTimeout(() => { [a, b].forEach(k => els[k].classList.remove('is-open', 'is-miss')); busy = false; }, 1100);
      upd();
    }
  }
  function finish() {
    doneBox.hidden = false;
    doneBox.replaceChildren(h('div', { class: 'cw-done-title' }, uiLabel('well_done', { layout: 'inline' }), ' · ', uiLabel(uiF('mm_moves', { m: moves, M: pluralUk(moves, 'move') }), { layout: 'inline' })),
      h('ul', { class: 'cw-solution' }, pairs.map(p => h('li',
        p.aLang === 'de' ? deText(p.a) : ukText(p.a), ' – ', p.bLang === 'uk' ? ukText(p.b) : deText(p.b)))));
    onDone?.({ moves, pairs: pairs.length });
  }
  upd();
  return h('div', { class: 'mm' }, status, h('div', { class: 'mm-grid' }, els), doneBox);
}
