// Spracherkennung (webkitSpeechRecognition / SpeechRecognition) für Ukrainisch + tolerante Bewertung.
// Fehler werden als SttError mit `code` geworfen, damit die UI auf Selbstbewertung zurückfallen kann.
import { normalizeSentence } from '../lib/uk-text.js';
import { getApp } from '../app-context.js';

const SR = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;

/** Ab diesem Score gilt die Aussprache als richtig; ab closeThreshold als „fast“. */
export const threshold = 0.75;
export const closeThreshold = 0.5;

/** Fehlercodes, nach denen Spracherkennung in dieser Sitzung nicht mehr versucht werden sollte. */
const FATAL = new Set(['not-allowed', 'service-not-allowed', 'language-not-supported', 'unsupported', 'start-timeout', 'audio-capture']);
const MESSAGES = {
  'unsupported': 'Spracherkennung wird hier nicht unterstützt.',
  'not-allowed': 'Kein Zugriff auf das Mikrofon.',
  'service-not-allowed': 'Spracherkennung ist hier nicht erlaubt.',
  'language-not-supported': 'Ukrainisch wird von der Spracherkennung nicht unterstützt.',
  'audio-capture': 'Kein Mikrofon gefunden.',
  'no-speech': 'Nichts gehört.',
  'network': 'Spracherkennung braucht eine Internetverbindung.',
  'aborted': 'Abgebrochen.',
  'timeout': 'Zeit abgelaufen.',
  'start-timeout': 'Spracherkennung startet nicht.',
  'bad-grammar': 'Spracherkennung fehlgeschlagen.',
};

export class SttError extends Error {
  constructor(code, detail) {
    super(MESSAGES[code] || `Spracherkennung fehlgeschlagen (${code}).`);
    this.name = 'SttError';
    this.code = code;
    this.fatal = FATAL.has(code);   // true → UI dauerhaft (Sitzung) auf Selbstbewertung umstellen
    if (detail) this.detail = detail;
  }
}

// ---------- Bewertung ----------
const ONES = ['нуль', 'один', 'два', 'три', 'чотири', "п’ять", 'шість', 'сім', 'вісім', "дев’ять", 'десять',
  'одинадцять', 'дванадцять', 'тринадцять', 'чотирнадцять', "п’ятнадцять", 'шістнадцять', 'сімнадцять', 'вісімнадцять', "дев’ятнадцять"];
const TENS = ['', '', 'двадцять', 'тридцять', 'сорок', "п’ятдесят", 'шістдесят', 'сімдесят', 'вісімдесят', "дев’яносто"];
const HUNDREDS = ['', 'сто', 'двісті', 'триста', 'чотириста', "п’ятсот", 'шістсот', 'сімсот', 'вісімсот', "дев’ятсот"];

/** Ganze Zahl 0..9999 → ukrainische Zahlwörter (Nominativ, mask.). Erkenner liefern oft Ziffern. */
export function numberToUk(n) {
  n = Math.floor(Number(n));
  if (!Number.isFinite(n) || n < 0 || n > 9999) return String(n);
  if (n < 20) return ONES[n];
  const out = [];
  const th = Math.floor(n / 1000);
  if (th) out.push(th === 1 ? 'тисяча' : th < 5 ? `${th === 2 ? 'дві' : ONES[th]} тисячі` : `${ONES[th]} тисяч`);
  const rest = n % 1000;
  if (rest >= 100) out.push(HUNDREDS[Math.floor(rest / 100)]);
  const r = rest % 100;
  if (r >= 20) { out.push(TENS[Math.floor(r / 10)]); if (r % 10) out.push(ONES[r % 10]); }
  else if (r > 0) out.push(ONES[r]);
  return out.join(' ');
}

