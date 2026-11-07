// Wortliste (#/words): Suche, Filter, Stärke, Lautsprecher, „schwierig“-Markierung, Detailblatt.
import { page, sheet, segmented } from '../ui/shell.js';
import { h, icon, clear, ukText, deText } from '../ui/dom.js';
import { speakerButton } from '../ui/audio-button.js';
import { wordList } from '../engine/progress.js';
import { isHard, isMarked, toggleMarked, unlockedVocab } from '../engine/trainer.js';
import { STRENGTH_LABEL } from '../engine/srs.js';
import { stripStress } from '../lib/uk-text.js';
import { haptic } from '../ui/haptics.js';
import { uiLabel, holdLabel, uiT } from '../ui/ui-label.js';

const FILTERS = [
  { value: 'all', label: uiT('all') },
  { value: 'learned', label: uiT('learned') },
  { value: 'hard', label: uiT('hard') },
  { value: 'new', label: uiT('new') },
];
const fold = s => stripStress(String(s || '')).toLowerCase().replace(/[ʼ'`´‘’]/g, '’');

function strengthBars(level) {
  return h('span', { class: ['tr-strength', `lv-${level}`], title: STRENGTH_LABEL[level], 'aria-label': `Stärke: ${STRENGTH_LABEL[level]}` },
    [1, 2, 3, 4].map(i => h('i', { class: i <= level ? 'on' : '' })));
}

export function render(params, app) {
  let filter = params.query?.get('filter') || 'all';
  let term = '';
  const listEl = h('div', { class: 'tr-words' });
  const countEl = h('div', { class: 'tr-words-count' });

  const search = h('input', {
    type: 'search', class: 'tr-search-input', placeholder: 'Suchen (Deutsch oder Ukrainisch)', 'aria-label': 'Wörter suchen',
    autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
    on: { input: () => { term = search.value; draw(); } },
  });
  const searchBox = h('label', { class: 'tr-search' }, icon('search'), search);
  const seg = segmented({ options: FILTERS, value: filter, onChange: v => { filter = v; draw(); } });

  function rows() {
    const unlocked = new Set(unlockedVocab(app).map(v => v.id));
    const meta = new Map(app.content.lessonList.map(l => [l.id, l]));
    return wordList(app)
      .filter(w => unlocked.has(w.vocab.id) || w.introduced)
      .map(w => {
        const entry = { kind: 'vocab', id: w.vocab.id };
        const tc = app.store.state.srs?.trainer || {};
        const trained = !!(tc[`${w.vocab.id}|de-uk`] || tc[`${w.vocab.id}|uk-de`]);
        return { ...w, hard: isHard(app, entry), marked: isMarked(app, w.vocab.id), learned: w.introduced || trained, lesson: meta.get(w.lessonId) };
      });
  }

  function draw() {
    clear(listEl);
    const t = fold(term.trim());
    const all = rows();
    const shown = all.filter(w => {
      if (filter === 'learned' && !w.learned) return false;
      if (filter === 'hard' && !w.hard) return false;
      if (filter === 'new' && w.learned) return false;
      if (t && !fold(w.vocab.uk).includes(t) && !fold(w.vocab.de).includes(t) && !(w.vocab.forms || []).some(f => fold(f.uk).includes(t))) return false;
      return true;
    });
    countEl.textContent = `${shown.length} von ${all.length} Wörtern`;
    if (!shown.length) {
      listEl.append(h('div', { class: 'tr-words-empty' },
        h('div', { class: 'tr-sum-emoji', 'aria-hidden': 'true' }, filter === 'hard' ? '🌱' : '🔍'),
        h('p', filter === 'hard' && !t ? 'Keine schwierigen Wörter.' : 'Keine Treffer.')));
      return;
    }
    // nach Lektion gruppieren (Kursreihenfolge)
    const groups = new Map();
    for (const w of shown) {
      const k = w.lessonId;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(w);
    }
    for (const [lid, ws] of groups) {
      const L = app.content.lessonList.find(l => l.id === lid);
      const list = h('div', { class: 'list' }, ws.map(w => wordRow(w)));
      listEl.append(h('section', { class: 'list-group' },
        h('div', { class: 'section-header' }, L ? `${L.title_de} · ${ws.length}` : lid), list));
    }
  }

  function wordRow(w) {
    const v = w.vocab;
    const row = h('div', { class: ['list-row', 'tr-word-row', 'is-tappable', w.hard && 'is-hard'], role: 'button', tabindex: '0',
      on: { click: () => openDetail(w), keydown: e => { if (e.key === 'Enter') openDetail(w); } } },
    h('span', { class: 'tr-word-emoji', 'aria-hidden': 'true' }, v.emoji || ''),
    h('span', { class: 'row-main' },
      h('span', { class: 'row-title' }, ukText(v.uk, { hold: true })),
      h('span', { class: 'row-subtitle' }, v.de)),
    w.hard ? h('span', { class: 'badge yellow tr-hard-badge', title: uiT('hard_badge').de }, w.marked ? '★ ' : null, ukText(uiT('hard_badge').uk, { hold: true })) : null,
    strengthBars(w.level),
    speakerButton(v.uk, { size: 's' }));
    return row;
  }

  function openDetail(w) {
    const v = w.vocab;
    const markBtn = h('button', { type: 'button', class: ['btn', 'btn-block', isMarked(app, v.id) ? 'btn-yellow' : 'btn-secondary'],
      on: { click: () => { const on = toggleMarked(app, v.id); haptic('light'); markBtn.className = ['btn', 'btn-block', on ? 'btn-yellow' : 'btn-secondary'].join(' '); markBtn.lastChild.replaceWith(holdLabel(on ? 'marked_hard' : 'mark_hard')); draw(); } } },
    icon('target'), holdLabel(isMarked(app, v.id) ? 'marked_hard' : 'mark_hard'));
    const due = w.card?.due;
    const content = h('div', { class: 'tr-detail' },
      h('div', { class: 'tr-detail-head' },
        v.emoji ? h('div', { class: 'tr-emoji', 'aria-hidden': 'true' }, v.emoji) : null,
        h('div', { class: 'tr-word' }, ukText(v.uk, { tap: false })),
        h('div', { class: 'tr-audio-row' }, speakerButton(v.uk, { size: 'l' }), speakerButton(v.uk, { size: 's', slow: true })),
        h('div', { class: 'tr-meaning' }, deText(v.de)),
        v.info ? h('div', { class: 'tr-info' }, v.info) : null),
      v.forms?.length ? h('div', { class: 'tr-detail-block' }, h('div', { class: 'section-header' }, uiLabel('forms', { layout: 'inline' })),
        h('div', { class: 'tr-forms' }, v.forms.map(f => h('div', { class: 'tr-form' }, ukText(f.uk, { tap: false }), h('span', { class: 'tr-form-info' }, f.info || ''))))) : null,
      v.example ? h('div', { class: 'tr-detail-block' }, h('div', { class: 'section-header' }, uiLabel('example', { layout: 'inline' })),
        h('div', { class: 'tr-example' }, h('div', { class: 'tr-example-uk' }, ukText(v.example.uk), speakerButton(v.example.uk, { size: 's' })), h('div', { class: 'tr-example-de' }, v.example.de))) : null,
      h('div', { class: 'tr-detail-block tr-detail-stats' },
        h('div', h('span', { class: 'tr-detail-k' }, uiLabel('strength', { layout: 'inline' })), strengthBars(w.level), h('span', { class: 'tr-detail-v' }, STRENGTH_LABEL[w.level])),
        due ? h('div', h('span', { class: 'tr-detail-k' }, uiLabel('next_review', { layout: 'inline' })), h('span', { class: 'tr-detail-v' }, new Date(w.due).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }))) : null,
        w.lesson ? h('div', h('span', { class: 'tr-detail-k' }, uiLabel('lesson', { layout: 'inline' })), h('span', { class: 'tr-detail-v' }, w.lesson.title_de)) : null),
      markBtn);
    sheet({ title: uiT('word'), content });
  }

  draw();
  const el = page({ title: uiT('word_list'), back: { label: uiT('tab_vocab'), href: '#/trainer' }, cls: 'tr-page',
    children: [h('div', { class: 'tr-words-tools' }, searchBox, seg, countEl), listEl] });
  return { el, onShow() { draw(); } };
}
