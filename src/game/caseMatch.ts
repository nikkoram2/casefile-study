// Case Match module: match each court case to its explanation (facts and issue), then to its rule of law.
// The rule of law is always shown in bold. Results feed the same separate memory store as the Memory Drill.
import { CASES } from '../content/guide';
import { bump, maskNames } from './memoryArchive';
import { btn, h, openModal } from './ui';

const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
type C = (typeof CASES)[number];

export function openCaseMatch() {
  let chapter = 'all'; let size = 5;
  const body = h('div', null); const m = openModal(h('div', null, h('h2', null, 'Case Match'), body), { wide: true, label: 'Case Match' });
  const menu = () => {
    const sel = h('select', { 'aria-label': 'Chapter', onchange: (e: Event) => { chapter = (e.target as HTMLSelectElement).value; } }, ...[['all', 'All chapters'], ['6', 'Chapter 6'], ['7', 'Chapter 7'], ['8', 'Chapter 8'], ['10', 'Chapter 10']].map(([v, l]) => h('option', { value: v }, l)));
    const num = h('select', { 'aria-label': 'Cards per round', onchange: (e: Event) => { size = Number((e.target as HTMLSelectElement).value); } }, ...[3, 4, 5, 6].map(n => h('option', { value: String(n), selected: n === size }, `${n} cases`)));
    body.replaceChildren(h('p', { class: 'muted' }, 'Match each court case to its explanation, then to its rule of law. Click a case, then click the card you think belongs to it.'),
      h('div', { class: 'row' }, sel, num, btn('Start matching', () => round(), 'primary'), btn('Study all (rules in bold)', () => study(), 'ghost'), btn('Close', () => m.close(), 'ghost')));
  };
  const pool = () => CASES.filter(c => chapter === 'all' || String(c.chapter) === chapter);
  const study = () => {
    body.replaceChildren(h('div', { class: 'matchlist' }, ...pool().map(c => h('div', { class: 'compare' }, h('b', null, `${c.name} `), h('span', { class: 'muted' }, `(${c.cite}, Ch ${c.chapter})`), h('p', null, c.facts), h('p', null, h('strong', null, 'Rule of law: ' + c.rule))))), h('div', { class: 'row' }, btn('Back', menu, 'ghost')));
  };
  /** One matching stage: left items (cases) to shuffled right cards. */
  const stage = (cases: C[], title: string, cardOf: (c: C) => { text: string; bold: boolean }, done: (mistakes: number) => void) => {
    let picked: C | null = null; let mistakes = 0; let solved = 0; const fb = h('p', { class: 'muted', 'aria-live': 'polite' });
    const left = new Map<string, HTMLButtonElement>(); const right = new Map<string, HTMLButtonElement>();
    const L = shuffle(cases), R = shuffle(cases);
    const lcol = h('div', { class: 'col' }, ...L.map(c => { const b = btn(c.name, () => { if (b.classList.contains('right')) return; picked = c; for (const [id, x] of left) x.classList.toggle('sel', id === c.id); fb.textContent = 'Now pick its match on the right.'; }, 'opt') as HTMLButtonElement; left.set(c.id, b); return b; }));
    const rcol = h('div', { class: 'col' }, ...R.map(c => {
      const card = cardOf(c); const b = btn('', () => {
        if (!picked || b.classList.contains('right')) { fb.textContent = 'Pick a case on the left first.'; return; }
        if (picked.id === c.id) { b.classList.add('right'); left.get(c.id)!.classList.remove('sel'); left.get(c.id)!.classList.add('right'); left.get(c.id)!.setAttribute('disabled', ''); picked = null; fb.textContent = 'Match.'; if (++solved === cases.length) setTimeout(() => done(mistakes), 500); }
        else { mistakes++; bump(picked.id, false); b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 600); fb.textContent = 'Not that one. Try again.'; }
      }, 'opt') as HTMLButtonElement;
      b.replaceChildren(card.bold ? h('strong', null, card.text) : document.createTextNode(card.text)); right.set(c.id, b); return b;
    }));
    body.replaceChildren(h('div', { class: 'eyebrow' }, title), h('div', { class: 'matchgrid' }, lcol, rcol), fb);
  };
  const round = () => {
    const cases = shuffle(pool()).slice(0, size); if (cases.length < 2) { menu(); return; }
    stage(cases, 'Step 1 of 2: match each case to its explanation', c => ({ text: maskNames(c.name, `${c.facts} Issue: ${c.issue}`), bold: false }), m1 => {
      stage(cases, 'Step 2 of 2: match each case to its rule of law', c => ({ text: maskNames(c.name, c.rule), bold: true }), m2 => {
        for (const c of cases) bump(c.id, m1 + m2 === 0);
        const total = m1 + m2;
        body.replaceChildren(h('h3', null, total === 0 ? 'Perfect round' : `Round complete: ${total} wrong ${total === 1 ? 'pick' : 'picks'}`),
          ...cases.map(c => h('div', { class: 'compare' }, h('b', null, `${c.name} `), h('span', { class: 'muted' }, `(${c.cite})`), h('p', null, c.facts), h('p', null, h('strong', null, 'Rule of law: ' + c.rule)))),
          h('div', { class: 'row' }, btn('Another round', round, 'primary'), btn('Back', menu, 'ghost')));
      });
    });
  };
  menu();
}
