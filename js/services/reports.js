// Meldungen zu Aufgaben: Datenmodell, Speichern in store.state.reports (neueste zuerst), Text-Export.
// Ohne DOM-Abhängigkeiten (auch in Node testbar).
//
// Report = { id, createdAt, category (Label aus CATEGORIES), text, lessonId, lessonTitle, exId, exType, generated,
//            exercise (JSON-Kopie der Aufgabe), userAnswer, appVersion, contentBase, isFixture, device, syncedAt }

/** Kategorien (verbindlich: Array von Labels). */
export const CATEGORIES = [
  'Fehler im Ukrainischen',
  'Übersetzung falsch',
  'Betonung falsch',
  'Audio/Aussprache',
  'Lösung wird falsch bewertet',
  'Aufgabe unklar',
  'Darstellung/Technik',
  'Sonstiges',
];
/** Darstellung je Kategorie (Emoji, Farbe, Kurzbeschreibung). */
export const CATEGORY_META = {
  'Fehler im Ukrainischen': { emoji: '🇺🇦', color: 'var(--blue)', hint: 'Grammatik, Wortwahl, Russismus' },
  'Übersetzung falsch': { emoji: '🔤', color: 'var(--purple)', hint: 'Deutsch passt nicht' },
  'Betonung falsch': { emoji: '´', color: 'var(--pink)', hint: 'Akzent an falscher Stelle' },
  'Audio/Aussprache': { emoji: '🔊', color: 'var(--orange)', hint: 'Stimme, Tempo, Aussprache' },
  'Lösung wird falsch bewertet': { emoji: '⚖️', color: 'var(--red)', hint: 'Richtige Antwort abgelehnt' },
  'Aufgabe unklar': { emoji: '❓', color: 'var(--yellow)', hint: 'Anweisung missverständlich' },
  'Darstellung/Technik': { emoji: '🛠️', color: 'var(--blue-edge)', hint: 'Layout, Absturz, Bedienung' },
  'Sonstiges': { emoji: '💬', color: 'var(--green)', hint: 'Alles andere' },
};
export function categoryMeta(label) { return CATEGORY_META[label] || CATEGORY_META.Sonstiges; }
export function normalizeCategory(c) { return CATEGORIES.includes(c) ? c : (c ? String(c) : 'Sonstiges'); }

/** Deutsche Bezeichnungen der Aufgabentypen. */
export const TYPE_LABELS = {
  mc_translate: 'Übersetzung wählen',
  build_sentence: 'Satz bauen',
  cloze: 'Lückentext',
  chat: 'Dialog',
  reading: 'Lesen',
  listening: 'Hören',
  speak: 'Sprechen',
  match_pairs: 'Paare finden',
  picture_choice: 'Bild wählen',
  true_false: 'Richtig/Falsch',
  order_dialog: 'Dialog ordnen',
  intro: 'Einführungskarte',
  tip: 'Tipp',
};
export const typeLabel = t => TYPE_LABELS[t] || t || 'Aufgabe';

/** Kurzer Text, worum es in der Aufgabe geht (Kontextanzeige im Sheet und in der Übersicht). */
export function exerciseSummary(ex) {
  if (!ex || typeof ex !== 'object') return '';
  const v = ex.vocab && typeof ex.vocab === 'object' && !Array.isArray(ex.vocab) ? ex.vocab : null;
  const pick = ex.prompt || ex.prompt_uk || ex.statement_uk || ex.audio_uk || ex.uk || ex.title_uk
    || (ex.text ? String(ex.text).replace(/\{\{([^}]*)\}\}/g, '…') : '')
    || (v ? [v.uk, v.de && `– ${v.de}`].filter(Boolean).join(' ') : '')
    || ex.title_de || ex.body_de || ex.scenario_de || ex.de
    || (Array.isArray(ex.pairs) ? ex.pairs.map(p => p.uk).join(' · ') : '')
    || (Array.isArray(ex.lines) ? ex.lines.map(l => l.uk).join(' / ') : '');
  const s = String(pick || '').replace(/\s+/g, ' ').trim();
  return s.length > 140 ? s.slice(0, 137) + '…' : s;
}

