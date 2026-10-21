// „Heute“: Tagesziel-Ring + sanfter Streak, Weiterlernen/Wiederholen, Wochenleiste, Pacing zum Zieldatum, Kennzahlen.
import { page } from '../ui/shell.js';
import { h, icon, ukText, formatDateDE } from '../ui/dom.js';
import { anim } from '../ui/anim.js';
import { todayStats, nextLesson, lessonMastery, vocabStats, dayKey } from '../engine/progress.js';
import { addDays } from '../engine/util.js';
import { startLesson } from '../engine/flow.js';
import { audioMode } from '../audio-mode.js';
import { openAudioModeSheet } from '../ui/audio-mode-sheet.js';

const SVGNS = 'http://www.w3.org/2000/svg';

/** Style-Objekt (inkl. CSS-Variablen) → style-String (h() setzt Custom Properties per Object.assign nicht). */
export function sty(obj) {
  return Object.entries(obj).filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k.startsWith('--') ? k : k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`).join(';');
}

/** SVG-Ring (0..1). */
export function ringSvg(fraction, { size = 120, stroke = 12, cls = '' } = {}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('width', size); svg.setAttribute('height', size);
  svg.setAttribute('class', ['v-ring', cls].filter(Boolean).join(' '));
  svg.setAttribute('aria-hidden', 'true');
  const mk = (k, extra = {}) => {
    const ci = document.createElementNS(SVGNS, 'circle');
    ci.setAttribute('cx', size / 2); ci.setAttribute('cy', size / 2); ci.setAttribute('r', r);
    ci.setAttribute('stroke-width', stroke); ci.setAttribute('class', k);
    for (const [a, v] of Object.entries(extra)) ci.setAttribute(a, v);
    svg.append(ci); return ci;
  };
  mk('v-ring-track');
  const f = Math.max(0, Math.min(1, fraction || 0));
  const val = mk('v-ring-value', { 'stroke-dasharray': c, 'stroke-dashoffset': c });
  if (f <= 0) val.style.opacity = '0';
  requestAnimationFrame(() => requestAnimationFrame(() => val.setAttribute('stroke-dashoffset', c * (1 - f))));
  return svg;
}

function weekdayLong(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}

function accuracy7(state, today) {
  let t = 0, c = 0;
  for (let i = 0; i < 7; i++) { const d = state.days?.[addDays(today, -i)]; if (d) { t += d.tasks || 0; c += d.correct || 0; } }
  return t ? Math.round((c / t) * 100) : null;
}
function minutes7(state, today) {
  let ms = 0;
  for (let i = 0; i < 7; i++) ms += state.days?.[addDays(today, -i)]?.ms || 0;
  return Math.round(ms / 60000);
}

function streakBlock(st) {
  const flame = h('span', { class: ['v-flame', st.current > 0 ? 'is-lit' : ''] }, icon('flame', { fill: st.current > 0 }));
  const freezes = h('span', { class: 'v-freezes', title: 'Streak-Schutz' },
    [0, 1].map(i => h('span', { class: ['v-freeze', i < st.freezes && 'is-on'] }, icon('snow'))));
  let note;
  if (st.repairable) note = `Serie retten: heute ${st.repairGoal} Aufgaben`;
  else if (st.current === 0 && st.best > 0) note = 'Neuer Anlauf – schön, dass du da bist';
  else if (st.current === 0) note = 'Starte deine Serie';
  else if (st.atRisk) note = 'Heute lernen hält die Serie';
  else note = st.current === 1 ? 'Tag in Folge' : 'Tage in Folge';
  const el = h('div', { class: 'v-streak' },
    flame,
    h('div', { class: 'v-streak-main' },
      h('div', { class: 'v-streak-num num' }, String(st.current)),
      h('div', { class: 'v-streak-note' }, note)),
    freezes);
  if (st.current > 0) requestAnimationFrame(() => anim.streak?.(flame));
  return el;
}

function weekStrip(stats) {
  return h('div', { class: 'v-week' },
    h('div', { class: 'v-week-head' },
      h('span', { class: 'v-week-title' }, 'Wochenziel'),
      h('span', { class: 'v-week-count num' }, `${stats.weekGoal.daysMet} von ${stats.weekGoal.target} Tagen`)),
    h('div', { class: 'v-week-days' }, stats.week.map(d => {
      const part = !d.met && d.done > 0 ? Math.min(1, d.done / stats.goal) : 0;
      return h('div', { class: ['v-day', d.met && 'is-met', d.isToday && 'is-today', d.frozen && 'is-frozen', d.future && 'is-future'] },
        h('span', { class: 'v-day-dot', style: part ? sty({ '--part': `${Math.round(part * 100)}%` }) : null },
          d.met ? icon('check') : d.frozen ? icon('snow') : null),
        h('span', { class: 'v-day-label' }, d.label));
    })));
}

function heroCard(stats) {
  const frac = stats.goal ? Math.min(1, stats.done / stats.goal) : 0;
  const num = h('span', { class: 'v-goal-num num' }, '0');
  const ring = h('div', { class: 'v-goal-ring' }, ringSvg(frac, { size: 116, stroke: 13, cls: 'is-hero' }),
    h('div', { class: 'v-goal-center' }, num, h('span', { class: 'v-goal-of num' }, `/ ${stats.goal}`)));
  requestAnimationFrame(() => anim.countUp ? anim.countUp(num, stats.done) : (num.textContent = String(stats.done)));
  const left = stats.goal - stats.done;
  const msg = stats.met ? 'Tagesziel geschafft!' : stats.done === 0 ? 'Eine Session reicht für heute.' : `Noch ${left} ${left === 1 ? 'Aufgabe' : 'Aufgaben'} bis zum Ziel.`;
  return h('section', { class: 'card-hero v-today-hero' },
    h('div', { class: 'v-hero-top' },
      ring,
      h('div', { class: 'v-hero-text' },
        h('div', { class: 'v-hero-cap' }, 'Tagesziel'),
        h('div', { class: 'v-hero-msg' }, msg))),
    streakBlock(stats.streak),
    weekStrip(stats));
}

function ctaCard(app, stats) {
  const meta = nextLesson(app);
  const el = h('section', { class: 'card v-cta' });
  if (meta) {
    const m = lessonMastery(app, meta.id);
    const ls = app.store.state.lessons?.[meta.id];
    const fresh = !ls?.sessions;
    const color = anim.themeColor ? anim.themeColor(meta.theme) : 'var(--green)';
    const n = (meta.index ?? 0) + 1;
    el.append(
      h('a', { class: 'v-cta-lesson', href: `#/lesson/${encodeURIComponent(meta.id)}`, style: sty({ '--theme-c': color }) },
        h('span', { class: 'v-cta-glyph emoji' }, anim.themeGlyph(meta.theme)),
        h('span', { class: 'v-cta-info' },
          h('span', { class: 'v-cta-cap' }, `${fresh ? 'Als Nächstes' : 'Weiter mit'} · Lektion ${n}`),
          ukText(meta.title_uk, { tap: false, cls: 'v-cta-title' }),
          h('span', { class: 'v-cta-de' }, meta.title_de),
          h('span', { class: 'progress is-thin v-cta-bar' }, h('span', { class: 'progress-fill', style: sty({ '--p': `${Math.round(m.fraction * 100)}%` }) }))),
        icon('chevron-right', { cls: 'v-cta-chev' })),
      h('button', { type: 'button', class: 'btn btn-primary btn-lg btn-block v-cta-go', on: { click: () => startLesson(app, meta.id) } },
        icon('play', { fill: true }), stats.newAvailable > 0 ? (fresh ? 'Lektion starten' : 'Weiterlernen') : 'Weiter üben'),
      ...(stats.reviewDay ? [h('p', { class: 'v-cta-hint' }, 'Heute ist Wiederholungstag – erst das Fällige, dann Neues.')] : []));
  }
  const learned = vocabStats(app).introduced;
  const due = stats.dueCount;
  el.append(h('button', {
    type: 'button', class: ['btn btn-lg btn-block v-cta-review', due > 0 ? 'btn-blue' : 'btn-secondary'],
    disabled: learned === 0,
    on: { click: () => app.navigate('#/session/review') },
  }, icon('refresh'), due > 0 ? `Wiederholen · ${due} fällig` : 'Wiederholen'));
  if (learned > 0 && due === 0) el.append(h('p', { class: 'v-cta-hint' }, 'Nichts fällig – eine Runde festigt die schwächsten Wörter.'));
  return el;
}

