// #/settings – Einstellungen im iOS-Stil (inset-grouped, Icon-Kacheln, Schalter, Segmented Control).
// Änderungen werden sofort per store.update gespeichert.
import { h, icon, clear } from '../ui/dom.js';
import { page, listGroup, switchEl, segmented, toast, confirmDialog } from '../ui/shell.js';
import { applyTheme } from '../ui/theme.js';
import { haptic } from '../ui/haptics.js';
import { audioMode, setAudioOff } from '../audio-mode.js';
import { openAudioModeSheet } from '../ui/audio-mode-sheet.js';
import { unsyncedCount, fmtDateTime } from '../services/reports.js';
import { backupJSON, backupFilename, parseBackup, backupSummary, applyBackup, shareOrDownload, readFileText } from '../services/export.js';
import { syncReports, backupProgress, restoreProgress, testToken, errorMessage, gistUrl, TOKEN_URL } from '../services/gist.js';
import { DEFAULT_TARGET_DATE } from '../config.js';

const TEST_PHRASE = 'Приві́т! Мене́ звуть Окса́на. Як спра́ви?';

function daysUntil(dateStr) {
  const t = new Date(dateStr + 'T00:00:00');
  if (isNaN(t)) return null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((t - now) / 864e5);
}
function untilLabel(u) {
  if (!u || u === 'forever') return '';
  const d = new Date(u);
  const t = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  return d.toDateString() === new Date().toDateString() ? `bis ${t} Uhr` : `bis morgen, ${t} Uhr`;
}
function relOrNever(iso) { return iso ? fmtDateTime(iso) : 'noch nie'; }
const isStandalone = () => { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch { return false; } };

