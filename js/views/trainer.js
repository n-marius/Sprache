// Trainer-Startseite (#/trainer): Statistik, Richtung/Umfang/Modus, Start, Link zur Wortliste.
import { page, listGroup, segmented, sheet } from '../ui/shell.js';
import { h, icon, clear } from '../ui/dom.js';
import { trainerStats, scopeCount, getPrefs, setPrefs } from '../engine/trainer.js';
import { isListenOff } from '../audio-mode.js';
import { openAudioModeSheet } from '../ui/audio-mode-sheet.js';

const DIR_OPTS = [{ value: 'de-uk', label: 'DE → UK' }, { value: 'uk-de', label: 'UK → DE' }, { value: 'mixed', label: 'Gemischt' }];
const MODE_OPTS = [{ value: 'card', label: 'Karte' }, { value: 'choice', label: 'Auswahl' }, { value: 'listen', label: 'Hören' }];

function stat(value, label, color, iconName) {
  return h('div', { class: 'tr-stat', style: `--c:${color}` },
    h('span', { class: 'tr-stat-icon' }, icon(iconName)),
    h('span', { class: 'tr-stat-value' }, String(value)),
    h('span', { class: 'tr-stat-label' }, label));
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
      stat(st.due, 'heute fällig', 'var(--blue)', 'clock'),
      stat(st.learned, 'gelernt', 'var(--green)', 'check'),
      stat(st.hard, 'schwierig', 'var(--orange)', 'target'),
      stat(st.sentences, 'Sätze', 'var(--purple)', 'chat'));

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
      { value: 'due', title: 'Fällig', subtitle: 'Wiederholungen und neue Wörter', iconName: 'clock', color: 'var(--blue)', n: st.due },
      { value: 'all', title: 'Alle freigeschalteten', subtitle: `${st.total} Wörter aus ${st.lessons.length} ${st.lessons.length === 1 ? 'Lektion' : 'Lektionen'}`, iconName: 'book', color: 'var(--green)', n: st.total },
      { value: 'lesson', title: 'Eine Lektion', subtitle: prefs.scope.startsWith('lesson:') ? lessonTitle(prefs.scope.slice(7)) : 'Lektion wählen', iconName: 'course', color: 'var(--yellow)', n: prefs.scope.startsWith('lesson:') ? scopeCount(app, prefs.scope) : null },
      { value: 'hard', title: 'Schwierige Wörter', subtitle: 'Oft vergessen oder markiert', iconName: 'target', color: 'var(--orange)', n: st.hard },
      { value: 'mined', title: 'Gesammelte Sätze', subtitle: st.sentences ? 'Sätze aus Geschichten und Texten' : 'Noch keine Sätze gesammelt', iconName: 'chat', color: 'var(--purple)', n: st.sentences },
    ];
    const isSel = v => (v === 'lesson' ? prefs.scope.startsWith('lesson:') : prefs.scope === v);
    const scopeRows = scopes.map(sc => ({
      title: sc.title, subtitle: sc.subtitle, icon: { name: sc.iconName, color: sc.color },
      detail: sc.n != null ? String(sc.n) : null,
      cls: ['tr-scope', isSel(sc.value) && 'is-selected'].filter(Boolean).join(' '),
      accessory: isSel(sc.value) ? icon('check', { cls: 'tr-check' }) : (sc.value === 'lesson' ? 'chevron' : h('span', { class: 'tr-check-space' })),
      onClick: () => {
        if (sc.value === 'lesson') return pickLesson(st.lessons);
        prefs.scope = sc.value; setPrefs(app, { scope: sc.value }); build();
      },
    }));

    const startBtn = h('button', { type: 'button', class: 'btn btn-primary btn-lg btn-block btn-caps tr-start', on: { click: start } },
      icon('play', { fill: true }), h('span', 'Training starten'));
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
      h('section', { class: 'tr-section' }, h('div', { class: 'section-header' }, 'Richtung'), dirSeg),
      listGroup({ header: 'Umfang', rows: scopeRows }),
      h('section', { class: 'tr-section' }, h('div', { class: 'section-header' }, 'Modus'), modeSeg,
        listenOff ? h('button', { type: 'button', class: 'tr-muted-note', on: { click: () => openAudioModeSheet(app) } }, icon('speaker'), 'Hören ist gerade aus – antippen zum Ändern') : null),
      h('div', { class: 'tr-start-wrap' }, startBtn, hint),
      listGroup({ rows: [{ title: 'Wortliste', subtitle: 'Alle Wörter mit Stärke, Suche und Filter', icon: { name: 'search', color: 'var(--blue)' }, href: '#/words', accessory: 'chevron' }] }),
    );
  }

  function pickLesson(lessons) {
    const rows = lessons.map(l => ({
      title: l.title_de, subtitle: `${l.count} Wörter`, icon: { name: 'course', color: 'var(--yellow)' },
      accessory: prefs.scope === 'lesson:' + l.id ? icon('check', { cls: 'tr-check' }) : null,
      onClick: () => { prefs.scope = 'lesson:' + l.id; setPrefs(app, { scope: prefs.scope }); s.close(); build(); },
    }));
    const s = sheet({ title: 'Lektion wählen', content: rows.length ? listGroup({ rows }) : h('p', 'Noch keine Lektion freigeschaltet.') });
  }

  function start() {
    const q = new URLSearchParams({ dir: prefs.dir, scope: prefs.scope, mode: prefs.mode });
    app.navigate(`#/trainer/session?${q}`);
  }

  build();
  const onAudio = () => build();
  addEventListener('mova:audiomode', onAudio);
  off = app.store.subscribe?.(() => {});
  const el = page({ title: 'Trainer', subtitle: 'Vokabeln unabhängig von den Lektionen', children: [body], cls: 'tr-page' });
  return { el, destroy() { removeEventListener('mova:audiomode', onAudio); off?.(); }, onShow() { build(); } };
}
