# A1-Stoffplan (Ukrainisch für Deutschsprachige)

Verbindlich für die Lektions-Autoren. Datenformat: `docs/CONTRACT.md`. Recherche-Grundlagen: `docs/research-content.md`.

## Didaktische Leitlinien (für alle Lektionen)

- **Kommunikative Can-do-Ziele nach GER A1**: Jede Lektion endet mit Handlungen, die man real ausführen kann (grüßen, bestellen, nach dem Weg fragen, Formular ausfüllen …).
- **Hochfrequenter Kernwortschatz und Chunks**: Redemittel werden zunächst als feste Wendungen gelernt (`Мене́ зва́ти …`, `У ме́не є …`, `Скі́льки ко́штує …?`), Grammatik wird danach bewusst gemacht.
- **Verständlicher Input**: Lesetexte, Dialoge und Hörsätze verwenden nur bekannten Wortschatz plus sehr wenige glossierte Zusatzwörter.
- **Retrieval Practice**: Abrufen statt Wiedererkennen bevorzugen (Satzbau, Lückentext, Sprechen, de→uk); Wiedererkennen (uk→de, Hören) als Einstieg.
- **Variation statt Auswendiglernen**: Jede neue Vokabel erscheint in ≥ 3 Aufgaben, in verschiedenen Formen (Nominativ/Akkusativ/Lokativ, Person), Kontexten und Richtungen.
- **Interleaving**: ca. 20–30 % der Aufgaben greifen Wortschatz/Strukturen früherer Lektionen auf, gemischt mit dem neuen Stoff.
- **Spacing**: übernimmt die App (SRS aus `vocab`); Inhalte liefern dafür saubere Vokabeln mit Beispielsatz.
- **Immersion**: Anweisungen/Fragen auf Ukrainisch mit einfachsten Wörtern; jedes ukrainische Wort ist per Tap auflösbar (Glossar).
- **Sprachnorm**: Standardukrainisch, keine Russismen/Surschyk; je Begriff EINE gängige Form; Betonung (U+0301) auf jedem mehrsilbigen Wort; Apostroph ’ (U+2019).
- **Lernerprofil**: Experte (u. a. Jura) – erwachsene, sachliche Kontexte (Büro, Behörde, Reise), keine Kindersprache.

## Phasenüberblick

| Phase | Zeitraum | Lektionen | Schwerpunkt |
|---|---|---|---|
| A1.1 | 21.10.2026–31.12.2026 | 15 (a1-1-01 … a1-1-15) | Grundkontakt, Zahlen, Familie, Essen/Café, Einkaufen, Wohnung, Stadt, Uhrzeit, Wochentage, Beruf, Büro, Behörde |
| A1.2 | 01.01.2027–28.02.2027 | 15 (a1-2-01 … a1-2-15) | Tagesablauf, Verkehr, Wetter, Kleidung, Vergangenheit, Freizeit, Gesundheit, Daten, Bank/Post, Behördentermin |
| A1.3 | 01.03.2027–30.04.2027 | 15 (a1-3-01 … a1-3-15) | Zukunft, Reisen/Hotel, Apotheke, Wohnungsmiete, Einladungen, Kurs, Bewerbung, Telefon, Polizei/Rechte, Kultur, Vergleiche, Abschluss A1 |

Lektion ≈ 3–5 Lerntage inkl. Wiederholung (A1.1: 15 Lektionen in ca. 10 Wochen).

## Grammatik-Progression A1.1 (Überblick)

1. Duzen/Siezen (ти/ви), Chunks ohne Grammatik
2. Personalpronomen, kein „sein“ im Präsens, `Мене́ зва́ти`, `Я з …` (Gen. als Chunk), Verneinung `не`
3. Zahlen 0–20, оди́н/одна́, два/дві, `Мені́ … ро́ків` (рік/ро́ки/ро́ків)
4. Genus der Nomen, Possessiva мій/твій, його́/її́, `У ме́не є …`
5. Präsens I. Konjugation (-аю/-ую/живу́), `у/в` + Lokativ als Chunk
6. Akkusativ Sg. (unbelebt), хоті́ти, `Мо́жна …?`
7. Präsens II. Konjugation (люби́ти), ї́сти / пи́ти
8. Zahlen bis 1000, гри́вня/гри́вні/гри́вень, ко́штує/ко́штують
9. Adjektive (Genus-Kongruenz), Lokativ auf `Де?` (у/в, на)
10. Lokativ: у vs. на; `до` + Gen. als Chunk; höflicher Imperativ als Chunk (`Іді́ть`)
11. Uhrzeit mit Ordinalzahlen (f.), `о` + Lokativ
12. Wochentage mit `у/в` + Akk., ма́ти, могти́
13. Berufe, `Ким ти працю́єш?` (Instr. als Chunk), weibliche Berufsbezeichnungen
14. Höflicher Imperativ (-і́ть/-йте), Bitten im Büro
15. Persönliche Daten, Formulare, Possessiv ваш; Wiederholung Akk./Lok.

---

## A1.1 – Lektionen im Detail

Die vocab-ids sind **fest** und über alle Lektionen eindeutig. Die `uk`-Form in der Tabelle ist **genau so** als `vocab[].uk` zu verwenden (spätere Lektionen verlassen sich darauf). Gebeugte Formen gehören in `forms` (bzw. `glossary`). Mehrwortausdrücke brauchen zusätzlich Glossareinträge für ihre Einzelwörter, soweit diese nicht anderweitig auflösbar sind.

### a1-1-01 · Приві́т! · Hallo! · theme `greetings`
- **Can-do**: Ich kann Menschen formell und informell begrüßen und mich verabschieden. Ich kann fragen, wie es jemandem geht, und kurz antworten. Ich kann mich bedanken, um etwas bitten und mich entschuldigen.
- **Grammatik**: ти vs. ви (Duzen/Siezen); Begrüßungen als feste Wendungen; Hinweis zur Betonung (wird angezeigt, nicht geübt).
- **Redemittel**: Приві́т! · До́брий день! · Як спра́ви? – До́бре, дя́кую. А ти? · До поба́чення! · Бува́й! · Ви́бачте. · Будь ла́ска.

| id | uk | de | pos |
|---|---|---|---|
| pryvit | приві́т | hallo (informell) | interj |
| dobryi_den | до́брий день | guten Tag | phrase |
| dobryi_ranok | до́брий ра́нок | guten Morgen | phrase |
| dobryi_vechir | до́брий ве́чір | guten Abend | phrase |
| na_dobranich | на добра́ніч | gute Nacht | phrase |
| do_pobachennia | до поба́чення | auf Wiedersehen | phrase |
| buvai | бува́й | tschüss (zu einer Person, informell) | interj |
| yak | як | wie | adv |
| yak_spravy | Як спра́ви? | Wie geht’s? | phrase |
| dobre | до́бре | gut | adv |
| normalno | норма́льно | ganz gut, okay | adv |
| pohano | пога́но | schlecht | adv |
| duzhe | ду́же | sehr | adv |
| diakuiu | дя́кую | danke | phrase |
| bud_laska | будь ла́ска | bitte | phrase |
| vybachte | ви́бачте | Entschuldigung (Sie/ihr) | phrase |
| tak | так | ja | part |
| ni | ні | nein | part |
| ya | я | ich | pron |
| ty | ти | du | pron |
| vy | ви | Sie; ihr | pron |
| tezh | теж | auch | adv |
| a_ty | А ти? | Und du? | phrase |

### a1-1-02 · Як тебе́ зва́ти? · Wie heißt du? · theme `people`
- **Can-do**: Ich kann mich mit Namen, Herkunft und Sprachen vorstellen. Ich kann andere nach Namen und Herkunft fragen. Ich kann sagen, dass ich etwas (nicht) verstehe.
- **Grammatik**: kein „sein“ im Präsens (`Я Ма́ркус.` `Це Окса́на.`); Personalpronomen я, ти, він, вона́, ми, ви, вони́; `Мене́ / Тебе́ / Вас зва́ти` (Akk.-Pronomen als Chunk); `Я з Німе́ччини` (з + Gen. als Chunk); Verneinung mit `не`; розмовля́ти/розумі́ти (я, ти, ви) als Chunks.
- **Redemittel**: Мене́ зва́ти … · Як тебе́/вас зва́ти? · Ду́же приє́мно! · Зві́дки ти? – Я з Німе́ччини. · Ти розмовля́єш украї́нською? – Тро́хи. · Я не розумі́ю.

| id | uk | de | pos |
|---|---|---|---|
| mene_zvaty | Мене́ зва́ти … | Ich heiße … | phrase |
| yak_tebe_zvaty | Як тебе́ зва́ти? | Wie heißt du? | phrase |
| yak_vas_zvaty | Як вас зва́ти? | Wie heißen Sie? | phrase |
| duzhe_pryiemno | Ду́же приє́мно! | Freut mich! | phrase |
| vin | він | er | pron |
| vona | вона́ | sie (Sg.) | pron |
| my | ми | wir | pron |
| vony | вони́ | sie (Pl.) | pron |
| khto | хто | wer | pron |
| shcho | що | was | pron |
| tse | це | das (ist), dies | pron |
| zvidky | зві́дки | woher | adv |
| nimechchyna | Німе́ччина | Deutschland | name |
| ukraina | Украї́на | Ukraine | name |
| ne | не | nicht | part |
| rozmovliaty | розмовля́ти | sprechen (eine Sprache), sich unterhalten | verb |
| ukrainskoiu | украї́нською | (auf) Ukrainisch | adv |
| nimetskoiu | німе́цькою | (auf) Deutsch | adv |
| anhliiskoiu | англі́йською | (auf) Englisch | adv |
| trokhy | тро́хи | ein bisschen | adv |
| rozumity | розумі́ти | verstehen | verb |
| pan | пан | Herr (Anrede) | noun |
| pani | па́ні | Frau (Anrede) | noun |
| druh | друг | Freund | noun |
| podruha | подру́га | Freundin | noun |

### a1-1-03 · Скі́льки? Чи́сла · Wie viel? Zahlen · theme `numbers`
- **Can-do**: Ich kann von 0 bis 20 zählen. Ich kann eine Telefonnummer nennen und verstehen. Ich kann nach dem Alter fragen und mein Alter (bzw. das anderer) angeben.
- **Grammatik**: оди́н/одна́ (одне́), два/дві; Telefonnummern ziffernweise bzw. paarweise; `Мені́ … ро́ків` mit 1 рік / 2–4 ро́ки / 5–20 ро́ків; Dativ-Pronomen мені́, тобі́, вам (Chunk).
- **Redemittel**: Скі́льки тобі́ ро́ків? – Мені́ два́дцять ро́ків. · Яки́й у те́бе но́мер телефо́ну? (als Chunk) · Ще раз, будь ла́ска.

| id | uk | de | pos |
|---|---|---|---|
| nul | нуль | null | num |
| odyn | оди́н | eins | num |
| dva | два | zwei | num |
| try | три | drei | num |
| chotyry | чоти́ри | vier | num |
| piat | п’ять | fünf | num |
| shist | шість | sechs | num |
| sim | сім | sieben | num |
| visim | ві́сім | acht | num |
| deviat | де́в’ять | neun | num |
| desiat | де́сять | zehn | num |
| odynadtsiat | одина́дцять | elf | num |
| dvanadtsiat | двана́дцять | zwölf | num |
| trynadtsiat | трина́дцять | dreizehn | num |
| chotyrnadtsiat | чотирна́дцять | vierzehn | num |
| piatnadtsiat | п’ятна́дцять | fünfzehn | num |
| shistnadtsiat | шістна́дцять | sechzehn | num |
| simnadtsiat | сімна́дцять | siebzehn | num |
| visimnadtsiat | вісімна́дцять | achtzehn | num |
| deviatnadtsiat | дев’ятна́дцять | neunzehn | num |
| dvadtsiat | два́дцять | zwanzig | num |
| skilky | скі́льки | wie viel | adv |
| rik | рік | Jahr | noun |
| skilky_tobi_rokiv | Скі́льки тобі́ ро́ків? | Wie alt bist du? | phrase |
| meni_rokiv | Мені́ … ро́ків. | Ich bin … Jahre alt. | phrase |
| nomer_telefonu | но́мер телефо́ну | Telefonnummer | phrase |

