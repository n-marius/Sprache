// Mini-Spiele (#/games, #/games/:id): stumm spielbar, nur gelernter Wortschatz. Ändern die Wiederholungsplanung nicht,
// bevorzugen aber schwache Wörter (niedrige Stabilität), damit nebenbei wiederholt wird.
import { h, ukText, deText, icon } from '../ui/dom.js';
import { page, listGroup } from '../ui/shell.js';
import { unlockedVocab } from '../engine/trainer.js';
import { isUnlocked } from '../engine/progress.js';
import { crossword } from '../games/crossword.js';
import { memory } from '../games/memory.js';
import { uiLabel, holdLabel, uiT } from '../ui/ui-label.js';
import { uiF } from '../ui-text-g2.js';

/** Zeilen-Untertitel: Ukrainisch, darunter dezent Deutsch (langer Druck übersetzt). */
const subLabel = t => { const el = holdLabel(t, { cls: 'row-subtitle' }); el.style.cssText = 'display:flex;flex-direction:column;align-items:flex-start'; return el; };

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
  { id: 'crossword', uk: uiT('game_crossword').uk, de: 'Kreuzworträtsel', emoji: '🧩', sub: 'game_cw_sub' },
  { id: 'memory', uk: uiT('game_pairs').uk, de: 'Memory: Wort ↔ Bedeutung', emoji: '🃏', sub: 'game_pairs_sub' },
  { id: 'forms', uk: uiT('game_forms').uk, de: 'Memory: Formen', emoji: '🔁', sub: 'game_forms_sub' },
];

function title(g, hold = false) { return h('span', { class: 'gm-title' }, ukText(g.uk, { hold }), deText(` ${g.de}`, { cls: 'gm-title-de ui-de' })); }

export function render(params, app) {
  const id = params.id;
  const g = GAMES.find(x => x.id === id);
  if (!g) {
    return page({
      title: uiT('games'), subtitle: h('div', { class: 'page-subtitle' }, uiLabel(uiF('games_subtitle'))),
      children: [listGroup({
        rows: GAMES.filter(x => x.id !== 'forms' || formSets(app).length).map(x => ({
          icon: { emoji: x.emoji, color: 'var(--surface-2)' },
          title: title(x, true), subtitle: subLabel(uiF(x.sub)), accessory: 'chevron', href: `#/games/${x.id}`,
        })),
        footer: uiLabel(uiF('games_footer')),
      })],
    });
  }

  const host = h('div', { class: 'gm-host' });
  const again = h('button', { type: 'button', class: 'btn btn-primary btn-block gm-again', on: { click: () => start() } }, icon('refresh'), holdLabel(uiF('new_game')));
  function start() {
    let el;
    if (id === 'crossword') el = crossword(app, learnedWords(app));
    else if (id === 'memory') el = memory(app, shuffle(learnedWords(app).slice(0, 10)).slice(0, 6).map(v => ({ a: v.uk, b: v.de, aLang: 'uk', bLang: 'de' })));
    else {
      const sets = formSets(app);
      const s = sets[Math.floor(Math.random() * sets.length)];
      el = h('div', deText(s.title_de, { tag: 'p', cls: 'gm-set t-foot' }),
        memory(app, shuffle(s.pairs).slice(0, 6).map(([a, b]) => ({ a, b, aLang: 'uk', bLang: 'uk', aTag: s.tag_a, bTag: s.tag_b }))));
    }
    host.replaceChildren(el);
  }
  start();
  return page({ title: g.uk, largeTitle: false, back: { href: '#/games', label: uiT('games') }, cls: 'gm-page',
    children: [h('div', { class: 'gm-head' }, title(g)), host, again] });
}
