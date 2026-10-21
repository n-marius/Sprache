// Trainer-Runde (#/trainer/session?dir=&scope=&mode=), Vollbild: Karte mit Aufdecken + Selbstbewertung,
// optional Auswahl (4 Optionen) und Hören (Audio → Bedeutung).
import { h, icon, clear, ukText, deText } from '../ui/dom.js';
import { anim } from '../ui/anim.js';
import { haptic } from '../ui/haptics.js';
import { speakerButton } from '../ui/audio-button.js';
import { autoplayAllowed } from '../audio-mode.js';
import { createTrainerRound, cardFaces, RATING_LABELS, isMarked, toggleMarked } from '../engine/trainer.js';
import { shuffle } from '../engine/util.js';

const RATE_CLS = { 1: 'tr-rate-again', 2: 'tr-rate-hard', 3: 'tr-rate-good', 4: 'tr-rate-easy' };
const DIR_LABEL = { 'de-uk': 'Deutsch → Ukrainisch', 'uk-de': 'Ukrainisch → Deutsch', mixed: 'Gemischt' };

function gapNode(gap, reveal = false) {
  return h('span', { class: 'uk tr-gap-sentence' }, gap.before,
    h('span', { class: ['tr-gap', reveal && 'is-filled'] }, reveal ? gap.gap : ' '.repeat(Math.max(3, gap.gap.length - 1))), gap.after);
}

