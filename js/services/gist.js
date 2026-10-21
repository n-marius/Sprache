// STUB mit verbindlicher API (Melde-Agent ersetzt). Alle Funktionen → Promise; Fehler als Error mit .userMessage.
export async function syncReports(app) { throw Object.assign(new Error('nicht implementiert'), { userMessage: 'Noch nicht verfügbar' }); }
export async function backupProgress(app) { return syncReports(app); }
export async function restoreProgress(app) { return syncReports(app); }
export async function testToken(app) { return syncReports(app); }
export function maybeAutoSync(app) {}
export function maybeAutoBackup(app) {}
