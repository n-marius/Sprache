// #/reports – alle Meldungen gebündelt: neueste oben, aufklappbar, löschbar, Sync-Status; Export (.txt), Kopieren, Gist-Sync.
import { h, icon, clear } from '../ui/dom.js';
import { page, toast, confirmDialog } from '../ui/shell.js';
import { haptic } from '../ui/haptics.js';
import { sortedReports, deleteReport, clearReports, categoryMeta, typeLabel, exerciseSummary, fmtDateTime, unsyncedCount, reportsFilename } from '../services/reports.js';
import { reportsToText, shareOrDownload, copyText } from '../services/export.js';
import { syncReports, errorMessage, gistUrl } from '../services/gist.js';

function relTime(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'gerade eben';
  if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min.`;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const time = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  if (d >= today) return `heute, ${time}`;
  const y = new Date(today); y.setDate(y.getDate() - 1);
  if (d >= y) return `gestern, ${time}`;
  return fmtDateTime(iso);
}

export function render(params, app) {
  const { store } = app;
  const listHost = h('div', { class: 'r-list-host' });
  const heroHost = h('div');
  let busy = false;
  const expanded = new Set();

  const text = () => reportsToText(store.state.reports, { appVersion: app.version, contentBase: app.content?.base });

  async function onDownload() {
    const r = await shareOrDownload(reportsFilename(), text(), 'text/plain');
    if (r === 'downloaded') toast('Datei heruntergeladen', { kind: 'ok' });
    else if (r === 'opened') toast('In neuem Tab geöffnet');
  }
  async function onCopy() {
    const ok = await copyText(text());
    toast(ok ? 'In die Zwischenablage kopiert' : 'Kopieren nicht möglich', { kind: ok ? 'ok' : 'bad' });
    if (ok) haptic('success');
  }
  async function onSync(btn) {
    if (busy) return;
    if (!String(store.state.settings.gistToken || '').trim()) {
      const go = await confirmDialog({ title: 'Kein GitHub-Token', message: 'Für den Gist-Sync wird ein persönlicher Token (Scope „gist“) benötigt. Jetzt in den Einstellungen eintragen?', ok: 'Einstellungen' });
      if (go) app.navigate('#/settings?focus=sync');
      return;
    }
    busy = true; btn.classList.add('is-busy'); btn.disabled = true;
    try {
      const r = await syncReports(app);
      haptic('success');
      toast(r.created ? 'Privater Gist angelegt und synchronisiert' : `${r.count} ${r.count === 1 ? 'Meldung' : 'Meldungen'} synchronisiert`, { kind: 'ok' });
    } catch (e) {
      haptic('error');
      toast(errorMessage(e), { kind: 'bad', ms: 4000 });
    } finally {
      busy = false; btn.classList.remove('is-busy'); btn.disabled = false;
      refresh();
    }
  }

  function hero(reports) {
    const total = reports.length;
    const open = unsyncedCount(reports);
    const last = store.state.meta.lastSyncAt;
    const gistId = store.state.settings.gistId;
    const syncBtn = h('button', { type: 'button', class: 'btn btn-blue btn-block r-sync-btn', on: { click: () => onSync(syncBtn) } },
      h('span', { class: 'r-spin' }, icon('refresh')), 'Mit Gist synchronisieren');
    return h('section', { class: 'r-hero' },
      h('div', { class: 'r-hero-stats' },
        h('div', { class: 'r-stat' }, h('div', { class: 'r-stat-num num' }, String(total)), h('div', { class: 'r-stat-label' }, total === 1 ? 'Meldung' : 'Meldungen')),
        h('div', { class: 'r-stat' }, h('div', { class: ['r-stat-num num', open ? 'is-open' : 'is-done'] }, String(open)), h('div', { class: 'r-stat-label' }, 'nicht synchronisiert')),
        h('div', { class: 'r-stat r-stat-wide' },
          h('div', { class: 'r-stat-when' }, icon('cloud'), last ? relTime(last) : 'noch nie'),
          h('div', { class: 'r-stat-label' }, gistId ? h('a', { href: gistUrl(gistId), target: '_blank', rel: 'noopener' }, 'Gist öffnen') : 'letzter Sync'))),
      h('div', { class: 'r-actions' },
        syncBtn,
        h('div', { class: 'r-actions-row' },
          h('button', { type: 'button', class: 'btn btn-secondary r-act', disabled: !total, on: { click: onDownload } }, icon('download'), 'Als .txt'),
          h('button', { type: 'button', class: 'btn btn-secondary r-act', disabled: !total, on: { click: onCopy } }, icon('copy'), 'Kopieren'))));
  }

  function item(r) {
    const m = categoryMeta(r.category);
    const open = expanded.has(r.id);
    const summary = exerciseSummary(r.exercise);
    const body = h('div', { class: 'r-item-body', hidden: !open },
      r.text ? h('p', { class: 'r-item-comment' }, r.text) : h('p', { class: 'r-item-comment is-empty' }, 'Kein Kommentar'),
      h('dl', { class: 'r-kv' },
        kv('Lektion', [r.lessonId || '–', r.lessonTitle].filter(Boolean).join(' – ')),
        kv('Aufgabe', `${r.exId ?? '–'} · ${typeLabel(r.exType)}${r.generated ? ' · generiert' : ''}`),
        kv('Antwort', r.userAnswer || '–'),
        kv('Zeitpunkt', fmtDateTime(r.createdAt)),
        kv('Version', `${r.appVersion || '–'} · ${r.contentBase || '–'}${r.isFixture ? ' (Demo)' : ''}`),
        kv('Gerät', r.device || '–'),
        kv('Status', r.syncedAt ? `synchronisiert ${fmtDateTime(r.syncedAt)}` : 'nur auf diesem Gerät')),
      h('details', { class: 'r-details r-details-inline' },
        h('summary', { class: 'r-details-summary' }, h('span', { class: 'r-details-title' }, 'Aufgabeninhalt (JSON)'), icon('chevron-down', { cls: 'r-details-chev' })),
        h('pre', { class: 'r-json' }, JSON.stringify(r.exercise, null, 2))),
      h('button', { type: 'button', class: 'btn btn-ghost r-del', on: { click: () => onDelete(r) } }, icon('trash'), 'Meldung löschen'));
    const head = h('button', {
      type: 'button', class: 'r-item-head', 'aria-expanded': String(open),
      on: { click: () => {
        const now = !expanded.has(r.id);
        if (now) expanded.add(r.id); else expanded.delete(r.id);
        body.hidden = !now; head.setAttribute('aria-expanded', String(now)); el.classList.toggle('is-open', now);
      } },
    },
      h('span', { class: 'r-item-icon', style: `--r-cat-color: ${m.color}` }, h('span', { class: 'emoji' }, m.emoji)),
      h('span', { class: 'r-item-main' },
        h('span', { class: 'r-item-title' }, r.category),
        h('span', { class: 'r-item-sub' }, [r.lessonId, typeLabel(r.exType), relTime(r.createdAt)].filter(Boolean).join(' · ')),
        summary ? h('span', { class: 'r-item-snippet' }, summary) : null),
      h('span', { class: ['badge', r.syncedAt ? 'green' : '', 'r-item-badge'] }, r.syncedAt ? icon('check') : null, r.syncedAt ? 'synchronisiert' : 'lokal'),
      icon('chevron-down', { cls: 'r-item-chev' }));
    const el = h('article', { class: ['r-item', open && 'is-open'] }, head, body);
    return el;
  }
  const kv = (k, v) => [h('dt', k), h('dd', v)];

  async function onDelete(r) {
    const ok = await confirmDialog({ title: 'Meldung löschen?', message: r.syncedAt ? 'Beim nächsten Sync wird sie auch aus dem Gist entfernt.' : 'Die Meldung wurde noch nicht synchronisiert.', ok: 'Löschen', destructive: true });
    if (!ok) return;
    deleteReport(app, r.id);
    haptic('medium');
    toast('Meldung gelöscht');
  }
  async function onClearAll() {
    const ok = await confirmDialog({ title: 'Alle Meldungen löschen?', message: 'Das kann nicht rückgängig gemacht werden. Vorher als .txt sichern?', ok: 'Alle löschen', destructive: true });
    if (!ok) return;
    clearReports(app);
    toast('Alle Meldungen gelöscht');
  }

  function refresh() {
    const reports = sortedReports(store.state.reports);
    clear(heroHost).append(hero(reports));
    clear(listHost);
    if (!reports.length) {
      listHost.append(h('div', { class: 'r-empty' },
        h('div', { class: 'r-empty-glyph' }, icon('flag')),
        h('div', { class: 't-title3' }, 'Noch keine Meldungen'),
        h('p', { class: 't-sub t-2' }, 'Fällt dir in einer Aufgabe etwas auf – ein Fehler, eine falsche Betonung oder eine unfaire Bewertung –, tippe oben auf die Flagge. Alle Meldungen landen hier gebündelt.')));
      return;
    }
    listHost.append(
      h('div', { class: 'section-header' }, `${reports.length} ${reports.length === 1 ? 'Meldung' : 'Meldungen'} · neueste zuerst`),
      h('div', { class: 'r-list' }, reports.map(item)),
      h('button', { type: 'button', class: 'r-clear', on: { click: onClearAll } }, 'Alle Meldungen löschen'));
  }

  refresh();
  const unsub = store.subscribe(() => { if (!busy) refresh(); });

  const el = page({
    title: 'Meldungen',
    subtitle: 'Hinweise zu Aufgaben – zum Korrigieren der Inhalte',
    back: { label: 'Mehr', href: '#/settings' },
    cls: 'r-page',
    children: [heroHost, listHost],
  });
  return { el, destroy: unsub };
}
