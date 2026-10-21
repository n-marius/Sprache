// Erklärungsseite einer Lektion (#/explain/:id, ?start=1 → am Ende „Weiter zu den Übungen“).
// Gut lesbare Seite: Einleitung, Abschnitte mit Fließtext, Tabellen, Beispielen (Audio + Tap-Übersetzung), Merksätze.
import { h, ukText, deText, icon } from '../ui/dom.js';
import { page } from '../ui/shell.js';
import { anim } from '../ui/anim.js';
import { speakerButton } from '../ui/audio-button.js';
import { startLesson, markExplained } from '../engine/flow.js';
import { isUnlocked } from '../engine/progress.js';
import { addMined, isMined } from '../services/mining.js';
import { toast } from '../ui/shell.js';

const CYR = /[Ѐ-ӿ]/;

/** Absätze (\n\n) mit **fett**; ukrainische Wörter im Fließtext antippbar. */
function paragraphs(text) {
  return String(text || '').split(/\n\s*\n/).filter(Boolean).map(par => {
    const p = h('p', { class: 'xp-p' });
    for (const part of par.split(/(\*\*[^*]+\*\*|\n)/)) {
      if (!part) continue;
      if (part === '\n') { p.append(h('br')); continue; }
      const bold = part.startsWith('**') && part.endsWith('**');
      const txt = bold ? part.slice(2, -2) : part;
      const node = CYR.test(txt) ? mixed(txt) : document.createTextNode(txt);
      p.append(bold ? h('strong', node) : node);
    }
    return p;
  });
}

/** Text mit gemischtem Deutsch/Ukrainisch: ukrainische Abschnitte antippbar. */
function mixed(txt) {
  const frag = document.createDocumentFragment();
  for (const seg of txt.split(/([Ѐ-ӿ][Ѐ-ӿ́’'ʼ\- ]*[Ѐ-ӿ́]|[Ѐ-ӿ])/)) {
    if (!seg) continue;
    frag.append(CYR.test(seg) ? ukText(seg) : document.createTextNode(seg));
  }
  return frag;
}

function cell(text, tag) {
  const c = h(tag, { class: CYR.test(text) ? 'xp-uk' : '' });
  c.append(CYR.test(text) ? mixed(String(text)) : String(text ?? ''));
  return c;
}

function table(t) {
  if (!t || !Array.isArray(t.rows)) return null;
  return h('div', { class: 'xp-table-wrap' },
    h('table', { class: 'xp-table' },
      t.head ? h('thead', h('tr', t.head.map(x => cell(x, 'th')))) : null,
      h('tbody', t.rows.map(r => h('tr', r.map(x => cell(x, 'td')))))));
}

function examples(app, list, lessonId) {
  if (!list?.length) return null;
  return h('ul', { class: 'xp-examples' }, list.map(ex => {
    const mineBtn = h('button', {
      type: 'button', class: ['icon-btn', 'xp-mine', isMined(app, ex.uk) && 'is-on'], 'aria-label': 'Satz merken',
      on: { click: e => {
        e.stopPropagation();
        if (addMined(app, { uk: ex.uk, de: ex.de, lessonId, source: 'explain' })) { mineBtn.classList.add('is-on'); toast('Satz im Trainer gespeichert'); }
      } },
    }, icon('plus'));
    return h('li', { class: 'xp-example' },
      speakerButton(ex.uk, { size: 's' }),
      h('div', { class: 'xp-example-text' }, ukText(ex.uk, { cls: 'xp-example-uk' }), deText(ex.de, { cls: 'xp-example-de' })),
      mineBtn);
  }));
}

export function render(params, app) {
  const id = params.id;
  const lesson = app.content.getLesson(id);
  const meta = app.content.getMeta(id);
  const start = params.query.get('start') === '1';
  if (!lesson) {
    return page({ title: 'Erklärung', back: { href: '#/library', label: 'Wissen' }, children: [h('div', { class: 'empty' }, h('div', { class: 'empty-glyph' }, '🔒'), h('p', 'Diese Lektion ist noch nicht verfügbar.'))] });
  }
  const unlocked = isUnlocked(app, id) || !!app.store.state.lessons[id]?.sessions || start;
  const x = lesson.explanation;
  const glyph = anim.themeGlyph(lesson.theme);
  const color = anim.themeColor(lesson.theme);

  const hero = h('header', { class: 'xp-hero', style: { '--theme-c': color } },
    h('div', { class: 'xp-badge emoji', 'aria-hidden': 'true' }, glyph),
    h('div', { class: 'xp-hero-text' },
      h('div', { class: 't-cap xp-kicker' }, `${meta?.phaseId || lesson.phase} · Erklärung`),
      h('h1', { class: 't-title1 xp-title' }, x?.title_de || lesson.title_de),
      h('div', { class: 'xp-lesson' }, ukText(lesson.title_uk), h('span', { class: 't-2' }, ' · ', lesson.title_de))));

  const body = [];
  if (!x) {
    body.push(h('div', { class: 'card' }, h('p', 'Für diese Lektion gibt es noch keine ausführliche Erklärung.'),
      ...(lesson.grammar || []).map(g => h('div', { class: 'xp-section' }, h('h2', { class: 'xp-h2' }, g.title_de), ...paragraphs(g.body_de), examples(app, g.examples, id)))));
  } else if (!unlocked) {
    body.push(h('div', { class: 'card xp-locked' }, icon('lock'), h('p', 'Diese Erklärung wird freigeschaltet, sobald du die vorige Lektion begonnen hast.')));
  } else {
    if (x.intro_de) body.push(h('p', { class: 'xp-intro' }, x.intro_de));
    if (lesson.concepts?.length) body.push(h('div', { class: 'xp-concepts' }, lesson.concepts.map(c => h('span', { class: 'badge blue' }, c.title_de))));
    (x.sections || []).forEach((s, i) => {
      body.push(h('section', { class: 'card xp-section' },
        h('h2', { class: 'xp-h2' }, h('span', { class: 'xp-num' }, String(i + 1)), s.heading_de),
        ...paragraphs(s.body_de),
        table(s.table),
        examples(app, s.examples, id)));
    });
    if (x.summary_de?.length) {
      body.push(h('section', { class: 'card xp-summary' },
        h('h2', { class: 'xp-h2' }, icon('bulb'), 'Merksätze'),
        h('ul', x.summary_de.map(m => h('li', icon('check'), h('span', CYR.test(m) ? mixed(m) : m))))));
    }
  }

  const actions = h('div', { class: 'xp-actions' });
  if (start) {
    actions.append(h('button', { type: 'button', class: 'btn btn-primary btn-lg btn-block btn-caps', on: { click: () => markExplained(app, id, { proceed: true }) } }, 'Weiter zu den Übungen'));
  } else if (unlocked && app.content.getLesson(id)) {
    actions.append(h('button', { type: 'button', class: 'btn btn-primary btn-lg btn-block btn-caps', on: { click: () => { markExplained(app, id); startLesson(app, id); } } }, 'Lektion üben'));
    if (lesson.story) actions.append(h('a', { class: 'btn btn-secondary btn-block', href: `#/story/${encodeURIComponent(id)}` }, icon('book'), 'Geschichte lesen'));
  }
  if (unlocked && x && !start) markExplained(app, id);

  return page({
    title: x?.title_de || 'Erklärung', largeTitle: false, cls: 'xp-page',
    back: start ? { href: `#/lesson/${encodeURIComponent(id)}`, label: 'Lektion' } : true,
    children: [h('article', { class: 'xp-article' }, hero, ...body, actions)],
  });
}
