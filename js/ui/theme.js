// Hell/Dunkel: 'auto' folgt dem System; Auswahl wird zusätzlich in localStorage für den ersten Frame gespiegelt.
export function applyTheme(theme) {
  const t = theme === 'light' || theme === 'dark' ? theme : 'auto';
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('mova.theme', t); } catch {}
  const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', dark ? '#000000' : '#F2F2F7'));
}
