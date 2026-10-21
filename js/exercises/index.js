// Registry: Aufgabentyp → Modul (dynamisch geladen). Eigentümer: Koordinator.
import { instructionKey } from './common.js';

const MODULES = {
  mc_translate: () => import('./mc_translate.js'),
  picture_choice: () => import('./picture_choice.js'),
  true_false: () => import('./true_false.js'),
  listening: () => import('./listening.js'),
  build_sentence: () => import('./build_sentence.js'),
  cloze: () => import('./cloze.js'),
  order_dialog: () => import('./order_dialog.js'),
  match_pairs: () => import('./match_pairs.js'),
  chat: () => import('./chat.js'),
  reading: () => import('./reading.js'),
  speak: () => import('./speak.js'),
};

export const EXERCISE_TYPES = Object.keys(MODULES);

/** Lädt das Modul {selfChecking, render, instructionKey?} eines Typs. */
export async function getExercise(type) {
  const load = MODULES[type];
  if (!load) throw new Error('Unbekannter Aufgabentyp: ' + type);
  return load();
}

/** ui-strings-Key der Anweisung (Modul darf eigene instructionKey(ex) exportieren). */
export function instructionFor(ex, mod) {
  return mod?.instructionKey?.(ex) || instructionKey(ex);
}
