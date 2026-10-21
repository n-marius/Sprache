// Session-Player (Vollbild): #/session/lesson/:id und #/session/review.
// Zeigt Items der Engine (intro | tip | exercise) nacheinander, Prüfen/Weiter-Footer mit Feedback-Leiste.
import { h, ukText, deText, richText, icon, clear } from '../ui/dom.js';
import { sheet, confirmDialog } from '../ui/shell.js';
import { anim } from '../ui/anim.js';
import { haptic } from '../ui/haptics.js';
import { speakerButton } from '../ui/audio-button.js';
import { openReportSheet } from '../ui/report-sheet.js';
import { getExercise, instructionFor } from '../exercises/index.js';
import { makeCtx } from '../exercises/ctx.js';
import { createLessonSession, createReviewSession } from '../engine/session.js';
import { isListenOff, isSpeakOff, autoplayAllowed } from '../audio-mode.js';
import { openAudioModeSheet } from '../ui/audio-mode-sheet.js';

const POS_DE = {
  noun: 'Substantiv', verb: 'Verb', adj: 'Adjektiv', adv: 'Adverb', pron: 'Pronomen', num: 'Zahlwort',
  prep: 'Präposition', conj: 'Konjunktion', part: 'Partikel', interj: 'Ausruf', name: 'Name', phrase: 'Wendung',
};

// Aufgabentypen, die Ton brauchen → Prüffunktion „gerade aus?“
const AUDIO_TYPES = { listening: isListenOff, speak: isSpeakOff };
const audioOffFor = (type, app) => { try { return !!AUDIO_TYPES[type]?.(app); } catch { return false; } };

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const isReduced = () => {
  try { return !!anim.reduced; } catch { return false; }
};

/** WAAPI-Animation, deren Promise immer auflöst. */
function play(el, frames, opts) {
  if (!el || typeof el.animate !== 'function') return Promise.resolve();
  return new Promise(res => {
    let done = false;
    const fin = () => { if (!done) { done = true; res(); } };
    try {
      const a = el.animate(frames, { fill: 'none', ...opts });
      a.onfinish = fin; a.oncancel = fin;
    } catch { fin(); }
    setTimeout(fin, (opts?.duration || 0) + 200);
  });
}

