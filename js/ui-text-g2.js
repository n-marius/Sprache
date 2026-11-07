// UI-Texte Gruppe 2 (wird in js/ui-text.js zusammengeführt). Format wie dort: key → {uk, de}.
// Bereiche: Vokabeln/Trainer, Wortliste, Wissen/Themen, Erklärung, Spiele.
// Platzhalter {n}, {m} … werden mit uiF() ersetzt; Zahlwörter mit Kongruenz über countUk()/pluralUk().
export const UI_G2 = {
  // Zahl-Kongruenz: _1 = 1, 21, 31 …; _2 = 2–4, 22–24 …; _5 = 0, 5–20, 25 …
  g2_pl_word_1: { uk: 'сло́во', de: 'Wort' },
  g2_pl_word_2: { uk: 'слова́', de: 'Wörter' },
  g2_pl_word_5: { uk: 'слів', de: 'Wörter' },
  g2_pl_lesson_1: { uk: 'уро́к', de: 'Lektion' },
  g2_pl_lesson_2: { uk: 'уро́ки', de: 'Lektionen' },
  g2_pl_lesson_5: { uk: 'уро́ків', de: 'Lektionen' },
  g2_pl_pair_1: { uk: 'па́ра', de: 'Paar' },
  g2_pl_pair_2: { uk: 'па́ри', de: 'Paare' },
  g2_pl_pair_5: { uk: 'пар', de: 'Paare' },
  g2_pl_move_1: { uk: 'хід', de: 'Zug' },
  g2_pl_move_2: { uk: 'хо́ди', de: 'Züge' },
  g2_pl_move_5: { uk: 'ході́в', de: 'Züge' },
  g2_pl_card_1: { uk: 'ка́ртка', de: 'Karte' },
  g2_pl_card_2: { uk: 'ка́ртки', de: 'Karten' },
  g2_pl_card_5: { uk: 'карто́к', de: 'Karten' },
  g2_pl_minute_1: { uk: 'хвили́на', de: 'Minute' },
  g2_pl_minute_2: { uk: 'хвили́ни', de: 'Minuten' },
  g2_pl_minute_5: { uk: 'хвили́н', de: 'Minuten' },
  g2_pl_day_1: { uk: 'день', de: 'Tag' },
  g2_pl_day_2: { uk: 'дні', de: 'Tage' },
  g2_pl_day_5: { uk: 'днів', de: 'Tage' },
  g2_pl_month_1: { uk: 'мі́сяць', de: 'Monat' },
  g2_pl_month_2: { uk: 'мі́сяці', de: 'Monate' },
  g2_pl_month_5: { uk: 'місяці́в', de: 'Monate' },
  g2_pl_year_1: { uk: 'рік', de: 'Jahr' },
  g2_pl_year_2: { uk: 'ро́ки', de: 'Jahre' },
  g2_pl_year_5: { uk: 'ро́ків', de: 'Jahre' },
  // Genitiv nach „з“ (aus 1 Lektion / aus 2, 5 … Lektionen)
  g2_gen_lesson_1: { uk: 'уро́ку', de: 'Lektion' },
  g2_gen_lesson_5: { uk: 'уро́ків', de: 'Lektionen' },

  // Vokabeln (#/trainer)
  g2_tr_subtitle: { uk: 'Трену́й слова́ і ре́чення', de: 'Wörter und Sätze üben – unabhängig von den Lektionen' },
  g2_dir_de_uk: { uk: 'Німе́цька → украї́нська', de: 'Deutsch → Ukrainisch' },
  g2_dir_uk_de: { uk: 'Украї́нська → німе́цька', de: 'Ukrainisch → Deutsch' },
  g2_scope_due_sub: { uk: 'Повто́рення і нові́ слова́', de: 'Wiederholungen und neue Wörter' },
  g2_scope_all_sub: { uk: '{n} {w} з {l} {L}', de: '{n} Wörter aus {l} Lektion(en)' },
  g2_scope_hard_sub: { uk: 'Ча́сто забу́ті або́ позна́чені', de: 'Oft vergessen oder markiert' },
  g2_scope_mined_sub: { uk: 'Ре́чення з істо́рій і те́кстів', de: 'Sätze aus Geschichten und Texten' },
  g2_scope_mined_none: { uk: 'Ще нема́є ре́чень', de: 'Noch keine Sätze gesammelt' },
  g2_hint_mined_empty: { uk: 'Збира́й ре́чення в істо́ріях і те́кстах.', de: 'Sätze in Geschichten und Lesetexten sammeln (Lesezeichen-Symbol).' },
  g2_hint_hard_empty: { uk: 'Нема́є складни́х слів – ду́же до́бре!', de: 'Keine schwierigen Wörter – sehr gut!' },
  g2_hint_nothing_due: { uk: 'Зара́з нема́є чого́ повто́рювати. Зайди́ пізні́ше.', de: 'Gerade nichts zu wiederholen. Schau später wieder vorbei.' },
  g2_hint_round: { uk: '{c} · ≈ {t}', de: 'Bis zu {n} Karten · ca. {m} Min.' },
  g2_listen_is_off: { uk: 'Слу́хання ви́мкнено', de: 'Hören ist gerade aus – antippen zum Ändern' },
  g2_word_list_sub: { uk: 'Усі́ слова́, по́шук і фі́льтри', de: 'Alle Wörter mit Stärke, Suche und Filter' },
  g2_no_open_lessons: { uk: 'Ще нема́є відкри́тих уро́ків.', de: 'Noch keine Lektion freigeschaltet.' },

  // Trainer-Runde
  g2_what_means: { uk: 'Що це зна́чить?', de: 'Was bedeutet das?' },
  g2_today_again: { uk: 'сього́дні', de: 'heute noch einmal' },
  g2_no_ratings: { uk: 'Нема́є оці́нок.', de: 'Keine Karte bewertet.' },
  g2_no_cards_here: { uk: 'Зара́з тут нема́є карто́к. Обери́ і́нші слова́.', de: 'Für diese Auswahl gibt es gerade keine Karten. Einen anderen Umfang wählen.' },
  g2_back_to_vocab: { uk: 'Наза́д', de: 'Zurück zu den Vokabeln' },
  g2_new_cards_n: { uk: 'Нові́ ка́ртки: {n}', de: 'Neue Karten unter Vokabeln: {n}' },

  // Wortliste
  g2_search_hint: { uk: 'По́шук', de: 'Suchen (Deutsch oder Ukrainisch)' },
  g2_words_shown: { uk: 'Слова́: {n} з {m}', de: '{n} von {m} Wörtern' },
  g2_no_hard_words: { uk: 'Нема́є складни́х слів.', de: 'Keine schwierigen Wörter.' },
  g2_nothing_found: { uk: 'Нічо́го не зна́йдено.', de: 'Keine Treffer.' },
  g2_strength_0: { uk: 'нема́є', de: 'nicht eingeführt' },
  g2_strength_1: { uk: 'нове́', de: 'neu' },
  g2_strength_2: { uk: 'сла́бко', de: 'im Aufbau' },
  g2_strength_3: { uk: 'до́бре', de: 'gefestigt' },
  g2_strength_4: { uk: 'відмі́нно', de: 'sicher' },

  // Wissen (#/library) und Themen
  g2_lib_subtitle: { uk: 'Грама́тика і фра́зи для розмо́ви', de: 'Grammatik und Redemittel – Thema für Thema' },
  g2_cat_redemittel: { uk: 'Фра́зи для розмо́ви', de: 'Redemittel' },
  g2_cat_aussprache: { uk: 'Вимо́ва і письмо́', de: 'Aussprache und Schrift' },
  g2_cat_pronomen: { uk: 'Займе́нники і зверта́ння', de: 'Pronomen und Anrede' },
  g2_cat_verben: { uk: 'Дієсло́ва', de: 'Verben' },
  g2_cat_kasus: { uk: 'Відмі́нки', de: 'Fälle (Kasus)' },
  g2_cat_nomen: { uk: 'Іме́нники і прикме́тники', de: 'Nomen und Adjektive' },
  g2_cat_zahlen: { uk: 'Чи́сла і час', de: 'Zahlen und Zeit' },
  g2_cat_satzbau: { uk: 'Будо́ва ре́чення', de: 'Satzbau' },
  g2_lesson_n: { uk: 'Уро́к {n}', de: 'Lektion {n}' },
  g2_more_topics_soon: { uk: 'Нові́ те́ми в насту́пних уро́ках: {n}', de: '{n} weitere Themen folgen mit den nächsten Lektionen.' },
  g2_mined_sub: { uk: 'З істо́рій, те́кстів і поя́снень', de: 'Aus Geschichten, Texten und Erklärungen' },
  g2_topic: { uk: 'Те́ма', de: 'Thema' },
  g2_topic_locked: { uk: 'Ця те́ма відкри́ється, коли́ ти почне́ш цей уро́к.', de: 'Dieses Thema wird freigeschaltet, sobald du die zugehörige Lektion erreichst.' },
  g2_topic_not_found: { uk: 'Те́му не зна́йдено.', de: 'Thema nicht gefunden.' },
  g2_topic_in_lesson: { uk: 'Ця те́ма є в поя́сненні уро́ку.', de: 'Dieses Thema ist in der Gesamterklärung der Lektion enthalten.' },
  g2_open_explanation: { uk: 'Відкри́ти поя́снення', de: 'Erklärung der Lektion öffnen' },
  g2_next_topic: { uk: 'Насту́пна те́ма', de: 'Nächstes Thema: {t}' },
  g2_read_whole_lesson: { uk: 'Прочита́ти весь уро́к', de: 'Ganze Lektion lesen' },

  // Erklärung
  g2_lesson_unavailable: { uk: 'Цей уро́к ще не гото́вий.', de: 'Diese Lektion ist noch nicht verfügbar.' },
  g2_no_explanation: { uk: 'Для цього́ уро́ку ще нема́є поя́снення.', de: 'Für diese Lektion gibt es noch keine ausführliche Erklärung.' },
  g2_explain_locked: { uk: 'Поя́снення відкри́ється, коли́ ти почне́ш попере́дній уро́к.', de: 'Diese Erklärung wird freigeschaltet, sobald du die vorige Lektion begonnen hast.' },
  g2_key_points: { uk: 'Головне́', de: 'Merksätze' },
  g2_to_exercises: { uk: 'Да́лі до вправ', de: 'Weiter zu den Übungen' },
  g2_practice_lesson: { uk: 'Поча́ти уро́к', de: 'Lektion üben' },
  g2_read_story: { uk: 'Чита́ти істо́рію', de: 'Geschichte lesen' },
  g2_sentence_saved: { uk: 'Ре́чення збере́жено', de: 'Satz unter Vokabeln gespeichert' },

  // Spiele
  g2_games_subtitle: { uk: 'Грай і повто́рюй слова́', de: 'Spiele – stumm, nebenbei wiederholen' },
  g2_games_footer: { uk: 'Тут лише́ слова́ з відкри́тих уро́ків.', de: 'Die Spiele nutzen nur Wörter aus freigeschalteten Lektionen und bevorzugen solche, die noch nicht sicher sitzen.' },
  g2_game_cw_sub: { uk: 'Вгада́й слова́ за підка́зками', de: 'Wörter aus Hinweisen erschließen' },
  g2_game_pairs_sub: { uk: 'Знайди́ сло́во і пере́клад', de: 'Ukrainisch und Deutsch zusammenführen' },
  g2_game_forms_sub: { uk: 'Знайди́ па́ри форм', de: 'Zusammengehörige Formen finden' },
  g2_new_game: { uk: 'Нова́ гра', de: 'Neues Spiel' },
  g2_cw_need_words: { uk: 'Для кросво́рда тобі́ тре́ба бі́льше слів.', de: 'Für ein Kreuzworträtsel brauchst du noch etwas mehr Wortschatz.' },
  g2_cw_show_letter: { uk: 'Показа́ти лі́теру', de: 'Buchstabe zeigen' },
  g2_cw_hints_used: { uk: 'Підка́зки: {n}', de: 'Aufgedeckte Buchstaben: {n}' },
  g2_mm_status: { uk: '{f} / {n} {P} · {m} {M}', de: '{f} / {n} Paare · {m} Züge' },
  g2_mm_moves: { uk: '{m} {M}', de: '{m} Züge' },
};

/** Index der Pluralform: 1 → _1 (1, 21 …), 2 → _2 (2–4, 22–24 …), 5 → _5 (sonst). */
export function pluralIdx(n) {
  const a = Math.abs(Math.trunc(n)), d = a % 10, dd = a % 100;
  if (d === 1 && dd !== 11) return 1;
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return 2;
  return 5;
}

/** Passende ukrainische Form zu n, z. B. pluralUk(3, 'word') → 'слова́'. */
export function pluralUk(n, base, prefix = 'pl') {
  const i = pluralIdx(n);
  const e = UI_G2[`g2_${prefix}_${base}_${i}`] || UI_G2[`g2_${prefix}_${base}_${i === 2 ? 5 : i}`];
  return e ? e.uk : base;
}

/** „23 слова́“ (Zahl + kongruentes Nomen). */
export const countUk = (n, base) => `${n} ${pluralUk(n, base)}`;

/** {uk, de} eines Keys mit ersetzten Platzhaltern {x}. */
export function uiF(key, vars = {}) {
  const t = UI_G2[key] || UI_G2[`g2_${key}`] || { uk: key, de: key };
  const fill = s => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  return { uk: fill(t.uk), de: fill(t.de) };
}
