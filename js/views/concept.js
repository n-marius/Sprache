// Einzelnes Thema aus „Wissen“ (#/concept/:id): nur die Erklärungsabschnitte zu diesem Konzept.
import { h, ukText, icon } from '../ui/dom.js';
import { page } from '../ui/shell.js';
import { anim } from '../ui/anim.js';
import { paragraphs, table, examples } from './explain.js';
import { CATEGORIES, allConcepts } from '../concepts.js';

export function render(params, app) {
  const all = allConcepts(app);
  const i = all.findIndex(c => c.id === params.id);
  const c = all[i];
  const back = { href: '#/library', label: 'Wissen' };
  if (!c || !c.open) {
    return page({ title: 'Thema', back, children: [h('div', { class: 'empty' }, h('div', { class: 'empty-glyph' }, '🔒'),
      h('p', c ? 'Dieses Thema wird freigeschaltet, sobald du die zugehörige Lektion erreichst.' : 'Thema nicht gefunden.'))] });
  }
  const cat = CATEGORIES.find(k => k.id === c.category);
  const color = anim.themeColor(c.meta.theme);
  const hero = h('header', { class: 'xp-hero', style: { '--theme-c': color } },
    h('div', { class: 'xp-badge emoji', 'aria-hidden': 'true' }, cat?.emoji || '📘'),
    h('div', { class: 'xp-hero-text' },
      h('div', { class: 't-cap xp-kicker' }, `${cat?.label || 'Thema'} · Lektion ${c.meta.index + 1}`),
      h('h1', { class: 't-title1 xp-title' }, c.title_de),
      h('div', { class: 'xp-lesson' }, ukText(c.meta.title_uk), h('span', { class: 't-2' }, ' · ', c.meta.title_de))));

  const body = c.sections.length
    ? c.sections.map(s => h('section', { class: 'card xp-section' },
        h('h2', { class: 'xp-h2' }, s.heading_de), ...paragraphs(s.body_de), table(s.table), examples(app, s.examples, c.lessonId)))
    : [h('div', { class: 'card' }, h('p', 'Dieses Thema ist in der Gesamterklärung der Lektion enthalten.'),
        h('a', { class: 'btn btn-blue btn-block', href: `#/explain/${encodeURIComponent(c.lessonId)}` }, 'Erklärung der Lektion öffnen'))];

  // Vorheriges/nächstes freigeschaltetes Thema derselben Kategorie
  const same = all.filter(x => x.category === c.category && x.open);
  const j = same.indexOf(c);
  const nav = h('div', { class: 'xp-actions' },
    same[j + 1] ? h('a', { class: 'btn btn-secondary btn-block', href: `#/concept/${encodeURIComponent(same[j + 1].id)}` }, 'Nächstes Thema: ', same[j + 1].title_de) : null,
    h('a', { class: 'btn btn-secondary btn-block', href: `#/explain/${encodeURIComponent(c.lessonId)}` }, icon('book'), 'Ganze Lektion lesen'));

  return page({ title: c.title_de, largeTitle: false, cls: 'xp-page', back,
    children: [h('article', { class: 'xp-article' }, hero, ...body, nav)] });
}
