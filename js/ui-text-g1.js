// UI-Texte Gruppe 1 (Heute, Kurs, Lektion, Zusammenfassung, Geschichte) – wird in js/ui-text.js zusammengeführt.
// Format wie dort: key → {uk, de}. Dynamische Texte als Vorlage mit Platzhaltern (→ uiN):
//   {a}, {b}             Zahl (Dezimalkomma)
//   {days@a}             Substantiv in der zur Zahl a passenden Form (1 день · 2–4 дні · 5+ днів · 1,5 дня)
//   {days@a:gen}         Genitiv nach „з“ (з 1 дня · з 5 днів)
//   deutsch: {Tag|Tage@a} → Singular bei a = 1, sonst Plural
// Alle Formen stehen zusätzlich als eigene Einträge (forms_*), damit tools/check-ui-text.mjs sie gegen das Lexikon prüft.

export const UI_G1 = {
  // ---------- Formen (für Zahl-Kongruenz und Datum) ----------
  forms_days: { uk: 'день · дні · днів · дня', de: 'Tag · Tage' },
  forms_lessons: { uk: 'уро́к · уро́ки · уро́ків · уро́ку', de: 'Lektion · Lektionen' },
  forms_words: { uk: 'сло́во · слова́ · слів · сло́ва', de: 'Wort · Wörter' },
  forms_tasks: { uk: 'завда́ння · завда́нь', de: 'Aufgabe · Aufgaben' },
  forms_sessions: { uk: 'се́сія · се́сії · се́сій', de: 'Session · Sessions' },
  weekdays: { uk: 'понеді́лок · вівто́рок · середа́ · четве́р · п’я́тниця · субо́та · неді́ля', de: 'Montag … Sonntag' },
  weekdays_short: { uk: 'пн · вт · ср · чт · пт · сб · нд', de: 'Mo … So' },
  months_gen: { uk: 'сі́чня · лю́того · бе́резня · кві́тня · тра́вня · че́рвня · ли́пня · се́рпня · ве́ресня · жо́втня · листопа́да · гру́дня', de: 'Januar … Dezember' },

  // ---------- Heute ----------
  streak_shield: { uk: 'Захи́ст се́рії', de: 'Streak-Schutz' },
  streak_repair: { uk: 'Вряту́й се́рію: сього́дні {a} {tasks@a}', de: 'Serie retten: heute {a} {Aufgabe|Aufgaben@a}' },
  streak_restart: { uk: 'Нови́й старт. До́бре, що ти тут!', de: 'Neuer Anlauf – schön, dass du da bist' },
  streak_begin: { uk: 'Почни́ се́рію', de: 'Starte deine Serie' },
  streak_risk: { uk: 'Учи́ся сього́дні – збережи́ се́рію!', de: 'Heute lernen hält die Serie' },
  streak_days: { uk: '{days@a} по́спіль', de: '{Tag|Tage@a} in Folge' },
  streak_days_n: { uk: '{a} {days@a} по́спіль', de: '{a} {Tag|Tage@a} in Folge' },
  streak_aria: { uk: 'Се́рія: {a} {days@a}', de: 'Serie {a} {Tag|Tage@a}' },
  week_count: { uk: '{a} з {b} {days@b:gen}', de: '{a} von {b} Tagen' },
  goal_done: { uk: 'Мету́ дося́гнуто!', de: 'Tagesziel geschafft!' },
  one_session: { uk: 'Сього́дні доста́тньо одніє́ї се́сії.', de: 'Eine Session reicht für heute.' },
  tasks_left: { uk: 'Ще {a} {tasks@a} до мети́.', de: 'Noch {a} {Aufgabe|Aufgaben@a} bis zum Ziel.' },
  next_lesson_cap: { uk: 'Да́лі · Уро́к {a}', de: 'Als Nächstes · Lektion {a}' },
  continue_lesson_cap: { uk: 'Да́лі · Уро́к {a}', de: 'Weiter mit · Lektion {a}' },
  review_day: { uk: 'Сього́дні день повто́рення: спе́ршу старе́, по́тім нове́.', de: 'Heute ist Wiederholungstag – erst das Fällige, dann Neues.' },
  review_n: { uk: 'Повтори́ти · {a}', de: 'Wiederholen · {a} fällig' },
  nothing_due: { uk: 'Усе́ повто́рено! Мо́жеш потренува́ти слабкі́ слова́.', de: 'Nichts fällig – eine Runde festigt die schwächsten Wörter.' },
  goal_a1: { uk: 'Мета́ A1', de: 'Ziel' },
  until_days_left: { uk: 'до {date} · ще {a} {days@a}', de: 'bis {date} · noch {a} {Tag|Tage@a}' },
  plan_today: { uk: 'План на сього́дні', de: 'Soll heute' },
  lessons_of: { uk: 'з {b} {lessons@b:gen}', de: 'von {b} Lektionen' },
  plan_today_n: { uk: 'План на сього́дні: {a}', de: 'Soll heute: {a}' },
  until_date: { uk: 'до {date}', de: 'bis {date}' },
  per_week: { uk: '{a} {lessons@a} на ти́ждень', de: '{a} Lektionen/Woche' },
  recommended: { uk: 'Рекомендо́вано', de: 'empfohlen' },
  strong_n: { uk: 'Наді́йно: {a}', de: '{a} sicher' },
  last_7_days: { uk: 'Оста́нні 7 днів', de: 'letzte 7 Tage' },
  to_review: { uk: 'Тре́ба повтори́ти', de: 'zum Wiederholen' },
  all_done: { uk: 'Усе́ зро́блено', de: 'alles erledigt' },
  in_7_days: { uk: 'За 7 днів', de: 'diese 7 Tage' },
  competence: { uk: 'Ти впізнає́ш {a} {words@a}. {b} з них уже́ мо́жеш сказа́ти.', de: 'Du erkennst {a} {Wort|Wörter@a} und hast {b} schon selbst gesagt.' },
  first_words: { uk: 'Пе́рші слова́ чека́ють в уро́ці 1.', de: 'Deine ersten Wörter warten in Lektion 1.' },
  tool_vocab_sub: { uk: 'Ка́ртки, слу́хання, складні́ слова́', de: 'Karten, Hören, schwierige Wörter' },
  tool_games_sub: { uk: 'Кросво́рд, па́ри – без зву́ку', de: 'Kreuzworträtsel, Paare – ganz ohne Ton' },
  tool_sound_sub: { uk: 'Зара́з не мо́жеш слу́хати чи говори́ти?', de: 'Gerade nicht hören oder sprechen?' },

  // ---------- Kurs ----------
  course_sub: { uk: 'A1 до {date} · {a} з {b} {lessons@b:gen}', de: 'A1 bis {date} · {a} von {b} Lektionen' },
  phase_soon_n: { uk: 'Ско́ро: {a}', de: '{a} in Vorbereitung' },
  phase_planned_n: { uk: 'У пла́ні: {a}', de: '{a} geplant' },
  mastery_pct: { uk: 'Майсте́рність: {a} %', de: '{a} % Meisterschaft' },
  lesson_num: { uk: 'Уро́к {a}', de: 'Lektion {a}' },

  // ---------- Lektion ----------
  lesson_prep_note: { uk: 'Цей уро́к ско́ро бу́де гото́вий.', de: 'Die Inhalte dieser Lektion werden gerade fertiggestellt.' },
  lesson_planned_note: { uk: 'Цей уро́к у пла́ні: мета́ і те́ми вже відо́мі.', de: 'Diese Lektion ist geplant – Ziele und Themen stehen schon fest.' },
  lesson_not_found: { uk: 'Уро́к не зна́йдено.', de: 'Lektion nicht gefunden.' },
  lesson_locked: { uk: 'Уро́к ще закри́тий', de: 'Noch nicht freigeschaltet' },
  lesson_locked_msg: { uk: 'Спе́ршу закінчи́ попере́дній уро́к. Усе́ одно́ поча́ти?', de: 'Empfohlen ist, zuerst die vorherige Lektion einmal abzuschließen. Trotzdem starten?' },
  start_anyway: { uk: 'Усе́ одно́ поча́ти', de: 'Trotzdem starten' },
  cancel: { uk: 'Скасува́ти', de: 'Abbrechen' },
  words_learned_of: { uk: 'Ви́вчено {a} з {b} {words@b:gen}', de: '{a} von {b} Wörtern eingeführt' },
  sessions_n: { uk: '{a} {sessions@a}', de: '{a} {Session|Sessions@a}' },
  level_n: { uk: 'Рі́вень {a}', de: 'Stufe {a}' },
  story_text: { uk: 'Текст уро́ку', de: 'Ankertext der Lektion' },
  strength_bars: { uk: 'Сму́жки – си́ла сло́ва в па́м’яті.', de: 'Balken = Stärke im Gedächtnis (wächst mit Wiederholungen).' },

  // ---------- Zusammenfassung ----------
  correct_of: { uk: '{a} з {b} {tasks@b:gen} пра́вильно', de: '{a} von {b} Aufgaben richtig' },
  words_reviewed: { uk: 'Повто́рено: {a} {words@a}', de: '{a} {Wort|Wörter@a} wiederholt' },
  session_over: { uk: 'Се́сію заве́ршено', de: 'Session beendet' },
  tasks_today: { uk: '{a} / {b} {tasks@b} сього́дні', de: '{a} / {b} Aufgaben heute' },
  streak_extended: { uk: 'Се́рія трива́є – до за́втра!', de: 'Serie verlängert – bis morgen!' },
  streak_counted: { uk: 'Сього́дні вже зарахо́вано', de: 'Heute schon gezählt' },

  // ---------- Geschichte ----------
  story_unavailable: { uk: 'Цей уро́к ще не гото́вий.', de: 'Diese Lektion ist noch nicht verfügbar.' },
  story_none: { uk: 'У цьо́му уро́ці нема́є істо́рії.', de: 'Für diese Lektion gibt es keine Geschichte.' },
  read_once_more: { uk: 'Ще раз', de: 'Noch einmal lesen' },
  save_sentence: { uk: 'Зберегти́ ре́чення', de: 'Satz merken' },
  story_sentence_saved: { uk: 'Ре́чення збере́жено в «Слова́»', de: 'Satz unter Vokabeln gespeichert' },
  shadowing: { uk: 'Повто́рюй', de: 'Shadowing' },
  shadowing_hint: { uk: 'Слу́хай → повто́рюй → слу́хай', de: 'Hören → nachsprechen → nochmal hören' },
  translation: { uk: 'Перекла́д', de: 'Übersetzung' },
  new_forms: { uk: 'Нові́ фо́рми', de: 'Neue Formen' },
  story_guess_hint: { uk: 'Підкре́слені слова́ – нові́. Торкни́ся сло́ва і спе́ршу вгада́й!', de: 'Gepunktet unterstrichene Wörter sind neu. Tippe darauf und rate zuerst – das hilft beim Behalten, auch wenn du falsch liegst.' },
  story_review_hint: { uk: 'Тепе́р без перекла́ду. Чи розумі́єш істо́рію?', de: 'Jetzt ohne Übersetzung: Verstehst du die Geschichte? Neue Formen sind markiert.' },
  story_to_explanation: { uk: 'Да́лі: поя́снення', de: 'Weiter zur Erklärung' },
  story_to_exercises: { uk: 'Да́лі: впра́ви', de: 'Weiter zu den Übungen' },
  how_much_understood: { uk: 'Наскі́льки зрозумі́ло?', de: 'Wie viel hast du verstanden?' },
  understood_most_all: { uk: 'Ма́йже все', de: 'Fast alles' },
  understood_most: { uk: 'Бі́льшість', de: 'Das meiste' },
  understood_little: { uk: 'Ма́ло', de: 'Wenig' },
  praise_great: { uk: 'Чудо́во!', de: 'Großartig – genau so wächst Verstehen.' },
  praise_good: { uk: 'До́бре! Да́лі бу́де ще кра́ще.', de: 'Gut! Beim nächsten Mal noch mehr.' },
  praise_little: { uk: 'Нічо́го! Торкни́ся слів і послу́хай ще раз.', de: 'Kein Problem – tippe Wörter an und hör noch einmal zu.' },
  story_practice: { uk: 'Тренува́ти уро́к', de: 'Lektion üben' },
};

