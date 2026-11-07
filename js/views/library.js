// Wissen (#/library): Einzelthemen nach Kategorie (Standard) oder Gesamterklärungen je Lektion.
// Freigeschaltet ist, was zu erreichten Lektionen gehört; Gesperrtes bleibt sichtbar.
import { h, ukText, deText, icon } from '../ui/dom.js';
import { page, listGroup, segmented } from '../ui/shell.js';
import { anim } from '../ui/anim.js';
import { listMined } from '../services/mining.js';
import { CATEGORIES, allConcepts, lessonOpen } from '../concepts.js';
import { uiLabel, holdLabel, uiT } from '../ui/ui-label.js';
import { uiF } from '../ui-text-g2.js';

/** Zeilen-Untertitel: Ukrainisch, darunter dezent Deutsch (langer Druck übersetzt). */
const subLabel = t => { const el = holdLabel(t, { cls: 'row-subtitle' }); el.style.cssText = 'display:flex;flex-direction:column;align-items:flex-start'; return el; };

const badgeUk = (key, cls = '') => h('span', { class: ['badge', cls], title: uiT(key).de }, ukText(uiT(key).uk, { hold: true }));

let view = 'topics';

export function render(params, app) {
  const st = app.store.state;
  const q = h('input', { type: 'search', class: 'lib-search', placeholder: `${uiF('search_hint').uk} · Themen durchsuchen`, 'aria-label': 'Themen durchsuchen' });
  const groups = h('div', { class: 'lib-groups' });

  const statusBadge = (open, planned, read) => planned ? badgeUk('planned')
    : !open ? icon('lock', { cls: 'lib-lock' })
    : read ? null : badgeUk('new_badge', 'blue');

  function topics(term) {
    const concepts = allConcepts(app).filter(c => !c.planned);
    const upcoming = allConcepts(app).filter(c => c.planned).length;
    for (const cat of CATEGORIES) {
      const list = concepts.filter(c => c.category === cat.id && (!term || `${c.title_de} ${c.meta.title_de}`.toLowerCase().includes(term)));
      if (!list.length) continue;
      groups.append(listGroup({
        header: h('span', { class: 'lib-cat' }, `${cat.emoji} `, uiLabel({ uk: cat.uk, de: cat.label }, { layout: 'inline' })),
        rows: list.map(c => ({
          icon: { emoji: anim.themeGlyph(c.meta.theme), color: c.open ? anim.themeColor(c.meta.theme) : 'var(--surface-3)' },
          title: deText(c.title_de, { cls: 'row-title' }),
          subtitle: h('span', { class: 'row-subtitle lib-sub' }, ukText(`${uiF('lesson_n', { n: c.meta.index + 1 }).uk} · ${c.meta.title_uk}`, { hold: true })),
          detail: statusBadge(c.open, false, !!st.lessons[c.lessonId]?.explainedAt),
          accessory: c.open ? 'chevron' : null,
          href: c.open ? `#/concept/${encodeURIComponent(c.id)}` : null,
          cls: c.open ? '' : 'lib-row-locked',
        })),
      }));
    }
    if (upcoming && !term) groups.append(h('p', { class: 'lib-foot t-foot' }, uiLabel(uiF('more_topics_soon', { n: upcoming }))));
  }

  function lessons(term) {
    for (const phase of app.content.phases) {
      const rows = [];
      for (const meta of phase.lessons) {
        const lesson = app.content.getLesson(meta.id);
        if (!lesson) continue;
        const open = lessonOpen(app, meta.id);
        const hay = [meta.title_de, meta.title_uk, lesson.explanation?.title_de].join(' ').toLowerCase();
        if (term && !hay.includes(term)) continue;
        rows.push({
          icon: { emoji: anim.themeGlyph(meta.theme), color: open ? anim.themeColor(meta.theme) : 'var(--surface-3)' },
          title: deText(lesson.explanation?.title_de || meta.title_de, { cls: 'row-title' }),
          subtitle: h('span', { class: 'row-subtitle lib-sub' }, ukText(`${uiF('lesson_n', { n: meta.index + 1 }).uk} · ${meta.title_uk}`, { hold: true })),
          detail: statusBadge(open, false, !!st.lessons[meta.id]?.explainedAt),
          accessory: open ? 'chevron' : null,
          href: open ? `#/explain/${encodeURIComponent(meta.id)}` : null,
          cls: open ? '' : 'lib-row-locked',
        });
      }
      if (rows.length) groups.append(listGroup({ header: uiLabel({ uk: `${phase.id} · ${phase.title_uk || ''}`, de: phase.title_de || '' }, { layout: 'inline' }), rows }));
    }
  }

  const build = () => {
    const term = q.value.trim().toLowerCase();
    groups.replaceChildren();
    (view === 'topics' ? topics : lessons)(term);
    if (!groups.childElementCount) groups.append(h('div', { class: 'empty' }, h('div', { class: 'empty-glyph' }, '🔎'), h('p', uiLabel(uiF('nothing_found')))));
  };
  q.addEventListener('input', build);
  const seg = segmented({
    options: [{ value: 'topics', label: uiT('topics') }, { value: 'lessons', label: uiT('lessons') }],
    value: view,
    onChange: v => { view = v; build(); },
  });
  build();

  const mined = listMined(app);
  const extra = listGroup({
    header: uiLabel('collection', { layout: 'inline' }),
    rows: [{
      icon: { name: 'sparkles', color: 'var(--purple)' },
      title: holdLabel('my_sentences', { cls: 'row-title' }), subtitle: subLabel(uiF('mined_sub')),
      detail: String(mined.length), accessory: 'chevron', href: '#/trainer',
    }],
  });

  return page({
    title: uiT('tab_library'), subtitle: h('div', { class: 'page-subtitle' }, uiLabel(uiF('lib_subtitle'))),
    children: [h('div', { class: 'lib-seg' }, seg), h('div', { class: 'lib-search-wrap' }, icon('search', { cls: 'lib-search-icon' }), q), groups, extra],
  });
}
