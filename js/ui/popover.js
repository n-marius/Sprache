// Antipp-Übersetzungsblase für ukrainische Wörter (.uk-tap .w), globale Delegation.
//  initPopover(app)      einmal beim Boot (main.js)
//  showPopoverFor(wordEl) programmatisch öffnen (z. B. Tastatur, Tutorial)
//  hidePopover()          schließen
// Erschließungsmodus: Wort mit .is-new / [data-new] in einem Container [data-guess] → erst „Rate aus dem
// Kontext“ + „Aufdecken“; danach .is-revealed und CustomEvent 'mova:wordreveal' {key, guessed:true} (bubbles).
// Optional: container.__guessOptions = key => [{de, correct}] → 3 Optionen + „Keine Ahnung“ (falsch = folgenlos,
// zeigt sofort die Lösung). Event-detail dann zusätzlich {correct, choice}; „Keine Ahnung“ → {guessed:false, correct:false}.
import { h } from './dom.js';
import { speakerButton } from './audio-button.js';
import { normalizeWord, STRESS } from '../lib/uk-text.js';
import { getApp } from '../app-context.js';

const WORD_SEL = '.uk-tap .w';
const MOVE_TOL = 8;
const MARGIN = 8;
const GAP = 10;          // Abstand Wort ↔ Blase (inkl. Pfeil)
const ARROW = 9;         // Pfeilhöhe
const MAX_W = 320;

const POS_DE = {
  noun: 'Nomen', verb: 'Verb', adj: 'Adjektiv', adv: 'Adverb', pron: 'Pronomen', num: 'Zahlwort',
  prep: 'Präposition', conj: 'Konjunktion', part: 'Partikel', interj: 'Interjektion', name: 'Name',
  propn: 'Name', phrase: 'Wendung', expr: 'Wendung',
};

let app = null;
let inited = false;
let pop = null;          // aktuelles Blasen-Element
let activeWord = null;
let tap = null;          // laufender Tap {x, y, word, moved, scrolled, id}
let suppressClick = 0;   // Zeitstempel bis zu dem Klicks auf Wörter geschluckt werden
let safe = null;

// ---------------------------------------------------------------- Init / Ereignisse
export function initPopover(a) {
  app = a || getApp();
  if (inited || typeof document === 'undefined') return;
  inited = true;
  const cap = { capture: true };
  const capP = { capture: true, passive: true };

  document.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const t = e.target instanceof Element ? e.target : e.target?.parentElement;
    const word = t?.closest?.(WORD_SEL) || null;
    if (pop && !pop.contains(t) && !word) hidePopover();
    tap = word ? { x: e.clientX, y: e.clientY, word, moved: false, scrolled: false, id: e.pointerId } : null;
  }, capP);

  document.addEventListener('pointermove', e => {
    if (!tap || e.pointerId !== tap.id) return;
    if (Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > MOVE_TOL) tap.moved = true;
  }, capP);

  document.addEventListener('pointercancel', () => { tap = null; }, capP);

  document.addEventListener('pointerup', e => {
    const tp = tap; tap = null;
    if (!tp || e.pointerId !== tp.id || tp.moved || tp.scrolled) return;
    if (Math.hypot(e.clientX - tp.x, e.clientY - tp.y) > MOVE_TOL) return;
    const t = e.target instanceof Element ? e.target : e.target?.parentElement;
    const w = t?.closest?.(WORD_SEL);
    if (w !== tp.word) return;
    suppressClick = Date.now() + 800;
    if (activeWord === w && pop) { hidePopover(); return; }   // gleiches Wort erneut → zu
    showPopoverFor(w);
  }, capP);

  // Klick auf ein Wort darf keine Aktion eines Elternelements auslösen.
  document.addEventListener('click', e => {
    const t = e.target instanceof Element ? e.target : e.target?.parentElement;
    const w = t?.closest?.(WORD_SEL);
    if (!w) return;
    e.preventDefault();
    e.stopPropagation();
    // Tastatur-/programmatischer Klick ohne vorherigen Pointer-Tap → Blase öffnen.
    if (Date.now() > suppressClick) showPopoverFor(w);
  }, cap);

  // Scrollen: laufenden Tap verwerfen und Blase schließen (nicht bei Scroll in der Blase selbst).
  document.addEventListener('scroll', e => {
    if (tap) tap.scrolled = true;
    if (pop && !(e.target instanceof Node && pop.contains(e.target))) hidePopover();
  }, capP);
  addEventListener('resize', () => hidePopover(), { passive: true });
  addEventListener('orientationchange', () => hidePopover(), { passive: true });
  addEventListener('hashchange', () => hidePopover());
  window.visualViewport?.addEventListener('resize', () => hidePopover(), { passive: true });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && pop) { hidePopover(); e.stopPropagation(); } }, cap);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible') hidePopover(true); });
}

