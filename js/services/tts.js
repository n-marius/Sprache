// STUB (Audio-Agent ersetzt): Text-to-Speech uk-UA.
export const tts = {
  supported: 'speechSynthesis' in globalThis,
  init() {},
  voices() { return this.supported ? speechSynthesis.getVoices().filter(v => /^uk/i.test(v.lang)) : []; },
  hasUkVoice() { return this.voices().length > 0; },
  speak(text, { slow = false } = {}) {
    if (!this.supported) return Promise.resolve();
    return new Promise(res => { const u = new SpeechSynthesisUtterance(text); u.lang = 'uk-UA'; u.rate = slow ? .6 : .95; u.onend = u.onerror = res; speechSynthesis.cancel(); speechSynthesis.speak(u); });
  },
  stop() { if (this.supported) speechSynthesis.cancel(); },
  onVoicesChanged(fn) { if (this.supported) speechSynthesis.addEventListener?.('voiceschanged', fn); },
};
