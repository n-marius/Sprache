// Rendert icons/icon.svg in PNG-Größen (Playwright-Chromium aus /opt/pw-browsers). Aufruf: node tools/render-icons.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ROOT = path.resolve(import.meta.dirname, '..');
const svg = fs.readFileSync(path.join(ROOT, 'icons/icon.svg'), 'utf8');
const targets = [
  ['icon-192.png', 192, 0], ['icon-512.png', 512, 0], ['icon-maskable-512.png', 512, 0.1],
  ['apple-touch-icon.png', 180, 0], ['favicon-32.png', 32, 0],
];
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, pad] of targets) {
  await page.setViewportSize({ width: size, height: size });
  // pad: maskable – Motiv leicht verkleinern (Safe-Zone), Hintergrund vollflächig
  const inner = Math.round(size * (1 - pad * 2));
  await page.setContent(`<html><body style="margin:0;background:#0057B7;width:${size}px;height:${size}px;display:grid;place-items:center;overflow:hidden">
    <div style="width:${size}px;height:${size}px;position:absolute;inset:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</div>
    ${pad ? `<div style="position:absolute;inset:0;display:grid;place-items:center"><div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></div>` : ''}
  </body></html>`);
  await page.screenshot({ path: path.join(ROOT, 'icons', name), omitBackground: false });
  console.log('icon', name);
}
await browser.close();