// ---------- Zahl-Kongruenz ----------
// [1 · 2–4 · 5+ (Gen. Pl.) · Gen. Sg. (für Dezimalzahlen und „з 1 …“)]
const NOUNS = {
  days: ['день', 'дні', 'днів', 'дня'],
  lessons: ['уро́к', 'уро́ки', 'уро́ків', 'уро́ку'],
  words: ['сло́во', 'слова́', 'слів', 'сло́ва'],
  tasks: ['завда́ння', 'завда́ння', 'завда́нь', 'завда́ння'],
  sessions: ['се́сія', 'се́сії', 'се́сій', 'се́сії'],
};

/** Ukrainische Pluralform zu n: pluralUk(5, ['день','дні','днів','дня']) → 'днів'. Dezimalzahlen → Gen. Sg. */
export function pluralUk(n, forms) {
  const [one, few, many, gen = many] = forms;
  if (!Number.isInteger(n)) return gen;
  const a = Math.abs(n), d = a % 10, dd = a % 100;
  if (d === 1 && dd !== 11) return one;
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return few;
  return many;
}

/** Genitiv nach „з“: з 1 дня · з 2 / 5 днів. */
export function genUk(n, forms) {
  const a = Math.abs(n);
  return Number.isInteger(n) && a % 10 === 1 && a % 100 !== 11 ? forms[3] : forms[2];
}