### a1-1-04 · Моя́ сім’я́ · Meine Familie · theme `family`
- **Can-do**: Ich kann meine Familie vorstellen und einfache Fragen zur Familie stellen und beantworten. Ich kann sagen, was/wen ich habe.
- **Grammatik**: Genus der Nomen nach Endung (Konsonant → m., -а/-я → f., -о/-е → n.; Ausnahmen wie та́то, дити́на f.!); Possessiva мій/моя́/моє́/мої́, твій/твоя́/твоє́/твої́; його́/її́ unveränderlich; `У ме́не є …` (ich habe), `Ось …`.
- **Redemittel**: Це моя́ сім’я́. · Ось мій брат. · У те́бе є ді́ти? – Так, у ме́не є син і дочка́. · Як його́/її́ зва́ти?

| id | uk | de | pos |
|---|---|---|---|
| simia | сім’я́ | Familie | noun |
| mama | ма́ма | Mama, Mutter | noun |
| tato | та́то | Papa, Vater | noun |
| batky | батьки́ | Eltern | noun |
| syn | син | Sohn | noun |
| dochka | дочка́ | Tochter | noun |
| brat | брат | Bruder | noun |
| sestra | сестра́ | Schwester | noun |
| cholovik | чолові́к | Ehemann; Mann | noun |
| druzhyna | дружи́на | Ehefrau | noun |
| dytyna | дити́на | Kind | noun |
| dity | ді́ти | Kinder | noun |
| babusia | бабу́ся | Oma | noun |
| didus | діду́сь | Opa | noun |
| kit | кіт | Kater, Katze | noun |
| miy | мій | mein | pron |
| tviy | твій | dein | pron |
| yoho | його́ | sein (Possessiv) | pron |
| yii | її́ | ihr (Possessiv) | pron |
| u_mene_ie | У ме́не є … | Ich habe … | phrase |
| ie | є | ist/gibt es; (hat) | verb |
| os | ось | hier ist, da ist | part |

### a1-1-05 · Де ти живе́ш? · Wo wohnst du? · theme `people`
- **Can-do**: Ich kann sagen, wo ich wohne und arbeite, und andere danach fragen. Ich kann sagen, welche Sprachen ich lerne und spreche. Ich kann über einfache Tätigkeiten im Präsens sprechen.
- **Grammatik**: Präsens I. Konjugation (-ю, -єш, -є, -ємо, -єте, -ють): зна́ти, чита́ти, вивча́ти, розмовля́ти; -ува- → -у-: працюва́ти → працю́ю; жи́ти → живу́, живе́ш; `у/в` + Lokativ als Chunk (у Ки́єві, в Берлі́ні, в Украї́ні, в Німе́ччині); у/в-Wechsel kurz.
- **Redemittel**: Де ти живе́ш? – Я живу́ в Берлі́ні. · Я працю́ю вдо́ма. · Я вивча́ю украї́нську мо́ву. · Я не зна́ю.

| id | uk | de | pos |
|---|---|---|---|
| de | де | wo | adv |
| zhyty | жи́ти | wohnen, leben | verb |
| pratsiuvaty | працюва́ти | arbeiten | verb |
| znaty | зна́ти | wissen, kennen | verb |
| chytaty | чита́ти | lesen | verb |
| vyvchaty | вивча́ти | lernen, studieren (etw.) | verb |
| misto | мі́сто | Stadt | noun |
| kraina | краї́на | Land (Staat) | noun |
| kyiv | Ки́їв | Kyjiw (Kiew) | name |
| berlin | Берлі́н | Berlin | name |
| lviv | Львів | Lwiw | name |
| vulytsia | ву́лиця | Straße | noun |
| tut | тут | hier | adv |
| tam | там | dort | adv |
| zaraz | за́раз | jetzt | adv |
| vdoma | вдо́ма | zu Hause | adv |
| knyzhka | кни́жка | Buch | noun |
| mova | мо́ва | Sprache | noun |
| ukrainskyi | украї́нський | ukrainisch | adj |
| nimetskyi | німе́цький | deutsch | adj |

### a1-1-06 · У кафе́ · Im Café · theme `cafe`
- **Can-do**: Ich kann im Café Getränke und Kleinigkeiten bestellen, nachfragen und um die Rechnung bitten. Ich kann einfache Wünsche äußern (ich möchte …).
- **Grammatik**: Akkusativ Sg. unbelebter Nomen: f. -а → -у, -я → -ю (ка́ва → ка́ву, вода́ → во́ду); m./n. unbelebt = Nominativ (чай, молоко́); хоті́ти: хо́чу, хо́чеш, хо́че, хо́чемо, хо́чете, хо́чуть; `Мо́жна …?`; Bestellen mit `Мені́ …, будь ла́ска`.
- **Redemittel**: Мені́ ка́ву, будь ла́ска. · Я хо́чу чай з молоко́м. · Мо́жна меню́? · Раху́нок, будь ла́ска. · Це все.

| id | uk | de | pos |
|---|---|---|---|
| kafe | кафе́ | Café | noun |
| kava | ка́ва | Kaffee | noun |
| chai | чай | Tee | noun |
| voda | вода́ | Wasser | noun |
| sik | сік | Saft | noun |
| moloko | молоко́ | Milch | noun |
| tsukor | цу́кор | Zucker | noun |
| tistechko | ті́стечко | Törtchen, Stück Kuchen | noun |
| khotity | хоті́ти | wollen, mögen (möchten) | verb |
| mozhna | мо́жна | man kann/darf; darf ich …? | adv |
| rakhunok | раху́нок | Rechnung | noun |
| menu | меню́ | Speisekarte | noun |
| chashka | ча́шка | Tasse | noun |
| sklianka | скля́нка | Glas (Trinkglas) | noun |
| z_molokom | з молоко́м | mit Milch | phrase |
| bez_tsukru | без цу́кру | ohne Zucker | phrase |
| kholodnyi | холо́дний | kalt | adj |
| hariachyi | гаря́чий | heiß | adj |
| shche | ще | noch | adv |
| vse | все | alles | pron |
| ofitsiant | офіціа́нт | Kellner | noun |

### a1-1-07 · Що ти лю́биш? · Was isst du gern? · theme `food`
- **Can-do**: Ich kann sagen, was ich gern esse und trinke, und andere danach fragen. Ich kann über Mahlzeiten sprechen (Frühstück, Mittag-, Abendessen).
- **Grammatik**: Präsens II. Konjugation: люби́ти – люблю́, лю́биш, лю́бить, лю́бимо, лю́бите, лю́блять (Einschub -л-); unregelmäßig ї́сти (їм, ї́си, їсть, їмо́, їсте́, їдя́ть) und пи́ти (п’ю, п’єш, п’є, п’ємо́, п’єте́, п’ють); Akk. (Wdh.); `люблю́` + Inf./Akk.
- **Redemittel**: Що ти лю́биш? – Я люблю́ ри́бу. · На сніда́нок я їм хліб із сиро́м. · Смачно́го! · Ду́же смачни́й борщ!

| id | uk | de | pos |
|---|---|---|---|
| isty | ї́сти | essen | verb |
| pyty | пи́ти | trinken | verb |
| liubyty | люби́ти | lieben, gern haben/mögen | verb |
| khlib | хліб | Brot | noun |
| syr | сир | Käse; Quark | noun |
| miaso | м’я́со | Fleisch | noun |
| ryba | ри́ба | Fisch | noun |
| kurka | ку́рка | Huhn, Hähnchen | noun |
| ovochi | о́вочі | Gemüse | noun |
| frukty | фру́кти | Obst | noun |
| yabluko | я́блуко | Apfel | noun |
| kartoplia | карто́пля | Kartoffeln | noun |
| yaitse | яйце́ | Ei | noun |
| sup | суп | Suppe | noun |
| borshch | борщ | Borschtsch | noun |
| salat | сала́т | Salat | noun |
| snidanok | сніда́нок | Frühstück | noun |
| obid | обі́д | Mittagessen | noun |
| vecheria | вече́ря | Abendessen | noun |
| smachnyi | смачни́й | lecker | adj |
| smachnoho | Смачно́го! | Guten Appetit! | phrase |

### a1-1-08 · Скі́льки ко́штує? · Was kostet das? · theme `shopping`
- **Can-do**: Ich kann nach Preisen fragen und Preise verstehen. Ich kann einfache Einkäufe machen (Menge, Bezahlung bar/Karte).
- **Grammatik**: Zahlen 30–1000 (Zehner, сто, дві́сті, п’ятсо́т, ти́сяча); Zusammensetzung (два́дцять п’ять); 1 гри́вня / 2–4 гри́вні / 5+ гри́вень; ко́штує / ко́штують; купува́ти (купу́ю); höfliche Bitte `Да́йте, будь ла́ска, …` + Akk.
- **Redemittel**: Скі́льки ко́штує сир? – Сто гри́вень. · Да́йте, будь ла́ска, кілогра́м я́блук. (я́блук als Glossar) · Мо́жна ка́рткою? · Це до́рого.

| id | uk | de | pos |
|---|---|---|---|
| trydtsiat | три́дцять | dreißig | num |
| sorok | со́рок | vierzig | num |
| piatdesiat | п’ятдеся́т | fünfzig | num |
| shistdesiat | шістдеся́т | sechzig | num |
| simdesiat | сімдеся́т | siebzig | num |
| visimdesiat | вісімдеся́т | achtzig | num |
| devianosto | дев’яно́сто | neunzig | num |
| sto | сто | hundert | num |
| dvisti | дві́сті | zweihundert | num |
| piatsot | п’ятсо́т | fünfhundert | num |
| tysiacha | ти́сяча | tausend | num |
| hryvnia | гри́вня | Hrywnja (Währung) | noun |
| koshtuvaty | ко́штувати | kosten | verb |
| skilky_koshtuie | Скі́льки ко́штує …? | Wie viel kostet …? | phrase |
| mahazyn | магази́н | Geschäft, Laden | noun |
| rynok | ри́нок | Markt | noun |
| kupuvaty | купува́ти | kaufen | verb |
| daite | Да́йте, будь ла́ска, … | Geben Sie mir bitte … | phrase |
| doroho | до́рого | teuer | adv |
| deshevo | деше́во | billig, günstig | adv |
| kilohram | кілогра́м | Kilogramm | noun |
| kartka | ка́ртка | (Bank-)Karte | noun |
| hotivka | готі́вка | Bargeld | noun |

### a1-1-09 · Моя́ кварти́ра · Meine Wohnung · theme `home`
- **Can-do**: Ich kann meine Wohnung und Zimmer einfach beschreiben. Ich kann sagen und fragen, wo sich etwas befindet. Ich kann einfache Eigenschaften nennen (groß, klein, neu, alt, schön, hell).
- **Grammatik**: Adjektive: Kongruenz m. -ий, f. -а, n. -е, Pl. -і (вели́кий / вели́ка / вели́ке / вели́кі); Lokativ auf `Де?`: у/в + -і (у кімна́ті, у ша́фі), на + -і (на ку́хні, на столі́); `Яки́й/яка́/яке́?`.
- **Redemittel**: У ме́не нова́ кварти́ра. · Яка́ твоя́ кімна́та? – Вели́ка і сві́тла. · Де ру́чка? – На столі́.

| id | uk | de | pos |
|---|---|---|---|
| kvartyra | кварти́ра | Wohnung | noun |
| dim | дім | Haus | noun |
| kimnata | кімна́та | Zimmer | noun |
| kukhnia | ку́хня | Küche | noun |
| vanna | ва́нна | Bad(ezimmer); Badewanne | noun |
| spalnia | спа́льня | Schlafzimmer | noun |
| stil | стіл | Tisch | noun |
| stilets | стіле́ць | Stuhl | noun |
| dyvan | дива́н | Sofa | noun |
| lizhko | лі́жко | Bett | noun |
| vikno | вікно́ | Fenster | noun |
| dveri | две́рі | Tür | noun |
| shafa | ша́фа | Schrank | noun |
| velykyi | вели́кий | groß | adj |
| malyi | мали́й | klein | adj |
| novyi | нови́й | neu | adj |
| staryi | стари́й | alt | adj |
| harnyi | га́рний | schön | adj |
| svitlyi | сві́тлий | hell | adj |
| yakyi | яки́й | welcher; was für ein | pron |

