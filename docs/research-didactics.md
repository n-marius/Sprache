# Didaktik-Recherche: Lernmethoden und Motivation für die Ukrainisch-PWA

Stand: 21.10.2026. Zielgruppe: deutschsprachige Erwachsene, Ziel A1 bis 30.04.2027, Schwerpunkt Hören, Verstehen und Sprechen, Richtung überwiegend Deutsch → Ukrainisch.
Quellenlage: Die FSRS-Formeln und -Parameter stammen direkt aus dem Quellcode von `py-fsrs` und dem FSRS-Wiki. Duolingo-Studien, Streak-Forschung und die Spacing-Metaanalyse wurden per Websuche geprüft. Alle übrigen Angaben (Effektstärken, Klassiker) stammen aus Fachwissen und sind mit **[FW]** markiert. Bitte vor einer Veröffentlichung gegenprüfen.

---

## TL;DR für Entwickler

- **Session:** 15–20 bewertete Aufgaben, etwa 5–7 Minuten. Tagesziel als Standard: 1 Session. Optional „Extra-Runde“ mit weiteren 10 Aufgaben.
- **Neue Vokabeln:** 5 pro Session (einstellbar 3–7), höchstens 10 pro Tag. Keine neuen Wörter, solange mehr als 80 Wiederholungen fällig sind.
- **Ablauf je neuem Item:** Einführung (Audio, Bild/Emoji, Übersetzung, ohne Bewertung) → Wiedererkennen (UA-Audio → DE, Auswahl aus 4) → gestützter Abruf (DE → UA, Auswahl oder Bausteine) → Produktion (Sprechen mit Selbstbewertung oder Tippen).
- **Mischung in einer Lektions-Session:** etwa 70 % Aufgaben zu neuen Items, etwa 30 % fällige oder ältere Items, verschachtelt. Zwischen zwei Aufgaben zum selben Item liegen mindestens 2 andere Aufgaben.
- **Fehler:** Das Item kommt nach 3–5 Aufgaben wieder, höchstens 2 Zusatzversuche pro Session. Am Ende folgt eine Fehlerrunde, bis jedes Fehler-Item einmal richtig war. Es gibt keine Strafen.
- **SRS:** „FSRS-light“ mit FSRS-6-Default-Gewichten, Ziel-Retention 0,90, Intervall ≈ Stabilität S in Tagen. Für FSRS zählt nur der erste Abruf pro Karte und Lerntag. Der Tageswechsel liegt um 04:00 Uhr Ortszeit.
- **Bewertung aus Aufgabentyp:** falsch = Again(1). Erkennen richtig = Good(3) bei neuen Karten, sonst Hard(2). Abruf mit Auswahl richtig = Good(3). Produktion richtig = Good(3). Produktion schnell (unter 5 s), ohne Hilfe und S ≥ 3 Tage = Easy(4). Mit Hinweis oder „unsicher“ = Hard(2).
- **Tägliches Review-Limit:** 60 Wiederholungen (einstellbar 30–150). Rückstau wird nach niedrigster Retrievability abgebaut.
- **Streak „sanft“:** Hauptanzeige ist ein Wochenziel (5 von 7 Tagen). Den Tages-Streak gibt es nur nebenbei. Pro 7 Streak-Tage gibt es 1 automatischen Freeze, maximal 2 gespeichert. Ein Streak lässt sich innerhalb von 48 h durch eine Doppel-Session reparieren.
- **Meisterschaft je Lektion (Stufen 0–4):** 4 = „gemeistert“, wenn ≥ 90 % der Items S ≥ 21 Tage haben und jedes Item mindestens einmal produktiv richtig war.
- **Pacing:** Soll = verbleibende Items geteilt durch verbleibende Lerntage. Geplant wird 6 Tage pro Woche mit Zielpuffer 31.03.2027. Anzeige „im Plan / X Tage voraus / Y Tage hinterher“.
- **Nicht umsetzen:** Herzen oder Leben, Ranglisten und Ligen, Zeitdruck-Timer, Schuld-Benachrichtigungen, virtuelle Währung, Strafen beim Streak-Verlust, Tippen als einzige Produktionsform.

---

## 1. Gedächtnis: Abruf, Verteilung, Verschachtelung

