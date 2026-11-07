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
import { uiLabel, holdLabel, uiT } from '../ui/ui-label.js';
import { ukWord, syncedToast } from '../ui-text-g3.js';

/** Zeilentitel ukrainisch (+ Deutsch daneben); hold für antippbare Zeilen (Aktion). */
const RT = (k, hold = false) => uiLabel(k, { cls: 'row-title', hold });
const HDR = k => uiLabel(k, { layout: 'inline' });
/** Deutsche Erläuterung (Hilfe) unter einer Zeile – per „Deutsche Hilfen“ abschaltbar. */
const DE = text => h('span', { class: 'row-subtitle ui-de', lang: 'de' }, text);
/** Ukrainischer Status/Untertitel (+ Deutsch) */
const SUB = label => uiLabel(label, { cls: 'row-subtitle', layout: 'inline' });
/** Deutscher Fußtext als Hilfe */
const FOOT = text => h('span', { class: 'ui-de', lang: 'de' }, text);
const pad2 = n => String(n).padStart(2, '0');
const numDate = d => `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;

const TEST_PHRASE = 'Приві́т! Мене́ звуть Окса́на. Як спра́ви?';

function daysUntil(dateStr) {
  const t = new Date(dateStr + 'T00:00:00');
  if (isNaN(t)) return null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((t - now) / 864e5);
}
/** „zeitweise bis …“ → {uk, de} */
function untilLabel(u) {
  if (!u || u === 'forever') return { uk: '', de: '' };
  const d = new Date(u);
  const t = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const today = d.toDateString() === new Date().toDateString();
  const tmp = uiT('temporarily'), until = uiT('until'), tom = uiT('tomorrow');
  return today
    ? { uk: `${tmp.uk} ${until.uk} ${t}`, de: `${tmp.de} bis ${t} Uhr` }
    : { uk: `${tmp.uk}: ${tom.uk} ${until.uk} ${t}`, de: `${tmp.de} bis morgen, ${t} Uhr` };
}
function relOrNever(iso) { return iso ? { uk: fmtDateTime(iso), de: '' } : uiT('never'); }
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
    const input = h('input', { type: 'range', class: 's-range', min, max, step, value: S()[key], 'aria-label': uiT(title).de });
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
        h('div', { class: 's-slider-head' }, RT(title), out),
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
        h('div', { class: 's-hero-title' }, uiLabel('app_title', { layout: 'inline' })),
        h('div', { class: 's-hero-sub' }, isNaN(target) ? uiLabel('no_target_date', { layout: 'inline' })
          : uiLabel({ uk: `${uiT('goal').uk}: ${numDate(target)}`, de: `Ziel: ${target.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}` }, { layout: 'inline' }))),
      d != null ? h('div', { class: ['s-hero-count', d < 0 && 'is-past'] },
        h('div', { class: 's-hero-num num' }, String(Math.abs(d))),
        h('div', { class: 's-hero-unit' }, d < 0
          ? uiLabel({ uk: `${ukWord(-d, 'day').uk} ${uiT('ago').uk}`, de: uiT('days_ago').de })
          : uiLabel(ukWord(d, 'day')))) : null);
  });

  // ---------- Lernen ----------
  const dateInput = h('input', { type: 'date', class: 's-date', value: S().targetDate || DEFAULT_TARGET_DATE, min: new Date().toISOString().slice(0, 10), 'aria-label': 'Zieldatum' });
  dateInput.addEventListener('change', () => { if (dateInput.value) { set('targetDate', dateInput.value); heroRegion.refresh(); } });
  const learn = listGroup({
    header: HDR('learning'),
    footer: FOOT('Das Tagesziel zählt bewertete Aufgaben. Eine Session hat so viele Aufgaben wie die Session-Länge.'),
    rows: [
      { title: RT('daily_goal'), subtitle: DE('Aufgaben pro Tag'), icon: tile('target', 'var(--green)'), accessory: stepper({ key: 'dailyGoal', min: 5, max: 60, step: 5 }) },
      { title: RT('new_words'), subtitle: DE('pro Session'), icon: tile('sparkles', 'var(--yellow)'), accessory: stepper({ key: 'newWordsPerSession', min: 2, max: 10 }) },
      { title: RT('session_length'), subtitle: DE('Aufgaben (10–20)'), icon: tile('clock', 'var(--blue)'), accessory: stepper({ key: 'sessionSize', min: 10, max: 20 }) },
      { title: RT('target_date'), icon: tile('calendar', 'var(--red)'), accessory: dateInput },
      { title: RT('german_hints'), subtitle: DE('Deutsche Übersetzungen unter ukrainischen Texten und Hinweise anzeigen'), icon: tile('bulb', 'var(--orange)'), accessory: sw('showGermanHints') },
    ],
  });

  // ---------- Ton (Hören/Sprechen aus) ----------
  const toneRegion = region(() => {
    const m = audioMode(app);
    const tempRows = [];
    for (const [k, label] of [['listen', 'no_listening'], ['speak', 'no_speaking']]) {
      const u = m[k + 'Until'];
      if (u && u !== 'forever') {
        tempRows.push({
          title: RT(label), subtitle: SUB(untilLabel(u)), icon: tile(k === 'listen' ? 'ear' : 'mic', 'var(--label-3)'), cls: 's-temp',
          accessory: h('button', { type: 'button', class: 'btn btn-sm btn-secondary', on: { click: () => { setAudioOff(app, { [k]: true, duration: 'on' }); haptic('select'); } } }, holdLabel('turn_on', { de: false })),
        });
      }
    }
    const permanent = k => switchEl({
      checked: !!S()[k + 'Off'], label: k,
      onChange: v => { setAudioOff(app, { [k === 'listen' ? 'listen' : 'speak']: true, duration: v ? 'forever' : 'on' }); haptic('select'); },
    });
    return listGroup({
      header: HDR('sound'),
      footer: FOOT('Aus: Hör- und Sprechaufgaben werden ausgelassen oder durch Textvarianten ersetzt – ohne Nachteil für die Wiederholung.'),
      rows: [
        { title: RT('no_sound_now', true), subtitle: DE('Für 1 Stunde oder bis morgen ausschalten'), icon: tile('headphones', 'var(--purple)'), accessory: 'chevron',
          onClick: () => openAudioModeSheet(app).then(() => toneRegion.refresh()) },
        ...tempRows,
        { title: RT('no_listening'), subtitle: SUB('forever'), icon: tile('ear', 'var(--pink)'), accessory: permanent('listen') },
        { title: RT('no_speaking'), subtitle: SUB('forever'), icon: tile('mic', 'var(--orange)'), accessory: permanent('speak') },
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
      h('option', { value: '' }, 'Auto'),
      voices.map(v => h('option', { value: v.voiceURI }, v.name + (v.localService === false ? ' (online)' : ''))));
    sel.value = voices.some(v => v.voiceURI === S().voiceURI) ? S().voiceURI : '';
    sel.addEventListener('change', () => { set('voiceURI', sel.value || null); try { tts.init?.(S()); } catch {} });
    const noVoice = typeof tts?.needsVoiceHint === 'function' ? tts.needsVoiceHint() : (!tts?.supported || !voices.length);
    const warn = noVoice ? h('div', { class: 's-warn' },
      h('div', { class: 's-warn-head' }, h('span', { class: 's-warn-icon' }, '!'), h('strong', uiLabel(tts?.supported ? 'no_uk_voice' : 'no_voice'))),
      tts?.supported ? [
        h('p', { class: 'de', lang: 'de' }, 'Ohne ukrainische Stimme bleiben Hörübungen stumm. So lädst du sie auf dem iPhone/iPad:'),
        h('ol', { class: 's-steps de', lang: 'de' },
          h('li', h('b', 'Einstellungen'), ' öffnen'),
          h('li', h('b', 'Bedienungshilfen'), ' → ', h('b', 'Gesprochene Inhalte')),
          h('li', h('b', 'Stimmen'), ' → ', h('b', 'Ukrainisch'), ' → Stimme laden (z. B. „Lesya“)'),
          h('li', 'Diese App ', h('b', 'ganz schließen'), ' und neu öffnen')),
      ] : h('p', { class: 'de', lang: 'de' }, 'Dieser Browser unterstützt keine Sprachausgabe. Bitte Safari auf iPhone/iPad verwenden.')) : null;
    const testBtn = h('button', { type: 'button', class: 'btn btn-blue btn-sm s-test', disabled: !tts?.supported, on: { click: async () => {
      testBtn.classList.add('is-playing');
      const r = await tts.speak(TEST_PHRASE, { rate: S().rate });
      testBtn.classList.remove('is-playing');
      if (r && r.ok === false && r.reason !== 'interrupted') toast(uiT(r.reason === 'no-voice' ? 'no_uk_voice' : 'playback_error'), { kind: 'bad' });
    } } }, icon('play'), holdLabel('test', { de: false }));
    return h('div', { class: 's-stack' }, warn, listGroup({
      header: HDR('voice'),
      footer: FOOT(stt?.supported ? 'Spracherkennung (uk-UA) bewertet deine Aussprache in Sprechaufgaben.' : 'Spracherkennung ist auf diesem Gerät nicht verfügbar – Sprechaufgaben nutzen dann die Selbstbewertung.'),
      rows: [
        { title: RT('voice'), icon: tile('speaker', 'var(--blue)'), accessory: h('span', { class: 's-select-wrap' }, sel, icon('chevron-down', { cls: 's-select-chev' })) },
        { title: RT('test_voice'), subtitle: TEST_PHRASE, icon: tile('play', 'var(--green)'), accessory: testBtn, cls: 's-testrow' },
        sliderRow({ key: 'rate', title: 'speech_rate', min: 0.5, max: 1.2, step: 0.05, fmt: v => `${Math.round(v * 100)} %`, ic: tile('speaker', 'var(--purple)') }),
        sliderRow({ key: 'slowRate', title: 'slow_rate', min: 0.3, max: 0.9, step: 0.05, fmt: v => `${Math.round(v * 100)} %`, ic: tile('turtle', 'var(--green)') }),
        { title: RT('autoplay'), subtitle: DE('Audio beim Anzeigen einer Aufgabe abspielen'), icon: tile('play', 'var(--orange)'), accessory: sw('autoplay') },
        { title: RT('speech_recognition'), subtitle: stt?.supported ? null : SUB('unavailable'), icon: tile('mic', 'var(--red)'),
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
    header: HDR('look'),
    rows: [
      h('div', { class: 'list-row has-icon s-seg-row' },
        h('span', { class: 'row-icon', style: { background: 'var(--label-2)' } }, icon('moon')),
        h('span', { class: 'row-main' }, RT('theme')),
        segmented({
          options: [{ value: 'light', label: uiT('light') }, { value: 'dark', label: uiT('dark') }, { value: 'auto', label: uiT('system') }],
          value: S().theme || 'auto',
          onChange: v => { set('theme', v); applyTheme(v); haptic('select'); },
        })),
      { title: RT('vibration'), subtitle: DE('Vibration bei Antworten (wo unterstützt)'), icon: tile('sparkles', 'var(--pink)'), accessory: sw('haptics') },
    ],
  });

  // ---------- Sammlung: Meldungen, gesammelte Sätze ----------
  const collectRegion = region(() => {
    const n = (store.state.reports || []).length;
    const open = unsyncedCount(store.state.reports);
    const mined = (store.state.mined || []).length;
    return listGroup({
      header: HDR('collection'),
      rows: [
        { title: RT('reports', true), subtitle: n ? SUB(open ? { uk: `${uiT('not_synced_n').uk}: ${open}`, de: `${open} ${uiT('not_synced_n').de}` } : 'all_synced') : DE('Fehler in Aufgaben melden (Flagge)'), icon: tile('flag', 'var(--red)'),
          detail: String(n), accessory: 'chevron', href: '#/reports' },
        { title: RT('my_sentences', true), subtitle: DE('Unter „Vokabeln“ üben'), icon: tile('book', 'var(--green)'),
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
      toast(uiT(v ? 'token_saved' : 'token_removed'));
      syncRegion.refresh();
    });
    const action = (id, title, ic, fn, sub) => ({
      title: uiLabel(title, { cls: 'row-title s-action-title', hold: true }), subtitle: sub, icon: ic,
      cls: ['s-action', syncBusy === id && 'is-busy', !hasToken && 's-disabled'].filter(Boolean).join(' '),
      accessory: syncBusy === id ? h('span', { class: 's-spinner', 'aria-label': 'Läuft' }) : null,
      onClick: () => run(id, fn),
    });
    const gistRow = s.gistId
      ? { title: 'Gist', icon: tile('github', '#24292F'), detail: h('a', { class: 's-gist-link', href: gistUrl(s.gistId), target: '_blank', rel: 'noopener' }, s.gistId.slice(0, 8) + '…', icon('share')) }
      : { title: 'Gist', icon: tile('github', '#24292F'), detail: uiLabel('gist_later', { cls: 'row-detail' }) };
    return listGroup({
      header: h('span', { id: 's-sync' }, HDR('sync')),
      footer: h('div', { class: 's-footnote' },
        [['last_sync', store.state.meta.lastSyncAt], ['last_backup', store.state.meta.lastBackupAt]].map(([k, iso]) => {
          const v = relOrNever(iso), l = uiT(k);
          return h('div', uiLabel({ uk: `${l.uk}: ${v.uk}`, de: `${l.de}: ${v.de || v.uk}` }, { layout: 'inline' }));
        }),
        h('div', { class: 's-caution' }, icon('info'),
          h('span', h('strong', uiLabel('attention', { layout: 'inline' })), ' ',
            h('span', { class: 'de', lang: 'de' }, 'Nutzung eigenverantwortlich – der Token wird nur lokal auf diesem Gerät gespeichert und ausschließlich an api.github.com gesendet. Er landet nie im Backup. Verwende einen Token nur mit dem Scope „gist“ und widerrufe ihn bei Verlust des Geräts. '),
            h('a', { href: TOKEN_URL, target: '_blank', rel: 'noopener' }, holdLabel('create_token', { layout: 'inline' }))))),
      rows: [
        h('div', { class: 'list-row has-icon s-token-row' },
          h('span', { class: 'row-icon', style: { background: 'var(--label)' } }, icon('lock')),
          uiLabel('token', { cls: 'row-title s-token-label', de: false }), token, eye),
        gistRow,
        { title: RT('auto_sync_reports'), subtitle: DE('nach jeder neuen Meldung'), icon: tile('flag', 'var(--orange)'), accessory: sw('gistAutoSync') },
        { title: RT('auto_save_progress'), subtitle: DE('nach jeder Session'), icon: tile('cloud', 'var(--blue)'), accessory: sw('gistBackup') },
        action('sync', 'sync_now', tile('refresh', 'var(--green)'), async () => {
          const r = await syncReports(app);
          toast(syncedToast(r), { kind: 'ok' });
        }),
        action('backup', 'save_progress', tile('cloud', 'var(--blue)'), async () => {
          await backupProgress(app);
          toast(uiT('progress_saved'), { kind: 'ok' });
        }),
        action('restore', 'restore_progress', tile('download', 'var(--purple)'), async () => {
          const r = await restoreProgress(app, {
            confirm: f => confirmDialog({ title: uiT('restore_q'), message: `Backup: ${f.summary}. Der aktuelle Fortschritt auf diesem Gerät wird ersetzt. Token und Gist bleiben.`, ok: uiT('restore'), destructive: true }),
          });
          if (r.restored) { applyTheme(S().theme); toast(uiT('progress_restored'), { kind: 'ok' }); rebuild(); }
        }),
        hasToken ? { title: uiLabel('check_token', { cls: 'row-title', hold: true }), icon: tile('check', 'var(--label-2)'), cls: 's-action s-action-quiet', accessory: syncBusy === 'test' ? h('span', { class: 's-spinner' }) : null,
          onClick: () => run('test', async () => {
            const r = await testToken(app);
            toast(r.hasGistScope === false
              ? { uk: `${uiT('attention').uk}: ${r.login} – «gist»`, de: `Angemeldet als ${r.login} – aber Scope „gist“ fehlt!` }
              : { uk: `${uiT('token_ok').uk} – ${r.login}`, de: `${uiT('token_ok').de} – ${r.login}` }, { kind: r.hasGistScope === false ? 'bad' : 'ok', ms: 3200 });
          }) } : null,
      ],
    });
  });
  async function run(id, fn) {
    if (syncBusy) return;
    if (!String(S().gistToken || '').trim()) { toast({ uk: uiT('no_token').uk, de: 'Bitte zuerst einen GitHub-Token eintragen' }, { kind: 'bad' }); return; }
    syncBusy = id; syncRegion.refresh();
    try { await fn(); haptic('success'); }
    catch (e) { haptic('error'); toast({ uk: uiT('error').uk, de: errorMessage(e) }, { kind: 'bad', ms: 4200 }); }
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
      const ok = await confirmDialog({ title: uiT('import_q'), message: `${backupSummary(state, exportedAt)}. Der aktuelle Fortschritt wird ersetzt. Token und Gist bleiben.`, ok: uiT('import'), destructive: true });
      if (!ok) return;
      applyBackup(store, state);
      applyTheme(S().theme);
      toast(uiT('file_loaded'), { kind: 'ok' });
      rebuild();
    } catch (e) { toast({ uk: uiT('error').uk, de: errorMessage(e) }, { kind: 'bad', ms: 4000 }); }
  });
  const data = listGroup({
    header: HDR('data'),
    footer: FOOT('Das Backup enthält Fortschritt, Wiederholungen, Meldungen, gesammelte Sätze und Einstellungen – aber keinen Token.'),
    rows: [
      { title: RT('export_file', true), subtitle: DE('JSON-Datei teilen oder sichern'), icon: tile('share', 'var(--blue)'), accessory: 'chevron',
        onClick: async () => {
          const r = await shareOrDownload(backupFilename(), backupJSON(store, { appVersion: app.version }), 'application/json');
          if (r === 'downloaded') toast({ uk: uiT('file_saved').uk, de: 'Backup heruntergeladen' }, { kind: 'ok' });
        } },
      { title: RT('import_file', true), subtitle: DE('aus einer JSON-Datei'), icon: tile('download', 'var(--green)'), accessory: 'chevron', onClick: () => fileInput.click() },
      { title: uiLabel('reset', { cls: 'row-title s-danger', hold: true }), icon: tile('trash', 'var(--red)'), cls: 's-action',
        onClick: async () => {
          const ok = await confirmDialog({ title: uiT('reset_q'), message: 'Fortschritt, Wiederholungen, Serie, Meldungen und Einstellungen werden gelöscht. Token und Gist bleiben. Das kann nicht rückgängig gemacht werden.', ok: uiT('reset_ok'), destructive: true });
          if (!ok) return;
          store.reset();
          applyTheme(S().theme);
          haptic('medium');
          toast({ uk: uiT('all_deleted').uk, de: 'Fortschritt zurückgesetzt' });
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
        h('strong', uiLabel('install_app')),
        h('p', { class: 'de', lang: 'de' }, 'In Safari unten auf ', h('b', 'Teilen'), ' tippen und ', h('b', '„Zum Home-Bildschirm“'), ' wählen. Dann läuft Мо́ва wie eine App – im Vollbild, offline, und deine Daten bleiben dauerhaft gespeichert.'))),
    listGroup({
      header: HDR('info'),
      rows: [
        { title: RT('version'), icon: tile('info', 'var(--label-2)'), detail: app.version || '–' },
        { title: RT('content'), icon: tile('book', 'var(--blue)'), detail: c.isFixture ? 'Demo-Inhalte' : (c.base || '–'), subtitle: c.isFixture ? c.base : null },
        { title: RT('lessons'), icon: tile('course', 'var(--green)'), detail: String(lessonsReady) },
        { title: RT('dictionary'), icon: tile('words', 'var(--purple)'), detail: String(app.lexicon?.size ?? 0) },
        { title: RT('storage'), icon: tile('lock', store.persisted ? 'var(--green)' : 'var(--orange)'), detail: uiLabel(store.persisted ? 'yes' : 'no', { layout: 'inline', cls: 'row-detail' }),
          subtitle: store.persisted ? null : DE('Als Home-Bildschirm-App wird der Speicher nicht automatisch geleert.') },
      ],
    }));

  const sections = [heroRegion, learn, toneRegion, voiceRegion, look, collectRegion, syncRegion, data, info, fileInput];
  const el = page({ title: uiT('settings'), cls: 's-page', children: h('div', { class: 's-grid' }, sections) });

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
