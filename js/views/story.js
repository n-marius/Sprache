// Geschichte / Ankertext einer Lektion (#/story/:id; ?start=1 → danach Erklärung; ?review=1 → Wiederlesen ohne Übersetzung).
// Forschung (docs/research-immersion.md): Input zuerst, Erschließen vor Aufdecken (2–4 neue Wörter), Noticing erst im
// zweiten Durchgang, Satz-Mining, Shadowing (hören → nachsprechen → hören), Übersetzung nur auf Wunsch.
import { h, ukText, deText, icon } from '../ui/dom.js';
import { page, toast, segmented } from '../ui/shell.js';
import { anim } from '../ui/anim.js';
import { speakerButton } from '../ui/audio-button.js';
import { normalizeWord, tokenize } from '../lib/uk-text.js';
import { startLesson, markStorySeen } from '../engine/flow.js';
import { addMined, isMined } from '../services/mining.js';
import { isListenOff } from '../audio-mode.js';
import { hidePopover } from '../ui/popover.js';
import { mulberry32, hashStr, shuffle } from '../engine/util.js';

const MAX_GUESS = 4;

/** Story aus lesson.story oder Fallback (erste reading-Aufgabe bzw. erster chat). */
function storyOf(lesson) {
  if (lesson.story?.lines?.length) return { ...lesson.story, real: true };
  const rd = lesson.exercises.find(e => e.type === 'reading');
  if (rd) {
    const sents = rd.text_uk.match(/[^.!?…]+[.!?…]*/g)?.map(s => s.trim()).filter(Boolean) || [rd.text_uk];
    return { title_uk: rd.title_uk, title_de: lesson.title_de, lines: sents.map(uk => ({ uk })), text_de: rd.text_de, characters: [] };
  }
  const ch = lesson.exercises.find(e => e.type === 'chat');
  if (ch) {
    const me = 'Ти';
    return {
      title_uk: lesson.title_uk, title_de: lesson.title_de, scene_de: ch.scenario_de,
      characters: [{ name: ch.partner?.name, emoji: ch.partner?.emoji || '🙂' }, { name: me, emoji: '🙂' }],
      lines: ch.turns.map(t => t.who === 'bot' ? { who: ch.partner?.name, uk: t.uk, de: t.de } : { who: me, uk: t.options[0].uk, de: t.options[0].de }),
    };
  }
  return null;
}

/** Schlüssel der neuen Formen: story.new oder vocab+forms der Lektion. */
function newKeys(story, lesson) {
  const list = story.new?.length ? story.new : lesson.vocab.flatMap(v => [v.uk, ...(v.forms || []).map(f => f.uk)]);
  const keys = new Set();
  for (const w of list) for (const p of tokenize(w)) if (p.word) keys.add(p.key);
  return keys;
}

