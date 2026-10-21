// Test-Hilfe (Paket Engine): content-ähnliches Objekt aus tests/fixtures + Fake-Store, feste Uhr.
import fs from 'node:fs';
import path from 'node:path';
import { defaultState } from '../../js/store.js';
import { setClock } from '../../js/engine/util.js';

const ROOT = path.resolve(import.meta.dirname, '../..');
const FIX = path.join(ROOT, 'tests/fixtures');
const read = f => JSON.parse(fs.readFileSync(path.join(FIX, f), 'utf8'));

/** Feste Uhr: lokale Zeit 'YYYY-MM-DD' um hh:mm. */
export function setDay(day, hh = 12, mm = 0) {
  const [y, m, d] = day.split('-').map(Number);
  const t = new Date(y, m - 1, d, hh, mm, 0).getTime();
  setClock(() => t);
  return t;
}

export function makeContent() {
  const curriculum = read('curriculum.json');
  const phases = curriculum.phases.map(p => ({ ...p, lessons: p.lessons.map(l => ({ ...l, phaseId: p.id })) }));
  const lessonList = phases.flatMap(p => p.lessons);
  lessonList.forEach((l, i) => { l.index = i; });
  const lessons = new Map();
  const vocabById = new Map();
  for (const meta of lessonList) {
    if (meta.status !== 'ready' || !meta.file) continue;
    const data = read(meta.file);
    data.grammar ||= []; data.vocab ||= []; data.exercises ||= [];
    meta.data = data;
    lessons.set(meta.id, data);
    for (const v of data.vocab) if (!vocabById.has(v.id)) vocabById.set(v.id, { ...v, lessonId: meta.id });
  }
  return {
    curriculum, phases, lessonList, lessons, vocabById,
    getLesson: id => lessons.get(id),
    getMeta: id => lessonList.find(l => l.id === id),
    readyLessons: () => lessonList.filter(l => lessons.has(l.id)),
    lessonsBefore(id) { const out = []; for (const l of lessonList) { if (l.id === id) break; if (lessons.has(l.id)) out.push(l); } return out; },
  };
}

export function makeApp(state = defaultState()) {
  const store = { state, updates: 0, update(fn) { this.updates++; return fn(this.state); }, subscribe() { return () => {}; } };
  return { content: makeContent(), store };
}

/** Session komplett durchspielen. answer(item, i) → Result (Default: alles richtig). */
export function play(session, answer = () => ({ correct: true, userAnswer: 'x', durationMs: 4000 }), max = 200) {
  const items = [];
  for (let it = session.next(), i = 0; it && i < max; it = session.next(), i++) {
    items.push(it);
    if (it.kind === 'exercise') session.record(it, answer(it, i));
  }
  return { items, summary: session.finish() };
}