/** Gerät/Browser kurz aus dem User-Agent (z. B. „iPhone · iOS 17.4 · Safari · Home-Bildschirm · 390×844“). */
export function deviceInfo(nav = globalThis.navigator, win = globalThis) {
  const ua = String(nav?.userAgent || '');
  const parts = [];
  const touchMac = /Macintosh/.test(ua) && (nav?.maxTouchPoints || 0) > 1;
  const ios = ua.match(/(?:iPhone|CPU) OS (\d+)[_.](\d+)/);
  if (/iPad/.test(ua) || touchMac) parts.push('iPad');
  else if (/iPhone/.test(ua)) parts.push('iPhone');
  else if (/Android/.test(ua)) parts.push('Android');
  else if (/Macintosh/.test(ua)) parts.push('Mac');
  else if (/Windows/.test(ua)) parts.push('Windows');
  else if (/Linux/.test(ua)) parts.push('Linux');
  else if (/Node\.js/.test(ua)) parts.push('Node');
  if (ios) parts.push(`iOS ${ios[1]}.${ios[2]}`);
  else if (touchMac) { const m = ua.match(/Version\/(\d+(?:\.\d+)?)/); if (m) parts.push(`iPadOS ${m[1]}`); }
  else { const a = ua.match(/Android (\d+(?:\.\d+)?)/); if (a) parts.push(`Android ${a[1]}`); }
  if (/CriOS/.test(ua)) parts.push('Chrome');
  else if (/FxiOS|Firefox\//.test(ua)) parts.push('Firefox');
  else if (/EdgiOS|Edg\//.test(ua)) parts.push('Edge');
  else if (/HeadlessChrome/.test(ua)) parts.push('Headless Chrome');
  else if (/Chrome\//.test(ua)) parts.push('Chrome');
  else if (/Safari\//.test(ua)) parts.push('Safari');
  try {
    const standalone = nav?.standalone === true || win?.matchMedia?.('(display-mode: standalone)')?.matches;
    if (standalone) parts.push('Home-Bildschirm');
  } catch {}
  try { if (win?.innerWidth) parts.push(`${win.innerWidth}×${win.innerHeight}`); } catch {}
  return parts.join(' · ') || ua.slice(0, 80) || 'unbekannt';
}

function rid() { return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function safeClone(v) {
  if (v === undefined) return null;
  try { return JSON.parse(JSON.stringify(v)); } catch { return String(v); }
}

function answerText(a) {
  if (a == null || a === '') return '';
  if (typeof a === 'string') return a;
  try { return JSON.stringify(a); } catch { return String(a); }
}

/** Meldung erzeugen (ohne zu speichern). app: {version, content} optional. */
export function createReport({ lessonId, ex, userAnswer, category, text = '', app, now = new Date(), device } = {}) {
  const lid = lessonId || ex?.lessonId || null;
  let meta = null;
  try { meta = lid && app?.content?.getMeta ? app.content.getMeta(lid) : null; } catch {}
  const lessonTitle = meta ? [meta.title_uk, meta.title_de && `(${meta.title_de})`].filter(Boolean).join(' ') : '';
  return {
    id: rid(),
    createdAt: (now instanceof Date ? now : new Date(now)).toISOString(),
    category: normalizeCategory(category),
    text: String(text || '').trim(),
    lessonId: lid,
    lessonTitle,
    exId: ex?.id ?? ex?.key ?? null,
    exType: ex?.type ?? ex?.kind ?? null,
    generated: !!ex?.generated,
    exercise: safeClone(ex),
    userAnswer: answerText(userAnswer),
    appVersion: app?.version || '',
    contentBase: app?.content ? (app.content.base || '') : '',
    isFixture: !!app?.content?.isFixture,
    device: device ?? deviceInfo(),
    syncedAt: null,
  };
}

/** Automatisch angehängte Kontextdaten (Vorschau im Sheet). */
export function attachedData(report) {
  const { id, category, text, syncedAt, ...rest } = report;
  return rest;
}

/**
 * Meldung speichern (neueste zuerst). data: fertiger Report ODER {lessonId, ex, userAnswer, category, text}.
 * → Report
 */
export function addReport(app, data = {}) {
  const r = data.id && data.createdAt ? { ...data, category: normalizeCategory(data.category) } : createReport({ ...data, app });
  app.store.update(s => { if (!Array.isArray(s.reports)) s.reports = []; s.reports.unshift(r); });
  return r;
}
export function deleteReport(app, id) {
  app.store.update(s => { s.reports = (s.reports || []).filter(r => r.id !== id); });
}
export function clearReports(app) { app.store.update(s => { s.reports = []; }); }

/** Neueste zuerst. */
export function sortedReports(reports) {
  return [...(reports || [])].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}
export function unsyncedCount(reports) { return (reports || []).filter(r => !r.syncedAt).length; }

// ---------- Text-Export ----------
const pad2 = n => String(n).padStart(2, '0');
/** 21.10.2026, 14:03 (lokale Zeit) */
export function fmtDateTime(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return String(iso || '');
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function indent(text, n = 2) {
  const p = ' '.repeat(n);
  return String(text).split('\n').map(l => p + l).join('\n');
}

const RULE = '─'.repeat(52);

/** Ein Block je Meldung. */
export function formatReport(r, index) {
  const L = [];
  const field = (k, v) => L.push(`${(k + ':').padEnd(15)}${v}`);
  L.push(RULE);
  L.push(`#${index} · ${r.category || 'Sonstiges'}`);
  L.push(RULE);
  field('Datum', `${fmtDateTime(r.createdAt)} (${r.createdAt})`);
  field('Lektion', [r.lessonId || '–', r.lessonTitle].filter(Boolean).join(' – '));
  field('Aufgabe', `${r.exId ?? '–'} · ${r.exType || '–'}${TYPE_LABELS[r.exType] ? ` (${TYPE_LABELS[r.exType]})` : ''}${r.generated ? ' · generiert' : ''}`);
  field('Nutzerantwort', r.userAnswer ? r.userAnswer : '–');
  field('App-Version', r.appVersion || '–');
  field('Inhalte', `${r.contentBase || '–'}${r.isFixture ? ' (Demo-Inhalte)' : ''}`);
  field('Gerät', r.device || '–');
  field('Meldungs-ID', r.id);
  L.push('');
  L.push('Kommentar:');
  L.push(r.text ? indent(r.text) : '  (kein Kommentar)');
  L.push('');
  L.push('Aufgabeninhalt (JSON):');
  L.push(indent(r.exercise != null ? JSON.stringify(r.exercise, null, 2) : '(keine Daten)'));
  return L.join('\n');
}

/** Gesamter Export (gut lesbar), neueste Meldung zuerst. meta: {appVersion, now, contentBase} */
export function formatReportsText(reports, { appVersion = '', now = new Date(), contentBase } = {}) {
  const list = sortedReports(reports);
  const head = [
    'Мова – Meldungen zu Aufgaben',
    '='.repeat(52),
    `App-Version:   ${appVersion || '–'}`,
    `Erstellt:      ${fmtDateTime(now.toISOString())} (${now.toISOString()})`,
    `Anzahl:        ${list.length} ${list.length === 1 ? 'Meldung' : 'Meldungen'}`,
  ];
  if (contentBase != null) head.push(`Inhalte:       ${contentBase || '–'}`);
  if (!list.length) return head.join('\n') + '\n\n(Keine Meldungen vorhanden.)\n';
  return head.join('\n') + '\n\n' + list.map((r, i) => formatReport(r, list.length - i)).join('\n\n') + '\n';
}

export function reportsFilename(now = new Date()) {
  return `mova-meldungen-${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}.txt`;
}
