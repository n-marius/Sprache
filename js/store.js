// Persistenter App-Zustand: IndexedDB (primär) + localStorage (Spiegel/Fallback), versioniert mit Migrationen.
import { DB_NAME, LS_KEY, DEFAULT_TARGET_DATE } from './config.js';

export const SCHEMA = 1;

export function defaultState() {
  const now = new Date().toISOString();
  return {
    schema: SCHEMA,
    createdAt: now,
    updatedAt: now,
    settings: {
      targetDate: DEFAULT_TARGET_DATE,
      dailyGoal: 15,            // bewertete Aufgaben pro Tag (≈ 1 Session)
      theme: 'auto',
      voiceURI: null,
      rate: 0.95,
      slowRate: 0.6,
      autoplay: true,
      stt: true,
      showGermanHints: true,
      sound: false,
      haptics: true,
      gistToken: '',
      gistId: '',
      gistAutoSync: false,
      gistBackup: false,
      newWordsPerSession: 5,
      sessionSize: 15,
    },
    lessons: {},
    srs: { vocab: {}, ex: {} },
    days: {},
    streak: { current: 0, best: 0, lastDay: null, freezes: 1, freezeUsed: [] },
    reports: [],
    meta: { lastSyncAt: null, lastBackupAt: null, seenVersion: null },
  };
}

// Migrationen: MIGRATIONS[n] hebt Schema n → n+1.
const MIGRATIONS = {
  // 1: s => { …; s.schema = 2; return s; },
};

function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }

// Tiefes Auffüllen fehlender Default-Felder, unbekannte Felder bleiben erhalten.
function fillDefaults(target, defaults) {
  for (const [k, v] of Object.entries(defaults)) {
    if (!(k in target) || target[k] === undefined) target[k] = structuredClone(v);
    else if (isObj(v) && isObj(target[k])) fillDefaults(target[k], v);
  }
  return target;
}

export function migrate(raw) {
  if (!isObj(raw)) return defaultState();
  let s = raw;
  if (typeof s.schema !== 'number') s.schema = 1;
  while (s.schema < SCHEMA && MIGRATIONS[s.schema]) s = MIGRATIONS[s.schema](s);
  return fillDefaults(s, defaultState());
}

// ---------- IndexedDB ----------
function idbOpen() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) return reject(new Error('no idb'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore('kv'); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('idb blocked'));
  });
}
function idbGet(db, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('kv', 'readonly');
    const r = tx.objectStore('kv').get(key);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
function idbPut(db, key, val) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('kv', 'readwrite');
    tx.objectStore('kv').put(val, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function lsGet() {
  try { const t = localStorage.getItem(LS_KEY); return t ? JSON.parse(t) : null; } catch { return null; }
}
function lsPut(s) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); return true; } catch { return false; }
}

function newer(a, b) {
  if (!a) return b; if (!b) return a;
  return (a.updatedAt || '') >= (b.updatedAt || '') ? a : b;
}

class Store {
  constructor() {
    this.state = defaultState();
    this.db = null;
    this.subs = new Set();
    this._timer = null;
    this._saving = Promise.resolve();
    this.persisted = false;
  }

  async init() {
    let fromIdb = null;
    try {
      this.db = await idbOpen();
      fromIdb = await idbGet(this.db, 'state');
    } catch { this.db = null; }
    const fromLs = lsGet();
    this.state = migrate(structuredClone(newer(fromIdb, fromLs) || defaultState()));
    // Speicher dauerhaft anfordern (Safari räumt sonst nach 7 Tagen Inaktivität ggf. auf)
    try { if (navigator.storage?.persist) this.persisted = await navigator.storage.persist(); } catch {}
    addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') this.flush(); });
    addEventListener('pagehide', () => this.flush());
    return this;
  }

  update(mutator, { silent = false } = {}) {
    const r = mutator(this.state);
    this.state.updatedAt = new Date().toISOString();
    this._schedule();
    if (!silent) this._emit();
    return r;
  }

  subscribe(fn) { this.subs.add(fn); return () => this.subs.delete(fn); }
  _emit() { for (const fn of this.subs) { try { fn(this.state); } catch (e) { console.error(e); } } }

  _schedule() {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.flush(), 400);
  }

  flush() {
    clearTimeout(this._timer);
    const snapshot = this.state;
    lsPut(snapshot);
    if (this.db) {
      this._saving = this._saving.then(() => idbPut(this.db, 'state', snapshot)).catch(e => console.warn('IDB save failed', e));
    }
    return this._saving;
  }

  exportData() { return structuredClone(this.state); }

  importData(obj) {
    const s = migrate(structuredClone(obj));
    this.state = s;
    this.state.updatedAt = new Date().toISOString();
    this.flush();
    this._emit();
  }

  reset() {
    const keep = { gistToken: this.state.settings.gistToken, gistId: this.state.settings.gistId };
    this.state = defaultState();
    Object.assign(this.state.settings, keep);
    this.flush();
    this._emit();
  }
}

export const store = new Store();
