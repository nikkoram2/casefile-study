import { CASES, caseById } from '../content/guide';
import type { RecallItem, Scenario } from '../content/types';
import { sceneCanvas } from '../engine/art';
import { sfx } from '../engine/audio';
import { gradeScenario } from '../learning/grade';
import { h, btn, openModal } from './ui';

export interface Outcome { correct: boolean; hintsUsed: number; evidenceNote?: string; }
export interface PanelOpts { index?: number; total?: number; mode?: string; onCase?: (id: string) => void; }
const HINT_LABEL = ['Hint 1 · Factual clue', 'Hint 2 · Legal principle', 'Hint 3 · Guided explanation'];

export function hintBlock(hints: string[], state: { used: number }) {
  const box = h('div', { class: 'hintbox', 'aria-live': 'polite' });
  const b = btn('Need a hint? (0/3)', () => {
    if (state.used >= 3) return; box.append(h('div', { class: 'hint' }, h('b', null, HINT_LABEL[state.used] + ': '), hints[state.used])); state.used++;
    b.textContent = state.used >= 3 ? 'No more hints' : `Next hint (${state.used}/3)`; if (state.used >= 3) b.setAttribute('disabled', ''); sfx.paper();
  }, 'ghost small', { 'aria-describedby': 'hint-note' });
  return { wrap: h('div', { class: 'hintwrap' }, b, h('span', { id: 'hint-note', class: 'muted tiny' }, 'Using hints is fine. It is tracked separately and never penalized.'), box), btn: b };
}
function caseChips(ids: string[], onCase?: (id: string) => void) {
  if (!ids.length) return null;
  return h('div', { class: 'chips' }, h('span', { class: 'muted tiny' }, 'Related case:'), ...ids.map(id => btn(caseById(id).name, () => onCase?.(id), 'chip')));
}
export function feedbackBlock(opts: { correct: boolean; consequence?: string; explanation: string; extra?: (Node | null)[]; detail?: string; rule: string; caseIds: string[]; onCase?: (id: string) => void; onContinue: () => void; label?: string }) {
  const more = h('div', { class: 'more', hidden: true }, h('p', null, opts.detail ?? ''));
  const toggle = btn('More detail', () => { more.toggleAttribute('hidden'); toggle.textContent = more.hasAttribute('hidden') ? 'More detail' : 'Less detail'; }, 'ghost small');
  const cont = btn(opts.label ?? 'Continue ▸', opts.onContinue, 'primary', { autofocus: true });
  const el = h('div', { class: 'feedback ' + (opts.correct ? 'ok' : 'bad'), role: 'status', 'aria-live': 'assertive' },
    h('div', { class: 'verdict' }, opts.correct ? '✔ Correct' : '✖ Not quite'),
    opts.consequence ? h('p', { class: 'conseq' }, opts.consequence) : null,
    h('p', null, opts.explanation), ...(opts.extra ?? []),
    h('p', { class: 'rule' }, h('b', null, 'Rule: '), opts.rule),
    caseChips(opts.caseIds, opts.onCase), h('div', { class: 'row' }, opts.detail ? toggle : null, cont), opts.detail ? more : null);
  setTimeout(() => cont.focus(), 20); return el;
}

