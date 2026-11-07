// Zusammenfassung nach einer Session (Daten: app.lastSummary). Abschlussanimation, Kennzahlen, neue Wörter.
import { h, icon, ukText, deText } from '../ui/dom.js';
import { listGroup } from '../ui/shell.js';
import { anim } from '../ui/anim.js';
import { speakerButton } from '../ui/audio-button.js';
import { startLesson, startTest } from '../engine/flow.js';
import { MASTERY_LABELS } from '../engine/progress.js';
import { ringSvg, sty } from './today.js';
import { uiLabel, holdLabel, uiT } from '../ui/ui-label.js';
import { uiN } from '../ui-text-g1.js';

function fmtTime(ms) {
  const s = Math.max(0, Math.round((ms || 0) / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function tile(label, color, ink, valueEl) {
  return h('div', { class: 'v-tile', style: sty({ '--c': color, '--c-ink': ink }) },
    h('div', { class: 'v-tile-k' }, uiLabel(label, { cls: 'v-tile-l' })), h('div', { class: 'v-tile-v num' }, valueEl));
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
    tile('accuracy', 'var(--green)', 'var(--green-ink)', [icon('target'), accEl]),
    tile('time', 'var(--blue)', 'var(--blue-ink)', [icon('clock'), h('span', fmtTime(s.durationMs))]),
    tile('new_words', 'var(--orange)', 'var(--orange-edge)', [icon('sparkles'), newEl]));

  const join = (a, b) => (b ? { uk: `${a.uk} · ${b.uk}`, de: `${a.de} · ${b.de}` } : a);
  const sub = s.total
    ? join(uiN('correct_of', { a: s.correct, b: s.total }), s.reviewedWords ? uiN('words_reviewed', { a: s.reviewedWords }) : null)
    : uiT('session_over');

  // Meisterschaft vorher → nachher
  const mb = s.masteryLevelBefore, ma = s.masteryLevelAfter;
  const mastery = h('div', { class: 'v-mastery', style: sty({ '--before': `${Math.round((s.masteryBefore || 0) * 100)}%`, '--after': `${Math.round((s.masteryAfter || 0) * 100)}%` }) },
    h('span', { class: 'v-mastery-before' }), h('span', { class: 'v-mastery-after' }));
  const lvl = n => uiN('level_n', { a: n });
  const levelText = mb && ma
    ? (ma.level > mb.level
      ? { uk: `${lvl(mb.level).uk} → ${ma.level}`, de: `${MASTERY_LABELS[mb.level]} → ${MASTERY_LABELS[ma.level]}` }
      : { uk: lvl(ma.level).uk, de: `${lvl(ma.level).de} · ${ma.label}` })
    : null;

  const goal = s.dayGoal || { done: 0, goal: 15, met: false };
  const streak = s.streak || { current: 0 };
  const flame = h('span', { class: ['v-flame-box', !streak.current && 'is-off'] }, icon('flame', { fill: !!streak.current }));

  const rows = [];
  if (isLesson) rows.push(h('div', { class: 'v-sum-row' },
    h('span', { class: 'v-cta-glyph emoji', style: sty({ '--theme-c': anim.themeColor?.(theme) || 'var(--green)', width: '52px', height: '52px', fontSize: '28px', borderRadius: '16px' }) }, anim.themeGlyph(theme)),
    h('div', { class: 'v-sum-row-main' },
      h('div', { class: 'v-sum-row-title' }, uiLabel('mastery', { layout: 'inline' }), levelText ? h('span', { class: 't-2 t-foot' }, ' · ', uiLabel(levelText, { layout: 'inline' })) : null),
      h('div', { class: 'v-sum-row-sub' }, `${Math.round((s.masteryBefore || 0) * 100)} % → ${Math.round((s.masteryAfter || 0) * 100)} %`),
      mastery)));
  rows.push(h('div', { class: 'v-sum-row' },
    ringSvg(goal.goal ? goal.done / goal.goal : 0, { size: 52, stroke: 7 }),
    h('div', { class: 'v-sum-row-main' },
      h('div', { class: 'v-sum-row-title' }, uiLabel(goal.met ? 'goal_met' : 'daily_goal', { layout: 'inline' })),
      h('div', { class: 'v-sum-row-sub num' }, uiLabel(uiN('tasks_today', { a: goal.done, b: goal.goal }), { layout: 'inline' })))));
  rows.push(h('div', { class: 'v-sum-row' },
    flame,
    h('div', { class: 'v-sum-row-main' },
      h('div', { class: 'v-sum-row-title num' }, uiLabel(uiN('streak_days_n', { a: streak.current || 0 }), { layout: 'inline' })),
      h('div', { class: 'v-sum-row-sub' }, uiLabel(streak.extended ? 'streak_extended' : 'streak_counted', { layout: 'inline' })))));

  const words = (s.newWords || []).filter(Boolean);
  const wordList = words.length ? listGroup({
    header: words.length === 1 ? uiLabel(app.t('new_word'), { layout: 'inline' }) : uiLabel({ uk: `${uiT('new_words').uk} · ${words.length}`, de: `${words.length} neue Wörter` }, { layout: 'inline' }),
    rows: words.map(v => ({
      title: ukText(v.uk, { cls: 'row-title' }),
      subtitle: deText(v.de || '', { cls: 'row-subtitle' }),
      icon: v.emoji ? { emoji: v.emoji, color: 'var(--surface-2)' } : null,
      accessory: speakerButton(v.uk, { size: 's' }),
    })),
  }) : null;

  const again = () => {
    if (s.kind === 'test') startTest(app, s.lessonId);
    else if (isLesson || s.kind === 'teach') startLesson(app, s.lessonId);
    else app.navigate('#/session/review');
  };
  // Prüfung: bestanden/nicht bestanden, Ergebnis, schwache Wörter
  const pct = x => `${Math.round((x || 0) * 100)} %`;
  const testCard = s.kind === 'test' ? h('section', { class: ['card', 'v-sum-test', s.passed ? 'is-pass' : 'is-fail'] },
    h('div', { class: 'v-sum-test-head' }, icon(s.passed ? 'check' : 'bulb'), uiLabel(s.passed ? 'test_passed' : 'test_failed', { layout: 'inline' })),
    h('div', { class: 'v-sum-test-score num' }, `${pct(s.accuracy)}`, h('span', { class: 't-foot' }, ` / ${pct(s.passMark)}`)),
    s.weakWords?.length ? h('div', { class: 'v-sum-test-weak' }, uiLabel('weak_words', { layout: 'inline' }),
      h('ul', s.weakWords.map(v => h('li', ukText(v.uk), ' – ', deText(v.de))))) : null) : null;
  const storyBtn = lesson?.story
    ? h('a', { class: 'btn btn-secondary btn-block', href: `#/story/${encodeURIComponent(s.lessonId)}?review=1` }, icon('book'), holdLabel('read_again'))
    : null;

  const el = h('div', { class: 'v-sum' },
    h('div', { class: 'v-sum-inner' },
      stage,
      h('div', { class: 'v-sum-head' },
        ukText(head.uk, { cls: 'v-sum-title', tag: 'h1' }),
        head.de ? h('p', { class: 'v-sum-sub ui-de', lang: 'de' }, head.de) : null,
        h('p', { class: 'v-sum-sub' }, uiLabel(sub))),
      testCard,
      tiles,
      h('section', { class: 'card v-sum-card' }, rows),
      wordList ? h('div', { class: 'v-sum-words' }, wordList) : null,
      storyBtn),
    h('div', { class: 'v-sum-actions' }, h('div', { class: 'v-sum-actions-inner' },
      h('button', { type: 'button', class: 'btn btn-primary btn-lg btn-block', on: { click: () => app.navigate('#/today') } }, holdLabel(app.t('continue'))),
      h('button', { type: 'button', class: 'btn btn-secondary btn-lg btn-block', on: { click: again } }, icon('refresh'), holdLabel('again_session')))));

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
