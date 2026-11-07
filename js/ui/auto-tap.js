// Globale Absicherung „jedes ukrainische Wort ist übersetzbar“: wandelt verbliebene kyrillische Textknoten
// (die nicht über ukText gerendert wurden) in antippbare Wörter um. In Buttons/Links/Tabs → langer Druck (.uk-hold).
// Ausgenommen: Antwortoptionen und Quizkarten (.uk-notap), Eingabefelder, Elemente mit .no-tap.
import { tokenize, isFragment } from '../lib/uk-text.js';

const CYR = /[Ѐ-ӿ]/;
const SKIP = '.w, .uk, .uk-notap, .no-tap, input, textarea, select, [contenteditable], script, style, svg, .pop';
const HOLD = 'a, button, [role="tab"], [role="button"], label, summary';

function wrapText(node) {
  const el = node.parentElement;
  if (!el || el.closest(SKIP)) return;
  const text = node.textContent;
  if (!CYR.test(text)) return;
  const hold = !!el.closest(HOLD);
  const span = document.createElement('span');
  span.className = `uk ${hold ? 'uk-hold' : 'uk-tap'} uk-auto`;
  span.lang = 'uk';
  const parts = tokenize(text);
  for (const [i, p] of parts.entries()) {
    if (p.word && !isFragment(parts, i)) {
      const w = document.createElement('span');
      w.className = 'w'; w.dataset.k = p.key; w.textContent = p.text;
      span.append(w);
    } else span.append(document.createTextNode(p.text));
  }
  node.replaceWith(span);
}

export function autoTap(root) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: n => (CYR.test(n.textContent) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  const list = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) list.push(n);
  list.forEach(wrapText);
}

/** Beobachtet die App und wendet autoTap gebündelt pro Frame an. */
export function initAutoTap(root = document.body) {
  if (typeof MutationObserver === 'undefined') return;
  let pending = false;
  const run = () => { pending = false; autoTap(root); };
  new MutationObserver(() => { if (!pending) { pending = true; requestAnimationFrame(run); } })
    .observe(root, { childList: true, subtree: true, characterData: true });
  autoTap(root);
}
