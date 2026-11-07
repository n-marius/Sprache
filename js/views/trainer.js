// Vokabeln-Startseite „Слова́“ (#/trainer, Alias #/vocab; früher „Trainer“): Statistik, Richtung/Umfang/Modus, Start, Link zur Wortliste.
import { page, listGroup, segmented, sheet } from '../ui/shell.js';
import { h, icon, clear } from '../ui/dom.js';
import { uiLabel, holdLabel, uiT } from '../ui/ui-label.js';
import { trainerStats, scopeCount, getPrefs, setPrefs } from '../engine/trainer.js';
import { isListenOff } from '../audio-mode.js';
import { openAudioModeSheet } from '../ui/audio-mode-sheet.js';
import { uiF, countUk, pluralUk } from '../ui-text-g2.js';

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
      b?.classList.add('is-disabled'); b?.setAttribute('aria-disabled', 'true'); b?.setAttribute('title', uiF('listen_is_off').de);
    }

    const lessonTitle = id => { const l = st.lessons.find(x => x.id === id); return l ? { uk: l.title_uk || l.title_de, de: l.title_de } : { uk: id, de: id }; };
    const nl = st.lessons.length;
    const scopes = [
      { value: 'due', title: 'due', subtitle: uiF('scope_due_sub'), iconName: 'clock', color: 'var(--blue)', n: st.due },
      { value: 'all', title: 'all_words', subtitle: uiF('scope_all_sub', { n: st.total, w: pluralUk(st.total, 'word'), l: nl, L: pluralUk(nl, 'lesson', 'gen') }), iconName: 'book', color: 'var(--green)', n: st.total },
      { value: 'lesson', title: 'one_lesson', subtitle: prefs.scope.startsWith('lesson:') ? lessonTitle(prefs.scope.slice(7)) : 'choose_lesson', iconName: 'course', color: 'var(--yellow)', n: prefs.scope.startsWith('lesson:') ? scopeCount(app, prefs.scope) : null },
      { value: 'hard', title: 'hard_words', subtitle: uiF('scope_hard_sub'), iconName: 'target', color: 'var(--orange)', n: st.hard },
      { value: 'mined', title: 'my_sentences', subtitle: uiF(st.sentences ? 'scope_mined_sub' : 'scope_mined_none'), iconName: 'chat', color: 'var(--purple)', n: st.sentences },
    ];
    const isSel = v => (v === 'lesson' ? prefs.scope.startsWith('lesson:') : prefs.scope === v);
    const scopeRows = scopes.map(sc => ({
      title: holdLabel(sc.title, { cls: 'row-title' }), subtitle: holdLabel(sc.subtitle, { cls: 'row-subtitle', layout: 'inline' }), icon: { name: sc.iconName, color: sc.color },
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
      const cards = Math.min(20, n), mins = Math.max(1, Math.round(cards * 0.2));
      hint.replaceChildren(uiLabel(empty
        ? uiF(prefs.scope === 'mined' ? 'hint_mined_empty' : prefs.scope === 'hard' ? 'hint_hard_empty' : 'hint_nothing_due')
        : uiF('hint_round', { c: countUk(cards, 'card'), t: countUk(mins, 'minute'), n: cards, m: mins })));
    }
    updateStart();

    body.append(
      stats,
      h('section', { class: 'tr-section' }, h('div', { class: 'section-header' }, uiLabel('direction', { layout: 'inline' })), dirSeg),
      listGroup({ header: uiLabel('scope', { layout: 'inline' }), rows: scopeRows }),
      h('section', { class: 'tr-section' }, h('div', { class: 'section-header' }, uiLabel('mode', { layout: 'inline' })), modeSeg,
        listenOff ? h('button', { type: 'button', class: 'tr-muted-note', on: { click: () => openAudioModeSheet(app) } }, icon('speaker'), holdLabel(uiF('listen_is_off'))) : null),
      h('div', { class: 'tr-start-wrap' }, startBtn, hint),
      listGroup({ rows: [{ title: holdLabel('word_list', { cls: 'row-title' }), subtitle: holdLabel(uiF('word_list_sub'), { cls: 'row-subtitle', layout: 'inline' }), icon: { name: 'search', color: 'var(--blue)' }, href: '#/words', accessory: 'chevron' }] }),
    );
  }

  function pickLesson(lessons) {
    const rows = lessons.map(l => ({
      title: holdLabel({ uk: l.title_uk || l.title_de, de: l.title_de }, { cls: 'row-title' }), subtitle: holdLabel({ uk: countUk(l.count, 'word'), de: `${l.count} Wörter` }, { cls: 'row-subtitle', layout: 'inline' }), icon: { name: 'course', color: 'var(--yellow)' },
      accessory: prefs.scope === 'lesson:' + l.id ? icon('check', { cls: 'tr-check' }) : null,
      onClick: () => { prefs.scope = 'lesson:' + l.id; setPrefs(app, { scope: prefs.scope }); s.close(); build(); },
    }));
    const s = sheet({ title: uiT('choose_lesson'), content: rows.length ? listGroup({ rows }) : h('p', uiLabel(uiF('no_open_lessons'))) });
  }

  function start() {
    const q = new URLSearchParams({ dir: prefs.dir, scope: prefs.scope, mode: prefs.mode });
    app.navigate(`#/trainer/session?${q}`);
  }

  build();
  const onAudio = () => build();
  addEventListener('mova:audiomode', onAudio);
  off = app.store.subscribe?.(() => {});
  const el = page({ title: uiT('tab_vocab'), subtitle: h('div', { class: 'page-subtitle' }, uiLabel(uiF('tr_subtitle'))), children: [body], cls: 'tr-page' });
  return { el, destroy() { removeEventListener('mova:audiomode', onAudio); off?.(); }, onShow() { build(); } };
}