### a1-1-10 · Де апте́ка? · Wo ist die Apotheke? · theme `city`
- **Can-do**: Ich kann nach dem Weg fragen und einfache Wegbeschreibungen verstehen (geradeaus, rechts, links, nah, weit). Ich kann wichtige Orte in der Stadt benennen.
- **Grammatik**: Lokativ: у/в (у ба́нку, в апте́ці, у па́рку) vs. на (на зупи́нці, на вокза́лі, на пло́щі); `до` + Gen. als Chunk (до вокза́лу, до апте́ки); höflicher Imperativ als Chunk: `Іді́ть пря́мо`.
- **Redemittel**: Ви́бачте, де тут апте́ка? · Як дійти́ до вокза́лу? – Іді́ть пря́мо, по́тім пра́воруч. · Це дале́ко? – Ні, бли́зько.

| id | uk | de | pos |
|---|---|---|---|
| apteka | апте́ка | Apotheke | noun |
| bank | банк | Bank | noun |
| likarnia | лі́карня | Krankenhaus | noun |
| zupynka | зупи́нка | Haltestelle | noun |
| vokzal | вокза́л | Bahnhof | noun |
| metro | метро́ | U-Bahn, Metro | noun |
| ploshcha | пло́ща | Platz | noun |
| park | парк | Park | noun |
| tsentr | центр | Zentrum | noun |
| muzei | музе́й | Museum | noun |
| restoran | рестора́н | Restaurant | noun |
| hotel | готе́ль | Hotel | noun |
| tualet | туале́т | Toilette | noun |
| yty | іти́ | gehen (zu Fuß) | verb |
| yak_diity | Як дійти́ до …? | Wie komme ich (zu Fuß) zu …? | phrase |
| priamo | пря́мо | geradeaus | adv |
| pravoruch | пра́воруч | rechts | adv |
| livoruch | ліво́руч | links | adv |
| daleko | дале́ко | weit (entfernt) | adv |
| blyzko | бли́зько | nah | adv |
| potim | по́тім | dann, danach | adv |

### a1-1-11 · Котра́ годи́на? · Wie spät ist es? · theme `time`
- **Can-do**: Ich kann nach der Uhrzeit fragen und volle Stunden angeben. Ich kann sagen, um wie viel Uhr und zu welcher Tageszeit etwas stattfindet.
- **Grammatik**: Uhrzeit mit Ordinalzahlen (f., weil годи́на): `Котра́ годи́на? – Тре́тя.`; `О котрі́й? – О тре́тій.` (о + Lokativ, vor Vokal `об`: об одина́дцятій); Tageszeiten вра́нці, вдень, уве́чері, вночі́; `Зара́з …` (Wdh. за́раз).
- **Redemittel**: Котра́ за́раз годи́на? – Дев’я́та. · Я працю́ю з дев’я́тої до шо́стої (nur verstehen, Glossar). · Уве́чері я чита́ю.

| id | uk | de | pos |
|---|---|---|---|
| kotra_hodyna | Котра́ годи́на? | Wie spät ist es? | phrase |
| o_kotrii | О котрі́й? | Um wie viel Uhr? | phrase |
| hodyna | годи́на | Stunde; Uhr (Zeit) | noun |
| khvylyna | хвили́на | Minute | noun |
| persha | пе́рша | erste; ein Uhr | num |
| druha | дру́га | zweite; zwei Uhr | num |
| tretia | тре́тя | dritte; drei Uhr | num |
| chetverta | четве́рта | vierte; vier Uhr | num |
| piata | п’я́та | fünfte; fünf Uhr | num |
| shosta | шо́ста | sechste; sechs Uhr | num |
| soma | сьо́ма | siebte; sieben Uhr | num |
| vosma | во́сьма | achte; acht Uhr | num |
| deviata | дев’я́та | neunte; neun Uhr | num |
| desiata | деся́та | zehnte; zehn Uhr | num |
| odynadtsiata | одина́дцята | elfte; elf Uhr | num |
| dvanadtsiata | двана́дцята | zwölfte; zwölf Uhr | num |
| vrantsi | вра́нці | morgens | adv |
| vden | вдень | tagsüber, nachmittags | adv |
| uvecheri | уве́чері | abends | adv |
| vnochi | вночі́ | nachts | adv |
| rano | ра́но | früh | adv |
| pizno | пі́зно | spät | adv |

### a1-1-12 · Сього́дні понеді́лок · Heute ist Montag · theme `calendar`
- **Can-do**: Ich kann die Wochentage nennen und sagen, wann ich etwas mache (heute, morgen, am Montag …). Ich kann einfache Verabredungen treffen, zu- oder absagen.
- **Grammatik**: Wochentage: `у/в` + Akk. (у понеді́лок, у сере́ду, у п’я́тницю, у субо́ту, в неді́лю – f. -а → -у!); ма́ти (ма́ю, ма́єш …: `Я ма́ю час`); могти́ (мо́жу, мо́жеш …); `Коли́?`.
- **Redemittel**: Яки́й сього́дні день? – Сього́дні середа́. · Ти ма́єш час у п’я́тницю? – На жаль, ні. (на жаль als Glossar) · Ході́мо ра́зом у кіно́! (ході́мо als Glossar)

| id | uk | de | pos |
|---|---|---|---|
| ponedilok | понеді́лок | Montag | noun |
| vivtorok | вівто́рок | Dienstag | noun |
| sereda | середа́ | Mittwoch | noun |
| chetver | четве́р | Donnerstag | noun |
| piatnytsia | п’я́тниця | Freitag | noun |
| subota | субо́та | Samstag | noun |
| nedilia | неді́ля | Sonntag | noun |
| den | день | Tag | noun |
| tyzhden | ти́ждень | Woche | noun |
| vykhidni | вихідні́ | Wochenende | noun |
| sohodni | сього́дні | heute | adv |
| zavtra | за́втра | morgen | adv |
| uchora | учо́ра | gestern | adv |
| shchodnia | щодня́ | täglich | adv |
| koly | коли́ | wann | adv |
| maty | ма́ти | haben | verb |
| chas | час | Zeit | noun |
| vilnyi | ві́льний | frei | adj |
| mohty | могти́ | können | verb |
| zustrich | зу́стріч | Treffen, Termin | noun |
| razom | ра́зом | zusammen | adv |
| kino | кіно́ | Kino | noun |

### a1-1-13 · Моя́ робо́та · Mein Beruf · theme `work`
- **Can-do**: Ich kann meinen Beruf nennen und andere nach ihrem Beruf fragen. Ich kann sagen, wo ich arbeite, und meine Arbeit kurz bewerten (interessant, schwer).
- **Grammatik**: `Я юри́ст.` (kein „sein“) vs. `Я працю́ю юри́стом.` (Instr. als Chunk); `Ким ти працю́єш?`; weibliche Berufsbezeichnungen (юри́стка, вчи́телька, лі́карка, студе́нтка, адвока́тка); на робо́ті, в о́фісі, у компа́нії (Lok., Wdh.).
- **Redemittel**: Ким ви працю́єте? – Я юри́ст. · Я працю́ю в компа́нії в Берлі́ні. · Моя́ робо́та ціка́ва, але́ важка́.

| id | uk | de | pos |
|---|---|---|---|
| robota | робо́та | Arbeit | noun |
| profesiia | профе́сія | Beruf | noun |
| kym_ty_pratsiuiesh | Ким ти працю́єш? | Was bist du von Beruf? | phrase |
| yurist | юри́ст | Jurist | noun |
| advokat | адвока́т | Rechtsanwalt | noun |
| likar | лі́кар | Arzt | noun |
| vchytel | вчи́тель | Lehrer | noun |
| inzhener | інжене́р | Ingenieur | noun |
| menedzher | ме́неджер | Manager | noun |
| prohramist | програмі́ст | Programmierer | noun |
| bukhhalter | бухга́лтер | Buchhalter | noun |
| student | студе́нт | Student | noun |
| kompaniia | компа́нія | Firma, Unternehmen | noun |
| ofis | о́фіс | Büro | noun |
| kolega | коле́га | Kollege, Kollegin | noun |
| kerivnyk | керівни́к | Chef, Leiter | noun |
| kliient | кліє́нт | Kunde, Mandant | noun |
| tsikavyi | ціка́вий | interessant | adj |
| vazhkyi | важки́й | schwer, schwierig | adj |
| lehkyi | легки́й | leicht | adj |

### a1-1-14 · В о́фісі · Im Büro · theme `office`
- **Can-do**: Ich kann Gegenstände im Büro benennen und um etwas bitten. Ich kann höfliche Aufforderungen verstehen und verwenden (Kommen Sie herein, warten Sie bitte). Ich kann sagen, ob ich Zeit habe oder beschäftigt bin.
- **Grammatik**: höflicher Imperativ (ви): -і́ть / -йте (Зачека́йте, Сіда́йте, Захо́дьте, Повторі́ть, Напиші́ть, Да́йте); ти-Imperativ zum Wiedererkennen (зачека́й, сіда́й); писа́ти (пишу́, пи́шеш), дзвони́ти (дзвоню́, дзво́ниш); `Чи мо́жете ви …?`.
- **Redemittel**: Захо́дьте, будь ла́ска! Сіда́йте. · Хвили́нку! · Повторі́ть, будь ла́ска. · Ви́бачте, я за́раз зайня́тий/зайня́та. · Чи мо́жете ви допомогти́?

| id | uk | de | pos |
|---|---|---|---|
| kompiuter | комп’ю́тер | Computer | noun |
| telefon | телефо́н | Telefon | noun |
| lyst | лист | Brief; E-Mail | noun |
| dokument | докуме́нт | Dokument | noun |
| ruchka | ру́чка | Kugelschreiber | noun |
| papir | папі́р | Papier | noun |
| prynter | при́нтер | Drucker | noun |
| narada | нара́да | Besprechung, Sitzung | noun |
| pytannia | пита́ння | Frage | noun |
| pysaty | писа́ти | schreiben | verb |
| dzvonyty | дзвони́ти | anrufen | verb |
| chekaty | чека́ти | warten | verb |
| dopomohty | допомогти́ | helfen | verb |
| zakhodte | Захо́дьте! | Kommen Sie herein! | phrase |
| sidaite | Сіда́йте! | Setzen Sie sich! | phrase |
| khvylynku | Хвили́нку! | Einen Moment! | phrase |
| povtorit | Повторі́ть, будь ла́ска. | Wiederholen Sie bitte. | phrase |
| zainiatyi | зайня́тий | beschäftigt, besetzt | adj |
| hotovyi | гото́вий | fertig, bereit | adj |
| terminovo | терміно́во | dringend | adv |

### a1-1-15 · Ва́ші докуме́нти, будь ла́ска · Ihre Dokumente, bitte · theme `law`
- **Can-do**: Ich kann in einfachen Formularen und am Schalter meine persönlichen Daten angeben (Vorname, Nachname, Adresse, Geburtsdatum, Staatsangehörigkeit). Ich kann Dokumente vorzeigen und einfache Aufforderungen verstehen (Zeigen Sie …, Unterschreiben Sie …). Ich kenne sehr grundlegende Begriffe aus Recht und Verwaltung.
- **Grammatik**: Possessiv ваш/ва́ша/ва́ше/ва́ші; Imperativ Покажі́ть, Підпиші́ть, Запо́вніть; Wiederholung Akk. (Покажі́ть па́спорт, Запо́вніть зая́ву) und Lok. (у суді́, в посо́льстві).
- **Redemittel**: Ва́ше ім’я́ і прі́звище? · Покажі́ть, будь ла́ска, па́спорт. · Підпиші́ть тут. · Я хо́чу пода́ти зая́ву. (пода́ти als Glossar)

