# Architektur der App „Мова“ (Programmier-Team)

Statische PWA, ES-Module, kein Build. Alle Pfade **relativ** (GitHub Pages unter `/Sprache/`).
Datenformat der Inhalte: `docs/CONTRACT.md` (verbindlich). Text-Normalisierung nur über `js/lib/uk-text.js`.

## Lokal starten
```
cd /home/user/Sprache && npx http-server -p 8080 -c-1 .     # oder: python3 -m http.server 8080
http://localhost:8080/                           → echte Inhalte (Fallback auf Fixtures, wenn content/ fehlt)
http://localhost:8080/?content=tests/fixtures     → Test-Fixtures erzwingen
http://localhost:8080/?nosw                       → ohne Service Worker (Entwicklung)
```
Unit-Tests: `node --test tests/unit/`

## Dateien und Eigentümer (parallele Arbeit – nur eigene Dateien ändern!)
| Bereich | Dateien | Eigentümer |
|---|---|---|
| Kern | `index.html`, `package.json`, `js/app-context.js`, `js/ui/theme.js`, `tests/e2e/smoke.mjs`, `tests/unit/fixtures.test.mjs`, `manifest.webmanifest`, `sw.js`, `js/main.js`, `js/config.js`, `js/router.js`, `js/store.js`, `js/content.js`, `js/lexicon.js`, `js/i18n.js`, `js/ui/dom.js`, `js/ui/shell.js`, `js/ui/haptics.js`, `css/tokens.css`, `css/base.css`, `css/components.css`, `icons/`, `tools/render-icons.mjs`, `.github/`, `tests/fixtures/` | Programmier-Agent (Koordination) |
| (a) Aufgaben | `js/exercises/*.js`, `js/views/session.js`, `css/exercises.css` | Aufgaben-Agent |
| (b) Engine | `js/engine/*.js`, `js/views/today.js`, `js/views/course.js`, `js/views/lesson.js`, `js/views/words.js`, `js/views/summary.js`, `css/views.css`, `tests/unit/engine-*.test.mjs` | Engine-Agent |
| (c) Meldungen/Einstellungen | `js/services/reports.js`, `js/services/gist.js`, `js/services/export.js`, `js/ui/report-sheet.js`, `js/views/settings.js`, `js/views/reports.js`, `css/settings.css` | Melde-Agent |
| (d) Audio/Blase | `js/services/tts.js`, `js/services/stt.js`, `js/ui/popover.js`, `js/ui/audio-button.js`, `css/popover.css` | Audio-Agent |
| Animation | `js/ui/anim.js`, `css/animations.css` | Animations-Agent |

Wer eine Änderung in fremden Dateien braucht, meldet sie dem Koordinator (keine Direktänderung).
Neue Dateien im eigenen Bereich sind erlaubt, müssen aber in `sw.js` → `APP_ASSETS` ergänzt werden
(Liste wird vom Koordinator gepflegt; bitte im Abschlussbericht nennen). `tests/unit/sw-assets.test.mjs` prüft das.

## Laufzeit-Objekt `app` (aus `js/main.js`, an alle Views/Komponenten durchgereicht)
```js
app = {
  content,   // js/content.js  (siehe unten)
  lexicon,   // js/lexicon.js  { lookup(word) → Entry[] }
  store,     // js/store.js
  tts, stt,  // js/services/tts.js, stt.js
  navigate(hash),            // z. B. app.navigate('#/lesson/a1-1-01')
  t(key) → {uk, de},         // js/i18n.js (ui-strings + Fallbacks)
  version,                   // APP_VERSION aus js/config.js
}
```
Für Module ohne Durchreichung: `import { app } from './main.js'` ist NICHT erlaubt (Zyklen). Stattdessen
`import { getApp } from './app-context.js'` → liefert dasselbe Objekt nach dem Boot.

### content (`js/content.js`)
```js
content.base            // '' | 'tests/fixtures/' (Präfix für Content-URLs; 'content/' bei echten Inhalten)
content.isFixture       // true, wenn Fixtures geladen wurden
content.curriculum      // Original-JSON
content.phases          // [{id,title_uk,title_de,start,end,summary_de, lessons:[LessonMeta]}]
content.lessonList      // alle LessonMeta flach in Kursreihenfolge; LessonMeta = Curriculum-Eintrag + {phaseId, index, data?}
content.lessons         // Map id → Lektionsdaten (nur geladene, status 'ready')
content.getLesson(id)   // Lektionsdaten | undefined
content.vocabById       // Map vocabId → {...vocab, lessonId}
content.uiStrings       // Objekt key → {uk,de}
content.glossaryCommon  // Array
content.urls            // alle geladenen Content-URLs (für SW-Precache)
```

