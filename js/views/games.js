// Mini-Spiele (#/games, #/games/:id): stumm spielbar, nur gelernter Wortschatz. Ändern die Wiederholungsplanung nicht,
// bevorzugen aber schwache Wörter (niedrige Stabilität), damit nebenbei wiederholt wird.
import { h, ukText, deText, icon } from '../ui/dom.js';
import { page, listGroup } from '../ui/shell.js';
import { unlockedVocab } from '../engine/trainer.js';
import { isUnlocked } from '../engine/progress.js';
import { crossword } from '../games/crossword.js';
import { memory } from '../games/memory.js';

const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);

/** Gelernte Wörter, schwache zuerst (mit etwas Zufall). */
function learnedWords(app) {
  const cards = app.store.state.srs?.vocab || {};
  const all = unlockedVocab(app);
  const learned = all.filter(v => cards[v.id]);
  const list = learned.length >= 6 ? learned : all;
  return list.map(v => ({ v, w: (cards[v.id]?.S ?? 0) + Math.random() * 3 })).sort((a, b) => a.w - b.w).map(x => x.v);
}

function formSets(app) {
  const out = [];
  for (const meta of app.content.readyLessons()) {
    if (!isUnlocked(app, meta.id)) continue;
    for (const fp of app.content.getLesson(meta.id)?.form_pairs || []) out.push({ ...fp, lessonId: meta.id });
  }
  return out;
}

const GAMES = [
  { id: 'crossword', uk: 'Кросво́рд', de: 'Kreuzworträtsel', emoji: '🧩', sub: 'Wörter aus Hinweisen erschließen' },
  { id: 'memory', uk: 'Па́ри', de: 'Memory: Wort ↔ Bedeutung', emoji: '🃏', sub: 'Ukrainisch und Deutsch zusammenführen' },
  { id: 'forms', uk: 'Фо́рми', de: 'Memory: Formen', emoji: '🔁', sub: 'Zusammengehörige Formen finden' },
];

function title(g) { return h('span', { class: 'gm-title' }, ukText(g.uk), deText(` ${g.de}`, { cls: 'gm-title-de' })); }

export function render(params, app) {
  const id = params.id;
  const g = GAMES.find(x => x.id === id);
  if (!g) {
    return page({
      title: 'І́гри', subtitle: 'Spiele – stumm, nebenbei wiederholen',
      children: [listGroup({
        rows: GAMES.filter(x => x.id !== 'forms' || formSets(app).length).map(x => ({
          icon: { emoji: x.emoji, color: 'var(--surface-2)' },
          title: title(x), subtitle: x.sub, accessory: 'chevron', href: `#/games/${x.id}`,
        })),
        footer: 'Die Spiele nutzen nur Wörter aus freigeschalteten Lektionen und bevorzugen solche, die noch nicht sicher sitzen.',
      })],
    });
  }

  const host = h('div', { class: 'gm-host' });
  const again = h('button', { type: 'button', class: 'btn btn-primary btn-block gm-again', on: { click: () => start() } }, icon('refresh'), 'Neues Spiel');
  function start() {
    let el;
    if (id === 'crossword') el = crossword(app, learnedWords(app));
    else if (id === 'memory') el = memory(app, shuffle(learnedWords(app).slice(0, 10)).slice(0, 6).map(v => ({ a: v.uk, b: v.de, aLang: 'uk', bLang: 'de' })));
    else {
      const sets = formSets(app);
      const s = sets[Math.floor(Math.random() * sets.length)];
      el = h('div', h('p', { class: 'gm-set t-foot' }, s.title_de),
        memory(app, shuffle(s.pairs).slice(0, 6).map(([a, b]) => ({ a, b, aLang: 'uk', bLang: 'uk', aTag: s.tag_a, bTag: s.tag_b }))));
    }
    host.replaceChildren(el);
  }
  start();
  return page({ title: g.uk, largeTitle: false, back: { href: '#/games', label: 'І́гри' }, cls: 'gm-page',
    children: [h('div', { class: 'gm-head' }, title(g)), host, again] });
}
