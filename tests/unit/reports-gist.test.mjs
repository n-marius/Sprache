// Gist-Sync mit gemocktem fetch.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { defaultState, migrate } from '../../js/store.js';
import { createReport } from '../../js/services/reports.js';
import {
  syncReports, backupProgress, restoreProgress, testToken, maybeAutoSync, maybeAutoBackup,
  REPORTS_FILE, BACKUP_FILE, GistError, errorMessage, _resetAutoBackupThrottle,
} from '../../js/services/gist.js';

function fakeApp(settings = {}) {
  const state = defaultState();
  Object.assign(state.settings, { gistToken: 'ghp_test' }, settings);
  return {
    version: '9.9.9', content: { base: 'content/', getMeta: () => null },
    store: {
      state,
      update(fn) { fn(this.state); },
      exportData() { return structuredClone(this.state); },
      importData(obj) { this.state = migrate(structuredClone(obj)); },
    },
  };
}

function res(status, body, headers = {}) {
  return {
    ok: status >= 200 && status < 300, status,
    headers: { get: k => headers[k.toLowerCase()] ?? null },
    json: async () => body, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  };
}

/** Mini-GitHub: speichert Gists im Speicher. */
function mockGitHub() {
  const gists = new Map();
  const calls = [];
  let n = 0;
  const fetchImpl = async (url, opts = {}) => {
    const method = opts.method || 'GET';
    const body = opts.body ? JSON.parse(opts.body) : null;
    calls.push({ url, method, body, headers: opts.headers });
    const path = url.replace('https://api.github.com', '');
    if (opts.headers?.Authorization !== 'Bearer ghp_test') return res(401, { message: 'Bad credentials' });
    if (method === 'POST' && path === '/gists') {
      const id = 'gist' + (++n);
      const files = {};
      for (const [k, v] of Object.entries(body.files)) files[k] = { filename: k, content: v.content, truncated: false };
      gists.set(id, { id, public: body.public, description: body.description, files, html_url: 'https://gist.github.com/' + id });
      return res(201, gists.get(id));
    }
    let m = path.match(/^\/gists\/([^/?]+)$/);
    if (m) {
      const g = gists.get(m[1]);
      if (!g) return res(404, { message: 'Not Found' });
      if (method === 'PATCH') {
        for (const [k, v] of Object.entries(body.files)) g.files[k] = { filename: k, content: v.content, truncated: false };
        return res(200, g);
      }
      return res(200, g);
    }
    if (path.startsWith('/gists?')) return res(200, [...gists.values()]);
    if (path === '/user') return res(200, { login: 'olena' }, { 'x-oauth-scopes': 'gist, read:user' });
    return res(404, { message: 'Not Found' });
  };
  return { gists, calls, fetchImpl };
}

beforeEach(() => _resetAutoBackupThrottle());

test('erster Sync legt privaten Gist an, danach PATCH', async () => {
  const gh = mockGitHub();
  const app = fakeApp();
  app.store.state.reports = [createReport({ ex: { id: 'e1', type: 'cloze' }, category: 'Sonstiges', text: 'Hallo', app })];
  const r1 = await syncReports(app, { fetchImpl: gh.fetchImpl });
  assert.equal(r1.created, true);
  assert.equal(gh.calls[0].method, 'POST');
  assert.equal(gh.calls[0].body.public, false);
  assert.ok(gh.calls[0].body.files[REPORTS_FILE].content.includes('Hallo'));
  assert.equal(app.store.state.settings.gistId, r1.id);
  assert.ok(app.store.state.meta.lastSyncAt);
  assert.ok(app.store.state.reports[0].syncedAt);

  const r2 = await syncReports(app, { fetchImpl: gh.fetchImpl });
  assert.equal(r2.created, false);
  assert.equal(gh.calls[1].method, 'PATCH');
  assert.equal(gh.gists.size, 1);
});

test('gelöschter Gist (404) → neu anlegen', async () => {
  const gh = mockGitHub();
  const app = fakeApp({ gistId: 'weg' });
  const r = await syncReports(app, { fetchImpl: gh.fetchImpl });
  assert.deepEqual(gh.calls.map(c => c.method), ['PATCH', 'POST']);
  assert.equal(r.created, true);
  assert.equal(app.store.state.settings.gistId, r.id);
});

