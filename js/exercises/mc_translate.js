// STUB – wird vom Aufgaben-Agenten ersetzt.
import { h } from '../ui/dom.js';
export const selfChecking = true;
export function render(ex, ctx) {
  const el = h('div', { class: 'card' }, 'Aufgabentyp mc_translate – in Arbeit ', h('button', { class: 'btn btn-secondary btn-sm', on: { click: () => ctx.complete({ correct: true, userAnswer: '' }) } }, 'OK'));
  return { el };
}