export function render(params, app) {
  const q = params.query || new URLSearchParams();
  const opts = { dir: q.get('dir') || 'de-uk', scope: q.get('scope') || 'due', mode: q.get('mode') || 'card' };
  let round = createTrainerRound(app, opts);

  const fill = h('div', { class: 'progress-fill' });
  const bar = h('div', { class: 'progress tr-progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100' }, fill);
  const counter = h('span', { class: 'tr-counter' });
  const closeBtn = h('button', { type: 'button', class: 'icon-btn tr-close', 'aria-label': 'Training beenden', on: { click: () => close() } }, icon('close'));
  const head = h('header', { class: 'tr-head' }, h('div', { class: 'tr-head-inner' }, closeBtn, bar, counter));
  const stage = h('main', { class: 'tr-stage' });
  const foot = h('footer', { class: 'tr-foot' });
  const root = h('div', { class: ['tr-sess', `tr-mode-${round.mode}`] }, head, stage, foot);

  let item = null, phase = 'idle', t0 = 0, destroyed = false, choiceState = null;
  const total0 = round.size;

  function updateProgress() {
    const p = round.progress();
    anim.progress(fill, p);
    bar.setAttribute('aria-valuenow', String(Math.round(p * 100)));
    const done = round.items.filter(i => i._done).length;
    counter.textContent = `${Math.min(done + (item ? 1 : 0), round.size)} / ${round.size}`;
  }

  function close() {
    if (round.items.some(i => i._done)) round.finish();
    app.navigate('#/trainer');
  }

  function next() {
    item = round.next();
    choiceState = null;
    clear(stage); clear(foot);
    if (!item) return showSummary();
    t0 = performance.now();
    updateProgress();
    if (round.mode === 'card') renderCard();
    else renderChoice();
  }

  // ---------- Karte ----------
  function frontNode(f, faces) {
    const autoplay = autoplayAllowed(app);
    if (f.lang === 'uk') {
      return h('div', { class: 'tr-face-main' },
        h('div', { class: 'tr-word' }, ukText(f.text, { tap: false })),
        speakerButton(f.text, { size: 'l', autoplay }));
    }
    return h('div', { class: 'tr-face-main' },
      f.emoji ? h('div', { class: 'tr-emoji', 'aria-hidden': 'true' }, f.emoji) : null,
      h('div', { class: ['tr-word', 'tr-de', faces.sentence && 'is-sentence'] }, deText(f.text)),
      f.gap ? h('div', { class: 'tr-gap-wrap' }, gapNode(f.gap)) : null);
  }

  function backNode(faces) {
    const b = faces.back, e = item.entry;
    const hl = faces.sentence && faces.front.gap
      ? gapNode(faces.front.gap, true)
      : ukText(b.uk, { tap: faces.sentence, cls: 'tr-uk-answer' });
    return h('div', { class: 'tr-face-main' },
      b.emoji && item.dir === 'uk-de' ? h('div', { class: 'tr-emoji', 'aria-hidden': 'true' }, b.emoji) : null,
      h('div', { class: ['tr-word', faces.sentence && 'is-sentence'] }, hl),
      h('div', { class: 'tr-audio-row' }, speakerButton(b.uk, { size: 'l', autoplay: autoplayAllowed(app) && item.dir === 'de-uk' }), speakerButton(b.uk, { size: 's', slow: true })),
      h('div', { class: 'tr-meaning' }, deText(b.de)),
      e.kind === 'vocab' && e.info ? h('div', { class: 'tr-info' }, e.info) : null,
      b.example ? h('div', { class: 'tr-example' },
        h('div', { class: 'tr-example-uk' }, ukText(b.example.uk), speakerButton(b.example.uk, { size: 's' })),
        h('div', { class: 'tr-example-de' }, b.example.de)) : null);
  }

  function tags() {
    return h('div', { class: 'tr-card-tags' },
      h('span', { class: 'badge blue' }, item.dir === 'de-uk' ? 'DE → UK' : 'UK → DE'),
      item.isNew ? h('span', { class: 'badge green' }, 'neu') : null,
      item.retry ? h('span', { class: 'badge red' }, 'nochmal') : null,
      item.entry.kind === 'sentence' ? h('span', { class: 'badge yellow' }, 'Satz') : null,
      item.entry.kind === 'vocab' ? markBtn() : null);
  }

  function markBtn() {
    const id = item.entry.id;
    const b = h('button', { type: 'button', class: ['tr-mark', isMarked(app, id) && 'is-on'], 'aria-pressed': String(isMarked(app, id)), title: 'Als schwierig markieren',
      on: { click: ev => { ev.stopPropagation(); const on = toggleMarked(app, id); b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); haptic('light'); } } },
    icon('target'), h('span', 'schwierig'));
    return b;
  }

  function renderCard() {
    phase = 'front';
    const faces = cardFaces(item);
    const front = h('div', { class: 'tr-face tr-front' }, frontNode(faces.front, faces), h('div', { class: 'tr-tap-hint' }, 'Antippen zum Aufdecken'));
    const back = h('div', { class: 'tr-face tr-back', 'aria-hidden': 'true' });
    const card = h('div', { class: 'tr-card', role: 'button', tabindex: '0', 'aria-label': 'Karte aufdecken', on: { click: () => reveal() } },
      tags(), h('div', { class: 'tr-flip' }, front, back));
    stage.append(card);
    const revealBtn = h('button', { type: 'button', class: 'btn btn-blue btn-lg btn-block btn-caps', on: { click: () => reveal() } }, 'Aufdecken');
    foot.append(h('div', { class: 'tr-foot-inner' }, revealBtn));
    anim.pop(card);

    function reveal() {
      if (phase !== 'front') return;
      phase = 'back';
      back.append(backNode(faces));
      back.removeAttribute('aria-hidden');
      front.setAttribute('aria-hidden', 'true');
      card.classList.add('is-flipped');
      card.removeAttribute('role'); card.removeAttribute('tabindex'); card.setAttribute('aria-label', '');
      haptic('light');
      const pv = round.preview(item);
      clear(foot).append(h('div', { class: 'tr-foot-inner' },
        h('div', { class: 'tr-rate-title' }, 'Wie gut wusstest du es?'),
        h('div', { class: 'tr-rates' }, [1, 2, 3, 4].map(G => h('button', {
          type: 'button', class: ['btn', 'tr-rate', RATE_CLS[G]], on: { click: () => rateNow(G) },
          'aria-label': `${RATING_LABELS[G]}, nächstes Mal in ${pv[G].label}`,
        }, h('span', { class: 'tr-rate-label' }, RATING_LABELS[G]), h('span', { class: 'tr-rate-iv' }, pv[G].label))))));
    }
    card._reveal = reveal;
  }

  function rateNow(G) {
    if (phase !== 'back') return;
    phase = 'rated';
    round.rate(item, G, { ms: performance.now() - t0 });
    haptic(G === 1 ? 'error' : 'success');
    const card = stage.querySelector('.tr-card');
    (G === 1 ? anim.wrong(card) : anim.correct(card, { sparks: G >= 3 })).then(() => { if (!destroyed) next(); });
  }

  // ---------- Auswahl / Hören ----------
  function renderChoice() {
    const c = round.choices(item);
    if (!c) return renderCard();
    phase = 'choose';
    const correct = c.options[0].text;
    const options = shuffle(c.options, Math.random);
    const listen = round.mode === 'listen';
    const prompt = listen
      ? h('div', { class: 'tr-face-main tr-listen' }, speakerButton(c.audio, { size: 'l', autoplay: autoplayAllowed(app) }), speakerButton(c.audio, { size: 's', slow: true }), h('div', { class: 'tr-tap-hint' }, 'Was bedeutet das?'))
      : h('div', { class: 'tr-face-main' },
        c.emoji ? h('div', { class: 'tr-emoji', 'aria-hidden': 'true' }, c.emoji) : null,
        h('div', { class: ['tr-word', c.promptLang === 'de' && 'tr-de', item.entry.kind === 'sentence' && 'is-sentence'] },
          c.promptLang === 'uk' ? ukText(c.prompt, { tap: false }) : deText(c.prompt)),
        c.gap ? h('div', { class: 'tr-gap-wrap' }, gapNode(c.gap)) : null,
        c.promptLang === 'uk' ? speakerButton(c.prompt, { size: 'm', autoplay: autoplayAllowed(app) }) : null);
    const card = h('div', { class: 'tr-card tr-card-choice' }, tags(), prompt);
    const list = h('div', { class: 'tr-options' }, options.map((o, i) => h('button', {
      type: 'button', class: 'option tr-option', dataset: { idx: String(i) },
      on: { click: ev => choose(o, ev.currentTarget) },
    }, h('span', { class: 'tr-opt-key' }, String(i + 1)), o.lang === 'uk' ? ukText(o.text, { tap: false }) : deText(o.text))));
    stage.append(card, list);
    choiceState = { list, options, correct };
    anim.pop(card);
  }


  function choose(o, btn) {
    if (phase !== 'choose') return;
    phase = 'chosen';
    const ok = o.text === choiceState.correct;
    for (const b of choiceState.list.children) {
      b.classList.add('is-disabled');
      const idx = Number(b.dataset.idx);
      if (choiceState.options[idx].text === choiceState.correct) b.classList.add('is-correct');
    }
    if (!ok) btn.classList.add('is-wrong');
    round.answer(item, ok, { ms: performance.now() - t0 });
    haptic(ok ? 'success' : 'error');
    (ok ? anim.correct(btn) : anim.wrong(btn));
    const e = item.entry;
    const fb = h('div', { class: ['tr-fb', ok ? 'is-ok' : 'is-bad'], role: 'status' },
      h('div', { class: 'tr-fb-title' }, icon(ok ? 'check' : 'x'), ok ? 'Richtig!' : 'Noch nicht – richtig ist:'),
      h('div', { class: 'tr-fb-answer' }, ukText(e.uk, { tap: false }), speakerButton(e.uk, { size: 's', autoplay: autoplayAllowed(app) && !ok }), h('span', { class: 'tr-fb-de' }, '= ', e.de)));
    const btnNext = h('button', { type: 'button', class: ['btn', ok ? 'btn-primary' : 'btn-danger', 'btn-lg', 'btn-block', 'btn-caps'], on: { click: () => next() } }, 'Weiter');
    clear(foot).append(h('div', { class: 'tr-foot-inner' }, fb, btnNext));
    anim.feedbackIn(fb);
    btnNext.focus({ preventScroll: true });
  }

  // ---------- Zusammenfassung ----------
  function showSummary() {
    phase = 'done';
    const s = round.finish();
    anim.progress(fill, 1);
    counter.textContent = '';
    if (!s.total) {
      stage.append(h('div', { class: 'tr-card tr-summary tr-empty' },
        h('div', { class: 'tr-sum-emoji', 'aria-hidden': 'true' }, '🎉'),
        h('h2', { class: 'tr-sum-title' }, total0 ? 'Runde beendet' : 'Nichts zu üben'),
        h('p', { class: 'tr-sum-sub' }, total0 ? 'Keine Karte bewertet.' : 'Für diese Auswahl gibt es gerade keine Karten. Wähle einen anderen Umfang.')));
      foot.append(h('div', { class: 'tr-foot-inner' }, h('button', { type: 'button', class: 'btn btn-primary btn-lg btn-block btn-caps', on: { click: () => app.navigate('#/trainer') } }, 'Zurück zum Trainer')));
      return;
    }
    const segs = [1, 2, 3, 4].filter(G => s.counts[G]).map(G => h('span', { class: ['tr-dist-seg', RATE_CLS[G]], style: `flex:${s.counts[G]}`, title: `${RATING_LABELS[G]}: ${s.counts[G]}` }));
    const legend = [1, 2, 3, 4].map(G => h('div', { class: ['tr-legend-row', RATE_CLS[G]] },
      h('span', { class: 'tr-dot' }), h('span', { class: 'tr-legend-label' }, RATING_LABELS[G]), h('span', { class: 'tr-legend-n' }, String(s.counts[G]))));
    const num = h('span', { class: 'tr-sum-num' }, '0');
    stage.append(h('div', { class: 'tr-card tr-summary' },
      h('div', { class: 'tr-sum-emoji', 'aria-hidden': 'true' }, s.accuracy >= 0.8 ? '🌟' : '💪'),
      h('h2', { class: 'tr-sum-title' }, 'Runde geschafft!'),
      h('p', { class: 'tr-sum-sub' }, num, ` ${s.total === 1 ? 'Karte' : 'Karten'} geübt · ${DIR_LABEL[s.dir] || ''}`),
      h('div', { class: 'tr-dist' }, segs),
      h('div', { class: 'tr-legend' }, legend),
      s.newCards ? h('p', { class: 'tr-sum-note' }, `${s.newCards} ${s.newCards === 1 ? 'neue Karte' : 'neue Karten'} im Trainer`) : null,
      h('p', { class: 'tr-sum-note' }, `Tagesziel: ${Math.min(s.dayGoal.done, s.dayGoal.goal)} / ${s.dayGoal.goal}${s.dayGoal.met ? ' ✓' : ''}`)));
    anim.countUp(num, s.total);
    foot.append(h('div', { class: 'tr-foot-inner tr-sum-actions' },
      h('button', { type: 'button', class: 'btn btn-primary btn-lg btn-block btn-caps', on: { click: () => restart() } }, 'Noch eine Runde'),
      h('button', { type: 'button', class: 'btn btn-secondary btn-lg btn-block btn-caps', on: { click: () => app.navigate('#/trainer') } }, 'Zurück zum Trainer')));
  }

  function restart() {
    round = createTrainerRound(app, opts);
    item = null;
    next();
  }

  // ---------- Tastatur (iPad/Desktop) ----------
  function onKey(e) {
    if (e.metaKey || e.ctrlKey || e.altKey || document.querySelector('.sheet.is-open')) return;
    if (e.key === 'Escape') { close(); return; }
    if (phase === 'front' && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); stage.querySelector('.tr-card')?._reveal?.(); return; }
    if (phase === 'back' && /^[1-4]$/.test(e.key)) { e.preventDefault(); rateNow(Number(e.key)); return; }
    if (phase === 'choose' && /^[1-4]$/.test(e.key)) {
      const b = choiceState?.list.children[Number(e.key) - 1];
      if (b) { e.preventDefault(); b.click(); }
      return;
    }
    if (phase === 'chosen' && e.key === 'Enter') { e.preventDefault(); next(); }
  }
  addEventListener('keydown', onKey);

  next();
  return { el: root, destroy() { destroyed = true; removeEventListener('keydown', onKey); } };
}
