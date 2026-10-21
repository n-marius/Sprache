// Gemeinsame Text-Hilfen für App und Content-Tools (ES-Modul, läuft in Browser und Node).
export const STRESS = '́';
const APOS = /[ʼ'`´‘’]/g;
// Wort-Token: kyrillische Buchstaben inkl. Apostroph, Betonungszeichen und Binnen-Bindestrich.
const WORD = /[Ѐ-ӿ](?:[Ѐ-ӿ́ʼ'’‘-]*[Ѐ-ӿ́])?/g;

export function stripStress(s) {
  return s.normalize('NFD').replace(/́/g, '').normalize('NFC');
}

// Schlüssel für Lexikon-Lookup und Antwortvergleich.
export function normalizeWord(w) {
  return stripStress(w).toLowerCase().replace(APOS, '’').replace(/^-+|-+$/g, '');
}

// Liefert Teile eines Textes: {text, word:true|false, key?}
export function tokenize(text) {
  const parts = [];
  let last = 0;
  const src = text.normalize('NFC');
  for (const m of src.matchAll(WORD)) {
    if (m.index > last) parts.push({ text: src.slice(last, m.index), word: false });
    parts.push({ text: m[0], word: true, key: normalizeWord(m[0]) });
    last = m.index + m[0].length;
  }
  if (last < src.length) parts.push({ text: src.slice(last), word: false });
  return parts;
}

export function words(text) {
  return tokenize(text).filter(p => p.word).map(p => p.key);
}

// Vergleich ganzer Sätze: ohne Betonung, Groß/Klein, Satzzeichen.
export function normalizeSentence(s) {
  return words(s).join(' ');
}
