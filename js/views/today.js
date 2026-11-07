// „Heute“: Tagesziel-Ring + sanfter Streak, Weiterlernen/Wiederholen, Wochenleiste, Pacing zum Zieldatum, Kennzahlen.
import { page } from '../ui/shell.js';
import { h, icon, ukText } from '../ui/dom.js';
import { anim } from '../ui/anim.js';
import { todayStats, nextLesson, lessonMastery, vocabStats, dayKey } from '../engine/progress.js';
import { addDays } from '../engine/util.js';
import { startLesson } from '../engine/flow.js';
import { audioMode } from '../audio-mode.js';
import { openAudioModeSheet } from '../ui/audio-mode-sheet.js';
import { uiLabel, holdLabel, uiT } from '../ui/ui-label.js';
import { uiN, dateUk, weekdayShortUk } from '../ui-text-g1.js';

const PACE_KEY = { ahead: 'ahead', behind: 'behind', on_track: 'on_track' };

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
  const t = dateUk(key);
  return { uk: t.uk.charAt(0).toUpperCase() + t.uk.slice(1), de: t.de };
}

function accuracy7(state, today) {
  let t = 0, c = 0;
  for (let i = 0; i < 7; i++) { const d = state.days?.[addDays(today, -i)]; if (d) { t += d.tasks || 0; c += d.correct || 0; } }
  return t ? Math.min(100, Math.round((c / t) * 100)) : null;
}
function minutes7(state, today) {
  let ms = 0;
  for (let i = 0; i < 7; i++) ms += state.days?.[addDays(today, -i)]?.ms || 0;
  return Math.round(ms / 60000);
}

function streakBlock(st) {
  const flame = h('span', { class: ['v-flame', st.current > 0 ? 'is-lit' : ''] }, icon('flame', { fill: st.current > 0 }));
  const freezes = h('span', { class: 'v-freezes', title: `${uiT('streak_shield').uk} · ${uiT('streak_shield').de}` },
    [0, 1].map(i => h('span', { class: ['v-freeze', i < st.freezes && 'is-on'] }, icon('snow'))));
  let note;
  if (st.repairable) note = uiN('streak_repair', { a: st.repairGoal });
  else if (st.current === 0 && st.best > 0) note = uiT('streak_restart');
  else if (st.current === 0) note = uiT('streak_begin');
  else if (st.atRisk) note = uiT('streak_risk');
  else note = uiN('streak_days', { a: st.current });
  const el = h('div', { class: 'v-streak' },
    flame,
    h('div', { class: 'v-streak-main' },
      h('div', { class: 'v-streak-num num' }, String(st.current)),
      h('div', { class: 'v-streak-note' }, uiLabel(note))),
    freezes);
  if (st.current > 0) requestAnimationFrame(() => anim.streak?.(flame));
  return el;
}

function weekStrip(stats) {
  return h('div', { class: 'v-week' },
    h('div', { class: 'v-week-head' },
      h('span', { class: 'v-week-title' }, uiLabel('week_goal', { layout: 'inline' })),
      h('span', { class: 'v-week-count num' }, uiLabel(uiN('week_count', { a: stats.weekGoal.daysMet, b: stats.weekGoal.target }), { layout: 'inline' }))),
    h('div', { class: 'v-week-days' }, stats.week.map((d, i) => {
      const part = !d.met && d.done > 0 ? Math.min(1, d.done / stats.goal) : 0;
      return h('div', { class: ['v-day', d.met && 'is-met', d.isToday && 'is-today', d.frozen && 'is-frozen', d.future && 'is-future'] },
        h('span', { class: 'v-day-dot', style: part ? sty({ '--part': `${Math.round(part * 100)}%` }) : null },
          d.met ? icon('check') : d.frozen ? icon('snow') : null),
        h('span', { class: 'v-day-label', title: d.label }, ukText(weekdayShortUk(d.day || i))));
    })));
}