const num = v => (typeof v === 'number' ? String(v).replace('.', ',') : String(v ?? ''));

function fill(str, vars, de) {
  return str.replace(/\{([^{}@:]+)(?:@(\w+))?(?::(gen))?\}/g, (m, name, ref, gen) => {
    if (!ref) return name in vars ? num(vars[name]) : m;
    const n = Number(vars[ref]);
    if (de) { const [one, many] = name.split('|'); return n === 1 ? one : many ?? one; }
    const forms = NOUNS[name];
    if (!forms) return m;
    return gen ? genUk(n, forms) : pluralUk(n, forms);
  });
}

/** Vorlage aus UI_G1 mit Werten füllen → {uk, de}. uiN('tasks_left', {a: 3}) */
export function uiN(key, vars = {}) {
  const t = UI_G1[key] || { uk: key, de: key };
  return { uk: fill(t.uk, vars, false), de: fill(t.de, vars, true) };
}

// ---------- Datum ----------
const WD = UI_G1.weekdays.uk.split(' · ');          // Mo … So
const WD_SHORT = UI_G1.weekdays_short.uk.split(' · ');
const MON = UI_G1.months_gen.uk.split(' · ');

const toDate = d => (d instanceof Date ? d : new Date(String(d).length === 10 ? `${d}T12:00:00` : d));

/** „субо́та, 7 листопа́да“ / „Samstag, 7. November“; Optionen: weekday (Standard true), year. */
export function dateUk(d, { weekday = true, year = false } = {}) {
  const dt = toDate(d);
  if (Number.isNaN(dt.getTime())) return { uk: '–', de: '–' };
  const wd = WD[(dt.getDay() + 6) % 7];
  const uk = `${weekday ? wd + ', ' : ''}${dt.getDate()} ${MON[dt.getMonth()]}${year ? ' ' + dt.getFullYear() : ''}`;
  const de = dt.toLocaleDateString('de-DE', { ...(weekday ? { weekday: 'long' } : {}), day: 'numeric', month: 'long', ...(year ? { year: 'numeric' } : {}) });
  return { uk, de };
}

/** Kurzer Wochentag (пн … нд) zu einem Datum bzw. Index 0 = Montag. */
export function weekdayShortUk(d) {
  if (typeof d === 'number') return WD_SHORT[d] || '';
  return WD_SHORT[(toDate(d).getDay() + 6) % 7];
}