// ---------------------------------------------------------------- Öffnen / Schließen
export function hidePopover(instant = false) {
  if (activeWord) activeWord.classList.remove('is-active');
  activeWord = null;
  const el = pop; pop = null;
  if (!el) return;
  if (instant || reducedMotion()) { el.remove(); return; }
  el.classList.remove('is-in');
  el.classList.add('is-out');
  setTimeout(() => el.remove(), 160);
}

export function showPopoverFor(wordEl) {
  if (!wordEl || !wordEl.isConnected) return;
  app = app || getApp();
  if (pop) hidePopover(true);
  activeWord = wordEl;
  wordEl.classList.add('is-active');

  const el = h('div', { class: 'pop', role: 'dialog', 'aria-label': 'Übersetzung', 'aria-live': 'polite' },
    h('div', { class: 'pop-arrow', 'aria-hidden': 'true' }),
    h('div', { class: 'pop-body' }));
  pop = el;
  // Bedienelemente in der Blase sollen keine Elternaktionen auslösen (Blase hängt an <body>, trotzdem sicher).
  el.addEventListener('click', e => e.stopPropagation());
  document.body.append(el);

  const guess = isGuessWord(wordEl);
  fill(el, wordEl, guess);
  place(el, wordEl);
  requestAnimationFrame(() => { if (pop === el) el.classList.add('is-in'); });
}

function isGuessWord(w) {
  if (w.classList.contains('is-revealed')) return false;
  if (!(w.classList.contains('is-new') || w.hasAttribute('data-new'))) return false;
  return !!w.closest('[data-guess]');
}

function reveal(el, wordEl, extra = {}) {
  const key = wordEl.dataset.k || normalizeWord(wordEl.textContent || '');
  const scope = wordEl.closest('[data-guess]');
  wordEl.classList.add('is-revealed');
  if (scope) for (const w of scope.querySelectorAll('.w')) if (w.dataset.k === key) w.classList.add('is-revealed');
  fill(el, wordEl, false, extra.banner || null);
  place(el, wordEl);
  el.classList.add('is-revealing');
  const detail = { key, guessed: extra.guessed !== false };
  if ('correct' in extra) detail.correct = extra.correct;
  if (extra.choice != null) detail.choice = extra.choice;
  wordEl.dispatchEvent(new CustomEvent('mova:wordreveal', { bubbles: true, detail }));
}

/** Optionale Mehrfachauswahl: container.__guessOptions(key) → [{de, correct}] (max. 3 angezeigt). */
function guessOptions(wordEl) {
  const scope = wordEl.closest('[data-guess]');
  const fn = scope && scope.__guessOptions;
  if (typeof fn !== 'function') return null;
  let opts;
  try { opts = fn(wordEl.dataset.k || normalizeWord(wordEl.textContent || '')); } catch (e) { console.warn(e); return null; }
  if (!Array.isArray(opts)) return null;
  opts = opts.filter(o => o && o.de).slice(0, 3);
  if (opts.length < 2) return null;
  if (!opts.some(o => o.correct)) return null;
  return opts;
}

// ---------------------------------------------------------------- Inhalt
function stressedForm(raw, entries) {
  if (raw.includes(STRESS) || raw.normalize('NFD').includes(STRESS)) return raw;
  const forms = [...new Set(entries.map(e => e.uk).filter(u => u && u.normalize('NFD').includes(STRESS)))];
  if (forms.length !== 1) return raw;
  return matchCase(forms[0].normalize('NFC'), raw);
}
function matchCase(form, raw) {
  const first = raw.charAt(0);
  if (raw.length > 1 && raw === raw.toUpperCase() && raw !== raw.toLowerCase()) return form.toUpperCase();
  if (first && first === first.toUpperCase() && first !== first.toLowerCase()) return form.charAt(0).toUpperCase() + form.slice(1);
  if (first && first === first.toLowerCase() && first !== first.toUpperCase()) return form.charAt(0).toLowerCase() + form.slice(1);
  return form;
}

