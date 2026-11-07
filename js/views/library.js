// Wissen (#/library): Einzelthemen nach Kategorie (Standard) oder Gesamterklärungen je Lektion.
// Freigeschaltet ist, was zu erreichten Lektionen gehört; Gesperrtes bleibt sichtbar.
import { h, ukText, icon } from '../ui/dom.js';
import { page, listGroup, segmented } from '../ui/shell.js';
import { anim } from '../ui/anim.js';
import { listMined } from '../services/mining.js';
import { CATEGORIES, allConcepts, lessonOpen } from '../concepts.js';

let view = 'topics';

export function render(params, app) {
  const st = app.store.state;
  const q = h('input', { type: 'search', class: 'lib-search', placeholder: 'Themen durchsuchen', 'aria-label': 'Suchen' });
  const groups = h('div', { class: 'lib-groups' });

  const statusBadge = (open, planned, read) => planned ? h('span', { class: 'badge' }, 'geplant')
    : !open ? icon('lock', { cls: 'lib-lock' })
    : read ? null : h('span', { class: 'badge blue' }, 'neu');

  function topics(term) {
    const concepts = allConcepts(app).filter(c => !c.planned);
    const upcoming = allConcepts(app).filter(c => c.planned).length;
    for (const cat of CATEGORIES) {
      const list = concepts.filter(c => c.category === cat.id && (!term || `${c.title_de} ${c.meta.title_de}`.toLowerCase().includes(term)));
      if (!list.length) continue;
      groups.append(listGroup({
        header: `${cat.emoji} ${cat.label}`,
        rows: list.map(c => ({
          icon: { emoji: anim.themeGlyph(c.meta.theme), color: c.open ? anim.themeColor(c.meta.theme) : 'var(--surface-3)' },
          title: h('span', { class: 'row-title' }, c.title_de),
          subtitle: h('span', { class: 'row-subtitle lib-sub' }, `Lektion ${c.meta.index + 1} · `, ukText(c.meta.title_uk, { tap: false })),
          detail: statusBadge(c.open, false, !!st.lessons[c.lessonId]?.explainedAt),
          accessory: c.open ? 'chevron' : null,
          href: c.open ? `#/concept/${encodeURIComponent(c.id)}` : null,
          cls: c.open ? '' : 'lib-row-locked',
        })),
      }));
    }
    if (upcoming && !term) groups.append(h('p', { class: 'lib-foot t-foot' }, `${upcoming} weitere Themen folgen mit den nächsten Lektionen.`));
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
          title: h('span', { class: 'row-title' }, lesson.explanation?.title_de || meta.title_de),
          subtitle: h('span', { class: 'row-subtitle lib-sub' }, `Lektion ${meta.index + 1} · `, ukText(meta.title_uk, { tap: false })),
          detail: statusBadge(open, false, !!st.lessons[meta.id]?.explainedAt),
          accessory: open ? 'chevron' : null,
          href: open ? `#/explain/${encodeURIComponent(meta.id)}` : null,
          cls: open ? '' : 'lib-row-locked',
        });
      }
      if (rows.length) groups.append(listGroup({ header: `${phase.id} · ${phase.title_de || ''}`, rows }));
    }
  }

  const build = () => {
    const term = q.value.trim().toLowerCase();
    groups.replaceChildren();
    (view === 'topics' ? topics : lessons)(term);
    if (!groups.childElementCount) groups.append(h('div', { class: 'empty' }, h('div', { class: 'empty-glyph' }, '🔎'), h('p', 'Nichts gefunden.')));
  };
  q.addEventListener('input', build);
  const seg = segmented({
    options: [{ value: 'topics', label: 'Themen' }, { value: 'lessons', label: 'Lektionen' }],
    value: view,
    onChange: v => { view = v; build(); },
  });
  build();

  const mined = listMined(app);
  const extra = listGroup({
    header: 'Gesammelt',
    rows: [{
      icon: { name: 'sparkles', color: 'var(--purple)' },
      title: 'Gesammelte Sätze', subtitle: 'Aus Geschichten, Texten und Erklärungen',
      detail: String(mined.length), accessory: 'chevron', href: '#/trainer',
    }],
  });

  return page({
    title: 'Wissen', subtitle: 'Grammatik und Redemittel – Thema für Thema',
    children: [h('div', { class: 'lib-seg' }, seg), h('div', { class: 'lib-search-wrap' }, icon('search', { cls: 'lib-search-icon' }), q), groups, extra],
  });
}
