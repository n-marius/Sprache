// Engine-Hilfen: injizierbare Uhr, Lerntag (Grenze 04:00 Ortszeit), seedbarer Zufall.
import { DAY_START_HOUR } from '../config.js';

let clockFn = () => Date.now();
/** Uhr für Tests ersetzen: setClock(() => ms) bzw. setClock(null) für die echte Uhr. */
export function setClock(fn) { clockFn = typeof fn === 'function' ? fn : () => Date.now(); }
export function now() { return clockFn(); }

const pad = n => String(n).padStart(2, '0');

/** Lerntag 'YYYY-MM-DD' (Ortszeit; vor 04:00 zählt zum Vortag). */
export function dayKey(ms = now()) {
  const d = new Date(ms - DAY_START_HOUR * 3600e3);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
/** Kalendertag 'YYYY-MM-DD' → Date (lokal 12:00, robust gegen Sommerzeit). */
export function parseDay(key) {
  const [y, m, d] = String(key).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
}
export function addDays(key, n) {
  const d = parseDay(key);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
/** Ganze Tage von a nach b (b − a). */
export function dayDiff(a, b) {
  return Math.round((parseDay(b) - parseDay(a)) / 86400e3);
}
/** Montag der Woche des Tages. */
export function weekStart(key) {
  const wd = (parseDay(key).getDay() + 6) % 7; // Mo=0
  return addDays(key, -wd);
}

// ---------- Zufall ----------
export function mulberry32(seed) {
  let a = (seed >>> 0) || 0x9e3779b9;
  return function rng() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function pick(arr, rng = Math.random) { return arr.length ? arr[Math.floor(rng() * arr.length)] : undefined; }
/** Gewichtete Auswahl: items [{w, v}] */
export function weighted(items, rng = Math.random) {
  const list = items.filter(x => x && x.w > 0);
  const sum = list.reduce((s, x) => s + x.w, 0);
  let r = rng() * sum;
  for (const x of list) { r -= x.w; if (r <= 0) return x.v; }
  return list.length ? list[list.length - 1].v : undefined;
}
export function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