**Retrieval Practice / Testing Effect.** Aktives Abrufen festigt Wissen stärker als erneutes Lesen. Roediger & Karpicke (2006, *Psychological Science*) fanden nach einer Woche deutlich höhere Behaltensleistung durch Testen als durch Wiederlesen. Karpicke & Roediger (2008, *Science*) zeigten das für Fremdsprachen-Vokabelpaare (Swahili–Englisch): Wiederholtes Abrufen verdoppelte das Behalten ungefähr, wiederholtes Lernen half kaum. Die Metaanalyse von Adesope, Trevisan & Sundararajan (2017, *Review of Educational Research*) ergibt g ≈ 0,6 **[FW]**. Pyc & Rawson (2009) beschreiben die „Retrieval-Effort“-Hypothese: Ein schwieriger, aber erfolgreicher Abruf nützt mehr als ein leichter **[FW]**.
→ Fast jede Aufgabe sollte einen Abruf verlangen. Reine Anzeige gibt es nur bei der Einführung.

**Spacing.** Verteiltes Lernen schlägt massiertes Lernen (Cepeda et al. 2006, *Psychological Bulletin*; Cepeda et al. 2008, *Psychological Science* **[FW]**). Für L2 bestätigt die Metaanalyse von Kim & Webb (2022, *Language Learning* 72(1), 269–319; 37 Studien) einen Vorteil des verteilten Übens. Der Effekt hängt aber von Lernbereich und Aktivität ab. Kornell (2009) zeigte mit Karteikarten, dass Spacing auch innerhalb einer Session wirkt, etwa durch einen großen statt mehrerer kleiner Stapel **[FW]**.

**SRS-Algorithmen.**
- *Leitner* (1972): Boxen mit festen Intervallen (z. B. 1-2-4-8-16 Tage). Das Verfahren ist einfach, kennt aber keine Item-Schwierigkeit **[FW]**.
- *SM-2* (Woźniak 1987): Ease-Faktor ab 2,5, I₁ = 1, I₂ = 6, Iₙ = Iₙ₋₁·EF. Bekannte Schwächen: Der Ease-Faktor bleibt dauerhaft niedrig („ease hell“), und die Abrufwahrscheinlichkeit wird nicht modelliert **[FW]**.
- *FSRS* (Ye, Su & Cao 2022, KDD „A Stochastic Shortest Path Algorithm for Optimizing Spaced Repetition Scheduling“; Su et al. 2023, IEEE TKDE). FSRS beruht auf einem DSR-Modell aus **D**ifficulty (1–10), **S**tability (Tage, bis R auf 90 % fällt) und **R**etrievability (Abrufwahrscheinlichkeit). Seit Anki 23.10 ist FSRS integriert. In Benchmarks des Open-Spaced-Repetition-Projekts sagt es Erinnerung besser vorher als SM-2. Die Default-Ziel-Retention beträgt 0,9 (Quelle: `py-fsrs`, FSRS-Wiki).

**Interleaving und Desirable Difficulties.** Bjork (1994) und Bjork & Bjork (2011) beschreiben Erschwernisse, die kurzfristig die Leistung senken und langfristig das Lernen fördern: Spacing, Interleaving, Generieren und Testen. Die Interleaving-Metaanalyse von Brunmair & Richter (2019, *Psychological Bulletin*) ergibt g ≈ 0,42. Am stärksten wirkt Interleaving bei ähnlichen, leicht verwechselbaren Kategorien, für Wortlisten ist der Effekt schwächer **[FW]**.
→ Ähnliche Items gehören bewusst in dieselbe Session, zum Beispiel Wortpaare wie *він/вона/воно*, Zahlen und Kasusendungen. Die Schwierigkeit muss aber „erwünscht“ bleiben: Die Erfolgsquote sollte bei etwa 80–90 % liegen.

**Generation Effect.** Selbst erzeugte Antworten werden besser behalten als gelesene. Slamecka & Graf (1978) beschrieben den Effekt, die Metaanalyse von Bertsch et al. (2007) ergibt d ≈ 0,40 **[FW]**. Für Vokabeln gilt: Produktiver Abruf (L1 → L2) trainiert vor allem produktives Wissen, rezeptiver Abruf (L2 → L1) vor allem rezeptives (Webb 2009; Schneider, Healy & Bourne 2002; Nakata 2011) **[FW]**. Weil das Ziel Sprechen ist, muss die Richtung DE → UA dominieren. Die Richtung UA → DE ist als Einstieg und für das Hörverstehen trotzdem nötig.

