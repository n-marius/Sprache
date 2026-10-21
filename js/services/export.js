// Export: Meldungen als Text, Backup (JSON) bauen/prüfen/einspielen, Teilen/Herunterladen/Kopieren (iOS-tauglich).
// Backup-/Text-Funktionen sind DOM-frei (Node-testbar); Browser-APIs werden erst beim Aufruf benutzt.
import { formatReportsText } from './reports.js';

export const BACKUP_FORMAT = 'mova-backup';
export const BACKUP_FORMAT_VERSION = 1;
/** Geräte-lokale Einstellungen, die nie aus einem Backup übernommen werden. */
export const LOCAL_ONLY_SETTINGS = ['gistToken', 'gistId', 'gistAutoSync', 'gistBackup'];

const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);

/** Meldungen als gut lesbarer Text. meta: {appVersion, now, contentBase} */
export function reportsToText(reports, meta = {}) { return formatReportsText(reports, meta); }

/** Backup-Objekt: kompletter Zustand (store.exportData) OHNE Token. */
export function buildBackup(store, { appVersion = '', now = new Date() } = {}) {
  const state = store.exportData();
  if (isObj(state.settings)) state.settings.gistToken = '';
  return { format: BACKUP_FORMAT, formatVersion: BACKUP_FORMAT_VERSION, appVersion, exportedAt: now.toISOString(), state };
}
export function backupJSON(store, opts) { return JSON.stringify(buildBackup(store, opts), null, 1); }

/**
 * Backup einlesen (String oder Objekt; auch roher Zustand ohne Hülle) → Zustand.
 * Wirft Error (deutsche Meldung, auch als .userMessage), wenn ungültig.
 */
export function parseBackup(input) {
  const fail = m => { throw Object.assign(new Error(m), { userMessage: m }); };
  let obj = input;
  if (typeof input === 'string') { try { obj = JSON.parse(input); } catch { fail('Die Datei ist kein gültiges JSON.'); } }
  if (!isObj(obj)) fail('Die Datei enthält kein Мова-Backup.');
  let state = obj;
  if (obj.format !== undefined) {
    if (obj.format !== BACKUP_FORMAT) fail('Unbekanntes Dateiformat – kein Мова-Backup.');
    if ((obj.formatVersion || 1) > BACKUP_FORMAT_VERSION) fail('Das Backup stammt aus einer neueren App-Version. Bitte zuerst die App aktualisieren.');
    state = obj.state;
  }
  if (!isObj(state)) fail('Das Backup enthält keine Daten.');
  if (typeof state.schema !== 'number' || !isObj(state.settings)) fail('Die Datei enthält kein Мова-Backup (Zustand fehlt).');
  for (const k of ['lessons', 'srs', 'days', 'streak', 'meta']) {
    if (state[k] !== undefined && !isObj(state[k])) fail(`Backup beschädigt (Feld „${k}“).`);
  }
  for (const k of ['reports', 'mined']) {
    if (state[k] !== undefined && !Array.isArray(state[k])) fail(`Backup beschädigt (Feld „${k}“).`);
  }
  return state;
}

/** Kurzinfo zu einem Backup-Zustand für Bestätigungsdialoge. */
export function backupSummary(state, exportedAt) {
  const lessons = Object.values(state.lessons || {}).filter(l => l && l.completedAt).length;
  const words = Object.keys(state.srs?.vocab || {}).length;
  const days = Object.keys(state.days || {}).length;
  const parts = [`${lessons} ${lessons === 1 ? 'Lektion' : 'Lektionen'} abgeschlossen`, `${words} Wörter`, `${days} Lerntage`];
  if (Array.isArray(state.mined) && state.mined.length) parts.push(`${state.mined.length} gesammelte Sätze`);
  const when = exportedAt || state.updatedAt;
  const d = when ? new Date(when) : null;
  if (d && !isNaN(d)) parts.push(`Stand ${d.toLocaleDateString('de-DE')}, ${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`);
  return parts.join(' · ');
}

/** Zustand einspielen; Token, Gist-ID, Sync-Schalter und Sync-Zeitpunkte des Geräts bleiben erhalten. */
export function applyBackup(store, state) {
  const cur = store.state;
  const next = structuredClone(state);
  next.settings = isObj(next.settings) ? next.settings : {};
  for (const k of LOCAL_ONLY_SETTINGS) next.settings[k] = cur.settings?.[k] ?? next.settings[k];
  next.meta = isObj(next.meta) ? next.meta : {};
  next.meta.lastSyncAt = cur.meta?.lastSyncAt ?? null;
  next.meta.lastBackupAt = cur.meta?.lastBackupAt ?? null;
  store.importData(next);
  return store.state;
}

const pad2 = n => String(n).padStart(2, '0');
export function backupFilename(now = new Date()) {
  return `mova-backup-${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}.json`;
}

// ---------- Browser: Teilen / Herunterladen / Kopieren ----------

/**
 * Teilen (Web Share API mit Datei, iOS-Teilen-Menü) → sonst Download (<a download>) → sonst neuer Tab.
 * → Promise<'shared'|'cancelled'|'downloaded'|'opened'>
 * Direkt aus dem Klick-Handler aufrufen (User-Activation für navigator.share).
 */
export async function shareOrDownload(filename, text, mime = 'text/plain') {
  let file = null;
  try { file = new File([text], filename, { type: mime }); } catch {}
  try {
    if (file && navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: filename });
      return 'shared';
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return 'cancelled';
    // NotAllowedError o. Ä. → Download versuchen
  }
  return downloadText(filename, text, mime);
}

/** Download per Blob-URL; Fallback: Blob in neuem Tab. → 'downloaded' | 'opened' */
export function downloadText(filename, text, mime = 'text/plain') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  const a = document.createElement('a');
  if ('download' in a) {
    a.href = url; a.download = filename; a.rel = 'noopener'; a.style.display = 'none';
    document.body.append(a); a.click(); a.remove();
    return 'downloaded';
  }
  window.open(url, '_blank');
  return 'opened';
}

/** In die Zwischenablage (Clipboard-API, Fallback: verstecktes Textfeld + execCommand). → Promise<bool> */
export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch {}
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    Object.assign(ta.style, { position: 'fixed', top: '0', left: '0', opacity: '0', fontSize: '16px' });
    document.body.append(ta);
    ta.focus(); ta.select();
    try { ta.setSelectionRange(0, text.length); } catch {}
    const ok = document.execCommand('copy');
    ta.remove();
    return !!ok;
  } catch { return false; }
}

/** Datei (input type=file) als Text lesen. */
export function readFileText(file) {
  if (file?.text) return file.text();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(r.error || new Error('Datei konnte nicht gelesen werden.'));
    r.readAsText(file);
  });
}
