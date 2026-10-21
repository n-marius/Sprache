// „Gerade kein Ton“: Hören und/oder Sprechen zeitweise oder dauerhaft aus (Koordinator).
// Dauerhaft: settings.listenOff / settings.speakOff. Zeitweise: state.meta.listenOffUntil / speakOffUntil (ms-Zeitstempel).
// Wirkung: Engine lässt listening/speak aus bzw. ersetzt sie durch Textvarianten; kein Autoplay; SRS wird nicht bestraft.
import { DAY_START_HOUR } from './config.js';

const now = () => Date.now();

export function isListenOff(app) {
  const s = app?.store?.state; if (!s) return false;
  return !!s.settings.listenOff || (s.meta.listenOffUntil || 0) > now();
}
export function isSpeakOff(app) {
  const s = app?.store?.state; if (!s) return false;
  return !!s.settings.speakOff || (s.meta.speakOffUntil || 0) > now();
}
/** {listen, speak, until: ms|null|'forever'} – für Anzeige */
export function audioMode(app) {
  const s = app.store.state;
  const u = k => s.settings[k + 'Off'] ? 'forever' : ((s.meta[k + 'OffUntil'] || 0) > now() ? s.meta[k + 'OffUntil'] : null);
  return { listen: isListenOff(app), speak: isSpeakOff(app), listenUntil: u('listen'), speakUntil: u('speak') };
}

/** Ende des aktuellen Lerntags (nächster Tag 04:00). */
export function tomorrowMs() {
  const d = new Date();
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), DAY_START_HOUR, 0, 0);
  if (t <= d) t.setDate(t.getDate() + 1);
  return t.getTime();
}

/**
 * setAudioOff(app, {listen?:bool, speak?:bool, duration:'1h'|'tomorrow'|'forever'|'on'})
 * duration 'on' schaltet die genannten Kanäle wieder ein (zeitweise UND dauerhaft).
 */
export function setAudioOff(app, { listen = false, speak = false, duration = '1h' } = {}) {
  const until = duration === '1h' ? now() + 3600e3 : duration === 'tomorrow' ? tomorrowMs() : null;
  app.store.update(s => {
    for (const [k, on] of [['listen', listen], ['speak', speak]]) {
      if (!on) continue;
      if (duration === 'on') { s.settings[k + 'Off'] = false; s.meta[k + 'OffUntil'] = null; }
      else if (duration === 'forever') { s.settings[k + 'Off'] = true; s.meta[k + 'OffUntil'] = null; }
      else s.meta[k + 'OffUntil'] = until;
    }
  });
  if (listen && duration !== 'on') { try { app.tts?.stop?.(); } catch {} }
  dispatchEvent(new CustomEvent('mova:audiomode', { detail: audioMode(app) }));
}

/** Autoplay erlaubt? (Einstellung autoplay UND Hören nicht aus) */
export function autoplayAllowed(app) {
  return app.store.state.settings.autoplay !== false && !isListenOff(app);
}