## 2. Feedback

Hattie & Timperley (2007, *Review of Educational Research*) unterscheiden Feedback zu Aufgabe, Prozess, Selbstregulation und Person. Lob für die Person („Du bist toll“) wirkt kaum. Wisniewski, Zierer & Hattie (2020, *Frontiers in Psychology*) ermitteln d ≈ 0,48. Am wirksamsten ist informationsreiches Feedback **[FW]**. Shute (2008, *Review of Educational Research*) empfiehlt elaboriertes Feedback, das kurz und spezifisch ist und nicht bewertend klingt **[FW]**.

Zum *Zeitpunkt*: Bei Anfängern und einfachen Abrufaufgaben ist sofortiges Feedback angebracht. Verzögertes Feedback kann bei Fortgeschrittenen günstig sein, die Befundlage ist uneinheitlich (Shute 2008; Metcalfe et al. 2009) **[FW]**. Wichtig ist, dass nach einem Fehler die richtige Antwort sicher gezeigt wird. Fehler mit hoher Gewissheit werden nach Korrektur sogar besonders gut behalten („hypercorrection effect“, Butterfield & Metcalfe 2001) **[FW]**.
→ Nach jeder Aufgabe kommt sofort Rückmeldung. Bei einem Fehler zeigt die App die korrekte Form mit Audio und einen Ein-Satz-Hinweis, falls ein Muster erkennbar ist. Beispiele: „и ≠ і“, „Endung -у nach *бачу* (Akkusativ)“. Kein „Falsch!“-Ton in Signalrot.

## 3. Mehrkanaligkeit: Dual Coding, Hören, Sprechen

**Dual Coding** (Paivio 1971/1986): Verbale und bildliche Kodierung ergänzen sich, und konkrete Wörter werden besser behalten. Es gibt aber eine Einschränkung: Carpenter & Olson (2012, *JEP: LMC*) fanden, dass Bilder das Lernen fremdsprachiger Wörter nicht automatisch verbessern. Lernende überschätzen dabei ihr Wissen und verarbeiten das fremde Wort flacher **[FW]**.
→ Bilder oder Emoji eignen sich für konkrete Wörter wie 🍎 *яблуко*, und zwar als Bedeutungsträger anstelle der deutschen Übersetzung, ab der Wiedererkennungsstufe. Die Abrufaufgabe muss trotzdem das ukrainische Wort verlangen. Für abstrakte Wörter keine erzwungenen Emoji verwenden.

**Output-Hypothese** (Swain 1985, 1995): Sprechen und Schreiben machen Lücken bewusst („noticing the gap“), erzwingen syntaktische Verarbeitung und erlauben Hypothesentests **[FW]**. Verstehen allein (Krashen) führt nicht zuverlässig zu Sprechfähigkeit.

**Aussprache und Hören.** Die Metaanalyse von Lee, Jang & Plonsky (2015, *Applied Linguistics*) zeigt, dass explizites Aussprachetraining wirkt (d ≈ 0,89), besonders mit Feedback **[FW]**. High-Variability Phonetic Training mit mehreren Sprecher:innen verbessert die Lautwahrnehmung (Logan, Lively & Pisoni 1991; Überblick bei Thomson 2018) **[FW]**. Shadowing, also zeitversetztes Nachsprechen, verbessert in Studien mit japanischen EFL-Lernenden Hörverstehen und Flüssigkeit (Hamada 2016; Kadota 2019) **[FW]**.
→ Jedes Item braucht Audio, nach Möglichkeit von 2 Sprecher:innen, und eine langsame Wiedergabe mit 0,75×. Die Wortbetonung (наголос) wird im Lernmaterial mit Akzent markiert, denn das ist für die Verständlichkeit wichtig. Für Sätze gibt es eine Shadowing-Übung: anhören → zeitgleich mitsprechen → aufnehmen → vergleichen.

