// Sheet „Gerade kein Ton“: Hören/Sprechen für 1 Stunde, bis morgen oder dauerhaft ausschalten (Koordinator).
import { h, icon } from './dom.js';
import { sheet, segmented, toast } from './shell.js';
import { audioMode, setAudioOff } from '../audio-mode.js';

function untilText(u) {
  if (!u) return 'an';
  if (u === 'forever') return 'aus (dauerhaft)';
  const d = new Date(u);
  return `aus bis ${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}${d.toDateString() !== new Date().toDateString() ? ' (morgen)' : ''}`;
}

/** Öffnet das Sheet. → Promise, löst beim Schließen auf. */
export function openAudioModeSheet(app) {
  return new Promise(resolve => {
    let listen = true, speak = true;
    const status = h('div', { class: 'am-status t-foot t-2' });
    const renderStatus = () => {
      const m = audioMode(app);
      status.replaceChildren(
        h('div', h('strong', 'Hören: '), untilText(m.listenUntil)),
        h('div', h('strong', 'Sprechen: '), untilText(m.speakUntil)));
    };
    renderStatus();
    const which = segmented({
      options: [{ value: 'both', label: 'Hören + Sprechen' }, { value: 'listen', label: 'Nur Hören' }, { value: 'speak', label: 'Nur Sprechen' }],
      value: 'both',
      onChange: v => { listen = v !== 'speak'; speak = v !== 'listen'; },
    });
    const apply = duration => {
      setAudioOff(app, { listen, speak, duration });
      renderStatus();
      toast(duration === 'on' ? 'Ton wieder an' : 'Aufgaben ohne Ton – Fortschritt bleibt fair erhalten');
      s.close();
    };
    const btn = (label, duration, cls = 'btn-secondary') => h('button', { type: 'button', class: `btn ${cls} btn-block`, on: { click: () => apply(duration) } }, label);
    const content = h('div', { class: 'am-sheet' },
      h('div', { class: 'row', style: { gap: '14px', alignItems: 'flex-start' } },
        h('span', { class: 'row-icon', style: { width: '44px', height: '44px', borderRadius: '12px', display: 'grid', placeItems: 'center', background: 'var(--purple)', color: '#fff', flex: 'none' } }, icon('ear')),
        h('div', h('div', { class: 't-headline' }, 'Gerade kein Ton?'),
          h('div', { class: 't-sub t-2', style: { marginTop: '2px' } }, 'Hör- und Sprechaufgaben werden dann ausgelassen oder durch Textaufgaben mit demselben Inhalt ersetzt. Das zählt nicht als Fehler.'))),
      which,
      h('div', { style: { display: 'grid', gap: '6px' } },
        btn('Für 1 Stunde', '1h', 'btn-blue'), btn('Bis morgen', 'tomorrow'), btn('Dauerhaft (bis ich es wieder einschalte)', 'forever')),
      status,
      h('button', { type: 'button', class: 'btn btn-ghost btn-block', on: { click: () => apply('on') } }, icon('speaker'), 'Ton wieder einschalten'));
    const s = sheet({ title: 'Ton', content, onClose: resolve });
  });
}
