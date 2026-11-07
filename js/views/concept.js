// Einzelnes Thema aus „Wissen“ (#/concept/:id): nur die Erklärungsabschnitte zu diesem Konzept.
import { h, ukText, deText, icon } from '../ui/dom.js';
import { page } from '../ui/shell.js';
import { anim } from '../ui/anim.js';
import { paragraphs, table, examples } from './explain.js';
import { CATEGORIES, allConcepts } from '../concepts.js';
import { uiT, uiLabel, holdLabel } from '../ui/ui-label.js';
import { uiF } from '../ui-text-g2.js';

export function render(params, app) {
  const all = allConcepts(app);
  const i = all.findIndex(c => c.id === params.id);
  const c = all[i];
  const back = { href: '#/library', label: uiT('tab_library') };
  if (!c || !c.open) {
    return page({ title: uiF('topic'), back, children: [h('div', { class: 'empty' }, h('div', { class: 'empty-glyph' }, '🔒'),
      h('p', uiLabel(uiF(c ? 'topic_locked' : 'topic_not_found'))))] });
  }
  const cat = CATEGORIES.find(k => k.id === c.category);
  const color = anim.themeColor(c.meta.theme);
  const hero = h('header', { class: 'xp-hero', style: { '--theme-c': color } },
    h('div', { class: 'xp-badge emoji', 'aria-hidden': 'true' }, cat?.emoji || '📘'),
    h('div', { class: 'xp-hero-text' },
      h('div', { class: 't-cap xp-kicker' }, uiLabel({ uk: `${cat?.uk || uiF('topic').uk} · ${uiF('lesson_n', { n: c.meta.index + 1 }).uk}`, de: `${cat?.label || 'Thema'} · Lektion ${c.meta.index + 1}` }, { layout: 'inline' })),
      h('h1', { class: 't-title1 xp-title', lang: 'de' }, c.title_de),
      h('div', { class: 'xp-lesson' }, ukText(c.meta.title_uk), h('span', { class: 't-2' }, ' · ', c.meta.title_de))));

  const body = c.sections.length
    ? c.sections.map(s => h('section', { class: 'card xp-section' },
        h('h2', { class: 'xp-h2' }, s.heading_de), ...paragraphs(s.body_de), table(s.table), examples(app, s.examples, c.lessonId)))
    : [h('div', { class: 'card' }, h('p', uiLabel(uiF('topic_in_lesson'))),
        h('a', { class: 'btn btn-blue btn-block', href: `#/explain/${encodeURIComponent(c.lessonId)}` }, holdLabel(uiF('open_explanation'))))];

  // Vorheriges/nächstes freigeschaltetes Thema derselben Kategorie
  const same = all.filter(x => x.category === c.category && x.open);
  const j = same.indexOf(c);
  const nav = h('div', { class: 'xp-actions' },
    same[j + 1] ? h('a', { class: 'btn btn-secondary btn-block', href: `#/concept/${encodeURIComponent(same[j + 1].id)}` }, holdLabel(uiF('next_topic', { t: same[j + 1].title_de }))) : null,
    h('a', { class: 'btn btn-secondary btn-block', href: `#/explain/${encodeURIComponent(c.lessonId)}` }, icon('book'), holdLabel(uiF('read_whole_lesson'))));

  return page({ title: { uk: cat?.uk || uiF('topic').uk, de: c.title_de }, largeTitle: false, cls: 'xp-page', back,
    children: [h('article', { class: 'xp-article' }, hero, ...body, nav)] });
}
