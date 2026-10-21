// Animationen für „Мова“ – nur CSS + Web Animations API + Inline-SVG, keine Libraries.
/*
 * ============================================================================================
 *  API (import { anim } from './ui/anim.js')
 * ============================================================================================
 *  Alle Funktionen sind sicher: el/container dürfen null sein, es wird nie geworfen, jede
 *  Funktion gibt ein Promise zurück, das IMMER auflöst (auch bei Abbruch / Hintergrund-Tab).
 *  Bewegung wird nur über transform/opacity animiert (Ausnahme: SVG-stroke-dashoffset beim
 *  Ring des Abzeichens). prefers-reduced-motion: reduce ODER <html data-motion="reduce">
 *  → keine Bewegung, nur Endzustand bzw. kurzes Opacity-Fade.
 *
 *  anim.reduced                          → boolean (getter)
 *  anim.viewIn(el)                       → Promise  Routenwechsel (vom Router aufgerufen): Fade + 8px
 *                                                    hoch, 220ms. body.is-fullscreen: nur Fade (kein
 *                                                    transform, damit position:fixed-Kinder nicht springen).
 *  anim.correct(el, {sparks=true})       → Promise  Scale 1→1.03→1 + grüner Ring-Glow (+ 6 Funken).
 *  anim.wrong(el)                        → Promise  sanftes Schütteln (±6px, 3 Zyklen, 320ms).
 *  anim.pop(el)                          → Promise  Mini-Pop für platzierte Chips/Wortbausteine.
 *  anim.feedbackIn(el)                   → Promise  Feedback-Leiste fährt von unten hoch (Feder).
 *  anim.feedbackOut(el)                  → Promise  Gegenstück (fährt nach unten weg; el bleibt im DOM).
 *  anim.progress(fillEl, fraction)       → Promise  setzt --p (0..1 → "0%".."100%") auf .progress-fill
 *                                                    (oder .progress → sucht .progress-fill); wächst über
 *                                                    die vorhandene CSS-Transition, Glanz-Sweep bei Zunahme.
 *  anim.ring(svgOrCircle, fraction)      → Promise  setzt .ring-value (stroke-dashoffset) weich.
 *  anim.countUp(el, to, {duration=700, from, format, decimals=0})
 *                                        → Promise  zählt hoch (tabular-nums). format: 'percent'
 *                                                    (to = 0..100 → „85 %“), 'int' (Standard, de-DE)
 *                                                    oder (n) => string.
 *  anim.streak(el, {ignite=false})       → Promise  Flamme flackert (ignite: zündet aus scale 0) + Glut.
 *  anim.celebrate(container, theme, {keepBadge=false})
 *                                        → Promise  Lektionsabschluss (~1.9s): Abzeichen (Glyph im Kreis,
 *                                                    Ring schließt sich) + thematische Partikel (≤40),
 *                                                    pointer-events:none, räumt danach auf. container =
 *                                                    Element (wird bei position:static kurz relativ gesetzt)
 *                                                    oder document.body/null → Vollbild-Overlay (fixed).
 *                                                    keepBadge: Abzeichen bleibt stehen (Partikel weg).
 *  anim.badge(theme, {size=96, closed=true}) → HTMLElement  statisches Abzeichen (.anim-badge) z. B. für
 *                                                    Zusammenfassung/Lektionskopf.
 *  anim.checkmark({size=56})             → SVGElement  .anim-draw-check (zeichnet sich selbst).
 *  anim.themeGlyph(theme)                → Emoji je Theme (Fallback ⭐)
 *  anim.themeColor(theme)                → CSS-Farbe, z. B. 'var(--orange)' (Fallback 'var(--green)')
 *  anim.themes                           → Array aller 23 Theme-IDs
 *
 * ============================================================================================
 *  CSS-Utilities (css/animations.css) – alle respektieren reduced motion
 * ============================================================================================
 *  .anim-pulse-ring   pulsierender Ring (::after) um den aktuellen Lernpfad-Knoten.
 *                     Farbe: --pulse-color (Standard var(--green)). Braucht position ≠ static
 *                     (setzt selbst position:relative mit Spezifität 0 – eigenes absolute gewinnt).
 *                     ::after des Elements wird belegt.
 *  .anim-float        sanftes Schweben (±4px, 3.2s). --float-dist, --float-delay.
 *  .anim-shimmer      Glanz-Sweep über beliebigem Element (::after, overflow:hidden).
 *  .anim-skeleton     Platzhalter-Block (Fläche + Shimmer). z. B. <div class="anim-skeleton" style="height:20px"></div>
 *  .anim-typing       Tipp-Indikator (Chat):  <span class="anim-typing" aria-label="schreibt …"><i></i><i></i><i></i></span>
 *                     Farbe = currentColor.
 *  .anim-wave         Schallwellen/Equalizer während Wiedergabe (scaleY, currentColor):
 *                     <span class="anim-wave" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
 *                     Nur während der Wiedergabe einfügen oder .is-paused setzen (friert ein).
 *  .anim-speaking     auf den Lautsprecher-Button (oder svg.icon-speaker): Schallbögen des Icons
 *                     pulsieren + weicher Ring ums Element, solange die Klasse gesetzt ist.
 *  .anim-draw-check   Erfolgshäkchen, zeichnet Kreis, dann Haken (am besten anim.checkmark()):
 *                     <svg class="anim-draw-check" viewBox="0 0 52 52" aria-hidden="true">
 *                       <circle class="c" cx="26" cy="26" r="23"/><path class="k" d="M15 27.5l7 7 15-15"/></svg>
 *                     Farbe: --check-color (Standard var(--green)).
 *  .anim-badge        Theme-Abzeichen (von anim.badge()/celebrate() erzeugt), Farbe --theme-c.
 * ============================================================================================
 */

const SVGNS = 'http://www.w3.org/2000/svg';
const hasDOM = () => typeof document !== 'undefined' && typeof window !== 'undefined';
const done = () => Promise.resolve();

function isReduced() {
  if (!hasDOM()) return true;
  try {
    if (document.documentElement?.dataset?.motion === 'reduce') return true;
    return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  } catch { return false; }
}

const isEl = el => !!el && typeof el === 'object' && el.nodeType === 1;
const canAnimate = el => isEl(el) && typeof el.animate === 'function';
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp01 = x => Math.max(0, Math.min(1, Number(x) || 0));

// composite:'add' (wo unterstützt) → bestehende transforms des Elements bleiben erhalten.
let compositeOK = null;
function supportsComposite() {
  if (compositeOK !== null) return compositeOK;
  try {
    const d = document.createElement('div');
    const a = d.animate([{ opacity: 1 }, { opacity: 1 }], { duration: 1, composite: 'add' });
    compositeOK = a.effect?.composite === 'add';
    a.cancel();
  } catch { compositeOK = false; }
  return compositeOK;
}

/** Startet eine WAAPI-Animation; Promise löst immer auf (finish, cancel oder Timeout-Sicherung). */
function play(el, frames, opts = {}) {
  if (!canAnimate(el)) return done();
  try {
    const o = { fill: 'none', ...opts };
    if (o.composite === 'add' && !supportsComposite()) delete o.composite;
    const a = el.animate(frames, o);
    const iters = Number.isFinite(o.iterations) ? o.iterations : 1;
    const total = (o.delay || 0) + (o.duration || 0) * iters + 250;
    return new Promise(res => {
      let fin = false;
      const end = () => { if (!fin) { fin = true; res(a); } };
      a.finished.then(end, end);
      setTimeout(end, total);
    });
  } catch { return done(); }
}

// Pro Element & Schlüssel nur eine laufende Animation (wiederholtes Tippen stapelt nicht).
const running = new WeakMap();
function exclusive(el, key, start) {
  if (!isEl(el)) return done();
  let m = running.get(el);
  if (!m) { m = {}; running.set(el, m); }
  try { m[key]?.cancel?.(); } catch {}
  const p = start();
  p.then(a => { if (m[key] === a) delete m[key]; });
  // Animation-Objekt merken, sobald es existiert (el.getAnimations ist synchron verfügbar)
  try { const list = el.getAnimations?.(); if (list?.length) m[key] = list[list.length - 1]; } catch {}
  return p.then(() => undefined);
}

