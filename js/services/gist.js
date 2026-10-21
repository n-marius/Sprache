// GitHub-Gist-Sync: Meldungen (mova-meldungen.txt) und optional Fortschritts-Backup (mova-backup.json)
// in EINEM privaten Gist. Token (Scope „gist“) liegt nur lokal in settings.gistToken.
// Alle Funktionen → Promise; Fehler sind GistError (Error mit .code, .status und deutscher .userMessage).
// fetch ist über opts.fetchImpl injizierbar (Tests).
import { formatReportsText, unsyncedCount } from './reports.js';
import { buildBackup, parseBackup, applyBackup, backupSummary } from './export.js';

export const API = 'https://api.github.com';
export const REPORTS_FILE = 'mova-meldungen.txt';
export const BACKUP_FILE = 'mova-backup.json';
export const GIST_DESCRIPTION = 'Мова – Meldungen & Fortschritt (Ukrainisch-Lern-App)';
export const TOKEN_URL = 'https://github.com/settings/tokens/new?scopes=gist&description=Mova%20Ukrainisch-App';

const MESSAGES = {
  no_token: 'Kein GitHub-Token hinterlegt. Bitte in den Einstellungen unter „Sync“ eintragen.',
  unauthorized: 'Token ungültig oder abgelaufen (401). Bitte einen neuen Token mit Scope „gist“ eintragen.',
  forbidden: 'Zugriff verweigert (403). Hat der Token den Scope „gist“?',
  rate_limit: 'GitHub-Limit erreicht. Bitte später erneut versuchen.',
  offline: 'Keine Internetverbindung. Bitte später erneut versuchen.',
  network: 'GitHub ist gerade nicht erreichbar. Bitte später erneut versuchen.',
  not_found: 'Gist nicht gefunden.',
  no_backup: 'Im Gist wurde noch kein Fortschritts-Backup gefunden.',
  invalid: 'GitHub hat die Daten abgelehnt (422).',
  server: 'GitHub meldet einen Serverfehler. Bitte später erneut versuchen.',
  http: 'Unerwartete Antwort von GitHub.',
};

export class GistError extends Error {
  constructor(code, message = MESSAGES[code] || MESSAGES.http, status = 0) {
    super(message);
    this.name = 'GistError'; this.code = code; this.status = status; this.userMessage = message;
  }
}

/** Verständliche deutsche Fehlermeldung für beliebige Fehler. */
export function errorMessage(err) {
  return err?.userMessage || err?.message || String(err || 'Unbekannter Fehler');
}

function isOffline() { try { return globalThis.navigator?.onLine === false; } catch { return false; } }
function headerGet(res, name) { try { return res.headers?.get?.(name) ?? null; } catch { return null; } }