### store (`js/store.js`) – persistenter Zustand (IndexedDB, Fallback localStorage), versioniert
```js
store.state                         // lesen (nicht direkt schreiben)
store.update(state => { … })        // mutiert, speichert gedrosselt, benachrichtigt Abonnenten
store.subscribe(fn) → unsubscribe
store.flush()                       // sofort speichern
store.exportData() / store.importData(obj)  // Backup (Gist)
store.reset()
```
Zustandsschema (Version `SCHEMA = 1`, Migrationen in `store.js`):
```js
{
  schema: 1,
  createdAt, updatedAt,
  settings: {
    targetDate: '2027-04-30', dailyGoal: 20 /* Aufgaben */, theme: 'auto'|'light'|'dark',
    voiceURI: null, rate: 0.95, slowRate: 0.6, autoplay: true, stt: true, showGermanHints: true,
    sound: false, haptics: true, gistToken: '', gistId: '', gistAutoSync: false, gistBackup: false,
    newWordsPerSession: 6, sessionSize: 14
  },
  lessons: { [lessonId]: { sessions: 0, completedAt: null, lastAt: null, exSeen: { [exId]: {n, ok, lastAt} } } },
  srs: { vocab: { [vocabId]: Card }, ex: { ['lessonId/exId']: Card } },   // Card-Format bestimmt engine/srs.js
  days: { ['YYYY-MM-DD']: { tasks: 0, correct: 0, ms: 0, newWords: 0, sessions: 0 } },
  streak: { current: 0, best: 0, lastDay: null, freezes: 1, freezeUsed: [] },
  reports: [ Report ],                // Format bestimmt services/reports.js
  meta: { lastSyncAt: null, lastBackupAt: null, seenVersion: null }
}
```
Weitere Felder dürfen die Bereichs-Eigentümer in ihrem Teilbaum anlegen (`state.engine…`, `state.reportsMeta…`);
`store.js` übernimmt unbekannte Felder unverändert.

### Router (`js/router.js`)
Hash-Routing (`#/…`), Query-Parameter in `location.search` bleiben erhalten.
| Route | View-Modul | Tab |
|---|---|---|
| `#/today` (Default) | `views/today.js` | today |
| `#/course` | `views/course.js` (Lernpfad) | course |
| `#/lesson/:id` | `views/lesson.js` | course |
| `#/words` | `views/words.js` | words |
| `#/session/lesson/:id` | `views/session.js` | – (Vollbild) |
| `#/session/review` | `views/session.js` | – (Vollbild) |
| `#/summary` | `views/summary.js` (Daten via `sessionStorage`/Übergabe, s. u.) | – |
| `#/settings` | `views/settings.js` | settings |
| `#/reports` | `views/reports.js` | settings |

View-Modul-Schnittstelle:
```js
export function render(params, app) → HTMLElement | {el, destroy?(), onShow?()} | Promise<…>
```
`params`: Routen-Parameter `{id}` sowie `query` (URLSearchParams des Hash-Teils nach `?`).
Übergabe Session → Summary: `app.lastSummary = summary; app.navigate('#/summary')`.

## UI-Bausteine (`js/ui/dom.js`, `js/ui/shell.js`)
```js
h(tag, attrs?, ...children) → Element      // attrs: class, style, on:{click}, dataset, html (nur vertrauenswürdig)
ukText(text, {tap = true, cls}) → <span class="uk [uk-tap]">  // Wörter als <span class="w" data-k="key">
deText(text) → <span class="de">
icon(name, {size}) → <svg>                  // Inline-SVG-Icons (SF-Symbols-ähnlich), Liste in dom.js
page({title, subtitle, largeTitle=true, back, trailing, children}) → Element   // iOS-Seite mit Large Title
listGroup({header, footer, rows:[{title, subtitle, detail, icon, onClick, accessory:'chevron'|'switch'|Element}]})
sheet({title, content, actions}) → {el, close()}   // Bottom-Sheet (iPhone) / zentriertes Panel (iPad)
toast(text, {kind})                          // kurze Meldung
confirmDialog({title, message, ok, cancel}) → Promise<bool>
```
**Antipp-Übersetzung:** Jeder ukrainische Text, der antippbar sein soll, wird mit `ukText(text)` gerendert.
Für Antwortoptionen und reine Vokabelabfragen `ukText(text, {tap:false})`. `js/ui/popover.js` hört global
auf `.uk-tap .w` (Delegation, `pointerup`), zeigt die Blase und schließt sie beim nächsten Tap irgendwo.

