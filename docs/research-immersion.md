# Didaktik-Recherche II: Input, Story, Erschließen, Shadowing

Stand: 21.10.2026. Dieses Dokument ergänzt `docs/research-didactics.md`, das Retrieval, Spacing/FSRS, Feedback und Motivation behandelt. Diese Themen werden hier nicht wiederholt.
Quellenlage: Per Websuche geprüft wurden Bryfonski & McKay, Lee & Huang, Yanagisawa et al., Potts & Shanks, Jeon & Day, Uchihara et al., Lichtman & VanPatten, Pan & Carpenter und Hamada (Einzelstudien). Was aus Fachwissen stammt, ist mit **[FW]** markiert und sollte vor einer Veröffentlichung gegengeprüft werden.

---

## TL;DR für Entwickler

1. **Jede Lektion bekommt einen Ankertext:** einen Leitdialog mit 6–12 Zeilen und wiederkehrenden Figuren. Er erscheint zweimal: am Anfang als Story-Ansicht (Audio, Tap-Glossar, Übersetzung nur auf Wunsch) und am Ende noch einmal, diesmal ohne Übersetzung. Das soll die Lernenden merken lassen: „Jetzt verstehe ich das.“
2. **Vor dem Aufdecken wird geraten:** Bei 2–4 neuen Wörtern pro Lektion tippt man zuerst eine Vermutung an, bevor das Glossar aufgeht. Es gibt dafür 3 Optionen oder „Keine Ahnung“. Ein falscher Tipp kostet nichts: kein FSRS-Rating, keine Fehlerrunde, sofort das richtige Feedback.
3. **Neue Formen werden dezent hervorgehoben,** und zwar nur die Endung bzw. das neue Muster der Lektion, höchstens 1–2 Muster gleichzeitig. Die Hervorhebung lässt sich abschalten. Nach dem ersten Durchgang verschwindet sie.
4. **Satz-Mining:** Jede Zeile in der Story und in Lesetexten bekommt einen Button „Satz merken“. Daraus wird eine Satzkarte im Trainer: Audio, Satz mit Lücke beim Zielwort, Übersetzung nach dem Aufdecken. Die Satzkarten laufen im selben FSRS wie die Wörter, aber als eigener Kartentyp.
5. **Shadowing-Modus:** hören, dann nachsprechen, dann noch einmal hören und selbst bewerten. Das funktioniert ohne Spracherkennung. Dafür gibt es zwei Tempi (0,75× und 1,0×). Man shadowt nur Sätze, die man schon verstanden hat.
6. **Pro Lektion 1–2 Mini-Aufgaben mit echtem Ziel** („Bestelle zwei Kaffee und frag nach dem Preis“), also eine Aufgabe mit Ergebnis statt Drill. Technisch ist das ein `chat` mit Zielprüfung.
7. **Grobe Verteilung pro Lektions-Session:** etwa ⅓ bedeutungsorientierter Input (Story, Lesen, Hören), ⅓ Übung und Abruf, ⅓ Sprechen und Output. Reine Wiederholungs-Sessions bleiben so, wie `research-didactics.md` sie beschreibt.
8. **Optionales JSON-Feld `story`:** Figuren, Zeilen, Audio-Hinweise, markierte neue Formen (`new_forms`) und Ratestellen (`guess`). Fehlt das Feld, verhält sich die App wie bisher.

---

## 1. Forschungslage, kurz und ehrlich

### 1.1 Comprehensible Input (Krashen)
- **These:** Sprache wird erworben, wenn man Input versteht, der knapp über dem eigenen Niveau liegt („i+1“). Explizites Lernen bleibt danach nur ein „Monitor“ (Krashen 1982) [FW].
- **Kritik:** Die These ist kaum falsifizierbar, „i+1“ lässt sich nicht messen, und die Behauptung, explizites Wissen werde nie zu implizitem, gilt als zu stark. Metaanalysen zu expliziter Instruktion zeigen klare Effekte (Norris & Ortega 2000, d ≈ 0,96; Spada & Tomita 2010) [FW].
- **Neuere Einordnung:** Lichtman & VanPatten (2021) halten den Kern für weitgehend bestätigt: Input ist notwendig, und viel Input hilft. Die starke Ablehnung von explizitem Lernen teilen sie nicht. *Foreign Language Annals* 54(2), 283–305, https://doi.org/10.1111/flan.12552
- **Für die App:** Input ist notwendig, reicht aber nicht. Er muss sehr gut verständlich sein. Für Lesen ohne Hilfe braucht man eine Abdeckung von etwa 95–98 % bekannter Wörter (Hu & Nation 2000; Laufer & Ravenhorst-Kalovski 2010) [FW]. Für A1 heißt das: Der Ankertext enthält **nur wenige neue Wörter (≤ 10–15 %)**, und jedes davon ist per Tap glossiert.