test('Fehler: kein Token, 401, 403, Rate-Limit, offline', async () => {
  await assert.rejects(syncReports(fakeApp({ gistToken: '' }), { fetchImpl: async () => res(200, {}) }), e => e.code === 'no_token' && !!e.userMessage);
  await assert.rejects(syncReports(fakeApp({ gistToken: 'falsch' }), { fetchImpl: mockGitHub().fetchImpl }), e => e.code === 'unauthorized' && /ungültig/.test(e.userMessage));
  await assert.rejects(syncReports(fakeApp(), { fetchImpl: async () => res(403, { message: 'Resource not accessible' }) }), e => e.code === 'forbidden');
  await assert.rejects(syncReports(fakeApp(), { fetchImpl: async () => res(403, { message: 'API rate limit exceeded' }, { 'x-ratelimit-remaining': '0' }) }), e => e.code === 'rate_limit');
  await assert.rejects(syncReports(fakeApp(), { fetchImpl: async () => res(429, {}) }), e => e.code === 'rate_limit');
  await assert.rejects(syncReports(fakeApp(), { fetchImpl: async () => { throw new TypeError('Failed to fetch'); } }), e => e.code === 'network' || e.code === 'offline');
  await assert.rejects(syncReports(fakeApp(), { fetchImpl: async () => res(502, {}) }), e => e.code === 'server');
  assert.match(errorMessage(new GistError('offline')), /Internet/);
});

test('Backup ohne Token und Wiederherstellen (Token/GistId bleiben)', async () => {
  const gh = mockGitHub();
  const app = fakeApp();
  app.store.state.lessons['a1-1-01'] = { sessions: 3, completedAt: '2026-10-21T10:00:00Z' };
  app.store.state.mined = [{ id: 'm1', uk: 'ка́ва' }];
  await syncReports(app, { fetchImpl: gh.fetchImpl });
  const b = await backupProgress(app, { fetchImpl: gh.fetchImpl });
  assert.equal(b.created, false, 'gleicher Gist wie Meldungen');
  const g = gh.gists.get(app.store.state.settings.gistId);
  assert.ok(g.files[REPORTS_FILE] && g.files[BACKUP_FILE]);
  assert.ok(!g.files[BACKUP_FILE].content.includes('ghp_test'), 'Token nicht im Backup');
  assert.ok(app.store.state.meta.lastBackupAt);

  // Neues Gerät: Token, aber keine Gist-ID → vorhandenen Gist finden
  const fresh = fakeApp({ gistAutoSync: true });
  let asked = null;
  const out = await restoreProgress(fresh, { fetchImpl: gh.fetchImpl, confirm: async f => { asked = f.summary; return true; } });
  assert.equal(out.restored, true);
  assert.match(asked, /1 Lektion abgeschlossen/);
  assert.equal(fresh.store.state.lessons['a1-1-01'].sessions, 3);
  assert.equal(fresh.store.state.mined.length, 1);
  assert.equal(fresh.store.state.settings.gistToken, 'ghp_test');
  assert.equal(fresh.store.state.settings.gistId, app.store.state.settings.gistId);
  assert.equal(fresh.store.state.settings.gistAutoSync, true);

  // Abbrechen → nichts ändern
  const other = fakeApp({ gistId: app.store.state.settings.gistId });
  const no = await restoreProgress(other, { fetchImpl: gh.fetchImpl, confirm: async () => false });
  assert.equal(no.restored, false);
  assert.deepEqual(other.store.state.lessons, {});
});

test('Wiederherstellen ohne Backup → no_backup', async () => {
  const gh = mockGitHub();
  const app = fakeApp();
  await syncReports(app, { fetchImpl: gh.fetchImpl });
  await assert.rejects(restoreProgress(app, { fetchImpl: gh.fetchImpl }), e => e.code === 'no_backup');
  await assert.rejects(restoreProgress(fakeApp(), { fetchImpl: mockGitHub().fetchImpl }), e => e.code === 'no_backup');
});

test('testToken liest Scopes', async () => {
  const r = await testToken(fakeApp(), { fetchImpl: mockGitHub().fetchImpl });
  assert.equal(r.login, 'olena');
  assert.equal(r.hasGistScope, true);
});

test('maybeAutoSync / maybeAutoBackup', async () => {
  const gh = mockGitHub();
  const off = fakeApp();
  off.store.state.reports = [createReport({ app: off })];
  assert.equal(await maybeAutoSync(off, { fetchImpl: gh.fetchImpl }), null);
  assert.equal(await maybeAutoBackup(off, { fetchImpl: gh.fetchImpl }), null);
  assert.equal(gh.calls.length, 0);

  const on = fakeApp({ gistAutoSync: true, gistBackup: true });
  on.store.state.reports = [createReport({ app: on })];
  const s = await maybeAutoSync(on, { fetchImpl: gh.fetchImpl });
  assert.equal(s.count, 1);
  assert.equal(await maybeAutoSync(on, { fetchImpl: gh.fetchImpl }), null, 'nichts Neues');
  const b = await maybeAutoBackup(on, { fetchImpl: gh.fetchImpl });
  assert.ok(b.backup);
  assert.equal(await maybeAutoBackup(on, { fetchImpl: gh.fetchImpl }), null, 'gedrosselt');
  _resetAutoBackupThrottle();
  const bad = await maybeAutoBackup(fakeApp({ gistBackup: true, gistToken: 'x' }), { fetchImpl: gh.fetchImpl });
  assert.equal(bad.error.code, 'unauthorized', 'wirft nicht');
});