**Tippen, Erkennen, Sprechen.** Wiedererkennen per Auswahl ist leicht und schult rezeptives Wissen. Tippen ist produktiv, bindet aber Ressourcen an Orthografie und kyrillische Tastatur, was laut Zielsetzung nachrangig ist. Sprechen ist die zielnahe Produktion. Da es in iOS Safari keine verlässliche automatische Aussprachebewertung für Ukrainisch gibt, ist **Selbstbewertung nach dem Vergleich mit Muster-Audio** der pragmatische Weg. Als Zwischenstufe eignen sich Wortbausteine oder Silbenkacheln. Sie verlangen einen gestützten Abruf, aber kein Tippen.

## 4. Motivation

**Selbstbestimmungstheorie** (Deci & Ryan 1985; Ryan & Deci 2000, *American Psychologist*): Intrinsische Motivation braucht Autonomie, Kompetenzerleben und Eingebundenheit. Die Metaanalyse von Deci, Koestner & Ryan (1999) zeigt: Erwartbare, an die Aufgabe gekoppelte materielle Belohnungen senken die intrinsische Motivation (*Overjustification*, siehe auch Lepper, Greene & Nisbett 1973). Informatives, positives Feedback hebt sie dagegen **[FW]**.
→ Belohnungen sollten Kompetenzrückmeldung sein, etwa „Du verstehst jetzt 120 Wörter“, und keine Währung. Lernende sollen Tagesziel, Anzahl neuer Wörter und Modus selbst wählen können.

**Zielsetzung** (Locke & Latham 2002): Spezifische, herausfordernde und erreichbare Ziele mit Rückmeldung zum Fortschritt verbessern die Leistung **[FW]**. **Implementation Intentions** (Gollwitzer 1999; Metaanalyse Gollwitzer & Sheeran 2006, d ≈ 0,65): Pläne in der Form „Wenn Situation X, dann lerne ich“ helfen beim Dranbleiben **[FW]**.
→ Beim Onboarding fragt die App „Wann lernst du? (z. B. nach dem Frühstück, in der U-Bahn)“ und bietet eine optionale Erinnerung genau dann an.

**Gewohnheitsbildung** (Lally et al. 2010, *European Journal of Social Psychology*): Bis zur Automatisierung vergingen im Median 66 Tage, die Spannweite reichte von 18 bis 254 Tagen. **Einzelne ausgelassene Tage beeinträchtigten die Gewohnheitsbildung nicht wesentlich** **[FW]**. Das spricht fachlich gegen harte Streaks, die bei einem Fehltag auf null fallen.

**Streaks.** Silverman & Barasch (2023, *Journal of Consumer Research* 49(6), 1095–1117) zeigen in 7 Studien: Ein intakter, sichtbar protokollierter Streak steigert die weitere Nutzung. Nach einem Abbruch sinkt das Engagement deutlich, besonders wenn sich Personen selbst die Schuld geben. Der Effekt ist schwächer, wenn ein Streak reparierbar ist. Duolingo begründet seinen Streak selbst mit Verlustaversion (Kahneman & Tversky 1979) und den Streak Freeze mit genau diesem Demotivationsrisiko (Duolingo-Blog, Firmenquelle). Die Risiken sind Streak-Angst, „Minimal-Lektionen“ nur zum Streak-Erhalt, also Goodhart-Effekte, und der Ausstieg nach einem Abbruch.
→ Wochenziel statt Tageszwang, automatische Freezes, Reparaturmöglichkeit, und nie Vorwürfe.

**Wie gut wirkt Duolingo?** Vesselinov & Grego (2012) berichteten, dass 34 Stunden Duolingo einem Uni-Semester entsprechen. Die Studie wurde von Duolingo beauftragt, und die Stichprobe brach stark ab **[FW]**. Jiang, Rollinson, Plonsky, Gustafson & Pajak (2021, *Foreign Language Annals*) untersuchten 225 Erwachsene, die nur Duolingo nutzten. Nach 5 Einheiten erreichten sie im Lesen „Intermediate Low“ und im Hören „Novice High“. Das war vergleichbar mit Studierenden am Ende des 4. Semesters. **Sprechen und Schreiben wurden nicht getestet.** Eine Folgestudie zu 7 Einheiten zeigte Werte auf dem Niveau des 5. Semesters. Kritik: Die Studien stammen überwiegend von Duolingo-Angestellten, es gibt Selektionsbias, und nur Lernende, die durchgehalten haben, wurden erfasst (CALICO Journal 2024). Loewen et al. (2019, *ReCALL*) fanden geringe Zuwächse, hohe Varianz und eine Motivation, die oft an Gamification hing **[FW]**. Der Review von Shortt et al. (2021/2023, *CALL*) beschreibt Gamification als Engagement-Treiber und nennt Wettbewerbsdruck sowie das Spielen um Punkte statt um Lernerfolg als Nachteile.
→ Übernehmen sollte man Mikro-Sessions, sofortiges Feedback und spielerische Leichtigkeit. Nicht übernehmen sollte man Herzen, Ligen und Gem-Ökonomie. Sprechen muss explizit trainiert werden, denn genau diese Lücke zeigen die Duolingo-Daten.

