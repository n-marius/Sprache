// Zusammenfassung nach einer Session (Daten: app.lastSummary). Abschlussanimation, Kennzahlen, neue Wörter.
import { h, icon, ukText, deText } from '../ui/dom.js';
import { listGroup } from '../ui/shell.js';
import { anim } from '../ui/anim.js';
import { speakerButton } from '../ui/audio-button.js';
import { startLesson } from '../engine/flow.js';
import { MASTERY_LABELS } from '../engine/progress.js';
import { ringSvg } from './today.js';

function fmtTime(ms) {
  const s = Math.max(0, Math.round((ms || 0) / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function tile(label, color, ink, valueEl) {
  return h('div', { class: 'v-tile', style: { '--c': color, '--c-ink': ink } },
    h('div', { class: 'v-tile-k' }, label), h('div', { class: 'v-tile-v num' }, valueEl));
}

export function render(params, app) {
  const s = app.lastSummary;
  if (!s) {
    setTimeout(() => app.navigate('#/today', { replace: true }), 0);
    return h('div');
  }
  const isLesson = s.kind === 'lesson' && s.lessonId;
  const lesson = isLesson ? app.content.getLesson(s.lessonId) : null;
  const head = app.t(isLesson ? 'lesson_done' : 'well_done');
  const theme = s.theme || lesson?.theme || 'greetings';

  const stage = h('div', { class: 'v-sum-stage', 'aria-hidden': 'true' });
  const accEl = h('span', '0 %');
  const newEl = h('span', '0');
  const tiles = h('div', { class: 'v-sum-tiles' },
    tile('Genauigkeit', 'var(--green)', 'var(--green-ink)', [icon('target'), accEl]),
    tile('Zeit', 'var(--blue)', 'var(--blue-ink)', [icon('clock'), h('span', fmtTime(s.durationMs))]),
    tile('Neue Wörter', 'var(--orange)', 'var(--orange-edge)', [icon('sparkles'), newEl]));

  const sub = s.total
    ? `${s.correct} von ${s.total} Aufgaben richtig${s.reviewedWords ? ` · ${s.reviewedWords} Wörter wiederholt` : ''}`
    : 'Session beendet';

  // Meisterschaft vorher → nachher
  const mb = s.masteryLevelBefore, ma = s.masteryLevelAfter;
  const mastery = h('div', { class: 'v-mastery', style: { '--before': `${Math.round((s.masteryBefore || 0) * 100)}%`, '--after': `${Math.round((s.masteryAfter || 0) * 100)}%` } },
    h('span', { class: 'v-mastery-before' }), h('span', { class: 'v-mastery-after' }));
  const levelText = mb && ma
    ? (ma.level > mb.level ? `${MASTERY_LABELS[mb.level]} → ${MASTERY_LABELS[ma.level]}` : `Stufe ${ma.level} · ${ma.label}`)
    : null;

  const goal = s.dayGoal || { done: 0, goal: 15, met: false };
  const streak = s.streak || { current: 0 };
  const flame = h('span', { class: ['v-flame-box', !streak.current && 'is-off'] }, icon('flame', { fill: !!streak.current }));

  const rows = [];
  if (isLesson) rows.push(h('div', { class: 'v-sum-row' },
    h('span', { class: 'v-cta-glyph emoji', style: { '--theme-c': anim.themeColor?.(theme) || 'var(--green)', width: '52px', height: '52px', fontSize: '28px', borderRadius: '16px' } }, anim.themeGlyph(theme)),
    h('div', { class: 'v-sum-row-main' },
      h('div', { class: 'v-sum-row-title' }, 'Meisterschaft', levelText ? h('span', { class: 't-2 t-foot' }, ` · ${levelText}`) : null),
      h('div', { class: 'v-sum-row-sub' }, `${Math.round((s.masteryBefore || 0) * 100)} % → ${Math.round((s.masteryAfter || 0) * 100)} %`),
      mastery)));
  rows.push(h('div', { class: 'v-sum-row' },
    ringSvg(goal.goal ? goal.done / goal.goal : 0, { size: 52, stroke: 7 }),
    h('div', { class: 'v-sum-row-main' },
      h('div', { class: 'v-sum-row-title' }, goal.met ? 'Tagesziel erreicht' : 'Tagesziel'),
      h('div', { class: 'v-sum-row-sub num' }, `${goal.done} / ${goal.goal} Aufgaben heute`))));
  rows.push(h('div', { class: 'v-sum-row' },
    flame,
    h('div', { class: 'v-sum-row-main' },
      h('div', { class: 'v-sum-row-title num' }, streak.current === 1 ? '1 Tag in Folge' : `${streak.current} Tage in Folge`),
      h('div', { class: 'v-sum-row-sub' }, streak.extended ? 'Serie verlängert – bis morgen!' : 'Heute schon gezählt'))));

  const words = (s.newWords || []).filter(Boolean);
  const wordList = words.length ? listGroup({
    header: words.length === 1 ? 'Neues Wort' : `${words.length} neue Wörter`,
    rows: words.map(v => ({
      title: ukText(v.uk, { tap: false, cls: 'row-title' }),
      subtitle: v.de,
      icon: v.emoji ? { emoji: v.emoji, color: 'var(--surface-2)' } : null,
      accessory: speakerButton(v.uk, { size: 's' }),
    })),
  }) : null;

  const again = () => { if (isLesson) startLesson(app, s.lessonId); else app.navigate('#/session/review'); };
  const storyBtn = lesson?.story
    ? h('a', { class: 'btn btn-secondary btn-block', href: `#/story/${encodeURIComponent(s.lessonId)}?review=1` }, icon('book'), 'Geschichte nochmal lesen (ohne Übersetzung)')
    : null;

  const el = h('div', { class: 'v-sum' },
    h('div', { class: 'v-sum-inner' },
      stage,
      h('div', { class: 'v-sum-head' },
        ukText(head.uk, { cls: 'v-sum-title', tag: 'h1' }),
        h('p', { class: 'v-sum-sub' }, `${head.de} ${sub}`)),
      tiles,
      h('section', { class: 'card v-sum-card' }, rows),
      wordList ? h('div', { class: 'v-sum-words' }, wordList) : null,
      storyBtn),
    h('div', { class: 'v-sum-actions' }, h('div', { class: 'v-sum-actions-inner' },
      h('button', { type: 'button', class: 'btn btn-primary btn-lg btn-block', on: { click: () => app.navigate('#/today') } }, 'Weiter'),
      h('button', { type: 'button', class: 'btn btn-secondary btn-lg btn-block', on: { click: again } }, icon('refresh'), 'Noch eine Session'))));

  let alive = true;
  return {
    el,
    onShow() {
      const acc = Math.round((s.accuracy ?? 0) * 100);
      anim.celebrate(stage, theme, { keepBadge: true });
      setTimeout(() => {
        if (!alive) return;
        anim.countUp(accEl, acc, { format: 'percent' });
        anim.countUp(newEl, words.length);
        mastery.classList.add('is-grown');
        if (streak.extended) anim.streak(flame, { ignite: true });
      }, 400);
    },
    destroy() { alive = false; },
  };
}
