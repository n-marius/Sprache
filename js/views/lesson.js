// Lektionsseite: Kopf (Theme, Titel, Meisterschaft, Start), Geschichte/Erklärung, Konzepte, Ziele, Grammatik, Vokabeln.
import { page, listGroup, confirmDialog } from '../ui/shell.js';
import { h, icon, ukText, deText, richText } from '../ui/dom.js';
import { anim } from '../ui/anim.js';
import { speakerButton } from '../ui/audio-button.js';
import { lessonMastery, isUnlocked, dayKey } from '../engine/progress.js';
import { strengthLevel, STRENGTH_LABEL } from '../engine/srs.js';
import { startLesson } from '../engine/flow.js';
import { ringSvg, sty } from './today.js';
import { uiLabel, holdLabel, uiT } from '../ui/ui-label.js';
import { uiN } from '../ui-text-g1.js';

const COURSE_BACK = { label: uiT('tab_course'), href: '#/course' };

function strengthBars(level) {
  return h('span', { class: ['v-str', `lv-${level}`], title: STRENGTH_LABEL[level] || '', 'aria-label': `${uiT('strength').uk}: ${level}` },
    [1, 2, 3, 4].map(i => h('span', { class: ['v-str-bar', i <= level && 'is-on'] })));
}

/** Zwei {uk, de} mit „ · “ verbinden (zweiter optional). */
const joinUi = (a, b) => (b ? { uk: `${a.uk} · ${b.uk}`, de: `${a.de} · ${b.de}` } : a);

function goalsCard(goals) {
  if (!goals?.length) return null;
  return h('section', { class: 'card v-goals' },
    h('h2', { class: 'v-card-title' }, icon('target'), uiLabel('goals', { layout: 'inline' })),
    h('ul', { class: 'v-goal-list' }, goals.map(g => h('li', icon('check'), deText(g)))));
}

function plannedPage(meta, app) {
  const prep = meta.status === 'error' || meta.status === 'ready' || (meta.status === 'planned' && !!meta.file);
  const color = anim.themeColor?.(meta.theme) || 'var(--green)';
  const list = (title, ic, items) => items?.length ? h('section', { class: 'card v-goals' },
    h('h2', { class: 'v-card-title' }, icon(ic), uiLabel(title, { layout: 'inline' })),
    h('ul', { class: 'v-goal-list is-plain' }, items.map(g => h('li', deText(g))))) : null;
  return page({
    title: { uk: meta.title_uk, de: meta.title_de }, largeTitle: false, back: COURSE_BACK, cls: 'v-lesson',
    children: [
      h('section', { class: 'v-lesson-hero is-planned', style: sty({ '--theme-c': color }) },
        h('div', { class: 'v-lesson-glyph emoji' }, anim.themeGlyph(meta.theme)),
        h('div', { class: 'v-lesson-head' },
          h('div', { class: 'v-lesson-cap' }, uiLabel({ uk: `${uiT('lesson').uk} ${meta.index + 1} · ${meta.phaseId}`, de: `Lektion ${meta.index + 1}` }, { layout: 'inline' }),
            h('span', { class: 'badge v-planned-badge', title: uiT(prep ? 'soon' : 'planned').de }, ukText(uiT(prep ? 'soon' : 'planned').uk))),
          ukText(meta.title_uk, { cls: 'v-lesson-uk', tag: 'h1' }),
          h('div', { class: 'v-lesson-de ui-de', lang: 'de' }, meta.title_de),
          h('p', { class: 'v-lesson-note' }, uiLabel(prep ? 'lesson_prep_note' : 'lesson_planned_note')))),
      h('div', { class: 'grid-2' },
        h('div', { class: 'v-stack' }, goalsCard(meta.goals_de), list('grammar', 'book', meta.grammar_de)),
        h('div', { class: 'v-stack' }, list('word_fields', 'words', meta.vocab_fields_de))),
    ],
  });
}

