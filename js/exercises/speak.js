// Aufgabentyp „speak“ – deutschen Satz auf Ukrainisch laut sagen (selbstprüfend).
// Mit Spracherkennung (uk-UA): Bewertung über stt.scoreBest/verdict, max. 3 Versuche.
// Ohne Erkennung (oder nach Fehler): Selbstbewertung nach Anhören des Originals.
import { h, ukText, deText, icon } from './common.js';
import { anim } from '../ui/anim.js';
import { haptic } from '../ui/haptics.js';

export const selfChecking = true;
export const instructionKey = () => 'say_aloud';

const MAX_TRIES = 3;
const SOFT_ERRORS = new Set(['no-speech', 'aborted', 'timeout']);

export function render(ex, ctx) {
  const stt = ctx.app?.stt;
  const tts = ctx.app?.tts;
  const sttOn = () => !!(stt?.supported && ctx.settings?.stt !== false && stt.available !== false);
  let alive = true, finished = false, tries = 0, listening = false, mode = sttOn() ? 'stt' : 'self';
  let lastHeard = '';

  // ---------- Aufgabe: Deutsch groß, UK einklappbar ----------
  const ukLine = h('div', { class: 'exd-speak-uk-text' }, ukText(ex.uk));
  const ukHidden = h('div', { class: 'exd-speak-uk-hidden', hidden: true }, 'Ukrainisch ausgeblendet – erst selbst versuchen');
  const ukToggleTxt = h('span', 'UK ausblenden');
  const ukToggle = h('button', {
    type: 'button', class: 'exd-link exd-uk-toggle', 'aria-pressed': 'false',
    on: { click: () => setUkVisible(ukLine.hidden) },
  }, icon('chevron-down', { cls: 'exd-uk-chev' }), ukToggleTxt);
  function setUkVisible(v) {
    ukLine.hidden = !v; ukHidden.hidden = v;
    ukToggleTxt.textContent = v ? 'UK ausblenden' : 'UK zeigen';
    ukToggle.classList.toggle('is-collapsed', !v);
    ukToggle.setAttribute('aria-pressed', String(!v));
  }
  const ukCard = h('div', { class: 'exd-speak-uk' },
    h('div', { class: 'exd-speak-uk-row' },
      h('div', { class: 'exd-speak-uk-main' }, ukLine, ukHidden),
      h('div', { class: 'exd-speak-audio' }, ctx.speaker(ex.uk, { size: 'm' }), ctx.speaker(ex.uk, { size: 'm', slow: true }))),
    ukToggle);

  // ---------- Mikrofon / Status ----------
  const status = h('div', { class: 'exd-speak-status', role: 'status', 'aria-live': 'polite' });
  const heard = h('div', { class: 'exd-speak-heard', hidden: true });
  const actions = h('div', { class: 'exd-speak-actions' });
  const micIcon = h('span', { class: 'exd-mic-icon' }, icon('mic'));
  const mic = h('button', { type: 'button', class: 'exd-mic', 'aria-label': 'Aufnahme starten', on: { click: onMic } },
    h('span', { class: 'exd-mic-pulse', 'aria-hidden': 'true' }), micIcon);
  const tryDots = h('div', { class: 'exd-tries', 'aria-hidden': 'true' });
  const stage = h('div', { class: 'exd-speak-stage' }, mic, tryDots, status, heard, actions);

  const skip = h('button', { type: 'button', class: 'exd-link exd-skip', on: { click: onSkip } }, 'Gerade nicht sprechen');

  const el = h('div', { class: 'exd-speak' },
    h('div', { class: 'exd-speak-de' }, deText(ex.de)),
    ukCard, stage, h('div', { class: 'exd-speak-foot' }, skip));

  // ---------- Zustände ----------
  function setStatus(text, kind = '') {
    status.textContent = text || '';
    status.className = ['exd-speak-status', kind && `is-${kind}`].filter(Boolean).join(' ');
  }
  function showHeard(text, kind) {
    heard.hidden = !text;
    heard.className = ['exd-speak-heard', kind && `is-${kind}`].filter(Boolean).join(' ');
    heard.replaceChildren(text ? ukText(text, { tap: false }) : '');
  }
  function renderTries() {
    tryDots.replaceChildren(...Array.from({ length: MAX_TRIES }, (_, i) => h('i', { class: i < tries ? 'is-used' : '' })));
    tryDots.hidden = mode !== 'stt' || tries === 0;
  }
  function setActions(...btns) { actions.replaceChildren(...btns.filter(Boolean)); }
  const btn = (label, cls, onClick, ic) => h('button', { type: 'button', class: ['btn', cls], on: { click: onClick } }, ic ? icon(ic) : null, h('span', label));

  function idleStt(msg) {
    mode = 'stt';
    stage.className = 'exd-speak-stage';
    mic.disabled = false;
    mic.classList.remove('is-listening', 'is-ok', 'is-play');
    micIcon.replaceChildren(icon('mic'));
    mic.setAttribute('aria-label', 'Aufnahme starten');
    setStatus(msg || 'Tippe aufs Mikrofon und sprich.');
    renderTries();
  }

  function enterSelf(reason) {
    mode = 'self';
    stage.className = 'exd-speak-stage is-self';
    mic.disabled = false;
    mic.classList.remove('is-listening', 'is-ok');
    mic.classList.add('is-play');
    micIcon.replaceChildren(icon('speaker'));
    mic.setAttribute('aria-label', 'Original anhören');
    setStatus(reason ? `${reason} Sprich den Satz laut. Dann hör dir das Original an.` : 'Sprich den Satz laut. Dann hör dir das Original an.');
    renderTries();
    setActions(
      btn('Noch nicht', 'btn-secondary', () => finish({ correct: false, userAnswer: 'Selbstbewertung: noch nicht' }), 'x'),
      btn('Richtig gesagt', 'btn-primary', () => finish({ correct: true, score: 1, userAnswer: 'Selbstbewertung: richtig gesagt' }), 'check'));
  }

  function finish(r) {
    if (finished) return;
    finished = true;
    try { stt?.abort?.(); } catch {}
    mic.disabled = true;
    actions.querySelectorAll('button').forEach(b => { b.disabled = true; });
    skip.disabled = true;
    ctx.complete({ solution_uk: ex.uk, solution_de: ex.de, ...r });
  }

  function onSkip() {
    finish({ skipped: true, correct: false, userAnswer: '' });
  }

  async function onMic() {
    if (finished) return;
    if (mode === 'self') {
      mic.classList.add('anim-speaking');
      try { await tts?.speak?.(ex.uk); } catch {}
      mic.classList.remove('anim-speaking');
      return;
    }
    if (listening) { try { stt.abort(); } catch {} return; }
    listening = true;
    setActions();
    showHeard('');
    mic.classList.add('is-listening');
    mic.setAttribute('aria-label', 'Aufnahme beenden');
    stage.classList.add('is-listening');
    setStatus('Ich höre …', 'listening');
    haptic('light');
    let res;
    try {
      res = await stt.listen({ lang: 'uk-UA', timeoutMs: 9000, onInterim: t => { if (alive && t) showHeard(t, 'interim'); } });
    } catch (err) {
      listening = false;
      if (!alive || finished) return;
      mic.classList.remove('is-listening');
      stage.classList.remove('is-listening');
      const code = err?.code || 'error';
      if (err?.fatal || !SOFT_ERRORS.has(code)) {
        showHeard('');
        enterSelf(err?.message || 'Spracherkennung nicht verfügbar.');
        return;
      }
      idleStt(code === 'aborted' ? 'Abgebrochen. Tippe aufs Mikrofon, wenn du bereit bist.' : 'Nichts gehört. Tippe nochmal und sprich deutlich.');
      return;
    }
    listening = false;
    if (!alive || finished) return;
    mic.classList.remove('is-listening');
    stage.classList.remove('is-listening');
    tries++;
    const transcript = res?.transcript || '';
    lastHeard = transcript;
    const s = stt.scoreBest(res?.alternatives?.length ? res.alternatives : [transcript], ex.uk);
    const v = stt.verdict ? stt.verdict(s) : (s >= (stt.threshold ?? 0.75) ? 'good' : 'bad');
    renderTries();

    if (v === 'good') {
      stage.classList.add('is-ok');
      mic.classList.add('is-ok');
      micIcon.replaceChildren(icon('check'));
      setStatus('Richtig!', 'ok');
      showHeard(transcript, 'ok');
      haptic('success');
      anim.correct(mic);
      setTimeout(() => alive && finish({ correct: true, score: s, userAnswer: transcript }), 650);
      return;
    }
    if (v === 'close') {
      setStatus('Fast!', 'close');
      showHeard(transcript, 'close');
      haptic('light');
      setActions(
        tries < MAX_TRIES ? btn('Nochmal', 'btn-secondary', () => { setActions(); onMic(); }, 'refresh') : null,
        btn('Akzeptieren', 'btn-primary', () => finish({ correct: true, score: s, userAnswer: transcript }), 'check'));
      if (tries >= MAX_TRIES) mic.disabled = true;
      return;
    }
    // bad
    showHeard(transcript, 'bad');
    haptic('error');
    anim.wrong(heard);
    if (tries >= MAX_TRIES) {
      enterSelf('Die Erkennung hat es nicht verstanden.');
      return;
    }
    setStatus('Nicht ganz. Hör dir das Original an und versuch es nochmal.', 'bad');
  }

  // Start
  if (mode === 'stt') idleStt();
  else enterSelf();
  renderTries();

  return {
    el,
    getAnswer: () => lastHeard,
    destroy() { alive = false; try { if (listening) stt?.abort?.(); } catch {} },
  };
}
