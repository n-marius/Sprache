// DOM-Helfer: h(), ukText() (antippbare Wörter), Icons (SF-Symbols-ähnliche Inline-SVGs).
import { tokenize } from '../lib/uk-text.js';

const SVGNS = 'http://www.w3.org/2000/svg';

/**
 * h('div', {class:'x', on:{click}, dataset:{a:1}, style:{…}}, child, 'text', [children])
 * attrs.html setzt innerHTML (nur für vertrauenswürdige, statische Inhalte!).
 */
export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) {
    children.unshift(attrs); attrs = null;
  }
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class' || k === 'className') el.className = Array.isArray(v) ? v.filter(Boolean).join(' ') : v;
      else if (k === 'style' && typeof v === 'object') {
        for (const [sk, sv] of Object.entries(v)) {
          if (sv == null) continue;
          if (sk.startsWith('--')) el.style.setProperty(sk, String(sv)); else el.style[sk] = sv;
        }
      }
      else if (k === 'on') for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k === 'html') el.innerHTML = v;
      else if (k in el && typeof v !== 'string') el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  append(el, children);
  return el;
}

export function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function clear(el) { while (el.firstChild) el.firstChild.remove(); return el; }

/**
 * Ukrainischer Text; jedes Wort als <span class="w" data-k="key">.
 * tap:false → nicht antippbar (Antwortoptionen, reine Vokabelabfragen).
 */
export function ukText(text, { tap = true, cls = '', tag = 'span' } = {}) {
  const el = document.createElement(tag);
  el.className = ['uk', tap ? 'uk-tap' : 'uk-notap', cls].filter(Boolean).join(' ');
  el.lang = 'uk';
  for (const p of tokenize(String(text ?? ''))) {
    if (p.word) {
      const s = document.createElement('span');
      s.className = 'w';
      s.dataset.k = p.key;
      s.textContent = p.text;
      el.append(s);
    } else el.append(document.createTextNode(p.text));
  }
  return el;
}

export function deText(text, { cls = '', tag = 'span' } = {}) {
  const el = document.createElement(tag);
  el.className = ['de', cls].filter(Boolean).join(' ');
  el.lang = 'de';
  el.textContent = text ?? '';
  return el;
}

/** Mini-Markdown für Grammatik (nur **fett** und Zeilenumbrüche), sicher escaped. */
export function richText(text, { tag = 'p', cls = '' } = {}) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  const parts = String(text ?? '').split(/(\*\*[^*]+\*\*|\n)/);
  for (const p of parts) {
    if (!p) continue;
    if (p === '\n') el.append(document.createElement('br'));
    else if (p.startsWith('**') && p.endsWith('**')) { const b = document.createElement('strong'); b.textContent = p.slice(2, -2); el.append(b); }
    else el.append(document.createTextNode(p));
  }
  return el;
}

