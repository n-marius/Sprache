// Oberflächen-Beschriftungen: Ukrainisch (antippbar bzw. per langem Druck übersetzbar) + dezent Deutsch.
//  uiLabel('tab_vocab', {hold:true})            → <span class="ui-l"><span class="uk uk-hold">Слова́</span><span class="ui-de">Vokabeln</span></span>
//  uiLabel({uk:'Уро́к 3', de:'Lektion 3'}, …)   → dynamische Texte (Wörter müssen trotzdem im Lexikon stehen)
// Optionen: hold (in Buttons/Links/Tabs/Segmenten: Antippen löst die Aktion aus → langer Druck übersetzt),
//           de:false (kein deutscher Zusatz, z. B. Tabbar/Segmente), layout 'stack' (darunter) | 'inline' (daneben).
// Der deutsche Zusatz wird per CSS ausgeblendet, wenn „Deutsche Hilfen“ aus ist (html[data-hints="off"]).
import { h, ukText } from './dom.js';
import { ui } from '../ui-text.js';

export const uiT = label => (typeof label === 'string' ? ui(label) : label || { uk: '', de: '' });

export function uiLabel(label, { hold = false, de = true, layout = 'stack', cls = '', tag = 'span' } = {}) {
  const t = uiT(label);
  return h(tag, { class: ['ui-l', `ui-l-${layout}`, cls] },
    ukText(t.uk, { hold, cls: 'ui-uk' }),
    de && t.de ? h('span', { class: 'ui-de', lang: 'de' }, t.de) : null);
}

/** Kurzform für Bedienelemente (Buttons, Links, Tabs): Übersetzung per langem Druck. */
export const holdLabel = (label, opts = {}) => uiLabel(label, { hold: true, ...opts });

/** Einstellung „Deutsche Hilfen“ global anwenden (CSS blendet .ui-de aus). */
export function applyHints(settings) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.hints = settings?.showGermanHints === false ? 'off' : 'on';
}
