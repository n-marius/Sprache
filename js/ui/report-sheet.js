// Melde-Sheet: Kategorie + Freitext, Kontextdaten automatisch angehängt (einklappbare Vorschau).
// Aufruf aus der Session (Flaggen-Icon) für JEDE Aufgabe, auch Einführungskarten (kind 'intro') und Tipps (type 'tip').
import { h, icon } from './dom.js';
import { sheet, toast } from './shell.js';
import { haptic } from './haptics.js';
import { getApp } from '../app-context.js';
import { CATEGORIES, categoryMeta, createReport, addReport, attachedData, exerciseSummary, typeLabel } from '../services/reports.js';
import { maybeAutoSync, errorMessage } from '../services/gist.js';
import { uiLabel, holdLabel, uiT } from './ui-label.js';
import { categoryUi, typeUi } from '../ui-text-g3.js';

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
        draft.lessonId ? `${draft.lessonId} · ` : [uiLabel('no_lesson', { de: false }), ' · '],
        uiLabel({ uk: typeUi(draft.exType).uk, de: typeLabel(draft.exType) }, { layout: 'inline' }),
        draft.exId ? ` · ${draft.exId}` : null,
        draft.generated ? h('span', { class: 'badge blue r-ctx-badge' }, uiLabel('generated', { de: false })) : null),
      summary ? h('div', { class: 'r-ctx-text', lang: /[Ѐ-ӿ]/.test(summary) ? 'uk' : 'de' }, summary) : null,
      draft.userAnswer ? h('div', { class: 'r-ctx-answer' }, h('span', uiLabel('your_answer', { de: false }), ': '), draft.userAnswer) : null));

  // --- Kategorien
  const tiles = CATEGORIES.map(label => {
    const m = categoryMeta(label);
    const b = h('button', {
      type: 'button', class: 'option r-cat', role: 'radio', 'aria-checked': 'false',
      style: `--r-cat-color: ${m.color}`,
      on: { click: () => select(label, b) },
    },
      h('span', { class: 'r-cat-glyph emoji' }, m.emoji),
      h('span', { class: 'r-cat-text' },
        h('span', { class: 'r-cat-label' }, holdLabel(categoryUi(label))),
        h('span', { class: 'r-cat-hint ui-de', lang: 'de' }, m.hint)));
    return b;
  });
  const catGroup = h('div', { class: 'r-section' },
    h('div', { class: 'section-header' }, uiLabel('whats_wrong', { layout: 'inline' })),
    h('div', { class: 'r-cats', role: 'radiogroup', 'aria-label': 'Kategorie' }, tiles));

  // --- Freitext
  const ta = h('textarea', {
    class: 'r-textarea', rows: 4, maxlength: 2000,
    placeholder: 'Was ist dir aufgefallen? Wie wäre es richtig? (optional)',
    'aria-label': 'Beschreibung',
  });
  const textGroup = h('div', { class: 'r-section' },
    h('div', { class: 'section-header' }, uiLabel('comment', { layout: 'inline' })),
    h('div', { class: 'list' }, h('div', { class: 'list-row r-textrow' }, ta)));

  // --- Angehängte Daten (einklappbar)
  const pre = h('pre', { class: 'r-json' }, JSON.stringify(attachedData(draft), null, 2));
  const details = h('details', { class: 'r-details' },
    h('summary', { class: 'r-details-summary' },
      h('span', { class: 'r-details-icon' }, icon('info')),
      h('span', { class: 'r-details-title' }, uiLabel('auto_attached', { hold: true, de: false })),
      h('span', { class: 'r-details-sub ui-de', lang: 'de' }, 'Automatisch angehängt: Lektion, Aufgabe, Antwort, Version, Gerät'),
      icon('chevron-down', { cls: 'r-details-chev' })),
    pre);

  const save = h('button', { type: 'button', class: 'btn btn-primary btn-block btn-lg btn-caps', disabled: true, on: { click: submit } },
    icon('check'), holdLabel('save_report'));
  const hint = h('div', { class: 'r-save-hint t-foot t-2' }, uiLabel('choose_category', { layout: 'inline' }));

  const s = sheet({
    title: uiT('report_title'),
    cancelLabel: uiT('cancel'),
    content: h('div', { class: 'r-sheet' }, ctxCard, catGroup, textGroup, details),
    actions: [save, hint],
  });
  s.el.classList.add('r-sheet-panel');

  function select(label, btn) {
    category = label;
    for (const t of tiles) { const on = t === btn; t.classList.toggle('is-selected', on); t.setAttribute('aria-checked', String(on)); }
    save.disabled = false;
    hint.replaceChildren(uiLabel('saved_where'));
    haptic('select');
  }

  function submit() {
    if (!category || !app) return;
    const report = { ...draft, category, text: ta.value.trim() };
    addReport(app, report);
    haptic('success');
    s.close();
    toast(uiT('thanks_saved'), { kind: 'ok' });
    maybeAutoSync(app).then(r => {
      if (r?.error) toast({ uk: uiT('sync_error').uk, de: `Sync fehlgeschlagen: ${errorMessage(r.error)}` }, { kind: 'bad', ms: 3500 });
    });
  }

  return { close: s.close, el: s.el };
}
