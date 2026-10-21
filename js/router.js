// Hash-Router. Routen-Muster mit :param; Query im Hash (#/x?a=1) → params.query.
import { renderTabbar } from './ui/shell.js';
import { clear, h } from './ui/dom.js';
import { anim } from './ui/anim.js';

const ROUTES = [
  { pattern: '/today', load: () => import('./views/today.js'), tab: 'today' },
  { pattern: '/course', load: () => import('./views/course.js'), tab: 'course' },
  { pattern: '/lesson/:id', load: () => import('./views/lesson.js'), tab: 'course' },
  { pattern: '/words', load: () => import('./views/words.js'), tab: 'words' },
  { pattern: '/session/lesson/:id', load: () => import('./views/session.js'), tab: null, mode: 'lesson' },
  { pattern: '/session/review', load: () => import('./views/session.js'), tab: null, mode: 'review' },
  { pattern: '/summary', load: () => import('./views/summary.js'), tab: null },
  { pattern: '/settings', load: () => import('./views/settings.js'), tab: 'settings' },
  { pattern: '/reports', load: () => import('./views/reports.js'), tab: 'settings' },
];

function match(path) {
  const segs = path.split('/').filter(Boolean);
  for (const r of ROUTES) {
    const ps = r.pattern.split('/').filter(Boolean);
    if (ps.length !== segs.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < ps.length; i++) {
      if (ps[i].startsWith(':')) params[ps[i].slice(1)] = decodeURIComponent(segs[i]);
      else if (ps[i] !== segs[i]) { ok = false; break; }
    }
    if (ok) return { route: r, params };
  }
  return null;
}

export class Router {
  constructor(app) {
    this.app = app;
    this.current = null;
    this.badges = {};
    this.token = 0;
    addEventListener('hashchange', () => this.resolve());
  }

  navigate(hash, { replace = false } = {}) {
    if (!hash.startsWith('#')) hash = '#' + hash;
    if (replace) { history.replaceState(null, '', hash); this.resolve(); }
    else if (location.hash === hash) this.resolve();
    else location.hash = hash;
  }

  setBadges(b) { this.badges = b; if (this.current) renderTabbar(this.current.route.tab, b); }

  async resolve() {
    const raw = location.hash.replace(/^#/, '') || '/today';
    const [path, qs] = raw.split('?');
    const m = match(path) || match('/today');
    const my = ++this.token;
    const view = document.getElementById('view');
    try {
      const mod = await m.route.load();
      if (my !== this.token) return;
      if (this.current?.instance?.destroy) { try { this.current.instance.destroy(); } catch (e) { console.error(e); } }
      const params = { ...m.params, mode: m.route.mode, query: new URLSearchParams(qs || '') };
      let out = await mod.render(params, this.app);
      if (my !== this.token) { out?.destroy?.(); return; }
      const instance = out instanceof Node ? { el: out } : (out || { el: h('div') });
      document.body.classList.toggle('is-fullscreen', !m.route.tab);
      clear(view).append(instance.el);
      if (m.route.tab) renderTabbar(m.route.tab, this.badges);
      window.scrollTo(0, 0);
      try { anim.viewIn?.(instance.el); } catch {}
      this.current = { route: m.route, params, instance };
      instance.onShow?.();
    } catch (e) {
      console.error('View-Fehler', e);
      clear(view).append(h('div', { class: 'empty' },
        h('div', { class: 'empty-glyph' }, '⚠️'),
        h('p', 'Diese Ansicht konnte nicht geladen werden.'),
        h('p', { class: 't-foot t-3', style: { marginTop: '8px' } }, String(e && e.message || e)),
        h('a', { class: 'btn btn-secondary', href: '#/today', style: { marginTop: '16px' } }, 'Zur Startseite')));
      renderTabbar(m.route.tab || 'today', this.badges);
      document.body.classList.remove('is-fullscreen');
    }
  }
}
