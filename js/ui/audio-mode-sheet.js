// Sheet „Gerade kein Ton“: Hören/Sprechen für 1 Stunde, bis morgen oder dauerhaft ausschalten (Koordinator).
import { h, icon } from './dom.js';
import { sheet, segmented, toast } from './shell.js';
import { audioMode, setAudioOff } from '../audio-mode.js';
import { uiLabel, holdLabel, uiT } from './ui-label.js';

/** Status „an / aus bis …“ → {uk, de} */
function untilText(u) {
  if (!u) return uiT('am_on');
  if (u === 'forever') return uiT('am_off_forever');
  const d = new Date(u);
  const t = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const tomorrow = d.toDateString() !== new Date().toDateString();
  const off = uiT('am_off').uk, until = uiT('until').uk;
  return tomorrow
    ? { uk: `${off} ${until} ${uiT('tomorrow').uk}, ${t}`, de: `aus bis ${t} (morgen)` }
    : { uk: `${off} ${until} ${t}`, de: `aus bis ${t}` };
}

/** Öffnet das Sheet. → Promise, löst beim Schließen auf. */
export function openAudioModeSheet(app) {
  return new Promise(resolve => {
    let listen = true, speak = true;
    const status = h('div', { class: 'am-status t-foot t-2' });
    const renderStatus = () => {
      const m = audioMode(app);
      const line = (k, u) => {
        const l = uiT(k), v = untilText(u);
        return h('div', uiLabel({ uk: `${l.uk}: ${v.uk}`, de: `${l.de}: ${v.de}` }, { layout: 'inline' }));
      };
      status.replaceChildren(line('listen', m.listenUntil), line('speak_verb', m.speakUntil));
    };
    renderStatus();
    const which = segmented({
      options: [{ value: 'both', label: uiT('am_both') }, { value: 'listen', label: uiT('am_listen') }, { value: 'speak', label: uiT('am_speak') }],
      value: 'both',
      onChange: v => { listen = v !== 'speak'; speak = v !== 'listen'; },
    });
    const apply = duration => {
      setAudioOff(app, { listen, speak, duration });
      renderStatus();
      toast(uiT(duration === 'on' ? 'sound_on' : 'no_sound_tasks'));
      s.close();
    };
    const btn = (label, duration, cls = 'btn-secondary') => h('button', { type: 'button', class: `btn ${cls} btn-block`, on: { click: () => apply(duration) } }, holdLabel(label));
    const content = h('div', { class: 'am-sheet' },
      h('div', { class: 'row', style: { gap: '14px', alignItems: 'flex-start' } },
        h('span', { class: 'row-icon', style: { width: '44px', height: '44px', borderRadius: '12px', display: 'grid', placeItems: 'center', background: 'var(--purple)', color: '#fff', flex: 'none' } }, icon('ear')),
        h('div', h('div', { class: 't-headline' }, uiLabel('sound_now_q')),
          h('div', { class: 't-sub t-2 ui-de', lang: 'de', style: { marginTop: '2px' } }, 'Hör- und Sprechaufgaben werden dann ausgelassen oder durch Textaufgaben mit demselben Inhalt ersetzt. Das zählt nicht als Fehler.'))),
      which,
      h('div', { style: { display: 'grid', gap: '6px' } },
        btn('for_hour', '1h', 'btn-blue'), btn('till_tomorrow', 'tomorrow'), btn('forever_btn', 'forever')),
      status,
      h('button', { type: 'button', class: 'btn btn-ghost btn-block', on: { click: () => apply('on') } }, icon('speaker'), holdLabel('sound_turn_on')));
    const s = sheet({ title: uiT('sound'), content, onClose: resolve });
  });
}
