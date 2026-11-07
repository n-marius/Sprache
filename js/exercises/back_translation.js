// Aufgabentyp „back_translation“ (stille Rückübersetzung): Zeilen des Leittexts erscheinen auf Deutsch und werden
// mit Wortkacheln ins Ukrainische zurückgebaut; danach Vergleich mit dem Original. Selbstprüfend, Zeile für Zeile.
// ex: { title_uk, lines:[{who, uk, de}], context:{who, uk}|null, distractors:[uk-Wörter] }
import { h, ukText, deText, icon } from './common.js';
import { tokenize, normalizeSentence } from '../lib/uk-text.js';
import { anim } from '../ui/anim.js';
import { haptic } from '../ui/haptics.js';

export const selfChecking = true;
export const instructionKey = () => 'back_translation';

const tokensOf = uk => tokenize(uk).filter(p => p.word).map(p => p.text);

export function render(ex, ctx) {
  const lines = ex.lines || [];
  let idx = 0, right = 0, alive = true;
  const wrong = [];
  const log = h('div', { class: 'bt-log' });
  if (ex.context) log.append(lineView(ex.context, 'is-context'));
  const work = h('div', { class: 'bt-work' });
  const el = h('div', { class: 'bt' },
    ex.title_uk ? h('div', { class: 'bt-title' }, ukText(ex.title_uk), deText(' – Rückübersetzung', { cls: 'bt-title-de' })) : null,
    log, work);

  function lineView(l, cls = '') {
    return h('div', { class: ['bt-line', cls] }, l.who ? h('span', { class: 'bt-who' }, ukText(l.who, { tap: false }), ': ') : null, ukText(l.uk));
  }

  function show() {
    const l = lines[idx];
    const target = tokensOf(l.uk);
    const pool = ctx.shuffle([...target, ...(ex.distractors || []).filter(d => !target.includes(d)).slice(0, 2)]);
    const answer = [];
    const row = h('div', { class: 'bt-answer', role: 'list' });
    const bank = h('div', { class: 'bt-bank' });
    const checkBtn = h('button', { type: 'button', class: 'btn btn-blue btn-block', disabled: true, on: { click: check } }, 'Vergleichen');
    const tileEls = pool.map((wd, i) => h('button', { type: 'button', class: 'chip bt-tile', on: { click: () => take(i) } }, wd));
    bank.append(...tileEls);
    function take(i) {
      if (tileEls[i].classList.contains('is-used')) return;
      tileEls[i].classList.add('is-used');
      answer.push(i);
      haptic('select');
      paint();
    }
    function drop(pos) { const i = answer.splice(pos, 1)[0]; tileEls[i].classList.remove('is-used'); paint(); }
    function paint() {
      row.replaceChildren(...answer.map((i, pos) => h('button', { type: 'button', class: 'chip bt-tile is-placed', on: { click: () => drop(pos) } }, pool[i])));
      checkBtn.disabled = !answer.length;
    }
    function check() {
      const built = answer.map(i => pool[i]).join(' ');
      const ok = normalizeSentence(built) === normalizeSentence(l.uk);
      if (ok) right++; else wrong.push(l.uk);
      haptic(ok ? 'success' : 'error');
      const v = lineView(l, ok ? 'is-ok' : 'is-bad');
      if (!ok) v.append(h('div', { class: 'bt-yours' }, deText('Deine Version: '), ukText(built, { tap: false })));
      log.append(v);
      ok ? anim.correct(v, { sparks: false }) : anim.wrong(v);
      idx++;
      if (idx < lines.length) show();
      else finish();
    }
    work.replaceChildren(
      h('div', { class: 'bt-de' }, l.who ? h('span', { class: 'bt-who' }, ukText(l.who, { tap: false }), ': ') : null, deText(l.de)),
      row, bank, checkBtn);
  }

  function finish() {
    work.replaceChildren(h('div', { class: ['bt-done', wrong.length ? 'is-bad' : 'is-ok'] }, icon(wrong.length ? 'bulb' : 'check'),
      deText(wrong.length ? `${right} von ${lines.length} Zeilen genau getroffen. Vergleiche die markierten Zeilen mit dem Original.` : 'Alle Zeilen genau wie im Original.')));
    setTimeout(() => alive && ctx.complete({
      correct: !wrong.length,
      score: lines.length ? right / lines.length : 1,
      userAnswer: `${right} / ${lines.length} Zeilen`,
      explanation_de: wrong.length ? `Original: ${wrong.join(' · ')}` : undefined,
    }), 600);
  }

  show();
  return { el, getAnswer: () => `${right} / ${lines.length}`, destroy() { alive = false; } };
}
