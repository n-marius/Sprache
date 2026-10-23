// Melde-Sheet: Kategorie + Freitext, Kontextdaten automatisch angehängt (einklappbare Vorschau).
// Aufruf aus der Session (Flaggen-Icon) für JEDE Aufgabe, auch Einführungskarten (kind 'intro') und Tipps (type 'tip').
import { h, icon } from './dom.js';
import { sheet, toast } from './shell.js';
import { haptic } from './haptics.js';
import { getApp } from '../app-context.js';
import { CATEGORIES, categoryMeta, createReport, addReport, attachedData, exerciseSummary, typeLabel } from '../services/reports.js';
import { maybeAutoSync, errorMessage } from '../services/gist.js';

/** → {close} */
export function openReportSheet({ lessonId, ex, userAnswer } = {}) {
  const app = getApp();
  let category = null;
  // Entwurf: Kontext jetzt festhalten (Zeitpunkt der Meldung = Öffnen des Sheets)
  const draft = createReport({ lessonId, ex, userAnswer, app, category: 'Sonstiges' });

  // --- Kontext-Kopf
  const summary = exerciseSummary(ex);
  const ctxCard = h('div', { class: 'r-ctx' },
    h('span', { class: 'r-ctx-icon' }, icon('flag')),
    h('div', { class: 'r-ctx-main' },
      h('div', { class: 'r-ctx-kicker' },
        [draft.lessonId || 'Ohne Lektion', typeLabel(draft.exType), draft.exId].filter(Boolean).join(' · '),
        draft.generated ? h('span', { class: 'badge blue r-ctx-badge' }, 'generiert') : null),
      summary ? h('div', { class: 'r-ctx-text', lang: /[Ѐ-ӿ]/.test(summary) ? 'uk' : 'de' }, summary) : null,
      draft.userAnswer ? h('div', { class: 'r-ctx-answer' }, h('span', 'Deine Antwort: '), draft.userAnswer) : null));

  // --- Kategorien
  const tiles = CATEGORIES.map(label => {
    const m = categoryMeta(label);
    const b = h('button', {
      type: 'button', class: 'option r-cat', role: 'radio', 'aria-checked': 'false',
      style: `--r-cat-color: ${m.color}`,
      on: { click: () => select(label, b) },
    },
      h('span', { class: 'r-cat-glyph emoji' }, m.emoji),
      h('span', { class: 'r-cat-text' }, h('span', { class: 'r-cat-label' }, label.split('/').flatMap((p, i) => i ? ['/', h('wbr'), p] : [p])), h('span', { class: 'r-cat-hint' }, m.hint)));
    return b;
  });
  const catGroup = h('div', { class: 'r-section' },
    h('div', { class: 'section-header' }, 'Was stimmt nicht?'),
    h('div', { class: 'r-cats', role: 'radiogroup', 'aria-label': 'Kategorie' }, tiles));

  // --- Freitext
  const ta = h('textarea', {
    class: 'r-textarea', rows: 4, maxlength: 2000,
    placeholder: 'Was ist dir aufgefallen? Wie wäre es richtig? (optional)',
    'aria-label': 'Beschreibung',
  });
  const textGroup = h('div', { class: 'r-section' },
    h('div', { class: 'section-header' }, 'Beschreibung'),
    h('div', { class: 'list' }, h('div', { class: 'list-row r-textrow' }, ta)));

  // --- Angehängte Daten (einklappbar)
  const pre = h('pre', { class: 'r-json' }, JSON.stringify(attachedData(draft), null, 2));
  const details = h('details', { class: 'r-details' },
    h('summary', { class: 'r-details-summary' },
      h('span', { class: 'r-details-icon' }, icon('info')),
      h('span', { class: 'r-details-title' }, 'Automatisch angehängt'),
      h('span', { class: 'r-details-sub' }, 'Lektion, Aufgabe, Antwort, Version, Gerät'),
      icon('chevron-down', { cls: 'r-details-chev' })),
    pre);

  const save = h('button', { type: 'button', class: 'btn btn-primary btn-block btn-lg btn-caps', disabled: true, on: { click: submit } },
    icon('check'), 'Meldung speichern');
  const hint = h('div', { class: 'r-save-hint t-foot t-2' }, 'Bitte eine Kategorie wählen.');

  const s = sheet({
    title: 'Aufgabe melden',
    cancelLabel: 'Abbrechen',
    content: h('div', { class: 'r-sheet' }, ctxCard, catGroup, textGroup, details),
    actions: [save, hint],
  });
  s.el.classList.add('r-sheet-panel');

  function select(label, btn) {
    category = label;
    for (const t of tiles) { const on = t === btn; t.classList.toggle('is-selected', on); t.setAttribute('aria-checked', String(on)); }
    save.disabled = false;
    hint.textContent = 'Wird lokal gespeichert – Export und Sync unter Mehr → Meldungen.';
    haptic('select');
  }

  function submit() {
    if (!category || !app) return;
    const report = { ...draft, category, text: ta.value.trim() };
    addReport(app, report);
    haptic('success');
    s.close();
    toast('Danke – Meldung gespeichert', { kind: 'ok' });
    maybeAutoSync(app).then(r => {
      if (r?.error) toast(`Sync fehlgeschlagen: ${errorMessage(r.error)}`, { kind: 'bad', ms: 3500 });
    });
  }

  return { close: s.close, el: s.el };
}