| id | uk | de | pos |
|---|---|---|---|
| pasport | па́спорт | Pass, Reisepass | noun |
| imia | ім’я́ | Vorname | noun |
| prizvyshche | прі́звище | Nachname | noun |
| adresa | адре́са | Adresse | noun |
| data_narodzhennia | да́та наро́дження | Geburtsdatum | phrase |
| hromadianstvo | громадя́нство | Staatsangehörigkeit | noun |
| vash | ваш | Ihr; euer | pron |
| blank | бланк | Formular | noun |
| zaiava | зая́ва | Antrag | noun |
| dovidka | до́відка | Bescheinigung | noun |
| pidpys | пі́дпис | Unterschrift | noun |
| pidpysaty | підписа́ти | unterschreiben | verb |
| pokazhit | Покажі́ть, будь ла́ска, … | Zeigen Sie bitte … | phrase |
| dohovir | до́говір | Vertrag | noun |
| pravo | пра́во | Recht | noun |
| zakon | зако́н | Gesetz | noun |
| sud | суд | Gericht | noun |
| notarius | нота́ріус | Notar | noun |
| politsiia | полі́ція | Polizei | noun |
| posolstvo | посо́льство | Botschaft | noun |

---

## A1.2 – Lektionsplan (Status: planned)

| id | title_uk | title_de | theme | Ziele (Can-do) | Grammatik | Wortfelder |
|---|---|---|---|---|---|---|
| a1-2-01 | Мій день | Mein Tag | time | Tagesablauf beschreiben; Uhrzeiten mit halb/Viertel | reflexive Verben (-ся): прокида́тися, вмива́тися; пів на …, чверть | Tagesablauf, Körperpflege |
| a1-2-02 | Тра́нспорт | Verkehrsmittel | transport | Verkehrsmittel nennen, Fahrkarte kaufen, nach Abfahrt fragen | ї́хати vs. іти́; на + Lok. (на авто́бусі); Bewegungsrichtung у/в + Akk. | Verkehr, Fahrkarten |
| a1-2-03 | Пого́да | Das Wetter | weather | über Wetter und Jahreszeiten sprechen | unpersönliche Sätze (хо́лодно, тепло́); Jahreszeiten (взи́мку, влі́тку) | Wetter, Jahreszeiten, Temperatur |
| a1-2-04 | Ко́лір і о́дяг | Farben und Kleidung | clothes | Kleidung und Farben beschreiben | Adjektiv-Kongruenz inkl. Akk.; Plural Nom. | Farben, Kleidung |
| a1-2-05 | Що ти роби́в учо́ра? | Was hast du gestern gemacht? | time | über Vergangenes berichten | Präteritum (-в, -ла, -ло, -ли) | Alltagsaktivitäten |
| a1-2-06 | Мої́ хо́бі | Meine Hobbys | hobby | Freizeit und Vorlieben ausdrücken | мені́ подо́бається + Inf./Nom.; гра́ти в/на | Freizeit, Sport, Musik |
| a1-2-07 | У магази́ні о́дягу | Im Bekleidungsgeschäft | shopping | Größe, Farbe, Preis erfragen, anprobieren | Genitiv nach Zahlen und Mengen; цей/ця/це | Einkauf, Größen |
| a1-2-08 | У рестора́ні | Im Restaurant | food | im Restaurant bestellen, reklamieren, bezahlen | нема́є + Gen.; без + Gen.; Plural Akk. (unbelebt) | Speisen, Getränke, Geschirr |
| a1-2-09 | Здоро́в’я | Gesundheit | health | Beschwerden nennen, beim Arzt einfache Angaben machen | У ме́не боли́ть …; Dativ мені́/тобі́ (Wdh.) | Körperteile, Beschwerden |
| a1-2-10 | Дати́ і мі́сяці | Daten und Monate | calendar | Datum, Geburtstag, Termine angeben | Ordinalzahlen n.; Genitiv der Monate (пе́ршого бе́резня) | Monate, Datum |
| a1-2-11 | Які́ вони́? | Wie sind sie? | people | Aussehen und Charakter einfach beschreiben | Adjektive Pl.; ду́же/не ду́же | Aussehen, Charakter |
| a1-2-12 | Робо́чий день | Arbeitstag | office | Termine vereinbaren und verschieben, kurze E-Mail | Dativ Sg. (Personen); бу́ти у Präteritum | Termine, E-Mail, Büroalltag |
| a1-2-13 | Банк і по́шта | Bank und Post | city | Konto, Geld abheben, Paket senden | Gen. Sg. (без, для, від); ві́дправити/отри́мати | Bank, Post |
| a1-2-14 | Свята́ | Feste | calendar | gratulieren, über Feste sprechen | Віта́ю з … (з + Instr.); Wünsche (Бажа́ю …) | Feiertage, Glückwünsche |
| a1-2-15 | В устано́ві | Auf dem Amt | law | Termin bei Behörde, nach Zuständigkeit fragen, Formular ausfüllen | Gen. bei Angaben (на ім’я́ …); Modalität потрі́бно/тре́ба | Behörde, Antrag, Fristen |

## A1.3 – Lektionsplan (Status: planned)

| id | title_uk | title_de | theme | Ziele (Can-do) | Grammatik | Wortfelder |
|---|---|---|---|---|---|---|
| a1-3-01 | Пла́ни на вихідні́ | Pläne fürs Wochenende | hobby | Pläne machen und darüber sprechen | Futur: бу́ду + Inf., synthetisch (чита́тиму) | Freizeit, Verabredungen |
| a1-3-02 | Подоро́ж | Die Reise | travel | Reise planen, Fahrkarte/Ticket buchen | Aspekt (Einführung: купува́ти/купи́ти) | Reise, Ticket, Gepäck |
| a1-3-03 | У готе́лі | Im Hotel | travel | ein- und auschecken, Probleme melden | Lok. Pl. Grundformen; чи + Frage | Hotel, Zimmerausstattung |
| a1-3-04 | В апте́ці | In der Apotheke | health | Medikamente kaufen, Einnahme verstehen | Imperativ (Wdh.), Zahlwort + Gen. Pl. | Medikamente, Beschwerden |
| a1-3-05 | Оре́нда кварти́ри | Wohnung mieten | home | Wohnungsanzeige verstehen, Mietvertrag-Grundbegriffe | Komparativ Grundform (бі́льший, деше́вший) | Miete, Vertrag, Nebenkosten |
| a1-3-06 | Ха́тні спра́ви | Hausarbeit | home | Hausarbeiten benennen, Aufgaben verteilen | Aspekt im Präteritum (роби́в/зроби́в) | Haushalt |
| a1-3-07 | Запро́шення | Einladungen | people | einladen, annehmen, ablehnen, telefonieren | Modalverben (хоті́ти, могти́, му́сити) | Einladung, Telefon |
| a1-3-08 | На ку́рсі | Im Sprachkurs | school | über Lernen sprechen, nachfragen | Instr. (з + Instr., Wdh.); тому́ що/бо | Schule, Kurs |
| a1-3-09 | Співбе́сіда | Vorstellungsgespräch | work | sich bewerben, Lebenslauf-Grunddaten | Präteritum + Zeitangaben (з … до …) | Bewerbung, Erfahrung |
| a1-3-10 | Телефо́нна розмо́ва | Telefonat im Beruf | office | Anruf annehmen, Nachricht hinterlassen | Dativ (Wdh.), Futur (Wdh.) | Telefon, Nachricht |
| a1-3-11 | У полі́ції | Bei der Polizei | law | Verlust/Diebstahl melden, Personalien angeben | Präteritum + Akk.; Passiv-Chunks (вкра́ли) | Polizei, Diebstahl, Rechte |
| a1-3-12 | Культу́ра в мі́сті | Kultur in der Stadt | city | Tickets kaufen, Veranstaltungen besprechen | Zeitangaben (о сьо́мій годи́ні), Wdh. Futur | Theater, Museum, Konzert |
| a1-3-13 | Приро́да | Natur | weather | Natur und Ausflug beschreiben | Präpositionen des Ortes (над, під, бі́ля) | Natur, Landschaft |
| a1-3-14 | Порівня́ння | Vergleiche | people | Dinge und Orte vergleichen | Komparativ/Superlativ (кра́щий, найкра́щий) | Eigenschaften, Städte |
| a1-3-15 | Пі́дсумок | Abschluss A1 | travel | Gesamtwiederholung, Prüfungsformate A1 | Wiederholung aller A1-Strukturen | gemischt |

---

## Autoren-Leitfaden für Lektionsdateien (`content/a1-1/<id>.json`)

### Wortschatz und Auflösbarkeit
- `vocab` enthält **genau** die geplanten Einträge der Lektion (ids und `uk` wie in der Tabelle; Reihenfolge wie im Plan). Zusätzliche Wörter kommen ins `glossary`, nicht in `vocab`.
- Erlaubter Wortschatz in Aufgaben: `glossary-common.json` + Vokabeln dieser und **früherer** Lektionen + höchstens ca. 8–12 zusätzliche, glossierte Wörter (einfach, hochfrequent). Wörter späterer Lektionen nur ausnahmsweise und dann glossiert.
- **Jedes** ukrainische Token jedes ukrainischen Feldes muss auflösbar sein. Verlass dich bei früheren Lektionen **nur** auf deren exakte Plan-`uk`-Einzelwörter (z. B. `ка́ва`, `до́бре`). Gebeugte Formen früherer Vokabeln (z. B. `ка́ву`, `живе́ш`, `мене́`) und Einzelwörter aus Mehrwortausdrücken (z. B. `ра́нок` aus `до́брий ра́нок`) trägst du **selbst** in dein `glossary` ein (Duplikate sind erlaubt und werden später bereinigt).
- Eigene Vokabeln: alle in der Lektion verwendeten Formen in `forms` (mit `info`, z. B. „Akk. Sg.“, „1. Sg. Präs.“); wichtige Paradigmaformen dürfen zusätzlich rein.
- Mehrwortvokabeln (`phrase`): Einzelwörter, die sonst nicht auflösbar sind, ins `glossary` (mit `lemma`, `de`, `info`).
- `info` immer deutsch und kurz: Nomen „m./f./n./Pl.“ (+ Kasus/Numerus bei Formen), Verben „Inf.; я …, ти … (I./II. Konj.)“, Formen „2. Sg. Präs. · Inf. жи́ти“, Adjektive „m. Nom. Sg.“ usw.

### Textkonventionen (Validator prüft)
- Betonung: kombinierendes Akut **U+0301** direkt nach dem betonten Vokal; **jedes** mehrsilbige Wort genau eine Betonung, einsilbige keine (`їм`, `п’ю`, `день`, `вдень`, `час`, `сік` ohne Akzent). Vokale: а е є и і ї о у ю я.
- Nur kyrillische Buchstaben in ukrainischen Feldern (Achtung: kyrillisches **і** U+0456, nicht lateinisches i; kein lateinisches o/a/e/c/p/x!). Apostroph nur **’ (U+2019)**.
- Tipp: JSON per Python/Node-Skript erzeugen (kein Handescaping), z. B. Betonung im Quelltext als `+` hinter dem Vokal notieren und per Skript in U+0301 umwandeln (`ка+ва` → `ка́ва`); lateinische Buchstaben vorher ausschließen.
- Deutsch: neutral und knapp, Lernende nicht siezen (Infinitiv-/Nominalstil, z. B. „Achtung: Akkusativ!“, „Hier passt ти, nicht ви.“). Typ-Anweisungen kommen aus `ui-strings.json`. In de→uk-Prompts Anrede markieren: „(du)“ bzw. „(Sie)“, wenn ти/ви sonst mehrdeutig wäre.
- Ukrainische Anweisungen im ти-Imperativ (`Переклади́`, `Обери́`; nicht „Перекладі́“).
- Geschlecht der lernenden Person ist unbekannt: Sätze in der Ich-Form ohne geschlechtsmarkierte Formen (keine Ich-Präteritumformen, kein `я зайня́тий/зайня́та` als einzige Lösung) – oder beide Formen über `accept` zulassen.

### Sprachqualität
- Standardukrainisch, **keine Russismen/Surschyk** (siehe `docs/research-content.md`), natürliche, idiomatische Sätze, die Muttersprachler so sagen würden. Je Begriff eine gängige Form (keine Synonymketten).
- Einfachste Wörter, kurze Sätze; Inhalte für Erwachsene (Beruf, Behörde, Alltag), keine Kindersprache.
- Bei Unsicherheit (Form, Betonung, Ausdruck): `docs/research-content.md` lesen, sonst WebSearch/WebFetch (goroh.pp.ua, slovnyk.ua, sum.in.ua). Plan-Fehler nicht stillschweigend ändern, sondern im Abschlussbericht melden (falls eindeutig falsch: korrigierte Form verwenden und melden).

