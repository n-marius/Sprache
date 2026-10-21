// Boot: Zustand laden → Inhalte laden → Lexikon → Dienste → Router → Service Worker.
import { APP_VERSION } from './config.js';
import { store } from './store.js';
import { content } from './content.js';
import { buildLexicon } from './lexicon.js';
import { setStrings, t } from './i18n.js';
import { setApp } from './app-context.js';
import { Router } from './router.js';
import { applyTheme } from './ui/theme.js';
import { h } from './ui/dom.js';
import { banner, toast } from './ui/shell.js';
import { tts } from './services/tts.js';
import { stt } from './services/stt.js';
import { initPopover } from './ui/popover.js';

const query = new URLSearchParams(location.search);

function hideBoot() {
  const b = document.getElementById('boot');
  if (b) { b.classList.add('is-done'); setTimeout(() => b.remove(), 400); }
}

function fatal(err) {
  console.error(err);
  hideBoot();
  const v = document.getElementById('view');
  v.replaceChildren(h('div', { class: 'empty', style: { paddingTop: '30vh' } },
    h('div', { class: 'empty-glyph' }, '📚'),
    h('p', { class: 't-headline' }, 'Inhalte konnten nicht geladen werden.'),
    h('p', { class: 't-foot t-2', style: { marginTop: '8px' } }, String(err?.message || err)),
    h('button', { class: 'btn btn-blue', style: { marginTop: '20px' }, on: { click: () => location.reload() } }, 'Erneut versuchen')));
}

async function registerSW(app) {
  if (!('serviceWorker' in navigator) || query.has('nosw')) return;
  try {
    const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
    const sendPrecache = () => {
      const target = reg.active || navigator.serviceWorker.controller;
      target?.postMessage({ type: 'precache', urls: app.content.urls });
    };
    navigator.serviceWorker.ready.then(sendPrecache);
    const offerUpdate = worker => {
      banner(h('div', h('strong', 'Neue Version verfügbar'), h('div', { class: 't-foot t-2' }, 'Aktualisieren, um sie zu laden.')), [
        h('button', { class: 'btn btn-blue btn-sm', on: { click: () => worker.postMessage({ type: 'skipWaiting' }) } }, 'Aktualisieren'),
      ]);
    };
    if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w?.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(w);
      });
    });
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return; reloading = true; location.reload();
    });
    // Beim Zurückkehren in die App nach Updates sehen
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
  } catch (e) { console.warn('SW-Registrierung fehlgeschlagen', e); }
}

async function boot() {
  await store.init();
  applyTheme(store.state.settings.theme);
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => applyTheme(store.state.settings.theme));

  try { await content.load(); } catch (e) { fatal(e); return; }
  setStrings(content.uiStrings);
  const lexicon = buildLexicon(content);

  const app = {
    version: APP_VERSION,
    content, store, lexicon, tts, stt, t,
    router: null,
    lastSummary: null,
    navigate: (hash, opts) => app.router.navigate(hash, opts),
  };
  setApp(app);
  window.__app = app; // Debug/Tests

  try { tts.init?.(store.state.settings); } catch (e) { console.warn(e); }
  try { initPopover(app); } catch (e) { console.warn(e); }

  app.router = new Router(app);
  await app.router.resolve();
  hideBoot();

  if (content.isFixture && !query.has('content')) toast('Demo-Inhalte (Fixtures) – echte Inhalte fehlen noch.', { ms: 3500 });
  if (store.state.meta.seenVersion !== APP_VERSION) store.update(s => { s.meta.seenVersion = APP_VERSION; }, { silent: true });
  registerSW(app);
}

boot().catch(fatal);