### 1.2 Story und narrativer Kontext, TPRS
- **TPRS** (Teaching Proficiency through Reading and Storytelling) hat nur **schwache Evidenz**. Es gibt viele kleine Einzelstudien in Schulklassen, oft ohne Randomisierung, mit überwiegend positiven, aber methodisch dünnen Ergebnissen. Eine belastbare, peer-reviewte Metaanalyse habe ich nicht gefunden. Kursierende Zahlen wie „d = 0,65“ stammen aus Blogs und sind nicht prüfbar.
- **Plausibler Mechanismus:** Erzählungen liefern einen Kontext, der Bedeutung erschließbar macht. Die Wiederholung derselben Strukturen in Variationen erzeugt hohe Frequenz. Und Geschichten binden Aufmerksamkeit.
- **Wiederholung im Input wirkt nachweislich.** Uchihara, Webb & Yanagisawa (2019) zeigen in einer Metaanalyse über 26 Studien eine mittlere Korrelation zwischen Begegnungshäufigkeit und beiläufigem Wortlernen (r ≈ 0,34 [FW für den Wert]). *Language Learning* 69(3), 559–599, https://doi.org/10.1111/lang.12343
- **Wiederkehrende Figuren** sollen vor allem das Engagement steigern. Direkte Lernstudien dazu gibt es kaum. Die Figuren sind trotzdem fast kostenlos und schaffen die Wiederholungsanlässe, die nachweislich wirken.

### 1.3 Aufgabenbasiertes Lernen (TBLT)
- **Grundidee:** Gelernt wird an Aufgaben mit kommunikativem Ziel und Ergebnis, Form wird nebenbei fokussiert (Long 1985/2015; Ellis 2003) [FW].
- **Metaanalyse:** Bryfonski & McKay (2019, *Language Teaching Research* 23(5), 603–632) fanden für TBLT-Programme einen großen Effekt (d ≈ 0,93). Boers & Faez (2023) und eine Re-Analyse von Xuan et al. kritisieren lockere Einschlusskriterien und kommen auf **kleinere Effekte (g ≈ 0,61)**. https://doi.org/10.1177/1362168817744389, https://doi.org/10.1177/13621688231167573
- **Einschätzung:** Aufgaben mit echtem Ziel nützen wahrscheinlich, der Effekt ist aber kleiner als oft behauptet. Für Anfänger sind sie nur stark gestützt realistisch, also mit Auswahlantworten und Satzbausteinen.

### 1.4 Shadowing
- **Belege:** Hamada (2014, 2016, *Language Teaching Research* „Shadowing: Who benefits and how?“) zeigt Gewinne beim Hörverstehen, und zwar besonders bei Lernenden mit **niedrigerem Niveau**. Zwei Bedingungen gehören dazu: Man shadowt **nach** dem Verstehen des Inhalts, und das Material ist eher leicht. Überblick bei Hamada (2018), *RELC Journal*, https://doi.org/10.1177/0033688218771380
- **Evidenzlage:** Es gibt viele Studien, überwiegend aus Japan und mit Englisch als Fremdsprache. Eine gepoolte Metaanalyse habe ich nicht gefunden. Als Hör- und Ausspracheübung ist Shadowing gut begründet, die Effekte auf das Sprechen sind weniger gut belegt.