export function runScenario(s: Scenario, o: PanelOpts = {}): Promise<Outcome> {
  return new Promise(resolve => {
    (window as any).__current = s;
    const state = { used: 0 }; let selection: string[] = []; let locked = false;
    const hint = hintBlock(s.hints, state);
    const optBtns = new Map<string, HTMLButtonElement>();
    const submit = btn('Submit decision', () => doSubmit(), 'primary', { disabled: true });
    const factsEl = h('ul', { class: 'facts' }, ...s.facts.map(f => h('li', null, f)));
    const logEl = h('div', { class: 'ilog' });
    const refreshSubmit = () => { if (s.type === 'order') submit.toggleAttribute('disabled', selection.length !== s.options.length); else submit.toggleAttribute('disabled', selection.length === 0); };
    const sync = () => {
      for (const [id, b] of optBtns) {
        const on = selection.includes(id); b.setAttribute('aria-pressed', String(on)); b.classList.toggle('sel', on);
        const badge = b.querySelector('.ord'); if (badge) badge.textContent = s.type === 'order' && on ? String(selection.indexOf(id) + 1) : '';
      }
      refreshSubmit();
    };
    const pick = (id: string) => {
      if (locked) return; sfx.click();
      if (s.type === 'choice') selection = [id];
      else if (s.type === 'multi') selection = selection.includes(id) ? selection.filter(x => x !== id) : [...selection, id];
      else selection = selection.includes(id) ? selection.filter(x => x !== id) : [...selection, id];
      sync();
    };
    const useRects = s.type === 'multi' && s.options.every(op => op.rect);
    const optionEls = s.options.map((op, i) => {
      const b = h('button', { type: 'button', class: 'opt' + (useRects ? ' hot' : ''), 'aria-pressed': 'false', onclick: () => pick(op.id), 'data-id': op.id,
        style: useRects ? `left:${op.rect![0]}%;top:${op.rect![1]}%;width:${op.rect![2]}%;height:${op.rect![3]}%` : undefined },
        h('span', { class: 'key' }, String(i + 1)), h('span', { class: 'otext' }, op.text), s.type === 'order' ? h('span', { class: 'ord', 'aria-hidden': 'true' }) : null);
      optBtns.set(op.id, b as HTMLButtonElement); return b;
    });
    const sceneWrap = s.scene ? h('div', { class: 'scene' + (useRects ? ' hs' : '') }, (() => { const cv = sceneCanvas(s.scene, s.marker); cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', `Illustration: ${s.scene}`); return cv; })(), ...(useRects ? optionEls : [])) : null;
    const optsList = useRects ? null : h('div', { class: 'opts ' + s.type }, ...optionEls);
    const hotList = useRects ? h('div', { class: 'selected muted' }, 'Click areas on the picture to select them. Click again to unselect.') : null;
    const interview = s.interview ? h('div', { class: 'interview' }, h('div', { class: 'tiny muted' }, 'Question the person (optional, but facts matter):'),
      ...s.interview.map(q => { const b = btn('Ask: ' + q.q, () => { b.setAttribute('disabled', ''); sfx.discover(); logEl.append(h('p', { class: 'qa' }, h('b', null, q.q + ' '), q.a)); factsEl.append(h('li', { class: 'found' }, q.a.replace(/^"|"$/g, ''))); }, 'ghost small'); return b; }), logEl) : null;
    const body = h('div', { class: 'sbody' },
      h('div', { class: 'scol' }, sceneWrap, hotList),
      h('div', { class: 'tcol' }, h('p', { class: 'setup' }, s.setup), h('div', { class: 'tiny muted' }, 'Facts'), factsEl, interview, h('p', { class: 'prompt' }, s.prompt), optsList, hint.wrap));
    const feedbackHost = h('div', { class: 'fbhost' });
    const header = h('div', { class: 'shead' }, h('div', null, h('div', { class: 'eyebrow' }, `${o.total ? `Decision ${(o.index ?? 0) + 1} of ${o.total} · ` : ''}${s.type === 'order' ? 'Sequence' : s.type === 'multi' ? 'Select all that apply' : 'Choose one'}`), h('h2', null, s.title)), h('span', { class: 'tag' }, 'Fictional scenario'));
    const root = h('div', { class: 'scenario' }, header, body, h('div', { class: 'row end' }, submit), feedbackHost);
    const modal = openModal(root, { wide: true, closable: false, label: s.title });
    const keyHandler = (e: KeyboardEvent) => {
      if (locked || (e.target as HTMLElement).tagName === 'INPUT') return; const n = parseInt(e.key, 10);
      if (n >= 1 && n <= s.options.length) { e.stopPropagation(); pick(s.options[n - 1].id); } else if (e.key.toLowerCase() === 'h') { e.stopPropagation(); hint.btn.click(); }
      else if (e.key === 'Enter' && !submit.hasAttribute('disabled') && (e.target as HTMLElement).tagName !== 'BUTTON') { e.stopPropagation(); doSubmit(); }
    };
    window.addEventListener('keydown', keyHandler, true);
    function doSubmit() {
      if (locked || submit.hasAttribute('disabled')) return; locked = true;
      const g = gradeScenario(s, selection); (g.correct ? sfx.right : sfx.wrong)();
      for (const [id, b] of optBtns) { b.setAttribute('disabled', ''); const isC = s.correct.includes(id), picked = selection.includes(id); b.classList.toggle('right', isC); b.classList.toggle('wrong', picked && !isC); if (isC && !picked && s.type === 'multi') b.classList.add('missed'); }
      submit.remove(); hint.btn.setAttribute('disabled', '');
      const extra: (Node | null)[] = [];
      if (!g.correct) {
        if (s.type === 'choice') { const m = s.options.find(x => x.id === selection[0])?.misconception; if (m) extra.push(h('p', { class: 'why' }, h('b', null, 'Why that pick fails: '), m)); }
        else if (s.type === 'multi') {
          const items = [...g.extra.map(id => ({ id, t: 'Should not be selected' })), ...g.missing.map(id => ({ id, t: 'Should have been selected' }))];
          extra.push(h('ul', { class: 'why' }, ...items.map(it => { const op = s.options.find(x => x.id === it.id)!; return h('li', null, h('b', null, op.text + ': '), `${it.t}. ${op.misconception ?? ''}`); })));
        } else extra.push(h('p', { class: 'why' }, 'Correct order: ' + s.correct.map(id => s.options.find(x => x.id === id)!.text).join(' → ')));
      }
      feedbackHost.append(feedbackBlock({ correct: g.correct, consequence: g.correct ? s.consequenceRight : s.consequenceWrong, explanation: s.explanation, extra, detail: s.detail, rule: s.rule, caseIds: s.caseIds, onCase: o.onCase,
        onContinue: () => { window.removeEventListener('keydown', keyHandler, true); modal.close(); resolve({ correct: g.correct, hintsUsed: state.used }); } }));
      feedbackHost.scrollIntoView({ block: 'nearest' });
    }
  });
}

export function runRecall(r: RecallItem, o: PanelOpts = {}): Promise<Outcome> {
  return new Promise(resolve => {
    (window as any).__current = r;
    const state = { used: 0 }; let pickId = ''; let locked = false;
    const c = r.objectiveId.startsWith('CASE-') ? caseById(r.objectiveId) : null;
    const hints = c ? [`Think about the chapter ${r.chapter} facts and who was involved.`, `This is a Chapter ${r.chapter} case.`, `Hint: ${c.takeaway.split(/[;:,]/)[0]}...`] : [`This comes from Chapter ${r.chapter}.`, 'Think about the key phrase in the definition.', 'Eliminate options that describe a different concept.'];
    const hint = hintBlock(hints, state); const host = h('div', { class: 'fbhost' }); const btns = new Map<string, HTMLButtonElement>();
    const list = h('div', { class: 'opts choice' }, ...r.options.map((op, i) => { const b = h('button', { type: 'button', class: 'opt', onclick: () => choose(op.id) }, h('span', { class: 'key' }, String(i + 1)), h('span', { class: 'otext' }, op.text)); btns.set(op.id, b as HTMLButtonElement); return b; }));
    const choose = (id: string) => {
      if (locked) return; locked = true; pickId = id; const ok = id === r.correct; (ok ? sfx.right : sfx.wrong)();
      for (const [bid, b] of btns) { b.setAttribute('disabled', ''); b.classList.toggle('right', bid === r.correct); b.classList.toggle('wrong', bid === id && !ok); } hint.btn.setAttribute('disabled', '');
      window.removeEventListener('keydown', keyHandler, true);
      host.append(feedbackBlock({ correct: ok, explanation: r.explanation, rule: c ? c.rule : r.explanation, caseIds: c ? [c.id] : [], onCase: o.onCase, onContinue: () => { modal.close(); resolve({ correct: ok, hintsUsed: state.used }); } }));
    };
    const kindLabel = r.category === 'case' ? 'Case recall' : r.category === 'definition' ? 'Definition recall' : 'Core topic recall';
    const root = h('div', { class: 'scenario recall' }, h('div', { class: 'shead' }, h('div', null, h('div', { class: 'eyebrow' }, `${o.total ? `Question ${(o.index ?? 0) + 1} of ${o.total} · ` : ''}${kindLabel} · Ch. ${r.chapter}`), h('h2', null, 'Recall')), h('span', { class: 'tag alt' }, 'From the study guide')),
      h('p', { class: 'prompt pre' }, r.prompt), list, hint.wrap, host);
    const modal = openModal(root, { wide: true, closable: false, label: 'Recall question' });
    const keyHandler = (e: KeyboardEvent) => { const n = parseInt(e.key, 10); if (n >= 1 && n <= r.options.length) { e.stopPropagation(); choose(r.options[n - 1].id); } else if (e.key.toLowerCase() === 'h') { e.stopPropagation(); hint.btn.click(); } };
    window.addEventListener('keydown', keyHandler, true); void pickId; void CASES;
  });
}