function fmtDate(iso) { return iso ? formatDateDE(iso.length === 10 ? iso + 'T12:00:00' : iso) : '–'; }

function pacingCard(p) {
  if (!p) return null;
  const cls = p.status === 'ahead' ? 'green' : p.status === 'behind' ? 'yellow' : 'green';
  const statusText = p.status === 'on_track' ? 'im Plan' : p.label;
  const ph = p.currentPhase;
  return h('section', { class: 'card v-pace' },
    h('div', { class: 'v-pace-head' },
      h('span', { class: 'v-pace-icon' }, icon('target')),
      h('div', { class: 'v-pace-title' },
        h('div', { class: 't-headline' }, `Ziel A1 · ${fmtDate(p.targetDate)}`),
        h('div', { class: 't-foot t-2' }, `noch ${p.daysLeft} Tage`)),
      h('span', { class: ['badge', cls, 'v-pace-badge'] }, statusText)),
    h('div', { class: 'v-pace-bar' },
      h('div', { class: 'progress' }, h('div', { class: 'progress-fill', style: sty({ '--p': `${(p.fraction * 100).toFixed(1)}%` }) })),
      h('span', { class: 'v-pace-mark', style: { left: `${(p.expectedFraction * 100).toFixed(1)}%` }, title: 'Soll heute' })),
    h('div', { class: 'v-pace-legend t-foot t-2' },
      h('span', h('strong', { class: 'num' }, `${p.lessonsDone}`), ` von ${p.lessonsTotal} Lektionen`),
      h('span', `Soll heute: ${p.lessonsExpected}`)),
    h('div', { class: 'v-pace-facts' },
      ph ? h('div', { class: 'v-fact' }, h('span', { class: 'v-fact-k' }, 'Phase'),
        h('span', { class: 'v-fact-v' }, `${ph.id} · ${ph.title_de}`), h('span', { class: 'v-fact-s' }, `bis ${fmtDate(ph.end)}`)) : null,
      h('div', { class: 'v-fact' }, h('span', { class: 'v-fact-k' }, 'Tempo'),
        h('span', { class: 'v-fact-v num' }, `${String(p.recommendedPerWeek).replace('.', ',')} Lektionen/Woche`),
        h('span', { class: 'v-fact-s' }, 'empfohlen'))));
}

