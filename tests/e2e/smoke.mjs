// Smoke-Test mit Playwright (Chromium aus /opt/pw-browsers): startet einen statischen Server, öffnet Routen,
// sammelt Konsolenfehler und speichert Screenshots. Aufruf: node tests/e2e/smoke.mjs [--dark] [--ipad] [--routes=#/today,#/course]
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('/opt/node22/lib/node_modules/playwright');

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT = process.env.SHOTS || path.join(ROOT, 'tests/e2e/shots');
const args = process.argv.slice(2);
const dark = args.includes('--dark');
const ipad = args.includes('--ipad');
const routesArg = args.find(a => a.startsWith('--routes='));
const routes = routesArg ? routesArg.slice(9).split(',') : ['#/today', '#/course', '#/lesson/a1-1-01', '#/words', '#/settings', '#/reports', '#/session/lesson/a1-1-01', '#/session/review'];
const qs = args.find(a => a.startsWith('--query='))?.slice(8) ?? '?content=tests/fixtures&nosw';

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
export function serve(port = 0) {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('nf'); return; }
      res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
      fs.createReadStream(f).pipe(res);
    }).listen(port, () => resolve(srv));
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const base = `http://localhost:${srv.address().port}/`;
  const browser = await chromium.launch({ executablePath: undefined });
  const ctx = await browser.newContext({
    ...(ipad ? { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2 } : { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 }),
    isMobile: true, hasTouch: true, colorScheme: dark ? 'dark' : 'light', locale: 'de-DE',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', e => errors.push(`[pageerror] ${e.message}`));
  for (const r of routes) {
    await page.goto(base + qs + r);
    await page.waitForTimeout(700);
    const name = `${ipad ? 'ipad' : 'iphone'}-${dark ? 'dark' : 'light'}-${r.replace(/[#/]+/g, '_').replace(/^_/, '')}.png`;
    await page.screenshot({ path: path.join(OUT, name), fullPage: false });
    console.log('shot', name);
  }
  console.log(errors.length ? errors.join('\n') : 'Keine Konsolenfehler.');
  await browser.close(); srv.close();
}
