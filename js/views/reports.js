// #/reports – alle Meldungen gebündelt: neueste oben, aufklappbar, löschbar, Sync-Status; Export (.txt), Kopieren, Gist-Sync.
import { h, icon, clear, ukText } from '../ui/dom.js';
import { uiLabel, holdLabel, uiT } from '../ui/ui-label.js';
import { page, toast, confirmDialog } from '../ui/shell.js';
import { haptic } from '../ui/haptics.js';
import { sortedReports, deleteReport, clearReports, categoryMeta, typeLabel, exerciseSummary, fmtDateTime, unsyncedCount, reportsFilename } from '../services/reports.js';
import { reportsToText, shareOrDownload, copyText } from '../services/export.js';
import { syncReports, errorMessage, gistUrl } from '../services/gist.js';
import { ukWord, ukCount, syncedToast, categoryUi, typeUi } from '../ui-text-g3.js';

/** Relative Zeit → {uk, de} */
function relTime(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return { uk: '', de: '' };
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return uiT('just_now');
  if (diff < 3600) {
    const n = Math.floor(diff / 60);
    return { uk: `${n} ${ukWord(n, 'minute_acc').uk} ${uiT('ago').uk}`, de: `vor ${n} Min.` };
  }
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const time = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  if (d >= today) return { uk: `${uiT('today_at').uk}, ${time}`, de: `heute, ${time}` };
  const y = new Date(today); y.setDate(y.getDate() - 1);
  if (d >= y) return { uk: `${uiT('yesterday_at').uk}, ${time}`, de: `gestern, ${time}` };
  const t = fmtDateTime(iso);
  return { uk: t, de: '' };
}
const inl = (label, cls) => uiLabel(label, { layout: 'inline', cls });

