// UI-Texte Gruppe 3 (wird in js/ui-text.js zusammengeführt). Format wie dort: key → {uk, de}.
// Bereiche: Einstellungen, Meldungen, Melde-/Ton-Sheet, Dialoge/Toasts, Session-Rahmen, Bedientexte der Aufgaben.
// Zahl-Kongruenz: ukCount(n, 'report') → „1 повідо́млення“ / „5 повідо́млень“ (Formen unten als pl_* geprüft).

/** Ukrainische Pluralformen: [1, 2–4, 5+] (Nominativ bzw. Akkusativ nach Zahl). de: [Singular, Plural]. */
export const UK_PLURALS = {
  report: { uk: ['повідо́млення', 'повідо́млення', 'повідо́млень'], de: ['Meldung', 'Meldungen'] },
  day: { uk: ['день', 'дні', 'днів'], de: ['Tag', 'Tage'] },
  minute_acc: { uk: ['хвили́ну', 'хвили́ни', 'хвили́н'], de: ['Minute', 'Minuten'] },
  line: { uk: ['ре́чення', 'ре́чення', 'ре́чень'], de: ['Zeile', 'Zeilen'] },
};

/** Index der ukrainischen Pluralform: 0 = один, 1 = два–чотири, 2 = п’ять+ (11–14 → 2). */
export function ukPluralIndex(n) {
  const a = Math.abs(Math.trunc(Number(n) || 0));
  const m10 = a % 10, m100 = a % 100;
  if (m10 === 1 && m100 !== 11) return 0;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 1;
  return 2;
}

/** Nur das Wort in passender Form: ukWord(5, 'day') → {uk:'днів', de:'Tage'} */
export function ukWord(n, kind) {
  const p = UK_PLURALS[kind];
  if (!p) return { uk: '', de: '' };
  return { uk: p.uk[ukPluralIndex(n)], de: Math.abs(n) === 1 ? p.de[0] : p.de[1] };
}

/** Zahl + Wort: ukCount(3, 'report') → {uk:'3 повідо́млення', de:'3 Meldungen'} */
export function ukCount(n, kind) {
  const w = ukWord(n, kind);
  return { uk: `${n} ${w.uk}`, de: `${n} ${w.de}` };
}

