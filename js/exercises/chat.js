// Aufgabentyp „chat“ – Messenger-Dialog im iMessage-Stil (selbstprüfend).
// Bot-Zeilen erscheinen nach kurzem Tipp-Indikator (Autoplay), bei „me“-Zügen wählt man unten eine Antwort.
// Falsche Antwort → rot + feedback_de als Hinweis-Bubble, erneut wählbar; richtige → blaue Bubble rechts.
import { h, ukText, deText, icon, singleChoice, shuffledOptions, reducedMotion } from './common.js';
import { anim } from '../ui/anim.js';
import { haptic } from '../ui/haptics.js';

export const selfChecking = true;
export const instructionKey = () => 'chat';

const wait = ms => new Promise(r => setTimeout(r, ms));

export function render(ex, ctx) {
  const partner = ex.partner || {};
  const turns = Array.isArray(ex.turns) ? ex.turns : [];
  let alive = true;
  let choice = null;            // aktuelles singleChoice
  const sent = [];              // gesendete (richtige) Antworten
  const wrongPicks = [];        // falsch gewählte Optionen
  let meTurns = 0, firstTry = 0;
  const autoplay = ctx.settings?.autoplay !== false;
  const tts = ctx.app?.tts;

  // ---------- Kopf ----------
  const head = h('header', { class: 'exd-chat-head' },
    h('div', { class: 'exd-avatar', 'aria-hidden': 'true' }, h('span', { class: 'emoji' }, partner.emoji || '🙂')),
    h('div', { class: 'exd-chat-name' }, partner.name ? ukText(partner.name) : null),
    ex.scenario_de ? deText(ex.scenario_de, { cls: 'exd-chat-scenario' }) : null);

  const log = h('div', { class: 'exd-chat-log', role: 'log', 'aria-live': 'polite' });
  const reply = h('div', { class: 'exd-chat-reply', hidden: true });
  const el = h('div', { class: 'exd-chat' }, head, log, reply);

  // ---------- Bausteine ----------
  function scrollToEnd(node) {
    requestAnimationFrame(() => {
      try { (node || log.lastElementChild)?.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' }); } catch {}
    });
  }
  function push(node, { scroll = true } = {}) {
    log.append(node);
    if (scroll) scrollToEnd(reply.hidden ? node : reply);
    return node;
  }
  function botBubble(turn) {
    const de = turn.de ? h('div', { class: 'exd-bubble-de', hidden: true }, deText(turn.de)) : null;
    const deBtn = de ? h('button', {
      type: 'button', class: 'exd-de-btn', 'aria-pressed': 'false', 'aria-label': 'Deutsche Übersetzung zeigen',
      on: { click: e => { e.stopPropagation(); de.hidden = !de.hidden; deBtn.classList.toggle('is-on', !de.hidden); deBtn.setAttribute('aria-pressed', String(!de.hidden)); if (!de.hidden) scrollToEnd(de); } },
    }, 'DE') : null;
    return h('div', { class: 'exd-msg is-bot' },
      h('div', { class: 'exd-bubble' },
        h('div', { class: 'exd-bubble-uk' }, ukText(turn.uk)),
        de,
        h('div', { class: 'exd-bubble-tools' }, ctx.speaker(turn.uk, { size: 's' }), deBtn)));
  }
  function meBubble(opt) {
    return h('div', { class: 'exd-msg is-me' },
      h('div', { class: 'exd-bubble' }, h('div', { class: 'exd-bubble-uk' }, ukText(opt.uk))),
      h('div', { class: 'exd-delivered', 'aria-hidden': 'true' }, 'Zugestellt'));
  }
  function hintBubble(text) {
    return h('div', { class: 'exd-msg is-hint', role: 'status' },
      h('div', { class: 'exd-hint-bubble' }, icon('bulb', { cls: 'exd-hint-icon' }), deText(text)));
  }

  async function showBot(turn) {
    const typing = push(h('div', { class: 'exd-msg is-bot is-typing', 'aria-label': `${partner.name || ''} schreibt …` },
      h('div', { class: 'exd-bubble' }, h('span', { class: 'anim-typing', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')))));
    await wait(reducedMotion() ? 250 : 700);
    if (!alive) return;
    const b = botBubble(turn);
    typing.replaceWith(b);
    scrollToEnd(b);
    if (autoplay && tts?.speak) {
      // Auf die Wiedergabe warten (gedeckelt), damit aufeinanderfolgende Bot-Zeilen nicht übereinander sprechen.
      const p = Promise.resolve(tts.speak(turn.uk)).catch(() => {});
      await Promise.race([p, wait(Math.min(6000, 900 + String(turn.uk).length * 90))]);
    }
  }

  function askMe(turn) {
    return new Promise(resolve => {
      meTurns++;
      let mistakes = 0;
      const items = shuffledOptions(turn.options || [], ctx);
      const done = new Set();
      choice?.destroy();
      choice = singleChoice({
        items,
        cls: 'exd-chat-options',
        renderItem: it => ukText(it.value.uk, { tap: false }),
        onSelect: (it, i) => {
          const btn = choice.buttons[i];
          btn.classList.remove('is-selected');
          if (done.has(i)) return;
          if (!it.correct) {
            done.add(i);
            mistakes++;
            wrongPicks.push(it.value.uk);
            btn.classList.add('is-wrong', 'is-disabled');
            btn.setAttribute('aria-disabled', 'true');
            haptic('error');
            anim.wrong(btn);
            const fb = it.value.feedback_de || 'Das passt hier nicht. Versuch es noch einmal.';
            push(hintBubble(fb));
            return;
          }
          // richtig → senden
          choice.lock();
          btn.classList.add('is-correct');
          haptic('success');
          if (!mistakes) firstTry++;
          sent.push(it.value.uk);
          const from = btn.getBoundingClientRect();
          setTimeout(() => {
            if (!alive) return;
            reply.hidden = true;
            reply.replaceChildren();
            const m = push(meBubble(it.value));
            flyIn(m.querySelector('.exd-bubble'), from);
            resolve();
          }, reducedMotion() ? 60 : 220);
        },
      });
      reply.replaceChildren(h('div', { class: 'exd-reply-label t-foot' }, 'Deine Antwort'), choice.el);
      reply.hidden = false;
      scrollToEnd(reply);
    });
  }

  function flyIn(bubble, fromRect) {
    if (!bubble || reducedMotion() || !bubble.animate) return;
    const r = bubble.getBoundingClientRect();
    const dy = fromRect ? Math.max(-240, Math.min(240, fromRect.top - r.top)) : 24;
    bubble.animate([
      { transform: `translateY(${dy}px) scale(.92)`, opacity: 0.4 },
      { transform: 'none', opacity: 1 },
    ], { duration: 340, easing: 'cubic-bezier(.34,1.3,.64,1)' });
  }

  async function run() {
    await wait(120);
    for (const turn of turns) {
      if (!alive) return;
      if (turn.who === 'me') await askMe(turn);
      else await showBot(turn);
    }
    if (!alive) return;
    await wait(reducedMotion() ? 150 : 450);
    if (!alive) return;
    const ok = wrongPicks.length === 0;
    const solution = turns.filter(t => t.who === 'me').map(t => t.options?.[0]?.uk).filter(Boolean).join(' · ');
    const solutionDe = turns.filter(t => t.who === 'me').map(t => t.options?.[0]?.de).filter(Boolean).join(' · ');
    ctx.complete({
      correct: ok,
      score: meTurns ? firstTry / meTurns : 1,
      userAnswer: sent.join(' · ') + (wrongPicks.length ? ` (zuerst falsch: ${wrongPicks.join(' · ')})` : ''),
      solution_uk: solution || undefined,
      solution_de: solutionDe || undefined,
    });
  }
  run();

  return {
    el,
    getAnswer: () => sent.join(' · '),
    destroy() { alive = false; choice?.destroy(); try { tts?.stop?.(); } catch {} },
  };
}
