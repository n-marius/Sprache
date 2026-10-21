// Lektionsseite: Kopf (Theme, Titel, Meisterschaft, Start), Geschichte/Erklärung, Konzepte, Ziele, Grammatik, Vokabeln.
import { page, listGroup, confirmDialog } from '../ui/shell.js';
import { h, icon, ukText, deText, richText } from '../ui/dom.js';
import { anim } from '../ui/anim.js';
import { speakerButton } from '../ui/audio-button.js';
import { lessonMastery, isUnlocked, dayKey } from '../engine/progress.js';
import { strengthLevel, STRENGTH_LABEL } from '../engine/srs.js';
import { startLesson } from '../engine/flow.js';
import { ringSvg, sty } from './today.js';

function strengthBars(level) {
  return h('span', { class: ['v-str', `lv-${level}`], title: STRENGTH_LABEL[level] || '', 'aria-label': `Stärke: ${STRENGTH_LABEL[level] || ''}` },
    [1, 2, 3, 4].map(i => h('span', { class: ['v-str-bar', i <= level && 'is-on'] })));
}

function goalsCard(goals) {
  if (!goals?.length) return null;
  return h('section', { class: 'card v-goals' },
    h('h2', { class: 'v-card-title' }, icon('target'), 'Ziele'),
    h('ul', { class: 'v-goal-list' }, goals.map(g => h('li', icon('check'), h('span', g)))));
}

function plannedPage(meta, app) {
  const prep = meta.status === 'error' || meta.status === 'ready';
  const color = anim.themeColor?.(meta.theme) || 'var(--green)';
  const list = (title, ic, items) => items?.length ? h('section', { class: 'card v-goals' },
    h('h2', { class: 'v-card-title' }, icon(ic), title),
    h('ul', { class: 'v-goal-list is-plain' }, items.map(g => h('li', h('span', g))))) : null;
  return page({
    title: meta.title_de, largeTitle: false, back: { label: 'Kurs', href: '#/course' }, cls: 'v-lesson',
    children: [
      h('section', { class: 'v-lesson-hero is-planned', style: sty({ '--theme-c': color }) },
        h('div', { class: 'v-lesson-glyph emoji' }, anim.themeGlyph(meta.theme)),
        h('div', { class: 'v-lesson-head' },
          h('div', { class: 'v-lesson-cap' }, `Lektion ${meta.index + 1} · ${meta.phaseId}`, h('span', { class: 'badge v-planned-badge' }, prep ? 'in Vorbereitung' : 'geplant')),
          ukText(meta.title_uk, { cls: 'v-lesson-uk', tag: 'h1' }),
          h('div', { class: 'v-lesson-de' }, meta.title_de),
          h('p', { class: 'v-lesson-note' }, prep ? 'Die Inhalte dieser Lektion werden gerade fertiggestellt.' : 'Diese Lektion ist geplant – Ziele und Themen stehen schon fest.'))),
      h('div', { class: 'grid-2' },
        h('div', { class: 'v-stack' }, goalsCard(meta.goals_de), list('Grammatik', 'book', meta.grammar_de)),
        h('div', { class: 'v-stack' }, list('Wortfelder', 'words', meta.vocab_fields_de))),
    ],
  });
}

