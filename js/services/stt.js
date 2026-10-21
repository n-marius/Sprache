// STUB (Audio-Agent ersetzt): Spracherkennung uk-UA.
import { normalizeSentence } from '../lib/uk-text.js';
const SR = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
export const stt = {
  supported: !!SR,
  listen() { return Promise.reject(new Error('not implemented')); },
  abort() {},
  score(heard, target) { return normalizeSentence(heard) === normalizeSentence(target) ? 1 : 0; },
};