**Goal-Gradient und Fortschrittsanzeigen.** Hull (1932) und Kivetz, Urminsky & Zheng (2006, *Journal of Marketing Research*) zeigen: Je näher das Ziel, desto mehr Anstrengung. Laut Nunes & Drèze (2006) erhöht ein „geschenkter“ Startfortschritt die Abschlussquote (*Endowed Progress Effect*) **[FW]**.
→ Fortschrittsbalken innerhalb einer Session und je Lektion. Mit einem sichtbaren ersten Segment starten, etwa wenn die Einführung schon als erledigt gilt. Nahe Etappenziele zeigen („noch 3 Aufgaben“), keine fernen 0-%-Balken.

## 5. Session-Gestaltung und Menge

Zu Mikro-Lernen gibt es keine harte Evidenz für eine optimale Länge. Konsens aus Kognitionspsychologie und App-Praxis: Kurze, abschließbare Einheiten von 5–10 Minuten senken die Einstiegshürde. Mehrere kurze Einheiten pro Tag sind über Spacing günstig. Duolingo-Lektionen umfassen etwa 10–15 Aufgaben **[FW]**.

Zur Zahl neuer Wörter: Anki empfiehlt standardmäßig 20 neue Karten pro Tag. Für Anfänger in einer Sprache mit fremder Schrift ist das zu viel, weil Wiederholungen schnell auf ein Vielfaches anwachsen (etwa 5–10 Reviews pro neuer Karte und Tag im eingeschwungenen Zustand). Kognitive Belastung (Sweller) und begrenzter Arbeitsspeicher sprechen für **5–7 neue Items pro Session** **[FW]**. Zeitrechnung: Vom 21.10.2026 bis 31.03.2027 (Puffer-Zieldatum) sind es etwa 160 Tage, bei 6 Lerntagen pro Woche also etwa 137 Lerntage. Ein A1-Wortschatz von 600–800 Items ergibt **5–6 neue Items pro Lerntag**, das passt.

Fehler innerhalb der Session: Eine sofortige Wiederholung erzeugt nur einen Arbeitsgedächtnis-Treffer. Eine Wiederholung nach einigen Zwischenaufgaben ist ein echter, kurz verteilter Abruf (entspricht den Learning-Steps in Anki und FSRS) **[FW]**.

---

## 6. Konkrete Empfehlungen für die App

### 6.1 Session-Aufbau

| Parameter | Wert |
|---|---|
| Bewertete Aufgaben je Session | 15–20 (Standard 18) |
| Neue Items je Lektions-Session | 5 (Einstellung 3/5/7) |
| Neue Items je Tag, maximal | 10 |
| Anteil fälliger/alter Items in Lektions-Session | 30 % (mindestens 3 Aufgaben, falls vorhanden) |
| Reine Wiederholungs-Session | 20 Aufgaben aus fälligen Karten, sortiert nach niedrigster R |
| Abstand zwischen Aufgaben zum selben Item | ≥ 2 andere Aufgaben |
| Fehler-Item erneut nach | 3–5 Aufgaben (zufällig), höchstens 2 Zusatzversuche |
| Fehlerrunde am Ende | jedes Fehler-Item 1× korrekt, danach Session abgeschlossen |