### 1.5 Input-Enhancement und Noticing
- **These:** Was nicht bemerkt wird, wird nicht gelernt (Schmidt 1990, Noticing-Hypothese) [FW].
- **Befund:** Typografische Hervorhebung allein bringt laut Lee & Huang (2008, *SSLA* 30(3), 16 Studien) **nur einen kleinen Effekt auf Formlernen (d ≈ 0,22)** und einen **leicht negativen Effekt auf das Inhaltsverständnis (d ≈ −0,26)**. https://doi.org/10.1017/S0272263108080479
- **Für die App:** Hervorhebung sparsam und gezielt einsetzen, nur für das eine neue Muster der Lektion. Beim ersten Hören und Lesen bleibt der Text unmarkiert, die Markierung kommt erst beim zweiten Durchgang. Kombiniert mit einer kurzen expliziten Erklärung (die gibt es schon: `explanation`) ist sie deutlich wirksamer als allein [FW, Alsadhan-Metaanalyse: Regelpräsentation d ≈ 0,93].

### 1.6 Erst raten, dann aufdecken (Pretesting, Errorful Generation)
- **Potts & Shanks (2014, *JEP: General* 143(2))** ließen Lernende die Bedeutung unbekannter bzw. fremdsprachiger Wörter raten, danach gab es Feedback. Das Raten war fast immer falsch und führte trotzdem zu **besserer Erinnerung als reines Lesen und als Mehrfachauswahl vor dem Feedback**. https://discovery.ucl.ac.uk/id/eprint/1399515
- **Weitere Belege:** Kornell, Hays & Bjork (2009) und Richland, Kornell & Kao (2009) zeigen den Pretesting-Effekt für Texte und Wortpaare [FW]. Den Überblick gibt Pan & Carpenter (2023), *Educational Psychology Review* 35:97.
- **Einschränkungen:**
  - Seabrooke et al. (2019) fanden, dass der Vorteil für einzelne Items gilt, für Assoziationen aber nicht konsistent ist.
  - Nach Potts, Davies & Shanks (2019) wirkt der Effekt vermutlich über **Neugier**.
  - Lernende halten Raten fälschlich für weniger effektiv als Lesen (Pan & Rivers 2023). Sie müssen deshalb kurz erfahren, warum geraten wird.
- **Erschließen aus dem Kontext (lexical inferencing):** Erfolgreich ist es nur, wenn der Kontext stark genug ist und fast alle umliegenden Wörter bekannt sind (Nassaji 2003; Hu & Nation 2000) [FW]. Für A1 heißt das: Geraten wird nur bei Wörtern, die der Kontext, ein Bild/Emoji oder ein Internationalismus (кава, банк, метро) wirklich erschließbar macht.

### 1.7 Satzkarten statt isolierter Wörter
- **Die Lage ist gemischt.** Dekontextualisierte Wortpaare sind für schnelles Behalten effizient (Nation 2013; Webb 2007 kritisiert konfundierte Vergleiche) [FW]. Kontext hilft beim Wiedererkennen, beim Gebrauch, bei Kollokationen und bei Formen. Kontextualisierter Input und wortfokussierte Arbeit ergänzen sich (SSLA 2021, „Combining explicit and sensitive indices …“).
- **Für Ukrainisch** mit Kasusendungen ist der Satz besonders wertvoll, weil die Form (кáву statt кáва) nur im Satz Sinn ergibt.
- **Empfehlung:** Die Wortkarte bleibt der Kern. Satzkarten kommen als Ergänzung dazu, mit dem Zielwort als Lücke, damit wirklich das Wort abgerufen wird und nicht der ganze Satz wiedererkannt.

### 1.8 Glossierung beim Lesen
- Yanagisawa, Webb & Uchihara (2020, *SSLA* 42(2), 411–438) werteten 42 Studien mit N = 3802 aus. **Glossen fördern das Wortlernen beim Lesen deutlich.** Glossen in der Erstsprache und Glossen mit Mehrfachauswahl schneiden gut ab. Multimediale Glossen (Bild plus Text) bringen nicht automatisch mehr. https://doi.org/10.1017/S0272263119000688
- **Für die App:** Das Tap-Glossar auf Deutsch mit Grundform und Grammatikinfo ist richtig und existiert schon im Lexikon-Index. Optional kann der Gloss-Inhalt beim ersten Tippen als Mini-Auswahl kommen (siehe 1.6).

### 1.9 Extensives Lesen und Hören für Anfänger
- Jeon & Day (2016, *Reading in a Foreign Language* 28(2), 49 Studien) fanden **kleine bis mittlere Effekte** (Gruppenvergleiche d = 0,46). Erwachsene und längere Programme profitieren stärker, webbasierte Texte schneiden gut ab. https://nflrc.hawaii.edu/rfl/item/354
- Auf A1 gibt es kaum Material für Ukrainisch. Graded Readers lassen sich nur durch eigene Kurztexte ersetzen, die **nur bekannten Wortschatz** verwenden.

