#!/usr/bin/env node
// Inhalts-Validator für die Ukrainisch-PWA.
// Aufruf:  node tools/validate-content.mjs                 → alles (streng)
//          node tools/validate-content.mjs --lesson a1-1-05 → nur diese Lektion; frühere, noch fehlende
//                                                             Lektionen werden über den Plan (docs/a1-plan.md) ersetzt
//          Optionen: --quiet (keine Warnungen), --strict-warn (Warnungen zählen als Fehler)
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeWord, tokenize, STRESS } from '../js/lib/uk-text.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const C = (p) => join(ROOT, 'content', p);
const args = process.argv.slice(2);
const onlyLesson = args.includes('--lesson') ? args[args.indexOf('--lesson') + 1] : null;
const quiet = args.includes('--quiet');
const strictWarn = args.includes('--strict-warn');

const errors = [];
const warnings = [];
const seenMsg = new Set();
const push = (arr, m) => { if (!seenMsg.has(m)) { seenMsg.add(m); arr.push(m); } };
const err = (where, msg) => push(errors, `${where}: ${msg}`);
const warn = (where, msg) => push(warnings, `${where}: ${msg}`);

const THEMES = new Set('greetings people family home food cafe city transport time numbers shopping work law body weather hobby travel school colors clothes health calendar office'.split(' '));
const POS = new Set('noun verb adj adv pron num prep conj part interj name phrase'.split(' '));
const TYPES = ['mc_translate', 'build_sentence', 'cloze', 'chat', 'reading', 'listening', 'speak', 'match_pairs', 'picture_choice', 'true_false', 'order_dialog'];
const UI_KEYS = 'translate_to_uk translate_to_de choose_translation build_sentence fill_gap read_and_answer listen_and_choose listen_and_build say_aloud match_pairs choose_picture chat true_false true false check continue correct incorrect correct_answer new_word review lesson_done well_done skip report tap_to_listen slow'.split(' ');
const VOWELS = new Set('аеєиіїоуюя');
const BAD_APOS = /[ʼ'`´‘]/;
const RUSSIAN_ONLY = /[ыэъёЫЭЪЁ]/;
const LATIN = /[A-Za-zÀ-ɏ]/;

function readJson(path, where) {
  if (!existsSync(path)) { err(where, `Datei fehlt: ${path}`); return null; }
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch (e) { err(where, `JSON-Fehler: ${e.message}`); return null; }
}
const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const isArr = (v) => Array.isArray(v);

// ---------- Textprüfungen ----------
function syllables(token) {
  let n = 0;
  for (const ch of normalizeWord(token)) if (VOWELS.has(ch)) n++;
  return n;
}
// Prüft einen ukrainischen Text (Betonung, Alphabet, Apostroph). asWarning → nur Warnungen.
function checkUkText(text, where, { asWarning = false, allowLatin = false } = {}) {
  const report = asWarning ? warn : err;
  if (typeof text !== 'string') { err(where, 'kein String'); return; }
  const nfc = text.normalize('NFC');
  if (!allowLatin && LATIN.test(nfc)) report(where, `lateinische Buchstaben in „${text}“`);
  if (RUSSIAN_ONLY.test(nfc)) report(where, `russische Buchstaben (ы/э/ъ/ё) in „${text}“`);
  if (BAD_APOS.test(nfc)) report(where, `falscher Apostroph (nur ’ U+2019) in „${text}“`);
  if (/̀/.test(nfc.normalize('NFD'))) report(where, `Gravis statt Akut in „${text}“`);
  for (const ch of nfc) {
    if (ch.length === 1 && ch !== ch.normalize('NFD') && ch.normalize('NFD').includes(STRESS)) {
      report(where, `vorkomponiertes Akzentzeichen „${ch}“ in „${text}“`);
    }
  }
  for (const part of tokenize(nfc)) {
    if (!part.word) {
      if (part.text.includes(STRESS)) report(where, `Betonungszeichen außerhalb eines Wortes in „${text}“`);
      continue;
    }
    const tok = part.text;
    const nSyl = syllables(tok);
    const marks = [...tok].filter((c) => c === STRESS).length;
    const isAbbrev = tok.length >= 2 && tok === tok.toUpperCase() && tok !== tok.toLowerCase() && !tok.includes(STRESS) && tok.length <= 5;
    if (isAbbrev && nSyl >= 2) { warn(where, `Abkürzung ohne Betonung? „${tok}“`); continue; }
    if (nSyl >= 2 && marks !== 1) report(where, `${marks === 0 ? 'fehlende' : 'mehrfache'} Betonung: „${tok}“`);
    if (nSyl < 2 && marks > 0) report(where, `einsilbiges Wort mit Betonung: „${tok}“`);
    const chars = [...tok];
    chars.forEach((c, i) => {
      if (c === STRESS && (i === 0 || !VOWELS.has(chars[i - 1].toLowerCase()))) report(where, `Betonung nicht nach Vokal: „${tok}“`);
    });
  }
}
// Kyrillische Wörter in deutschen Texten: nur Warnungen zur Betonung.
function checkDeText(text, where) {
  if (typeof text !== 'string') return;
  if (/[Ѐ-ӿ]/.test(text)) checkUkText(text, where, { asWarning: true, allowLatin: true });
}

// ---------- Lexikon ----------
class Lexicon {
  constructor() { this.map = new Map(); this.acc = new Map(); }
  add(uk, src) {
    if (typeof uk !== 'string') return;
    const nfc = uk.normalize('NFC').trim();
    const key = normalizeWord(nfc);
    if (!key || key.includes(' ')) return; // Mehrwortausdrücke sind nicht tippbar
    if (!this.map.has(key)) { this.map.set(key, []); this.acc.set(key, new Set()); }
    this.map.get(key).push(src);
    if (nfc.includes(STRESS)) this.acc.get(key).add(nfc.toLowerCase().replace(/[ʼ'`´‘]/g, '’'));
  }
  has(key) { return this.map.has(key); }
  // Betonung des Tokens weicht von allen betonten Lexikonformen ab?
  stressMismatch(token, key) {
    const set = this.acc.get(key);
    if (!set || !set.size || !token.includes(STRESS)) return null;
    const t = token.normalize('NFC').toLowerCase();
    return set.has(t) ? null : [...set];
  }
  clone() { const l = new Lexicon(); for (const [k, v] of this.map) { l.map.set(k, [...v]); l.acc.set(k, new Set(this.acc.get(k))); } return l; }
}
function addLessonToLexicon(lex, lesson, src) {
  for (const v of lesson.vocab || []) {
    lex.add(v.uk, src);
    for (const f of v.forms || []) lex.add(f.uk, src);
  }
  for (const g of lesson.glossary || []) lex.add(g.uk, src);
}
function checkResolvable(text, where, lex, unresolved, { skipFragments = false } = {}) {
  if (typeof text !== 'string') return;
  const parts = tokenize(text);
  parts.forEach((part, i) => {
    if (!part.word) return;
    if (skipFragments && isFragment(parts, i)) return;
    if (!lex.has(part.key)) {
      if (!unresolved.has(part.key)) unresolved.set(part.key, where);
    } else {
      const mm = lex.stressMismatch(part.text, part.key);
      if (mm) warn(where, `Betonung „${part.text}“ weicht vom Lexikon ab (${mm.join(', ')})`);
    }
  });
}
// Wortteil mit Bindestrich (z. B. „-ою“, „ка́в-“) in deutschen Erklärtexten
function isFragment(parts, i) {
  const prev = parts[i - 1], next = parts[i + 1];
  return Boolean((prev && /[-‑]$/.test(prev.text)) || (next && /^[-‑]/.test(next.text)));
}
// Kyrillische Wörter in gemischten (deutschen) Erklärtexten: Betonung + Auflösbarkeit, Fragmente ausgenommen
function checkMixedText(text, where, lex, unresolved) {
  if (typeof text !== 'string' || !/[\u0400-\u04FF]/.test(text)) return;
  checkMixedStress(text, where);
  checkResolvable(text, where, lex, unresolved, { skipFragments: true });
}
function checkMixedStress(text, where, asWarning = false) {
  const parts = tokenize(text.normalize('NFC'));
  const words = parts.map((p, i) => (p.word && !isFragment(parts, i) ? p.text : null)).filter(Boolean);
  if (words.length) checkUkText(words.join(' '), where, { allowLatin: true, asWarning });
}

// ---------- Glossar-Eintrag ----------
function checkGlossEntry(g, where) {
  if (!g || typeof g !== 'object') { err(where, 'Eintrag ist kein Objekt'); return; }
  for (const f of ['uk', 'lemma', 'de', 'pos']) if (!isStr(g[f])) err(where, `Feld „${f}“ fehlt/leer`);
  if (typeof g.info !== 'string') err(where, 'Feld „info“ fehlt (String, ggf. leer)');
  if (g.pos && !POS.has(g.pos)) err(where, `ungültiges pos „${g.pos}“`);
  if (isStr(g.uk)) checkUkText(g.uk, `${where}.uk`);
  if (isStr(g.lemma)) checkUkText(g.lemma, `${where}.lemma`);
  if (isStr(g.info)) checkDeText(g.info, `${where}.info`);
  if (isStr(g.uk) && g.uk.trim().includes(' ')) warn(where, `Glossar-Eintrag mit Leerzeichen ist nicht per Tap auffindbar: „${g.uk}“`);
}

// ---------- Plan ----------
function loadPlan() {
  const p = join(ROOT, 'docs', 'a1-plan.md');
  if (!existsSync(p)) return null;
  const s = readFileSync(p, 'utf8');
  const m = s.match(/<!-- PLAN-JSON-START -->\s*```json\s*([\s\S]*?)```\s*<!-- PLAN-JSON-END -->/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch (e) { warn('docs/a1-plan.md', `Plan-JSON unlesbar: ${e.message}`); return null; }
}

// ---------- Aufgaben ----------
function optsDistinct(opts, where, key = (o) => (typeof o === 'string' ? o : JSON.stringify(o))) {
  const seen = new Set();
  for (const o of opts) {
    const k = typeof o === 'string' ? o.trim().toLowerCase().normalize('NFD').replace(/́/g, '') : key(o);
    if (seen.has(k)) err(where, `doppelte Option „${typeof o === 'string' ? o : JSON.stringify(o)}“`);
    seen.add(k);
  }
}
function countOpts(opts, where, min, max) {
  if (!isArr(opts)) { err(where, 'options fehlt'); return false; }
  if (opts.length < min || opts.length > max) err(where, `${opts.length} Optionen (erlaubt ${min}–${max})`);
  return true;
}
function sentenceCount(t) {
  return (t.match(/[^.!?…]+[.!?…]+/g) || []).length || (t.trim() ? 1 : 0);
}

// Sammelt alle ukrainischen Textfelder einer Aufgabe (für Betonung + Abdeckung) und prüft Schema.
function checkExercise(ex, where, ukTexts, deTexts) {
  const U = (v, w) => { if (isStr(v)) ukTexts.push([v, w]); else err(w, 'ukrainischer Text fehlt/leer'); };
  const D = (v, w) => { if (isStr(v)) deTexts.push([v, w]); else err(w, 'deutscher Text fehlt/leer'); };
  if (!isStr(ex.id)) err(where, 'id fehlt');
  if (!TYPES.includes(ex.type)) { err(where, `unbekannter type „${ex.type}“`); return; }
  if (!isArr(ex.vocab)) err(where, 'vocab (Array) fehlt');
  if (![1, 2, 3].includes(ex.difficulty)) err(where, 'difficulty muss 1–3 sein');
  if (ex.hint_de !== undefined) D(ex.hint_de, `${where}.hint_de`);
  switch (ex.type) {
    case 'mc_translate': {
      if (!['de-uk', 'uk-de'].includes(ex.dir)) err(where, 'dir muss de-uk oder uk-de sein');
      const ukSide = ex.dir === 'uk-de';
      (ukSide ? U : D)(ex.prompt, `${where}.prompt`);
      if (countOpts(ex.options, `${where}.options`, 3, 4)) {
        ex.options.forEach((o, i) => (ukSide ? D : U)(o, `${where}.options[${i}]`));
        optsDistinct(ex.options, `${where}.options`);
      }
      break;
    }
    case 'build_sentence': {
      if (!['de-uk', 'uk-de'].includes(ex.dir)) err(where, 'dir muss de-uk oder uk-de sein');
      const toUk = ex.dir === 'de-uk';
      (toUk ? D : U)(ex.prompt, `${where}.prompt`);
      (toUk ? U : D)(ex.answer, `${where}.answer`);
      if (ex.accept !== undefined) {
        if (!isArr(ex.accept)) err(where, 'accept muss Array sein');
        else ex.accept.forEach((a, i) => (toUk ? U : D)(a, `${where}.accept[${i}]`));
      }
      checkDistractors(ex, where, toUk ? U : D, toUk);
      break;
    }
    case 'cloze': {
      U(ex.text, `${where}.text`);
      D(ex.translation_de, `${where}.translation_de`);
      const gaps = isStr(ex.text) ? [...ex.text.matchAll(/\{\{(.+?)\}\}/g)].map((m) => m[1]) : [];
      if (gaps.length === 0) err(where, 'keine Lücke {{…}} im Text');
      if (!isArr(ex.options) || ex.options.length !== gaps.length) err(where, `options braucht genau ${gaps.length} Array(s) (eins je Lücke)`);
      else ex.options.forEach((opts, i) => {
        const w = `${where}.options[${i}]`;
        if (!isArr(opts)) { err(w, 'muss Array sein'); return; }
        if (opts.length < 2 || opts.length > 4) err(w, `${opts.length} Optionen (erlaubt 2–4)`);
        opts.forEach((o, j) => U(o, `${w}[${j}]`));
        optsDistinct(opts, w);
        if (isStr(opts[0]) && normalizeWord(opts[0]) !== normalizeWord(gaps[i])) err(w, `Index 0 („${opts[0]}“) ≠ Lückeninhalt („${gaps[i]}“)`);
      });
      break;
    }
    case 'chat': {
      D(ex.scenario_de, `${where}.scenario_de`);
      if (!ex.partner || !isStr(ex.partner.name)) err(where, 'partner.name fehlt');
      else ukTexts.push([ex.partner.name, `${where}.partner.name`]);
      if (!ex.partner || !isStr(ex.partner.emoji)) err(where, 'partner.emoji fehlt');
      if (!isArr(ex.turns) || ex.turns.length < 3) { err(where, 'turns: mind. 3'); break; }
      let me = 0;
      ex.turns.forEach((t, i) => {
        const w = `${where}.turns[${i}]`;
        if (t.who === 'bot') { U(t.uk, `${w}.uk`); D(t.de, `${w}.de`); }
        else if (t.who === 'me') {
          me++;
          if (!isArr(t.options) || t.options.length < 2 || t.options.length > 4) { err(w, 'me.options: 2–4'); return; }
          t.options.forEach((o, j) => {
            U(o.uk, `${w}.options[${j}].uk`); D(o.de, `${w}.options[${j}].de`);
            if (j > 0) D(o.feedback_de, `${w}.options[${j}].feedback_de`);
          });
          optsDistinct(t.options.map((o) => o.uk || ''), `${w}.options`);
        } else err(w, `who muss bot/me sein`);
      });
      if (me < 2) warn(where, `nur ${me} Antwortauswahl(en) im Chat`);
      break;
    }
    case 'reading': {
      U(ex.title_uk, `${where}.title_uk`);
      U(ex.text_uk, `${where}.text_uk`);
      D(ex.text_de, `${where}.text_de`);
      if (isStr(ex.text_uk)) { const n = sentenceCount(ex.text_uk); if (n < 3 || n > 8) err(where, `text_uk hat ${n} Sätze (3–8)`); }
      if (!isArr(ex.questions) || ex.questions.length < 3 || ex.questions.length > 5) { err(where, 'questions: 3–5'); break; }
      ex.questions.forEach((q, i) => {
        const w = `${where}.questions[${i}]`;
        U(q.q_uk, `${w}.q_uk`); D(q.q_de, `${w}.q_de`);
        if (q.kind === 'mc') {
          if (countOpts(q.options, `${w}.options`, 3, 4)) { q.options.forEach((o, j) => U(o, `${w}.options[${j}]`)); optsDistinct(q.options, `${w}.options`); }
        } else if (q.kind === 'tf') {
          if (typeof q.answer !== 'boolean') err(w, 'answer (bool) fehlt');
        } else err(w, 'kind muss mc oder tf sein');
      });
      break;
    }
    case 'listening': {
      U(ex.audio_uk, `${where}.audio_uk`);
      if (ex.mode === 'choose_meaning') {
        if (countOpts(ex.options, `${where}.options`, 3, 4)) { ex.options.forEach((o, i) => D(o, `${where}.options[${i}]`)); optsDistinct(ex.options, `${where}.options`); }
      } else if (ex.mode === 'choose_heard') {
        if (countOpts(ex.options, `${where}.options`, 3, 4)) {
          ex.options.forEach((o, i) => U(o, `${where}.options[${i}]`)); optsDistinct(ex.options, `${where}.options`);
          if (isStr(ex.options[0]) && isStr(ex.audio_uk) && normalizeWordSentence(ex.options[0]) !== normalizeWordSentence(ex.audio_uk)) err(where, 'choose_heard: options[0] muss audio_uk entsprechen');
        }
      } else if (ex.mode === 'build') {
        U(ex.answer, `${where}.answer`);
        if (isStr(ex.answer) && isStr(ex.audio_uk) && normalizeWordSentence(ex.answer) !== normalizeWordSentence(ex.audio_uk)) err(where, 'build: answer muss audio_uk entsprechen');
        checkDistractors(ex, where, U, true);
      } else err(where, 'mode muss choose_meaning/choose_heard/build sein');
      break;
    }
    case 'speak': U(ex.uk, `${where}.uk`); D(ex.de, `${where}.de`); break;
    case 'match_pairs': {
      if (!isArr(ex.pairs) || ex.pairs.length < 4 || ex.pairs.length > 6) { err(where, 'pairs: 4–6'); break; }
      ex.pairs.forEach((p, i) => { U(p.uk, `${where}.pairs[${i}].uk`); D(p.de, `${where}.pairs[${i}].de`); });
      optsDistinct(ex.pairs.map((p) => p.uk || ''), `${where}.pairs(uk)`);
      optsDistinct(ex.pairs.map((p) => p.de || ''), `${where}.pairs(de)`);
      break;
    }
    case 'picture_choice': {
      U(ex.prompt_uk, `${where}.prompt_uk`);
      if (countOpts(ex.options, `${where}.options`, 3, 4)) {
        ex.options.forEach((o, i) => { if (!isStr(o.emoji)) err(`${where}.options[${i}]`, 'emoji fehlt'); D(o.de, `${where}.options[${i}].de`); });
        optsDistinct(ex.options.map((o) => o.emoji || ''), `${where}.options(emoji)`);
      }
      break;
    }
    case 'true_false': {
      U(ex.statement_uk, `${where}.statement_uk`);
      if (ex.context_uk !== undefined) { U(ex.context_uk, `${where}.context_uk`); D(ex.context_de, `${where}.context_de`); }
      if (typeof ex.answer !== 'boolean') err(where, 'answer (bool) fehlt');
      D(ex.explanation_de, `${where}.explanation_de`);
      break;
    }
    case 'order_dialog': {
      if (!isArr(ex.lines) || ex.lines.length < 3 || ex.lines.length > 5) { err(where, 'lines: 3–5'); break; }
      ex.lines.forEach((l, i) => { U(l.uk, `${where}.lines[${i}].uk`); D(l.de, `${where}.lines[${i}].de`); });
      break;
    }
  }
}
function normalizeWordSentence(s) { return tokenize(s).filter((p) => p.word).map((p) => p.key).join(' '); }
function checkDistractors(ex, where, fn, uk) {
  if (!isArr(ex.distractors) || ex.distractors.length < 2 || ex.distractors.length > 4) { err(where, 'distractors: 2–4'); return; }
  const ans = new Set(uk ? normalizeWordSentence(ex.answer || '').split(' ') : String(ex.answer || '').toLowerCase().split(/[\s,.!?;:]+/));
  const acc = (ex.accept || []).flatMap((a) => (uk ? normalizeWordSentence(a) : String(a).toLowerCase()).split(/[\s,.!?;:]+/));
  ex.distractors.forEach((d, i) => {
    fn(d, `${where}.distractors[${i}]`);
    const k = uk ? normalizeWordSentence(d || '') : String(d || '').toLowerCase();
    if (ans.has(k)) err(`${where}.distractors[${i}]`, `Distraktor „${d}“ kommt in der Lösung vor`);
    else if (acc.includes(k)) warn(`${where}.distractors[${i}]`, `Distraktor „${d}“ kommt in einer accept-Variante vor`);
  });
}

// ---------- Lektion ----------
function checkLesson(lesson, meta, file, lex, knownVocab, globalVocabIds, globalConceptIds) {
  const W = file;
  if (lesson.id !== meta.id) err(W, `id „${lesson.id}“ ≠ Curriculum-id „${meta.id}“`);
  if (lesson.phase !== meta.phase) err(W, `phase „${lesson.phase}“ ≠ „${meta.phase}“`);
  for (const f of ['title_uk', 'title_de']) if (!isStr(lesson[f])) err(W, `${f} fehlt`);
  if (isStr(lesson.title_uk)) checkUkText(lesson.title_uk, `${W}.title_uk`);
  if (!THEMES.has(lesson.theme)) err(W, `ungültiges theme „${lesson.theme}“`);
  if (!isArr(lesson.goals_de) || !lesson.goals_de.length) err(W, 'goals_de fehlt');
  const ukTexts = [];
  const deTexts = [];
  const mixedTexts = [];
  if (isStr(lesson.title_uk)) ukTexts.push([lesson.title_uk, `${W}.title_uk`]);

  // Konzepte
  const ownConcepts = [];
  if (!isArr(lesson.concepts)) err(W, 'concepts (Array) fehlt');
  else {
    if (!lesson.concepts.length) warn(W, 'concepts ist leer');
    lesson.concepts.forEach((c, i) => {
      const w = `${W}.concepts[${i}]`;
      if (!c || !isStr(c.id) || !/^[a-z0-9][a-z0-9-]*$/.test(c.id)) err(w, 'id fehlt oder nicht [a-z0-9-]');
      if (!c || !isStr(c.title_de)) err(w, 'title_de fehlt');
      else mixedTexts.push([c.title_de, `${w}.title_de`]);
      if (c && isStr(c.id)) {
        if (globalConceptIds.has(c.id)) err(w, `concept-id „${c.id}“ schon in ${globalConceptIds.get(c.id)} vergeben`);
        globalConceptIds.set(c.id, meta.id);
        ownConcepts.push(c.id);
      }
    });
  }

  // Erklärung
  const ex0 = lesson.explanation;
  if (!ex0 || typeof ex0 !== 'object') err(W, 'explanation fehlt');
  else {
    const w = `${W}.explanation`;
    let words = 0;
    const count = (t) => { if (typeof t === 'string') words += t.split(/\s+/).filter(Boolean).length; };
    for (const f of ['title_de', 'intro_de']) { if (!isStr(ex0[f])) err(w, `${f} fehlt`); else { mixedTexts.push([ex0[f], `${w}.${f}`]); count(ex0[f]); } }
    if (!isArr(ex0.sections) || !ex0.sections.length) err(w, 'sections fehlt');
    else ex0.sections.forEach((sec, i) => {
      const sw = `${w}.sections[${i}]`;
      if (!isStr(sec.heading_de)) err(sw, 'heading_de fehlt'); else mixedTexts.push([sec.heading_de, `${sw}.heading_de`]);
      if (!isStr(sec.body_de)) err(sw, 'body_de fehlt'); else { mixedTexts.push([sec.body_de, `${sw}.body_de`]); count(sec.body_de); }
      if (sec.table !== undefined) {
        const t = sec.table;
        if (!t || !isArr(t.head) || !isArr(t.rows) || !t.rows.length) err(sw, 'table braucht head[] und rows[]');
        else {
          t.head.forEach((h, j) => { if (typeof h !== 'string') err(`${sw}.table.head[${j}]`, 'kein String'); else mixedTexts.push([h, `${sw}.table.head[${j}]`]); });
          t.rows.forEach((r, j) => {
            if (!isArr(r) || r.length !== t.head.length) err(`${sw}.table.rows[${j}]`, `Zeile muss ${t.head.length} Zellen haben`);
            else r.forEach((c, k) => { if (typeof c !== 'string') err(`${sw}.table.rows[${j}][${k}]`, 'kein String'); else { mixedTexts.push([c, `${sw}.table.rows[${j}][${k}]`]); count(c); } });
          });
        }
      }
      if (sec.examples !== undefined) {
        if (!isArr(sec.examples)) err(sw, 'examples muss Array sein');
        else sec.examples.forEach((e, j) => {
          if (!isStr(e.uk) || !isStr(e.de)) err(`${sw}.examples[${j}]`, '{uk, de} fehlt');
          else { ukTexts.push([e.uk, `${sw}.examples[${j}].uk`]); count(e.uk); count(e.de); }
        });
      }
    });
    if (!isArr(ex0.summary_de) || !ex0.summary_de.length) err(w, 'summary_de (Array) fehlt');
    else ex0.summary_de.forEach((t, i) => { if (!isStr(t)) err(`${w}.summary_de[${i}]`, 'leer'); else { mixedTexts.push([t, `${w}.summary_de[${i}]`]); count(t); } });
    if (words < 200) warn(w, `nur ca. ${words} Wörter (Richtwert 250–600)`);
    if (words > 800) warn(w, `ca. ${words} Wörter (Richtwert 250–600)`);
  }

  // Grammatik
  if (!isArr(lesson.grammar) || !lesson.grammar.length) err(W, 'grammar fehlt');
  else lesson.grammar.forEach((g, i) => {
    const w = `${W}.grammar[${i}]`;
    if (!isStr(g.title_de)) err(w, 'title_de fehlt');
    if (!isStr(g.body_de)) err(w, 'body_de fehlt');
    else {
      const n = g.body_de.split(/\s+/).length;
      if (n > 110) warn(w, `body_de hat ${n} Wörter (Richtwert ≤ 80)`);
      mixedTexts.push([g.body_de, `${w}.body_de`]);
    }
    if (!isArr(g.examples) || !g.examples.length) err(w, 'examples fehlt');
    else g.examples.forEach((e, j) => { if (isStr(e.uk)) ukTexts.push([e.uk, `${w}.examples[${j}].uk`]); else err(`${w}.examples[${j}]`, 'uk fehlt'); if (!isStr(e.de)) err(`${w}.examples[${j}]`, 'de fehlt'); });
  });

  // Vokabeln
  const ownIds = new Set();
  if (!isArr(lesson.vocab) || !lesson.vocab.length) err(W, 'vocab fehlt');
  else lesson.vocab.forEach((v, i) => {
    const w = `${W}.vocab[${i}]${v && v.id ? `(${v.id})` : ''}`;
    if (!isStr(v.id) || !/^[a-z0-9_]+$/.test(v.id)) err(w, 'id fehlt oder nicht ASCII [a-z0-9_]');
    else {
      if (globalVocabIds.has(v.id)) err(w, `vocab-id „${v.id}“ schon in ${globalVocabIds.get(v.id)} vergeben`);
      globalVocabIds.set(v.id, meta.id);
      ownIds.add(v.id);
    }
    for (const f of ['uk', 'de', 'pos']) if (!isStr(v[f])) err(w, `${f} fehlt`);
    if (typeof v.info !== 'string') err(w, 'info fehlt (String)');
    if (v.pos && !POS.has(v.pos)) err(w, `ungültiges pos „${v.pos}“`);
    if (isStr(v.uk)) { checkUkText(v.uk, `${w}.uk`); ukTexts.push([v.uk, `${w}.uk`]); }
    if (!v.example || !isStr(v.example.uk) || !isStr(v.example.de)) err(w, 'example {uk, de} fehlt');
    else ukTexts.push([v.example.uk, `${w}.example.uk`]);
    if (v.forms !== undefined) {
      if (!isArr(v.forms)) err(w, 'forms muss Array sein');
      else v.forms.forEach((f, j) => {
        if (!isStr(f.uk) || typeof f.info !== 'string') err(`${w}.forms[${j}]`, '{uk, info} fehlt');
        else { checkUkText(f.uk, `${w}.forms[${j}].uk`); if (f.uk.trim().includes(' ')) warn(`${w}.forms[${j}]`, `Form mit Leerzeichen ist nicht tippbar: „${f.uk}“`); }
      });
    }
  });
  if (isArr(lesson.vocab) && (lesson.vocab.length < 12 || lesson.vocab.length > 30)) warn(W, `${lesson.vocab.length} Vokabeln (Richtwert 15–25)`);

  // Glossar
  if (lesson.glossary !== undefined && !isArr(lesson.glossary)) err(W, 'glossary muss Array sein');
  (lesson.glossary || []).forEach((g, i) => checkGlossEntry(g, `${W}.glossary[${i}]`));

  // Aufgaben
  const exs = lesson.exercises;
  if (!isArr(exs)) { err(W, 'exercises fehlt'); return; }
  if (exs.length < 45) err(W, `nur ${exs.length} Aufgaben (mind. 45)`);
  const ids = new Set();
  const byType = Object.fromEntries(TYPES.map((t) => [t, 0]));
  const usage = new Map();
  const allKnown = new Set([...knownVocab, ...ownIds]);
  exs.forEach((ex, i) => {
    const w = `${W}.exercises[${i}]${ex && ex.id ? `(${ex.id})` : ''}`;
    if (ids.has(ex.id)) err(w, `doppelte Aufgaben-id „${ex.id}“`);
    ids.add(ex.id);
    if (byType[ex.type] !== undefined) byType[ex.type]++;
    checkExercise(ex, w, ukTexts, deTexts);
    for (const vid of ex.vocab || []) {
      if (!allKnown.has(vid)) err(w, `unbekannte vocab-id „${vid}“`);
      usage.set(vid, (usage.get(vid) || 0) + 1);
    }
  });
  for (const t of TYPES) if (!byType[t]) err(W, `Aufgabentyp „${t}“ fehlt`);
  const mins = { chat: 3, reading: 2, speak: 5, listening: 6 };
  for (const [t, n] of Object.entries(mins)) if (byType[t] < n) err(W, `${t}: ${byType[t]} (mind. ${n})`);
  for (const id of ownIds) {
    const n = usage.get(id) || 0;
    if (n < 3) err(W, `Vokabel „${id}“ wird nur in ${n} Aufgabe(n) geübt (mind. 3)`);
  }
  // Wiederholte identische Sätze (Hinweis)
  const seen = new Map();
  for (const ex of exs) {
    const s = ex.type === 'speak' ? ex.uk : ex.type === 'listening' ? ex.audio_uk : null;
    if (!s) continue;
    const k = normalizeWordSentence(s);
    if (seen.has(k)) warn(W, `gleicher Satz in ${seen.get(k)} und ${ex.id}: „${s}“`);
    else seen.set(k, ex.id);
  }

  // Text- und Abdeckungsprüfung
  const thisLex = lex.clone();
  addLessonToLexicon(thisLex, lesson, meta.id);
  const unresolved = new Map();
  for (const [t, w] of ukTexts) { checkUkText(t, w); checkResolvable(t, w, thisLex, unresolved); }
  for (const [t, w] of deTexts) checkDeText(t, w);
  for (const [t, w] of mixedTexts) checkMixedText(t, w, thisLex, unresolved);
  for (const [k, w] of unresolved) err(w, `Wort nicht auflösbar (Glossar/Vokabel fehlt): „${k}“`);
  return { counts: byType, total: exs.length, ownIds, ownConcepts };
}

// ---------- Hauptlauf ----------
const cur = readJson(C('curriculum.json'), 'curriculum.json');
const ui = readJson(C('ui-strings.json'), 'ui-strings.json');
const common = readJson(C('glossary-common.json'), 'glossary-common.json');

const baseLex = new Lexicon();
if (isArr(common)) common.forEach((g, i) => { checkGlossEntry(g, `glossary-common[${i}]`); baseLex.add(g.uk, 'common'); });
else if (common) err('glossary-common.json', 'muss ein Array sein');

if (ui) {
  for (const k of UI_KEYS) if (!ui[k]) err('ui-strings.json', `Pflicht-Key „${k}“ fehlt`);
  const unresolved = new Map();
  for (const [k, v] of Object.entries(ui)) {
    if (!v || !isStr(v.uk) || !isStr(v.de)) { err(`ui-strings.${k}`, '{uk, de} fehlt'); continue; }
    checkUkText(v.uk, `ui-strings.${k}.uk`);
    checkResolvable(v.uk, `ui-strings.${k}.uk`, baseLex, unresolved);
  }
  for (const [kk, w] of unresolved) err(w, `Wort nicht über glossary-common auflösbar: „${kk}“`);
}

const lessonsMeta = [];
if (cur) {
  if (cur.version !== 1) err('curriculum.json', 'version muss 1 sein');
  if (!isStr(cur.targetDate)) err('curriculum.json', 'targetDate fehlt');
  if (!isArr(cur.phases)) err('curriculum.json', 'phases fehlt');
  const lids = new Set();
  const curConcepts = new Map();
  (cur.phases || []).forEach((ph, pi) => {
    const w = `curriculum.phases[${pi}]`;
    for (const f of ['id', 'title_uk', 'title_de', 'start', 'end', 'summary_de']) if (!isStr(ph[f])) err(w, `${f} fehlt`);
    if (isStr(ph.title_uk)) checkUkText(ph.title_uk, `${w}.title_uk`);
    (ph.lessons || []).forEach((l, li) => {
      const lw = `${w}.lessons[${li}](${l.id})`;
      if (!isStr(l.id) || lids.has(l.id)) err(lw, 'id fehlt oder doppelt');
      lids.add(l.id);
      for (const f of ['title_uk', 'title_de']) if (!isStr(l[f])) err(lw, `${f} fehlt`);
      if (isStr(l.title_uk)) checkUkText(l.title_uk, `${lw}.title_uk`);
      if (!THEMES.has(l.theme)) err(lw, `ungültiges theme „${l.theme}“`);
      if (!['ready', 'planned'].includes(l.status)) err(lw, `status „${l.status}“ ungültig`);
      if (!isArr(l.goals_de) || !l.goals_de.length) err(lw, 'goals_de fehlt');
      if (l.status === 'ready' && !isStr(l.file)) err(lw, 'file fehlt');
      if (l.status === 'planned') {
        if (!isArr(l.grammar_de) || !l.grammar_de.length) err(lw, 'grammar_de fehlt');
        if (!isArr(l.vocab_fields_de) || !l.vocab_fields_de.length) err(lw, 'vocab_fields_de fehlt');
      }
      if (!isArr(l.concepts)) err(lw, 'concepts (Array) fehlt');
      else l.concepts.forEach((c, ci) => {
        if (!c || !isStr(c.id) || !isStr(c.title_de)) err(`${lw}.concepts[${ci}]`, '{id, title_de} fehlt');
        else { if (curConcepts.has(c.id)) err(`${lw}.concepts[${ci}]`, `concept-id „${c.id}“ doppelt (auch ${curConcepts.get(c.id)})`); curConcepts.set(c.id, l.id); checkMixedStress(c.title_de, `${lw}.concepts[${ci}].title_de`); }
      });
      lessonsMeta.push({ ...l, phase: ph.id });
    });
  });
}

const plan = loadPlan();
const planById = new Map((plan?.lessons || []).map((l) => [l.id, l]));
const lex = baseLex.clone();
const knownVocab = new Set();
const globalVocabIds = new Map();
const globalConceptIds = new Map();
const stats = [];
let reached = !onlyLesson;
// Dateien in content/a1-1, die nicht im Curriculum stehen
const listed = new Set(lessonsMeta.map((l) => l.file).filter(Boolean));
if (existsSync(C('a1-1'))) for (const f of readdirSync(C('a1-1'))) if (f.endsWith('.json') && !listed.has(`a1-1/${f}`)) warn(`content/a1-1/${f}`, 'nicht im Curriculum verzeichnet');

for (const meta of lessonsMeta) {
  if (meta.status !== 'ready') continue;
  const path = C(meta.file);
  const isTarget = onlyLesson ? meta.id === onlyLesson : true;
  if (onlyLesson && meta.id === onlyLesson) reached = true;
  const exists = existsSync(path);
  if (!exists) {
    if (onlyLesson) {
      // Platzhalter: geplanter Wortschatz früherer Lektionen
      const p = planById.get(meta.id);
      if (!isTarget && p && !reached) for (const v of p.vocab) { lex.add(v.uk, `${meta.id}(Plan)`); knownVocab.add(v.id); globalVocabIds.set(v.id, `${meta.id}(Plan)`); }
      if (isTarget) err(meta.file, 'Datei fehlt');
    } else err(meta.file, 'Datei fehlt');
    if (reached && onlyLesson && isTarget) break;
    continue;
  }
  const lesson = readJson(path, meta.file);
  if (!lesson) continue;
  if (onlyLesson && !isTarget) {
    if (reached) break; // spätere Lektionen nicht relevant
    // frühere Lektion: nur ins Lexikon übernehmen (+ Plan als Ergänzung)
    addLessonToLexicon(lex, lesson, meta.id);
    for (const v of lesson.vocab || []) { knownVocab.add(v.id); globalVocabIds.set(v.id, meta.id); }
    const p = planById.get(meta.id);
    if (p) for (const v of p.vocab) { lex.add(v.uk, `${meta.id}(Plan)`); knownVocab.add(v.id); if (!globalVocabIds.has(v.id)) globalVocabIds.set(v.id, `${meta.id}(Plan)`); }
    continue;
  }
  const res = checkLesson(lesson, meta, `content/${meta.file}`, lex, knownVocab, globalVocabIds, globalConceptIds);
  // Plan-Abgleich (Hinweise)
  const p = planById.get(meta.id);
  if (p && res) {
    const planned = new Map(p.vocab.map((v) => [v.id, v]));
    for (const v of lesson.vocab || []) {
      const pv = planned.get(v.id);
      if (!pv) warn(`content/${meta.file}`, `Vokabel „${v.id}“ nicht im Plan`);
      else if (pv.uk.normalize('NFC') !== String(v.uk).normalize('NFC')) warn(`content/${meta.file}`, `Vokabel „${v.id}“: uk „${v.uk}“ ≠ Plan „${pv.uk}“`);
    }
    for (const id of planned.keys()) if (!res.ownIds.has(id)) err(`content/${meta.file}`, `geplante Vokabel „${id}“ fehlt`);
    const pc = new Set((p.concepts || []).map((c) => c.id));
    for (const id of pc) if (!res.ownConcepts.includes(id)) err(`content/${meta.file}`, `geplantes Konzept „${id}“ fehlt in concepts`);
    for (const id of res.ownConcepts) if (!pc.has(id)) warn(`content/${meta.file}`, `Konzept „${id}“ nicht im Plan`);
    const cc = new Set((meta.concepts || []).map((c) => c.id));
    for (const id of res.ownConcepts) if (!cc.has(id)) warn(`content/${meta.file}`, `Konzept „${id}“ fehlt in curriculum.json`);
  }
  addLessonToLexicon(lex, lesson, meta.id);
  for (const v of lesson.vocab || []) knownVocab.add(v.id);
  if (res) stats.push({ id: meta.id, ...res });
  if (onlyLesson) break;
}
if (onlyLesson && !lessonsMeta.some((l) => l.id === onlyLesson)) err('curriculum.json', `Lektion „${onlyLesson}“ nicht gefunden`);

// ---------- Ausgabe ----------
for (const s of stats) {
  const c = Object.entries(s.counts).map(([k, v]) => `${k}:${v}`).join(' ');
  console.log(`${s.id}: ${s.total} Aufgaben (${c})`);
}
if (!quiet && warnings.length) {
  console.log(`\nWarnungen (${warnings.length}):`);
  for (const w of warnings) console.log('  ⚠ ' + w);
}
if (errors.length) {
  console.log(`\nFehler (${errors.length}):`);
  for (const e of errors) console.log('  ✗ ' + e);
}
const fail = errors.length > 0 || (strictWarn && warnings.length > 0);
console.log(`\n${fail ? 'FEHLGESCHLAGEN' : 'OK'} – ${errors.length} Fehler, ${warnings.length} Warnungen, ${stats.length} Lektion(en) geprüft.`);
process.exit(fail ? 1 : 0);