export function render(params, app) {
  const mode = params.mode || (params.id ? 'lesson' : 'review');
  let session;
  try {
    session = mode === 'review' ? createReviewSession(app) : createLessonSession(app, params.id);
  } catch (e) {
    console.error('Session konnte nicht erstellt werden', e);
    return errorView(e);
  }
  if (!session) return errorView(new Error('Keine Session'));

  const settings = () => app.store?.state?.settings || {};
  const T = key => app.t(key) || { uk: key, de: key };

  // ---------- Gerüst ----------
  const fill = h('div', { class: 'progress-fill' });
  const progress = h('div', { class: 'progress sess-progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-label': 'Fortschritt' }, fill);
  const closeBtn = h('button', { type: 'button', class: 'icon-btn sess-close', 'aria-label': 'Session beenden', on: { click: () => askClose() } }, icon('close'));
  const flagBtn = h('button', { type: 'button', class: 'icon-btn sess-flag', 'aria-label': 'Fehler melden', on: { click: () => report() } }, icon('flag'));
  const soundBtn = h('button', { type: 'button', class: 'icon-btn sess-sound', 'aria-label': 'Ton-Einstellungen („Gerade kein Ton“)', on: { click: () => openAudio() } }, icon('speaker'));
  const head = h('header', { class: 'sess-head' }, h('div', { class: 'sess-head-inner' }, closeBtn, progress, soundBtn, flagBtn));

  const stage = h('div', { class: 'sess-stage' });
  const body = h('main', { class: 'sess-body' }, stage);

  const fbSlot = h('div', { class: 'sess-fb', 'aria-live': 'polite' });
  const actionBtn = h('button', { type: 'button', class: 'btn btn-primary btn-lg btn-block btn-caps sess-action', on: { click: () => onAction() } });
  const foot = h('footer', { class: 'sess-foot' }, h('div', { class: 'sess-foot-inner' }, fbSlot, h('div', { class: 'sess-action-wrap' }, actionBtn)));

  const root = h('div', { class: ['sess', `sess-${mode}`] }, head, body, foot);

  // Footer-Höhe → Innenabstand des Inhalts
  let ro = null;
  const syncFoot = () => root.style.setProperty('--foot-h', `${Math.ceil(foot.getBoundingClientRect().height)}px`);
  try { ro = new ResizeObserver(syncFoot); ro.observe(foot); } catch {}

  // ---------- Zustand ----------
  let item = null;           // aktuelles Item
  let controller = null;     // Aufgaben-Controller
  let mod = null;            // Aufgaben-Modul
  let itemEl = null;         // gerendertes Item (für Animationen)
  let phase = 'idle';        // idle | answer | checking | feedback | info | done
  let ready = false;
  let lastAnswer = '';
  let lastResult = null;
  let t0 = 0;
  let destroyed = false;
  let finished = false;
  let token = 0;

  function setAction(label, cls, { disabled = false, hidden = false } = {}) {
    actionBtn.className = ['btn', cls, 'btn-lg', 'btn-block', 'btn-caps', 'sess-action'].join(' ');
    clear(actionBtn).append(ukText(label, { tap: false }));
    actionBtn.disabled = !!disabled;
    foot.classList.toggle('is-idle-hidden', !!hidden);
    requestAnimationFrame(syncFoot);
  }

  function resetFeedback() {
    clear(fbSlot);
    foot.classList.remove('is-ok', 'is-bad', 'is-neutral', 'has-fb');
  }

  function updateProgress() {
    let p = 0;
    try { p = Number(session.progress()) || 0; } catch {}
    progress.setAttribute('aria-valuenow', String(Math.round(p * 100)));
    try { anim.progress(fill, p); } catch { fill.style.setProperty('--p', `${p * 100}%`); }
  }

  function cleanupItem() {
    try { app.tts?.stop?.(); } catch {}
    try { controller?.destroy?.(); } catch (e) { console.error(e); }
    controller = null; mod = null;
  }

  async function swapStage(el) {
    const old = stage.firstElementChild;
    const reduced = isReduced();
    if (old) {
      await play(old, reduced ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-24px)' }],
        { duration: reduced ? 120 : 160, easing: 'ease-in', fill: 'forwards' });
    }
    clear(stage).append(el);
    window.scrollTo(0, 0);
    play(el, reduced ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'translateX(28px)' }, { opacity: 1, transform: 'none' }],
      { duration: reduced ? 160 : 280, easing: 'cubic-bezier(.22,.9,.3,1)' });
  }

  // ---------- Ablauf ----------
  async function advance() {
    if (destroyed || finished) return;
    cleanupItem();
    resetFeedback();
    let next = null;
    try { next = session.next(); } catch (e) { console.error('session.next() fehlgeschlagen', e); next = null; }
    updateProgress();
    if (!next) return finish();
    item = next; lastAnswer = ''; lastResult = null; ready = false;
    const my = ++token;
    t0 = now();
    try {
      if (item.kind === 'intro') await showIntro(item, my);
      else if (item.kind === 'tip') await showTip(item, my);
      else if (item.kind === 'exercise') await showExercise(item, my);
      else throw new Error('Unbekannte Item-Art: ' + item.kind);
    } catch (e) {
      console.error('Item übersprungen', item?.key, e);
      if (my === token && !destroyed) { cleanupItem(); return advance(); }
    }
  }

  async function showIntro(it, my) {
    const v = it.vocab || {};
    const head = T('new_word');
    const forms = Array.isArray(v.forms) ? v.forms.filter(f => f && f.uk) : [];
    const meta = [POS_DE[v.pos] || v.pos, v.info].filter(Boolean).join(' · ');
    const ex = v.example && v.example.uk ? v.example : null;
    const el = h('section', { class: 'sess-item sess-intro' },
      h('div', { class: 'sess-kicker' }, icon('sparkles'), ukText(head.uk, { tap: false }), h('span', { class: 'sess-kicker-de' }, head.de)),
      h('div', { class: 'card sess-intro-card' },
        v.emoji ? h('div', { class: 'sess-emoji', 'aria-hidden': 'true' }, v.emoji) : null,
        h('div', { class: 'sess-word' }, ukText(v.uk, { tap: false })),
        h('div', { class: 'sess-speakers' },
          speakerButton(v.uk, { size: 'l', autoplay: safeAutoplay() }),
          speakerButton(v.uk, { size: 'm', slow: true })),
        h('div', { class: 'sess-trans' }, deText(v.de)),
        meta ? h('div', { class: 'sess-meta' }, meta) : null,
        ex ? h('div', { class: 'sess-example' },
          h('div', { class: 'sess-example-row' }, ukText(ex.uk, { cls: 'sess-example-uk' }), speakerButton(ex.uk, { size: 's' })),
          ex.de ? deText(ex.de, { cls: 'sess-example-de' }) : null) : null,
        forms.length ? h('div', { class: 'sess-forms' },
          h('div', { class: 't-cap t-2' }, 'Formen'),
          h('div', { class: 'sess-form-list' }, forms.map(f => h('span', { class: 'sess-form' },
            ukText(f.uk, { tap: false }), f.info ? h('span', { class: 'sess-form-info' }, f.info) : null)))) : null));
    if (my !== token) return;
    itemEl = el;
    phase = 'info';
    setAction(T('continue').uk, 'btn-primary');
    await swapStage(el);
  }

  async function showTip(it, my) {
    const g = it.grammar || {};
    const lesson = safeLesson(it.lessonId);
    const examples = Array.isArray(g.examples) ? g.examples.filter(x => x && x.uk) : [];
    const el = h('section', { class: 'sess-item sess-tip' },
      h('div', { class: 'sess-kicker is-tip' }, icon('bulb'), h('span', null, 'Tipp')),
      h('div', { class: 'card sess-tip-card' },
        h('div', { class: 'sess-tip-head' },
          h('span', { class: 'sess-tip-icon', 'aria-hidden': 'true' }, icon('bulb')),
          h('h2', { class: 'sess-tip-title' }, g.title_de || 'Merke')),
        richText(g.body_de || '', { cls: 'sess-tip-body' }),
        examples.length ? h('ul', { class: 'sess-tip-examples' }, examples.map(x => h('li', null,
          h('div', { class: 'sess-example-row' }, ukText(x.uk, { cls: 'sess-example-uk' }), speakerButton(x.uk, { size: 's' })),
          x.de ? deText(x.de, { cls: 'sess-example-de' }) : null))) : null,
        lesson?.explanation ? h('button', { type: 'button', class: 'sess-link', on: { click: () => openExplainSheet(lesson) } },
          icon('book'), 'Erklärung öffnen') : null));
    if (my !== token) return;
    itemEl = el;
    phase = 'info';
    setAction(T('continue').uk, 'btn-primary');
    await swapStage(el);
  }

  async function showExercise(it, my) {
    const ex = it.ex;
    if (audioOffFor(ex.type, app)) { skipAudioOff(it); return; }
    const m = await getExercise(ex.type);
    if (my !== token || destroyed) return;
    const key = instructionFor(ex, m);
    const instr = T(key);
    const ctx = makeCtx(app, {
      lessonId: it.lessonId, ex,
      onReady: v => { if (my !== token) return; ready = !!v; if (phase === 'answer') actionBtn.disabled = !ready; },
      onComplete: r => { if (my === token) handleResult(r); },
    });
    phase = 'answer';
    mod = m;
    const ctrl = m.render(ex, ctx);
    if (!ctrl || !ctrl.el) throw new Error('Aufgabe ohne el: ' + ex.type);
    if (my !== token) { try { ctrl.destroy?.(); } catch {} return; }
    controller = ctrl;
    const el = h('section', { class: ['sess-item', 'sess-exercise', `sess-ex-${ex.type}`], dataset: { type: ex.type } },
      h('div', { class: 'sess-instr' },
        h('h2', { class: 'sess-instr-uk' }, ukText(instr.uk)),
        settings().showGermanHints !== false && instr.de ? h('div', { class: 'sess-instr-de' }, instr.de) : null),
      h('div', { class: 'sess-ex-body' }, ctrl.el),
      AUDIO_TYPES[ex.type] ? noSoundLink() : null);
    itemEl = el;
    if (m.selfChecking) setAction(T('check').uk, 'btn-primary', { disabled: true, hidden: true });
    else setAction(T('check').uk, 'btn-primary', { disabled: !ready });
    await swapStage(el);
  }

  async function doCheck() {
    if (phase !== 'answer' || !ready || !controller?.check) return;
    phase = 'checking';
    actionBtn.disabled = true;
    const my = token;
    let r;
    try { r = await controller.check(); } catch (e) { console.error('check() fehlgeschlagen', e); r = { correct: false, skipped: true, userAnswer: '' }; }
    if (my !== token || destroyed) return;
    if (!r) { phase = 'answer'; actionBtn.disabled = !ready; return; }
    phase = 'answer';
    handleResult(r);
  }

  function handleResult(r) {
    if (destroyed || !item || item.kind !== 'exercise') return;
    if (phase !== 'answer' && phase !== 'checking') return;
    phase = 'feedback';
    const res = { userAnswer: '', ...(r || {}) };
    res.correct = !!res.correct;
    if (!Number.isFinite(res.durationMs)) res.durationMs = Math.round(now() - t0);
    lastResult = res;
    let ans = res.userAnswer;
    try { ans = controller?.getAnswer?.() ?? res.userAnswer; } catch {}
    lastAnswer = ans ?? '';
    try { session.record(item, res); } catch (e) { console.error('session.record fehlgeschlagen', e); }
    updateProgress();
    showFeedback(res, item.ex);
  }

  function showFeedback(r, ex) {
    resetFeedback();
    const kind = r.skipped ? 'neutral' : r.correct ? 'ok' : 'bad';
    const reportLink = h('button', { type: 'button', class: 'sess-fb-report', on: { click: () => report() } }, icon('flag'), 'Melden');
    const hints = settings().showGermanHints !== false;
    let glyph, title, details = [];
    if (kind === 'ok') {
      glyph = h('div', { class: 'sess-fb-glyph is-ok' }, anim.checkmark({ size: 40 }));
      title = h('div', { class: 'sess-fb-title' }, ukText(T('correct').uk, { tap: false }), hints ? h('span', { class: 'sess-fb-title-de' }, T('correct').de) : null);
      if (r.solution_uk) details.push(h('div', { class: 'sess-fb-sol' }, ukText(r.solution_uk), speakerButton(r.solution_uk, { size: 's' })));
      if (r.solution_de) details.push(deText(r.solution_de, { tag: 'div', cls: 'sess-fb-de' }));
      haptic('success');
      anim.correct(itemEl?.querySelector('.sess-ex-body') || itemEl);
    } else if (kind === 'bad') {
      glyph = h('div', { class: 'sess-fb-glyph is-bad' }, icon('x'));
      title = h('div', { class: 'sess-fb-title' }, ukText(T('correct_answer').uk, { tap: false }), hints ? h('span', { class: 'sess-fb-title-de' }, T('correct_answer').de) : null);
      const deFirst = ex?.dir === 'uk-de' && r.solution_de; // Zielsprache Deutsch → deutsche Lösung hervorheben
      if (deFirst) details.push(deText(r.solution_de, { tag: 'div', cls: 'sess-fb-sol is-strong' }));
      if (r.solution_uk) details.push(h('div', { class: ['sess-fb-sol', !deFirst && 'is-strong'] }, ukText(r.solution_uk), speakerButton(r.solution_uk, { size: 's' })));
      if (r.solution_de && !deFirst) details.push(deText(r.solution_de, { tag: 'div', cls: 'sess-fb-de' }));
      const expl = r.explanation_de || r.hint_de || ex?.explanation_de || ex?.hint_de;
      if (expl) details.push(h('div', { class: 'sess-fb-expl' }, icon('info'), h('span', null, expl)));
      haptic('error');
      anim.wrong(itemEl?.querySelector('.sess-ex-body') || itemEl);
    } else {
      glyph = h('div', { class: 'sess-fb-glyph is-neutral' }, icon('clock'));
      title = h('div', { class: 'sess-fb-title' }, h('span', null, 'Übersprungen'));
      details.push(h('div', { class: 'sess-fb-de' }, 'Diese Aufgabe wird nicht bewertet.'));
      if (r.solution_uk) details.push(h('div', { class: 'sess-fb-sol' }, ukText(r.solution_uk), speakerButton(r.solution_uk, { size: 's' })));
    }
    fbSlot.append(h('div', { class: 'sess-fb-row' }, glyph,
      h('div', { class: 'sess-fb-text' }, title, details,
        AUDIO_TYPES[ex?.type] && kind !== 'neutral' ? noSoundLink('is-fb') : null), reportLink));
    foot.classList.add('has-fb', `is-${kind}`);
    setAction(T('continue').uk, kind === 'bad' ? 'btn-danger' : kind === 'ok' ? 'btn-primary' : 'btn-blue');
    syncFoot();
    anim.feedbackIn(foot);
    setTimeout(() => { try { actionBtn.focus({ preventScroll: true }); } catch {} }, 60);
  }

  function onAction() {
    if (destroyed || finished) return;
    if (phase === 'answer') return doCheck();
    if (phase === 'info') {
      const res = { correct: true, userAnswer: '', durationMs: Math.round(now() - t0) };
      if (item?.kind === 'tip') res.skipped = true;
      phase = 'idle';
      try { session.record(item, res); } catch (e) { console.error('session.record fehlgeschlagen', e); }
      return advance();
    }
    if (phase === 'feedback') { phase = 'idle'; return advance(); }
  }

  async function finish() {
    if (finished || destroyed) return;
    finished = true; phase = 'done';
    cleanupItem();
    try { app.lastSummary = session.finish(); } catch (e) { console.error('session.finish fehlgeschlagen', e); app.lastSummary = null; }
    try { const g = await import('../services/gist.js'); Promise.resolve(g.maybeAutoBackup?.(app)).catch(() => {}); } catch {}
    if (!destroyed) app.navigate('#/summary', { replace: true });
  }

  // ---------- „Gerade kein Ton“ ----------
  function safeAutoplay() { try { return autoplayAllowed(app); } catch { return settings().autoplay !== false; } }
  function noSoundLink(cls = '') {
    return h('button', { type: 'button', class: ['sess-nosound', cls], on: { click: () => openAudio() } }, icon('speaker'), 'Gerade kein Ton');
  }
  function openAudio() {
    try { Promise.resolve(openAudioModeSheet(app)).catch(e => console.error(e)); } catch (e) { console.error(e); }
  }
  function syncSoundBtn() {
    let off = false;
    try { off = isListenOff(app) || isSpeakOff(app); } catch {}
    soundBtn.classList.toggle('is-off', off);
    soundBtn.setAttribute('aria-pressed', String(off));
  }
  /** Aktuelle Ton-Aufgabe ohne Bewertung überspringen. */
  function skipAudioOff(it) {
    if (destroyed || finished || it !== item) return;
    phase = 'idle';
    const res = { correct: false, skipped: true, audioOff: true, userAnswer: '', durationMs: Math.round(now() - t0) };
    try { session.record(it, res); } catch (e) { console.error('session.record fehlgeschlagen', e); }
    queueMicrotask(() => advance());
  }
  const onAudioMode = () => {
    syncSoundBtn();
    try { session.refreshAudioMode?.(); } catch (e) { console.error(e); }
    if (item?.kind === 'exercise' && (phase === 'answer' || phase === 'checking') && audioOffFor(item.ex?.type, app)) {
      try { app.tts?.stop?.(); } catch {}
      skipAudioOff(item);
    }
  };
  addEventListener('mova:audiomode', onAudioMode);
  syncSoundBtn();

  // ---------- Kopf-Aktionen ----------
  async function askClose() {
    const ok = await confirmDialog({ title: 'Session beenden?', message: 'Bisherige Antworten bleiben gespeichert.', ok: 'Beenden', cancel: 'Weiterlernen', destructive: true });
    if (ok && !destroyed) app.navigate('#/today');
  }

  function report() {
    if (!item) return;
    let ex;
    if (item.kind === 'intro') ex = { ...(item.vocab || {}), type: 'intro' };
    else if (item.kind === 'tip') ex = { type: 'tip', ...(item.grammar || {}) };
    else ex = item.ex;
    let userAnswer = lastAnswer;
    try { if (phase === 'answer' && controller?.getAnswer) userAnswer = controller.getAnswer() ?? lastAnswer; } catch {}
    try { openReportSheet({ lessonId: item.lessonId || session.lessonId, ex, userAnswer: userAnswer ?? '' }); } catch (e) { console.error(e); }
  }

  function safeLesson(id) {
    try { return id ? app.content.getLesson(id) : null; } catch { return null; }
  }

  function openExplainSheet(lesson) {
    const e = lesson.explanation || {};
    let s;
    s = sheet({
      title: 'Erklärung',
      content: h('div', { class: 'sess-explain-sheet' },
        h('h3', { class: 't-headline' }, e.title_de || lesson.title_de || 'Erklärung'),
        e.intro_de ? h('p', { class: 't-callout t-2' }, e.intro_de) : null,
        h('p', { class: 'sess-explain-note' }, icon('info'), h('span', null, 'Die ausführliche Erklärung öffnet sich als eigene Seite – die laufende Session wird dabei beendet.'))),
      actions: [
        h('button', { type: 'button', class: 'btn btn-blue btn-block', on: { click: () => { s.close(); app.navigate('#/explain/' + encodeURIComponent(lesson.id)); } } }, 'Erklärung öffnen'),
        h('button', { type: 'button', class: 'btn btn-secondary btn-block', on: { click: () => s.close() } }, 'Hier weiterlernen'),
      ],
    });
  }

  // ---------- Tastatur ----------
  const onKey = e => {
    if (e.key !== 'Enter' || e.isComposing || e.defaultPrevented || e.repeat) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.querySelector('.sheet.is-open, .alert.is-open, .scrim.is-open')) return;
    const t = e.target;
    if (t && t.tagName === 'TEXTAREA') return;
    if (t && (t.tagName === 'BUTTON' || t.tagName === 'A') && t !== actionBtn && !foot.contains(t)) return;
    if (actionBtn.disabled || (foot.classList.contains('is-idle-hidden') && phase === 'answer')) return;
    if (t === actionBtn) return; // nativer Klick übernimmt
    e.preventDefault();
    onAction();
  };
  document.addEventListener('keydown', onKey);

  updateProgress();
  setAction(T('check').uk, 'btn-primary', { disabled: true });
  let started = false;
  const start = () => { if (!started) { started = true; advance(); } };

  return {
    el: root,
    onShow: start,
    destroy() {
      destroyed = true; token++;
      document.removeEventListener('keydown', onKey);
      removeEventListener('mova:audiomode', onAudioMode);
      try { ro?.disconnect(); } catch {}
      cleanupItem();
    },
  };
}

function errorView(e) {
  return h('div', { class: 'sess sess-error' },
    h('div', { class: 'empty' },
      h('div', { class: 'empty-glyph' }, '🧭'),
      h('p', null, 'Diese Session konnte nicht gestartet werden.'),
      h('p', { class: 't-foot t-3', style: { marginTop: '8px' } }, String(e?.message || e || '')),
      h('a', { class: 'btn btn-secondary', href: '#/today', style: { marginTop: '16px' } }, 'Zur Startseite')));
}