### 1.10 Dual Coding mit Bildern
- Grundlage sind Paivio (1986) und Mayer (Multimedia-Prinzip) [FW]. Bilder helfen bei konkreten Wörtern.
- **Aber:** Carpenter & Olson (2012, *JEP: LMC*) fanden, dass Bilder das Lernen fremdsprachiger Wörter verschlechtern können, weil sie Überzuversicht erzeugen. Mit Abrufübung verschwindet der Nachteil [FW].
- **Für die App:** Ein Emoji oder Bild stützt, ersetzt aber nie den Abruf. Bei abstrakten Wörtern kommt kein Bild hinzu.

---

## 2. Konkrete Umsetzung in der App (nach Nutzen und Aufwand)

### P1: Ankertext als Story-Ansicht (hoher Nutzen, mittlerer Aufwand)
- **Position:** nach `explanation` und vor den Aufgaben. Die Ansicht ist überspringbar und später unter „Geschichte“ in der Lektion abrufbar.
- **Layout:** chatartige Zeilen mit Figuren-Avatar (Emoji) und Namen. Pro Zeile gibt es Play, Langsam (0,75×) und „DE“, das die Übersetzung nur auf Tap zeigt. Jedes Wort ist antippbar und öffnet das Glossar.
- **Ablauf:**
  1. „Alles anhören“ spielt die Zeilen nacheinander per TTS ab, mit Stimme je Figur über Pitch/Rate.
  2. Danach folgen 2–3 Verständnisfragen, die als nicht bewertete Kurzfragen wiederverwendet werden.
- **Am Lektionsende:** Der Ankertext wird ein zweites Mal gezeigt, **ohne DE-Buttons im Standardzustand**. Danach fragt die App „Wie viel hast du verstanden?“ mit drei Stufen. Das ist eine reine Selbsteinschätzung für die Motivation und geht nicht in FSRS ein.
- **Inhalt:** 6–12 Zeilen. Neue Wörter machen höchstens 15 % der Tokens aus. Die neuen Vokabeln der Lektion kommen möglichst alle darin vor. Die Aufgaben der Lektion greifen Sätze aus dem Ankertext wieder auf.
- **Figuren:** 3–5 feste Figuren, die durch A1 tragen, zum Beispiel eine Gastgeberin in Kyjiw, ein Kollege und ein Kind. So entstehen eine Fortsetzung und Wiederholung über mehrere Lektionen hinweg.

### P1: Erschließungsversuch vor dem Aufdecken (hoher Nutzen, geringer Aufwand)
- **Wo:** in der Story-Ansicht beim ersten Durchgang, an 2–4 im JSON markierten Stellen (`guess`). Andere neue Wörter sind normal antippbar.
- **Wie:**
  1. Das Wort ist leicht unterstrichen. Beim Tippen fragt die App „Was glaubst du?“ und zeigt 3 deutsche Optionen plus „Keine Ahnung“.
  2. Nach der Wahl erscheint sofort die Lösung mit Glossar und Audio.
  3. Eine Option kann als „Ich glaube …“-Freitext entfallen, weil Tippen auf dem Handy bremst.
- **Fehler sind unschädlich:** kein FSRS-Rating, kein Eintrag in die Fehlerrunde, keine roten Signale, sondern eine neutrale Farbe und „Gut geraten!“ bzw. „So heißt es:“.
- **Häufigkeit:** höchstens 4 Ratestellen pro Lektion, nur bei wirklich erschließbaren Wörtern (Kontext, Emoji, Internationalismus).
- **Begründung für Lernende:** Einmalig erscheint der Hinweis: „Raten vor dem Nachschauen hilft dem Gedächtnis, auch wenn der Tipp falsch ist.“

### P1: Satz-Mining in den Trainer (hoher Nutzen, mittlerer Aufwand)
- **Button:** „Satz merken“ (Lesezeichen-Icon) an jeder Story-Zeile, an `reading`-Sätzen und an `explanation.examples`.
- **Kartenformat (Typ `sentence`):**
  - Vorderseite: ukrainisches Audio (automatisch) und Satz mit Lücke beim Zielwort. Das Zielwort ist das erste neue Lektionswort im Satz, oder der Nutzer tippt es beim Merken an.
  - Rückseite: der volle Satz, die deutsche Übersetzung und das Glossar zum Zielwort.
  - Variante „Hörkarte“: nur Audio vorne, also „Was bedeutet das?“.