**Stufenfolge je neuem Item:**
1. *Einführung* (unbewertet): UA-Text mit Betonungsakzent, Audio läuft automatisch, Bild oder Emoji, DE-Bedeutung, optional Transliteration ausklappbar.
2. *Wiedererkennen:* UA-Audio, eventuell mit Text → DE-Bedeutung oder Bild aus 4 Optionen. Distraktoren stammen aus derselben Lektion.
3. *Gestützter Abruf:* DE oder Bild → UA aus 4 Optionen oder Silbenkacheln.
4. *Produktion:* DE → UA laut sprechen, aufnehmen, Muster anhören, selbst bewerten. Alternativ tippen mit Toleranz.

Bei späteren Wiederholungen wird der Aufgabentyp nach Stabilität gewählt: S < 3 d → Stufe 2–3, S ≥ 3 d → Stufe 4. Etwa 20 % Höraufgaben (nur Audio, kein Text) sind immer eingestreut.

### 6.2 FSRS-light (direkt umsetzbar)

Zustand je Karte: `{S, D, lastReview, reps, lapses, state ∈ new|learning|review}`. `t` = verstrichene Tage seit `lastReview`. Ein Tag beginnt um 04:00 Uhr Ortszeit.

```
w = [0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001,
     1.8722, 0.1666, 0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014,
     1.8729, 0.5425, 0.0912, 0.0658, 0.1542]          // FSRS-6 Defaults
DECAY  = -w[20]
FACTOR = 0.9^(1/DECAY) - 1
R(t,S) = (1 + FACTOR * t / S)^DECAY
interval(S) = S / FACTOR * (r_target^(1/DECAY) - 1)   // bei r_target=0.9 ⇒ = S
            → round, clamp [1, 365] Tage

S0(G) = w[G-1]                       // Again 0.21, Hard 1.29, Good 2.31, Easy 8.30
D0(G) = clamp(w[4] - e^(w[5]*(G-1)) + 1, 1, 10)

D' = D + (-w[6]*(G-3)) * (10-D)/9                      // linear damping
D''= clamp(w[7]*D0(4) + (1-w[7])*D', 1, 10)            // mean reversion

Erfolg (G≥2):
S' = S * (1 + e^w[8] * (11-D) * S^(-w[9]) * (e^(w[10]*(1-R)) - 1)
          * (G==2 ? w[15] : 1) * (G==4 ? w[16] : 1))
Fehler (G==1):
S' = min( w[11] * D^(-w[12]) * ((S+1)^w[13] - 1) * e^(w[14]*(1-R)),
          S / e^(w[17]*w[18]) )
S  = max(S', 0.01)
```

Regeln für Lernschritte am selben Tag (vereinfacht gegenüber dem vollen FSRS):
- **Nur der erste bewertete Abruf pro Karte und Lerntag** ändert S und D. Spätere Abrufe am selben Tag steuern nur die Warteschlange der Session. Die Einführung zählt nicht als Abruf.
- Neue Karte: Der erste Abruf setzt `S = S0(G)` und `D = D0(G)`. Weil Easy direkt 8 Tage ergäbe, wird beim ersten Abruf **höchstens Good** vergeben.
- Wird ein Item in derselben Session nach einem Fehler noch richtig beantwortet, bleibt die FSRS-Bewertung Again. Fällig ist es dann am nächsten Tag (S ≈ 0,2 → Intervall 1).
- Optional, voll FSRS-6-konform: Spätere Abrufe am selben Tag mit `S' = S·e^(w17·(G−3+w18))·S^(−w19)` behandeln, bei G ≥ 3 mit einem Faktor von mindestens 1. Das ist nicht nötig für v1.
- Fuzz: Intervalle ab 3 Tagen um ±5 % zufällig streuen, damit sich Fälligkeiten nicht ballen.

**Bewertung aus Aufgabentyp:**

| Aufgabe | falsch | richtig mit Hinweis / „unsicher“ | richtig |
|---|---|---|---|
| Wiedererkennen (Auswahl) | Again | – | Good bei state ≠ review, sonst Hard |
| Gestützter Abruf (Auswahl/Kacheln) | Again | Hard | Good |
| Produktion Sprechen (Selbstbewertung) | „Nicht gewusst“ = Again | „Unsicher“ = Hard | „Sicher“ = Good |
| Produktion Tippen | Again | Hard | Good. Easy, wenn < 5 s, ohne Hilfe, S ≥ 3 d |

