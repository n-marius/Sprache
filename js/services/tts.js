// Text-to-Speech (Web Speech API) für Ukrainisch (uk-UA).
// Berücksichtigt iOS-/Safari-Eigenheiten: Stimmen kommen verzögert, erster speak() nur nach Nutzergeste,
// cancel() vor speak(), Utterance-Referenz halten (GC-Bug), Chrome-15-s-Abbruch (pause/resume).
import { stripStress } from '../lib/uk-text.js';
import { getApp } from '../app-context.js';

const synth = globalThis.speechSynthesis;
const Utterance = globalThis.SpeechSynthesisUtterance;
const SUPPORTED = !!(synth && Utterance);
const UA = globalThis.navigator?.userAgent || '';
const IS_IOS = /iP(hone|ad|od)/.test(UA) || (globalThis.navigator?.platform === 'MacIntel' && globalThis.navigator?.maxTouchPoints > 1);
const IS_ANDROID = /Android/i.test(UA);
// Desktop-Chrome/Edge bricht lange Utterances nach ~15 s ab → regelmäßig pause/resume (nicht auf Android: dort = cancel).
const NEEDS_KEEPALIVE = !IS_IOS && !IS_ANDROID && /Chrome|Chromium|Edg\//.test(UA);

export const HINT_KEY = 'mova.voiceHint.v1';
const DEFAULTS = { rate: 0.95, slowRate: 0.6, voiceURI: null };

const isUk = v => /^uk([-_]|$)/i.test(String(v?.lang || ''));

/** Qualitätsrang einer Stimme (höher = besser). */
export function voiceRank(v) {
  const s = `${v.name || ''} ${v.voiceURI || ''}`.toLowerCase();
  let r = 0;
  if (/premium/.test(s)) r += 30;
  else if (/enhanced|erweitert|verbessert/.test(s)) r += 20;
  if (/natural|neural|online/.test(s)) r += 18;
  if (/lesya|леся/.test(s)) r += 6;
  if (/^uk[-_]ua$/i.test(v.lang || '')) r += 2;
  if (v.localService) r += 2;   // offline zuverlässiger
  if (v.default) r += 1;
  if (/compact/.test(s)) r -= 2;
  return r;
}

let allVoices = [];
let ukVoices = [];
let voicesLoaded = false;
let settingsFallback = { ...DEFAULTS };
let initialized = false;
let unlocked = false;
let unlockPending = false;
let firstSpeak = true;
let seq = 0;
let current = null;                 // laufende Anfrage
const keep = new Set();             // Utterances gegen GC festhalten
const listeners = { start: new Set(), end: new Set(), voices: new Set() };

function emit(type, detail) {
  for (const fn of listeners[type] || []) { try { fn(detail); } catch (e) { console.error(e); } }
}

function refreshVoices() {
  if (!SUPPORTED) return false;
  let list = [];
  try { list = synth.getVoices() || []; } catch { list = []; }
  const uk = list.filter(isUk).sort((a, b) => voiceRank(b) - voiceRank(a));
  const changed = list.length !== allVoices.length || uk.length !== ukVoices.length ||
    uk.some((v, i) => v.voiceURI !== ukVoices[i]?.voiceURI);
  allVoices = list;
  ukVoices = uk;
  if (list.length) voicesLoaded = true;
  if (changed) emit('voices', ukVoices.slice());
  return changed;
}

function startVoicePolling() {
  // iOS liefert getVoices() anfangs leer und feuert voiceschanged nicht immer → Polling bis 10 s.
  let n = 0;
  const t = setInterval(() => {
    refreshVoices();
    if (ukVoices.length || ++n >= 40) {
      clearInterval(t);
      voicesLoaded = true;
      emit('voices', ukVoices.slice());
    }
  }, 250);
}

function settings() {
  const s = getApp()?.store?.state?.settings;
  return { ...DEFAULTS, ...settingsFallback, ...(s || {}) };
}

function hasActivation() {
  if (unlocked) return true;
  const ua = globalThis.navigator?.userActivation;
  if (ua && typeof ua.hasBeenActive === 'boolean') return ua.hasBeenActive;
  return true; // unbekannt → versuchen
}

function onGesture() {
  if (unlocked) return;
  unlocked = true;
  for (const ev of ['pointerup', 'touchend', 'click', 'keydown']) document.removeEventListener(ev, onGesture, true);
  // iOS: stille Utterance innerhalb der Geste schaltet die Sprachausgabe für spätere (verzögerte) speak()-Aufrufe frei.
  if (!IS_IOS || current) return;
  try {
    const u = new Utterance(' ');
    u.volume = 0; u.lang = 'uk-UA';
    unlockPending = true;
    const done = () => { unlockPending = false; keep.delete(u); };
    u.onend = done; u.onerror = done;
    setTimeout(done, 1200);
    keep.add(u);
    synth.speak(u);
  } catch { unlockPending = false; }
}