- **SRS:** eigene FSRS-Karte mit derselben Selbstbewertung. Limit: höchstens 5 neue Satzkarten pro Tag. Sie zählen nicht ins Limit für neue Wörter, wohl aber ins Review-Limit.
- **Daten:** nur IDs speichern (`lessonId`, `lineId`, `targetIndex`). Text und Audio kommen aus dem Content.

### P2: Shadowing-Modus (mittlerer Nutzen, geringer Aufwand)
- **Einstieg:** in der Story-Ansicht („Nachsprechen“) und als Trainer-Modus über gemerkte Sätze.
- **Ablauf pro Satz:**
  1. Satz anhören, mit Text.
  2. Pause von etwa der Satzlänge × 1,5, dabei läuft eine Fortschrittsanzeige zum Mitsprechen.
  3. Satz erneut anhören.
  4. Selbstbewertung „klappt / noch holprig“.
  5. Optional: Aufnahme und Vergleich mit dem Original per `MediaRecorder`, ohne Spracherkennung.
- **Steigerung:** Stufe 1 mit Text und 0,75×, Stufe 2 mit Text und 1,0×, Stufe 3 ohne Text.
- **Regel:** nur Sätze, die schon verstanden wurden, also aus der Story nach dem ersten Durchgang. Nicht in FSRS werten, es geht um Flüssigkeit.

### P2: Dezente Hervorhebung neuer Formen (mittlerer Nutzen, geringer Aufwand)
- **Was:** nur die im JSON unter `new_forms` markierten Formen der Lektionskonzepte, zum Beispiel Akkusativ-Endung -у in ка́ву. Unterstrichen wird **nur die Endung bzw. der Teilstring**, mit Akzentfarbe in geringer Deckkraft und ohne Fettdruck.
- **Wann:** nicht beim ersten Hören und Lesen, sondern beim zweiten Durchgang am Lektionsende und in `explanation.examples`. Ein Tap auf die Markierung zeigt die zugehörige `grammar`-Merkhilfe.
- **Abschaltbar** in den Einstellungen.

### P2: Mini-Aufgaben mit Ziel (mittlerer Nutzen, mittlerer Aufwand)
- **Format:** 1–2 pro Lektion, als erweiterter `chat` mit `goal_de` („Bestelle Tee und frag, was er kostet“).
- **Ablauf:** Der Bot reagiert verzweigt. Am Ende zeigt die App „Ziel erreicht?“ mit Checkliste und Haken pro Teilziel.
- **Unterstützung auf A1:** Auswahlantworten oder Satzbausteine. Freies Sprechen ist optional und wird selbst bewertet.

### P3: Mikro-Lesetexte und Hörserie (Nutzen kumulativ, Aufwand im Content)
- **Pro Phase:** ab etwa Lektion 4 eine kleine Serie mit den festen Figuren, 80–150 Wörter je Folge, **nur bekannter Wortschatz plus höchstens 2 neue Wörter (glossiert)**. Freigabe nach Lektionsfortschritt.
- **Form:** keine Bewertung, nur „gelesen/gehört“ als Häkchen. Das ist extensiver Input für Anfänger.

### Verteilung pro Session und Realismus für A1
- **Lektions-Session** (etwa 15–20 Minuten, verteilt über 2–3 Sitzungen):
  - Input etwa 30 %: Story zweimal, Lesen, Hören.
  - Übung und Abruf etwa 40 %: die bestehenden Aufgaben.
  - Sprechen und Output etwa 30 %: `speak`, Shadowing, Mini-Aufgabe.
  - Das folgt grob Nations „Four Strands“ mit je etwa ¼ für Input, Output, Formfokus und Flüssigkeit [FW].
- **Reine Wiederholungs-Session:** wie in `research-didactics.md`, ergänzt um höchstens 20 % Satzkarten.
- **Realistisch auf A1:**
  - Ankertext, Tap-Glossar, Raten, Satzkarten und Shadowing auf Stufe 1–2 funktionieren.
  - Freies Erschließen längerer Texte, Shadowing ohne Text und offene Aufgaben ohne Stütze sind auf A1 zu viel. Sie sollten frühestens ab A1.3 kommen.