Tipptoleranz: Groß- und Kleinschreibung, Apostroph-Varianten (ʼ ' ’) und Betonungszeichen ignorieren. Eine Levenshtein-Distanz von 1 ab 5 Zeichen gilt als „richtig, kleiner Schreibfehler“ und wird als Good gewertet, die korrekte Schreibung wird angezeigt. Ausnahme: Das Ergebnis ist ein anderes existierendes Wort.

**Limits:** 60 Reviews pro Tag (einstellbar). Sind mehr als 80 fällig, setzen neue Items aus und die App zeigt „Heute Wiederholungs-Tag“. Nach einer Pause werden höchstens 60 pro Tag nachgeholt, sortiert nach niedrigster R. Es gibt keinen „Berg“-Alarm.

### 6.3 Tagesziel, Streak, Pacing

- **Tagesziel:** 1 Session mit etwa 18 Aufgaben (circa 6 Minuten). Wählbar sind „locker“ mit 1, „normal“ mit 2 und „intensiv“ mit 3 Sessions. Das Ziel wird in Aufgaben gemessen, nicht in Punkten.
- **Wochenziel** (primär sichtbar): Tagesziel an 5 von 7 Tagen erreicht. Darstellung als 7 Punkte der Woche.
- **Tages-Streak** (sekundär): Für je 7 Tage gibt es 1 Freeze, gespeichert werden höchstens 2. Ein Freeze wird automatisch für einen verpassten Tag verbraucht. Ohne Freeze lässt sich der Streak reparieren, wenn innerhalb von 48 h das doppelte Tagesziel erreicht wird. Die Formulierung bleibt neutral, zum Beispiel „Willkommen zurück – 3 Wörter warten auf dich“.
- **Pacing zum 30.04.2027:**
  `soll_pro_Lerntag = ceil(verbleibende_neue_Items / verbleibende_Lerntage_bis_31.03.2027)` mit 6 Lerntagen pro Woche. Status = (gelernte Items − erwartete Items heute) / soll_pro_Lerntag in Tagen. Anzeige „im Plan“ (±2 Tage), „X Tage voraus“ oder „Y Tage hinterher – mit 1 Extra-Session pro Woche holst du das bis [Datum] auf“. Der Puffermonat April dient der Wiederholung und dem A1-Probetest.
- **Kompetenzrückmeldung statt XP:** „Du kannst 142 Wörter erkennen und 97 sagen.“ „Du verstehst jetzt die Zahlen 1–100.“

### 6.4 Meisterschaft je Lektion

| Stufe | Bedingung |
|---|---|
| 0 Neu | nichts gesehen |
| 1 Begonnen | alle Items eingeführt |
| 2 Gelernt | jedes Item mindestens 1× in Produktion richtig |
| 3 Gefestigt | ≥ 80 % der Items mit S ≥ 7 Tagen |
| 4 Gemeistert | ≥ 90 % der Items mit S ≥ 21 Tagen und keine Karte mit R < 0,8 |

Die nächste Lektion wird ab Stufe 2 freigeschaltet, nicht erst bei Stufe 4. Die Meisterschaft kann sinken, wenn R fällt. Die App stellt das als „auffrischen“ dar, nicht als Verlust.

### 6.5 Feedback-Gestaltung

- Sofort nach jeder Aufgabe. Bei einem Fehler zeigt die App die korrekte Lösung groß, spielt das Audio automatisch ab und gibt höchstens einen Satz Erklärung, wenn eine Regel greift.
- Ein Weiter-Button erscheint statt eines automatischen Wechsels, damit Zeit zum Verarbeiten bleibt. Bei richtigen Antworten wird nach 0,8 s automatisch weitergeschaltet, das ist abschaltbar.
- Farben: Grün für richtig, ein warmes Orange für „noch nicht“. Kein Rot-Alarm und kein Strafton.
- Sprechaufgabe: aufnehmen → automatisch zuerst die eigene Aufnahme, dann das Muster-Audio (oder umgekehrt, wählbar) → Selbstbewertung mit 3 Buttons. Nach dreimal „Nicht gewusst“ beim selben Item kommt ein Angebot zum langsamen Nachsprechen (0,75×) in Silben.
- Session-Ende: richtige Antworten (Anzahl), heute gelernte Wörter, Fortschritt der Lektion. Kein Fokus auf Fehlerquote.

### 6.6 Bewusst NICHT tun

- **Herzen oder Leben:** Sie bestrafen Fehler, obwohl Fehler Lerngelegenheiten sind, und hemmen Experimente.
- **Ranglisten, Ligen, Abstieg:** Sie fördern Punktejagd statt Lernen, schaden der Autonomie und demotivieren die untere Hälfte.
- **Virtuelle Währung, Truhen, Gems:** Overjustification, Ablenkung, Spielmechanik ohne Lernwert.
- **Zeitdruck-Timer:** Antwortzeit nur im Hintergrund für die Easy-Erkennung messen.
- **Schuld-Benachrichtigungen** wie „Dein Streak stirbt!“. Höchstens eine Erinnerung pro Tag zur selbst gewählten Zeit.
- **Streak auf null ohne Puffer**, große Verlust-Animationen.
- **Mehr als 10 neue Items pro Tag** oder Erklärungstexte über mehrere Absätze in einer Session.
- **Tippen als einzige Produktionsform**, dauerhaft eingeblendete Transliteration (ab Lektion 3 nur noch auf Antippen).
- **Easy beim ersten Kontakt**, FSRS-Updates bei jedem Abruf am selben Tag.

---

## Quellen

Geprüft per Websuche oder Quellcode:
- Ye, J., Su, J., Cao, Y. (2022). A Stochastic Shortest Path Algorithm for Optimizing Spaced Repetition Scheduling. *KDD '22*. – FSRS-Formeln und Defaults: https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm ; https://github.com/open-spaced-repetition/py-fsrs (scheduler.py)
- Jiang, X., Rollinson, J., Plonsky, L., Gustafson, E., Pajak, B. (2021). Evaluating the reading and listening outcomes of beginning-level Duolingo courses. *Foreign Language Annals*. https://experts.nau.edu/en/publications/evaluating-the-reading-and-listening-outcomes-of-beginning-level-/
- Duolingo-Folgestudie (Intermediate): https://blog.duolingo.com/effective-intermediate-learning ; Kritik: *CALICO Journal* 2024, https://journal.equinoxpub.com/Calico/article/view/26704
- Silverman, J., Barasch, A. (2023). On or Off Track: How (Broken) Streaks Affect Consumer Decisions. *Journal of Consumer Research* 49(6), 1095–1117. doi:10.1093/jcr/ucac029
- Duolingo (Firmenblog): How the streak builds habit. https://blog.duolingo.com/how-duolingo-streak-builds-habit
- Kim, S. K., Webb, S. (2022). The effects of spaced practice on second language learning: A meta-analysis. *Language Learning* 72(1), 269–319.
- Shortt, M. et al. (2021 online / 2023 Druck). Gamification in mobile-assisted language learning: a systematic review of Duolingo literature. *Computer Assisted Language Learning* 36.

Fachwissen **[FW]**, nicht einzeln online verifiziert: Roediger & Karpicke 2006; Karpicke & Roediger 2008; Adesope et al. 2017; Pyc & Rawson 2009; Cepeda et al. 2006/2008; Kornell 2009; Leitner 1972; Woźniak 1987 (SM-2); Bjork 1994; Bjork & Bjork 2011; Brunmair & Richter 2019; Slamecka & Graf 1978; Bertsch et al. 2007; Webb 2009; Nakata 2011; Schneider, Healy & Bourne 2002; Hattie & Timperley 2007; Wisniewski, Zierer & Hattie 2020; Shute 2008; Butterfield & Metcalfe 2001; Paivio 1971/1986; Carpenter & Olson 2012; Swain 1985/1995; Lee, Jang & Plonsky 2015; Logan, Lively & Pisoni 1991; Thomson 2018; Hamada 2016; Deci & Ryan 1985; Ryan & Deci 2000; Deci, Koestner & Ryan 1999; Lepper, Greene & Nisbett 1973; Locke & Latham 2002; Gollwitzer 1999; Gollwitzer & Sheeran 2006; Lally et al. 2010; Kahneman & Tversky 1979; Vesselinov & Grego 2012; Loewen et al. 2019; Kivetz, Urminsky & Zheng 2006; Nunes & Drèze 2006; Sweller 1988.
