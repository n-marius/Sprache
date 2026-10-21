// Prüft, dass alle App-Dateien im Service-Worker-Precache stehen und die Versionen übereinstimmen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const list = [...sw.matchAll(/'\.\/([^']*)'/g)].map(m => m[1]).filter(Boolean);

function walk(dir) {
  return fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}

test('alle js/css/icons-Dateien sind im Precache', () => {
  const files = [...walk('js'), ...walk('css'), ...walk('icons')].map(f => f.split(path.sep).join('/'));
  const missing = files.filter(f => !list.includes(f));
  assert.deepEqual(missing, []);
});

test('Precache-Einträge existieren', () => {
  const absent = list.filter(f => !fs.existsSync(path.join(ROOT, f)));
  assert.deepEqual(absent, []);
});

test('SW-VERSION = APP_VERSION', () => {
  const v1 = sw.match(/const VERSION = '([^']+)'/)[1];
  const cfg = fs.readFileSync(path.join(ROOT, 'js/config.js'), 'utf8');
  const v2 = cfg.match(/APP_VERSION = '([^']+)'/)[1];
  assert.equal(v1, v2);
});