/** Einträge mit gleicher Grundform + Übersetzung + Wortart zusammenfassen (info vereinigt). */
function group(entries) {
  const out = new Map();
  for (const e of entries) {
    const k = [normalizeWord(e.lemma || e.uk), e.de, e.pos].join('|');
    const g = out.get(k);
    if (!g) out.set(k, { ...e, infos: e.info ? [e.info] : [] });
    else {
      if (e.info && !g.infos.includes(e.info)) g.infos.push(e.info);
      if (!g.emoji && e.emoji) g.emoji = e.emoji;
      if (!g.vocabId && e.vocabId) g.vocabId = e.vocabId;
    }
  }
  return [...out.values()];
}

function fill(el, wordEl, guess, banner = null) {
  const body = el.querySelector('.pop-body');
  body.replaceChildren();
  const raw = (wordEl.textContent || '').trim();
  let entries = [];
  try { entries = (app?.lexicon?.lookup(raw)) || []; } catch { entries = []; }
  const groups = group(entries);
  const head = stressedForm(raw, entries);
  const ambiguous = groups.length > 1;

  body.append(h('div', { class: 'pop-head' },
    h('span', { class: 'pop-word', lang: 'uk' }, head),
    ambiguous && !guess ? h('span', { class: 'pop-tag' }, 'mehrdeutig') : null,
    h('span', { class: 'pop-spacer' }),
    speakerButton(head, { size: 's', label: 'Wort anhören' })));

  if (guess) {
    body.append(h('p', { class: 'pop-guess' }, h('span', { class: 'pop-guess-glyph', 'aria-hidden': 'true' }, '🤔'),
      h('span', null, 'Was könnte das heißen? ', h('span', { class: 'pop-guess-sub' }, 'Rate aus dem Kontext.'))));
    const opts = guessOptions(wordEl);
    if (opts) {
      let done = false;
      const pick = (btn, o) => {
        if (done) return;
        done = true;
        const ok = !!o?.correct;
        if (btn) btn.classList.add(ok ? 'is-correct' : 'is-wrong');
        for (const b of grid.querySelectorAll('.pop-opt')) { b.disabled = true; if (b.__opt?.correct && !ok && o) b.classList.add('is-solution'); }
        const banner = !o ? null : ok
          ? { kind: 'ok', text: 'Richtig geraten!' }
          : { kind: 'bad', text: 'Nicht ganz – kein Problem.' };
        setTimeout(() => { if (pop === el) reveal(el, wordEl, o ? { correct: ok, choice: o.de, banner } : { guessed: false, correct: false }); }, o ? (ok ? 520 : 760) : 0);
      };
      const grid = h('div', { class: 'pop-opts', role: 'group', 'aria-label': 'Bedeutung raten' });
      for (const o of opts) {
        const b = h('button', { type: 'button', class: 'pop-opt', lang: 'de', on: { click: e => { e.stopPropagation(); pick(b, o); } } }, o.de);
        b.__opt = o;
        grid.append(b);
      }
      body.append(grid, h('button', { type: 'button', class: 'pop-idk', on: { click: e => { e.stopPropagation(); pick(null, null); } } }, 'Keine Ahnung'));
    } else {
      body.append(h('button', { type: 'button', class: 'btn btn-blue pop-reveal', on: { click: e => { e.stopPropagation(); reveal(el, wordEl); } } }, 'Aufdecken'));
    }
    return;
  }

  if (banner) body.append(h('div', { class: ['pop-banner', `is-${banner.kind}`] }, banner.text));

  if (!groups.length) {
    body.append(h('p', { class: 'pop-missing' }, 'Nicht im Wörterbuch'));
    return;
  }

  const list = h('div', { class: ['pop-entries', ambiguous && 'is-multi'] });
  const rawKey = normalizeWord(raw);
  const stressDiffers = ambiguous && new Set(groups.map(g => g.uk)).size > 1;
  for (const g of groups) {
    const lemma = g.lemma || g.uk;
    const showLemma = normalizeWord(lemma) !== rawKey;
    const posDe = POS_DE[g.pos] || '';
    list.append(h('div', { class: 'pop-entry' },
      g.emoji ? h('span', { class: 'pop-emoji', 'aria-hidden': 'true' }, g.emoji) : null,
      h('div', { class: 'pop-entry-main' },
        stressDiffers && g.uk && !showLemma ? h('div', { class: 'pop-form', lang: 'uk' }, matchCase(g.uk, raw)) : null,
        h('div', { class: 'pop-de-row' },
          h('strong', { class: 'pop-de', lang: 'de' }, g.de || '–'),
          posDe ? h('span', { class: 'pop-pos' }, posDe) : null),
        showLemma ? h('div', { class: 'pop-lemma' }, 'Grundform: ', h('span', { class: 'pop-lemma-uk', lang: 'uk' }, lemma)) : null,
        g.infos.length ? h('div', { class: 'pop-info' }, g.infos.join(' · ')) : null)));
  }
  body.append(list);
}

