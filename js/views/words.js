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
import { uiF } from '../ui-text-g2.js';

const strengthT = level => uiF(`strength_${level}`);

const FILTERS = [
  { value: 'all', label: uiT('all') },
  { value: 'learned', label: uiT('learned') },
  { value: 'hard', label: uiT('hard') },
  { value: 'new', label: uiT('new') },
];
const fold = s => stripStress(String(s || '')).toLowerCase().replace(/[ʼ'`´‘’]/g, '’');

function strengthBars(level) {
  return h('span', { class: ['tr-strength', `lv-${level}`], title: `${strengthT(level).uk} · ${STRENGTH_LABEL[level]}`, 'aria-label': `Stärke: ${STRENGTH_LABEL[level]}` },
    [1, 2, 3, 4].map(i => h('i', { class: i <= level ? 'on' : '' })));
}

export function render(params, app) {
  let filter = params.query?.get('filter') || 'all';
  let term = '';
  const listEl = h('div', { class: 'tr-words' });
  const countEl = h('div', { class: 'tr-words-count' });

  const search = h('input', {
    type: 'search', class: 'tr-search-input', placeholder: `${uiF('search_hint').uk} · ${uiF('search_hint').de}`, 'aria-label': uiF('search_hint').de,
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
    countEl.replaceChildren(uiLabel(uiF('words_shown', { n: shown.length, m: all.length }), { layout: 'inline' }));
    if (!shown.length) {
      listEl.append(h('div', { class: 'tr-words-empty' },
        h('div', { class: 'tr-sum-emoji', 'aria-hidden': 'true' }, filter === 'hard' ? '🌱' : '🔍'),
        h('p', uiLabel(uiF(filter === 'hard' && !t ? 'no_hard_words' : 'nothing_found')))));
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
        h('div', { class: 'section-header' }, L ? uiLabel({ uk: `${L.title_uk || L.title_de} · ${ws.length}`, de: L.title_de }, { layout: 'inline' }) : lid), list));
    }
  }

  function wordRow(w) {
    const v = w.vocab;
    const row = h('div', { class: ['list-row', 'tr-word-row', 'is-tappable', w.hard && 'is-hard'], role: 'button', tabindex: '0',
      on: { click: () => openDetail(w), keydown: e => { if (e.key === 'Enter') openDetail(w); } } },
    h('span', { class: 'tr-word-emoji', 'aria-hidden': 'true' }, v.emoji || ''),
    h('span', { class: 'row-main' },
      h('span', { class: 'row-title' }, ukText(v.uk, { hold: true })),
      h('span', { class: 'row-subtitle' }, deText(v.de))),
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
        v.info ? deText(v.info, { cls: 'tr-info', tag: 'div' }) : null),
      v.forms?.length ? h('div', { class: 'tr-detail-block' }, h('div', { class: 'section-header' }, uiLabel('forms', { layout: 'inline' })),
        h('div', { class: 'tr-forms' }, v.forms.map(f => h('div', { class: 'tr-form' }, ukText(f.uk, { tap: false }), deText(f.info || '', { cls: 'tr-form-info' }))))) : null,
      v.example ? h('div', { class: 'tr-detail-block' }, h('div', { class: 'section-header' }, uiLabel('example', { layout: 'inline' })),
        h('div', { class: 'tr-example' }, h('div', { class: 'tr-example-uk' }, ukText(v.example.uk), speakerButton(v.example.uk, { size: 's' })), h('div', { class: 'tr-example-de' }, v.example.de))) : null,
      h('div', { class: 'tr-detail-block tr-detail-stats' },
        h('div', h('span', { class: 'tr-detail-k' }, uiLabel('strength', { layout: 'inline' })), strengthBars(w.level), uiLabel(strengthT(w.level), { layout: 'inline', cls: 'tr-detail-v' })),
        due ? h('div', h('span', { class: 'tr-detail-k' }, uiLabel('next_review', { layout: 'inline' })), h('span', { class: 'tr-detail-v' }, new Date(w.due).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' }))) : null,
        w.lesson ? h('div', h('span', { class: 'tr-detail-k' }, uiLabel('lesson', { layout: 'inline' })), uiLabel({ uk: w.lesson.title_uk || w.lesson.title_de, de: w.lesson.title_de }, { cls: 'tr-detail-v' })) : null),
      markBtn);
    sheet({ title: uiT('word'), content });
  }

  draw();
  const el = page({ title: uiT('word_list'), back: { label: uiT('tab_vocab'), href: '#/trainer' }, cls: 'tr-page',
    children: [h('div', { class: 'tr-words-tools' }, searchBox, seg, countEl), listEl] });
  return { el, onShow() { draw(); } };
}
