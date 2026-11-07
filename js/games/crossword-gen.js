// Kreuzworträtsel-Generator (ohne DOM, testbar). Wörter werden über gemeinsame Buchstaben verschränkt.
// words: [{answer:'привіт', ...}] (Kleinbuchstaben, ohne Betonung) → {w, h, slots:[{...word, x, y, dir, num}], cells}
import { stripStress } from '../lib/uk-text.js';

const LETTERS = /^[а-щьюяєіїґ]+$/;

/** Antwortform für das Rätsel: ohne Betonung, klein, nur ein Wort aus kyrillischen Buchstaben. */
export function toAnswer(uk) {
  const a = stripStress(String(uk || '')).toLowerCase().trim();
  return LETTERS.test(a) ? a : null;
}

function tryBuild(words) {
  const grid = new Map(); // "x,y" → Buchstabe
  const placed = [];
  const key = (x, y) => `${x},${y}`;
  const at = (x, y) => grid.get(key(x, y));
  const canPlace = (word, x, y, dir) => {
    const dx = dir === 'h' ? 1 : 0, dy = dir === 'h' ? 0 : 1;
    if (at(x - dx, y - dy) || at(x + dx * word.length, y + dy * word.length)) return -1;
    let cross = 0;
    for (let i = 0; i < word.length; i++) {
      const cx = x + dx * i, cy = y + dy * i, c = at(cx, cy);
      if (c) { if (c !== word[i]) return -1; cross++; continue; }
      // Nachbarn quer zur Richtung müssen frei sein (keine ungewollten Wörter)
      if (at(cx + dy, cy + dx) || at(cx - dy, cy - dx)) return -1;
    }
    return cross;
  };
  const put = (w, x, y, dir) => {
    const dx = dir === 'h' ? 1 : 0, dy = dir === 'h' ? 0 : 1;
    for (let i = 0; i < w.answer.length; i++) grid.set(key(x + dx * i, y + dy * i), w.answer[i]);
    placed.push({ ...w, x, y, dir });
  };
  put(words[0], 0, 0, 'h');
  for (const w of words.slice(1)) {
    let best = null;
    for (const p of placed) {
      for (let i = 0; i < p.answer.length; i++) {
        for (let j = 0; j < w.answer.length; j++) {
          if (p.answer[i] !== w.answer[j]) continue;
          const dir = p.dir === 'h' ? 'v' : 'h';
          const x = p.dir === 'h' ? p.x + i : p.x - j;
          const y = p.dir === 'h' ? p.y - j : p.y + i;
          const c = canPlace(w.answer, x, y, dir);
          if (c > 0 && (!best || c > best.c)) best = { x, y, dir, c };
        }
      }
    }
    if (best) put(w, best.x, best.y, best.dir);
  }
  return { placed, grid };
}

/** Bestes von mehreren Zufalls-Layouts (meiste Wörter, dann kleinste Fläche). */
export function buildCrossword(words, { tries = 40, rng = Math.random, max = 6 } = {}) {
  let best = null;
  for (let t = 0; t < tries; t++) {
    const order = words.slice().sort(() => rng() - 0.5).slice(0, max + 2);
    order.sort((a, b) => b.answer.length - a.answer.length + (rng() - 0.5) * 3);
    const { placed, grid } = tryBuild(order);
    const use = placed.slice(0, max);
    if (use.length < placed.length) continue; // nur vollständige Teilmengen werten
    const xs = [...grid.keys()].map(k => +k.split(',')[0]), ys = [...grid.keys()].map(k => +k.split(',')[1]);
    const w = Math.max(...xs) - Math.min(...xs) + 1, h = Math.max(...ys) - Math.min(...ys) + 1;
    const score = use.length * 1000 - w * h - Math.abs(w - h) * 3;
    if (!best || score > best.score) best = { score, placed: use, minX: Math.min(...xs), minY: Math.min(...ys), w, h };
  }
  if (!best) return null;
  const slots = best.placed.map(p => ({ ...p, x: p.x - best.minX, y: p.y - best.minY }));
  // Nummerierung zeilenweise nach Startzelle
  const starts = [...new Set(slots.map(s => `${s.y},${s.x}`))].sort((a, b) => {
    const [ay, ax] = a.split(',').map(Number), [by, bx] = b.split(',').map(Number);
    return ay - by || ax - bx;
  });
  for (const s of slots) s.num = starts.indexOf(`${s.y},${s.x}`) + 1;
  const cells = new Map();
  for (const s of slots) for (let i = 0; i < s.answer.length; i++) {
    const x = s.x + (s.dir === 'h' ? i : 0), y = s.y + (s.dir === 'v' ? i : 0);
    const c = cells.get(`${x},${y}`) || { x, y, letter: s.answer[i], slots: [] };
    c.slots.push(s);
    cells.set(`${x},${y}`, c);
  }
  return { w: best.w, h: best.h, slots, cells };
}
