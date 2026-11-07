// Vokabeln-Startseite „Слова́“ (#/trainer, Alias #/vocab; früher „Trainer“): Statistik, Richtung/Umfang/Modus, Start, Link zur Wortliste.
import { page, listGroup, segmented, sheet } from '../ui/shell.js';
import { h, icon, clear } from '../ui/dom.js';
import { uiLabel, holdLabel, uiT } from '../ui/ui-label.js';
import { trainerStats, scopeCount, getPrefs, setPrefs } from '../engine/trainer.js';
import { isListenOff } from '../audio-mode.js';
import { openAudioModeSheet } from '../ui/audio-mode-sheet.js';

const DIR_OPTS = [{ value: 'de-uk', label: 'DE → UK' }, { value: 'uk-de', label: 'UK → DE' }, { value: 'mixed', label: uiT('both') }];
const MODE_OPTS = [{ value: 'card', label: uiT('card') }, { value: 'choice', label: uiT('choice') }, { value: 'listen', label: uiT('listen') }];

function stat(value, label, color, iconName) {
  return h('div', { class: 'tr-stat', style: `--c:${color}` },
    h('span', { class: 'tr-stat-icon' }, icon(iconName)),
    h('span', { class: 'tr-stat-value' }, String(value)),
    h('span', { class: 'tr-stat-label' }, uiLabel(label, { cls: 'tr-stat-l' })));
}