// ---------- Fixed-Layer für Glow/Funken/Glut (über dem Inhalt, ohne Layout-Einfluss) ----------
let layerEl = null;
function layer() {
  if (!hasDOM()) return null;
  if (layerEl && layerEl.isConnected) return layerEl;
  layerEl = document.createElement('div');
  layerEl.className = 'anim-layer';
  layerEl.setAttribute('aria-hidden', 'true');
  document.body.append(layerEl);
  return layerEl;
}

function node(cls, style = {}, html) {
  const d = document.createElement('div');
  d.className = cls;
  Object.assign(d.style, style);
  if (html != null) d.innerHTML = html; // nur statische, vertrauenswürdige Inhalte
  return d;
}

function rectOf(el) {
  try {
    const r = el.getBoundingClientRect();
    if (!r || (!r.width && !r.height)) return null;
    return r;
  } catch { return null; }
}

// ============================================================================================
//  Themes
// ============================================================================================
const PAL = {
  ua: ['var(--ua-blue)', 'var(--ua-yellow)', 'var(--blue)', 'var(--yellow)'],
  warm: ['var(--orange)', 'var(--yellow)', 'var(--red)', 'var(--pink)'],
  cool: ['var(--blue)', 'var(--purple)', 'var(--green)', 'var(--yellow)'],
  rainbow: ['var(--red)', 'var(--orange)', 'var(--yellow)', 'var(--green)', 'var(--blue)', 'var(--purple)'],
  green: ['var(--green)', 'var(--yellow)', 'var(--blue)'],
  love: ['var(--pink)', 'var(--red)', 'var(--orange)', 'var(--yellow)'],
  coffee: ['#8B5A2B', '#B5793F', '#D9A066', 'var(--orange)'],
};

const COFFEE = '#A0683A';