// Faltet auf einen toleranten Vergleichsschlüssel: ґ→г, Apostroph weg, Bindestrich → Leerzeichen.
function fold(s) {
  const withNums = String(s ?? '').replace(/\d+/g, d => ` ${numberToUk(d)} `);
  return normalizeSentence(withNums).replace(/ґ/g, 'г').replace(/[’']/g, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
}

// Leicht verwechselbare Laute/Buchstaben (Erkenner, Russisch-Einfluss): geringere Ersetzungskosten.
const NEAR = new Map(Object.entries({
  'иі': 0.3, 'иї': 0.5, 'ії': 0.3, 'ий': 0.5, 'ій': 0.5, 'еє': 0.4, 'еи': 0.5, 'еі': 0.6,
  'ощ': 0.8, 'шщ': 0.4, 'вў': 0.3, 'ао': 0.6, 'ья': 0.8, 'ую': 0.4, 'ая': 0.4, 'еэ': 0.2, 'иы': 0.2, 'ыі': 0.3,
}));
function subCost(a, b) {
  if (a === b) return 0;
  return NEAR.get(a + b) ?? NEAR.get(b + a) ?? 1;
}

/** Gewichtete Levenshtein-Distanz (Einfügen/Löschen 1, Ersetzen 0..1). */
export function distance(a, b) {
  const A = [...a], B = [...b];
  if (!A.length) return B.length;
  if (!B.length) return A.length;
  let prev = new Array(B.length + 1);
  let cur = new Array(B.length + 1);
  for (let j = 0; j <= B.length; j++) prev[j] = j;
  for (let i = 1; i <= A.length; i++) {
    cur[0] = i;
    for (let j = 1; j <= B.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + subCost(A[i - 1], B[j - 1]));
    }
    [prev, cur] = [cur, prev];
  }
  return prev[B.length];
}

/** Zeichen-Ähnlichkeit 0..1. */
export function similarity(a, b) {
  const L = Math.max([...a].length, [...b].length);
  if (!L) return 1;
  return Math.max(0, 1 - distance(a, b) / L);
}

// Wortübereinstimmung (reihenfolge-tolerant, unscharf): F1 aus gierigem Best-Match.
function wordScore(T, H) {
  if (!T.length || !H.length) return 0;
  const pairs = [];
  for (let i = 0; i < T.length; i++) for (let j = 0; j < H.length; j++) {
    const sim = similarity(T[i], H[j]);
    if (sim >= 0.6) pairs.push([sim, i, j]);
  }
  pairs.sort((x, y) => y[0] - x[0]);
  const ut = new Set(), uh = new Set();
  let sum = 0;
  for (const [sim, i, j] of pairs) {
    if (ut.has(i) || uh.has(j)) continue;
    ut.add(i); uh.add(j); sum += sim;
  }
  const p = sum / H.length, r = sum / T.length;
  return p + r ? (2 * p * r) / (p + r) : 0;
}

/**
 * Wie gut passt das Gehörte zum Zielsatz? → 0..1
 * Ignoriert Betonung, Groß/Klein, Satzzeichen; toleriert ґ/г, Apostroph, и/і, Ziffern, Wortreihenfolge.
 */
export function score(heard, target) {
  const h = fold(heard), t = fold(target);
  if (!t) return h ? 0 : 1;
  if (!h) return 0;
  if (h === t) return 1;
  const T = t.split(' '), H = h.split(' ');
  const ordered = similarity(t.replace(/ /g, ''), h.replace(/ /g, ''));
  const sorted = similarity([...T].sort().join(''), [...H].sort().join('')) * 0.95;
  const chars = Math.max(ordered, sorted);
  const words = wordScore(T, H);
  return Math.round(Math.min(1, 0.5 * chars + 0.5 * words) * 1000) / 1000;
}

/** Bester Score über alle Erkenner-Alternativen (Strings oder {transcript}) und ggf. mehrere Zielsätze. */
export function scoreBest(alternatives, target) {
  const alts = (Array.isArray(alternatives) ? alternatives : [alternatives])
    .map(a => (typeof a === 'string' ? a : a?.transcript)).filter(a => typeof a === 'string' && a.trim());
  const targets = (Array.isArray(target) ? target : [target]).filter(x => typeof x === 'string');
  let best = 0;
  for (const a of alts) for (const t of targets) best = Math.max(best, score(a, t));
  return best;
}

/** 'good' | 'close' | 'bad' */
export function verdict(s) { return s >= threshold ? 'good' : s >= closeThreshold ? 'close' : 'bad'; }

// ---------- Erkennung ----------
let active = null;          // {rec, finish}
let disabledReason = null;  // nach fatalem Fehler: Code

function collect(results) {
  // results: SpeechRecognitionResultList → {finalText, interimText, alternatives:[{transcript, confidence}], hasFinal}
  const segs = [];
  let hasFinal = false;
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const alts = [];
    for (let k = 0; k < r.length; k++) alts.push({ transcript: String(r[k].transcript || '').trim(), confidence: r[k].confidence || 0 });
    segs.push({ alts, final: !!r.isFinal });
    if (r.isFinal) hasFinal = true;
  }
  const best = segs.map(s => s.alts[0]?.transcript || '').filter(Boolean).join(' ').trim();
  // Alternativen: Varianten des längsten Segments, übrige Segmente mit bester Variante
  let alternatives = [];
  if (segs.length) {
    let idx = 0;
    segs.forEach((s, i) => { if (s.alts.length > segs[idx].alts.length) idx = i; });
    alternatives = segs[idx].alts.map(a => ({
      transcript: segs.map((s, i) => (i === idx ? a.transcript : s.alts[0]?.transcript || '')).filter(Boolean).join(' ').trim(),
      confidence: a.confidence,
    }));
  }
  const seen = new Set();
  alternatives = alternatives.filter(a => a.transcript && !seen.has(a.transcript) && seen.add(a.transcript));
  return { transcript: best, alternatives, hasFinal };
}