---

## 3. Vorschlag: optionale JSON-Felder

Alle Felder sind optional. Fehlt `story`, bleibt das bisherige Verhalten. Der Validator sollte prüfen:
- Jedes Wort in `story.lines[].uk` ist durch das Lexikon abgedeckt.
- `new_forms[].form` und `guess[].word` kommen als Teilstring in der Zeile vor.
- Bei `guess` steht die richtige Option an Index 0, wie in der bestehenden Konvention.

```json
"story": {
  "title_uk": "У кав’ярні",
  "title_de": "Im Café",
  "characters": [
    { "id": "oksana", "name": "Окса́на", "emoji": "👩", "voice": { "pitch": 1.1, "rate": 0.95 } },
    { "id": "max", "name": "Макс", "emoji": "🧑", "voice": { "pitch": 0.9, "rate": 0.95 } }
  ],
  "lines": [
    { "id": "s01", "who": "oksana", "uk": "До́брий день! Що ви бу́дете?", "de": "Guten Tag! Was nehmen Sie?" },
    { "id": "s02", "who": "max", "uk": "Ка́ву, будь ла́ска.", "de": "Einen Kaffee, bitte.",
      "new_forms": [ { "form": "у", "in": "Ка́ву", "concept": "akk-sg-unbelebt" } ],
      "guess": { "word": "Ка́ву", "options": ["Kaffee", "Tee", "Wasser"] } }
  ],
  "questions": [ { "q_de": "Was bestellt Max?", "options": ["Kaffee", "Tee", "Saft"] } ],
  "repeat_at_end": true
}
```

Ergänzend kann `chat` optional ein Feld `goal_de` (String) und `goals` (Array mit Teilzielen, die je an einer `me`-Option hängen) bekommen. Für Satzkarten ist kein Content-Feld nötig.

---

## Quellen (Auswahl)
- Bryfonski, L. & McKay, T. H. (2019). TBLT implementation and evaluation: A meta-analysis. *Language Teaching Research* 23(5). https://doi.org/10.1177/1362168817744389
- Boers, F. & Faez, F. (2023). Meta-analysis to estimate the relative effectiveness of TBLT programs: Are we there yet? *Language Teaching Research*. https://doi.org/10.1177/13621688231167573
- Hamada, Y. (2016). Shadowing: Who benefits and how? *Language Teaching Research* 20(1). Ders. (2018), *RELC Journal*. https://doi.org/10.1177/0033688218771380
- Jeon, E.-Y. & Day, R. (2016). The effectiveness of ER on reading proficiency: A meta-analysis. *Reading in a Foreign Language* 28(2). https://nflrc.hawaii.edu/rfl/item/354
- Lee, S.-K. & Huang, H.-T. (2008). Visual input enhancement and grammar learning. *SSLA* 30(3). https://doi.org/10.1017/S0272263108080479
- Lichtman, K. & VanPatten, B. (2021). Was Krashen right? Forty years later. *Foreign Language Annals* 54(2). https://doi.org/10.1111/flan.12552
- Pan, S. C. & Carpenter, S. K. (2023). Prequestioning and pretesting effects: a review. *Educational Psychology Review* 35:97.
- Potts, R. & Shanks, D. R. (2014). The benefit of generating errors during learning. *JEP: General* 143(2). https://discovery.ucl.ac.uk/id/eprint/1399515
- Uchihara, T., Webb, S. & Yanagisawa, A. (2019). The effects of repetition on incidental vocabulary learning. *Language Learning* 69(3). https://doi.org/10.1111/lang.12343
- Yanagisawa, A., Webb, S. & Uchihara, T. (2020). How do different forms of glossing contribute to L2 vocabulary learning from reading? *SSLA* 42(2). https://doi.org/10.1017/S0272263119000688
- [FW] Krashen 1982; Schmidt 1990; Long 2015; Ellis 2003; Nation 2013 (*Learning Vocabulary in Another Language*); Hu & Nation 2000; Kornell, Hays & Bjork 2009; Richland, Kornell & Kao 2009; Carpenter & Olson 2012; Norris & Ortega 2000; Paivio 1986.
