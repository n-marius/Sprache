// Globale App-Referenz ohne Import-Zyklen (siehe docs/ARCHITECTURE.md).
let current = null;
export function setApp(a) { current = a; }
export function getApp() { return current; }