export function render(params, app) {
  const id = params.id;
  const meta = app.content.getMeta?.(id) || app.content.lessonList.find(l => l.id === id);
  if (!meta) {
    return page({ title: 'Lektion', back: { label: 'Kurs', href: '#/course' }, children: [h('div', { class: 'empty' }, h('div', { class: 'empty-glyph' }, '🔍'), h('p', 'Lektion nicht gefunden.'))] });
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
        title: 'Noch nicht freigeschaltet',
        message: 'Empfohlen ist, zuerst die vorherige Lektion einmal abzuschließen. Trotzdem starten?',
        ok: 'Trotzdem starten', cancel: 'Abbrechen',
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
      h('div', { class: 'v-lesson-cap' }, `Lektion ${meta.index + 1} · ${meta.phaseId}`,
        !unlocked ? h('span', { class: 'badge v-planned-badge' }, icon('lock'), 'empfohlen später') : null),
      h('div', { class: 'v-lesson-titlerow' },
        ukText(lesson.title_uk || meta.title_uk, { cls: 'v-lesson-uk', tag: 'h1' }),
        speakerButton(lesson.title_uk || meta.title_uk, { size: 's' })),
      h('div', { class: 'v-lesson-de' }, lesson.title_de || meta.title_de)),
    h('div', { class: 'v-lesson-mastery' },
      ringBox,
      h('div', { class: 'v-lesson-mastery-text' },
        h('div', { class: 't-headline' }, `Stufe ${m.level} · ${m.label}`),
        h('div', { class: 't-foot t-2' }, `${m.introduced} von ${m.total} Wörtern eingeführt${st?.sessions ? ` · ${st.sessions} ${st.sessions === 1 ? 'Session' : 'Sessions'}` : ''}`))),
    h('button', { type: 'button', class: 'btn btn-primary btn-lg btn-block v-lesson-start', on: { click: start } },
      icon('play', { fill: true }), st?.sessions ? 'Weiter üben' : 'Starten'));

  const links = listGroup({
    rows: [
      lesson.story ? { title: 'Geschichte', subtitle: lesson.story.title_de || 'Ankertext der Lektion', icon: { name: 'chat', color: 'var(--orange)' },
        href: `#/story/${encodeURIComponent(id)}`, accessory: 'chevron' } : null,
      { title: 'Erklärung', subtitle: lesson.explanation?.title_de || 'Grammatik und Wendungen', icon: { name: 'bulb', color: 'var(--yellow)' },
        href: `#/explain/${encodeURIComponent(id)}`, accessory: 'chevron' },
    ],
  });

  const concepts = lesson.concepts?.length ? h('section', { class: 'v-concepts' },
    h('div', { class: 'section-header' }, 'Neue Konzepte'),
    h('div', { class: 'v-concept-chips' }, lesson.concepts.map(c => h('a', { class: 'v-concept', href: `#/explain/${encodeURIComponent(id)}` }, icon('sparkles'), c.title_de || c.id)))) : null;

  const grammar = lesson.grammar?.length ? h('section', { class: 'v-stack' },
    h('div', { class: 'section-header' }, 'Grammatik-Tipps'),
    lesson.grammar.map(g => h('article', { class: 'card v-grammar' },
      h('h3', { class: 'v-grammar-title' }, g.title_de),
      richText(g.body_de, { cls: 'v-grammar-body' }),
      g.examples?.length ? h('div', { class: 'v-examples' }, g.examples.map(ex => h('div', { class: 'v-example' },
        speakerButton(ex.uk, { size: 's' }),
        h('div', { class: 'v-example-text' }, ukText(ex.uk, { cls: 'v-example-uk' }), deText(ex.de, { cls: 'v-example-de' }))))) : null))) : null;

  const cards = app.store.state.srs?.vocab || {};
  const vocab = listGroup({
    header: `Wortschatz · ${lesson.vocab.length}`,
    footer: 'Balken = Stärke im Gedächtnis (wächst mit Wiederholungen).',
    rows: lesson.vocab.map(v => {
      const lv = strengthLevel(cards[v.id], today);
      return {
        cls: 'v-vocab-row',
        icon: v.emoji ? { emoji: v.emoji, color: 'var(--surface-2)' } : { name: 'words', color: color },
        title: ukText(v.uk, { tap: false, cls: 'row-title v-vocab-uk' }),
        subtitle: [v.de, v.info].filter(Boolean).join(' · '),
        detail: strengthBars(lv),
        accessory: speakerButton(v.uk, { size: 's' }),
      };
    }),
  });

  return page({
    title: lesson.title_de || meta.title_de, largeTitle: false,
    back: { label: 'Kurs', href: '#/course' }, cls: 'v-lesson',
    children: [
      h('div', { class: 'v-lesson-grid' },
        h('div', { class: 'v-stack' }, hero, links, concepts, goalsCard(lesson.goals_de || meta.goals_de), grammar),
        h('div', { class: 'v-stack' }, vocab)),
    ],
  });
}
