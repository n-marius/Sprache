// Lautsprecher-Button (Duolingo-artig blau). Spielt ukrainischen Text über tts ab.
// speakerButton(text, {slow=false, size='m'|'s'|'l', autoplay=false, label}) → <button class="speaker-btn size-…">
//  • während der Wiedergabe: .is-playing + .anim-speaking
//  • Hören aus (audio-mode): Button bleibt sichtbar, aber gedimmt (.is-muted); Klick spielt trotzdem.
//  • keine ukrainische Stimme: beim ersten Klick einmalig tts.showVoiceHint().
import { h, icon } from './dom.js';
import { getApp } from '../app-context.js';
import { tts } from '../services/tts.js';
import { isListenOff, autoplayAllowed } from '../audio-mode.js';

let activeBtn = null;      // Button, dessen Wiedergabe gerade läuft/ansteht
let hooked = false;

function setPlaying(btn, on) {
  if (!btn) return;
  btn.classList.toggle('is-playing', on);
  btn.classList.toggle('anim-speaking', on);
  btn.setAttribute('aria-pressed', on ? 'true' : 'false');
}

function hookGlobal() {
  if (hooked) return;
  hooked = true;
  // Status „gedimmt“ aktualisieren, wenn „Gerade kein Ton“ umgeschaltet wird.
  addEventListener('mova:audiomode', () => {
    const off = isListenOff(getApp());
    for (const b of document.querySelectorAll('.speaker-btn')) b.classList.toggle('is-muted', off);
  });
  // Erst bei tatsächlichem Start animieren (nicht während iOS noch auf die Stimme wartet).
  tts.on('start', () => { if (activeBtn) setPlaying(activeBtn, true); });
  tts.on('end', () => { if (activeBtn) { setPlaying(activeBtn, false); } });
}

function wantsHint(res) {
  if (res && (res.reason === 'no-voice' || res.reason === 'unsupported')) return true;
  try { return tts.needsVoiceHint(); } catch { return false; }
}

/** Spielt text für btn ab (auch von außen nutzbar, z. B. Tastenkürzel). */
export function playFor(btn, text, { slow = false } = {}) {
  hookGlobal();
  if (activeBtn && activeBtn !== btn) setPlaying(activeBtn, false);
  // Erneutes Tippen während der Wiedergabe → stoppen.
  if (activeBtn === btn && btn.classList.contains('is-playing')) {
    tts.stop();
    setPlaying(btn, false);
    activeBtn = null;
    return Promise.resolve({ ok: false, reason: 'interrupted' });
  }
  activeBtn = btn;
  btn.classList.add('is-pending');
  return tts.speak(text, { slow }).then(res => {
    btn.classList.remove('is-pending');
    if (activeBtn === btn) { setPlaying(btn, false); activeBtn = null; }
    return res;
  });
}

export function speakerButton(text, { slow = false, size = 'm', autoplay = false, label } = {}) {
  hookGlobal();
  const app = getApp();
  const aria = label || (slow ? 'Langsam anhören' : 'Anhören');
  const b = h('button', {
    type: 'button',
    class: ['speaker-btn', `size-${size}`, slow && 'is-slow', isListenOff(app) && 'is-muted'],
    'aria-label': aria,
    title: aria,
    'aria-pressed': 'false',
    on: {
      click: e => {
        e.stopPropagation();
        e.preventDefault();
        const needHintNow = wantsHint();
        if (needHintNow) tts.showVoiceHint();
        playFor(b, text, { slow }).then(res => { if (!needHintNow && wantsHint(res)) tts.showVoiceHint(); });
      },
    },
  }, icon(slow ? 'turtle' : 'speaker'));
  if (autoplay) {
    setTimeout(() => {
      const a = getApp();
      if (b.isConnected && (!a || autoplayAllowed(a))) playFor(b, text, { slow });
    }, 250);
  }
  return b;
}
