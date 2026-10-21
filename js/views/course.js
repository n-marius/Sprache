// „Kurs“: Lernpfad nach Phasen (A1.1–A1.3), Knoten in geschwungener Linie, Meisterschaftsring, geplante Lektionen sichtbar.
import { page } from '../ui/shell.js';
import { h, icon, ukText, formatDateDE } from '../ui/dom.js';
import { anim } from '../ui/anim.js';
import { sty } from './today.js';
import { lessonMastery, isUnlocked, nextLesson, dueCount, pacing } from '../engine/progress.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const ROW = 150;          // Zeilenhöhe je Knoten (px)
const AMP = 70;           // seitliche Auslenkung (px)
const PATH_W = 320;       // Breite der Pfadspalte
const NODE = 76;          // Durchmesser Knoten
const WAVE = [0, 0.7, 1, 0.7, 0, -0.7, -1, -0.7];
const PHASE_COLORS = ['var(--green)', 'var(--blue)', 'var(--purple)', 'var(--orange)'];

const svgEl = (tag, attrs) => { const e = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };

/** Status je Lektion: planned | locked | done | current | open */
export function lessonStatus(app, meta, currentId) {
  if (!app.content.getLesson(meta.id)) return 'planned';
  if (meta.id === currentId) return 'current';
  const st = app.store.state.lessons?.[meta.id];
  if (st?.completedAt) return 'done';
  return isUnlocked(app, meta.id) ? 'open' : 'locked';
}

function fmtRange(p) {
  const f = d => d ? formatDateDE(d + 'T12:00:00').slice(0, 6) : '';
  return p.start && p.end ? `${f(p.start)} – ${formatDateDE(p.end + 'T12:00:00')}` : '';
}

function nodeRing(fraction, color) {
  const size = NODE + 18, sw = 6, r = (size - sw) / 2, c = 2 * Math.PI * r;
  const svg = svgEl('svg', { viewBox: `0 0 ${size} ${size}`, width: size, height: size, class: 'v-node-ring', 'aria-hidden': 'true' });
  svg.append(svgEl('circle', { cx: size / 2, cy: size / 2, r, 'stroke-width': sw, class: 'v-node-ring-track' }));
  if (fraction > 0) svg.append(svgEl('circle', { cx: size / 2, cy: size / 2, r, 'stroke-width': sw, class: 'v-node-ring-val',
    'stroke-dasharray': c, 'stroke-dashoffset': c * (1 - Math.min(1, fraction)), style: `stroke:${color}` }));
  return svg;
}

function pathSvg(n, doneUpTo) {
  const H = n * ROW;
  const pts = Array.from({ length: n }, (_, i) => [PATH_W / 2 + WAVE[i % WAVE.length] * AMP, i * ROW + NODE / 2 + 9]);
  const d = (upto) => {
    let s = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i <= upto; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const my = (y0 + y1) / 2;
      s += ` C ${x0} ${my}, ${x1} ${my}, ${x1} ${y1}`;
    }
    return s;
  };
  const svg = svgEl('svg', { class: 'v-path-line', width: PATH_W, height: H, viewBox: `0 0 ${PATH_W} ${H}`, 'aria-hidden': 'true' });
  if (n > 1) svg.append(svgEl('path', { d: d(n - 1), class: 'v-path-track' }));
  if (doneUpTo > 0) svg.append(svgEl('path', { d: d(Math.min(doneUpTo, n - 1)), class: 'v-path-done' }));
  return svg;
}

function lessonNode(app, meta, i, status, phaseColor) {
  const lesson = app.content.getLesson(meta.id);
  const m = lesson ? lessonMastery(app, meta.id) : { fraction: 0, level: 0 };
  const color = anim.themeColor ? anim.themeColor(meta.theme) : phaseColor;
  const x = WAVE[i % WAVE.length] * AMP;
  const st = app.store.state.lessons?.[meta.id];
  const bubble = status === 'current'
    ? h('span', { class: 'v-node-bubble' }, st?.sessions ? 'Weiter' : 'Start') : null;
  const prep = meta.status === 'error' || meta.status === 'ready';
  const badge = status === 'planned' ? h('span', { class: 'badge v-node-badge' }, prep ? 'in Vorbereitung' : 'geplant')
    : status === 'locked' ? h('span', { class: 'v-node-lock' }, icon('lock'))
      : m.level >= 4 ? h('span', { class: 'v-node-crown' }, icon('star', { fill: true })) : null;
  return h('a', {
    class: ['v-node', `is-${status}`], href: `#/lesson/${encodeURIComponent(meta.id)}`,
    style: sty({ '--x': `${x}px`, '--theme-c': color, top: `${i * ROW}px` }),
    'aria-label': `Lektion ${meta.index + 1}: ${meta.title_de}${status === 'planned' ? (prep ? ' (in Vorbereitung)' : ' (geplant)') : ''}`,
    dataset: { id: meta.id },
  },
    bubble,
    h('span', { class: 'v-node-hit' },
      nodeRing(status === 'planned' ? 0 : m.fraction, color),
      h('span', { class: 'v-node-disc' }, h('span', { class: 'v-node-glyph emoji' }, anim.themeGlyph(meta.theme))),
      badge),
    h('span', { class: 'v-node-label' },
      ukText(meta.title_uk, { tap: false, cls: 'v-node-uk' }),
      h('span', { class: 'v-node-de' }, `${meta.index + 1} · ${meta.title_de}`)));
}

