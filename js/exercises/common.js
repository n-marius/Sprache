// Gemeinsame Bausteine der Aufgaben-Komponenten: Optionen, Wortbausteine, Tastatur, Normalisierung.
import { h, ukText, deText, icon } from '../ui/dom.js';
import { tokenize, normalizeSentence, stripStress } from '../lib/uk-text.js';
import { haptic } from '../ui/haptics.js';

export const reducedMotion = () => {
  try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

/** Deutsche Hilfen anzeigen? (settings.showGermanHints, Standard an) */
export const hintsOn = ctx => ctx?.settings?.showGermanHints !== false;

/** Dezenter deutscher Hinweis (null, wenn ausgeschaltet oder leer). */
export function hintDe(text, ctx, cls = '') {
  if (!text || !hintsOn(ctx)) return null;
  return deText(text, { cls: ['ex-hint', cls].filter(Boolean).join(' ') });
}

/** Ist der Text eine reine Vokabelabfrage (einzelnes Wort oder exakt eine Vokabel)? → nicht antippbar. */
export function isVocabQuery(text, ex, ctx) {
  const n = normalizeSentence(String(text || ''));
  if (!n) return false;
  if (!n.includes(' ')) return true;
  const vb = ctx?.app?.content?.vocabById;
  for (const id of ex?.vocab || []) {
    const v = vb?.get?.(id);
    if (v && normalizeSentence(v.uk) === n) return true;
  }
  return false;
}

/** Mischen mit Originalindex; Index 0 ist laut Vertrag die richtige Option. */
export function shuffledOptions(list, ctx) {
  const items = (list || []).map((value, i) => ({ value, i, correct: i === 0 }));
  return (ctx?.shuffle || defaultShuffle)(items);
}

export function defaultShuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Mischen, aber garantiert nicht in Originalreihenfolge (für Satzbau/Dialog). */
export function shuffleNotIdentity(items, ctx, same = (a, b) => a === b) {
  const sh = ctx?.shuffle || defaultShuffle;
  let out = sh(items);
  for (let k = 0; k < 6 && items.length > 1 && out.every((x, i) => same(x, items[i])); k++) out = sh(items);
  if (items.length > 1 && out.every((x, i) => same(x, items[i]))) out = [...out.slice(1), out[0]];
  return out;
}

// ---------- Deutsch: tolerante Normalisierung (klein, ohne Satzzeichen, Apostroph-Varianten) ----------
const DE_WORD = /[\p{L}\p{N}]+(?:[’'ʼ‘`´-][\p{L}\p{N}]+)*/gu;
export function normalizeDe(s) {
  return (String(s ?? '').normalize('NFC').toLowerCase().replace(/[ʼ'`´‘’]/g, '’').match(DE_WORD) || []).join(' ');
}

/** Wörter eines Satzes für Wortbausteine (ohne Satzzeichen, Betonung/Groß-Klein bleiben sichtbar). */
export function wordTokens(text, lang) {
  if (lang === 'uk') {
    const parts = tokenize(String(text ?? ''));
    const out = [];
    // Ziffern/Lateinisches zwischen kyrillischen Wörtern ebenfalls als Baustein übernehmen
    for (const p of parts) {
      if (p.word) out.push(p.text);
      else for (const m of p.text.matchAll(/[\p{L}\p{N}]+/gu)) out.push(m[0]);
    }
    return out;
  }
  return String(text ?? '').normalize('NFC').match(DE_WORD) || [];
}

/** Satzvergleich: Ukrainisch ohne Betonung (normalizeSentence), Deutsch tolerant (normalizeDe). */
export function sameSentence(a, b, lang) {
  if (lang === 'uk') {
    return normalizeSentence(a) === normalizeSentence(b) && normalizeDe(stripStress(a)) === normalizeDe(stripStress(b));
  }
  return normalizeDe(a) === normalizeDe(b);
}

// ---------- Tastatur (iPad mit Tastatur): Ziffern wählen ----------
export function overlayOpen() {
  return !!document.querySelector('.sheet.is-open, .alert.is-open');
}
export function keyHandler(fn) {
  const onKey = e => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (overlayOpen()) return;
    if (fn(e) === true) e.preventDefault();
  };
  document.addEventListener('keydown', onKey);
  return () => document.removeEventListener('keydown', onKey);
}
export const digitOf = e => (/^[0-9]$/.test(e.key) ? (e.key === '0' ? 10 : +e.key) : null);

// ---------- Antwortoptionen ----------
export function optionButton(content, { key, cls, onClick, label } = {}) {
  return h('button', {
    type: 'button', class: ['option', 'ex-option', cls], 'aria-label': label || null,
    on: onClick ? { click: onClick } : null,
  },
    key != null ? h('span', { class: 'option-key', 'aria-hidden': 'true' }, String(key)) : null,
    h('span', { class: 'ex-option-label' }, content));
}

/**
 * Einfachauswahl. items: [{value, correct}], renderItem(item) → Node.
 * → {el, buttons, selected, index, select(i), reveal(), lock(), destroy()}
 */
export function singleChoice({ items, renderItem, onSelect, cls, keyboard = true, keys = true }) {
  let sel = -1, locked = false;
  const buttons = items.map((it, i) => optionButton(renderItem(it, i), { key: keys ? i + 1 : null, onClick: () => select(i) }));
  const el = h('div', { class: ['options', 'ex-options', cls], role: 'radiogroup' }, buttons);
  buttons.forEach(b => b.setAttribute('role', 'radio'));
  function select(i) {
    if (locked || i < 0 || i >= items.length) return;
    sel = i;
    buttons.forEach((b, j) => { b.classList.toggle('is-selected', j === i); b.setAttribute('aria-checked', String(j === i)); });
    haptic('select');
    onSelect?.(items[i], i);
  }
  const off = keyboard ? keyHandler(e => { const n = digitOf(e); if (n && n <= items.length && !locked) { select(n - 1); return true; } }) : () => {};
  return {
    el, buttons,
    get selected() { return sel < 0 ? null : items[sel]; },
    get index() { return sel; },
    select,
    lock() { locked = true; off(); buttons.forEach(b => b.classList.add('is-disabled')); },
    reveal() {
      locked = true; off();
      buttons.forEach((b, j) => {
        b.classList.remove('is-selected');
        b.classList.add('is-disabled');
        if (items[j].correct) b.classList.add('is-correct');
        else if (j === sel) b.classList.add('is-wrong');
        else b.classList.add('is-dimmed');
      });
    },
    destroy() { off(); },
  };
}

// ---------- Wortbausteine (Satzbau wie Duolingo) ----------
function fly(fromRect, toEl) {
  if (reducedMotion() || !toEl.animate || !fromRect) return;
  const b = toEl.getBoundingClientRect();
  const dx = fromRect.left - b.left, dy = fromRect.top - b.top;
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
  toEl.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
    { duration: 280, easing: 'cubic-bezier(.22,.9,.3,1)' });
}

/**
 * chipBuilder({words, lang, ctx, onChange, speak}) → {el, text(), tokens(), lock(), reveal(ok), destroy()}
 * words: alle Bausteine (Antwort + Distraktoren), werden gemischt.
 */
export function chipBuilder({ words, lang = 'uk', ctx, onChange, speak = lang === 'uk' }) {
  const bank = shuffleNotIdentity(words.map((w, i) => ({ w, i })), ctx, (a, b) => a.i === b.i);
  const line = h('div', { class: 'ex-build-line', 'aria-label': 'Antwort', role: 'list' });
  const lineWrap = h('div', { class: 'ex-build-answer' }, line);
  const bankEl = h('div', { class: 'ex-build-bank', role: 'list' });
  const placed = []; // {b, el}
  let locked = false;
  const label = w => (lang === 'uk' ? ukText(w, { tap: false }) : h('span', { lang: 'de' }, w));
  const bankBtns = bank.map((b, k) => {
    const btn = h('button', { type: 'button', class: 'chip ex-chip', role: 'listitem', on: { click: () => add(k) } }, label(b.w));
    bankEl.append(btn);
    return btn;
  });
  function changed() { line.classList.toggle('has-chips', placed.length > 0); onChange?.(placed.length > 0); }
  function add(k) {
    if (locked || bankBtns[k].classList.contains('is-used')) return;
    const from = bankBtns[k].getBoundingClientRect();
    const el = h('button', { type: 'button', class: 'chip ex-chip', role: 'listitem', on: { click: () => remove(entry) } }, label(bank[k].w));
    const entry = { k, el };
    placed.push(entry);
    line.append(el);
    bankBtns[k].classList.add('is-used');
    bankBtns[k].setAttribute('aria-hidden', 'true');
    fly(from, el);
    haptic('select');
    if (speak && ctx?.settings?.autoplay !== false) ctx?.app?.tts?.speak?.(bank[k].w)?.catch?.(() => {});
    changed();
  }
  function remove(entry) {
    if (locked) return;
    const i = placed.indexOf(entry);
    if (i < 0) return;
    const from = entry.el.getBoundingClientRect();
    // Positionen der folgenden Chips merken (FLIP), damit sie weich nachrücken
    const after = placed.slice(i + 1).map(p => [p.el, p.el.getBoundingClientRect()]);
    placed.splice(i, 1);
    entry.el.remove();
    const target = bankBtns[entry.k];
    target.classList.remove('is-used');
    target.removeAttribute('aria-hidden');
    fly(from, target);
    for (const [el, r] of after) fly(r, el);
    haptic('light');
    changed();
  }
  const off = keyHandler(e => {
    if (locked) return;
    const n = digitOf(e);
    if (n && n <= bankBtns.length) { add(n - 1); return true; }
    if (e.key === 'Backspace' && placed.length) { remove(placed[placed.length - 1]); return true; }
  });
  const el = h('div', { class: 'ex-build' }, lineWrap, bankEl);
  return {
    el,
    tokens: () => placed.map(p => bank[p.k].w),
    text: () => placed.map(p => bank[p.k].w).join(' '),
    lock() { locked = true; off(); el.classList.add('is-locked'); },
    reveal(ok) {
      locked = true; off(); el.classList.add('is-locked');
      placed.forEach(p => p.el.classList.add(ok ? 'is-correct' : 'is-wrong'));
    },
    destroy() { off(); },
  };
}

/** Stoppt, dass Klicks auf eingebettete Buttons (z. B. Lautsprecher) die umgebende Karte auslösen. */
export function isolate(el) {
  const wrap = h('span', { class: 'ex-isolate' }, el);
  for (const ev of ['click', 'pointerup', 'pointerdown']) wrap.addEventListener(ev, e => e.stopPropagation());
  return wrap;
}

/** Kleiner Umschalter „Übersetzung zeigen/ausblenden“. */
export function revealToggle({ labelShow = 'Übersetzung zeigen', labelHide = 'Übersetzung ausblenden', content, open = false, cls = '' }) {
  const box = h('div', { class: ['ex-reveal-body', cls] }, content);
  box.hidden = !open;
  const txt = h('span', open ? labelHide : labelShow);
  const btn = h('button', {
    type: 'button', class: 'ex-reveal-btn', 'aria-expanded': String(open),
    on: { click: () => { box.hidden = !box.hidden; txt.textContent = box.hidden ? labelShow : labelHide; btn.setAttribute('aria-expanded', String(!box.hidden)); btn.classList.toggle('is-open', !box.hidden); } },
  }, icon('chevron-down', { cls: 'ex-reveal-chev' }), txt);
  if (open) btn.classList.add('is-open');
  return { btn, box, el: h('div', { class: 'ex-reveal' }, btn, box) };
}

export { h, ukText, deText, icon };

/** Anweisungs-Key je Aufgabe (ui-strings), Fallback für Module ohne eigenes instructionKey(). */
export function instructionKey(ex) {
  switch (ex.type) {
    case 'mc_translate': return 'choose_translation';
    case 'build_sentence': return ex.dir === 'uk-de' ? 'translate_to_de' : 'translate_to_uk';
    case 'cloze': return 'fill_gap';
    case 'chat': return 'chat';
    case 'reading': return 'read_and_answer';
    case 'listening': return ex.mode === 'build' ? 'listen_and_build' : 'listen_and_choose';
    case 'speak': return 'say_aloud';
    case 'match_pairs': return 'match_pairs';
    case 'picture_choice': return 'choose_picture';
    case 'true_false': return 'true_false';
    case 'order_dialog': return 'order_dialog';
    default: return 'check';
  }
}
