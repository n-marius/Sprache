// App-Hülle: Tabbar, iOS-Seite mit Large Title, gruppierte Listen, Sheets, Toasts, Alerts.
import { h, icon, clear } from './dom.js';

export const TABS = [
  { id: 'today', label: 'Heute', icon: 'today', href: '#/today' },
  { id: 'course', label: 'Kurs', icon: 'course', href: '#/course' },
  { id: 'trainer', label: 'Trainer', icon: 'words', href: '#/trainer' },
  { id: 'library', label: 'Wissen', icon: 'book', href: '#/library' },
  { id: 'settings', label: 'Mehr', icon: 'settings', href: '#/settings' },
];

export function renderTabbar(active, badges = {}) {
  const bar = document.getElementById('tabbar');
  clear(bar);
  for (const t of TABS) {
    const b = badges[t.id];
    bar.append(h('a', {
      class: ['tab', t.id === active && 'is-active'], href: t.href,
      'aria-current': t.id === active ? 'page' : null,
    },
      h('span', { class: 'tab-icon' }, icon(t.icon), b ? h('span', { class: 'tab-badge' }, String(b)) : null),
      h('span', { class: 'tab-label' }, t.label)));
  }
}

/**
 * iOS-Seite: kompakte Navbar (Titel erscheint beim Scrollen) + Large Title.
 * back: {label, href} | true (history.back)
 */
export function page({ title, subtitle, largeTitle = true, back, trailing, leading, children = [], cls = '' } = {}) {
  const navTitle = h('div', { class: 'navbar-title' }, title || '');
  const lead = h('div', { class: 'navbar-leading' });
  if (back) {
    const label = back === true ? 'Zurück' : (back.label || 'Zurück');
    lead.append(h('button', {
      class: 'nav-back', type: 'button',
      on: { click: () => { if (back === true || !back.href) history.back(); else location.hash = back.href; } },
    }, icon('chevron-left'), h('span', label)));
  }
  if (leading) lead.append(leading);
  const trail = h('div', { class: 'navbar-trailing' }, trailing || null);
  const navbar = h('header', { class: ['navbar', !largeTitle && 'always-title'] }, lead, navTitle, trail);
  const sentinel = h('div', { class: 'page-sentinel', style: { height: '1px', marginTop: '-1px' } });
  const header = largeTitle ? h('div', { class: 'page-header' },
    h('h1', { class: 't-largetitle' }, title || ''),
    subtitle ? (subtitle instanceof Node ? subtitle : h('div', { class: 'page-subtitle' }, subtitle)) : null) : null;
  const body = h('div', { class: 'page-body' }, children);
  const el = h('div', { class: ['page', cls] }, navbar, sentinel, header, body);

  // Large Title → kompakter Titel beim Scrollen
  const watch = header || sentinel;
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(([e]) => {
      navbar.classList.toggle('is-scrolled', !e.isIntersecting);
    }, { rootMargin: `-${44 + 10}px 0px 0px 0px`, threshold: 0 });
    requestAnimationFrame(() => io.observe(watch));
  }
  el.body = body;
  return el;
}

/**
 * Gruppierte Liste. rows: [{title, subtitle, detail, icon:{name|emoji, color}, onClick, href, accessory, cls, el}]
 * accessory: 'chevron' | Element (z. B. switch()).
 */
export function listGroup({ header, footer, rows = [] } = {}) {
  const list = h('div', { class: 'list' });
  for (const r of rows) {
    if (!r) continue;
    if (r instanceof Node) { list.append(r); continue; }
    const tag = r.href ? 'a' : (r.onClick ? 'button' : 'div');
    const ic = r.icon ? h('span', { class: 'row-icon', style: { background: r.icon.color || 'var(--blue)' } },
      r.icon.emoji ? h('span', { class: 'emoji' }, r.icon.emoji) : icon(r.icon.name || 'info')) : null;
    const main = h('span', { class: 'row-main' },
      r.title instanceof Node ? r.title : h('span', { class: 'row-title' }, r.title ?? ''),
      r.subtitle ? (r.subtitle instanceof Node ? r.subtitle : h('span', { class: 'row-subtitle' }, r.subtitle)) : null);
    const detail = r.detail != null ? (r.detail instanceof Node ? r.detail : h('span', { class: 'row-detail' }, String(r.detail))) : null;
    const acc = r.accessory === 'chevron' ? icon('chevron-right', { cls: 'chevron' }) : (r.accessory || null);
    const row = h(tag, {
      class: ['list-row', ic && 'has-icon', r.cls, (r.onClick || r.href) && 'is-tappable'],
      href: r.href || null, type: tag === 'button' ? 'button' : null,
      on: r.onClick ? { click: r.onClick } : null,
    }, ic, main, detail, acc, r.el || null);
    list.append(row);
  }
  return h('section', { class: 'list-group' },
    header ? h('div', { class: 'section-header' }, header) : null,
    list,
    footer ? (footer instanceof Node ? h('div', { class: 'section-footer' }, footer) : h('div', { class: 'section-footer' }, footer)) : null);
}