/** Einzelner API-Aufruf mit Fehlerabbildung. → {data, res} */
export async function gistRequest({ token, method = 'GET', path, body, fetchImpl = globalThis.fetch }) {
  if (!token) throw new GistError('no_token');
  if (isOffline()) throw new GistError('offline');
  let res;
  try {
    res = await fetchImpl(API + path, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
  } catch {
    throw new GistError(isOffline() ? 'offline' : 'network');
  }
  if (res.ok) {
    if (res.status === 204) return { data: null, res };
    try { return { data: await res.json(), res }; } catch { throw new GistError('http', MESSAGES.http, res.status); }
  }
  const s = res.status;
  let detail = '';
  try { detail = (await res.json())?.message || ''; } catch {}
  if (s === 401) throw new GistError('unauthorized', MESSAGES.unauthorized, s);
  if (s === 429 || (s === 403 && (headerGet(res, 'x-ratelimit-remaining') === '0' || /rate limit/i.test(detail)))) {
    const reset = Number(headerGet(res, 'x-ratelimit-reset'));
    let msg = MESSAGES.rate_limit;
    if (reset > 0) {
      const d = new Date(reset * 1000);
      msg = `GitHub-Limit erreicht. Wieder möglich ab ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} Uhr.`;
    }
    throw new GistError('rate_limit', msg, s);
  }
  if (s === 403) throw new GistError('forbidden', MESSAGES.forbidden, s);
  if (s === 404) throw new GistError('not_found', MESSAGES.not_found, s);
  if (s === 422) throw new GistError('invalid', detail ? `${MESSAGES.invalid} ${detail}` : MESSAGES.invalid, s);
  if (s >= 500) throw new GistError('server', MESSAGES.server, s);
  throw new GistError('http', `${MESSAGES.http} (HTTP ${s})`, s);
}

export function gistUrl(id) { return id ? `https://gist.github.com/${encodeURIComponent(id)}` : ''; }

/**
 * Dateien in den Gist schreiben. Ohne gistId – oder wenn der Gist gelöscht wurde (404) – wird ein
 * PRIVATER Gist angelegt. files: {name: {content}} → {id, url, created}
 */
export async function upsertFiles({ token, gistId, files, description = GIST_DESCRIPTION, fetchImpl }) {
  if (gistId) {
    try {
      const { data } = await gistRequest({ token, method: 'PATCH', path: `/gists/${encodeURIComponent(gistId)}`, body: { description, files }, fetchImpl });
      return { id: data?.id || gistId, url: data?.html_url || gistUrl(gistId), created: false };
    } catch (e) {
      if (e.code !== 'not_found') throw e;
    }
  }
  const { data } = await gistRequest({ token, method: 'POST', path: '/gists', body: { description, public: false, files }, fetchImpl });
  if (!data?.id) throw new GistError('http');
  return { id: data.id, url: data.html_url || gistUrl(data.id), created: true };
}

/** Datei aus dem Gist lesen (große, abgeschnittene Dateien über raw_url). → string | null */
export async function readGistFile({ token, gistId, filename, fetchImpl = globalThis.fetch }) {
  const { data } = await gistRequest({ token, path: `/gists/${encodeURIComponent(gistId)}`, fetchImpl });
  const f = data?.files?.[filename];
  if (!f) return null;
  if (!f.truncated && typeof f.content === 'string') return f.content;
  if (f.raw_url) {
    try { const r = await fetchImpl(f.raw_url, { cache: 'no-store' }); if (r.ok) return await r.text(); } catch {}
    throw new GistError('network');
  }
  return f.content ?? null;
}

/** Vorhandenen Мова-Gist des Kontos suchen (z. B. auf einem neuen Gerät). → id | null */
export async function findExistingGist({ token, fetchImpl, wantFile = BACKUP_FILE }) {
  const { data } = await gistRequest({ token, path: '/gists?per_page=100', fetchImpl });
  if (!Array.isArray(data)) return null;
  return data.find(g => g?.files && Object.prototype.hasOwnProperty.call(g.files, wantFile))?.id || null;
}

// ---------- High-Level (app = {store, version, content}) ----------
// Aufrufe nacheinander (kein doppeltes Anlegen eines Gists bei schnellen Klicks/Auto-Sync).
let chain = Promise.resolve();
function exclusive(fn) { const run = chain.then(fn); chain = run.catch(() => {}); return run; }
const tokenOf = app => String(app?.store?.state?.settings?.gistToken || '').trim();

/** Token prüfen (GET /user). → {login, scopes:[…]|null, hasGistScope:bool|null} */
export async function testToken(app, { fetchImpl } = {}) {
  const token = tokenOf(app);
  const { data, res } = await gistRequest({ token, path: '/user', fetchImpl });
  const raw = headerGet(res, 'x-oauth-scopes');
  const scopes = raw == null ? null : raw.split(',').map(s => s.trim()).filter(Boolean);
  // Fein-granulare Tokens liefern keine Scopes → null (unbekannt)
  return { login: data?.login || '', scopes, hasGistScope: scopes ? scopes.includes('gist') : null };
}

/** Alle Meldungen als .txt in den Gist schreiben; enthaltene Meldungen → synchronisiert. → {id, url, created, count, at} */
export function syncReports(app, { fetchImpl } = {}) {
  return exclusive(async () => {
    const { store } = app;
    const token = tokenOf(app);
    if (!token) throw new GistError('no_token');
    const reports = store.state.reports || [];
    const ids = new Set(reports.map(r => r.id));
    const text = formatReportsText(reports, { appVersion: app.version, contentBase: app.content?.base });
    const res = await upsertFiles({ token, gistId: store.state.settings.gistId, files: { [REPORTS_FILE]: { content: text } }, fetchImpl });
    const at = new Date().toISOString();
    store.update(s => {
      s.settings.gistId = res.id;
      s.meta.lastSyncAt = at;
      for (const r of s.reports || []) if (ids.has(r.id)) r.syncedAt = at;
    });
    return { ...res, count: ids.size, at };
  });
}

/** Fortschritt (store.exportData ohne Token) als mova-backup.json in den Gist. → {id, url, created, at, bytes} */
export function backupProgress(app, { fetchImpl } = {}) {
  return exclusive(async () => {
    const { store } = app;
    const token = tokenOf(app);
    if (!token) throw new GistError('no_token');
    const now = new Date();
    const content = JSON.stringify(buildBackup(store, { appVersion: app.version, now }), null, 1);
    const res = await upsertFiles({ token, gistId: store.state.settings.gistId, files: { [BACKUP_FILE]: { content } }, fetchImpl });
    store.update(s => { s.settings.gistId = res.id; s.meta.lastBackupAt = now.toISOString(); });
    return { ...res, at: now.toISOString(), bytes: content.length };
  });
}

/** Backup aus dem Gist holen und prüfen (noch NICHT einspielen). → {state, exportedAt, appVersion, gistId, summary} */
export async function fetchBackup(app, { fetchImpl } = {}) {
  const token = tokenOf(app);
  if (!token) throw new GistError('no_token');
  let gistId = app.store.state.settings.gistId;
  if (!gistId) {
    gistId = await findExistingGist({ token, fetchImpl, wantFile: BACKUP_FILE });
    if (!gistId) throw new GistError('no_backup');
  }
  let text;
  try { text = await readGistFile({ token, gistId, filename: BACKUP_FILE, fetchImpl }); }
  catch (e) { if (e.code === 'not_found') throw new GistError('no_backup', MESSAGES.no_backup, 404); throw e; }
  if (!text) throw new GistError('no_backup');
  let raw;
  try { raw = JSON.parse(text); } catch { throw new GistError('invalid', 'Das Backup im Gist ist beschädigt (kein gültiges JSON).'); }
  let state;
  try { state = parseBackup(raw); } catch (e) { throw new GistError('invalid', e.userMessage || e.message); }
  const exportedAt = raw.exportedAt || state.updatedAt || null;
  return { state, exportedAt, appVersion: raw.appVersion || '', gistId, summary: backupSummary(state, exportedAt) };
}

/**
 * Fortschritt aus dem Gist wiederherstellen. opts.confirm(fetched) → Promise<bool> (z. B. confirmDialog);
 * ohne confirm wird direkt eingespielt. Token, Gist-ID und Sync-Schalter des Geräts bleiben erhalten.
 * → {restored: bool, summary, exportedAt}
 */
export async function restoreProgress(app, { fetchImpl, confirm } = {}) {
  const fetched = await fetchBackup(app, { fetchImpl });
  if (confirm && !(await confirm(fetched))) return { restored: false, summary: fetched.summary, exportedAt: fetched.exportedAt };
  const { store } = app;
  if (!store.state.settings.gistId && fetched.gistId) store.update(s => { s.settings.gistId = fetched.gistId; }, { silent: true });
  applyBackup(store, fetched.state);
  return { restored: true, summary: fetched.summary, exportedAt: fetched.exportedAt };
}

/** Nach einer neuen Meldung: synchronisieren, wenn settings.gistAutoSync. → Ergebnis | {error} | null. Wirft nie. */
export async function maybeAutoSync(app, opts) {
  try {
    const s = app?.store?.state?.settings;
    if (!s?.gistAutoSync || !tokenOf(app) || isOffline()) return null;
    if (!unsyncedCount(app.store.state.reports)) return null;
    return await syncReports(app, opts);
  } catch (e) {
    console.warn('Auto-Sync fehlgeschlagen:', errorMessage(e));
    return { error: e };
  }
}

let lastAutoBackup = 0;
/**
 * Nach einer Session aufrufen (z. B. views/summary.js): sichert den Fortschritt im Gist, wenn settings.gistBackup
 * aktiv und ein Token vorhanden ist (höchstens 1× pro Minute; opts.force umgeht das). Synchronisiert dabei offene
 * Meldungen, wenn Auto-Sync aktiv ist. → {backup?, sync?, error?} | null. Wirft nie.
 */
export async function maybeAutoBackup(app, opts = {}) {
  try {
    const s = app?.store?.state?.settings;
    if (!s || !tokenOf(app) || isOffline()) return null;
    const out = {};
    if (s.gistAutoSync && unsyncedCount(app.store.state.reports)) {
      try { out.sync = await syncReports(app, opts); } catch (e) { out.error = e; }
    }
    if (s.gistBackup && (opts.force || Date.now() - lastAutoBackup > 60_000)) {
      lastAutoBackup = Date.now();
      out.backup = await backupProgress(app, opts);
    }
    return Object.keys(out).length ? out : null;
  } catch (e) {
    console.warn('Auto-Backup fehlgeschlagen:', errorMessage(e));
    return { error: e };
  }
}

/** Nur für Tests. */
export function _resetAutoBackupThrottle() { lastAutoBackup = 0; }