// ---------- Icons (24×24, Strich 2, runde Enden) ----------
const ICONS = {
  'today': '<path d="M12 3v2M12 19v2M5.6 5.6 7 7M17 17l1.4 1.4M3 12h2M19 12h2M5.6 18.4 7 17M17 7l1.4-1.4"/><circle cx="12" cy="12" r="4"/>',
  'course': '<path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4z"/><path d="M9 4v14M15 6v14"/>',
  'words': '<rect x="4" y="3.5" width="13" height="17" rx="2.5"/><path d="M8 3.5v17M20 7v13.5"/><path d="M11 8h3M11 11.5h3"/>',
  'settings': '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  'chevron-right': '<path d="m9 5 7 7-7 7"/>',
  'chevron-left': '<path d="m15 5-7 7 7 7"/>',
  'chevron-down': '<path d="m5 9 7 7 7-7"/>',
  'close': '<path d="M6 6l12 12M18 6 6 18"/>',
  'flag': '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  'speaker': '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  'turtle': '<path d="M5 14c0-3.9 3.1-7 7-7s7 3.1 7 7H5z"/><path d="M19 14h1.5a1.5 1.5 0 0 0 0-3H19M7 14l-1 3M17 14l1 3M9 7.5 10.5 14M15 7.5 13.5 14M5.5 11.5h13"/>',
  'mic': '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
  'check': '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  'x': '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  'flame': '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.3 2.4-5.4 3.8-7.6.5 1.5 1.4 2.6 2.4 3.1C11.6 7 13 4.6 15 3c.3 2.6 1.4 4.3 2.4 5.9 1 1.6 1.6 3.2 1.6 5.2 0 4-3 6.9-7 6.9z"/><path d="M12 21c-1.7 0-3-1.3-3-3.1 0-1.7 1.3-2.7 2.2-3.9.4.9 1 1.4 1.6 1.6.2-1 .6-1.8 1.2-2.4.6 1.2 1 2.2 1 3.4 0 2.6-1.3 4.4-3 4.4z"/>',
  'snow': '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5"/>',
  'star': '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  'clock': '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  'calendar': '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  'share': '<path d="M12 15V3.5M8 7l4-4 4 4"/><path d="M8.5 10.5H6.5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-2"/>',
  'copy': '<rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2.5"/><path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5"/>',
  'download': '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/>',
  'cloud': '<path d="M7 18.5a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 9.6a4.5 4.5 0 0 1-.5 8.9H7z"/>',
  'trash': '<path d="M4.5 6.5h15M9.5 6.5V4.5h5v2M6.5 6.5l1 13h9l1-13M10 10.5v6M14 10.5v6"/>',
  'info': '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.2"/>',
  'lock': '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  'play': '<path d="M8 5.5v13l10.5-6.5z"/>',
  'refresh': '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4"/>',
  'target': '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  'sparkles': '<path d="M10 4.5 11.6 9 16 10.5 11.6 12 10 16.5 8.4 12 4 10.5 8.4 9zM17.5 14l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  'trophy': '<path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H4.5a3 3 0 0 0 3.6 4M16 6h3.5a3 3 0 0 1-3.6 4M12 13v4M8.5 20.5h7M9.5 17h5v3.5h-5z"/>',
  'bulb': '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  'chat': '<path d="M5 18.5V7.5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H8.5z"/>',
  'book': '<path d="M12 6.5C10.5 5 8 4.5 4 4.5v14c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-14c-4 0-6.5.5-8 2zM12 6.5v14"/>',
  'ear': '<path d="M7 9a5 5 0 0 1 10 0c0 3-2.5 4-3 6.5-.4 2-1.6 3.5-3.5 3.5A2.5 2.5 0 0 1 8 16.5"/><path d="M10 9.5a2 2 0 0 1 4 0c0 1.2-1 1.6-1.5 2.5"/>',
  'plus': '<path d="M12 5v14M5 12h14"/>',
  'search': '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  'headphones': '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3.5" y="14" width="4.5" height="6.5" rx="2"/><rect x="16" y="14" width="4.5" height="6.5" rx="2"/>',
  'ellipsis': '<circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/>',
  'person': '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
  'chart': '<path d="M4 20.5h16M7 17v-5M12 17V7M17 17v-8"/>',
  'moon': '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
  'shuffle': '<path d="M4 7h3.5c4 0 5 10 9 10H20M4 17h3.5c1.6 0 2.7-1.6 3.6-3.5M13 10.5C13.9 8.6 15 7 16.5 7H20M17.5 4.5 20 7l-2.5 2.5M17.5 14.5 20 17l-2.5 2.5"/>',
  'github': '<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
};

export function icon(name, { size, cls = '', fill = false, label } = {}) {
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', fill ? 'currentColor' : 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('class', ['icon', `icon-${name}`, cls].filter(Boolean).join(' '));
  if (size) { svg.setAttribute('width', size); svg.setAttribute('height', size); }
  if (label) { svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', label); } else svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = ICONS[name] || ICONS.info;
  return svg;
}
export const iconNames = Object.keys(ICONS);

/** Zahl mit Einheit auf Deutsch, z. B. plural(3, 'Wort', 'Wörter') */
export function plural(n, one, many) { return `${n} ${n === 1 ? one : many}`; }

export function formatDateDE(d) {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