const SVG = {
  bean: c => `<svg viewBox="0 0 20 26" width="100%" height="100%"><ellipse cx="10" cy="13" rx="8.5" ry="11.5" fill="${c}"/><path d="M10 3c-3 4 3 8 0 20" stroke="rgba(0,0,0,.35)" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
  heart: c => `<svg viewBox="0 0 24 22" width="100%" height="100%"><path d="M12 21s-9-5.6-9-12.2A5 5 0 0 1 12 5.6a5 5 0 0 1 9 3.2C21 15.4 12 21 12 21z" fill="${c}"/></svg>`,
  plus: c => `<svg viewBox="0 0 20 20" width="100%" height="100%"><path d="M7 1h6v6h6v6h-6v6H7v-6H1V7h6z" fill="${c}"/></svg>`,
  drop: c => `<svg viewBox="0 0 16 22" width="100%" height="100%"><path d="M8 1C5 6 1.5 9.5 1.5 14a6.5 6.5 0 0 0 13 0C14.5 9.5 11 6 8 1z" fill="${c}"/></svg>`,
  plane: `<svg viewBox="0 0 48 32" width="100%" height="100%"><path d="M2 15 46 2 30 30 22 19z" fill="#fff" stroke="#9AA6B8" stroke-width="1.6" stroke-linejoin="round"/><path d="M46 2 22 19l-2 9 6-6" fill="#DCE3EE" stroke="#9AA6B8" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
  steam: `<svg viewBox="0 0 20 60" width="100%" height="100%"><path d="M10 58c-7-8 7-14 0-22s7-14 0-22S13 4 10 2" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>`,
  rays: c => `<svg viewBox="0 0 200 200" width="100%" height="100%">${Array.from({ length: 12 }, (_, i) =>
    `<rect x="96" y="6" width="8" height="34" rx="4" fill="${c}" transform="rotate(${i * 30} 100 100)"/>`).join('')}</svg>`,
  ecg: c => `<svg viewBox="0 0 200 60" width="100%" height="100%"><path class="anim-ecg-line" d="M0 32h58l8-14 10 30 12-44 10 40 8-12h94" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/></svg>`,
  sheet: `<svg viewBox="0 0 22 28" width="100%" height="100%"><rect x="1" y="1" width="20" height="26" rx="2.5" fill="#fff" stroke="#B9C2CF" stroke-width="1.4"/><path d="M5 8h12M5 12h12M5 16h9M5 20h11" stroke="#C9D1DC" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  window: c => `<svg viewBox="0 0 10 12" width="100%" height="100%"><rect x="0" y="0" width="10" height="12" rx="1.5" fill="${c}"/></svg>`,
};

/*
 * fx-Einträge: [effektName, optionen]. Effekte siehe FX unten. Budget: max. 40 Partikel gesamt.
 * motion: Bewegung des Glyphs im Abzeichen.
 */
const THEMES = {
  greetings: { glyph: '👋', color: 'var(--blue)', palette: PAL.ua, motion: 'wave',
    fx: [['confetti', { n: 18 }], ['burst', { items: ['💬', '🙂', '✨'], n: 6 }], ['ripple', { n: 2 }]] },
  people: { glyph: '🧑‍🤝‍🧑', color: 'var(--purple)', palette: PAL.cool, motion: 'bob',
    fx: [['burst', { items: ['🙂', '😊', '🙋', '🙋‍♂️', '👍'], n: 9 }], ['confetti', { n: 12 }], ['ripple', { n: 2 }]] },
  family: { glyph: '👨‍👩‍👧', color: 'var(--pink)', palette: PAL.love, motion: 'beat',
    fx: [['rise', { svg: 'heart', n: 14, size: [14, 26], from: 'badge' }], ['confetti', { n: 10 }], ['ripple', { n: 2 }]] },
  home: { glyph: '🏠', color: 'var(--orange)', palette: PAL.warm, motion: 'bob',
    fx: [['puff', { n: 5 }], ['twinkle', { items: ['✨'], n: 7 }], ['burst', { items: ['🔑', '🛋️', '🪴', '🛏️'], n: 6 }], ['confetti', { n: 10 }]] },
  food: { glyph: '🥟', color: 'var(--orange)', palette: PAL.warm, motion: 'bob',
    fx: [['steam', { n: 3 }], ['burst', { items: ['🍎', '🥕', '🧀', '🥖', '🍅', '🥔', '🍒'], n: 10 }], ['confetti', { n: 12 }]] },
  cafe: { glyph: '☕', color: COFFEE, palette: PAL.coffee, motion: 'bob',
    fx: [['steam', { n: 3 }], ['beans', { n: 12 }], ['burst', { items: ['🥐', '🍰', '🫖'], n: 4 }], ['confetti', { n: 8 }]] },
  city: { glyph: '🏙️', color: 'var(--blue)', palette: PAL.cool, motion: 'bob',
    fx: [['windows', { n: 14 }], ['burst', { items: ['🌳', '🚦', '⛪', '🏛️'], n: 6 }], ['confetti', { n: 10 }], ['ripple', { n: 1 }]] },
  transport: { glyph: '🚋', color: 'var(--green)', palette: PAL.green, motion: 'drive',
    fx: [['fly', { content: '🚌', path: 'lane', size: 40 }], ['fly', { content: '🚲', path: 'lane2', size: 34, delay: 380 }],
      ['speedlines', { n: 6 }], ['confetti', { n: 12 }], ['ripple', { n: 1 }]] },
  time: { glyph: '⏰', color: 'var(--blue)', palette: PAL.cool, motion: 'tick',
    fx: [['ticks', { n: 12 }], ['burst', { items: ['⏳', '🕐', '🕒', '🕘'], n: 5 }], ['confetti', { n: 12 }]] },
  numbers: { glyph: '🔢', color: 'var(--purple)', palette: PAL.rainbow, motion: 'bob',
    fx: [['rise', { text: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '+', '='], n: 20, size: [20, 34], from: 'bottom' }],
      ['confetti', { n: 10 }], ['ripple', { n: 1 }]] },
  shopping: { glyph: '🛒', color: 'var(--green)', palette: PAL.green, motion: 'drive',
    fx: [['converge', { items: ['🍞', '🥛', '🍎', '🧀', '🥚', '🍌', '🛍️', '🧃'], n: 9 }], ['confetti', { n: 14 }], ['ripple', { n: 2 }]] },
  work: { glyph: '💼', color: 'var(--blue)', palette: PAL.cool, motion: 'bob',
    fx: [['burst', { items: ['📎', '✏️', '📊', '💻', '📅', '☕'], n: 9 }], ['confetti', { n: 14 }], ['ripple', { n: 2 }]] },
  law: { glyph: '⚖️', color: 'var(--ua-blue)', palette: ['var(--ua-blue)', 'var(--ua-yellow)', 'var(--yellow)', 'var(--blue)'], motion: 'sway',
    fx: [['burst', { items: ['📜', '🏛️', '🖋️', '🔏'], n: 6 }], ['confetti', { n: 16 }], ['ripple', { n: 2 }]] },
  body: { glyph: '💪', color: 'var(--orange)', palette: PAL.warm, motion: 'beat',
    fx: [['burst', { items: ['👁️', '👂', '👃', '✋', '🦶', '👄', '🫀'], n: 10 }], ['confetti', { n: 12 }], ['ripple', { n: 2 }]] },
  weather: { glyph: '⛅', color: 'var(--yellow)', palette: ['var(--yellow)', 'var(--orange)', 'var(--blue)', '#9EC9F5'], motion: 'bob',
    fx: [['rays', {}], ['clouds', { n: 3 }], ['fall', { svg: 'drop', n: 8, size: [8, 13], colors: ['var(--blue)', '#7CC3F7'] }],
      ['burst', { items: ['❄️', '🌈', '☀️'], n: 3 }], ['confetti', { n: 8 }]] },
  hobby: { glyph: '🎸', color: 'var(--pink)', palette: PAL.rainbow, motion: 'sway',
    fx: [['rise', { text: ['🎵', '🎶', '🎵'], n: 8, size: [20, 30], from: 'badge', emoji: true }],
      ['burst', { items: ['⚽', '🎨', '📷', '📚', '🎮', '🧶'], n: 8 }], ['confetti', { n: 12 }]] },
  travel: { glyph: '✈️', color: 'var(--blue)', palette: PAL.cool, motion: 'bob',
    fx: [['plane', {}], ['clouds', { n: 3 }], ['burst', { items: ['🧳', '🗺️', '🏔️', '🏖️', '📍'], n: 7 }], ['confetti', { n: 12 }]] },
  school: { glyph: '📚', color: 'var(--yellow)', palette: PAL.ua, motion: 'bob',
    fx: [['rise', { text: ['А', 'Б', 'В', 'Г', 'Ґ', 'Д', 'Є', 'Ж', 'Ї', 'Й', 'Я', 'Ш'], n: 16, size: [20, 32], from: 'bottom' }],
      ['burst', { items: ['✏️', '📐', '🎒', '📝'], n: 5 }], ['confetti', { n: 10 }]] },
  colors: { glyph: '🌈', color: 'var(--purple)', palette: PAL.rainbow, motion: 'bob',
    fx: [['splats', { n: 14 }], ['confetti', { n: 18 }], ['ripple', { n: 2 }]] },
  clothes: { glyph: '👕', color: 'var(--pink)', palette: ['var(--pink)', 'var(--blue)', 'var(--yellow)', 'var(--purple)'], motion: 'sway',
    fx: [['fall', { items: ['👗', '👟', '🧣', '🧢', '👖', '🧤', '👚'], n: 9, size: [22, 30] }], ['confetti', { n: 14 }], ['ripple', { n: 1 }]] },
  health: { glyph: '🩺', color: 'var(--red)', palette: ['var(--red)', 'var(--green)', 'var(--pink)', 'var(--blue)'], motion: 'beat',
    fx: [['ecg', {}], ['rise', { svg: 'plus', n: 10, size: [10, 18], from: 'badge', colors: ['var(--green)', 'var(--red)'] }],
      ['rise', { svg: 'heart', n: 5, size: [12, 18], from: 'badge', colors: ['var(--red)', 'var(--pink)'] }], ['confetti', { n: 8 }]] },
  calendar: { glyph: '📅', color: 'var(--red)', palette: PAL.warm, motion: 'bob',
    fx: [['days', { labels: ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'НД'] }], ['confetti', { n: 16 }], ['ripple', { n: 2 }]] },
  office: { glyph: '🗂️', color: 'var(--ua-blue)', palette: ['var(--ua-blue)', 'var(--blue)', 'var(--yellow)', 'var(--green)'], motion: 'bob',
    fx: [['sheets', { n: 7 }], ['burst', { items: ['📎', '✉️', '🖇️', '🗃️', '✅'], n: 7 }], ['confetti', { n: 12 }]] },
};
const FALLBACK = { glyph: '⭐', color: 'var(--green)', palette: PAL.rainbow, motion: 'bob',
  fx: [['confetti', { n: 20 }], ['burst', { items: ['✨', '⭐'], n: 8 }], ['ripple', { n: 2 }]] };
const themeOf = t => THEMES[t] || FALLBACK;

// ============================================================================================
//  Partikel-Effekte (ctx: {ov, w, h, cx, cy, R, pal, take(n)})
// ============================================================================================
function part(ctx, x, y, size, { html, text, cls = '', color, style = {} } = {}) {
  const d = node(`anim-p ${cls}`, {
    left: `${x - size / 2}px`, top: `${y - size / 2}px`, width: `${size}px`, height: `${size}px`,
    fontSize: `${Math.round(size * 0.9)}px`, ...(color ? { color } : {}), ...style,
  }, html);
  if (text != null) d.textContent = text;
  ctx.ov.append(d);
  return d;
}

const FX = {
  confetti(ctx, { n = 14 }) {
    n = ctx.take(n);
    const ps = [];
    for (let i = 0; i < n; i++) {
      const c = pick(ctx.pal);
      const round = Math.random() < 0.35;
      const w = round ? rand(6, 9) : rand(6, 9), hgt = round ? w : rand(10, 15);
      const d = part(ctx, ctx.cx, ctx.cy, 1, { cls: 'anim-confetti', style: { width: `${w}px`, height: `${hgt}px`, background: c, borderRadius: round ? '50%' : '2px' } });
      const ang = rand(-Math.PI * 0.95, -Math.PI * 0.05); // nach oben gefächert
      const dist = rand(ctx.R * 1.3, Math.min(ctx.w, ctx.h) * 0.48);
      const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist;
      const fallY = dy + rand(ctx.h * 0.18, ctx.h * 0.34);
      const rot = rand(-540, 540), dur = rand(1300, 1750);
      ps.push(play(d, [
        { transform: 'translate(0,0) rotate(0) scale(.4)', opacity: 0 },
        { transform: `translate(${dx * 0.92}px,${dy * 0.92}px) rotate(${rot * 0.3}deg) scale(1)`, opacity: 1, offset: 0.28 },
        { transform: `translate(${dx}px,${dy}px) rotate(${rot * 0.45}deg) scale(1)`, opacity: 1, offset: 0.38, easing: 'cubic-bezier(.4,0,.8,.6)' },
        { transform: `translate(${dx + rand(-24, 24)}px,${fallY}px) rotate(${rot}deg) scale(.9)`, opacity: 0 },
      ], { duration: dur, delay: rand(60, 260), easing: 'cubic-bezier(.15,.7,.3,1)' }));
    }
    return ps;
  },

  burst(ctx, { items, n = 8 }) {
    n = ctx.take(n);
    const ps = [];
    const off = rand(0, Math.PI * 2);
    for (let i = 0; i < n; i++) {
      const ang = off + (i / n) * Math.PI * 2 + rand(-0.2, 0.2);
      const dist = rand(ctx.R * 1.55, ctx.R * 2.4);
      const size = rand(22, 30);
      const d = part(ctx, ctx.cx, ctx.cy, size, { text: items[i % items.length], cls: 'anim-emoji' });
      const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist;
      ps.push(play(d, [
        { transform: 'translate(0,0) scale(.3)', opacity: 0 },
        { transform: `translate(${dx * 0.85}px,${dy * 0.85}px) scale(1.05)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${dx}px,${dy}px) scale(1)`, opacity: 1, offset: 0.75 },
        { transform: `translate(${dx * 1.08}px,${dy * 1.08 - 10}px) scale(.85)`, opacity: 0 },
      ], { duration: rand(1300, 1600), delay: 220 + i * 35, easing: 'cubic-bezier(.2,.8,.3,1)' }));
    }
    return ps;
  },

  rise(ctx, { text, svg, items, n = 12, size = [16, 28], from = 'bottom', colors, emoji }) {
    n = ctx.take(n);
    const ps = [];
    for (let i = 0; i < n; i++) {
      const s = rand(size[0], size[1]);
      const c = pick(colors || ctx.pal);
      let x, y, dy;
      if (from === 'badge') { x = ctx.cx + rand(-ctx.R * 0.9, ctx.R * 0.9); y = ctx.cy - ctx.R * 0.3; dy = -rand(ctx.R * 1.4, ctx.h * 0.42); }
      else { x = rand(ctx.w * 0.08, ctx.w * 0.92); y = ctx.h * rand(0.82, 0.98); dy = -rand(ctx.h * 0.35, ctx.h * 0.6); }
      const opts = svg ? { html: SVG[svg](c) } : { text: pick(text || items), color: emoji ? undefined : c };
      const d = part(ctx, x, y, s, { ...opts, cls: svg ? 'anim-svgp' : (emoji ? 'anim-emoji' : 'anim-glyphp') });
      const sway = rand(14, 30) * (Math.random() < 0.5 ? -1 : 1);
      ps.push(play(d, [
        { transform: 'translate(0,0) scale(.5)', opacity: 0 },
        { transform: `translate(${sway * 0.6}px,${dy * 0.3}px) scale(1)`, opacity: 1, offset: 0.25 },
        { transform: `translate(${-sway * 0.4}px,${dy * 0.7}px) scale(1) rotate(${sway * 0.3}deg)`, opacity: 0.9, offset: 0.7 },
        { transform: `translate(${sway * 0.3}px,${dy}px) scale(.9)`, opacity: 0 },
      ], { duration: rand(1300, 1750), delay: rand(100, 520), easing: 'cubic-bezier(.25,.6,.4,1)' }));
    }
    return ps;
  },

  fall(ctx, { items, svg, n = 8, size = [20, 28], colors }) {
    n = ctx.take(n);
    const ps = [];
    for (let i = 0; i < n; i++) {
      const s = rand(size[0], size[1]);
      const x = ctx.w * ((i + 0.5) / n) + rand(-14, 14), y = -s;
      const opts = svg ? { html: SVG[svg](pick(colors || ctx.pal)) } : { text: items[i % items.length] };
      const d = part(ctx, x, y, s, { ...opts, cls: svg ? 'anim-svgp' : 'anim-emoji' });
      const dy = ctx.h * rand(0.42, 0.7), sw = rand(10, 22);
      ps.push(play(d, [
        { transform: 'translate(0,0) rotate(-10deg)', opacity: 0 },
        { transform: `translate(${sw}px,${dy * 0.35}px) rotate(12deg)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${-sw}px,${dy * 0.7}px) rotate(-10deg)`, opacity: 1, offset: 0.65 },
        { transform: `translate(${sw * 0.5}px,${dy}px) rotate(6deg)`, opacity: 0 },
      ], { duration: rand(1400, 1800), delay: rand(80, 450), easing: 'cubic-bezier(.35,.1,.6,1)' }));
    }
    return ps;
  },

  converge(ctx, { items, n = 8 }) {
    n = ctx.take(n);
    const ps = [];
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + rand(-0.25, 0.25);
      const dist = Math.max(ctx.w, ctx.h) * 0.42;
      const sx = Math.cos(ang) * dist, sy = Math.sin(ang) * dist;
      const d = part(ctx, ctx.cx, ctx.cy, rand(24, 30), { text: items[i % items.length], cls: 'anim-emoji' });
      ps.push(play(d, [
        { transform: `translate(${sx}px,${sy}px) scale(1) rotate(${rand(-30, 30)}deg)`, opacity: 0 },
        { transform: `translate(${sx * 0.7}px,${sy * 0.7}px) scale(1)`, opacity: 1, offset: 0.25 },
        { transform: `translate(${sx * 0.15}px,${sy * 0.15}px) scale(.7) rotate(0deg)`, opacity: 1, offset: 0.8 },
        { transform: 'translate(0,0) scale(.2)', opacity: 0 },
      ], { duration: 1000, delay: 120 + i * 70, easing: 'cubic-bezier(.5,0,.75,.4)' }));
    }
    return ps;
  },

  ripple(ctx, { n = 2 }) {
    n = ctx.take(n);
    const ps = [];
    for (let i = 0; i < n; i++) {
      const s = ctx.R * 2;
      const d = part(ctx, ctx.cx, ctx.cy, s, { cls: 'anim-ripple', style: { borderColor: ctx.color } });
      ps.push(play(d, [
        { transform: 'scale(1)', opacity: 0.55 },
        { transform: 'scale(2.1)', opacity: 0 },
      ], { duration: 1100, delay: 780 + i * 260, easing: 'cubic-bezier(.2,.7,.3,1)' }));
    }
    return ps;
  },

  steam(ctx, { n = 3 }) {
    n = ctx.take(n);
    const ps = [];
    for (let i = 0; i < n; i++) {
      const w = ctx.R * 0.32, hh = ctx.R * 1.0;
      const x = ctx.cx + (i - (n - 1) / 2) * ctx.R * 0.42, y = ctx.cy - ctx.R - hh * 0.45;
      const d = part(ctx, x, y, 1, { cls: 'anim-steam', html: SVG.steam, style: { width: `${w}px`, height: `${hh}px`, left: `${x - w / 2}px`, top: `${y - hh / 2}px` } });
      ps.push(play(d, [
        { transform: 'translateY(16px) scaleY(.6)', opacity: 0 },
        { transform: 'translateY(0) scaleY(1)', opacity: 0.75, offset: 0.35 },
        { transform: `translateY(-26px) translateX(${i % 2 ? 4 : -4}px) scaleY(1.1)`, opacity: 0 },
      ], { duration: 1500, delay: 250 + i * 180, easing: 'ease-out', iterations: 1 }));
    }
    return ps;
  },

  beans(ctx, { n = 10 }) {
    n = ctx.take(n);
    const ps = [];
    for (let i = 0; i < n; i++) {
      const s = rand(12, 18);
      const d = part(ctx, ctx.cx, ctx.cy, s, { cls: 'anim-svgp', html: SVG.bean(pick(PAL.coffee.slice(0, 3))) });
      const ang = rand(-Math.PI * 0.9, -Math.PI * 0.1), dist = rand(ctx.R * 1.4, ctx.R * 2.6);
      const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist, rot = rand(-360, 360);
      ps.push(play(d, [
        { transform: 'translate(0,0) rotate(0) scale(.4)', opacity: 0 },
        { transform: `translate(${dx}px,${dy}px) rotate(${rot * 0.5}deg) scale(1)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${dx * 1.1}px,${dy + ctx.h * 0.3}px) rotate(${rot}deg) scale(1)`, opacity: 0 },
      ], { duration: rand(1300, 1600), delay: 200 + i * 40, easing: 'cubic-bezier(.2,.75,.5,1)' }));
    }
    return ps;
  },

  puff(ctx, { n = 5 }) { // Schornsteinrauch oben rechts am Abzeichen
    n = ctx.take(n);
    const ps = [];
    for (let i = 0; i < n; i++) {
      const s = rand(14, 24);
      const d = part(ctx, ctx.cx + ctx.R * 0.45, ctx.cy - ctx.R * 0.9, s, { cls: 'anim-puff' });
      ps.push(play(d, [
        { transform: 'translate(0,0) scale(.4)', opacity: 0 },
        { transform: `translate(${8 + i * 3}px,-${20 + i * 6}px) scale(1)`, opacity: 0.7, offset: 0.4 },
        { transform: `translate(${22 + i * 6}px,-${60 + i * 12}px) scale(1.6)`, opacity: 0 },
      ], { duration: 1400, delay: 300 + i * 200, easing: 'ease-out' }));
    }
    return ps;
  },

  twinkle(ctx, { items = ['✨'], n = 6 }) {
    n = ctx.take(n);
    const ps = [];
    for (let i = 0; i < n; i++) {
      const ang = rand(0, Math.PI * 2), dist = rand(ctx.R * 1.3, ctx.R * 2.2);
      const d = part(ctx, ctx.cx + Math.cos(ang) * dist, ctx.cy + Math.sin(ang) * dist, rand(16, 24), { text: pick(items), cls: 'anim-emoji' });
      ps.push(play(d, [
        { transform: 'scale(0) rotate(-30deg)', opacity: 0 },
        { transform: 'scale(1.1) rotate(0)', opacity: 1, offset: 0.4 },
        { transform: 'scale(0) rotate(30deg)', opacity: 0 },
      ], { duration: 900, delay: 250 + i * 140, easing: 'ease-in-out' }));
    }
    return ps;
  },

  windows(ctx, { n = 14 }) { // Fensterlichter gehen in der unteren Hälfte an
    n = ctx.take(n);
    const ps = [];
    const cols = 7;
    for (let i = 0; i < n; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const x = ctx.w * (0.12 + col * (0.76 / (cols - 1))) + rand(-6, 6);
      const y = ctx.cy + ctx.R * 1.55 + row * 26 + rand(-4, 4);
      const d = part(ctx, x, y, 1, { cls: 'anim-svgp', html: SVG.window(pick(['var(--yellow)', 'var(--ua-yellow)', '#FFE79A'])), style: { width: '12px', height: '15px', left: `${x - 6}px`, top: `${y - 7}px` } });
      ps.push(play(d, [
        { transform: 'scale(.6)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.2 },
        { transform: 'scale(1)', opacity: 1, offset: 0.75 },
        { transform: 'scale(1)', opacity: 0 },
      ], { duration: 1300, delay: 200 + rand(0, 500), easing: 'ease-out' }));
    }
    return ps;
  },

  speedlines(ctx, { n = 6 }) {
    n = ctx.take(n);
    const ps = [];
    for (let i = 0; i < n; i++) {
      const y = ctx.cy + ctx.R * 1.5 + rand(-10, 46);
      const len = rand(30, 70);
      const d = part(ctx, ctx.w * rand(0.3, 0.9), y, 1, { cls: 'anim-line', style: { width: `${len}px`, height: '3px', background: ctx.color } });
      ps.push(play(d, [
        { transform: 'translateX(40px) scaleX(.2)', opacity: 0 },
        { transform: 'translateX(0) scaleX(1)', opacity: 0.6, offset: 0.4 },
        { transform: `translateX(-${ctx.w * 0.4}px) scaleX(.4)`, opacity: 0 },
      ], { duration: 800, delay: 250 + i * 110, easing: 'ease-out' }));
    }
    return ps;
  },

  fly(ctx, { content, path = 'lane', size = 36, delay = 150 }) {
    if (!ctx.take(1)) return [];
    const d = part(ctx, ctx.w + size, ctx.cy + ctx.R * (path === 'lane' ? 1.75 : 2.35), size, { text: content, cls: 'anim-emoji' });
    const dist = ctx.w + size * 2;
    return [play(d, [
      { transform: 'translateX(0) translateY(0)', opacity: 1 },
      { transform: `translateX(${-dist * 0.25}px) translateY(-2px)`, offset: 0.25 },
      { transform: `translateX(${-dist * 0.5}px) translateY(0)`, offset: 0.5 },
      { transform: `translateX(${-dist * 0.75}px) translateY(-2px)`, offset: 0.75 },
      { transform: `translateX(${-dist}px) translateY(0)`, opacity: 1 },
    ], { duration: 1500, delay, easing: 'cubic-bezier(.45,.05,.55,.95)' })];
  },

  plane(ctx) { // Papierflieger auf einer Bogenbahn von links unten nach rechts oben
    if (!ctx.take(1)) return [];
    const s = Math.max(44, ctx.R * 0.75);
    const d = part(ctx, 0, 0, 1, { cls: 'anim-svgp', html: SVG.plane, style: { width: `${s}px`, height: `${s * 0.66}px`, left: `${-s}px`, top: `${ctx.cy + ctx.R * 1.4}px` } });
    const W = ctx.w + s * 2, up = ctx.R * 2.6;
    const pts = [[0, 0, -18], [0.25, -up * 0.55, -26], [0.5, -up * 0.9, -6], [0.72, -up * 0.7, 18], [1, -up * 1.35, -22]];
    return [play(d, pts.map(([fx, y, r], i) => ({
      transform: `translate(${fx * W}px,${y}px) rotate(${r}deg)`, opacity: i === 0 || i === pts.length - 1 ? 0.2 : 1, offset: i / (pts.length - 1),
    })), { duration: 1700, delay: 120, easing: 'ease-in-out' })];
  },

  clouds(ctx, { n = 3 }) {
    n = ctx.take(n);
    const ps = [];
    for (let i = 0; i < n; i++) {
      const s = rand(30, 46);
      const y = ctx.cy - ctx.R * rand(1.2, 2.2) + i * 18;
      const fromLeft = i % 2 === 0;
      const d = part(ctx, fromLeft ? ctx.w * 0.1 : ctx.w * 0.9, y, s, { text: '☁️', cls: 'anim-emoji' });
      const dx = (fromLeft ? 1 : -1) * ctx.w * rand(0.15, 0.25);
      ps.push(play(d, [
        { transform: 'translateX(0) scale(.85)', opacity: 0 },
        { transform: `translateX(${dx * 0.4}px) scale(1)`, opacity: 0.95, offset: 0.3 },
        { transform: `translateX(${dx}px) scale(1)`, opacity: 0 },
      ], { duration: 1700, delay: 100 + i * 150, easing: 'ease-in-out' }));
    }
    return ps;
  },

  rays(ctx) {
    if (!ctx.take(1)) return [];
    const s = ctx.R * 3.4;
    const d = part(ctx, ctx.cx, ctx.cy, s, { cls: 'anim-svgp anim-behind', html: SVG.rays('var(--yellow)') });
    return [play(d, [
      { transform: 'rotate(0deg) scale(.6)', opacity: 0 },
      { transform: 'rotate(25deg) scale(1)', opacity: 0.9, offset: 0.35 },
      { transform: 'rotate(60deg) scale(1.05)', opacity: 0.7, offset: 0.75 },
      { transform: 'rotate(80deg) scale(1.1)', opacity: 0 },
    ], { duration: 1800, delay: 150, easing: 'linear' })];
  },

  ticks(ctx, { n = 12 }) { // Zifferblatt-Striche erscheinen nacheinander
    n = ctx.take(n);
    const ps = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2, r = ctx.R + 18;
      const big = i % 3 === 0;
      const d = part(ctx, ctx.cx + Math.cos(a) * r, ctx.cy + Math.sin(a) * r, 1, {
        cls: 'anim-line', style: { width: big ? '12px' : '8px', height: big ? '4px' : '3px', marginLeft: big ? '-6px' : '-4px', marginTop: '-2px', background: ctx.color, rotate: `${(i / n) * 360 + 90}deg` },
      });
      ps.push(play(d, [
        { transform: 'scale(0)', opacity: 0 },
        { transform: 'scale(1.3)', opacity: 1, offset: 0.15 },
        { transform: 'scale(1)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1)', opacity: 1, offset: 0.8 },
        { transform: 'scale(.6)', opacity: 0 },
      ], { duration: 1500 - i * 40, delay: 150 + i * 45, easing: 'ease-out' }));
    }
    return ps;
  },

  splats(ctx, { n = 12 }) { // Farbkleckse
    n = ctx.take(n);
    const ps = [];
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + rand(-0.2, 0.2), dist = rand(ctx.R * 1.4, ctx.R * 2.5);
      const s = rand(12, 26);
      const d = part(ctx, ctx.cx, ctx.cy, s, { cls: 'anim-splat', style: { background: PAL.rainbow[i % PAL.rainbow.length] } });
      ps.push(play(d, [
        { transform: 'translate(0,0) scale(.2)', opacity: 0 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist}px) scale(1.15,.9)`, opacity: 0.95, offset: 0.35 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist}px) scale(1)`, opacity: 0.9, offset: 0.75 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist + 8}px) scale(.8)`, opacity: 0 },
      ], { duration: 1500, delay: 180 + i * 30, easing: 'cubic-bezier(.2,.9,.3,1)' }));
    }
    return ps;
  },

  ecg(ctx) {
    if (!ctx.take(1)) return [];
    const w = Math.min(ctx.w * 0.8, ctx.R * 4.2), hh = w * 0.3;
    const d = part(ctx, ctx.cx, ctx.cy + ctx.R + hh * 0.9, 1, { cls: 'anim-svgp', html: SVG.ecg(ctx.color), style: { width: `${w}px`, height: `${hh}px`, left: `${ctx.cx - w / 2}px`, top: `${ctx.cy + ctx.R + 10}px` } });
    const line = d.querySelector('path');
    const p1 = play(line, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 900, delay: 250, easing: 'ease-in-out', fill: 'both' });
    const p2 = play(d, [{ opacity: 1 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], { duration: 1700, delay: 100 });
    return [p1, p2];
  },

  days(ctx, { labels }) { // Wochentage als Kalenderkacheln im Halbkreis
    const n = ctx.take(labels.length);
    const ps = [];
    for (let i = 0; i < n; i++) {
      const a = Math.PI + (i / (n - 1)) * Math.PI; // oberer Halbkreis
      const r = ctx.R * 1.85;
      const d = part(ctx, ctx.cx + Math.cos(a) * r, ctx.cy + Math.sin(a) * r * 0.9, 34, { text: labels[i], cls: 'anim-day', style: i >= 5 ? { color: 'var(--red-ink)' } : {} });
      ps.push(play(d, [
        { transform: 'translateY(14px) scale(.5)', opacity: 0 },
        { transform: 'translateY(-3px) scale(1.06)', opacity: 1, offset: 0.2 },
        { transform: 'translateY(0) scale(1)', opacity: 1, offset: 0.32 },
        { transform: 'translateY(0) scale(1)', opacity: 1, offset: 0.8 },
        { transform: 'translateY(-8px) scale(.9)', opacity: 0 },
      ], { duration: 1500 - i * 50, delay: 200 + i * 70, easing: 'ease-out' }));
    }
    return ps;
  },

  sheets(ctx, { n = 6 }) { // Papierblätter flattern auf
    n = ctx.take(n);
    const ps = [];
    for (let i = 0; i < n; i++) {
      const s = rand(20, 28);
      const d = part(ctx, ctx.cx, ctx.cy, 1, { cls: 'anim-svgp', html: SVG.sheet, style: { width: `${s}px`, height: `${s * 1.27}px`, left: `${ctx.cx - s / 2}px`, top: `${ctx.cy - s * 0.63}px` } });
      const ang = -Math.PI / 2 + (i - (n - 1) / 2) * 0.42, dist = rand(ctx.R * 1.6, ctx.R * 2.3);
      const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist, rot = rand(-40, 40);
      ps.push(play(d, [
        { transform: 'translate(0,0) rotate(0) scale(.4)', opacity: 0 },
        { transform: `translate(${dx}px,${dy}px) rotate(${rot}deg) scale(1)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${dx + rot * 0.5}px,${dy + 30}px) rotate(${-rot}deg) scale(1)`, opacity: 1, offset: 0.75 },
        { transform: `translate(${dx}px,${dy + 70}px) rotate(${rot}deg) scale(.95)`, opacity: 0 },
      ], { duration: 1600, delay: 180 + i * 60, easing: 'cubic-bezier(.25,.7,.4,1)' }));
    }
    return ps;
  },
};

