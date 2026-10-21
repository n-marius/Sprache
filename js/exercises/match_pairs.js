// Paare zuordnen: links Ukrainisch, rechts Deutsch (je gemischt). Selbstprüfend über ctx.complete().
import { h, ukText, keyHandler, digitOf } from './common.js';
import { normalizeWord } from '../lib/uk-text.js';
import { haptic } from '../ui/haptics.js';
import { anim } from '../ui/anim.js';

export const selfChecking = true;
export function instructionKey() { return 'match_pairs'; }

const keyUk = s => String(s ?? '').split(/\s+/).map(normalizeWord).join(' ');
const keyDe = s => String(s ?? '').trim().toLowerCase();

export function render(ex, ctx) {
  const pairs = (ex.pairs || []).map((p, i) => ({ uk: String(p.uk ?? ''), de: String(p.de ?? ''), i }));
  const left = ctx.shuffle(pairs);
  const right = ctx.shuffle(pairs);
  let selL = -1, selR = -1, errors = 0, matched = 0, busy = false, done = false;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); };

  const tile = (content, onClick, key, lang) => h('button', {
    type: 'button', class: ['option', 'exb-tile', `is-${lang}`], on: { click: onClick },
  }, key ? h('span', { class: 'option-key exb-tile-key', 'aria-hidden': 'true' }, key) : null,
  h('span', { class: 'exb-tile-label' }, content));

  const lBtns = left.map((p, k) => tile(ukText(p.uk, { tap: false }), () => tapL(k), String(k + 1), 'uk'));
  const rBtns = right.map((p, k) => tile(h('span', { lang: 'de' }, p.de), () => tapR(k), String.fromCharCode(97 + k), 'de'));

  const el = h('div', { class: 'exb exb-match' },
    h('div', { class: 'exb-match-col', role: 'group', 'aria-label': 'Ukrainisch' }, lBtns),
    h('div', { class: 'exb-match-col', role: 'group', 'aria-label': 'Deutsch' }, rBtns));

  const isDone = b => b.classList.contains('is-matched') || b.classList.contains('is-correct');

  function mark() {
    lBtns.forEach((b, k) => b.classList.toggle('is-selected', k === selL));
    rBtns.forEach((b, k) => b.classList.toggle('is-selected', k === selR));
  }

  function tapL(k) {
    if (busy || done || isDone(lBtns[k])) return;
    selL = selL === k ? -1 : k;
    haptic('select');
    if (selL >= 0 && !ctx.listenOff && ctx.settings?.autoplay !== false) ctx.app?.tts?.speak?.(left[k].uk)?.catch?.(() => {});
    mark(); tryMatch();
  }
  function tapR(k) {
    if (busy || done || isDone(rBtns[k])) return;
    selR = selR === k ? -1 : k;
    haptic('select');
    mark(); tryMatch();
  }

  function tryMatch() {
    if (selL < 0 || selR < 0) return;
    const L = left[selL], R = right[selR];
    const ok = L.i === R.i || keyDe(pairs[L.i].de) === keyDe(R.de) || keyUk(L.uk) === keyUk(pairs[R.i].uk);
    const bl = lBtns[selL], br = rBtns[selR];
    selL = selR = -1;
    bl.classList.remove('is-selected'); br.classList.remove('is-selected');
    if (ok) {
      bl.classList.add('is-correct'); br.classList.add('is-correct');
      haptic('success');
      anim.correct(bl, { sparks: false }); anim.correct(br, { sparks: false });
      matched++;
      later(() => {
        for (const b of [bl, br]) { b.classList.remove('is-correct'); b.classList.add('is-matched', 'is-disabled'); b.disabled = true; }
        if (matched === pairs.length) finish();
      }, 520);
    } else {
      errors++;
      busy = true;
      bl.classList.add('is-wrong'); br.classList.add('is-wrong');
      haptic('error');
      anim.wrong(bl); anim.wrong(br);
      later(() => { bl.classList.remove('is-wrong'); br.classList.remove('is-wrong'); busy = false; }, 650);
    }
  }

  function finish() {
    if (done) return;
    done = true; off();
    el.classList.add('is-done');
    const n = pairs.length;
    ctx.complete({
      correct: errors <= 1,
      score: n ? n / (n + errors) : 1,
      userAnswer: `Fehler: ${errors}`,
      solution_uk: pairs.map(p => p.uk).join(', '),
      solution_de: pairs.map(p => p.de).join(', '),
    });
  }

  // iPad-Tastatur: 1–n links, a–… rechts
  const off = keyHandler(e => {
    if (done) return;
    const n = digitOf(e);
    if (n && n <= lBtns.length) { tapL(n - 1); return true; }
    const c = e.key.length === 1 ? e.key.toLowerCase().charCodeAt(0) - 97 : -1;
    if (c >= 0 && c < rBtns.length) { tapR(c); return true; }
  });

  ctx.setReady(false);
  return {
    el,
    getAnswer: () => `Fehler: ${errors}`,
    destroy() { off(); timers.forEach(clearTimeout); timers.clear(); },
  };
}