function heroCard(stats) {
  const frac = stats.goal ? Math.min(1, stats.done / stats.goal) : 0;
  const num = h('span', { class: 'v-goal-num num' }, '0');
  const ring = h('div', { class: 'v-goal-ring' }, ringSvg(frac, { size: 116, stroke: 13, cls: 'is-hero' }),
    h('div', { class: 'v-goal-center' }, num, h('span', { class: 'v-goal-of num' }, `/ ${stats.goal}`)));
  requestAnimationFrame(() => anim.countUp ? anim.countUp(num, stats.done) : (num.textContent = String(stats.done)));
  const left = stats.goal - stats.done;
  const msg = stats.met ? uiT('goal_done') : stats.done === 0 ? uiT('one_session') : uiN('tasks_left', { a: left });
  return h('section', { class: 'card-hero v-today-hero' },
    h('div', { class: 'v-hero-top' },
      ring,
      h('div', { class: 'v-hero-text' },
        h('div', { class: 'v-hero-cap' }, uiLabel('daily_goal', { layout: 'inline' })),
        h('div', { class: 'v-hero-msg' }, uiLabel(msg)))),
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
          h('span', { class: 'v-cta-cap' }, holdLabel(uiN(fresh ? 'next_lesson_cap' : 'continue_lesson_cap', { a: n }), { layout: 'inline' })),
          ukText(meta.title_uk, { hold: true, cls: 'v-cta-title' }),
          h('span', { class: 'v-cta-de ui-de', lang: 'de' }, meta.title_de),
          h('span', { class: 'progress is-thin v-cta-bar' }, h('span', { class: 'progress-fill', style: sty({ '--p': `${Math.round(m.fraction * 100)}%` }) }))),
        icon('chevron-right', { cls: 'v-cta-chev' })),
      h('button', { type: 'button', class: 'btn btn-primary btn-lg btn-block v-cta-go', on: { click: () => startLesson(app, meta.id) } },
        icon('play', { fill: true }), holdLabel(stats.newAvailable > 0 ? (fresh ? 'start_lesson' : 'keep_learning') : 'keep_practicing')),
      ...(stats.reviewDay ? [h('p', { class: 'v-cta-hint' }, uiLabel('review_day'))] : []));
  }
  const learned = vocabStats(app).introduced;
  const due = stats.dueCount;
  el.append(h('button', {
    type: 'button', class: ['btn btn-lg btn-block v-cta-review', due > 0 ? 'btn-blue' : 'btn-secondary'],
    disabled: learned === 0,
    on: { click: () => app.navigate('#/session/review') },
  }, icon('refresh'), holdLabel(due > 0 ? uiN('review_n', { a: due }) : 'review')));
  if (learned > 0 && due === 0) el.append(h('p', { class: 'v-cta-hint' }, uiLabel('nothing_due')));
  return el;
}

/** Datum ohne Wochentag → {uk:'30 кві́тня 2027', de:'30. April 2027'} */
function fmtDate(iso, year = true) { return iso ? dateUk(iso, { weekday: false, year }) : { uk: '–', de: '–' }; }
/** Vorlage mit {date}: Datum in beide Sprachen einsetzen. */
function withDate(t, d) { return { uk: t.uk.replace('{date}', d.uk), de: t.de.replace('{date}', d.de) }; }

function pacingCard(p) {
  if (!p) return null;
  const cls = p.status === 'ahead' ? 'green' : p.status === 'behind' ? 'yellow' : 'green';
  const st = uiT(PACE_KEY[p.status] || 'on_track');
  const statusText = h('span', { title: p.status === 'on_track' ? st.de : p.label }, ukText(st.uk));
  const ph = p.currentPhase;
  return h('section', { class: 'card v-pace' },
    h('div', { class: 'v-pace-head' },
      h('span', { class: 'v-pace-icon' }, icon('target')),
      h('div', { class: 'v-pace-title' },
        h('div', { class: 't-headline' }, uiLabel('goal_a1', { layout: 'inline' })),
        h('div', { class: 't-foot t-2' }, uiLabel(withDate(uiN('until_days_left', { a: p.daysLeft }), fmtDate(p.targetDate))))),
      h('span', { class: ['badge', cls, 'v-pace-badge'] }, statusText)),
    h('div', { class: 'v-pace-bar' },
      h('div', { class: 'progress' }, h('div', { class: 'progress-fill', style: sty({ '--p': `${(p.fraction * 100).toFixed(1)}%` }) })),
      h('span', { class: 'v-pace-mark', style: { left: `${(p.expectedFraction * 100).toFixed(1)}%` }, title: `${uiT('plan_today').uk} · ${uiT('plan_today').de}` })),
    h('div', { class: 'v-pace-legend t-foot t-2' },
      h('span', h('strong', { class: 'num' }, `${p.lessonsDone}`), ' ', uiLabel(uiN('lessons_of', { b: p.lessonsTotal }), { layout: 'inline' })),
      h('span', uiLabel(uiN('plan_today_n', { a: p.lessonsExpected }), { layout: 'inline' }))),
    h('div', { class: 'v-pace-facts' },
      ph ? h('div', { class: 'v-fact' }, h('span', { class: 'v-fact-k' }, uiLabel('phase', { layout: 'inline' })),
        h('span', { class: 'v-fact-v' }, `${ph.id} · `, uiLabel({ uk: ph.title_uk || ph.title_de, de: ph.title_uk ? ph.title_de : '' }, { layout: 'inline' })),
        h('span', { class: 'v-fact-s' }, uiLabel(withDate(uiT('until_date'), fmtDate(ph.end, false))))) : null,
      h('div', { class: 'v-fact' }, h('span', { class: 'v-fact-k' }, uiLabel('tempo', { layout: 'inline' })),
        h('span', { class: 'v-fact-v num' }, uiLabel(uiN('per_week', { a: p.recommendedPerWeek }))),
        h('span', { class: 'v-fact-s' }, uiLabel('recommended', { layout: 'inline' })))));
}

