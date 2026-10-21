// Content-Loader: Curriculum, UI-Strings, Glossar, Lektionsdateien (Vertrag: docs/CONTRACT.md).
// Quelle: ?content=<pfad> (z. B. tests/fixtures) erzwingt einen Ordner; sonst content/ mit Fallback auf Fixtures.

const FIXTURE_BASE = 'tests/fixtures/';
const DEFAULT_BASE = 'content/';

async function getJSON(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

function normBase(b) {
  b = String(b || '').trim().replace(/^\/+/, '').replace(/\.\.+/g, '');
  if (b && !b.endsWith('/')) b += '/';
  return b;
}

export class Content {
  constructor() {
    this.base = DEFAULT_BASE;
    this.isFixture = false;
    this.curriculum = null;
    this.phases = [];
    this.lessonList = [];
    this.lessons = new Map();
    this.vocabById = new Map();
    this.uiStrings = {};
    this.glossaryCommon = [];
    this.urls = [];
    this.errors = [];
  }

  async load() {
    const q = new URLSearchParams(location.search);
    const forced = q.get('content');
    const bases = forced ? [normBase(forced)] : [DEFAULT_BASE, FIXTURE_BASE];
    let lastErr;
    for (const base of bases) {
      try {
        await this._loadFrom(base);
        this.isFixture = base === FIXTURE_BASE;
        return this;
      } catch (e) {
        lastErr = e;
        console.warn('Content-Quelle nicht nutzbar:', base, e.message);
      }
    }
    throw lastErr || new Error('Keine Inhalte gefunden');
  }

  async _loadFrom(base) {
    this.base = base;
    this.urls = [];
    this.errors = [];
    const curUrl = base + 'curriculum.json';
    const curriculum = await getJSON(curUrl);
    if (!curriculum || !Array.isArray(curriculum.phases)) throw new Error('curriculum.json ungültig');
    this.urls.push(curUrl);

    const [ui, glossary] = await Promise.all([
      getJSON(base + 'ui-strings.json').then(j => { this.urls.push(base + 'ui-strings.json'); return j; })
        .catch(e => { this.errors.push(e.message); return {}; }),
      getJSON(base + 'glossary-common.json').then(j => { this.urls.push(base + 'glossary-common.json'); return j; })
        .catch(e => { this.errors.push(e.message); return []; }),
    ]);
    this.curriculum = curriculum;
    this.uiStrings = ui && typeof ui === 'object' ? ui : {};
    this.glossaryCommon = Array.isArray(glossary) ? glossary : [];

    this.phases = curriculum.phases.map(p => ({ ...p, lessons: (p.lessons || []).map(l => ({ ...l, phaseId: p.id })) }));
    this.lessonList = this.phases.flatMap(p => p.lessons);
    this.lessonList.forEach((l, i) => { l.index = i; });

    const ready = this.lessonList.filter(l => l.status === 'ready' && l.file);
    const loaded = await Promise.all(ready.map(async meta => {
      const url = base + meta.file;
      try {
        const data = await getJSON(url);
        this.urls.push(url);
        return [meta, data];
      } catch (e) {
        this.errors.push(e.message);
        meta.status = 'error';
        return [meta, null];
      }
    }));
    this.lessons.clear();
    this.vocabById.clear();
    // Kursreihenfolge beibehalten (vocabById: erste Definition gewinnt)
    for (const [meta, data] of loaded) {
      if (!data) continue;
      data.exercises = Array.isArray(data.exercises) ? data.exercises : [];
      data.vocab = Array.isArray(data.vocab) ? data.vocab : [];
      data.glossary = Array.isArray(data.glossary) ? data.glossary : [];
      data.grammar = Array.isArray(data.grammar) ? data.grammar : [];
      data.theme = data.theme || meta.theme;
      meta.data = data;
      this.lessons.set(meta.id, data);
      for (const v of data.vocab) {
        if (!this.vocabById.has(v.id)) this.vocabById.set(v.id, { ...v, lessonId: meta.id });
      }
    }
    if (this.lessons.size === 0) throw new Error('Keine Lektion geladen');
  }

  getLesson(id) { return this.lessons.get(id); }
  getMeta(id) { return this.lessonList.find(l => l.id === id); }
  readyLessons() { return this.lessonList.filter(l => this.lessons.has(l.id)); }
  /** Lektionen vor (exklusive) der angegebenen, nur geladene. */
  lessonsBefore(id) {
    const out = [];
    for (const l of this.lessonList) { if (l.id === id) break; if (this.lessons.has(l.id)) out.push(l); }
    return out;
  }
}

export const content = new Content();