export function render(params, app) {
  const id = params.id;
  const meta = app.content.getMeta?.(id) || app.content.lessonList.find(l => l.id === id);
  if (!meta) {
    return page({ title: uiT('lesson'), back: COURSE_BACK, children: [h('div', { class: 'empty' }, h('div', { class: 'empty-glyph' }, '🔍'), h('p', uiLabel('lesson_not_found')))] });
  }
  const lesson = app.content.getLesson(id);
  if (!lesson) return plannedPage(meta, app);

  const today = dayKey();
  const st = app.store.state.lessons?.[id];
  const m = lessonMastery(app, id);
  const unlocked = isUnlocked(app, id);
  const color = anim.themeColor?.(lesson.theme || meta.theme) || 'var(--green)';
  const theme = lesson.theme || meta.theme;

  const start = async () => {
    if (!unlocked) {
      const ok = await confirmDialog({
        title: uiLabel('lesson_locked'),
        message: uiLabel('lesson_locked_msg'),
        ok: holdLabel('start_anyway'), cancel: holdLabel('cancel'),
      });
      if (!ok) return;
    }
    startLesson(app, id);
  };

  const ringBox = h('div', { class: 'v-lesson-ring' }, ringSvg(m.fraction, { size: 64, stroke: 8 }),
    h('span', { class: 'v-lesson-ring-num num' }, `${m.level}`));
  const hero = h('section', { class: 'v-lesson-hero', style: sty({ '--theme-c': color }) },
    h('div', { class: 'v-lesson-glyph emoji' }, anim.themeGlyph(theme)),
    h('div', { class: 'v-lesson-head' },
      h('div', { class: 'v-lesson-cap' }, uiLabel({ uk: `${uiT('lesson').uk} ${meta.index + 1} · ${meta.phaseId}`, de: `Lektion ${meta.index + 1}` }, { layout: 'inline' }),
        !unlocked ? h('span', { class: 'badge v-planned-badge', title: uiT('later').de }, icon('lock'), ukText(uiT('later').uk)) : null),
      h('div', { class: 'v-lesson-titlerow' },
        ukText(lesson.title_uk || meta.title_uk, { cls: 'v-lesson-uk', tag: 'h1' }),
        speakerButton(lesson.title_uk || meta.title_uk, { size: 's' })),
      h('div', { class: 'v-lesson-de ui-de', lang: 'de' }, lesson.title_de || meta.title_de)),
    h('div', { class: 'v-lesson-mastery' },
      ringBox,
      h('div', { class: 'v-lesson-mastery-text' },
        h('div', { class: 't-headline' }, uiLabel({ uk: `${uiT('level').uk} ${m.level}`, de: `Stufe ${m.level} · ${m.label}` }, { layout: 'inline' })),
        h('div', { class: 't-foot t-2' }, uiLabel(joinUi(uiN('words_learned_of', { a: m.introduced, b: m.total }), st?.sessions ? uiN('sessions_n', { a: st.sessions }) : null))))),
    h('button', { type: 'button', class: 'btn btn-primary btn-lg btn-block v-lesson-start', on: { click: start } },
      icon('play', { fill: true }), holdLabel(st?.sessions ? 'keep_practicing' : 'start_lesson')));

  const links = listGroup({
    rows: [
      lesson.story ? { title: holdLabel('story', { cls: 'row-title' }), subtitle: uiLabel(lesson.story.title_uk ? { uk: lesson.story.title_uk, de: lesson.story.title_de || '' } : 'story_text', { cls: 'row-subtitle', layout: 'inline' }), icon: { name: 'chat', color: 'var(--orange)' },
        href: `#/story/${encodeURIComponent(id)}`, accessory: 'chevron' } : null,
      { title: holdLabel('explanation', { cls: 'row-title' }), subtitle: uiLabel({ uk: uiT('grammar').uk, de: lesson.explanation?.title_de || uiT('grammar').de }, { cls: 'row-subtitle', layout: 'inline' }), icon: { name: 'bulb', color: 'var(--yellow)' },
        href: `#/explain/${encodeURIComponent(id)}`, accessory: 'chevron' },
    ],
  });

  const concepts = lesson.concepts?.length ? h('section', { class: 'v-concepts' },
    h('div', { class: 'section-header' }, uiLabel('new_topics', { layout: 'inline' })),
    h('div', { class: 'v-concept-chips' }, lesson.concepts.map(c => h('a', { class: 'v-concept', href: `#/explain/${encodeURIComponent(id)}` }, icon('sparkles'), deText(c.title_de || c.id))))) : null;

  const grammar = lesson.grammar?.length ? h('section', { class: 'v-stack' },
    h('div', { class: 'section-header' }, uiLabel('grammar', { layout: 'inline' })),
    lesson.grammar.map(g => h('article', { class: 'card v-grammar' },
      h('h3', { class: 'v-grammar-title de', lang: 'de' }, g.title_de),
      richText(g.body_de, { cls: 'v-grammar-body de' }),
      g.examples?.length ? h('div', { class: 'v-examples' }, g.examples.map(ex => h('div', { class: 'v-example' },
        speakerButton(ex.uk, { size: 's' }),
        h('div', { class: 'v-example-text' }, ukText(ex.uk, { cls: 'v-example-uk' }), deText(ex.de, { cls: 'v-example-de' }))))) : null))) : null;

  const cards = app.store.state.srs?.vocab || {};
  const vocab = listGroup({
    header: uiLabel({ uk: `${uiT('vocabulary').uk} · ${lesson.vocab.length}`, de: 'Wortschatz' }, { layout: 'inline' }),
    footer: uiLabel('strength_bars'),
    rows: lesson.vocab.map(v => {
      const lv = strengthLevel(cards[v.id], today);
      return {
        cls: 'v-vocab-row',
        icon: v.emoji ? { emoji: v.emoji, color: 'var(--surface-2)' } : { name: 'words', color: color },
        title: ukText(v.uk, { cls: 'row-title v-vocab-uk' }),
        subtitle: deText([v.de, v.info].filter(Boolean).join(' · '), { cls: 'row-subtitle' }),
        detail: strengthBars(lv),
        accessory: speakerButton(v.uk, { size: 's' }),
      };
    }),
  });

  return page({
    title: { uk: lesson.title_uk || meta.title_uk, de: lesson.title_de || meta.title_de }, largeTitle: false,
    back: COURSE_BACK, cls: 'v-lesson',
    children: [
      h('div', { class: 'v-lesson-grid' },
        h('div', { class: 'v-stack' }, hero, links, concepts, goalsCard(lesson.goals_de || meta.goals_de), grammar),
        h('div', { class: 'v-stack' }, vocab)),
    ],
  });
}
