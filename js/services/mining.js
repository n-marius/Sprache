// STUB mit verbindlicher API (Story-Agent ersetzt): Satz-Mining – gesammelte Sätze landen im Vokabeltrainer.
// Eintrag in state.mined: { id, uk, de, lessonId, source:'story'|'reading'|'chat'|'explain'|…, focus?: Wortform (uk), createdAt }
export function listMined(app) { return app.store.state.mined || []; }
export function isMined(app, uk) { return listMined(app).some(m => m.uk === uk); }
export function addMined(app, entry) {
  if (isMined(app, entry.uk)) return null;
  const m = { id: 'm' + Date.now().toString(36), createdAt: new Date().toISOString(), ...entry };
  app.store.update(s => { (s.mined ||= []).unshift(m); });
  return m;
}
export function removeMined(app, id) { app.store.update(s => { s.mined = (s.mined || []).filter(m => m.id !== id); }); }
