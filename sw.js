// Service Worker: Offline-Cache für App + Inhalte, Versionierung mit Update-Hinweis.
// VERSION muss mit APP_VERSION in js/config.js übereinstimmen.
const VERSION = '1.0.0';
const APP_CACHE = `mova-app-${VERSION}`;
const CONTENT_CACHE = 'mova-content';
const RUNTIME_CACHE = 'mova-runtime';

const APP_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './css/tokens.css',
  './css/base.css',
  './css/components.css',
  './css/views.css',
  './css/course.css',
  './css/session.css',
  './css/exercises.css',
  './css/ex-build.css',
  './css/ex-dialog.css',
  './css/audio.css',
  './css/popover.css',
  './css/settings.css',
  './css/reports.css',
  './css/animations.css',
  './js/main.js',
  './js/config.js',
  './js/app-context.js',
  './js/router.js',
  './js/store.js',
  './js/content.js',
  './js/lexicon.js',
  './js/i18n.js',
  './js/lib/uk-text.js',
  './js/ui/dom.js',
  './js/ui/shell.js',
  './js/ui/theme.js',
  './js/ui/haptics.js',
  './js/ui/anim.js',
  './js/ui/popover.js',
  './js/ui/audio-button.js',
  './js/ui/report-sheet.js',
  './js/services/tts.js',
  './js/services/stt.js',
  './js/services/reports.js',
  './js/services/gist.js',
  './js/services/export.js',
  './js/engine/session.js',
  './js/engine/srs.js',
  './js/engine/review-gen.js',
  './js/engine/progress.js',
  './js/exercises/index.js',
  './js/exercises/common.js',
  './js/exercises/mc_translate.js',
  './js/exercises/picture_choice.js',
  './js/exercises/true_false.js',
  './js/exercises/listening.js',
  './js/exercises/build_sentence.js',
  './js/exercises/cloze.js',
  './js/exercises/order_dialog.js',
  './js/exercises/match_pairs.js',
  './js/exercises/chat.js',
  './js/exercises/reading.js',
  './js/exercises/speak.js',
  './js/views/today.js',
  './js/views/course.js',
  './js/views/lesson.js',
  './js/views/words.js',
  './js/views/session.js',
  './js/views/summary.js',
  './js/views/settings.js',
  './js/views/reports.js',
];

const CONTENT_ROOT_FILES = ['curriculum.json', 'ui-strings.json', 'glossary-common.json'];

async function precacheContent(base = 'content/') {
  const cache = await caches.open(CONTENT_CACHE);
  try {
    const res = await fetch(base + 'curriculum.json', { cache: 'reload' });
    if (!res.ok) return;
    const cur = await res.clone().json();
    await cache.put(base + 'curriculum.json', res);
    const files = CONTENT_ROOT_FILES.slice(1).map(f => base + f);
    for (const p of cur.phases || []) for (const l of p.lessons || []) if (l.file && l.status === 'ready') files.push(base + l.file);
    await Promise.all(files.map(async f => {
      try { const r = await fetch(f, { cache: 'reload' }); if (r.ok) await cache.put(f, r); } catch {}
    }));
  } catch { /* offline oder keine Inhalte – App fällt auf Fixtures zurück */ }
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(APP_CACHE);
    // Einzeln laden, damit eine fehlende Datei nicht die ganze Installation scheitern lässt
    await Promise.all(APP_ASSETS.map(async url => {
      try { const r = await fetch(url, { cache: 'reload' }); if (r.ok) await cache.put(url, r); } catch {}
    }));
    await precacheContent('content/');
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('mova-app-') && k !== APP_CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  const d = event.data || {};
  if (d.type === 'skipWaiting') self.skipWaiting();
  if (d.type === 'precache' && Array.isArray(d.urls)) {
    event.waitUntil((async () => {
      const cache = await caches.open(CONTENT_CACHE);
      await Promise.all(d.urls.map(async u => {
        try { const url = new URL(u, self.registration.scope).href; if (!(await cache.match(url))) { const r = await fetch(url); if (r.ok) await cache.put(url, r); } } catch {}
      }));
    })());
  }
});

function isContent(url) {
  return url.pathname.endsWith('.json') && (url.pathname.includes('/content/') || url.pathname.includes('/tests/fixtures/'));
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // z. B. api.github.com nicht anfassen

  // Navigation: App-Shell aus dem Cache (Query wie ?content=… ignorieren)
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cached = await caches.match('./index.html', { ignoreSearch: true }) || await caches.match('./', { ignoreSearch: true });
      if (cached) return cached;
      try { return await fetch(req); } catch { return new Response('Offline', { status: 503 }); }
    })());
    return;
  }

  // Inhalte: Stale-while-revalidate (Aktualisierungen kommen beim nächsten Start an)
  if (isContent(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(CONTENT_CACHE);
      const key = url.origin + url.pathname;
      const cached = await cache.match(key);
      const network = fetch(req.url, { cache: 'no-cache' }).then(r => { if (r.ok) cache.put(key, r.clone()); return r; }).catch(() => null);
      if (cached) { event.waitUntil(network); return cached; }
      return (await network) || new Response('{"error":"offline"}', { status: 503, headers: { 'content-type': 'application/json' } });
    })());
    return;
  }

  // App-Assets: Cache-first (versionierter Cache), sonst Netz + Laufzeit-Cache
  event.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const r = await fetch(req);
      if (r.ok && r.type === 'basic') { const c = await caches.open(RUNTIME_CACHE); c.put(req, r.clone()); }
      return r;
    } catch {
      return new Response('', { status: 504 });
    }
  })());
});