export const UI_G3 = {
  // ---------- Allgemein: Dialoge, Toasts ----------
  cancel: { uk: 'Скасува́ти', de: 'Abbrechen' },
  ok: { uk: 'До́бре', de: 'OK' },
  error: { uk: 'Поми́лка', de: 'Fehler' },
  attention: { uk: 'Ува́га', de: 'Hinweis' },
  saved: { uk: 'Збере́жено', de: 'Gespeichert' },
  deleted: { uk: 'Ви́далено', de: 'Gelöscht' },
  all_deleted: { uk: 'Усе́ ви́далено', de: 'Alles gelöscht' },
  copied: { uk: 'Скопійо́вано', de: 'In die Zwischenablage kopiert' },
  opened: { uk: 'Відкри́то', de: 'In neuem Tab geöffnet' },
  never: { uk: 'ніко́ли', de: 'noch nie' },
  just_now: { uk: 'що́йно', de: 'gerade eben' },
  today_at: { uk: 'сього́дні', de: 'heute' },
  yesterday_at: { uk: 'учо́ра', de: 'gestern' },
  ago: { uk: 'тому́', de: 'vor' },
  until: { uk: 'до', de: 'bis' },
  tomorrow: { uk: 'за́втра', de: 'morgen' },
  forever: { uk: 'Наза́вжди', de: 'dauerhaft' },
  unavailable: { uk: 'Недосту́пно', de: 'Nicht unterstützt' },
  only_here: { uk: 'Ті́льки на цьому́ при́строї', de: 'nur auf diesem Gerät' },
  file_saved: { uk: 'Файл збере́жено', de: 'Datei heruntergeladen' },
  file_loaded: { uk: 'Файл заванта́жено', de: 'Backup importiert' },
  no_token: { uk: 'Нема́є то́кена', de: 'Kein GitHub-Token' },
  sync_error: { uk: 'Поми́лка синхроніза́ції', de: 'Sync fehlgeschlagen' },

  // ---------- Einstellungen ----------
  app_title: { uk: 'Мо́ва · A1', de: 'Ukrainisch A1' },
  no_target_date: { uk: 'Нема́є да́ти', de: 'Kein Zieldatum' },
  days_ago: { uk: 'тому́', de: 'Tage drüber' },
  temporarily: { uk: 'Тимчасо́во', de: 'zeitweise' },
  auto_option: { uk: 'Автомати́чно', de: 'Automatisch' },
  no_uk_voice: { uk: 'Нема́є украї́нського го́лосу', de: 'Keine ukrainische Stimme installiert' },
  no_voice: { uk: 'Нема́є го́лосу', de: 'Sprachausgabe nicht verfügbar' },
  not_synced_n: { uk: 'Не синхронізо́вано', de: 'nicht synchronisiert' },
  all_synced: { uk: 'Усе́ синхронізо́вано', de: 'alle synchronisiert' },
  token: { uk: 'То́кен', de: 'GitHub-Token' },
  token_saved: { uk: 'То́кен збере́жено', de: 'Token gespeichert (nur auf diesem Gerät)' },
  token_removed: { uk: 'То́кен ви́далено', de: 'Token entfernt' },
  create_token: { uk: 'Створи́ти то́кен', de: 'Token erstellen' },
  check_token: { uk: 'Переві́рити то́кен', de: 'Token prüfen' },
  token_ok: { uk: 'То́кен пра́цює', de: 'Token gültig' },
  gist_later: { uk: 'Ще нема́є', de: 'wird beim ersten Sync angelegt' },
  auto_sync_reports: { uk: 'Автомати́чно синхронізува́ти повідо́млення', de: 'Meldungen automatisch syncen' },
  auto_save_progress: { uk: 'Автомати́чно зберіга́ти прогре́с', de: 'Fortschritt automatisch sichern' },
  last_sync: { uk: 'Оста́ння синхроніза́ція', de: 'Letzter Sync' },
  last_backup: { uk: 'Оста́ннє збере́ження', de: 'Letzte Sicherung' },
  synced_toast: { uk: 'Синхронізо́вано', de: 'Meldungen synchronisiert' },
  gist_created: { uk: 'Синхронізо́вано', de: 'Privater Gist angelegt – Meldungen synchronisiert' },
  progress_saved: { uk: 'Прогре́с збере́жено', de: 'Fortschritt im Gist gesichert' },
  restore_q: { uk: 'Віднови́ти прогре́с?', de: 'Fortschritt wiederherstellen?' },
  restore: { uk: 'Віднови́ти', de: 'Wiederherstellen' },
  progress_restored: { uk: 'Прогре́с відно́влено', de: 'Fortschritt wiederhergestellt' },
  import_q: { uk: 'Заванта́жити файл?', de: 'Backup importieren?' },
  import: { uk: 'Заванта́жити', de: 'Importieren' },
  reset_q: { uk: 'Поча́ти з нуля́?', de: 'Wirklich alles zurücksetzen?' },
  reset_ok: { uk: 'Поча́ти з нуля́', de: 'Zurücksetzen' },
  install_app: { uk: 'Встанови́ застосу́нок', de: 'Zum Home-Bildschirm hinzufügen' },
  playback_error: { uk: 'Поми́лка', de: 'Wiedergabe nicht möglich' },

  // ---------- Meldungen ----------
  reports_sub: { uk: 'Поми́лки в завда́ннях', de: 'Hinweise zu Aufgaben – zum Korrigieren der Inhalte' },
  sync_with_gist: { uk: 'Синхронізува́ти', de: 'Mit Gist synchronisieren' },
  open_gist: { uk: 'Відкри́ти Gist', de: 'Gist öffnen' },
  save_txt: { uk: 'Зберегти́ .txt', de: 'Als .txt' },
  newest_first: { uk: 'спо́чатку нові́', de: 'neueste zuerst' },
  no_comment: { uk: 'Без комента́ря', de: 'Kein Kommentar' },
  task: { uk: 'Завда́ння', de: 'Aufgabe' },
  answer: { uk: 'Ві́дповідь', de: 'Antwort' },
  device: { uk: 'При́стрій', de: 'Gerät' },
  status: { uk: 'Стату́с', de: 'Status' },
  generated: { uk: 'автомати́чне', de: 'generiert' },
  task_json: { uk: 'Завда́ння (JSON)', de: 'Aufgabeninhalt (JSON)' },
  delete_report_q: { uk: 'Ви́далити повідо́млення?', de: 'Meldung löschen?' },
  delete_report: { uk: 'Ви́далити', de: 'Meldung löschen' },
  delete_all_q: { uk: 'Ви́далити все?', de: 'Alle Meldungen löschen?' },
  delete_all_reports: { uk: 'Ви́далити все', de: 'Alle Meldungen löschen' },
  go_settings: { uk: 'Налаштува́ння', de: 'Einstellungen' },

  // Melde-Sheet
  report_title: { uk: 'Повідо́мити про поми́лку', de: 'Aufgabe melden' },
  no_lesson: { uk: 'Без уро́ку', de: 'Ohne Lektion' },
  your_answer: { uk: 'Твоя́ ві́дповідь', de: 'Deine Antwort' },
  whats_wrong: { uk: 'Що не так?', de: 'Was stimmt nicht?' },
  comment: { uk: 'Коме́нтар', de: 'Beschreibung' },
  auto_attached: { uk: 'Автомати́чно дода́но', de: 'Automatisch angehängt' },
  save_report: { uk: 'Зберегти́', de: 'Meldung speichern' },
  choose_category: { uk: 'Обери́ катего́рію.', de: 'Bitte eine Kategorie wählen.' },
  saved_where: { uk: 'Ще → Повідо́млення', de: 'Wird lokal gespeichert – Export und Sync unter Mehr → Meldungen.' },
  thanks_saved: { uk: 'Дя́кую! Збере́жено.', de: 'Danke – Meldung gespeichert' },
  cat_uk_error: { uk: 'Поми́лка в украї́нській', de: 'Fehler im Ukrainischen' },
  cat_translation: { uk: 'Непра́вильний пере́клад', de: 'Übersetzung falsch' },
  cat_stress: { uk: 'Непра́вильний на́голос', de: 'Betonung falsch' },
  cat_audio: { uk: 'Звук і вимо́ва', de: 'Audio/Aussprache' },
  cat_grading: { uk: 'Непра́вильна оці́нка', de: 'Lösung wird falsch bewertet' },
  cat_unclear: { uk: 'Незрозумі́ле завда́ння', de: 'Aufgabe unklar' },
  cat_tech: { uk: 'Ви́гляд і те́хніка', de: 'Darstellung/Technik' },
  cat_other: { uk: 'І́нше', de: 'Sonstiges' },

  // Aufgabentypen (Kurzname)
  type_mc_translate: { uk: 'Пере́клад', de: 'Übersetzung wählen' },
  type_build_sentence: { uk: 'Ре́чення', de: 'Satz bauen' },
  type_cloze: { uk: 'Про́пуск', de: 'Lückentext' },
  type_chat: { uk: 'Розмо́ва', de: 'Dialog' },
  type_reading: { uk: 'Чита́ння', de: 'Lesen' },
  type_listening: { uk: 'Слу́хання', de: 'Hören' },
  type_speak: { uk: 'Говорі́ння', de: 'Sprechen' },
  type_match_pairs: { uk: 'Па́ри', de: 'Paare finden' },
  type_picture_choice: { uk: 'Карти́нки', de: 'Bild wählen' },
  type_true_false: { uk: 'Пра́вда чи непра́вда', de: 'Richtig/Falsch' },
  type_order_dialog: { uk: 'Діало́г', de: 'Dialog ordnen' },
  type_structured_input: { uk: 'Фо́рма', de: 'Form erkennen' },
  type_infer: { uk: 'Здогада́йся', de: 'Erschließen' },
  type_back_translation: { uk: 'Переклади́ наза́д', de: 'Rückübersetzung' },
  type_intro: { uk: 'Нове́ сло́во', de: 'Einführungskarte' },
  type_tip: { uk: 'Підка́зка', de: 'Tipp' },
  type_other: { uk: 'Завда́ння', de: 'Aufgabe' },

  // ---------- Ton-Sheet ----------
  sound_now_q: { uk: 'Зара́з без зву́ку?', de: 'Gerade kein Ton?' },
  am_both: { uk: 'Усе́', de: 'Hören + Sprechen' },
  am_listen: { uk: 'Слу́хати', de: 'Nur Hören' },
  am_speak: { uk: 'Говори́ти', de: 'Nur Sprechen' },
  speak_verb: { uk: 'Говори́ти', de: 'Sprechen' },
  for_hour: { uk: 'На годи́ну', de: 'Für 1 Stunde' },
  till_tomorrow: { uk: 'До за́втра', de: 'Bis morgen' },
  forever_btn: { uk: 'Наза́вжди', de: 'Dauerhaft (bis ich es wieder einschalte)' },
  sound_turn_on: { uk: 'Увімкну́ти звук', de: 'Ton wieder einschalten' },
  am_on: { uk: 'уві́мкнено', de: 'an' },
  am_off: { uk: 'ви́мкнено', de: 'aus' },
  am_off_forever: { uk: 'ви́мкнено наза́вжди', de: 'aus (dauerhaft)' },
  no_sound_tasks: { uk: 'Завда́ння без зву́ку', de: 'Aufgaben ohne Ton – Fortschritt bleibt fair erhalten' },

  // ---------- Session-Rahmen ----------
  report_short: { uk: 'Повідо́мити', de: 'Melden' },
  skipped: { uk: 'Пропу́щено', de: 'Übersprungen' },
  not_graded: { uk: 'Без оці́нки', de: 'Diese Aufgabe wird nicht bewertet.' },
  end_session_q: { uk: 'Зако́нчити?', de: 'Session beenden?' },
  answers_saved: { uk: 'Ві́дповіді збере́жено.', de: 'Bisherige Antworten bleiben gespeichert.' },
  end_session: { uk: 'Зако́нчити', de: 'Beenden' },
  keep_here: { uk: 'Учи́тися да́лі', de: 'Hier weiterlernen' },
  open_explanation: { uk: 'Відкри́ти поя́снення', de: 'Erklärung öffnen' },
  session_will_end: { uk: 'Уро́к закі́нчиться.', de: 'Die ausführliche Erklärung öffnet sich als eigene Seite – die laufende Session wird dabei beendet.' },
  session_error: { uk: 'Поми́лка', de: 'Diese Session konnte nicht gestartet werden.' },
  to_start: { uk: 'Сього́дні', de: 'Zur Startseite' },
  pos_noun: { uk: 'іме́нник', de: 'Substantiv' },
  pos_verb: { uk: 'дієсло́во', de: 'Verb' },
  pos_adj: { uk: 'прикме́тник', de: 'Adjektiv' },
  pos_adv: { uk: 'прислі́вник', de: 'Adverb' },
  pos_pron: { uk: 'займе́нник', de: 'Pronomen' },
  pos_num: { uk: 'числі́вник', de: 'Zahlwort' },
  pos_prep: { uk: 'прийме́нник', de: 'Präposition' },
  pos_conj: { uk: 'сполу́чник', de: 'Konjunktion' },
  pos_part: { uk: 'части́нка', de: 'Partikel' },
  pos_interj: { uk: 'ви́гук', de: 'Ausruf' },
  pos_name: { uk: 'і́м’я', de: 'Name' },
  pos_phrase: { uk: 'ви́слів', de: 'Wendung' },

  // ---------- Aufgaben: Bedientexte ----------
  show_translation: { uk: 'Показа́ти пере́клад', de: 'Übersetzung zeigen' },
  hide_translation: { uk: 'Схова́ти пере́клад', de: 'Übersetzung ausblenden' },
  hide_text: { uk: 'Схова́ти текст', de: 'UK ausblenden' },
  show_text: { uk: 'Показа́ти текст', de: 'UK zeigen' },
  try_first: { uk: 'Спо́чатку спро́буй!', de: 'Ukrainisch ausgeblendet – erst selbst versuchen' },
  cant_speak: { uk: 'Не мо́жу зара́з говори́ти', de: 'Gerade nicht sprechen' },
  tap_mic: { uk: 'Торкни́ся мікрофо́на й говори́.', de: 'Tippe aufs Mikrofon und sprich.' },
  say_then_listen: { uk: 'Скажи́ вго́лос. По́тім послу́хай.', de: 'Sprich den Satz laut. Dann hör dir das Original an.' },
  stt_unavailable: { uk: 'Розпізнава́ння мо́влення недосту́пне.', de: 'Spracherkennung nicht verfügbar.' },
  stt_failed: { uk: 'Не вдало́ся розпізна́ти.', de: 'Die Erkennung hat es nicht verstanden.' },
  not_yet: { uk: 'Ще ні', de: 'Noch nicht' },
  said_right: { uk: 'Пра́вильно', de: 'Richtig gesagt' },
  listening_now: { uk: 'Слу́хаю…', de: 'Ich höre …' },
  stt_aborted: { uk: 'Стоп. Торкни́ся мікрофо́на ще раз.', de: 'Abgebrochen. Tippe aufs Mikrofon, wenn du bereit bist.' },
  stt_nothing: { uk: 'Нічо́го не чу́ти. Торкни́ся ще раз і говори́ чі́тко.', de: 'Nichts gehört. Tippe nochmal und sprich deutlich.' },
  almost: { uk: 'Ма́йже!', de: 'Fast!' },
  accept: { uk: 'Зарахува́ти', de: 'Akzeptieren' },
  not_quite: { uk: 'Не зо́всім. Послу́хай і спро́буй ще раз.', de: 'Nicht ganz. Hör dir das Original an und versuch es nochmal.' },
  why_q: { uk: 'Чому́?', de: 'Woran erkennst du es?' },
  back_translation_de: { uk: 'Переклади́ наза́д', de: 'Rückübersetzung' },
  compare: { uk: 'Порівня́ти', de: 'Vergleichen' },
  your_version: { uk: 'Твій варіа́нт:', de: 'Deine Version' },
  all_lines_right: { uk: 'Усе́ пра́вильно!', de: 'Alle Zeilen genau wie im Original.' },
  lines_right: { uk: 'Пра́вильно:', de: 'Zeilen genau getroffen. Vergleiche die markierten Zeilen mit dem Original.' },
  of: { uk: 'з', de: 'von' },
  infer_tip: { uk: 'Що означа́є це сло́во? Здогада́йся!', de: 'Was bedeutet das markierte Wort? Rate aus dem Zusammenhang – Fehler sind hier ausdrücklich erlaubt.' },
  read_whole: { uk: 'Прочита́й уве́сь текст.', de: 'Lies den ganzen Text. Du musst nicht jedes Wort kennen – erschließe den Sinn aus dem Zusammenhang. Unbekanntes kannst du antippen.' },
  to_questions: { uk: 'До пита́нь', de: 'Gelesen – zu den Fragen' },
  gap_n: { uk: 'Про́пуск', de: 'Lücke' },
  delivered: { uk: 'Доста́влено', de: 'Zugestellt' },
  chat_try_again: { uk: 'Не зо́всім. Спро́буй ще раз.', de: 'Das passt hier nicht. Versuch es noch einmal.' },
  chat_ended: { uk: 'Розмо́ву закі́нчено', de: 'Gespräch beendet' },
  goal_missed: { uk: 'Мету́ не дося́гнуто', de: 'Ziel nicht erreicht' },
};

