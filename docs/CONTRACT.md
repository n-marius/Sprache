# Schnittstellenvertrag Inhalte ↔ App

Verbindlich für Inhalts- und Programmier-Team. Änderungen nur durch den Koordinator.

## Rahmen
- Lernziel A1 bis **30.04.2027** (Nutzerangabe „30.04.2026“ liegt in der Vergangenheit; Zieldatum in den Einstellungen änderbar).
- Phasen (je ca. 2 Monate): **A1.1** 21.10.2026–31.12.2026 · **A1.2** 01.01.2027–28.02.2027 · **A1.3** 01.03.2027–30.04.2027.
- Ausgearbeitet wird zunächst nur A1.1; A1.2/A1.3 nur als Lektionsplan (Titel, Ziele, Themen, Grammatik, Wortfelder).
- Lernende/r: deutschsprachig, liest Kyrillisch. Fokus Verstehen + Sprechen, Rechtschreibung nachrangig.
- Richtung: überwiegend Deutsch → Ukrainisch, aber auch Ukrainisch → Deutsch.
- Wortschatz streng ukrainisch (keine Russismen/Surschyk), alltäglich, je Begriff eine Grundform.

## Textkonventionen
- Betonung: kombinierendes Akut **U+0301** direkt nach dem betonten Vokal (`ка́ва`). Jedes mehrsilbige Wort trägt eine Betonung, einsilbige keine. Niemals vorkomponierte lateinische Zeichen (á, é …).
- Apostroph: **’ (U+2019)** (`п’ю́`, `сім’я́`).
- Normalisierung/Tokenisierung ausschließlich über `js/lib/uk-text.js` (`normalizeWord`, `tokenize`, `normalizeSentence`).
- Deutsch: Siezen vermeiden, neutrale knappe Form. Ukrainische Anweisungen an den Nutzer im **ти**-Imperativ (`Перекладі́`, `Обери́`).

## Dateien (Eigentümer: Inhalts-Team)
- `content/curriculum.json`
- `content/ui-strings.json` – ukrainische Aufgabenanweisungen
- `content/glossary-common.json` – Wörter, die übergreifend vorkommen (Anweisungen, Namen, Funktionswörter)
- `content/a1-1/<lesson-id>.json` – eine Datei je Lektion
- `tools/validate-content.mjs` – Validator (Schema + Glossarabdeckung + Betonungsprüfung)

Alles andere (`index.html`, `js/`, `css/`, `sw.js`, Icons, Workflows) gehört dem Programmier-Team. `js/lib/uk-text.js` ist gemeinsam, Änderungen nur in Absprache.

### curriculum.json
```json
{
  "version": 1,
  "targetDate": "2027-04-30",
  "phases": [
    { "id": "A1.1", "title_uk": "…", "title_de": "…", "start": "2026-10-21", "end": "2026-12-31",
      "summary_de": "…",
      "lessons": [
        { "id": "a1-1-01", "file": "a1-1/a1-1-01.json", "title_uk": "Приві́т!", "title_de": "Hallo!",
          "theme": "greetings", "status": "ready", "goals_de": ["…"] }
      ] },
    { "id": "A1.2", "...": "...", "lessons": [ { "id": "a1-2-01", "title_uk": "…", "title_de": "…", "theme": "food",
          "status": "planned", "goals_de": ["…"], "grammar_de": ["…"], "vocab_fields_de": ["…"] } ] }
  ]
}
```
`theme` ∈ `greetings, people, family, home, food, cafe, city, transport, time, numbers, shopping, work, law, body, weather, hobby, travel, school, colors, clothes, health, calendar, office`. Die App knüpft Icons/Animationen daran.

### ui-strings.json
Objekt `key → {"uk": "…", "de": "…"}`. Pflicht-Keys:
`translate_to_uk, translate_to_de, choose_translation, build_sentence, fill_gap, read_and_answer, listen_and_choose, listen_and_build, say_aloud, match_pairs, choose_picture, chat, true_false, true, false, check, continue, correct, incorrect, correct_answer, new_word, review, lesson_done, well_done, skip, report, tap_to_listen, slow`.
Alle Wörter darin müssen über `glossary-common.json` auflösbar sein.

### Glossar-Eintrag (in `glossary-common.json` als Array, in Lektionen unter `glossary`)
```json
{ "uk": "ка́ву", "lemma": "ка́ва", "de": "Kaffee", "pos": "noun", "info": "Akk. Sg. f. · Nom. ка́ва" }
```
`pos` ∈ `noun, verb, adj, adv, pron, num, prep, conj, part, interj, name, phrase`. `info` = kurze deutsche Grammatikinfo (Kasus/Numerus/Genus bzw. Person/Tempus; bei Verben Infinitiv). Lookup-Schlüssel ist `normalizeWord(uk)`; mehrere Einträge pro Schlüssel erlaubt (Homographen → App zeigt alle).