export const stt = {
  supported: !!SR,
  threshold,
  closeThreshold,
  score,
  scoreBest,
  verdict,
  SttError,

  /** false nach einem fatalen Fehler (z. B. iOS-PWA-Standalone ohne Erkennung) – dann Selbstbewertung. */
  get available() { return !!SR && !disabledReason; },
  get disabledReason() { return SR ? disabledReason : 'unsupported'; },
  get listening() { return !!active; },
  /** Nach Änderung der Berechtigung erneut versuchen lassen. */
  reset() { disabledReason = null; },

  /**
   * Hört einmal zu. → Promise<{transcript, alternatives:string[], confidences:number[]}>
   * Wirft SttError{code}. onInterim(text) bekommt Zwischenergebnisse.
   * silenceMs: nach so langer Stille seit dem letzten Zwischenergebnis wird beendet (Safari stoppt sonst nicht).
   */
  listen({ lang = 'uk-UA', timeoutMs = 8000, onInterim, maxAlternatives = 5, silenceMs = 1600, startTimeoutMs = 5000 } = {}) {
    if (!SR) return Promise.reject(new SttError('unsupported'));
    if (active) this.abort();
    try { getApp()?.tts?.stop?.(); } catch {}

    return new Promise((resolve, reject) => {
      let rec;
      try { rec = new SR(); } catch (e) { reject(new SttError('unsupported', e?.message)); return; }
      rec.lang = lang;
      rec.interimResults = true;
      rec.maxAlternatives = maxAlternatives;
      rec.continuous = false;

      let last = { transcript: '', alternatives: [], hasFinal: false };
      let started = false;
      let settled = false;
      let errorCode = null;
      const timers = new Set();
      const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.add(t); return t; };
      let silenceTimer = null;

      const finish = (err) => {
        if (settled) return;
        settled = true;
        for (const t of timers) clearTimeout(t);
        if (active?.rec === rec) active = null;
        rec.onresult = rec.onerror = rec.onend = rec.onstart = rec.onaudiostart = rec.onspeechend = null;
        try { rec.abort(); } catch {}
        if (err) {
          if (err.fatal) disabledReason = err.code;
          reject(err);
          return;
        }
        if (!last.transcript) { reject(new SttError(errorCode === 'aborted' ? 'aborted' : 'no-speech')); return; }
        const alts = last.alternatives.length ? last.alternatives : [{ transcript: last.transcript, confidence: 0 }];
        resolve({
          transcript: alts[0].transcript || last.transcript,
          alternatives: alts.map(a => a.transcript),
          confidences: alts.map(a => a.confidence),
        });
      };
      const stopSoft = () => {
        try { rec.stop(); } catch {}
        later(() => finish(), 1200);   // falls onend ausbleibt
      };

      rec.onstart = rec.onaudiostart = () => { started = true; };
      rec.onresult = e => {
        started = true;
        last = collect(e.results);
        try { onInterim?.(last.transcript, last.hasFinal); } catch {}
        if (last.hasFinal) { finish(); return; }
        clearTimeout(silenceTimer);
        silenceTimer = later(stopSoft, silenceMs);
      };
      rec.onspeechend = () => { if (last.transcript) stopSoft(); };
      rec.onerror = e => {
        const code = e?.error || 'error';
        errorCode = code;
        if (code === 'aborted' && settled) return;
        if (code === 'no-speech' || code === 'aborted') {
          if (last.transcript) { finish(); return; }
          finish(new SttError(code));
          return;
        }
        finish(new SttError(code, e?.message));
      };
      rec.onend = () => finish();

      active = { rec, finish: () => { errorCode = 'aborted'; last = { transcript: '', alternatives: [] }; finish(new SttError('aborted')); } };
      later(() => { if (!started) finish(new SttError('start-timeout')); }, startTimeoutMs);
      later(() => { if (last.transcript) stopSoft(); else finish(new SttError('no-speech')); }, timeoutMs);

      try { rec.start(); } catch (e) {
        finish(new SttError(/not-allowed|NotAllowed/i.test(String(e?.name || e?.message)) ? 'not-allowed' : 'start-timeout', e?.message));
      }
    });
  },

  /** Laufende Erkennung abbrechen (Promise wird mit code 'aborted' abgelehnt). */
  abort() {
    const a = active;
    active = null;
    a?.finish();
  },
};