// Pluralformen ebenfalls ins Wörterbuch (damit tools/check-ui-text.mjs sie prüft).
for (const [kind, p] of Object.entries(UK_PLURALS)) {
  p.uk.forEach((uk, i) => { UI_G3[`pl_${kind}_${i}`] = { uk, de: p.de[i ? 1 : 0] }; });
}

/** Kategorie einer Meldung (deutscher Schlüssel aus services/reports.js) → UI-Key. */
export const REPORT_CATEGORY_KEYS = {
  'Fehler im Ukrainischen': 'cat_uk_error',
  'Übersetzung falsch': 'cat_translation',
  'Betonung falsch': 'cat_stress',
  'Audio/Aussprache': 'cat_audio',
  'Lösung wird falsch bewertet': 'cat_grading',
  'Aufgabe unklar': 'cat_unclear',
  'Darstellung/Technik': 'cat_tech',
  'Sonstiges': 'cat_other',
};
/** Toast nach Meldungs-Sync: „Синхронізо́вано: 3 повідо́млення“ */
export function syncedToast(r) {
  if (r?.created) return UI_G3.gist_created;
  const c = ukCount(r?.count ?? 0, 'report');
  return { uk: `${UI_G3.synced_toast.uk}: ${c.uk}`, de: `${c.de} synchronisiert` };
}
export const categoryUi = label => UI_G3[REPORT_CATEGORY_KEYS[label]] || { uk: UI_G3.cat_other.uk, de: String(label || UI_G3.cat_other.de) };
export const typeUi = t => UI_G3[`type_${t}`] || (t ? { uk: UI_G3.type_other.uk, de: String(t) } : UI_G3.type_other);
