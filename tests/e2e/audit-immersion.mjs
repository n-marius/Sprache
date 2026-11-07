// Immersions-Audit: rendert alle Seiten und alle Aufgaben der freigeschalteten Lektionen und meldet
//  (1) antippbare Wörter ohne Lexikon-Eintrag („Nicht im Wörterbuch“),
//  (2) ukrainischen Text, der nicht antippbar ist (außer Antwortoptionen/Quizkarten = .uk-notap),
//  (3) deutschen Oberflächentext, der nicht als Hilfe (.de / Erklärung) markiert ist.
// Aufruf: node tests/e2e/audit-immersion.mjs [--json=pfad]
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { serve } = await import('./smoke.mjs');

const srv = await serve(); const base = `http://localhost:${srv.address().port}/?nosw`;
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'de-DE' })).newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));

await page.goto(base + '#/today'); await page.waitForTimeout(800);
const lessons = await page.evaluate(async () => (await import('./js/app-context.js')).getApp().content.readyLessons().map(l => l.id));
const exIds = await page.evaluate(async ids => {
  const app = (await import('./js/app-context.js')).getApp();
  return ids.flatMap(id => app.content.getLesson(id).exercises.map(e => `${id}|${e.id}`));
}, lessons);

const routes = ['#/today', '#/course', '#/library', '#/trainer', '#/settings', '#/reports', '#/games', '#/games/crossword', '#/games/memory', '#/games/forms',
  ...lessons.flatMap(id => [`#/lesson/${id}`, `#/explain/${id}`, `#/story/${id}`, `#/session/teach/${id}`, `#/session/test/${id}`, `#/session/lesson/${id}`])];
const concepts = await page.evaluate(async () => (await import('./js/concepts.js')).allConcepts((await import('./js/app-context.js')).getApp()).filter(c => !c.planned).map(c => c.id));
routes.push(...concepts.map(c => `#/concept/${c}`));
routes.push(...exIds.map(x => { const [l, e] = x.split('|'); return `#/dev/exercise?lesson=${l}&ex=${e}`; }));

const missing = new Map(), untappable = new Map(), german = new Map();
const add = (m, k, where) => { if (!m.has(k)) m.set(k, new Set()); m.get(k).add(where); };

for (const r of routes) {
  await page.goto(base + r); await page.waitForTimeout(r.includes('dev/exercise') ? 250 : 450);
  // alle Lektionen als freigeschaltet behandeln, damit gesperrte Seiten mitgeprüft werden
  const res = await page.evaluate(async () => {
    const app = (await import('./js/app-context.js')).getApp();
    const out = { missing: [], untappable: [], german: [] };
    const root = document.querySelector('#app') || document.body;
    for (const w of root.querySelectorAll('.uk-tap .w, .uk-hold .w')) if (!app.lexicon.has(w.textContent)) out.missing.push(w.textContent);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = n.textContent.trim(); if (!t) continue;
      const el = n.parentElement; if (!el || el.closest('[hidden], script, style, .dev-result, .t-foot.dev, .dev-exercise > .t-foot')) continue;
      if (el.closest('svg')) continue;
      const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      if (/[Ѐ-ӿ]/.test(t)) {
        if (!el.closest('.w, .uk, .uk-notap, .no-tap, input, textarea')) out.untappable.push(t.slice(0, 60));
      } else if (/[A-Za-zÄÖÜäöüß]{3,}/.test(t)) {
        if (!el.closest('.option, .chip, .mm-card, .cw-clue, .dev-exercise > .t-foot, .de, .ui-de, .xp-article, .lang-de, input, textarea, code, .r-item, .pop, .badge.dev, .exd-chat-scenario, .hint-de')) out.german.push(t.slice(0, 70));
      }
    }
    return out;
  });
  res.missing.forEach(k => add(missing, k, r));
  res.untappable.forEach(k => add(untappable, k, r));
  res.german.forEach(k => add(german, k, r.replace(/\?lesson=.*/, '')));
}
const dump = m => [...m.entries()].map(([k, v]) => `${k}  ⟵ ${[...v].slice(0, 3).join(', ')}${v.size > 3 ? ` (+${v.size - 3})` : ''}`);
const report = { routes: routes.length, missing: dump(missing), untappable: dump(untappable), german: dump(german), errors };
const jsonArg = process.argv.find(a => a.startsWith('--json='));
if (jsonArg) fs.writeFileSync(jsonArg.slice(7), JSON.stringify({ missing: [...missing.keys()], untappable: [...untappable.keys()], german: [...german.keys()] }, null, 1));
console.log(`Seiten/Aufgaben geprüft: ${report.routes}`);
console.log(`\n(1) Nicht im Wörterbuch: ${missing.size}\n` + report.missing.join('\n'));
console.log(`\n(2) Ukrainisch nicht antippbar: ${untappable.size}\n` + report.untappable.slice(0, 80).join('\n'));
console.log(`\n(3) Deutscher Oberflächentext: ${german.size}\n` + report.german.slice(0, 400).join('\n'));
if (errors.length) console.log('\nFehler:', errors.slice(0, 5));
await browser.close(); srv.close();
process.exitCode = missing.size || untappable.size ? 1 : 0;