### Lektion `content/a1-1/<id>.json`
```json
{
  "id": "a1-1-03",
  "phase": "A1.1",
  "title_uk": "…", "title_de": "…", "theme": "cafe",
  "goals_de": ["Ich kann im Café bestellen."],
  "grammar": [ { "title_de": "…", "body_de": "kurz, max. ~80 Wörter, **fett** erlaubt", "examples": [ {"uk":"…","de":"…"} ] } ],
  "vocab": [
    { "id": "kava", "uk": "ка́ва", "de": "Kaffee", "pos": "noun", "info": "f.", "emoji": "☕",
      "example": { "uk": "Я п’ю́ ка́ву.", "de": "Ich trinke Kaffee." },
      "forms": [ { "uk": "ка́ву", "info": "Akk. Sg." } ] }
  ],
  "glossary": [ ],
  "exercises": [ ]
}
```
- `vocab[].id`: eindeutig über ALLE Lektionen (ASCII, z. B. `kava`, `pyty`). Die App erzeugt daraus SRS-Karten und eigene Wiederholungsaufgaben.
- `vocab[].forms` und `glossary` müssen zusammen mit früheren Lektionen und `glossary-common.json` **jedes** ukrainische Wort der Lektion abdecken (Validator prüft).
- `emoji` optional, nur wenn eindeutig.

### Aufgaben (`exercises[]`)
Gemeinsame Felder: `id` (eindeutig in Lektion, z. B. `e01`), `type`, `vocab` (Array von vocab-ids, die geübt werden), `difficulty` (1–3), optional `hint_de`.
Bei Auswahl-Optionen steht die **richtige Option immer an Index 0**; die App mischt. Distraktoren plausibel, eindeutig falsch.

| type | Felder |
|---|---|
| `mc_translate` | `dir` (`de-uk`/`uk-de`), `prompt`, `options` (3–4) |
| `build_sentence` | `dir`, `prompt`, `answer` (Satz in Zielsprache), `accept` (weitere korrekte Sätze, optional), `distractors` (2–4 Wörter) |
| `cloze` | `text` (uk, Lücken als `{{…}}`, Inhalt = richtige Antwort), `options` (Array je Lücke, Index 0 = richtig), `translation_de` |
| `chat` | `scenario_de`, `partner` (`{"name":"Окса́на","emoji":"👩"}`), `turns`: `{"who":"bot","uk":"…","de":"…"}` oder `{"who":"me","options":[{"uk":"…","de":"…","feedback_de":"…"}]}` (Index 0 richtig; falsche mit `feedback_de`) |
| `reading` | `title_uk`, `text_uk` (3–8 Sätze), `text_de`, `questions` (3–5): `{"q_uk":"…","q_de":"…","kind":"mc","options":[…]}` (Index 0 richtig, Optionen ukrainisch) oder `{"q_uk":"…","q_de":"…","kind":"tf","answer":true}` |
| `listening` | `audio_uk` (wird per TTS gesprochen), `mode` (`choose_meaning` → `options` deutsch / `choose_heard` → `options` ukrainisch / `build` → wie build_sentence mit `answer`=`audio_uk`, `distractors`) |
| `speak` | `uk`, `de` (Nutzer sieht DE + optional UK, spricht UK; App nutzt Spracherkennung `uk-UA` oder Selbstbewertung) |
| `match_pairs` | `pairs`: 4–6 × `{"uk":"…","de":"…"}` |
| `picture_choice` | `prompt_uk` (Wort/Satz), `options`: `[{"emoji":"☕","de":"Kaffee"}, …]` (3–4) |
| `true_false` | `statement_uk`, `context_uk` (optional, kurzer Text/Situation), `context_de`, `answer` (bool), `explanation_de` |
| `order_dialog` | `lines`: 3–5 × `{"uk":"…","de":"…"}` in richtiger Reihenfolge |

Jede Lektion: **mind. 45 Aufgaben**, alle Typen vertreten, je Vokabel mehrere Aufgaben in verschiedenen Formen/Kontexten (Konzept statt Auswendiglernen), mind. 3 `chat`, 2 `reading`, 5 `speak`, 6 `listening`. Aufgaben greifen bewusst auch Wortschatz früherer Lektionen auf (Interleaving).

## App-Verhalten (Eigentümer: Programmier-Team)
- Statische PWA ohne Build-Schritt (ES-Module), Hosting GitHub Pages (Unterpfad `/Sprache/` → nur relative Pfade).
- Lädt `content/curriculum.json`, dann Lektionsdateien; baut Lexikon-Index aus `glossary-common.json` + allen `vocab`(inkl. `forms`) + `glossary`.
- Tippen auf ein ukrainisches Wort (überall außer in Antwortoptionen und reinen Vokabelabfragen) → Blase mit Lemma, Übersetzung, `info`; nächster Tap irgendwo schließt.
- Meldefunktion an jeder Aufgabe; Export `.txt`; Sync per GitHub-Gist (Token in Einstellungen).
