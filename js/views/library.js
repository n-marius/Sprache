// Wissen: Erklärungs-/Grammatikbibliothek (#/library). Freigeschaltete Lektionen öffnen, gesperrte/geplante sichtbar.
import { h, ukText, icon } from '../ui/dom.js';
import { page, listGroup } from '../ui/shell.js';
import { anim } from '../ui/anim.js';
import { isUnlocked } from '../engine/progress.js';
import { listMined } from '../services/mining.js';

export function render(params, app) {
  const st = app.store.state;
  const q = h('input', { type: 'search', class: 'lib-search', placeholder: 'Konzepte und Lektionen durchsuchen', 'aria-label': 'Suchen' });
  const groups = h('div', { class: 'lib-groups' });

  const build = () => {
    const term = q.value.trim().toLowerCase();
    groups.replaceChildren();
    for (const phase of app.content.phases) {
      const rows = [];
      for (const meta of phase.lessons) {
        const lesson = app.content.getLesson(meta.id);
        const planned = !lesson;
        const open = !planned && (isUnlocked(app, meta.id) || !!st.lessons[meta.id]?.sessions || !!st.lessons[meta.id]?.storySeenAt);
        const concepts = lesson?.concepts?.map(c => c.title_de) || meta.grammar_de || [];
        const hay = [meta.title_de, meta.title_uk, lesson?.explanation?.title_de, ...concepts].join(' ').toLowerCase();
        if (term && !hay.includes(term)) continue;
        const read = !!st.lessons[meta.id]?.explainedAt;
        rows.push({
          icon: { emoji: anim.themeGlyph(meta.theme), color: open ? anim.themeColor(meta.theme) : 'var(--surface-3)' },
          title: h('span', { class: 'row-title' }, lesson?.explanation?.title_de || meta.title_de),
          subtitle: h('span', { class: 'row-subtitle lib-sub' },
            ukText(meta.title_uk, { tap: false }), ' · ',
            concepts.length ? concepts.slice(0, 3).join(', ') + (concepts.length > 3 ? ' …' : '') : meta.title_de),
          detail: planned ? h('span', { class: 'badge' }, 'geplant') : !open ? icon('lock', { cls: 'lib-lock' }) : read ? h('span', { class: 'badge green' }, 'gelesen') : h('span', { class: 'badge blue' }, 'neu'),
          accessory: open ? 'chevron' : null,
          href: open ? `#/explain/${encodeURIComponent(meta.id)}` : null,
          cls: open ? '' : 'lib-row-locked',
        });
      }
      if (!rows.length) continue;
      groups.append(listGroup({
        header: `${phase.id} · ${phase.title_de || ''}`,
        rows,
        footer: phase.lessons.some(l => !app.content.getLesson(l.id)) ? 'Geplante Lektionen werden freigeschaltet, sobald sie fertig sind.' : null,
      }));
    }
    if (!groups.childElementCount) groups.append(h('div', { class: 'empty' }, h('div', { class: 'empty-glyph' }, '🔎'), h('p', 'Nichts gefunden.')));
  };
  q.addEventListener('input', build);
  build();

  const mined = listMined(app);
  const extra = listGroup({
    header: 'Gesammelt',
    rows: [{
      icon: { name: 'sparkles', color: 'var(--purple)' },
      title: 'Gesammelte Sätze', subtitle: 'Aus Geschichten, Texten und Erklärungen',
      detail: String(mined.length), accessory: 'chevron', href: '#/trainer',
    }],
  });

  return page({
    title: 'Wissen', subtitle: 'Erklärungen und Grammatik der Lektionen',
    children: [h('div', { class: 'lib-search-wrap' }, icon('search', { cls: 'lib-search-icon' }), q), groups, extra],
  });
}