## Design-Tokens (`css/tokens.css`)
Farben als CSS-Variablen, hell/dunkel per `prefers-color-scheme` + `html[data-theme]`:
`--bg, --bg-grouped, --surface, --surface-2, --label, --label-2, --label-3, --separator, --fill, --material`
Marke/Duolingo-artig: `--green --green-edge --red --red-edge --blue --blue-edge --yellow --yellow-edge --orange --purple --pink`
Feedback: `--ok`, `--ok-bg` (≈14 %), `--ok-border` (≈90 %), `--bad`, `--bad-bg`, `--bad-border`, `--sel`, `--sel-bg`, `--sel-border`.
Typo: `--font`, `--font-rounded`, Größen `--fs-largetitle 34px, --fs-title1 28, --fs-title2 22, --fs-title3 20, --fs-headline 17/600, --fs-body 17, --fs-callout 16, --fs-sub 15, --fs-foot 13, --fs-cap 12`.
Abstände `--sp-1..8` (4/8/12/16/20/24/32/40), Radien `--r-s 10, --r-m 14, --r-l 20, --r-xl 28`, Safe-Areas `--safe-top/bottom/left/right`.
Generische Klassen (`css/components.css`): `.btn .btn-primary .btn-blue .btn-secondary .btn-ghost .btn-danger .btn-block .btn-lg`,
`.option` (+ `.is-selected .is-correct .is-wrong .is-disabled`), `.chip` (Wortbaustein, + `.is-used`), `.card`, `.list-group/.list-row`,
`.progress > .progress-fill`, `.badge`, `.switch`, `.segmented`, `.sheet`, `.toast`, `.icon-btn`, `.pill`.

## Aufgaben-Komponenten (`js/exercises/<type>.js`, Registry `js/exercises/index.js`)
```js
export const selfChecking = false;      // true: Komponente beendet sich selbst über ctx.complete()
export function instructionKey(ex)      // → ui-strings-Key
export function render(ex, ctx) → { el, check?() → Result|Promise<Result>, getAnswer?() → string, destroy?() }
ctx = { app, lessonId, t, ukText, speaker(text,{slow,size,autoplay}), setReady(bool), complete(Result),
        rng(), shuffle(arr), settings, direction }
Result = { correct: bool, score?: 0..1, userAnswer: string, solution_uk?: string, solution_de?: string,
           explanation_de?: string, vocabResults?: {[vocabId]: bool},
           skipped?: bool /* z. B. „kann gerade nicht sprechen“ – wird nicht bewertet */,
           hinted?: bool, durationMs?: number }
```
Generierte Aufgaben (Engine, Review) haben dasselbe Format wie Vertrags-Aufgaben plus `generated: true`
und ggf. `source_vocab`. Komponenten unterscheiden nicht.

## Engine (`js/engine/`)
```js
// engine/session.js
createLessonSession(app, lessonId, opts?) → Session
createReviewSession(app, opts?) → Session
Session = { kind:'lesson'|'review', lessonId, theme, title_uk, title_de,
            next() → Item|null, record(item, Result), progress() → 0..1, remaining() → n,
            finish() → Summary }
Item = { key, kind:'intro', vocab, lessonId } | { key, kind:'exercise', ex, lessonId, generated? }
Summary = { kind, lessonId, theme, total, correct, accuracy, newWords:[vocab], reviewedWords:n, durationMs,
            masteryBefore, masteryAfter, streak:{current, extended}, dayGoal:{done, goal, met} }
// engine/progress.js
todayStats(app) → { goal, done, met, streak, freezes, dueCount, pacing:{status:'ahead'|'on_track'|'behind', …} }
lessonMastery(app, lessonId) → 0..1;  isUnlocked(app, lessonId) → bool
```

## Audio (`js/services/tts.js`, `stt.js`, `js/ui/audio-button.js`)
```js
tts.speak(text, {slow, rate}) → Promise   tts.stop()   tts.voices() → SpeechSynthesisVoice[] (uk)
tts.hasUkVoice() → bool   tts.supported   tts.onVoicesChanged(fn)
stt.supported   stt.listen({lang:'uk-UA', timeoutMs}) → Promise<{transcript, alternatives:[…]}>   stt.abort()
stt.score(heard, target) → 0..1 (über normalizeSentence + Ähnlichkeit)
speakerButton(text, {slow=false, size='m'|'l'|'s', autoplay=false}) → HTMLButtonElement
```

## Meldungen (`js/services/reports.js`, `js/ui/report-sheet.js`)
```js
openReportSheet({ lessonId, ex, userAnswer }) // von views/session.js aufgerufen (Flaggen-Icon)
```

## Animation (`js/ui/anim.js`) – alle Funktionen respektieren `prefers-reduced-motion`
```js
anim.correct(el)  anim.wrong(el)  anim.pop(el)  anim.feedbackIn(el)
anim.progress(fillEl, toFraction)  anim.countUp(el, to)  anim.streak(el)
anim.celebrate(container, theme) → Promise   // Lektionsabschluss, thematisch (Theme-Liste im Vertrag)
anim.themeGlyph(theme) → string (Emoji/Icon je Theme)
anim.viewIn(el)   // dezenter Einstieg bei Routenwechsel (vom Router aufgerufen)
```

## Service Worker (`sw.js`)
`VERSION` in `sw.js` = `APP_VERSION` in `js/config.js` (bei jeder Änderung beide erhöhen).
Precache: `APP_ASSETS` + `content/curriculum.json`, `ui-strings.json`, `glossary-common.json` + alle Lektionsdateien aus dem Curriculum.
Strategie: Cache-first für App-Assets, Stale-while-revalidate für Content. Neue Version → Hinweisleiste „Update verfügbar“.