export function render(params, app) {
  const prefs = getPrefs(app);
  const body = h('div', { class: 'tr-home' });
  let off = null;

  function build() {
    clear(body);
    const st = trainerStats(app);
    const listenOff = isListenOff(app);
    if (prefs.mode === 'listen' && listenOff) prefs.mode = 'choice';
    if (prefs.scope.startsWith('lesson:') && !st.lessons.some(l => 'lesson:' + l.id === prefs.scope)) prefs.scope = 'due';

    const stats = h('div', { class: 'tr-stats' },
      stat(st.due, 'due', 'var(--blue)', 'clock'),
      stat(st.learned, 'learned', 'var(--green)', 'check'),
      stat(st.hard, 'hard', 'var(--orange)', 'target'),
      stat(st.sentences, 'sentences', 'var(--purple)', 'chat'));

    const dirSeg = segmented({ options: DIR_OPTS, value: prefs.dir, onChange: v => { prefs.dir = v; setPrefs(app, { dir: v }); } });
    const modeSeg = segmented({
      options: MODE_OPTS, value: prefs.mode,
      onChange: v => {
        if (v === 'listen' && isListenOff(app)) { build(); openAudioModeSheet(app); return; }
        prefs.mode = v; setPrefs(app, { mode: v }); updateStart();
      },
    });
    if (listenOff) {
      const b = modeSeg.querySelectorAll('button')[2];
      b?.classList.add('is-disabled'); b?.setAttribute('aria-disabled', 'true'); b?.setAttribute('title', 'Hören ist gerade aus');
    }

    const lessonTitle = id => st.lessons.find(l => l.id === id)?.title_de || id;
    const scopes = [
      { value: 'due', title: 'due', subtitle: 'Wiederholungen und neue Wörter', iconName: 'clock', color: 'var(--blue)', n: st.due },
      { value: 'all', title: 'all_words', subtitle: `${st.total} Wörter aus ${st.lessons.length} ${st.lessons.length === 1 ? 'Lektion' : 'Lektionen'}`, iconName: 'book', color: 'var(--green)', n: st.total },
      { value: 'lesson', title: 'one_lesson', subtitle: prefs.scope.startsWith('lesson:') ? lessonTitle(prefs.scope.slice(7)) : 'Lektion wählen', iconName: 'course', color: 'var(--yellow)', n: prefs.scope.startsWith('lesson:') ? scopeCount(app, prefs.scope) : null },
      { value: 'hard', title: 'hard_words', subtitle: 'Oft vergessen oder markiert', iconName: 'target', color: 'var(--orange)', n: st.hard },
      { value: 'mined', title: 'my_sentences', subtitle: st.sentences ? 'Sätze aus Geschichten und Texten' : 'Noch keine Sätze gesammelt', iconName: 'chat', color: 'var(--purple)', n: st.sentences },
    ];
    const isSel = v => (v === 'lesson' ? prefs.scope.startsWith('lesson:') : prefs.scope === v);
    const scopeRows = scopes.map(sc => ({
      title: holdLabel(sc.title, { layout: 'inline', cls: 'row-title' }), subtitle: sc.subtitle, icon: { name: sc.iconName, color: sc.color },
      detail: sc.n != null ? String(sc.n) : null,
      cls: ['tr-scope', isSel(sc.value) && 'is-selected'].filter(Boolean).join(' '),
      accessory: isSel(sc.value) ? icon('check', { cls: 'tr-check' }) : (sc.value === 'lesson' ? 'chevron' : h('span', { class: 'tr-check-space' })),
      onClick: () => {
        if (sc.value === 'lesson') return pickLesson(st.lessons);
        prefs.scope = sc.value; setPrefs(app, { scope: sc.value }); build();
      },
    }));

    const startBtn = h('button', { type: 'button', class: 'btn btn-primary btn-lg btn-block btn-caps tr-start', on: { click: start } },
      icon('play', { fill: true }), holdLabel('start_training'));
    const hint = h('p', { class: 'tr-start-hint' });
    function updateStart() {
      const n = prefs.scope === 'due' ? st.due + Math.min(10, st.newAvailable) : scopeCount(app, prefs.scope);
      const empty = n === 0;
      startBtn.disabled = empty;
      hint.textContent = empty
        ? (prefs.scope === 'mined' ? 'Sammle Sätze in Geschichten und Lesetexten (Lesezeichen-Symbol).' : prefs.scope === 'hard' ? 'Keine schwierigen Wörter – sehr gut!' : 'Gerade nichts zu wiederholen. Schau später wieder vorbei.')
        : `Bis zu ${Math.min(20, n)} Karten · ca. ${Math.max(1, Math.round(Math.min(20, n) * 0.2))} Min.`;
    }
    updateStart();

    body.append(
      stats,
      h('section', { class: 'tr-section' }, h('div', { class: 'section-header' }, uiLabel('direction', { layout: 'inline' })), dirSeg),
      listGroup({ header: uiLabel('scope', { layout: 'inline' }), rows: scopeRows }),
      h('section', { class: 'tr-section' }, h('div', { class: 'section-header' }, uiLabel('mode', { layout: 'inline' })), modeSeg,
        listenOff ? h('button', { type: 'button', class: 'tr-muted-note', on: { click: () => openAudioModeSheet(app) } }, icon('speaker'), 'Hören ist gerade aus – antippen zum Ändern') : null),
      h('div', { class: 'tr-start-wrap' }, startBtn, hint),
      listGroup({ rows: [{ title: holdLabel('word_list', { layout: 'inline', cls: 'row-title' }), subtitle: 'Alle Wörter mit Stärke, Suche und Filter', icon: { name: 'search', color: 'var(--blue)' }, href: '#/words', accessory: 'chevron' }] }),
    );
  }

  function pickLesson(lessons) {
    const rows = lessons.map(l => ({
      title: l.title_de, subtitle: `${l.count} Wörter`, icon: { name: 'course', color: 'var(--yellow)' },
      accessory: prefs.scope === 'lesson:' + l.id ? icon('check', { cls: 'tr-check' }) : null,
      onClick: () => { prefs.scope = 'lesson:' + l.id; setPrefs(app, { scope: prefs.scope }); s.close(); build(); },
    }));
    const s = sheet({ title: uiT('choose_lesson'), content: rows.length ? listGroup({ rows }) : h('p', 'Noch keine Lektion freigeschaltet.') });
  }

  function start() {
    const q = new URLSearchParams({ dir: prefs.dir, scope: prefs.scope, mode: prefs.mode });
    app.navigate(`#/trainer/session?${q}`);
  }

  build();
  const onAudio = () => build();
  addEventListener('mova:audiomode', onAudio);
  off = app.store.subscribe?.(() => {});
  const el = page({ title: uiT('tab_vocab'), subtitle: 'Wörter und Sätze üben – unabhängig von den Lektionen', children: [body], cls: 'tr-page' });
  return { el, destroy() { removeEventListener('mova:audiomode', onAudio); off?.(); }, onShow() { build(); } };
}
