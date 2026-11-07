// Konzept-Index für „Wissen“: jedes Grammatik-/Redemittel-Thema einzeln, gruppiert nach Kategorie.
// Quelle: concepts der Lektionsdateien (bzw. curriculum.json für noch nicht fertige Lektionen).
// Erklärungsabschnitte mit `concept` werden dem Thema zugeordnet.
import { isUnlocked } from './engine/progress.js';

export const CATEGORIES = [
  { id: 'redemittel', label: 'Redemittel', emoji: '💬' },
  { id: 'aussprache', label: 'Aussprache und Schrift', emoji: '🔤' },
  { id: 'pronomen', label: 'Pronomen und Anrede', emoji: '👥' },
  { id: 'verben', label: 'Verben', emoji: '⚙️' },
  { id: 'kasus', label: 'Fälle (Kasus)', emoji: '🧩' },
  { id: 'nomen', label: 'Nomen und Adjektive', emoji: '🏷️' },
  { id: 'zahlen', label: 'Zahlen und Zeit', emoji: '🔢' },
  { id: 'satzbau', label: 'Satzbau', emoji: '🧱' },
];

// Fallback, solange eine Lektion ihren Konzepten noch keine Kategorie gibt.
function guessCategory(title) {
  const t = title.toLowerCase();
  if (/chunk|wendung|redemittel|grüß|gruß|verabschied/.test(t)) return 'redemittel';
  if (/betonung|aussprache|alphabet|wohlklang/.test(t)) return 'aussprache';
  if (/akkusativ|lokativ|genitiv|dativ|instrumental|vokativ|nominativ|kasus/.test(t)) return 'kasus';
  if (/präsens|präteritum|futur|imperativ|konjugation|verb|aspekt|-ся|infinitiv/.test(t)) return 'verben';
  if (/pronom|possessiv|ти |ви\b|duzen|siezen/.test(t)) return 'pronomen';
  if (/zahl|uhrzeit|datum|wochentag|monat|tageszeit/.test(t)) return 'zahlen';
  if (/genus|plural|adjektiv|nomen/.test(t)) return 'nomen';
  return 'satzbau';
}

export function lessonOpen(app, id) {
  const st = app.store.state.lessons[id];
  return !!app.content.getLesson(id) && (isUnlocked(app, id) || !!st?.sessions || !!st?.storySeenAt);
}

/** Alle Konzepte in Kursreihenfolge: { id, title_de, category, lessonId, meta, lesson, sections, open, planned } */
export function allConcepts(app) {
  const out = [];
  for (const meta of app.content.lessonList) {
    const lesson = app.content.getLesson(meta.id);
    const list = lesson?.concepts || meta.concepts || [];
    for (const c of list) {
      const sections = (lesson?.explanation?.sections || []).filter(s => s.concept === c.id);
      out.push({
        id: c.id, title_de: c.title_de.replace(/\s*\([^()]*a1-\d-\d\d[^()]*\)/g, ''),
        category: c.category || guessCategory(c.title_de),
        lessonId: meta.id, meta, lesson, sections,
        planned: !lesson, open: lessonOpen(app, meta.id),
      });
    }
  }
  return out;
}

export function findConcept(app, id) {
  return allConcepts(app).find(c => c.id === id) || null;
}
