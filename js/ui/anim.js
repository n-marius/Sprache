// STUB (Animations-Agent ersetzt). Alle Funktionen müssen ohne Animation sicher funktionieren.
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const anim = {
  get reduced() { return reduced(); },
  correct(el) {}, wrong(el) {}, pop(el) {}, feedbackIn(el) {}, streak(el) {},
  progress(fillEl, to) { if (fillEl) fillEl.style.setProperty('--p', `${Math.round(to * 100)}%`); },
  countUp(el, to) { if (el) el.textContent = String(to); },
  celebrate(container, theme) { return Promise.resolve(); },
  themeGlyph(theme) { return '⭐'; },
};