function finish(req, result) {
  if (!req || req.done) return;
  req.done = true;
  for (const t of req.timers) { clearTimeout(t); clearInterval(t); }
  keep.delete(req.u);
  if (current === req) current = null;
  if (req.started) emit('end', { text: req.text, slow: req.slow, ...result });
  req.resolve(result);
}

function pickVoice() {
  if (!ukVoices.length) refreshVoices();
  const uri = settings().voiceURI;
  if (uri) {
    const v = ukVoices.find(x => x.voiceURI === uri);
    if (v) return v;
  }
  return ukVoices[0] || null;
}

export const tts = {
  supported: SUPPORTED,
  isIOS: IS_IOS,

  init(s) {
    if (s) settingsFallback = { ...settingsFallback, ...s };
    if (!SUPPORTED || initialized) return;
    initialized = true;
    refreshVoices();
    try { synth.addEventListener?.('voiceschanged', refreshVoices); } catch {}
    if ('onvoiceschanged' in synth && !synth.addEventListener) synth.onvoiceschanged = refreshVoices;
    startVoicePolling();
    if (typeof document !== 'undefined') {
      for (const ev of ['pointerup', 'touchend', 'click', 'keydown']) document.addEventListener(ev, onGesture, { capture: true, passive: true });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') refreshVoices();
        else this.stop();
      });
    }
    globalThis.addEventListener?.('pagehide', () => this.stop());
  },

  /** Ukrainische Stimmen, beste zuerst. */
  voices() { if (SUPPORTED && !ukVoices.length) refreshVoices(); return ukVoices.slice(); },
  hasUkVoice() { return this.voices().length > 0; },
  /** true, sobald die Stimmenliste geladen ist (oder das Polling aufgegeben hat). */
  get voicesLoaded() { return voicesLoaded; },
  /** Aktuell verwendete Stimme (settings.voiceURI, sonst beste) oder null. */
  currentVoice() { return SUPPORTED ? pickVoice() : null; },
  /** Hinweis nötig: Sprachausgabe fehlt oder keine ukrainische Stimme installiert. */
  needsVoiceHint() { return !SUPPORTED || (voicesLoaded && !this.hasUkVoice()); },
  get speaking() { return !!(current && !current.done) || (SUPPORTED && !!synth.speaking && !unlockPending); },

  /**
   * Spricht ukrainischen Text. Betonungszeichen werden entfernt, Apostroph bleibt.
   * → Promise<{ok:true} | {ok:false, reason:'unsupported'|'empty'|'no-voice'|'needs-gesture'|'no-start'|'interrupted'|'timeout'|<error>}>
   * Die Promise löst immer auf (nie reject, nie hängend).
   */
  speak(text, { slow = false, rate } = {}) {
    if (!SUPPORTED) return Promise.resolve({ ok: false, reason: 'unsupported' });
    if (!initialized) this.init();
    const clean = stripStress(String(text ?? '')).replace(/\s+/g, ' ').trim();
    if (!clean) return Promise.resolve({ ok: false, reason: 'empty' });
    refreshVoices();
    const voice = pickVoice();
    // Stimmen bekannt, aber keine ukrainische → nicht mit falscher Stimme vorlesen.
    if (!voice && allVoices.length && voicesLoaded) return Promise.resolve({ ok: false, reason: 'no-voice' });
    if (!hasActivation()) return Promise.resolve({ ok: false, reason: 'needs-gesture' });

    const s = settings();
    const r = Math.min(2, Math.max(0.1, Number(rate ?? (slow ? s.slowRate : s.rate)) || 1));

    return new Promise(resolve => {
      const req = { id: ++seq, text: clean, slow, resolve, timers: [], started: false, done: false, u: null };
      // Vorherige Anfrage sauber beenden
      let mustCancel = false;
      if (current) { finish(current, { ok: false, reason: 'interrupted' }); mustCancel = true; }
      else if ((synth.speaking || synth.pending) && !unlockPending) mustCancel = true;
      if (mustCancel) { try { synth.cancel(); } catch {} }
      current = req;

      const u = new Utterance(clean);
      req.u = u;
      keep.add(u);
      u.lang = voice?.lang?.replace('_', '-') || 'uk-UA';
      if (voice) u.voice = voice;
      u.rate = r;
      u.pitch = 1;
      u.volume = 1;

      const estMs = 2500 + (clean.length * 110) / r;
      u.onstart = () => {
        if (req.done) return;
        req.started = true;
        emit('start', { text: clean, slow });
        req.timers.push(setTimeout(() => { try { synth.cancel(); } catch {} finish(req, { ok: false, reason: 'timeout' }); }, estMs * 1.6 + 2000));
        if (NEEDS_KEEPALIVE && !(voice && voice.localService)) {
          req.timers.push(setInterval(() => { if (synth.speaking && !synth.paused) { synth.pause(); synth.resume(); } }, 10000));
        }
      };
      u.onend = () => finish(req, { ok: true });
      u.onerror = e => finish(req, { ok: false, reason: e?.error || 'error' });

      // Startet gar nicht (iOS ohne Geste, Headless ohne Stimmen …) → nicht hängen bleiben.
      const startWait = firstSpeak ? 4000 : 2500;
      firstSpeak = false;
      req.timers.push(setTimeout(() => {
        if (!req.started && !req.done) { try { synth.cancel(); } catch {} finish(req, { ok: false, reason: 'no-start' }); }
      }, startWait));

      const go = () => {
        if (req.done) return;
        try { synth.speak(u); } catch (e) { finish(req, { ok: false, reason: 'error' }); }
        // Safari: gelegentlich bleibt die Engine pausiert
        try { if (synth.paused) synth.resume(); } catch {}
      };
      // Nach cancel() braucht WebKit einen Tick, sonst wird die neue Utterance verworfen.
      if (mustCancel) req.timers.push(setTimeout(go, 60)); else go();
    });
  },

  stop() {
    if (!SUPPORTED) return;
    const req = current;
    if (req) finish(req, { ok: false, reason: 'interrupted' });
    try { if (synth.speaking || synth.pending) synth.cancel(); } catch {}
  },

  /** fn(ukVoices) bei Änderung der Stimmenliste. → unsubscribe() */
  onVoicesChanged(fn) { listeners.voices.add(fn); return () => listeners.voices.delete(fn); },
  /** on('start'|'end', fn({text, slow, ok?, reason?})) → unsubscribe() */
  on(type, fn) {
    const set = listeners[type];
    if (!set) return () => {};
    set.add(fn);
    return () => set.delete(fn);
  },

  /** Kurzer Status (z. B. für die Einstellungen). */
  status() {
    const v = this.currentVoice();
    return { supported: SUPPORTED, voicesLoaded, hasUkVoice: this.hasUkVoice(), voice: v ? { name: v.name, voiceURI: v.voiceURI, lang: v.lang } : null };
  },

  hintShown() { try { return localStorage.getItem(HINT_KEY) === '1'; } catch { return false; } },

  /**
   * Einmaliger Hinweis-Sheet „Ukrainische Stimme installieren“.
   * {force:true} zeigt ihn auch erneut (z. B. aus den Einstellungen). → Promise<boolean> (angezeigt?)
   */
  async showVoiceHint({ force = false } = {}) {
    if (!force && (this.hintShown() || (SUPPORTED && this.hasUkVoice()))) return false;
    if (hintOpen) return false;
    try { localStorage.setItem(HINT_KEY, '1'); } catch {}
    hintOpen = true;
    try {
      const [{ sheet }, { h }] = await Promise.all([import('../ui/shell.js'), import('../ui/dom.js')]);
      const step = (n, text) => h('li', { class: 'voice-hint-step' }, h('span', { class: 'voice-hint-num' }, String(n)), h('span', text));
      const path = h('div', { class: 'voice-hint-path' },
        ['Einstellungen', 'Bedienungshilfen', 'Gesprochene Inhalte', 'Stimmen', 'Ukrainisch'].flatMap((p, i) =>
          i ? [h('span', { class: 'voice-hint-sep', 'aria-hidden': 'true' }, '›'), h('span', p)] : [h('span', p)]));
      const content = h('div', { class: 'voice-hint' },
        h('div', { class: 'voice-hint-glyph', 'aria-hidden': 'true' }, '🔊'),
        h('p', { class: 'voice-hint-lead' }, SUPPORTED
          ? 'Auf diesem Gerät ist keine ukrainische Stimme installiert. Ohne sie kann die App nichts vorsprechen.'
          : 'Dieser Browser unterstützt keine Sprachausgabe. Öffnen Sie die App in Safari (iPhone/iPad).'),
        SUPPORTED ? h('div', { class: 'voice-hint-box' },
          h('div', { class: 'voice-hint-title' }, 'iPhone / iPad'),
          path,
          h('ol', { class: 'voice-hint-steps' },
            step(1, 'Die Stimme „Lesya“ antippen und laden – am besten die Variante „Erweitert“ (bessere Qualität).'),
            step(2, 'Die App danach vollständig schließen (App-Umschalter nach oben wischen) und neu öffnen.'))) : null,
        SUPPORTED ? h('p', { class: 'voice-hint-foot' }, 'Andere Geräte: In den Systemeinstellungen unter Sprache/Sprachausgabe eine ukrainische Stimme installieren.') : null);
      const s = sheet({ title: 'Ukrainische Stimme', content, onClose: () => { hintOpen = false; } });
      const ok = h('button', { type: 'button', class: 'btn btn-blue btn-block', on: { click: () => s.close() } }, 'Verstanden');
      (s.el.querySelector('.sheet-body') || s.el).append(h('div', { class: 'voice-hint-actions' }, ok));
      return true;
    } catch (e) {
      hintOpen = false;
      console.warn('Stimmen-Hinweis fehlgeschlagen', e);
      return false;
    }
  },
};

let hintOpen = false;