function statTile(label, value, sub, color, ic) {
  return h('div', { class: 'v-stat', style: sty({ '--c': color }) },
    h('span', { class: 'v-stat-icon' }, icon(ic)),
    h('span', { class: 'v-stat-val num' }, value),
    h('span', { class: 'v-stat-label' }, label),
    sub ? h('span', { class: 'v-stat-sub' }, sub) : null);
}

function audioRow(app) {
  const m = audioMode(app);
  const off = m.listen || m.speak;
  const txt = !off ? 'Ton an' : m.listen && m.speak ? 'Hören & Sprechen aus' : m.listen ? 'Hören aus' : 'Sprechen aus';
  return h('button', { type: 'button', class: ['v-chiprow', off && 'is-off'], on: { click: () => openAudioModeSheet(app) } },
    icon(off ? 'ear' : 'speaker'), h('span', txt));
}

export function render(params, app) {
  const today = dayKey();
  const stats = todayStats(app);
  const vs = vocabStats(app);
  const acc = accuracy7(app.store.state, today);
  try { app.router?.setBadges?.({ ...(app.router.badges || {}), today: stats.dueCount || 0 }); } catch {}

  const audioSlot = h('span', { class: 'v-audio-slot' }, audioRow(app));
  const onAudio = () => audioSlot.replaceChildren(audioRow(app));
  addEventListener('mova:audiomode', onAudio);

  const pill = h('a', { class: 'pill v-streak-pill', href: '#/today', 'aria-label': `Serie ${stats.streak.current} Tage` },
    h('span', { class: ['v-flame-mini', stats.streak.current > 0 && 'is-lit'] }, icon('flame', { fill: stats.streak.current > 0 })),
    h('span', { class: 'num' }, String(stats.streak.current)));

  const competence = vs.introduced
    ? `Du erkennst ${vs.recognized} ${vs.recognized === 1 ? 'Wort' : 'Wörter'} und hast ${vs.spoken} schon selbst gesagt.`
    : 'Deine ersten Wörter warten in Lektion 1.';

  const stats4 = h('section', { class: 'v-stats' },
    statTile('Wörter gelernt', String(vs.introduced), `${vs.strong} sicher`, 'var(--green)', 'words'),
    statTile('Genauigkeit', acc == null ? '–' : `${acc} %`, 'letzte 7 Tage', 'var(--blue)', 'target'),
    statTile('Fällig', String(stats.dueCount), stats.dueCount ? 'zum Wiederholen' : 'alles erledigt', 'var(--purple)', 'refresh'),
    statTile('Minuten', String(minutes7(app.store.state, today)), 'diese 7 Tage', 'var(--orange)', 'clock'));

  const tools = h('section', { class: 'card v-tools' },
    h('a', { class: 'v-tool', href: '#/trainer' },
      h('span', { class: 'v-tool-icon', style: { background: 'var(--purple)' } }, icon('words')),
      h('span', { class: 'v-tool-main' }, h('span', { class: 'v-tool-title' }, 'Vokabeltrainer'),
        h('span', { class: 'v-tool-sub' }, 'Karten, Hören, schwierige Wörter')),
      icon('chevron-right', { cls: 'chevron' })),
    h('div', { class: 'v-tool' },
      h('span', { class: 'v-tool-icon', style: { background: 'var(--blue)' } }, icon('ear')),
      h('span', { class: 'v-tool-main' }, h('span', { class: 'v-tool-title' }, 'Ton'),
        h('span', { class: 'v-tool-sub' }, 'Gerade nicht hören oder sprechen?')),
      audioSlot));

  const el = page({
    title: 'Heute',
    subtitle: weekdayLong(today),
    trailing: pill,
    cls: 'v-today',
    children: [
      h('div', { class: 'v-today-grid' },
        h('div', { class: 'v-col' }, heroCard(stats), ctaCard(app, stats)),
        h('div', { class: 'v-col' },
          pacingCard(stats.pacing),
          stats4,
          h('p', { class: 'v-competence' }, icon('sparkles'), h('span', competence)),
          tools)),
    ],
  });
  return { el, destroy() { removeEventListener('mova:audiomode', onAudio); } };
}
