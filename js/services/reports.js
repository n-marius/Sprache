// STUB mit verbindlicher API (Melde-Agent ersetzt).
export const CATEGORIES = ['Fehler im Ukrainischen', 'Übersetzung falsch', 'Betonung falsch', 'Audio/Aussprache', 'Lösung falsch bewertet', 'Aufgabe unklar', 'Darstellung/Technik', 'Sonstiges'];
export function addReport(app, data) { app.store.update(s => { s.reports.unshift({ id: Date.now().toString(36), createdAt: new Date().toISOString(), ...data }); }); }
export function deleteReport(app, id) { app.store.update(s => { s.reports = s.reports.filter(r => r.id !== id); }); }
