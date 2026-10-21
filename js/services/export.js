// STUB mit verbindlicher API (Melde-Agent ersetzt).
export function reportsToText(reports, meta = {}) { return reports.map(r => JSON.stringify(r, null, 2)).join('\n\n'); }
/** Teilen (Web Share API mit Datei) oder Download; → Promise<'shared'|'downloaded'|'cancelled'> */
export async function shareOrDownload(filename, text, mime = 'text/plain') { downloadText(filename, text, mime); return 'downloaded'; }
export function downloadText(filename, text, mime = 'text/plain') {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime + ';charset=utf-8' })); a.download = filename; a.click();
}
/** → Promise<bool> */
export async function copyText(text) { try { await navigator.clipboard.writeText(text); return true; } catch { return false; } }