### Aufgaben (mind. 45, Ziel 50–60)
- Richtwerte: `mc_translate` 6–8 (beide Richtungen), `build_sentence` 6–8 (überwiegend de-uk), `cloze` 6–8 (Formen/Grammatik im Kontext), `chat` 3–4, `reading` 2–3, `listening` 7–8 (alle drei Modi), `speak` 6–8, `match_pairs` 3–4, `picture_choice` 3–4 (nur eindeutige Emojis), `true_false` 4–5, `order_dialog` 2–3.
- Reihenfolge didaktisch: Einführen/Wiedererkennen (picture_choice, mc uk-de, match) → gelenkte Übung (cloze, mc de-uk, listening) → freiere Produktion (build_sentence, speak) → kommunikativ (chat, order_dialog) → Lesen; `difficulty` von 1 nach 3 steigend, aber gemischt (Interleaving).
- Jede eigene Vokabel in **≥ 3** (besser 4–6) Aufgaben, in verschiedenen Formen, Kontexten und Richtungen; `vocab`-Array jeder Aufgabe nennt die geübten ids (eigene und frühere). Ca. 20–30 % der Aufgaben beziehen frühere Lektionen ein.
- Richtige Option **immer an Index 0**; Distraktoren plausibel (gleiche Wortart/Form, ähnlicher Klang), aber eindeutig falsch. Keine zweite korrekte Option (Vorsicht bei ти/ви-Varianten, freier Wortstellung, Synonymen).
- `build_sentence`: `answer` wird in Kacheln zerlegt; ukrainische Wortstellung ist frei – alle natürlichen Varianten in `accept`. Distraktoren dürfen nicht in der Lösung vorkommen.
- `cloze`: Lücken `{{…}}`, je Lücke ein Options-Array (Index 0 = Lückeninhalt, 2–4 Optionen), gut für Endungen/Formen.
- `chat`: realistische Alltagsszene, Partner mit ukrainischem Namen (Glossar), 2–3 `me`-Entscheidungen je Chat, falsche Optionen mit erklärendem `feedback_de` (warum unpassend: Register, Bedeutung, Form).
- `reading`: 3–8 Sätze, nur bekannter Wortschatz + wenige glossierte Wörter; 3–5 Fragen, gemischt `mc` (ukrainische Optionen) und `tf`; Fragen in einfachstem Ukrainisch.
- `listening`: `choose_meaning` (deutsche Optionen), `choose_heard` (ukrainische Optionen, Index 0 = `audio_uk`, ähnlich klingende Distraktoren), `build` (`answer` = `audio_uk`).
- `speak`: nützliche Sätze/Chunks fürs echte Leben.
- `true_false`: kurze Situation (`context_uk` + `context_de`), Aussage, `explanation_de`.
- `order_dialog`: 3–5 Zeilen eines natürlichen Dialogs in richtiger Reihenfolge (Reihenfolge muss eindeutig sein).
- `grammar`: 2–4 Blöcke, `body_de` ≤ 80 Wörter, je 2–4 Beispiele.

### Ablauf
1. Datei schreiben. 2. `node tools/validate-content.mjs --lesson <id>` bis fehlerfrei. 3. Unabhängige Prüfung (Prüf-Subagent). 4. Korrigieren, erneut validieren. 5. Kurzbericht.

## Maschinenlesbarer Plan (für `tools/validate-content.mjs --lesson`)

Nicht von Hand abweichen: Die Vokabelzeilen oben und dieser Block müssen identisch sein.