// Glyph-Bewegung im Abzeichen
const MOTION = {
  wave: { frames: [0, 16, -6, 16, -4, 10, 0].map(r => ({ transform: `rotate(${r}deg)` })), origin: '70% 80%', duration: 1100 },
  beat: { frames: [1, 1.18, 1, 1.12, 1].map(s => ({ transform: `scale(${s})` })), origin: '50% 55%', duration: 900 },
  tick: { frames: [0, -12, 10, -8, 6, 0].map(r => ({ transform: `rotate(${r}deg)` })), origin: '50% 50%', duration: 900 },
  sway: { frames: [0, -9, 8, -5, 3, 0].map(r => ({ transform: `rotate(${r}deg)` })), origin: '50% 85%', duration: 1100 },
  bob: { frames: [0, -7, 0, -3, 0].map(y => ({ transform: `translateY(${y}px)` })), origin: '50% 50%', duration: 900 },
  drive: { frames: [0, -3, 3, -2, 2, 0].map(x => ({ transform: `translateX(${x}px) rotate(${x * 0.6}deg)` })), origin: '50% 90%', duration: 800 },
};

// ---------- Abzeichen ----------
const RING_R = 46;
const RING_C = 2 * Math.PI * RING_R;
function makeBadge(theme, { size = 96, closed = true } = {}) {
  const t = themeOf(theme);
  const b = document.createElement('div');
  b.className = 'anim-badge';
  b.style.setProperty('--theme-c', t.color);
  b.style.setProperty('--badge-size', `${Math.round(size)}px`);
  b.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('class', 'anim-badge-ring');
  svg.innerHTML = `<circle class="track" cx="50" cy="50" r="${RING_R}"/><circle class="value" cx="50" cy="50" r="${RING_R}" stroke-dasharray="${RING_C.toFixed(2)}" stroke-dashoffset="${closed ? 0 : RING_C.toFixed(2)}"/>`;
  const g = document.createElement('span');
  g.className = 'anim-badge-glyph';
  g.textContent = t.glyph;
  b.append(svg, g);
  return b;
}