// ---------------------------------------------------------------- Positionierung
function reducedMotion() {
  try {
    return document.documentElement.dataset.motion === 'reduce' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch { return false; }
}

function safeInsets() {
  if (safe) return safe;
  const p = document.createElement('div');
  p.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;left:0;top:0;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
  document.body.append(p);
  const cs = getComputedStyle(p);
  safe = { top: parseFloat(cs.paddingTop) || 0, right: parseFloat(cs.paddingRight) || 0, bottom: parseFloat(cs.paddingBottom) || 0, left: parseFloat(cs.paddingLeft) || 0 };
  p.remove();
  return safe;
}

function wordRect(w) {
  const rects = [...w.getClientRects()].filter(r => r.width || r.height);
  if (!rects.length) return w.getBoundingClientRect();
  if (rects.length === 1 || !tapPoint) return rects[0];
  // mehrzeilig umbrochenes Wort (Bindestrich): Zeile nahe am Tap-Punkt
  let best = rects[0], bd = Infinity;
  for (const r of rects) {
    const d = Math.abs((r.top + r.bottom) / 2 - tapPoint.y);
    if (d < bd) { bd = d; best = r; }
  }
  return best;
}
let tapPoint = null;
document.addEventListener?.('pointerdown', e => { tapPoint = { x: e.clientX, y: e.clientY }; }, { capture: true, passive: true });

function place(el, wordEl) {
  const vv = window.visualViewport;
  const ins = safeInsets();
  const vx = vv ? vv.offsetLeft : 0, vy = vv ? vv.offsetTop : 0;
  const vw = vv ? vv.width : innerWidth, vh = vv ? vv.height : innerHeight;
  const minX = vx + Math.max(MARGIN, ins.left + 4), maxX = vx + vw - Math.max(MARGIN, ins.right + 4);
  const minY = vy + Math.max(MARGIN, ins.top + 4), maxY = vy + vh - Math.max(MARGIN, ins.bottom + 4);

  const width = Math.min(MAX_W, maxX - minX);
  el.style.maxHeight = '';
  el.style.width = '';
  el.style.maxWidth = width + 'px';
  el.style.left = '0px'; el.style.top = '0px';
  const r = wordRect(wordEl);
  const w = Math.min(Math.ceil(parseFloat(getComputedStyle(el).width) || el.offsetWidth), width);
  el.style.width = w + 'px';
  let hgt = el.offsetHeight;

  const spaceAbove = r.top - minY - GAP;
  const spaceBelow = maxY - r.bottom - GAP;
  let placeTop = hgt <= spaceAbove || (hgt > spaceBelow && spaceAbove >= spaceBelow);
  const avail = placeTop ? spaceAbove : spaceBelow;
  if (hgt > avail) { el.style.maxHeight = Math.max(80, avail) + 'px'; hgt = Math.max(80, avail); }
  let top = placeTop ? r.top - GAP - hgt : r.bottom + GAP;
  top = Math.max(minY, Math.min(top, maxY - hgt));

  const cx = r.left + r.width / 2;
  let left = Math.round(cx - w / 2);
  left = Math.max(minX, Math.min(left, maxX - w));
  const ax = Math.max(18, Math.min(cx - left, w - 18));

  el.dataset.place = placeTop ? 'top' : 'bottom';
  el.style.left = Math.round(left) + 'px';
  el.style.top = Math.round(top) + 'px';
  el.style.setProperty('--pop-ax', Math.round(ax) + 'px');
  el.style.transformOrigin = `${Math.round(ax)}px ${placeTop ? `calc(100% + ${ARROW}px)` : `-${ARROW}px`}`;
}