<!-- PLAN-JSON-START -->
```json
{
 "lessons": [
  {
   "id": "a1-1-01",
   "title_uk": "Приві́т!",
   "title_de": "Hallo!",
   "theme": "greetings",
   "vocab": [
    {
     "id": "pryvit",
     "uk": "приві́т",
     "de": "hallo (informell)",
     "pos": "interj"
    },
    {
     "id": "dobryi_den",
     "uk": "до́брий день",
     "de": "guten Tag",
     "pos": "phrase"
    },
    {
     "id": "dobryi_ranok",
     "uk": "до́брий ра́нок",
     "de": "guten Morgen",
     "pos": "phrase"
    },
    {
     "id": "dobryi_vechir",
     "uk": "до́брий ве́чір",
     "de": "guten Abend",
     "pos": "phrase"
    },
    {
     "id": "na_dobranich",
     "uk": "на добра́ніч",
     "de": "gute Nacht",
     "pos": "phrase"
    },
    {
     "id": "do_pobachennia",
     "uk": "до поба́чення",
     "de": "auf Wiedersehen",
     "pos": "phrase"
    },
    {
     "id": "buvai",
     "uk": "бува́й",
     "de": "tschüss (zu einer Person, informell)",
     "pos": "interj"
    },
    {
     "id": "yak",
     "uk": "як",
     "de": "wie",
     "pos": "adv"
    },
    {
     "id": "yak_spravy",
     "uk": "Як спра́ви?",
     "de": "Wie geht’s?",
     "pos": "phrase"
    },
    {
     "id": "dobre",
     "uk": "до́бре",
     "de": "gut",
     "pos": "adv"
    },
    {
     "id": "normalno",
     "uk": "норма́льно",
     "de": "ganz gut, okay",
     "pos": "adv"
    },
    {
     "id": "pohano",
     "uk": "пога́но",
     "de": "schlecht",
     "pos": "adv"
    },
    {
     "id": "duzhe",
     "uk": "ду́же",
     "de": "sehr",
     "pos": "adv"
    },
    {
     "id": "diakuiu",
     "uk": "дя́кую",
     "de": "danke",
     "pos": "phrase"
    },
    {
     "id": "bud_laska",
     "uk": "будь ла́ска",
     "de": "bitte",
     "pos": "phrase"
    },
    {
     "id": "vybachte",
     "uk": "ви́бачте",
     "de": "Entschuldigung (Sie/ihr)",
     "pos": "phrase"
    },
    {
     "id": "tak",
     "uk": "так",
     "de": "ja",
     "pos": "part"
    },
    {
     "id": "ni",
     "uk": "ні",
     "de": "nein",
     "pos": "part"
    },
    {
     "id": "ya",
     "uk": "я",
     "de": "ich",
     "pos": "pron"
    },
    {
     "id": "ty",
     "uk": "ти",
     "de": "du",
     "pos": "pron"
    },
    {
     "id": "vy",
     "uk": "ви",
     "de": "Sie; ihr",
     "pos": "pron"
    },
    {
     "id": "tezh",
     "uk": "теж",
     "de": "auch",
     "pos": "adv"
    },
    {
     "id": "a_ty",
     "uk": "А ти?",
     "de": "Und du?",
     "pos": "phrase"
    }
   ]
  },
  {
   "id": "a1-1-02",
   "title_uk": "Як тебе́ зва́ти?",
   "title_de": "Wie heißt du?",
   "theme": "people",
   "vocab": [
    {
     "id": "mene_zvaty",
     "uk": "Мене́ зва́ти …",
     "de": "Ich heiße …",
     "pos": "phrase"
    },
    {
     "id": "yak_tebe_zvaty",
     "uk": "Як тебе́ зва́ти?",
     "de": "Wie heißt du?",
     "pos": "phrase"
    },
    {
     "id": "yak_vas_zvaty",
     "uk": "Як вас зва́ти?",
     "de": "Wie heißen Sie?",
     "pos": "phrase"
    },
    {
     "id": "duzhe_pryiemno",
     "uk": "Ду́же приє́мно!",
     "de": "Freut mich!",
     "pos": "phrase"
    },
    {
     "id": "vin",
     "uk": "він",
     "de": "er",
     "pos": "pron"
    },
    {
     "id": "vona",
     "uk": "вона́",
     "de": "sie (Sg.)",
     "pos": "pron"
    },
    {
     "id": "my",
     "uk": "ми",
     "de": "wir",
     "pos": "pron"
    },
    {
     "id": "vony",
     "uk": "вони́",
     "de": "sie (Pl.)",
     "pos": "pron"
    },
    {
     "id": "khto",
     "uk": "хто",
     "de": "wer",
     "pos": "pron"
    },
    {
     "id": "shcho",
     "uk": "що",
     "de": "was",
     "pos": "pron"
    },
    {
     "id": "tse",
     "uk": "це",
     "de": "das (ist), dies",
     "pos": "pron"
    },
    {
     "id": "zvidky",
     "uk": "зві́дки",
     "de": "woher",
     "pos": "adv"
    },
    {
     "id": "nimechchyna",
     "uk": "Німе́ччина",
     "de": "Deutschland",
     "pos": "name"
    },
    {
     "id": "ukraina",
     "uk": "Украї́на",
     "de": "Ukraine",
     "pos": "name"
    },
    {
     "id": "ne",
     "uk": "не",
     "de": "nicht",
     "pos": "part"
    },
    {
     "id": "rozmovliaty",
     "uk": "розмовля́ти",
     "de": "sprechen (eine Sprache), sich unterhalten",
     "pos": "verb"
    },
    {
     "id": "ukrainskoiu",
     "uk": "украї́нською",
     "de": "(auf) Ukrainisch",
     "pos": "adv"
    },
    {
     "id": "nimetskoiu",
     "uk": "німе́цькою",
     "de": "(auf) Deutsch",
     "pos": "adv"
    },
    {
     "id": "anhliiskoiu",
     "uk": "англі́йською",
     "de": "(auf) Englisch",
     "pos": "adv"
    },
    {
     "id": "trokhy",
     "uk": "тро́хи",
     "de": "ein bisschen",
     "pos": "adv"
    },
    {
     "id": "rozumity",
     "uk": "розумі́ти",
     "de": "verstehen",
     "pos": "verb"
    },
    {
     "id": "pan",
     "uk": "пан",
     "de": "Herr (Anrede)",
     "pos": "noun"
    },
    {
     "id": "pani",
     "uk": "па́ні",
     "de": "Frau (Anrede)",
     "pos": "noun"
    },
    {
     "id": "druh",
     "uk": "друг",
     "de": "Freund",
     "pos": "noun"
    },
    {
     "id": "podruha",
     "uk": "подру́га",
     "de": "Freundin",
     "pos": "noun"
    }
   ]
  },
  {
   "id": "a1-1-03",
   "title_uk": "Скі́льки? Чи́сла",
   "title_de": "Wie viel? Zahlen",
   "theme": "numbers",
   "vocab": [
    {
     "id": "nul",
     "uk": "нуль",
     "de": "null",
     "pos": "num"
    },
    {
     "id": "odyn",
     "uk": "оди́н",
     "de": "eins",
     "pos": "num"
    },
    {
     "id": "dva",
     "uk": "два",
     "de": "zwei",
     "pos": "num"
    },
    {
     "id": "try",
     "uk": "три",
     "de": "drei",
     "pos": "num"
    },
    {
     "id": "chotyry",
     "uk": "чоти́ри",
     "de": "vier",
     "pos": "num"
    },
    {
     "id": "piat",
     "uk": "п’ять",
     "de": "fünf",
     "pos": "num"
    },
    {
     "id": "shist",
     "uk": "шість",
     "de": "sechs",
     "pos": "num"
    },
    {
     "id": "sim",
     "uk": "сім",
     "de": "sieben",
     "pos": "num"
    },
    {
     "id": "visim",
     "uk": "ві́сім",
     "de": "acht",
     "pos": "num"
    },
    {
     "id": "deviat",
     "uk": "де́в’ять",
     "de": "neun",
     "pos": "num"
    },
    {
     "id": "desiat",
     "uk": "де́сять",
     "de": "zehn",
     "pos": "num"
    },
    {
     "id": "odynadtsiat",
     "uk": "одина́дцять",
     "de": "elf",
     "pos": "num"
    },
    {
     "id": "dvanadtsiat",
     "uk": "двана́дцять",
     "de": "zwölf",
     "pos": "num"
    },
    {
     "id": "trynadtsiat",
     "uk": "трина́дцять",
     "de": "dreizehn",
     "pos": "num"
    },
    {
     "id": "chotyrnadtsiat",
     "uk": "чотирна́дцять",
     "de": "vierzehn",
     "pos": "num"
    },
    {
     "id": "piatnadtsiat",
     "uk": "п’ятна́дцять",
     "de": "fünfzehn",
     "pos": "num"
    },
    {
     "id": "shistnadtsiat",
     "uk": "шістна́дцять",
     "de": "sechzehn",
     "pos": "num"
    },
    {
     "id": "simnadtsiat",
     "uk": "сімна́дцять",
     "de": "siebzehn",
     "pos": "num"
    },
    {
     "id": "visimnadtsiat",
     "uk": "вісімна́дцять",
     "de": "achtzehn",
     "pos": "num"
    },
    {
     "id": "deviatnadtsiat",
     "uk": "дев’ятна́дцять",
     "de": "neunzehn",
     "pos": "num"
    },
    {
     "id": "dvadtsiat",
     "uk": "два́дцять",
     "de": "zwanzig",
     "pos": "num"
    },
    {
     "id": "skilky",
     "uk": "скі́льки",
     "de": "wie viel",
     "pos": "adv"
    },
    {
     "id": "rik",
     "uk": "рік",
     "de": "Jahr",
     "pos": "noun"
    },
    {
     "id": "skilky_tobi_rokiv",
     "uk": "Скі́льки тобі́ ро́ків?",
     "de": "Wie alt bist du?",
     "pos": "phrase"
    },
    {
     "id": "meni_rokiv",
     "uk": "Мені́ … ро́ків.",
     "de": "Ich bin … Jahre alt.",
     "pos": "phrase"
    },
    {
     "id": "nomer_telefonu",
     "uk": "но́мер телефо́ну",
     "de": "Telefonnummer",
     "pos": "phrase"
    }
   ]
  },
  {
   "id": "a1-1-04",
   "title_uk": "Моя́ сім’я́",
   "title_de": "Meine Familie",
   "theme": "family",
   "vocab": [
    {
     "id": "simia",
     "uk": "сім’я́",
     "de": "Familie",
     "pos": "noun"
    },
    {
     "id": "mama",
     "uk": "ма́ма",
     "de": "Mama, Mutter",
     "pos": "noun"
    },
    {
     "id": "tato",
     "uk": "та́то",
     "de": "Papa, Vater",
     "pos": "noun"
    },
    {
     "id": "batky",
     "uk": "батьки́",
     "de": "Eltern",
     "pos": "noun"
    },
    {
     "id": "syn",
     "uk": "син",
     "de": "Sohn",
     "pos": "noun"
    },
    {
     "id": "dochka",
     "uk": "дочка́",
     "de": "Tochter",
     "pos": "noun"
    },
    {
     "id": "brat",
     "uk": "брат",
     "de": "Bruder",
     "pos": "noun"
    },
    {
     "id": "sestra",
     "uk": "сестра́",
     "de": "Schwester",
     "pos": "noun"
    },
    {
     "id": "cholovik",
     "uk": "чолові́к",
     "de": "Ehemann; Mann",
     "pos": "noun"
    },
    {
     "id": "druzhyna",
     "uk": "дружи́на",
     "de": "Ehefrau",
     "pos": "noun"
    },
    {
     "id": "dytyna",
     "uk": "дити́на",
     "de": "Kind",
     "pos": "noun"
    },
    {
     "id": "dity",
     "uk": "ді́ти",
     "de": "Kinder",
     "pos": "noun"
    },
    {
     "id": "babusia",
     "uk": "бабу́ся",
     "de": "Oma",
     "pos": "noun"
    },
    {
     "id": "didus",
     "uk": "діду́сь",
     "de": "Opa",
     "pos": "noun"
    },
    {
     "id": "kit",
     "uk": "кіт",
     "de": "Kater, Katze",
     "pos": "noun"
    },
    {
     "id": "miy",
     "uk": "мій",
     "de": "mein",
     "pos": "pron"
    },
    {
     "id": "tviy",
     "uk": "твій",
     "de": "dein",
     "pos": "pron"
    },
    {
     "id": "yoho",
     "uk": "його́",
     "de": "sein (Possessiv)",
     "pos": "pron"
    },
    {
     "id": "yii",
     "uk": "її́",
     "de": "ihr (Possessiv)",
     "pos": "pron"
    },
    {
     "id": "u_mene_ie",
     "uk": "У ме́не є …",
     "de": "Ich habe …",
     "pos": "phrase"
    },
    {
     "id": "ie",
     "uk": "є",
     "de": "ist/gibt es; (hat)",
     "pos": "verb"
    },
    {
     "id": "os",
     "uk": "ось",
     "de": "hier ist, da ist",
     "pos": "part"
    }
   ]
  },
  {
   "id": "a1-1-05",
   "title_uk": "Де ти живе́ш?",
   "title_de": "Wo wohnst du?",
   "theme": "people",
   "vocab": [
    {
     "id": "de",
     "uk": "де",
     "de": "wo",
     "pos": "adv"
    },
    {
     "id": "zhyty",
     "uk": "жи́ти",
     "de": "wohnen, leben",
     "pos": "verb"
    },
    {
     "id": "pratsiuvaty",
     "uk": "працюва́ти",
     "de": "arbeiten",
     "pos": "verb"
    },
    {
     "id": "znaty",
     "uk": "зна́ти",
     "de": "wissen, kennen",
     "pos": "verb"
    },
    {
     "id": "chytaty",
     "uk": "чита́ти",
     "de": "lesen",
     "pos": "verb"
    },
    {
     "id": "vyvchaty",
     "uk": "вивча́ти",
     "de": "lernen, studieren (etw.)",
     "pos": "verb"
    },
    {
     "id": "misto",
     "uk": "мі́сто",
     "de": "Stadt",
     "pos": "noun"
    },
    {
     "id": "kraina",
     "uk": "краї́на",
     "de": "Land (Staat)",
     "pos": "noun"
    },
    {
     "id": "kyiv",
     "uk": "Ки́їв",
     "de": "Kyjiw (Kiew)",
     "pos": "name"
    },
    {
     "id": "berlin",
     "uk": "Берлі́н",
     "de": "Berlin",
     "pos": "name"
    },
    {
     "id": "lviv",
     "uk": "Львів",
     "de": "Lwiw",
     "pos": "name"
    },
    {
     "id": "vulytsia",
     "uk": "ву́лиця",
     "de": "Straße",
     "pos": "noun"
    },
    {
     "id": "tut",
     "uk": "тут",
     "de": "hier",
     "pos": "adv"
    },
    {
     "id": "tam",
     "uk": "там",
     "de": "dort",
     "pos": "adv"
    },
    {
     "id": "zaraz",
     "uk": "за́раз",
     "de": "jetzt",
     "pos": "adv"
    },
    {
     "id": "vdoma",
     "uk": "вдо́ма",
     "de": "zu Hause",
     "pos": "adv"
    },
    {
     "id": "knyzhka",
     "uk": "кни́жка",
     "de": "Buch",
     "pos": "noun"
    },
    {
     "id": "mova",
     "uk": "мо́ва",
     "de": "Sprache",
     "pos": "noun"
    },
    {
     "id": "ukrainskyi",
     "uk": "украї́нський",
     "de": "ukrainisch",
     "pos": "adj"
    },
    {
     "id": "nimetskyi",
     "uk": "німе́цький",
     "de": "deutsch",
     "pos": "adj"
    }
   ]
  },
  {
   "id": "a1-1-06",
   "title_uk": "У кафе́",
   "title_de": "Im Café",
   "theme": "cafe",
   "vocab": [
    {
     "id": "kafe",
     "uk": "кафе́",
     "de": "Café",
     "pos": "noun"
    },
    {
     "id": "kava",
     "uk": "ка́ва",
     "de": "Kaffee",
     "pos": "noun"
    },
    {
     "id": "chai",
     "uk": "чай",
     "de": "Tee",
     "pos": "noun"
    },
    {
     "id": "voda",
     "uk": "вода́",
     "de": "Wasser",
     "pos": "noun"
    },
    {
     "id": "sik",
     "uk": "сік",
     "de": "Saft",
     "pos": "noun"
    },
    {
     "id": "moloko",
     "uk": "молоко́",
     "de": "Milch",
     "pos": "noun"
    },
    {
     "id": "tsukor",
     "uk": "цу́кор",
     "de": "Zucker",
     "pos": "noun"
    },
    {
     "id": "tistechko",
     "uk": "ті́стечко",
     "de": "Törtchen, Stück Kuchen",
     "pos": "noun"
    },
    {
     "id": "khotity",
     "uk": "хоті́ти",
     "de": "wollen, mögen (möchten)",
     "pos": "verb"
    },
    {
     "id": "mozhna",
     "uk": "мо́жна",
     "de": "man kann/darf; darf ich …?",
     "pos": "adv"
    },
    {
     "id": "rakhunok",
     "uk": "раху́нок",
     "de": "Rechnung",
     "pos": "noun"
    },
    {
     "id": "menu",
     "uk": "меню́",
     "de": "Speisekarte",
     "pos": "noun"
    },
    {
     "id": "chashka",
     "uk": "ча́шка",
     "de": "Tasse",
     "pos": "noun"
    },
    {
     "id": "sklianka",
     "uk": "скля́нка",
     "de": "Glas (Trinkglas)",
     "pos": "noun"
    },
    {
     "id": "z_molokom",
     "uk": "з молоко́м",
     "de": "mit Milch",
     "pos": "phrase"
    },
    {
     "id": "bez_tsukru",
     "uk": "без цу́кру",
     "de": "ohne Zucker",
     "pos": "phrase"
    },
    {
     "id": "kholodnyi",
     "uk": "холо́дний",
     "de": "kalt",
     "pos": "adj"
    },
    {
     "id": "hariachyi",
     "uk": "гаря́чий",
     "de": "heiß",
     "pos": "adj"
    },
    {
     "id": "shche",
     "uk": "ще",
     "de": "noch",
     "pos": "adv"
    },
    {
     "id": "vse",
     "uk": "все",
     "de": "alles",
     "pos": "pron"
    },
    {
     "id": "ofitsiant",
     "uk": "офіціа́нт",
     "de": "Kellner",
     "pos": "noun"
    }
   ]
  },
  {
   "id": "a1-1-07",
   "title_uk": "Що ти лю́биш?",
   "title_de": "Was isst du gern?",
   "theme": "food",
   "vocab": [
    {
     "id": "isty",
     "uk": "ї́сти",
     "de": "essen",
     "pos": "verb"
    },
    {
     "id": "pyty",
     "uk": "пи́ти",
     "de": "trinken",
     "pos": "verb"
    },
    {
     "id": "liubyty",
     "uk": "люби́ти",
     "de": "lieben, gern haben/mögen",
     "pos": "verb"
    },
    {
     "id": "khlib",
     "uk": "хліб",
     "de": "Brot",
     "pos": "noun"
    },
    {
     "id": "syr",
     "uk": "сир",
     "de": "Käse; Quark",
     "pos": "noun"
    },
    {
     "id": "miaso",
     "uk": "м’я́со",
     "de": "Fleisch",
     "pos": "noun"
    },
    {
     "id": "ryba",
     "uk": "ри́ба",
     "de": "Fisch",
     "pos": "noun"
    },
    {
     "id": "kurka",
     "uk": "ку́рка",
     "de": "Huhn, Hähnchen",
     "pos": "noun"
    },
    {
     "id": "ovochi",
     "uk": "о́вочі",
     "de": "Gemüse",
     "pos": "noun"
    },
    {
     "id": "frukty",
     "uk": "фру́кти",
     "de": "Obst",
     "pos": "noun"
    },
    {
     "id": "yabluko",
     "uk": "я́блуко",
     "de": "Apfel",
     "pos": "noun"
    },
    {
     "id": "kartoplia",
     "uk": "карто́пля",
     "de": "Kartoffeln",
     "pos": "noun"
    },
    {
     "id": "yaitse",
     "uk": "яйце́",
     "de": "Ei",
     "pos": "noun"
    },
    {
     "id": "sup",
     "uk": "суп",
     "de": "Suppe",
     "pos": "noun"
    },
    {
     "id": "borshch",
     "uk": "борщ",
     "de": "Borschtsch",
     "pos": "noun"
    },
    {
     "id": "salat",
     "uk": "сала́т",
     "de": "Salat",
     "pos": "noun"
    },
    {
     "id": "snidanok",
     "uk": "сніда́нок",
     "de": "Frühstück",
     "pos": "noun"
    },
    {
     "id": "obid",
     "uk": "обі́д",
     "de": "Mittagessen",
     "pos": "noun"
    },
    {
     "id": "vecheria",
     "uk": "вече́ря",
     "de": "Abendessen",
     "pos": "noun"
    },
    {
     "id": "smachnyi",
     "uk": "смачни́й",
     "de": "lecker",
     "pos": "adj"
    },
    {
     "id": "smachnoho",
     "uk": "Смачно́го!",
     "de": "Guten Appetit!",
     "pos": "phrase"
    }
   ]
  },
  {
   "id": "a1-1-08",
   "title_uk": "Скі́льки ко́штує?",
   "title_de": "Was kostet das?",
   "theme": "shopping",
   "vocab": [
    {
     "id": "trydtsiat",
     "uk": "три́дцять",
     "de": "dreißig",
     "pos": "num"
    },
    {
     "id": "sorok",
     "uk": "со́рок",
     "de": "vierzig",
     "pos": "num"
    },
    {
     "id": "piatdesiat",
     "uk": "п’ятдеся́т",
     "de": "fünfzig",
     "pos": "num"
    },
    {
     "id": "shistdesiat",
     "uk": "шістдеся́т",
     "de": "sechzig",
     "pos": "num"
    },
    {
     "id": "simdesiat",
     "uk": "сімдеся́т",
     "de": "siebzig",
     "pos": "num"
    },
    {
     "id": "visimdesiat",
     "uk": "вісімдеся́т",
     "de": "achtzig",
     "pos": "num"
    },
    {
     "id": "devianosto",
     "uk": "дев’яно́сто",
     "de": "neunzig",
     "pos": "num"
    },
    {
     "id": "sto",
     "uk": "сто",
     "de": "hundert",
     "pos": "num"
    },
    {
     "id": "dvisti",
     "uk": "дві́сті",
     "de": "zweihundert",
     "pos": "num"
    },
    {
     "id": "piatsot",
     "uk": "п’ятсо́т",
     "de": "fünfhundert",
     "pos": "num"
    },
    {
     "id": "tysiacha",
     "uk": "ти́сяча",
     "de": "tausend",
     "pos": "num"
    },
    {
     "id": "hryvnia",
     "uk": "гри́вня",
     "de": "Hrywnja (Währung)",
     "pos": "noun"
    },
    {
     "id": "koshtuvaty",
     "uk": "ко́штувати",
     "de": "kosten",
     "pos": "verb"
    },
    {
     "id": "skilky_koshtuie",
     "uk": "Скі́льки ко́штує …?",
     "de": "Wie viel kostet …?",
     "pos": "phrase"
    },
    {
     "id": "mahazyn",
     "uk": "магази́н",
     "de": "Geschäft, Laden",
     "pos": "noun"
    },
    {
     "id": "rynok",
     "uk": "ри́нок",
     "de": "Markt",
     "pos": "noun"
    },
    {
     "id": "kupuvaty",
     "uk": "купува́ти",
     "de": "kaufen",
     "pos": "verb"
    },
    {
     "id": "daite",
     "uk": "Да́йте, будь ла́ска, …",
     "de": "Geben Sie mir bitte …",
     "pos": "phrase"
    },
    {
     "id": "doroho",
     "uk": "до́рого",
     "de": "teuer",
     "pos": "adv"
    },
    {
     "id": "deshevo",
     "uk": "деше́во",
     "de": "billig, günstig",
     "pos": "adv"
    },
    {
     "id": "kilohram",
     "uk": "кілогра́м",
     "de": "Kilogramm",
     "pos": "noun"
    },
    {
     "id": "kartka",
     "uk": "ка́ртка",
     "de": "(Bank-)Karte",
     "pos": "noun"
    },
    {
     "id": "hotivka",
     "uk": "готі́вка",
     "de": "Bargeld",
     "pos": "noun"
    }
   ]
  },
  {
   "id": "a1-1-09",
   "title_uk": "Моя́ кварти́ра",
   "title_de": "Meine Wohnung",
   "theme": "home",
   "vocab": [
    {
     "id": "kvartyra",
     "uk": "кварти́ра",
     "de": "Wohnung",
     "pos": "noun"
    },
    {
     "id": "dim",
     "uk": "дім",
     "de": "Haus",
     "pos": "noun"
    },
    {
     "id": "kimnata",
     "uk": "кімна́та",
     "de": "Zimmer",
     "pos": "noun"
    },
    {
     "id": "kukhnia",
     "uk": "ку́хня",
     "de": "Küche",
     "pos": "noun"
    },
    {
     "id": "vanna",
     "uk": "ва́нна",
     "de": "Bad(ezimmer); Badewanne",
     "pos": "noun"
    },
    {
     "id": "spalnia",
     "uk": "спа́льня",
     "de": "Schlafzimmer",
     "pos": "noun"
    },
    {
     "id": "stil",
     "uk": "стіл",
     "de": "Tisch",
     "pos": "noun"
    },
    {
     "id": "stilets",
     "uk": "стіле́ць",
     "de": "Stuhl",
     "pos": "noun"
    },
    {
     "id": "dyvan",
     "uk": "дива́н",
     "de": "Sofa",
     "pos": "noun"
    },
    {
     "id": "lizhko",
     "uk": "лі́жко",
     "de": "Bett",
     "pos": "noun"
    },
    {
     "id": "vikno",
     "uk": "вікно́",
     "de": "Fenster",
     "pos": "noun"
    },
    {
     "id": "dveri",
     "uk": "две́рі",
     "de": "Tür",
     "pos": "noun"
    },
    {
     "id": "shafa",
     "uk": "ша́фа",
     "de": "Schrank",
     "pos": "noun"
    },
    {
     "id": "velykyi",
     "uk": "вели́кий",
     "de": "groß",
     "pos": "adj"
    },
    {
     "id": "malyi",
     "uk": "мали́й",
     "de": "klein",
     "pos": "adj"
    },
    {
     "id": "novyi",
     "uk": "нови́й",
     "de": "neu",
     "pos": "adj"
    },
    {
     "id": "staryi",
     "uk": "стари́й",
     "de": "alt",
     "pos": "adj"
    },
    {
     "id": "harnyi",
     "uk": "га́рний",
     "de": "schön",
     "pos": "adj"
    },
    {
     "id": "svitlyi",
     "uk": "сві́тлий",
     "de": "hell",
     "pos": "adj"
    },
    {
     "id": "yakyi",
     "uk": "яки́й",
     "de": "welcher; was für ein",
     "pos": "pron"
    }
   ]
  },
  {
   "id": "a1-1-10",
   "title_uk": "Де апте́ка?",
   "title_de": "Wo ist die Apotheke?",
   "theme": "city",
   "vocab": [
    {
     "id": "apteka",
     "uk": "апте́ка",
     "de": "Apotheke",
     "pos": "noun"
    },
    {
     "id": "bank",
     "uk": "банк",
     "de": "Bank",
     "pos": "noun"
    },
    {
     "id": "likarnia",
     "uk": "лі́карня",
     "de": "Krankenhaus",
     "pos": "noun"
    },
    {
     "id": "zupynka",
     "uk": "зупи́нка",
     "de": "Haltestelle",
     "pos": "noun"
    },
    {
     "id": "vokzal",
     "uk": "вокза́л",
     "de": "Bahnhof",
     "pos": "noun"
    },
    {
     "id": "metro",
     "uk": "метро́",
     "de": "U-Bahn, Metro",
     "pos": "noun"
    },
    {
     "id": "ploshcha",
     "uk": "пло́ща",
     "de": "Platz",
     "pos": "noun"
    },
    {
     "id": "park",
     "uk": "парк",
     "de": "Park",
     "pos": "noun"
    },
    {
     "id": "tsentr",
     "uk": "центр",
     "de": "Zentrum",
     "pos": "noun"
    },
    {
     "id": "muzei",
     "uk": "музе́й",
     "de": "Museum",
     "pos": "noun"
    },
    {
     "id": "restoran",
     "uk": "рестора́н",
     "de": "Restaurant",
     "pos": "noun"
    },
    {
     "id": "hotel",
     "uk": "готе́ль",
     "de": "Hotel",
     "pos": "noun"
    },
    {
     "id": "tualet",
     "uk": "туале́т",
     "de": "Toilette",
     "pos": "noun"
    },
    {
     "id": "yty",
     "uk": "іти́",
     "de": "gehen (zu Fuß)",
     "pos": "verb"
    },
    {
     "id": "yak_diity",
     "uk": "Як дійти́ до …?",
     "de": "Wie komme ich (zu Fuß) zu …?",
     "pos": "phrase"
    },
    {
     "id": "priamo",
     "uk": "пря́мо",
     "de": "geradeaus",
     "pos": "adv"
    },
    {
     "id": "pravoruch",
     "uk": "пра́воруч",
     "de": "rechts",
     "pos": "adv"
    },
    {
     "id": "livoruch",
     "uk": "ліво́руч",
     "de": "links",
     "pos": "adv"
    },
    {
     "id": "daleko",
     "uk": "дале́ко",
     "de": "weit (entfernt)",
     "pos": "adv"
    },
    {
     "id": "blyzko",
     "uk": "бли́зько",
     "de": "nah",
     "pos": "adv"
    },
    {
     "id": "potim",
     "uk": "по́тім",
     "de": "dann, danach",
     "pos": "adv"
    }
   ]
  },
  {
   "id": "a1-1-11",
   "title_uk": "Котра́ годи́на?",
   "title_de": "Wie spät ist es?",
   "theme": "time",
   "vocab": [
    {
     "id": "kotra_hodyna",
     "uk": "Котра́ годи́на?",
     "de": "Wie spät ist es?",
     "pos": "phrase"
    },
    {
     "id": "o_kotrii",
     "uk": "О котрі́й?",
     "de": "Um wie viel Uhr?",
     "pos": "phrase"
    },
    {
     "id": "hodyna",
     "uk": "годи́на",
     "de": "Stunde; Uhr (Zeit)",
     "pos": "noun"
    },
    {
     "id": "khvylyna",
     "uk": "хвили́на",
     "de": "Minute",
     "pos": "noun"
    },
    {
     "id": "persha",
     "uk": "пе́рша",
     "de": "erste; ein Uhr",
     "pos": "num"
    },
    {
     "id": "druha",
     "uk": "дру́га",
     "de": "zweite; zwei Uhr",
     "pos": "num"
    },
    {
     "id": "tretia",
     "uk": "тре́тя",
     "de": "dritte; drei Uhr",
     "pos": "num"
    },
    {
     "id": "chetverta",
     "uk": "четве́рта",
     "de": "vierte; vier Uhr",
     "pos": "num"
    },
    {
     "id": "piata",
     "uk": "п’я́та",
     "de": "fünfte; fünf Uhr",
     "pos": "num"
    },
    {
     "id": "shosta",
     "uk": "шо́ста",
     "de": "sechste; sechs Uhr",
     "pos": "num"
    },
    {
     "id": "soma",
     "uk": "сьо́ма",
     "de": "siebte; sieben Uhr",
     "pos": "num"
    },
    {
     "id": "vosma",
     "uk": "во́сьма",
     "de": "achte; acht Uhr",
     "pos": "num"
    },
    {
     "id": "deviata",
     "uk": "дев’я́та",
     "de": "neunte; neun Uhr",
     "pos": "num"
    },
    {
     "id": "desiata",
     "uk": "деся́та",
     "de": "zehnte; zehn Uhr",
     "pos": "num"
    },
    {
     "id": "odynadtsiata",
     "uk": "одина́дцята",
     "de": "elfte; elf Uhr",
     "pos": "num"
    },
    {
     "id": "dvanadtsiata",
     "uk": "двана́дцята",
     "de": "zwölfte; zwölf Uhr",
     "pos": "num"
    },
    {
     "id": "vrantsi",
     "uk": "вра́нці",
     "de": "morgens",
     "pos": "adv"
    },
    {
     "id": "vden",
     "uk": "вдень",
     "de": "tagsüber, nachmittags",
     "pos": "adv"
    },
    {
     "id": "uvecheri",
     "uk": "уве́чері",
     "de": "abends",
     "pos": "adv"
    },
    {
     "id": "vnochi",
     "uk": "вночі́",
     "de": "nachts",
     "pos": "adv"
    },
    {
     "id": "rano",
     "uk": "ра́но",
     "de": "früh",
     "pos": "adv"
    },
    {
     "id": "pizno",
     "uk": "пі́зно",
     "de": "spät",
     "pos": "adv"
    }
   ]
  },
  {
   "id": "a1-1-12",
   "title_uk": "Сього́дні понеді́лок",
   "title_de": "Heute ist Montag",
   "theme": "calendar",
   "vocab": [
    {
     "id": "ponedilok",
     "uk": "понеді́лок",
     "de": "Montag",
     "pos": "noun"
    },
    {
     "id": "vivtorok",
     "uk": "вівто́рок",
     "de": "Dienstag",
     "pos": "noun"
    },
    {
     "id": "sereda",
     "uk": "середа́",
     "de": "Mittwoch",
     "pos": "noun"
    },
    {
     "id": "chetver",
     "uk": "четве́р",
     "de": "Donnerstag",
     "pos": "noun"
    },
    {
     "id": "piatnytsia",
     "uk": "п’я́тниця",
     "de": "Freitag",
     "pos": "noun"
    },
    {
     "id": "subota",
     "uk": "субо́та",
     "de": "Samstag",
     "pos": "noun"
    },
    {
     "id": "nedilia",
     "uk": "неді́ля",
     "de": "Sonntag",
     "pos": "noun"
    },
    {
     "id": "den",
     "uk": "день",
     "de": "Tag",
     "pos": "noun"
    },
    {
     "id": "tyzhden",
     "uk": "ти́ждень",
     "de": "Woche",
     "pos": "noun"
    },
    {
     "id": "vykhidni",
     "uk": "вихідні́",
     "de": "Wochenende",
     "pos": "noun"
    },
    {
     "id": "sohodni",
     "uk": "сього́дні",
     "de": "heute",
     "pos": "adv"
    },
    {
     "id": "zavtra",
     "uk": "за́втра",
     "de": "morgen",
     "pos": "adv"
    },
    {
     "id": "uchora",
     "uk": "учо́ра",
     "de": "gestern",
     "pos": "adv"
    },
    {
     "id": "shchodnia",
     "uk": "щодня́",
     "de": "täglich",
     "pos": "adv"
    },
    {
     "id": "koly",
     "uk": "коли́",
     "de": "wann",
     "pos": "adv"
    },
    {
     "id": "maty",
     "uk": "ма́ти",
     "de": "haben",
     "pos": "verb"
    },
    {
     "id": "chas",
     "uk": "час",
     "de": "Zeit",
     "pos": "noun"
    },
    {
     "id": "vilnyi",
     "uk": "ві́льний",
     "de": "frei",
     "pos": "adj"
    },
    {
     "id": "mohty",
     "uk": "могти́",
     "de": "können",
     "pos": "verb"
    },
    {
     "id": "zustrich",
     "uk": "зу́стріч",
     "de": "Treffen, Termin",
     "pos": "noun"
    },
    {
     "id": "razom",
     "uk": "ра́зом",
     "de": "zusammen",
     "pos": "adv"
    },
    {
     "id": "kino",
     "uk": "кіно́",
     "de": "Kino",
     "pos": "noun"
    }
   ]
  },
  {
   "id": "a1-1-13",
   "title_uk": "Моя́ робо́та",
   "title_de": "Mein Beruf",
   "theme": "work",
   "vocab": [
    {
     "id": "robota",
     "uk": "робо́та",
     "de": "Arbeit",
     "pos": "noun"
    },
    {
     "id": "profesiia",
     "uk": "профе́сія",
     "de": "Beruf",
     "pos": "noun"
    },
    {
     "id": "kym_ty_pratsiuiesh",
     "uk": "Ким ти працю́єш?",
     "de": "Was bist du von Beruf?",
     "pos": "phrase"
    },
    {
     "id": "yurist",
     "uk": "юри́ст",
     "de": "Jurist",
     "pos": "noun"
    },
    {
     "id": "advokat",
     "uk": "адвока́т",
     "de": "Rechtsanwalt",
     "pos": "noun"
    },
    {
     "id": "likar",
     "uk": "лі́кар",
     "de": "Arzt",
     "pos": "noun"
    },
    {
     "id": "vchytel",
     "uk": "вчи́тель",
     "de": "Lehrer",
     "pos": "noun"
    },
    {
     "id": "inzhener",
     "uk": "інжене́р",
     "de": "Ingenieur",
     "pos": "noun"
    },
    {
     "id": "menedzher",
     "uk": "ме́неджер",
     "de": "Manager",
     "pos": "noun"
    },
    {
     "id": "prohramist",
     "uk": "програмі́ст",
     "de": "Programmierer",
     "pos": "noun"
    },
    {
     "id": "bukhhalter",
     "uk": "бухга́лтер",
     "de": "Buchhalter",
     "pos": "noun"
    },
    {
     "id": "student",
     "uk": "студе́нт",
     "de": "Student",
     "pos": "noun"
    },
    {
     "id": "kompaniia",
     "uk": "компа́нія",
     "de": "Firma, Unternehmen",
     "pos": "noun"
    },
    {
     "id": "ofis",
     "uk": "о́фіс",
     "de": "Büro",
     "pos": "noun"
    },
    {
     "id": "kolega",
     "uk": "коле́га",
     "de": "Kollege, Kollegin",
     "pos": "noun"
    },
    {
     "id": "kerivnyk",
     "uk": "керівни́к",
     "de": "Chef, Leiter",
     "pos": "noun"
    },
    {
     "id": "kliient",
     "uk": "кліє́нт",
     "de": "Kunde, Mandant",
     "pos": "noun"
    },
    {
     "id": "tsikavyi",
     "uk": "ціка́вий",
     "de": "interessant",
     "pos": "adj"
    },
    {
     "id": "vazhkyi",
     "uk": "важки́й",
     "de": "schwer, schwierig",
     "pos": "adj"
    },
    {
     "id": "lehkyi",
     "uk": "легки́й",
     "de": "leicht",
     "pos": "adj"
    }
   ]
  },
  {
   "id": "a1-1-14",
   "title_uk": "В о́фісі",
   "title_de": "Im Büro",
   "theme": "office",
   "vocab": [
    {
     "id": "kompiuter",
     "uk": "комп’ю́тер",
     "de": "Computer",
     "pos": "noun"
    },
    {
     "id": "telefon",
     "uk": "телефо́н",
     "de": "Telefon",
     "pos": "noun"
    },
    {
     "id": "lyst",
     "uk": "лист",
     "de": "Brief; E-Mail",
     "pos": "noun"
    },
    {
     "id": "dokument",
     "uk": "докуме́нт",
     "de": "Dokument",
     "pos": "noun"
    },
    {
     "id": "ruchka",
     "uk": "ру́чка",
     "de": "Kugelschreiber",
     "pos": "noun"
    },
    {
     "id": "papir",
     "uk": "папі́р",
     "de": "Papier",
     "pos": "noun"
    },
    {
     "id": "prynter",
     "uk": "при́нтер",
     "de": "Drucker",
     "pos": "noun"
    },
    {
     "id": "narada",
     "uk": "нара́да",
     "de": "Besprechung, Sitzung",
     "pos": "noun"
    },
    {
     "id": "pytannia",
     "uk": "пита́ння",
     "de": "Frage",
     "pos": "noun"
    },
    {
     "id": "pysaty",
     "uk": "писа́ти",
     "de": "schreiben",
     "pos": "verb"
    },
    {
     "id": "dzvonyty",
     "uk": "дзвони́ти",
     "de": "anrufen",
     "pos": "verb"
    },
    {
     "id": "chekaty",
     "uk": "чека́ти",
     "de": "warten",
     "pos": "verb"
    },
    {
     "id": "dopomohty",
     "uk": "допомогти́",
     "de": "helfen",
     "pos": "verb"
    },
    {
     "id": "zakhodte",
     "uk": "Захо́дьте!",
     "de": "Kommen Sie herein!",
     "pos": "phrase"
    },
    {
     "id": "sidaite",
     "uk": "Сіда́йте!",
     "de": "Setzen Sie sich!",
     "pos": "phrase"
    },
    {
     "id": "khvylynku",
     "uk": "Хвили́нку!",
     "de": "Einen Moment!",
     "pos": "phrase"
    },
    {
     "id": "povtorit",
     "uk": "Повторі́ть, будь ла́ска.",
     "de": "Wiederholen Sie bitte.",
     "pos": "phrase"
    },
    {
     "id": "zainiatyi",
     "uk": "зайня́тий",
     "de": "beschäftigt, besetzt",
     "pos": "adj"
    },
    {
     "id": "hotovyi",
     "uk": "гото́вий",
     "de": "fertig, bereit",
     "pos": "adj"
    },
    {
     "id": "terminovo",
     "uk": "терміно́во",
     "de": "dringend",
     "pos": "adv"
    }
   ]
  },
  {
   "id": "a1-1-15",
   "title_uk": "Ва́ші докуме́нти, будь ла́ска",
   "title_de": "Ihre Dokumente, bitte",
   "theme": "law",
   "vocab": [
    {
     "id": "pasport",
     "uk": "па́спорт",
     "de": "Pass, Reisepass",
     "pos": "noun"
    },
    {
     "id": "imia",
     "uk": "ім’я́",
     "de": "Vorname",
     "pos": "noun"
    },
    {
     "id": "prizvyshche",
     "uk": "прі́звище",
     "de": "Nachname",
     "pos": "noun"
    },
    {
     "id": "adresa",
     "uk": "адре́са",
     "de": "Adresse",
     "pos": "noun"
    },
    {
     "id": "data_narodzhennia",
     "uk": "да́та наро́дження",
     "de": "Geburtsdatum",
     "pos": "phrase"
    },
    {
     "id": "hromadianstvo",
     "uk": "громадя́нство",
     "de": "Staatsangehörigkeit",
     "pos": "noun"
    },
    {
     "id": "vash",
     "uk": "ваш",
     "de": "Ihr; euer",
     "pos": "pron"
    },
    {
     "id": "blank",
     "uk": "бланк",
     "de": "Formular",
     "pos": "noun"
    },
    {
     "id": "zaiava",
     "uk": "зая́ва",
     "de": "Antrag",
     "pos": "noun"
    },
    {
     "id": "dovidka",
     "uk": "до́відка",
     "de": "Bescheinigung",
     "pos": "noun"
    },
    {
     "id": "pidpys",
     "uk": "пі́дпис",
     "de": "Unterschrift",
     "pos": "noun"
    },
    {
     "id": "pidpysaty",
     "uk": "підписа́ти",
     "de": "unterschreiben",
     "pos": "verb"
    },
    {
     "id": "pokazhit",
     "uk": "Покажі́ть, будь ла́ска, …",
     "de": "Zeigen Sie bitte …",
     "pos": "phrase"
    },
    {
     "id": "dohovir",
     "uk": "до́говір",
     "de": "Vertrag",
     "pos": "noun"
    },
    {
     "id": "pravo",
     "uk": "пра́во",
     "de": "Recht",
     "pos": "noun"
    },
    {
     "id": "zakon",
     "uk": "зако́н",
     "de": "Gesetz",
     "pos": "noun"
    },
    {
     "id": "sud",
     "uk": "суд",
     "de": "Gericht",
     "pos": "noun"
    },
    {
     "id": "notarius",
     "uk": "нота́ріус",
     "de": "Notar",
     "pos": "noun"
    },
    {
     "id": "politsiia",
     "uk": "полі́ція",
     "de": "Polizei",
     "pos": "noun"
    },
    {
     "id": "posolstvo",
     "uk": "посо́льство",
     "de": "Botschaft",
     "pos": "noun"
    }
   ]
  }
 ]
}
```
<!-- PLAN-JSON-END -->
