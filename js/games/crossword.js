// Mini-Kreuzworträtsel: Hinweise deutsch/Emoji, Lösungen aus gelerntem Wortschatz, Eingabe über Buchstaben-Kacheln.
import { h, ukText, deText, icon } from '../ui/dom.js';
import { anim } from '../ui/anim.js';
import { haptic } from '../ui/haptics.js';
import { buildCrossword, toAnswer } from './crossword-gen.js';
import { uiLabel, holdLabel, uiT } from '../ui/ui-label.js';
import { uiF } from '../ui-text-g2.js';

const ALPHABET = 'абвгґдеєжзиіїйклмнопрстуфхцчшщьюя';

export function crossword(app, words, { onDone } = {}) {
  const pool = words.map(v => ({ answer: toAnswer(v.uk), uk: v.uk, de: v.de, emoji: v.emoji })).filter(w => w.answer && w.answer.length >= 2 && w.answer.length <= 9);
  const cw = buildCrossword(pool, { max: 6 });
  if (!cw || cw.slots.length < 3) return h('div', { class: 'empty' }, h('p', uiLabel(uiF('cw_need_words'))));

  const fill = new Map();          // "x,y" → Buchstabe
  const solved = new Set();
  let active = null;
  let hints = 0;

  const cellEls = new Map();
  const gridEl = h('div', { class: 'cw-grid', style: { gridTemplateColumns: `repeat(${cw.w}, 1fr)` }, role: 'grid' });
  for (let y = 0; y < cw.h; y++) for (let x = 0; x < cw.w; x++) {
    const c = cw.cells.get(`${x},${y}`);
    if (!c) { gridEl.append(h('div', { class: 'cw-cell is-void', 'aria-hidden': 'true' })); continue; }
    const num = cw.slots.find(s => s.x === x && s.y === y)?.num;
    const el = h('button', { type: 'button', class: 'cw-cell no-tap', on: { click: () => select(c.slots.find(s => s !== active) || c.slots[0]) } },
      num ? h('span', { class: 'cw-num' }, String(num)) : null, h('span', { class: 'cw-letter' }));
    cellEls.set(`${x},${y}`, el);
    gridEl.append(el);
  }

  const cellsOf = s => Array.from(s.answer, (_, i) => `${s.x + (s.dir === 'h' ? i : 0)},${s.y + (s.dir === 'v' ? i : 0)}`);

  const clueEls = new Map();
  const clueList = dir => {
    const list = cw.slots.filter(s => s.dir === dir).sort((a, b) => a.num - b.num);
    if (!list.length) return null;
    return h('section', { class: 'cw-clues' },
      h('h3', { class: 'cw-clues-h' }, uiLabel(dir === 'h' ? 'cw_across' : 'cw_down', { layout: 'inline' })),
      list.map(s => {
        const el = h('button', { type: 'button', class: 'cw-clue', on: { click: () => select(s) } },
          h('span', { class: 'cw-clue-num' }, String(s.num)),
          s.emoji ? h('span', { class: 'cw-clue-emoji', 'aria-hidden': 'true' }, s.emoji) : null,
          h('span', { class: 'cw-clue-de' }, s.de),
          h('span', { class: 'cw-clue-len' }, `(${s.answer.length})`));
        clueEls.set(s, el);
        return el;
      }));
  };

  const current = h('div', { class: 'cw-current' });
  const tiles = h('div', { class: 'cw-tiles' });
  const back = h('button', { type: 'button', class: 'cw-tile cw-back', 'aria-label': uiT('delete').de, on: { click: erase } }, '⌫');
  const hintBtn = h('button', { type: 'button', class: 'btn btn-secondary cw-hint', on: { click: hint } }, icon('bulb'), holdLabel(uiF('cw_show_letter')));

  function paint() {
    for (const [k, el] of cellEls) {
      el.querySelector('.cw-letter').textContent = fill.get(k) || '';
      const inActive = active && cellsOf(active).includes(k);
      const done = cw.cells.get(k).slots.some(s => solved.has(s));
      el.classList.toggle('is-active', !!inActive);
      el.classList.toggle('is-solved', done);
    }
    for (const [s, el] of clueEls) { el.classList.toggle('is-active', s === active); el.classList.toggle('is-solved', solved.has(s)); }
  }

  function select(s) {
    if (!s) return;
    active = s;
    const free = new Set(Array.from(s.answer));
    const extra = ALPHABET.split('').filter(l => !free.has(l)).sort(() => Math.random() - 0.5).slice(0, Math.max(3, 8 - free.size));
    tiles.replaceChildren(...[...free, ...extra].sort(() => Math.random() - 0.5)
      .map(l => h('button', { type: 'button', class: 'cw-tile no-tap', on: { click: () => type(l) } }, l)), back);
    current.replaceChildren(...[h('span', { class: 'cw-clue-num' }, String(s.num)), s.emoji ? h('span', { class: 'cw-clue-emoji' }, s.emoji) : null, deText(s.de)].filter(Boolean));
    paint();
  }

  function type(l) {
    if (!active || solved.has(active)) return;
    const k = cellsOf(active).find(k => !fill.get(k));
    if (!k) return;
    fill.set(k, l);
    haptic('select');
    paint();
    checkSlot(active);
  }
  function erase() {
    if (!active || solved.has(active)) return;
    const ks = cellsOf(active).filter(k => fill.get(k) && !cw.cells.get(k).slots.some(s => solved.has(s)));
    if (ks.length) { fill.delete(ks[ks.length - 1]); paint(); }
  }
  function hint() {
    if (!active || solved.has(active)) return;
    const k = cellsOf(active).find(k => fill.get(k) !== cw.cells.get(k).letter);
    if (!k) return;
    fill.set(k, cw.cells.get(k).letter);
    hints++;
    paint();
    checkSlot(active);
  }

  function checkSlot(s) {
    const ks = cellsOf(s);
    if (ks.some(k => !fill.get(k))) return;
    const ok = ks.every(k => fill.get(k) === cw.cells.get(k).letter);
    const els = ks.map(k => cellEls.get(k));
    if (ok) {
      solved.add(s);
      haptic('success');
      els.forEach(el => anim.correct(el, { sparks: false }));
      // gekreuzte Wörter könnten nun auch vollständig sein
      for (const o of cw.slots) if (!solved.has(o) && o !== s) checkSlot(o);
      paint();
      if (solved.size === cw.slots.length) finish();
      else if (active === s) select(cw.slots.find(o => !solved.has(o)));
    } else if (s === active) {
      haptic('error');
      els.forEach(el => { el.classList.add('is-wrong'); anim.wrong(el); setTimeout(() => el.classList.remove('is-wrong'), 900); });
    }
  }

  const doneBox = h('div', { class: 'cw-done', hidden: true });
  function finish() {
    tiles.replaceChildren();
    current.replaceChildren();
    hintBtn.hidden = true;
    doneBox.hidden = false;
    doneBox.replaceChildren(
      h('div', { class: 'cw-done-title' }, uiLabel('well_done', { layout: 'inline' })),
      h('ul', { class: 'cw-solution' }, cw.slots.sort((a, b) => a.num - b.num).map(s => h('li', ukText(s.uk), ' – ', deText(s.de)))),
      hints ? h('p', uiLabel(uiF('cw_hints_used', { n: hints }), { layout: 'inline' })) : null);
    onDone?.({ words: cw.slots.length, hints });
  }

  const el = h('div', { class: 'cw' }, gridEl, current, tiles, hintBtn, doneBox, clueList('h'), clueList('v'));
  select(cw.slots.slice().sort((a, b) => a.num - b.num)[0]);
  return el;
}