export function render(params, app) {
  const { store } = app;
  const listHost = h('div', { class: 'r-list-host' });
  const heroHost = h('div');
  let busy = false;
  const expanded = new Set();

  const text = () => reportsToText(store.state.reports, { appVersion: app.version, contentBase: app.content?.base });

  async function onDownload() {
    const r = await shareOrDownload(reportsFilename(), text(), 'text/plain');
    if (r === 'downloaded') toast(uiT('file_saved'), { kind: 'ok' });
    else if (r === 'opened') toast(uiT('opened'));
  }
  async function onCopy() {
    const ok = await copyText(text());
    toast(ok ? uiT('copied') : { uk: uiT('error').uk, de: 'Kopieren nicht möglich' }, { kind: ok ? 'ok' : 'bad' });
    if (ok) haptic('success');
  }
  async function onSync(btn) {
    if (busy) return;
    if (!String(store.state.settings.gistToken || '').trim()) {
      const go = await confirmDialog({ title: uiT('no_token'), message: 'Für den Gist-Sync wird ein persönlicher Token (Scope „gist“) benötigt. Jetzt in den Einstellungen eintragen?', ok: uiT('go_settings') });
      if (go) app.navigate('#/settings?focus=sync');
      return;
    }
    busy = true; btn.classList.add('is-busy'); btn.disabled = true;
    try {
      const r = await syncReports(app);
      haptic('success');
      toast(syncedToast(r), { kind: 'ok' });
    } catch (e) {
      haptic('error');
      toast({ uk: uiT('error').uk, de: errorMessage(e) }, { kind: 'bad', ms: 4000 });
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
      h('span', { class: 'r-spin' }, icon('refresh')), holdLabel('sync_with_gist'));
    return h('section', { class: 'r-hero' },
      h('div', { class: 'r-hero-stats' },
        h('div', { class: 'r-stat' }, h('div', { class: 'r-stat-num num' }, String(total)), h('div', { class: 'r-stat-label' }, uiLabel('reports'))),
        h('div', { class: 'r-stat' }, h('div', { class: ['r-stat-num num', open ? 'is-open' : 'is-done'] }, String(open)), h('div', { class: 'r-stat-label' }, uiLabel('not_synced_n'))),
        h('div', { class: 'r-stat r-stat-wide' },
          h('div', { class: 'r-stat-when' }, icon('cloud'), uiLabel(last ? relTime(last) : uiT('never'), { layout: 'inline' })),
          h('div', { class: 'r-stat-label' }, gistId ? h('a', { href: gistUrl(gistId), target: '_blank', rel: 'noopener' }, holdLabel('open_gist')) : uiLabel('last_sync')))),
      h('div', { class: 'r-actions' },
        syncBtn,
        h('div', { class: 'r-actions-row' },
          h('button', { type: 'button', class: 'btn btn-secondary r-act', disabled: !total, on: { click: onDownload } }, icon('download'), holdLabel('save_txt', { de: false })),
          h('button', { type: 'button', class: 'btn btn-secondary r-act', disabled: !total, on: { click: onCopy } }, icon('copy'), holdLabel('copy', { de: false })))));
  }

  function item(r) {
    const m = categoryMeta(r.category);
    const open = expanded.has(r.id);
    const summary = exerciseSummary(r.exercise);
    const body = h('div', { class: 'r-item-body', hidden: !open },
      r.text ? h('p', { class: 'r-item-comment' }, r.text) : h('p', { class: 'r-item-comment is-empty' }, inl('no_comment')),
      h('dl', { class: 'r-kv' },
        kv('lesson', [r.lessonId || '–', r.lessonTitle].filter(Boolean).join(' – ')),
        kv('task', [`${r.exId ?? '–'} · `, inl(typeUi(r.exType)), r.generated ? [' · ', inl('generated')] : null]),
        kv('answer', r.userAnswer || '–'),
        kv('time', fmtDateTime(r.createdAt)),
        kv('version', `${r.appVersion || '–'} · ${r.contentBase || '–'}${r.isFixture ? ' (Demo)' : ''}`),
        kv('device', r.device || '–'),
        kv('status', r.syncedAt ? inl({ uk: `${uiT('synced').uk} ${fmtDateTime(r.syncedAt)}`, de: uiT('synced').de }) : inl('only_here'))),
      h('details', { class: 'r-details r-details-inline' },
        h('summary', { class: 'r-details-summary' }, h('span', { class: 'r-details-title' }, uiLabel('task_json', { hold: true, layout: 'inline' })), icon('chevron-down', { cls: 'r-details-chev' })),
        h('pre', { class: 'r-json' }, JSON.stringify(r.exercise, null, 2))),
      h('button', { type: 'button', class: 'btn btn-ghost r-del', on: { click: () => onDelete(r) } }, icon('trash'), holdLabel('delete_report')));
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
        h('span', { class: 'r-item-title' }, uiLabel(categoryUi(r.category), { hold: true, layout: 'inline' })),
        h('span', { class: 'r-item-sub' }, uiLabel({
          uk: [r.lessonId, typeUi(r.exType).uk, relTime(r.createdAt).uk].filter(Boolean).join(' · '),
          de: [typeLabel(r.exType), relTime(r.createdAt).de].filter(Boolean).join(' · '),
        }, { hold: true, layout: 'inline' })),
        summary ? h('span', { class: 'r-item-snippet' }, summary) : null),
      h('span', { class: ['badge', r.syncedAt ? 'green' : '', 'r-item-badge'], title: uiT(r.syncedAt ? 'synced' : 'local').de }, r.syncedAt ? icon('check') : null, ukText(uiT(r.syncedAt ? 'synced' : 'local').uk, { hold: true })),
      icon('chevron-down', { cls: 'r-item-chev' }));
    const el = h('article', { class: ['r-item', open && 'is-open'] }, head, body);
    return el;
  }
  const kv = (k, v) => [h('dt', uiLabel(k, { layout: 'inline' })), h('dd', v)];

  async function onDelete(r) {
    const ok = await confirmDialog({ title: uiT('delete_report_q'), message: r.syncedAt ? 'Beim nächsten Sync wird sie auch aus dem Gist entfernt.' : 'Die Meldung wurde noch nicht synchronisiert.', ok: uiT('delete'), destructive: true });
    if (!ok) return;
    deleteReport(app, r.id);
    haptic('medium');
    toast({ uk: uiT('deleted').uk, de: 'Meldung gelöscht' });
  }
  async function onClearAll() {
    const ok = await confirmDialog({ title: uiT('delete_all_q'), message: 'Das kann nicht rückgängig gemacht werden. Vorher als .txt sichern?', ok: uiT('delete_all'), destructive: true });
    if (!ok) return;
    clearReports(app);
    toast({ uk: uiT('all_deleted').uk, de: 'Alle Meldungen gelöscht' });
  }

  function refresh() {
    const reports = sortedReports(store.state.reports);
    clear(heroHost).append(hero(reports));
    clear(listHost);
    if (!reports.length) {
      listHost.append(h('div', { class: 'r-empty' },
        h('div', { class: 'r-empty-glyph' }, icon('flag')),
        h('div', { class: 't-title3' }, uiLabel('no_reports')),
        h('p', { class: 't-sub t-2 ui-de', lang: 'de' }, 'Fällt dir in einer Aufgabe etwas auf – ein Fehler, eine falsche Betonung oder eine unfaire Bewertung –, tippe oben auf die Flagge. Alle Meldungen landen hier gebündelt.')));
      return;
    }
    listHost.append(
      h('div', { class: 'section-header' }, (() => {
        const c = ukCount(reports.length, 'report'), nf = uiT('newest_first');
        return uiLabel({ uk: `${c.uk} · ${nf.uk}`, de: `${c.de} · ${nf.de}` }, { layout: 'inline' });
      })()),
      h('div', { class: 'r-list' }, reports.map(item)),
      h('button', { type: 'button', class: 'r-clear', on: { click: onClearAll } }, holdLabel('delete_all_reports', { layout: 'inline' })));
  }

  refresh();
  const unsub = store.subscribe(() => { if (!busy) refresh(); });

  const el = page({
    title: uiT('reports'),
    subtitle: h('div', { class: 'page-subtitle' }, uiLabel('reports_sub')),
    back: { label: uiT('tab_more'), href: '#/settings' },
    cls: 'r-page',
    children: [heroHost, listHost],
  });
  return { el, destroy: unsub };
}