export function render(params, app) {
  const id = params.id;
  const lesson = app.content.getLesson(id);
  const start = params.query.get('start') === '1';
  const review = params.query.get('review') === '1';
  const back = { href: `#/lesson/${encodeURIComponent(id)}`, label: 'Lektion' };
  if (!lesson) return page({ title: 'Geschichte', back, children: [h('div', { class: 'empty' }, h('div', { class: 'empty-glyph' }, '📖'), h('p', 'Diese Lektion ist noch nicht verfügbar.'))] });
  const story = storyOf(lesson);
  if (!story) {
    if (start) { markStorySeen(app, id, { proceed: true }); }
    return page({ title: 'Geschichte', back, children: [h('div', { class: 'empty' }, h('p', 'Für diese Lektion gibt es keine Geschichte.'))] });
  }

  const listenOff = isListenOff(app);
  const keys = newKeys(story, lesson);
  const firstVisit = !app.store.state.lessons[id]?.storySeenAt;
  let showDe = false;
  let notice = review; // Noticing: Hervorhebung erst beim Wiederlesen (oder per Schalter)
  const rng = mulberry32(hashStr(id));

  // Rate-Optionen für das Erschließen (richtige Bedeutung + 2 Ablenker aus der Lektion)
  const deOf = key => app.lexicon.lookup(key)[0]?.de || '';
  const pool = [...new Set(lesson.vocab.map(v => v.de).concat(lesson.glossary.map(g => g.de)))].filter(Boolean);
  const guessOptions = key => {
    const right = deOf(key);
    if (!right) return [];
    const wrong = shuffle(pool.filter(d => d !== right), rng).slice(0, 2);
    return shuffle([{ de: right, correct: true }, ...wrong.map(de => ({ de, correct: false }))], rng);
  };

  // ---------- Kopf ----------
  const chars = (story.characters || []).filter(c => c.name);
  const hero = h('header', { class: 'st-hero', style: { '--theme-c': anim.themeColor(lesson.theme) } },
    h('div', { class: 'st-kicker t-cap' }, review ? 'Noch einmal lesen' : 'Geschichte', ' · ', anim.themeGlyph(lesson.theme)),
    h('h1', { class: 'st-title' }, ukText(story.title_uk || lesson.title_uk)),
    h('div', { class: 'st-subtitle t-2' }, story.title_de || lesson.title_de),
    story.scene_de && !review ? h('p', { class: 'st-scene' }, story.scene_de) : null,
    chars.length ? h('div', { class: 'st-cast' }, chars.map(c => h('div', { class: 'st-person' },
      h('span', { class: 'st-avatar emoji' }, c.emoji || '🙂'),
      h('span', { class: 'st-person-name' }, ukText(c.name)),
      c.role_de ? h('span', { class: 'st-person-role' }, c.role_de) : null))) : null);

  // ---------- Zeilen ----------
  const lineEls = [];
  const guessBudget = { n: 0 };
  const markWords = (el, { guess }) => {
    const seenKeys = new Set();
    for (const w of el.querySelectorAll('.w')) {
      if (!keys.has(w.dataset.k)) continue;
      w.classList.add('st-new');
      if (guess && !seenKeys.has(w.dataset.k) && guessBudget.n < MAX_GUESS && !guessBudget[w.dataset.k]) {
        w.classList.add('is-new'); guessBudget[w.dataset.k] = 1; guessBudget.n++; seenKeys.add(w.dataset.k);
      }
    }
  };
  const indexOfChar = name => chars.findIndex(c => normalizeWord(c.name || '') === normalizeWord(name || ''));
  const lines = h('div', { class: 'st-lines', 'data-guess': firstVisit && !review ? '1' : null });
  lines.__guessOptions = guessOptions;
  story.lines.forEach((ln, i) => {
    const ci = ln.who ? indexOfChar(ln.who) : -1;
    const narration = !ln.who;
    const uk = ukText(ln.uk, { cls: 'st-uk' });
    markWords(uk, { guess: firstVisit && !review });
    const de = ln.de ? deText(ln.de, { cls: 'st-de' }) : null;
    if (de) de.hidden = true;
    const mine = h('button', {
      type: 'button', class: ['icon-btn', 'st-mine', isMined(app, ln.uk) && 'is-on'], 'aria-label': 'Satz merken', title: 'Satz merken',
      on: { click: e => { e.stopPropagation(); if (addMined(app, { uk: ln.uk, de: ln.de || '', lessonId: id, source: 'story' })) { mine.classList.add('is-on'); anim.pop(mine); toast('Satz im Trainer gespeichert'); } } },
    }, icon('plus'));
    const deBtn = de && !review ? h('button', { type: 'button', class: 'st-de-btn', on: { click: e => { e.stopPropagation(); de.hidden = !de.hidden; deBtn.classList.toggle('is-on', !de.hidden); } } }, 'DE') : null;
    const tools = h('div', { class: 'st-tools' }, listenOff ? null : speakerButton(ln.uk, { size: 's' }), deBtn, mine);
    const side = narration ? 'narr' : (ci % 2 === 1 ? 'right' : 'left');
    const row = h('div', { class: ['st-line', `is-${side}`], dataset: { i: String(i) } },
      narration ? null : h('span', { class: 'st-line-avatar emoji', title: ln.who }, chars[ci]?.emoji || '🙂'),
      h('div', { class: 'st-bubble' },
        narration ? null : h('div', { class: 'st-who' }, ukText(ln.who, { tap: false })),
        uk, de, tools));
    lineEls.push({ row, de, ln });
    lines.append(row);
  });

  // Gesamtübersetzung bei Fallback ohne Zeilenübersetzungen
  const fullDe = story.text_de && !review ? deText(story.text_de, { cls: 'st-fullde', tag: 'p' }) : null;
  if (fullDe) fullDe.hidden = true;

  // ---------- Steuerleiste ----------
  const setDe = on => { showDe = on; lineEls.forEach(l => { if (l.de) l.de.hidden = !on; }); if (fullDe) fullDe.hidden = !on; };
  const setNotice = on => { notice = on; lines.classList.toggle('is-noticing', on); };
  setNotice(notice);
  let playing = null;
  const stopPlay = () => { if (playing) playing.stop = true; playing = null; app.tts.stop(); lineEls.forEach(l => l.row.classList.remove('is-playing', 'is-yourturn')); playBtn && (playBtn.lastChild.textContent = 'Alles anhören'); shadowBtn && (shadowBtn.lastChild.textContent = 'Shadowing'); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  async function playAll(shadow) {
    if (playing) { stopPlay(); return; }
    const me = playing = { stop: false };
    (shadow ? shadowBtn : playBtn).lastChild.textContent = 'Stopp';
    for (const l of lineEls) {
      if (me.stop) break;
      l.row.classList.add('is-playing');
      l.row.scrollIntoView({ block: 'center', behavior: anim.reduced ? 'auto' : 'smooth' });
      await app.tts.speak(l.ln.uk, { slow: shadow }).catch(() => {});
      if (shadow && !me.stop) {
        l.row.classList.add('is-yourturn');
        await wait(Math.min(6000, 900 + l.ln.uk.length * 75)); // Zeit zum Nachsprechen
        l.row.classList.remove('is-yourturn');
        if (!me.stop) await app.tts.speak(l.ln.uk).catch(() => {});
      }
      l.row.classList.remove('is-playing');
      if (!me.stop) await wait(shadow ? 500 : 250);
    }
    if (playing === me) stopPlay();
  }
  const playBtn = listenOff ? null : h('button', { type: 'button', class: 'btn btn-blue btn-sm', on: { click: () => playAll(false) } }, icon('play', { fill: true }), h('span', 'Alles anhören'));
  const shadowBtn = listenOff ? null : h('button', { type: 'button', class: 'btn btn-secondary btn-sm', title: 'Hören → nachsprechen → nochmal hören', on: { click: () => playAll(true) } }, icon('mic'), h('span', 'Shadowing'));
  const controls = h('div', { class: 'st-controls' },
    h('div', { class: 'st-controls-row' }, playBtn, shadowBtn),
    h('div', { class: 'st-controls-row' },
      review ? null : h('label', { class: 'st-toggle' }, h('span', 'Übersetzung'), toggle(showDe, setDe)),
      h('label', { class: 'st-toggle' }, h('span', 'Neue Formen'), toggle(notice, setNotice))));

  const hint = firstVisit && !review && guessBudget.n
    ? h('div', { class: 'st-hint' }, icon('bulb'), h('span', 'Gepunktet unterstrichene Wörter sind neu. Tippe darauf und ', h('strong', 'rate zuerst'), ' – das hilft beim Behalten, auch wenn du falsch liegst.'))
    : review ? h('div', { class: 'st-hint' }, icon('sparkles'), h('span', 'Jetzt ohne Übersetzung: Verstehst du die Geschichte? Neue Formen sind markiert.')) : null;

  // ---------- Abschluss ----------
  const actions = h('div', { class: 'st-actions' });
  if (start) {
    actions.append(h('button', { type: 'button', class: 'btn btn-primary btn-lg btn-block btn-caps', on: { click: () => { stopPlay(); markStorySeen(app, id, { proceed: true }); } } }, lesson.explanation ? 'Weiter zur Erklärung' : 'Weiter zu den Übungen'));
  } else {
    if (review) {
      actions.append(h('div', { class: 'st-selfcheck' }, h('div', { class: 't-headline' }, 'Wie viel hast du verstanden?'),
        h('div', { class: 'st-selfcheck-btns' }, ['Fast alles', 'Das meiste', 'Wenig'].map((t, i) =>
          h('button', { type: 'button', class: `btn ${i === 0 ? 'btn-primary' : 'btn-secondary'} btn-sm`, on: { click: () => { toast(i === 0 ? 'Großartig – genau so wächst Verstehen.' : i === 1 ? 'Gut! Beim nächsten Mal noch mehr.' : 'Kein Problem – tippe Wörter an und hör noch einmal zu.'); } } }, t)))));
    }
    actions.append(h('button', { type: 'button', class: 'btn btn-primary btn-lg btn-block btn-caps', on: { click: () => { stopPlay(); markStorySeen(app, id); startLesson(app, id); } } }, 'Lektion üben'));
  }

  if (!start && !review) markStorySeen(app, id);
  const el = page({
    title: story.title_de || 'Geschichte', largeTitle: false, back: start ? back : true, cls: 'st-page',
    children: [h('article', { class: 'st-article' }, hero, hint, controls, lines, fullDe, actions)],
  });
  return { el, destroy: () => { stopPlay(); hidePopover(); } };
}

function toggle(checked, onChange) {
  const input = h('input', { type: 'checkbox', role: 'switch' });
  input.checked = !!checked;
  input.addEventListener('change', () => onChange(input.checked));
  return h('span', { class: 'switch' }, input, h('span', { class: 'switch-track' }));
}