function statTile(label, value, sub, color, ic) {
  return h('div', { class: 'v-stat', style: sty({ '--c': color }) },
    h('span', { class: 'v-stat-icon' }, icon(ic)),
    h('span', { class: 'v-stat-val num' }, value),
    h('span', { class: 'v-stat-label' }, uiLabel(label)),
    sub ? h('span', { class: 'v-stat-sub' }, uiLabel(sub)) : null);
}

function audioRow(app) {
  const m = audioMode(app);
  const off = m.listen || m.speak;
  const txt = !off ? uiT('sound_on') : { uk: uiT('sound_off').uk, de: m.listen && m.speak ? 'Hören & Sprechen aus' : m.listen ? 'Hören aus' : 'Sprechen aus' };
  return h('button', { type: 'button', class: ['v-chiprow', off && 'is-off'], title: txt.de, on: { click: () => openAudioModeSheet(app) } },
    icon(off ? 'ear' : 'speaker'), ukText(txt.uk, { hold: true }));
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

  const pill = h('a', { class: 'pill v-streak-pill', href: '#/today', 'aria-label': uiN('streak_aria', { a: stats.streak.current }).uk },
    h('span', { class: ['v-flame-mini', stats.streak.current > 0 && 'is-lit'] }, icon('flame', { fill: stats.streak.current > 0 })),
    h('span', { class: 'num' }, String(stats.streak.current)));

  const competence = vs.introduced
    ? uiN('competence', { a: vs.recognized, b: vs.spoken })
    : uiT('first_words');

  const stats4 = h('section', { class: 'v-stats' },
    statTile('learned_words', String(vs.introduced), uiN('strong_n', { a: vs.strong }), 'var(--green)', 'words'),
    statTile('accuracy', acc == null ? '–' : `${acc} %`, 'last_7_days', 'var(--blue)', 'target'),
    statTile('due', String(stats.dueCount), stats.dueCount ? 'to_review' : 'all_done', 'var(--purple)', 'refresh'),
    statTile('minutes', String(minutes7(app.store.state, today)), 'in_7_days', 'var(--orange)', 'clock'));

  const tools = h('section', { class: 'card v-tools' },
    h('a', { class: 'v-tool', href: '#/trainer' },
      h('span', { class: 'v-tool-icon', style: { background: 'var(--purple)' } }, icon('words')),
      h('span', { class: 'v-tool-main' }, h('span', { class: 'v-tool-title' }, holdLabel('tab_vocab', { layout: 'inline' })),
        h('span', { class: 'v-tool-sub' }, uiLabel('tool_vocab_sub'))),
      icon('chevron-right', { cls: 'chevron' })),
    h('a', { class: 'v-tool', href: '#/games' },
      h('span', { class: 'v-tool-icon', style: { background: 'var(--orange)' } }, icon('sparkles')),
      h('span', { class: 'v-tool-main' }, h('span', { class: 'v-tool-title' }, holdLabel('games', { layout: 'inline' })),
        h('span', { class: 'v-tool-sub' }, uiLabel('tool_games_sub'))),
      icon('chevron-right', { cls: 'chevron' })),
    h('div', { class: 'v-tool' },
      h('span', { class: 'v-tool-icon', style: { background: 'var(--blue)' } }, icon('ear')),
      h('span', { class: 'v-tool-main' }, h('span', { class: 'v-tool-title' }, uiLabel('sound', { layout: 'inline' })),
        h('span', { class: 'v-tool-sub' }, uiLabel('tool_sound_sub'))),
      audioSlot));

  const el = page({
    title: uiT('tab_today'),
    subtitle: h('div', { class: 'page-subtitle' }, uiLabel(weekdayLong(today), { layout: 'inline' })),
    trailing: pill,
    cls: 'v-today',
    children: [
      h('div', { class: 'v-today-grid' },
        h('div', { class: 'v-col' }, heroCard(stats), ctaCard(app, stats)),
        h('div', { class: 'v-col' },
          pacingCard(stats.pacing),
          stats4,
          h('p', { class: 'v-competence' }, icon('sparkles'), uiLabel(competence)),
          tools)),
    ],
  });
  return { el, destroy() { removeEventListener('mova:audiomode', onAudio); } };
}