function phaseInfo(app, p, idx, color) {
  const ready = p.lessons.filter(l => app.content.getLesson(l.id));
  const done = p.lessons.filter(l => app.store.state.lessons?.[l.id]?.completedAt).length;
  const frac = p.lessons.length ? done / p.lessons.length : 0;
  const mast = ready.length ? ready.reduce((s, l) => s + lessonMastery(app, l.id).fraction, 0) / p.lessons.length : 0;
  return h('div', { class: 'v-phase-info', style: sty({ '--phase-c': color }) },
    h('div', { class: 'v-phase-top' },
      h('span', { class: 'v-phase-id' }, p.id),
      h('span', { class: 'v-phase-dates' }, icon('calendar'), fmtRange(p))),
    ukText(p.title_uk, { cls: 'v-phase-uk', tag: 'h2' }),
    h('div', { class: 'v-phase-de' }, p.title_de),
    p.summary_de ? h('p', { class: 'v-phase-sum' }, p.summary_de) : null,
    h('div', { class: 'v-phase-progress' },
      h('div', { class: 'progress is-thin' }, h('div', { class: 'progress-fill', style: sty({ '--p': `${Math.round(frac * 100)}%`, background: '#fff' }) })),
      h('div', { class: 'v-phase-stats' },
        h('span', h('strong', { class: 'num' }, String(done)), ` / ${p.lessons.length} Lektionen`),
        ready.length < p.lessons.length ? h('span', p.lessons.some(l => !app.content.getLesson(l.id) && (l.status === 'error' || l.status === 'ready')) ? `${p.lessons.length - ready.length} in Vorbereitung` : `${p.lessons.length - ready.length} geplant`) : h('span', `${Math.round(mast * 100)} % Meisterschaft`))));
}

export function render(params, app) {
  const cur = nextLesson(app);
  const currentId = cur?.id;
  try { app.router?.setBadges?.({ ...(app.router.badges || {}), today: dueCount(app) || 0 }); } catch {}
  const pace = pacing(app);
  const sections = app.content.phases.map((p, idx) => {
    const color = PHASE_COLORS[idx % PHASE_COLORS.length];
    const statuses = p.lessons.map(l => lessonStatus(app, l, currentId));
    const lastDone = statuses.reduce((a, s, i) => (s === 'done' || s === 'current' ? i : a), -1);
    const path = h('div', { class: 'v-path', style: { height: `${p.lessons.length * ROW}px`, width: `${PATH_W}px` } },
      pathSvg(p.lessons.length, lastDone),
      p.lessons.map((l, i) => lessonNode(app, l, i, statuses[i], color)));
    return h('section', { class: 'v-phase', style: sty({ '--phase-c': color }), dataset: { phase: p.id } },
      h('aside', { class: 'v-phase-aside' }, phaseInfo(app, p, idx, color)),
      h('div', { class: 'v-path-wrap' }, path));
  });
  const el = page({
    title: 'Kurs',
    subtitle: `A1 bis ${pace.targetDate ? formatDateDE(pace.targetDate + 'T12:00:00') : '–'} · ${pace.lessonsDone} von ${pace.lessonsTotal} Lektionen · ${pace.status === 'on_track' ? 'im Plan' : pace.label}`,
    cls: 'v-course',
    children: sections,
  });
  return {
    el,
    onShow() {
      const node = el.querySelector('.v-node.is-current');
      if (!node) return;
      const r = node.getBoundingClientRect();
      if (r.top > innerHeight * 0.75) window.scrollTo({ top: scrollY + r.top - innerHeight * 0.4, behavior: 'instant' });
    },
  };
}