export function render(params, app) {
  const { store, tts, stt } = app;
  const S = () => store.state.settings;
  const set = (key, val) => store.update(s => { s.settings[key] = val; });
  const cleanups = [];

  // ---------- Bausteine ----------
  /** Stepper wie UIStepper: −/+ mit Wertanzeige */
  function stepper({ key, min, max, step = 1, unit = '' }) {
    const val = h('span', { class: 's-step-value num' });
    const minus = h('button', { type: 'button', class: 's-step-btn', 'aria-label': 'Weniger' }, h('span', '−'));
    const plus = h('button', { type: 'button', class: 's-step-btn', 'aria-label': 'Mehr' }, h('span', '+'));
    const sync = () => {
      const v = S()[key];
      val.textContent = unit ? `${v} ${unit}` : String(v);
      minus.disabled = v <= min; plus.disabled = v >= max;
    };
    const change = d => {
      const v = Math.min(max, Math.max(min, (Number(S()[key]) || min) + d));
      set(key, v); haptic('select'); sync();
    };
    minus.addEventListener('click', () => change(-step));
    plus.addEventListener('click', () => change(step));
    sync();
    return h('span', { class: 's-step-wrap' }, val, h('span', { class: 's-stepper' }, minus, h('span', { class: 's-step-sep' }), plus));
  }
  const sw = (key, extra) => switchEl({ checked: !!S()[key], label: key, onChange: v => { set(key, v); haptic('select'); extra?.(v); } });
  const tile = (name, color, emoji) => ({ name, color, emoji });

  /** Slider-Zeile (Titel + Wert, darunter Regler) */
  function sliderRow({ key, title, min, max, step, fmt, ic }) {
    const out = h('span', { class: 's-slider-val num' });
    const input = h('input', { type: 'range', class: 's-range', min, max, step, value: S()[key], 'aria-label': title });
    const paint = () => {
      const v = Number(input.value);
      out.textContent = fmt(v);
      input.style.setProperty('--s-fill', `${((v - min) / (max - min)) * 100}%`);
    };
    input.addEventListener('input', paint);
    input.addEventListener('change', () => { set(key, Number(input.value)); haptic('select'); });
    paint();
    return h('div', { class: 'list-row has-icon s-slider-row' },
      h('span', { class: 'row-icon', style: { background: ic.color } }, icon(ic.name)),
      h('div', { class: 's-slider-main' },
        h('div', { class: 's-slider-head' }, h('span', { class: 'row-title' }, title), out),
        h('div', { class: 's-slider-track' }, h('span', { class: 's-slider-cap' }, icon('turtle')), input, h('span', { class: 's-slider-cap' }, icon('speaker')))));
  }

  /** Bereich, der sich neu aufbauen kann */
  function region(build) {
    const host = h('div', { class: 's-region' });
    host.refresh = () => { clear(host); const out = build(); if (out) host.append(out); };
    host.refresh();
    return host;
  }

  // ---------- Kopf: Ziel ----------
  const heroRegion = region(() => {
    const d = daysUntil(S().targetDate || DEFAULT_TARGET_DATE);
    const target = new Date((S().targetDate || DEFAULT_TARGET_DATE) + 'T00:00:00');
    return h('div', { class: 's-hero' },
      h('div', { class: 's-hero-logo', 'aria-hidden': 'true' }, h('span', 'М')),
      h('div', { class: 's-hero-main' },
        h('div', { class: 's-hero-title' }, 'Мова · Ukrainisch A1'),
        h('div', { class: 's-hero-sub' }, isNaN(target) ? 'Kein Zieldatum' : `Ziel: ${target.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}`)),
      d != null ? h('div', { class: ['s-hero-count', d < 0 && 'is-past'] },
        h('div', { class: 's-hero-num num' }, String(Math.abs(d))),
        h('div', { class: 's-hero-unit' }, d < 0 ? 'Tage drüber' : (d === 1 ? 'Tag' : 'Tage'))) : null);
  });

  // ---------- Lernen ----------
  const dateInput = h('input', { type: 'date', class: 's-date', value: S().targetDate || DEFAULT_TARGET_DATE, min: new Date().toISOString().slice(0, 10), 'aria-label': 'Zieldatum' });
  dateInput.addEventListener('change', () => { if (dateInput.value) { set('targetDate', dateInput.value); heroRegion.refresh(); } });
  const learn = listGroup({
    header: 'Lernen',
    footer: 'Das Tagesziel zählt bewertete Aufgaben. Eine Session hat so viele Aufgaben wie die Session-Länge.',
    rows: [
      { title: 'Tagesziel', subtitle: 'Aufgaben pro Tag', icon: tile('target', 'var(--green)'), accessory: stepper({ key: 'dailyGoal', min: 5, max: 60, step: 5 }) },
      { title: 'Neue Wörter', subtitle: 'pro Session', icon: tile('sparkles', 'var(--yellow)'), accessory: stepper({ key: 'newWordsPerSession', min: 2, max: 10 }) },
      { title: 'Session-Länge', subtitle: 'Aufgaben (10–20)', icon: tile('clock', 'var(--blue)'), accessory: stepper({ key: 'sessionSize', min: 10, max: 20 }) },
      { title: 'Zieldatum', icon: tile('calendar', 'var(--red)'), accessory: dateInput },
      { title: 'Deutsche Hilfen', subtitle: 'Übersetzungen und Hinweise anzeigen', icon: tile('bulb', 'var(--orange)'), accessory: sw('showGermanHints') },
    ],
  });

  // ---------- Ton (Hören/Sprechen aus) ----------
  const toneRegion = region(() => {
    const m = audioMode(app);
    const tempRows = [];
    for (const [k, label] of [['listen', 'Hören'], ['speak', 'Sprechen']]) {
      const u = m[k + 'Until'];
      if (u && u !== 'forever') {
        tempRows.push({
          title: `${label} zeitweise aus`, subtitle: untilLabel(u), icon: tile(k === 'listen' ? 'ear' : 'mic', 'var(--label-3)'), cls: 's-temp',
          accessory: h('button', { type: 'button', class: 'btn btn-sm btn-secondary', on: { click: () => { setAudioOff(app, { [k]: true, duration: 'on' }); haptic('select'); } } }, 'Wieder an'),
        });
      }
    }
    const permanent = k => switchEl({
      checked: !!S()[k + 'Off'], label: k,
      onChange: v => { setAudioOff(app, { [k === 'listen' ? 'listen' : 'speak']: true, duration: v ? 'forever' : 'on' }); haptic('select'); },
    });
    return listGroup({
      header: 'Ton',
      footer: 'Aus: Hör- und Sprechaufgaben werden ausgelassen oder durch Textvarianten ersetzt – ohne Nachteil für die Wiederholung.',
      rows: [
        { title: 'Gerade kein Ton …', subtitle: 'Für 1 Stunde oder bis morgen ausschalten', icon: tile('headphones', 'var(--purple)'), accessory: 'chevron',
          onClick: () => openAudioModeSheet(app).then(() => toneRegion.refresh()) },
        ...tempRows,
        { title: 'Hören dauerhaft aus', icon: tile('ear', 'var(--pink)'), accessory: permanent('listen') },
        { title: 'Sprechen dauerhaft aus', icon: tile('mic', 'var(--orange)'), accessory: permanent('speak') },
      ],
    });
  });
  const onAudioMode = () => toneRegion.refresh();
  addEventListener('mova:audiomode', onAudioMode);
  cleanups.push(() => removeEventListener('mova:audiomode', onAudioMode));

  // ---------- Audio & Sprechen ----------
  const voiceRegion = region(() => {
    const voices = tts?.supported ? (tts.voices?.() || []) : [];
    const sel = h('select', { class: 's-select', 'aria-label': 'Stimme' },
      h('option', { value: '' }, 'Automatisch'),
      voices.map(v => h('option', { value: v.voiceURI }, v.name + (v.localService === false ? ' (online)' : ''))));
    sel.value = voices.some(v => v.voiceURI === S().voiceURI) ? S().voiceURI : '';
    sel.addEventListener('change', () => { set('voiceURI', sel.value || null); try { tts.init?.(S()); } catch {} });
    const noVoice = typeof tts?.needsVoiceHint === 'function' ? tts.needsVoiceHint() : (!tts?.supported || !voices.length);
    const warn = noVoice ? h('div', { class: 's-warn' },
      h('div', { class: 's-warn-head' }, h('span', { class: 's-warn-icon' }, '!'), h('strong', tts?.supported ? 'Keine ukrainische Stimme installiert' : 'Sprachausgabe nicht verfügbar')),
      tts?.supported ? [
        h('p', 'Ohne ukrainische Stimme bleiben Hörübungen stumm. So lädst du sie auf dem iPhone/iPad:'),
        h('ol', { class: 's-steps' },
          h('li', h('b', 'Einstellungen'), ' öffnen'),
          h('li', h('b', 'Bedienungshilfen'), ' → ', h('b', 'Gesprochene Inhalte')),
          h('li', h('b', 'Stimmen'), ' → ', h('b', 'Ukrainisch'), ' → Stimme laden (z. B. „Lesya“)'),
          h('li', 'Diese App ', h('b', 'ganz schließen'), ' und neu öffnen')),
      ] : h('p', 'Dieser Browser unterstützt keine Sprachausgabe. Bitte Safari auf iPhone/iPad verwenden.')) : null;
    const testBtn = h('button', { type: 'button', class: 'btn btn-blue btn-sm s-test', disabled: !tts?.supported, on: { click: async () => {
      testBtn.classList.add('is-playing');
      const r = await tts.speak(TEST_PHRASE, { rate: S().rate });
      testBtn.classList.remove('is-playing');
      if (r && r.ok === false && r.reason !== 'interrupted') toast(r.reason === 'no-voice' ? 'Keine ukrainische Stimme gefunden' : 'Wiedergabe nicht möglich', { kind: 'bad' });
    } } }, icon('play'), 'Testen');
    return h('div', { class: 's-stack' }, warn, listGroup({
      header: 'Audio & Sprechen',
      footer: stt?.supported ? 'Spracherkennung (uk-UA) bewertet deine Aussprache in Sprechaufgaben.' : 'Spracherkennung ist auf diesem Gerät nicht verfügbar – Sprechaufgaben nutzen dann die Selbstbewertung.',
      rows: [
        { title: 'Stimme', icon: tile('speaker', 'var(--blue)'), accessory: h('span', { class: 's-select-wrap' }, sel, icon('chevron-down', { cls: 's-select-chev' })) },
        { title: 'Stimme testen', subtitle: TEST_PHRASE, icon: tile('play', 'var(--green)'), accessory: testBtn, cls: 's-testrow' },
        sliderRow({ key: 'rate', title: 'Sprechtempo', min: 0.5, max: 1.2, step: 0.05, fmt: v => `${Math.round(v * 100)} %`, ic: tile('speaker', 'var(--purple)') }),
        sliderRow({ key: 'slowRate', title: 'Langsames Tempo', min: 0.3, max: 0.9, step: 0.05, fmt: v => `${Math.round(v * 100)} %`, ic: tile('turtle', 'var(--green)') }),
        { title: 'Automatisch abspielen', subtitle: 'Audio beim Anzeigen einer Aufgabe', icon: tile('play', 'var(--orange)'), accessory: sw('autoplay') },
        { title: 'Spracherkennung verwenden', subtitle: stt?.supported ? null : 'Nicht unterstützt', icon: tile('mic', 'var(--red)'),
          accessory: stt?.supported ? sw('stt') : switchEl({ checked: false, label: 'stt' }), cls: !stt?.supported && 's-disabled' },
      ],
    }));
  });
  if (tts?.onVoicesChanged) {
    const off = tts.onVoicesChanged(() => voiceRegion.refresh());
    if (typeof off === 'function') cleanups.push(off);
  }
  // Rate-Regler sollen tts sofort beeinflussen
  cleanups.push(store.subscribe(() => { try { tts.init?.(S()); } catch {} }));

  // ---------- Darstellung ----------
  const look = listGroup({
    header: 'Darstellung',
    rows: [
      h('div', { class: 'list-row has-icon s-seg-row' },
        h('span', { class: 'row-icon', style: { background: 'var(--label-2)' } }, icon('moon')),
        h('span', { class: 'row-main' }, h('span', { class: 'row-title' }, 'Erscheinungsbild')),
        segmented({
          options: [{ value: 'light', label: 'Hell' }, { value: 'dark', label: 'Dunkel' }, { value: 'auto', label: 'Auto' }],
          value: S().theme || 'auto',
          onChange: v => { set('theme', v); applyTheme(v); haptic('select'); },
        })),
      { title: 'Haptik', subtitle: 'Vibration bei Antworten (wo unterstützt)', icon: tile('sparkles', 'var(--pink)'), accessory: sw('haptics') },
    ],
  });

  // ---------- Sammlung: Meldungen, gesammelte Sätze ----------
  const collectRegion = region(() => {
    const n = (store.state.reports || []).length;
    const open = unsyncedCount(store.state.reports);
    const mined = (store.state.mined || []).length;
    return listGroup({
      header: 'Sammlung',
      rows: [
        { title: 'Meldungen', subtitle: n ? (open ? `${open} nicht synchronisiert` : 'alle synchronisiert') : 'Fehler in Aufgaben melden (Flagge)', icon: tile('flag', 'var(--red)'),
          detail: String(n), accessory: 'chevron', href: '#/reports' },
        { title: 'Gesammelte Sätze', subtitle: 'Im Vokabeltrainer üben', icon: tile('book', 'var(--green)'),
          detail: String(mined), accessory: 'chevron', href: '#/trainer' },
      ],
    });
  });

  // ---------- Sync (GitHub Gist) ----------
  let syncBusy = '';
  const syncRegion = region(() => {
    const s = S();
    const hasToken = !!String(s.gistToken || '').trim();
    const token = h('input', { type: 'password', class: 's-token', value: s.gistToken || '', placeholder: 'ghp_… / github_pat_…', autocomplete: 'off', autocapitalize: 'off', spellcheck: false, 'aria-label': 'GitHub-Token' });
    const eye = h('button', { type: 'button', class: 'icon-btn s-eye', 'aria-label': 'Token anzeigen', on: { click: () => { token.type = token.type === 'password' ? 'text' : 'password'; } } }, icon('lock'));
    token.addEventListener('change', () => {
      const v = token.value.trim();
      if (v === (S().gistToken || '')) return;
      set('gistToken', v);
      toast(v ? 'Token gespeichert (nur auf diesem Gerät)' : 'Token entfernt');
      syncRegion.refresh();
    });
    const action = (id, title, ic, fn, sub) => ({
      title: h('span', { class: 'row-title s-action-title' }, title), subtitle: sub, icon: ic,
      cls: ['s-action', syncBusy === id && 'is-busy', !hasToken && 's-disabled'].filter(Boolean).join(' '),
      accessory: syncBusy === id ? h('span', { class: 's-spinner', 'aria-label': 'Läuft' }) : null,
      onClick: () => run(id, fn),
    });
    const gistRow = s.gistId
      ? { title: 'Gist', icon: tile('github', '#24292F'), detail: h('a', { class: 's-gist-link', href: gistUrl(s.gistId), target: '_blank', rel: 'noopener' }, s.gistId.slice(0, 8) + '…', icon('share')) }
      : { title: 'Gist', icon: tile('github', '#24292F'), detail: 'wird beim ersten Sync angelegt' };
    return listGroup({
      header: h('span', { id: 's-sync' }, 'Sync (GitHub Gist)'),
      footer: h('div', { class: 's-footnote' },
        h('div', `Letzter Sync: ${relOrNever(store.state.meta.lastSyncAt)} · Letzte Sicherung: ${relOrNever(store.state.meta.lastBackupAt)}`),
        h('div', { class: 's-caution' }, icon('info'),
          h('span', 'Nutzung eigenverantwortlich – der Token wird nur lokal auf diesem Gerät gespeichert und ausschließlich an api.github.com gesendet. Er landet nie im Backup. Verwende einen Token nur mit dem Scope „gist“ und widerrufe ihn bei Verlust des Geräts. ',
            h('a', { href: TOKEN_URL, target: '_blank', rel: 'noopener' }, 'Token erstellen')))),
      rows: [
        h('div', { class: 'list-row has-icon s-token-row' },
          h('span', { class: 'row-icon', style: { background: 'var(--label)' } }, icon('lock')),
          h('span', { class: 'row-title s-token-label' }, 'Token'), token, eye),
        gistRow,
        { title: 'Meldungen automatisch syncen', subtitle: 'nach jeder neuen Meldung', icon: tile('flag', 'var(--orange)'), accessory: sw('gistAutoSync') },
        { title: 'Fortschritt automatisch sichern', subtitle: 'nach jeder Session', icon: tile('cloud', 'var(--blue)'), accessory: sw('gistBackup') },
        action('sync', 'Jetzt synchronisieren', tile('refresh', 'var(--green)'), async () => {
          const r = await syncReports(app);
          toast(r.created ? 'Privater Gist angelegt – Meldungen synchronisiert' : `${r.count} ${r.count === 1 ? 'Meldung' : 'Meldungen'} synchronisiert`, { kind: 'ok' });
        }),
        action('backup', 'Fortschritt sichern', tile('cloud', 'var(--blue)'), async () => {
          await backupProgress(app);
          toast('Fortschritt im Gist gesichert', { kind: 'ok' });
        }),
        action('restore', 'Fortschritt wiederherstellen', tile('download', 'var(--purple)'), async () => {
          const r = await restoreProgress(app, {
            confirm: f => confirmDialog({ title: 'Fortschritt wiederherstellen?', message: `Backup: ${f.summary}. Der aktuelle Fortschritt auf diesem Gerät wird ersetzt. Token und Gist bleiben.`, ok: 'Wiederherstellen', destructive: true }),
          });
          if (r.restored) { applyTheme(S().theme); toast('Fortschritt wiederhergestellt', { kind: 'ok' }); rebuild(); }
        }),
        hasToken ? { title: 'Token prüfen', icon: tile('check', 'var(--label-2)'), cls: 's-action s-action-quiet', accessory: syncBusy === 'test' ? h('span', { class: 's-spinner' }) : null,
          onClick: () => run('test', async () => {
            const r = await testToken(app);
            toast(r.hasGistScope === false ? `Angemeldet als ${r.login} – aber Scope „gist“ fehlt!` : `Token gültig – ${r.login}`, { kind: r.hasGistScope === false ? 'bad' : 'ok', ms: 3200 });
          }) } : null,
      ],
    });
  });
  async function run(id, fn) {
    if (syncBusy) return;
    if (!String(S().gistToken || '').trim()) { toast('Bitte zuerst einen GitHub-Token eintragen', { kind: 'bad' }); return; }
    syncBusy = id; syncRegion.refresh();
    try { await fn(); haptic('success'); }
    catch (e) { haptic('error'); toast(errorMessage(e), { kind: 'bad', ms: 4200 }); }
    finally { syncBusy = ''; syncRegion.refresh(); collectRegion.refresh(); }
  }

  // ---------- Daten ----------
  const fileInput = h('input', { type: 'file', accept: 'application/json,.json', hidden: true });
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files?.[0];
    fileInput.value = '';
    if (!f) return;
    try {
      const raw = await readFileText(f);
      const state = parseBackup(raw);
      let exportedAt = null; try { exportedAt = JSON.parse(raw).exportedAt; } catch {}
      const ok = await confirmDialog({ title: 'Backup importieren?', message: `${backupSummary(state, exportedAt)}. Der aktuelle Fortschritt wird ersetzt. Token und Gist bleiben.`, ok: 'Importieren', destructive: true });
      if (!ok) return;
      applyBackup(store, state);
      applyTheme(S().theme);
      toast('Backup importiert', { kind: 'ok' });
      rebuild();
    } catch (e) { toast(errorMessage(e), { kind: 'bad', ms: 4000 }); }
  });
  const data = listGroup({
    header: 'Daten',
    footer: 'Das Backup enthält Fortschritt, Wiederholungen, Meldungen, gesammelte Sätze und Einstellungen – aber keinen Token.',
    rows: [
      { title: 'Backup exportieren', subtitle: 'JSON-Datei teilen oder sichern', icon: tile('share', 'var(--blue)'), accessory: 'chevron',
        onClick: async () => {
          const r = await shareOrDownload(backupFilename(), backupJSON(store, { appVersion: app.version }), 'application/json');
          if (r === 'downloaded') toast('Backup heruntergeladen', { kind: 'ok' });
        } },
      { title: 'Backup importieren', subtitle: 'aus einer JSON-Datei', icon: tile('download', 'var(--green)'), accessory: 'chevron', onClick: () => fileInput.click() },
      { title: h('span', { class: 'row-title s-danger' }, 'Fortschritt zurücksetzen'), icon: tile('trash', 'var(--red)'), cls: 's-action',
        onClick: async () => {
          const ok = await confirmDialog({ title: 'Wirklich alles zurücksetzen?', message: 'Fortschritt, Wiederholungen, Serie, Meldungen und Einstellungen werden gelöscht. Token und Gist bleiben. Das kann nicht rückgängig gemacht werden.', ok: 'Zurücksetzen', destructive: true });
          if (!ok) return;
          store.reset();
          applyTheme(S().theme);
          haptic('medium');
          toast('Fortschritt zurückgesetzt');
          rebuild();
        } },
    ],
  });

  // ---------- Info ----------
  const c = app.content || {};
  const lessonsReady = c.lessons?.size ?? 0;
  const info = h('div', { class: 's-stack' },
    isStandalone() ? null : h('div', { class: 's-install' },
      h('div', { class: 's-install-icon' }, icon('share')),
      h('div', { class: 's-install-main' },
        h('strong', 'Zum Home-Bildschirm hinzufügen'),
        h('p', 'In Safari unten auf ', h('b', 'Teilen'), ' tippen und ', h('b', '„Zum Home-Bildschirm“'), ' wählen. Dann läuft Мова wie eine App – im Vollbild, offline, und deine Daten bleiben dauerhaft gespeichert.'))),
    listGroup({
      header: 'Info',
      rows: [
        { title: 'Version', icon: tile('info', 'var(--label-2)'), detail: app.version || '–' },
        { title: 'Inhalte', icon: tile('book', 'var(--blue)'), detail: c.isFixture ? 'Demo-Inhalte' : (c.base || '–'), subtitle: c.isFixture ? c.base : null },
        { title: 'Lektionen', icon: tile('course', 'var(--green)'), detail: String(lessonsReady) },
        { title: 'Lexikon-Einträge', icon: tile('words', 'var(--purple)'), detail: String(app.lexicon?.size ?? 0) },
        { title: 'Speicher dauerhaft', icon: tile('lock', store.persisted ? 'var(--green)' : 'var(--orange)'), detail: store.persisted ? 'Ja' : 'Nein',
          subtitle: store.persisted ? null : 'Als Home-Bildschirm-App wird der Speicher nicht automatisch geleert.' },
      ],
    }));

  const sections = [heroRegion, learn, toneRegion, voiceRegion, look, collectRegion, syncRegion, data, info, fileInput];
  const el = page({ title: 'Einstellungen', cls: 's-page', children: h('div', { class: 's-grid' }, sections) });

  function rebuild() { app.navigate('#/settings', { replace: true }); }

  // Externe Änderungen (z. B. Auto-Sync, neue Meldung) → Zähler/Status aktualisieren
  cleanups.push(store.subscribe(() => { if (!syncBusy) collectRegion.refresh(); }));

  return {
    el,
    onShow() {
      if (params?.query?.get('focus') === 'sync') {
        requestAnimationFrame(() => document.getElementById('s-sync')?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
      }
    },
    destroy() { for (const f of cleanups) { try { f(); } catch {} } },
  };
}