// ============================================================================================
//  Öffentliche API
// ============================================================================================
const celebrating = new WeakMap();
const countTokens = new WeakMap();
const lastFraction = new WeakMap();

export const anim = {
  get reduced() { return isReduced(); },

  viewIn(el) {
    if (!canAnimate(el)) return done();
    const full = document.body?.classList.contains('is-fullscreen');
    if (isReduced()) return exclusive(el, 'view', () => play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 140, easing: 'linear' }));
    if (full) return exclusive(el, 'view', () => play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'ease-out' }));
    return exclusive(el, 'view', () => play(el, [
      { opacity: 0, transform: 'translateY(8px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 220, easing: 'cubic-bezier(.22,.9,.3,1)' }));
  },

  correct(el, { sparks = true } = {}) {
    if (!canAnimate(el)) return done();
    const r = rectOf(el);
    const ps = [];
    const ly = r && layer();
    if (ly) {
      let radius = '14px';
      try { radius = getComputedStyle(el).borderRadius || radius; } catch {}
      const g = node('anim-glow', { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, borderRadius: radius });
      ly.append(g);
      const reduced = isReduced();
      ps.push(play(g, reduced
        ? [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0 }]
        : [{ opacity: 0, transform: 'scale(1)' }, { opacity: 1, transform: 'scale(1.03)', offset: 0.3 }, { opacity: 0, transform: 'scale(1.08)' }],
      { duration: reduced ? 500 : 650, easing: 'ease-out' }).then(() => g.remove()));
      if (sparks && !reduced) {
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        for (let i = 0; i < 6; i++) {
          const a = -Math.PI / 2 + (i - 2.5) * 0.55 + rand(-0.12, 0.12);
          const ex = Math.cos(a) * (r.width / 2), ey = Math.sin(a) * (r.height / 2);
          const s = rand(4, 6);
          const d = node('anim-spark', { left: `${cx + ex - s / 2}px`, top: `${cy + ey - s / 2}px`, width: `${s}px`, height: `${s}px`, background: i % 3 === 0 ? 'var(--yellow)' : 'var(--green)' });
          ly.append(d);
          const dist = rand(14, 24);
          ps.push(play(d, [
            { transform: 'translate(0,0) scale(.4)', opacity: 0 },
            { transform: `translate(${Math.cos(a) * dist * 0.6}px,${Math.sin(a) * dist * 0.6}px) scale(1)`, opacity: 1, offset: 0.35 },
            { transform: `translate(${Math.cos(a) * dist}px,${Math.sin(a) * dist}px) scale(.3)`, opacity: 0 },
          ], { duration: 520, delay: 60 + i * 15, easing: 'cubic-bezier(.2,.8,.3,1)' }).then(() => d.remove()));
        }
      }
    }
    if (!isReduced()) {
      ps.push(exclusive(el, 'fb', () => play(el, [
        { transform: 'scale(1)' }, { transform: 'scale(1.03)', offset: 0.4 }, { transform: 'scale(1)' },
      ], { duration: 320, easing: 'cubic-bezier(.34,1.56,.64,1)', composite: 'add' })));
    }
    return Promise.all(ps).then(() => undefined, () => undefined);
  },

  wrong(el) {
    if (!canAnimate(el) || isReduced()) return done();
    return exclusive(el, 'fb', () => play(el, [0, -6, 5, -5, 4, -3, 2, 0].map(x => ({ transform: `translateX(${x}px)` })),
      { duration: 320, easing: 'ease-in-out', composite: 'add' }));
  },

  pop(el) {
    if (!canAnimate(el)) return done();
    if (isReduced()) return exclusive(el, 'pop', () => play(el, [{ opacity: 0.5 }, { opacity: 1 }], { duration: 120 }));
    return exclusive(el, 'pop', () => play(el, [
      { transform: 'scale(.82)', opacity: 0.6 },
      { transform: 'scale(1.06)', opacity: 1, offset: 0.6 },
      { transform: 'scale(1)', opacity: 1 },
    ], { duration: 240, easing: 'ease-out', composite: 'add' }));
  },

  feedbackIn(el) {
    if (!canAnimate(el)) return done();
    if (isReduced()) return exclusive(el, 'sheet', () => play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 160 }));
    return exclusive(el, 'sheet', () => play(el, [
      { transform: 'translateY(100%)' },
      { transform: 'translateY(0)' },
    ], { duration: 380, easing: 'cubic-bezier(.25,1.18,.4,1)', composite: 'add' }));
  },

  feedbackOut(el) {
    if (!canAnimate(el)) return done();
    if (isReduced()) return exclusive(el, 'sheet', () => play(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: 'forwards' }));
    return exclusive(el, 'sheet', () => play(el, [
      { transform: 'translateY(0)' },
      { transform: 'translateY(100%)' },
    ], { duration: 240, easing: 'cubic-bezier(.4,0,.8,.4)', composite: 'add', fill: 'forwards' }));
  },

  progress(fillEl, toFraction) {
    if (!isEl(fillEl)) return done();
    let fill = fillEl;
    if (!fill.classList.contains('progress-fill')) fill = fill.querySelector?.('.progress-fill') || fill;
    const to = clamp01(toFraction);
    let from = lastFraction.get(fill);
    if (from == null) {
      const cur = parseFloat(fill.style.getPropertyValue('--p'));
      from = Number.isFinite(cur) ? cur / 100 : 0;
    }
    lastFraction.set(fill, to);
    const value = `${Math.round(to * 1000) / 10}%`;
    if (isReduced() || !canAnimate(fill)) {
      const prev = fill.style.transition;
      fill.style.transition = 'none';
      fill.style.setProperty('--p', value);
      void fill.offsetWidth; // Endzustand ohne Transition übernehmen
      fill.style.transition = prev;
      return done();
    }
    fill.style.setProperty('--p', value);
    if (to <= from + 0.001) return done();
    fill.querySelector(':scope > .anim-sweep')?.remove();
    const wrap = document.createElement('span');
    wrap.className = 'anim-sweep';
    wrap.setAttribute('aria-hidden', 'true');
    const band = document.createElement('i');
    wrap.append(band);
    fill.append(wrap);
    return play(band, [
      { transform: 'translateX(-100%)', opacity: 0 },
      { transform: 'translateX(40%)', opacity: 1, offset: 0.3 },
      { transform: 'translateX(260%)', opacity: 0 },
    ], { duration: 750, delay: 160, easing: 'cubic-bezier(.4,0,.2,1)' }).then(() => { wrap.remove(); });
  },

  ring(target, fraction) {
    if (!isEl(target)) return done();
    const c = target.matches?.('circle') ? target : target.querySelector?.('.ring-value');
    if (!c) return done();
    let len = 0;
    try { len = 2 * Math.PI * (parseFloat(c.getAttribute('r')) || 0); } catch {}
    if (!len) return done();
    c.setAttribute('stroke-dasharray', len.toFixed(2));
    const off = (len * (1 - clamp01(fraction))).toFixed(2);
    if (isReduced()) {
      const prev = c.style.transition;
      c.style.transition = 'none';
      c.style.strokeDashoffset = off;
      void c.getBoundingClientRect();
      c.style.transition = prev;
      return done();
    }
    c.style.strokeDashoffset = off; // .ring .ring-value hat eine CSS-Transition (600ms)
    return new Promise(res => setTimeout(res, 620));
  },

  countUp(el, to, { duration = 700, from, format, decimals = 0 } = {}) {
    if (!isEl(el)) return done();
    const target = Number(to) || 0;
    const start = from != null ? Number(from) || 0 : (Number(el.dataset.animValue) || 0);
    const fmtNum = n => n.toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    const fmt = typeof format === 'function' ? format
      : format === 'percent' ? n => `${fmtNum(n)} %`
      : fmtNum;
    const render = n => { try { el.textContent = String(fmt(n)); } catch { el.textContent = String(n); } };
    el.style.fontVariantNumeric = 'tabular-nums';
    el.dataset.animValue = String(target);
    const token = {};
    countTokens.set(el, token);
    if (isReduced() || duration <= 0 || start === target || typeof requestAnimationFrame !== 'function') { render(target); return done(); }
    const round = n => Math.round(n * 10 ** decimals) / 10 ** decimals;
    return new Promise(res => {
      const t0 = performance.now();
      let fin = false;
      const finish = () => { if (fin) return; fin = true; if (countTokens.get(el) === token) render(target); res(); };
      const step = now => {
        if (fin || countTokens.get(el) !== token) return finish();
        const p = Math.min(1, (now - t0) / duration);
        const e = 1 - Math.pow(1 - p, 3);
        render(round(start + (target - start) * e));
        if (p < 1) requestAnimationFrame(step); else finish();
      };
      requestAnimationFrame(step);
      setTimeout(finish, duration + 300); // Sicherung (Hintergrund-Tab ohne rAF)
    });
  },

  streak(el, { ignite = false } = {}) {
    if (!canAnimate(el)) return done();
    if (isReduced()) return exclusive(el, 'streak', () => play(el, [{ opacity: 0.4 }, { opacity: 1 }], { duration: 260 }));
    const ps = [];
    const prevOrigin = el.style.transformOrigin;
    el.style.transformOrigin = '50% 85%';
    if (el instanceof SVGElement && el.ownerSVGElement) el.style.transformBox = 'fill-box';
    const frames = ignite
      ? [{ transform: 'scale(0) rotate(0)', opacity: 0 }, { transform: 'scale(1.3) rotate(-6deg)', opacity: 1, offset: 0.35 },
        { transform: 'scale(.92) rotate(5deg)', offset: 0.55 }, { transform: 'scale(1.08) rotate(-3deg)', offset: 0.75 }, { transform: 'scale(1) rotate(0)', opacity: 1 }]
      : [{ transform: 'scale(1) rotate(0)' }, { transform: 'scale(1.26) rotate(-6deg)', offset: 0.25 }, { transform: 'scale(.94) rotate(5deg)', offset: 0.5 },
        { transform: 'scale(1.1) rotate(-3deg)', offset: 0.72 }, { transform: 'scale(1) rotate(0)' }];
    ps.push(exclusive(el, 'streak', () => play(el, frames, { duration: ignite ? 800 : 700, easing: 'ease-out', composite: 'add' }))
      .then(() => { el.style.transformOrigin = prevOrigin; }));
    const r = rectOf(el), ly = r && layer();
    if (ly) {
      const cx = r.left + r.width / 2, top = r.top + r.height * 0.3;
      const glow = node('anim-ember-glow', { left: `${cx - r.width}px`, top: `${r.top + r.height / 2 - r.width}px`, width: `${r.width * 2}px`, height: `${r.width * 2}px` });
      ly.append(glow);
      ps.push(play(glow, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 0.8, transform: 'scale(1)', offset: 0.35 }, { opacity: 0, transform: 'scale(1.2)' }],
        { duration: 750, easing: 'ease-out' }).then(() => glow.remove()));
      for (let i = 0; i < 5; i++) {
        const s = rand(3, 5);
        const d = node('anim-spark', { left: `${cx + rand(-r.width * 0.25, r.width * 0.25) - s / 2}px`, top: `${top}px`, width: `${s}px`, height: `${s}px`, background: i % 2 ? 'var(--orange)' : 'var(--yellow)' });
        ly.append(d);
        const dx = rand(-10, 10), dy = -rand(18, 34);
        ps.push(play(d, [
          { transform: 'translate(0,0) scale(1)', opacity: 0 },
          { transform: `translate(${dx * 0.5}px,${dy * 0.4}px) scale(1)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${dx}px,${dy}px) scale(.3)`, opacity: 0 },
        ], { duration: 700, delay: 100 + i * 60, easing: 'ease-out' }).then(() => d.remove()));
      }
    }
    return Promise.all(ps).then(() => undefined, () => undefined);
  },

  celebrate(container, theme, { keepBadge = false } = {}) {
    if (!hasDOM() || !document.body) return done();
    try {
      let host = isEl(container) ? container : document.body;
      let fixed = host === document.body || host === document.documentElement;
      let rect = fixed ? null : rectOf(host);
      if (!fixed && (!rect || rect.width < 120 || rect.height < 120)) { host = document.body; fixed = true; rect = null; }
      const w = fixed ? window.innerWidth : rect.width;
      const hgt = fixed ? window.innerHeight : rect.height;

      // vorherige Feier im selben Container beenden
      celebrating.get(host)?.();

      let restorePos = null;
      if (!fixed) {
        const pos = getComputedStyle(host).position;
        if (pos === 'static') { restorePos = host.style.position; host.style.position = 'relative'; }
      }
      const t = themeOf(theme);
      const ov = node(`anim-celebrate${fixed ? ' is-fixed' : ''}`);
      ov.setAttribute('aria-hidden', 'true');
      ov.dataset.theme = theme || '';
      host.append(ov);

      const R = Math.max(44, Math.min(68, Math.min(w, hgt) * 0.15));
      const cx = w / 2, cy = Math.min(hgt * 0.4, hgt / 2);
      let budget = 40;
      const ctx = { ov, w, h: hgt, cx, cy, R, pal: t.palette, color: t.color, take: n => { const k = Math.max(0, Math.min(n, budget)); budget -= k; return k; } };

      // Glow hinter dem Abzeichen
      const glow = node('anim-celebrate-glow', { left: `${cx - R * 2}px`, top: `${cy - R * 2}px`, width: `${R * 4}px`, height: `${R * 4}px` });
      glow.style.setProperty('--theme-c', t.color);
      ov.append(glow);

      const reduced = isReduced();
      const badge = makeBadge(theme, { size: R * 2, closed: reduced });
      Object.assign(badge.style, { position: 'absolute', left: `${cx - R}px`, top: `${cy - R}px` });
      ov.append(badge);
      const ringV = badge.querySelector('.value');
      const glyph = badge.querySelector('.anim-badge-glyph');

      let cleaned = false;
      const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        if (celebrating.get(host) === cleanup) celebrating.delete(host);
        if (keepBadge) {
          for (const c of [...ov.children]) if (c !== badge) c.remove();
          for (const a of badge.getAnimations?.({ subtree: true }) || []) { try { a.finish(); } catch {} }
          ringV?.setAttribute('stroke-dashoffset', '0');
        } else {
          ov.remove();
          if (restorePos !== null) host.style.position = restorePos;
        }
      };
      celebrating.set(host, cleanup);

      if (reduced) {
        return Promise.all([
          play(badge, [{ opacity: 0 }, { opacity: 1 }], { duration: 220, fill: 'backwards' }),
          play(glow, [{ opacity: 0 }, { opacity: 0.6 }, { opacity: 0 }], { duration: 1200 }),
        ]).then(() => keepBadge ? null : play(badge, [{ opacity: 1 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: 1000, fill: 'forwards' }))
          .then(cleanup, cleanup);
      }

      const ps = [];
      ps.push(play(glow, [{ opacity: 0, transform: 'scale(.5)' }, { opacity: 0.85, transform: 'scale(1)', offset: 0.35 }, { opacity: 0, transform: 'scale(1.25)' }],
        { duration: 1700, easing: 'ease-out' }));
      ps.push(play(badge, [
        { transform: 'scale(.4)', opacity: 0 },
        { transform: 'scale(1.08)', opacity: 1, offset: 0.55 },
        { transform: 'scale(1)', opacity: 1 },
      ], { duration: 460, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards' }));
      ps.push(play(ringV, [{ strokeDashoffset: RING_C }, { strokeDashoffset: 0 }], { duration: 720, delay: 180, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'forwards' }));
      // kurzer „Klick“, wenn der Ring sich schließt
      ps.push(play(badge, [{ transform: 'scale(1)' }, { transform: 'scale(1.06)', offset: 0.4 }, { transform: 'scale(1)' }],
        { duration: 300, delay: 900, easing: 'ease-out', composite: 'add' }));
      const m = MOTION[t.motion] || MOTION.bob;
      if (glyph) {
        glyph.style.transformOrigin = m.origin;
        ps.push(play(glyph, m.frames, { duration: m.duration, delay: 380, easing: 'ease-in-out' }));
      }
      for (const [name, o] of t.fx) {
        try { ps.push(...(FX[name]?.(ctx, o || {}) || [])); } catch {}
      }
      // Ausblenden
      const outDelay = 1650;
      const out = keepBadge
        ? new Promise(res => setTimeout(res, 1900))
        : play(badge, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.92)' }], { duration: 260, delay: outDelay, easing: 'ease-in', fill: 'forwards' });
      // Abschluss: Ausblenden fertig (Partikel sind dann ebenfalls durch); harte Obergrenze 2.4s
      return Promise.race([
        Promise.all([out, ...ps]),
        new Promise(res => setTimeout(res, 2400)),
      ]).then(cleanup, cleanup);
    } catch (e) {
      return done();
    }
  },

  badge(theme, opts) {
    if (!hasDOM()) return null;
    return makeBadge(theme, opts);
  },

  checkmark({ size = 56 } = {}) {
    if (!hasDOM()) return null;
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '0 0 52 52');
    svg.setAttribute('class', 'anim-draw-check');
    svg.setAttribute('width', size); svg.setAttribute('height', size);
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = '<circle class="c" cx="26" cy="26" r="23"/><path class="k" d="M15 27.5l7 7 15-15"/>';
    return svg;
  },

  themeGlyph(theme) { return THEMES[theme]?.glyph || '⭐'; },
  themeColor(theme) { return THEMES[theme]?.color || 'var(--green)'; },
  get themes() { return Object.keys(THEMES); },
};

export default anim;
