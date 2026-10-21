// STUB (Audio-Agent ersetzt): Lautsprecher-Button.
import { h, icon } from './dom.js';
import { getApp } from '../app-context.js';
export function speakerButton(text, { slow = false, size = 'm', autoplay = false } = {}) {
  const b = h('button', { type: 'button', class: ['speaker-btn', `size-${size}`, slow && 'is-slow'], 'aria-label': slow ? 'Langsam anhören' : 'Anhören',
    on: { click: e => { e.stopPropagation(); getApp()?.tts.speak(text, { slow }); } } }, icon(slow ? 'turtle' : 'speaker'));
  if (autoplay) setTimeout(() => getApp()?.tts.speak(text, { slow }), 250);
  return b;
}