/** iOS-Schalter: switchEl({checked, onChange}) */
export function switchEl({ checked = false, onChange, label } = {}) {
  const input = h('input', { type: 'checkbox', role: 'switch', 'aria-label': label || null });
  input.checked = !!checked;
  input.addEventListener('change', () => onChange?.(input.checked));
  return h('label', { class: 'switch' }, input, h('span', { class: 'switch-track' }));
}

/** Segmented Control: segmented({options:[{value,label}], value, onChange}) */
export function segmented({ options, value, onChange }) {
  const el = h('div', { class: 'segmented', role: 'tablist' });
  const render = v => {
    clear(el);
    for (const o of options) {
      el.append(h('button', {
        type: 'button', class: o.value === v ? 'is-active' : '', role: 'tab', 'aria-selected': String(o.value === v),
        on: { click: () => { render(o.value); onChange?.(o.value); } },
      }, o.label));
    }
  };
  render(value);
  return el;
}

const overlayRoot = () => document.getElementById('overlay-root') || document.body;

/**
 * Bottom-Sheet (iPhone) / zentriertes Panel (iPad).
 * sheet({title, content, actions:[Element], onClose, cancelLabel}) → {el, close()}
 */
export function sheet({ title = '', content, actions, onClose, cancelLabel } = {}) {
  const scrim = h('div', { class: 'scrim' });
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    scrim.classList.remove('is-open'); panel.classList.remove('is-open');
    setTimeout(() => { scrim.remove(); panel.remove(); }, 360);
    document.removeEventListener('keydown', onKey);
    onClose?.();
  };
  const onKey = e => { if (e.key === 'Escape') close(); };
  const header = h('div', { class: 'sheet-header' },
    cancelLabel ? h('button', { class: 'sheet-cancel', type: 'button', on: { click: close } }, cancelLabel) : h('span'),
    h('div', { class: 'sheet-title' }, title),
    h('button', { class: 'icon-btn filled sheet-close', type: 'button', 'aria-label': 'Schließen', on: { click: close } }, icon('close')));
  const body = h('div', { class: 'sheet-body' }, content);
  const acts = actions && actions.length ? h('div', { class: 'sheet-actions' }, actions) : null;
  const panel = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('div', { class: 'sheet-grabber' }), header, body, acts);
  scrim.addEventListener('click', close);
  // Wischen nach unten auf Griff/Kopf schließt (iPhone)
  let y0 = null;
  header.addEventListener('touchstart', e => { y0 = e.touches[0].clientY; }, { passive: true });
  header.addEventListener('touchend', e => { if (y0 != null && e.changedTouches[0].clientY - y0 > 60) close(); y0 = null; });
  overlayRoot().append(scrim, panel);
  document.addEventListener('keydown', onKey);
  requestAnimationFrame(() => requestAnimationFrame(() => { scrim.classList.add('is-open'); panel.classList.add('is-open'); }));
  return { el: panel, body, close };
}

let toastTimer = null;
export function toast(text, { kind = '', ms = 2200 } = {}) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const el = h('div', { class: ['toast', kind], role: 'status' }, text);
  overlayRoot().append(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-open')));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.remove('is-open'); setTimeout(() => el.remove(), 300); }, ms);
}

/** iOS-Alert. Promise<boolean> */
export function confirmDialog({ title, message, ok = 'OK', cancel = 'Abbrechen', destructive = false } = {}) {
  return new Promise(resolve => {
    const scrim = h('div', { class: 'scrim alert-scrim' });
    const done = v => {
      scrim.classList.remove('is-open'); box.classList.remove('is-open');
      setTimeout(() => { scrim.remove(); box.remove(); }, 220);
      resolve(v);
    };
    const box = h('div', { class: 'alert', role: 'alertdialog', 'aria-label': title },
      h('div', { class: 'alert-body' },
        h('div', { class: 'alert-title' }, title || ''),
        message ? h('div', { class: 'alert-message' }, message) : null),
      h('div', { class: 'alert-actions' },
        cancel ? h('button', { type: 'button', on: { click: () => done(false) } }, cancel) : null,
        h('button', { type: 'button', class: ['is-default', destructive && 'is-destructive'], on: { click: () => done(true) } }, ok)));
    overlayRoot().append(scrim, box);
    requestAnimationFrame(() => requestAnimationFrame(() => { scrim.classList.add('is-open'); box.classList.add('is-open'); }));
  });
}

/** Hinweisleiste oben (Update verfügbar etc.) */
export function banner(content, actions = []) {
  document.querySelectorAll('.banner').forEach(b => b.remove());
  const el = h('div', { class: 'banner', role: 'status' }, h('div', { class: 'spacer' }, content), actions);
  overlayRoot().append(el);
  return { el, close: () => el.remove() };
}
