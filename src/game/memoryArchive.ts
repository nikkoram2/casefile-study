// Case Memory Archive: visual case cards, status from recall history, typed recall with forgiving matching, and comparison pairs.
// Typed recall is stored separately (casefile.typed.v1) so the main save format and multiple-choice stats are untouched.
import { CASES, caseById } from '../content/guide';
import { CASE_EXTRAS } from '../content/extras';
import type { Game } from './game';
import { btn, h, openModal } from './ui';

const KEY = 'casefile.typed.v1';
type Typed = Record<string, { n: number; ok: number; last: number }>;
const load = (): Typed => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const store = (t: Typed) => { try { localStorage.setItem(KEY, JSON.stringify(t)); } catch { /* private mode */ } };

const STOP = new Set('the a an of to in on is are was were be that this it for and or by with as at from not no if its their his her they he she can may must only any when then than so'.split(' '));
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w && !STOP.has(w)).map(w => w.replace(/(ing|ed|es|s)$/, ''));
/** Forgiving: share of the rule's key words present in the answer (ignores case, punctuation, common endings and filler words). */
export function typedScore(answer: string, rule: string) { const k = [...new Set(norm(rule))]; const a = new Set(norm(answer)); if (!k.length) return 0; return k.filter(w => a.has(w)).length / k.length; }
export const TYPED_PASS = 0.4;

const PAIRS: [string, string, string][] = [
  ['Chimel v. California', 'Arizona v. Gant', 'Chimel limits a search incident to arrest to the arrestee and grabbable area. Gant applies that limit to vehicles.'],
  ['Miranda v. Arizona', 'Berkemer v. McCarty', 'Miranda requires warnings for custodial interrogation. Berkemer: an ordinary traffic stop is not custody until formal arrest.'],
  ['Mapp v. Ohio', 'Hudson v. Michigan', 'Mapp applies exclusion to the states for illegal searches. Hudson: knock-and-announce violations do not trigger exclusion.'],
  ['South Dakota v. Opperman', 'Herring v. United States', 'Opperman: inventories must follow routine procedure. Herring: isolated clerical negligence does not trigger suppression.']
];

const MKEY = 'casefile.memory.v1';
type Mem = Record<string, { n: number; ok: number }>;
const loadM = (): Mem => { try { return JSON.parse(localStorage.getItem(MKEY) || '{}'); } catch { return {}; } };
const bump = (id: string, ok: boolean) => { const m = loadM(); const e = m[id] ?? { n: 0, ok: 0 }; e.n++; if (ok) e.ok++; m[id] = e; try { localStorage.setItem(MKEY, JSON.stringify(m)); } catch { /* ignore */ } };
const rate = (id: string) => { const e = loadM()[id]; return e ? e.ok / e.n : 0.5; };
const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/** Three-stage drill: (1) timed fact-card reveal with the name hidden, (2) precedent selection with progressive difficulty, (3) typed rule recall.
 *  Weakest cases come first (targeted review). Resolves with the number of precedents chosen correctly. */
export function runMemoryDrill(opts: { count: number; chapters?: number[]; title?: string }): Promise<{ right: number; total: number }> {
  return new Promise(resolve => {
    const pool = CASES.filter(c => !opts.chapters || opts.chapters.includes(c.chapter));
    const picks = [...pool].sort((a, b) => rate(a.id) - rate(b.id) + (Math.random() - 0.5) * 0.2).slice(0, opts.count);
    let right = 0; let i = 0; const typed = load();
    const body = h('div', null); const m = openModal(h('div', null, h('h2', null, opts.title ?? 'Memory Drill'), body), { wide: true, closable: false, label: 'Memory drill' });
    const finish = () => { m.close(); resolve({ right, total: picks.length }); };
    const next = () => { i++; if (i >= picks.length) finish(); else reveal(); };
    const reveal = () => {
      const c = picks[i]; let left = 12 + Math.min(8, i * 2); const t = h('b', null, String(left)); let timer = 0;
      const go = () => { clearInterval(timer); choose(); };
      body.replaceChildren(h('div', { class: 'eyebrow' }, `Card ${i + 1} of ${picks.length} · Stage 1: study the facts`), h('div', { class: 'memcard-big' }, h('h3', null, 'Who decided this?'), h('p', null, c.facts), h('p', { class: 'muted' }, 'Issue: ' + c.issue)), h('div', { class: 'row' }, h('span', { class: 'muted' }, 'Reveal ends in ', t, ' s'), btn('I\'m ready', go, 'primary')));
      timer = window.setInterval(() => { left--; t.textContent = String(Math.max(0, left)); if (left <= 0) go(); }, 1000);
    };
    const choose = () => {
      const c = picks[i]; const n = Math.min(5, 3 + Math.floor(i / 2));
      const near = shuffle(CASES.filter(x => x.id !== c.id)).sort((a, b) => (b.chapter === c.chapter ? 1 : 0) - (a.chapter === c.chapter ? 1 : 0)).slice(0, n - 1);
      const opts2 = shuffle([c, ...near]); const fb = h('p', { class: 'muted' });
      body.replaceChildren(h('div', { class: 'eyebrow' }, `Card ${i + 1} of ${picks.length} · Stage 2: choose the precedent`), h('p', null, 'The card is hidden. Which case matches those facts?'),
        h('div', { class: 'col' }, ...opts2.map(o => btn(o.name, () => { const ok = o.id === c.id; if (ok) right++; bump(c.id, ok); fb.textContent = ok ? 'Correct.' : `Not quite: it was ${c.name}.`; rule(); }, 'opt'))), fb);
    };
    const rule = () => {
      const c = picks[i]; const input = h('textarea', { rows: '3', 'aria-label': 'Type the rule', placeholder: 'Type the rule from memory…' }) as HTMLTextAreaElement; const fb = h('p', { class: 'muted' });
      const done = btn('Next', next, 'primary', { hidden: true });
      body.replaceChildren(h('div', { class: 'eyebrow' }, `Card ${i + 1} of ${picks.length} · Stage 3: type the rule`), h('p', null, c.name), input, fb,
        h('div', { class: 'row' }, btn('Check', () => { const sc = typedScore(input.value, c.rule); const t0 = typed[c.id]; typed[c.id] = { n: (t0?.n ?? 0) + 1, ok: (t0?.ok ?? 0) + (sc >= TYPED_PASS ? 1 : 0), last: sc }; store(typed); fb.textContent = (sc >= TYPED_PASS ? 'Good recall. ' : 'Not quite. ') + 'Rule: ' + c.rule; done.hidden = false; }, 'primary'), btn('Skip', next, 'ghost'), done));
    };
    reveal();
  });
}

export function openMemoryArchive(g: Game) {
  const typed = load(); let q = ''; let ch = 'all';
  const recs = g.profile.records;
  const status = (id: string) => {
    const r = recs.filter(x => x.itemId === 'R-CFACTS-' + id || x.itemId === 'R-CRULE-' + id || x.itemId === 'R-RULEC-' + id); const t = typed[id];
    const last = r.slice(-2); if (r.length >= 2 && last.every(x => x.correct && !x.hintsUsed) && (!t || t.last >= TYPED_PASS)) return 'Mastered';
    if (r.some(x => x.correct)) return 'Recalled'; if (r.length) return 'Seen'; return 'New';
  };
  const grid = h('div', { class: 'memgrid' }); const detail = h('div', { class: 'encdetail', tabindex: '0' });
  const score = h('div', { class: 'muted tiny' });
  const draw = () => {
    grid.replaceChildren(...CASES.filter(c => (ch === 'all' || String(c.chapter) === ch) && (c.name + c.cite + (CASE_EXTRAS[c.name]?.aliases ?? []).join(' ')).toLowerCase().includes(q.toLowerCase())).map(c => {
      const s = status(c.id);
      return h('button', { class: 'memcard s-' + s.toLowerCase(), onclick: () => show(c.id) }, h('b', null, c.name), h('span', null, `Ch ${c.chapter} · ${s}`));
    }));
    const done = CASES.filter(c => ['Recalled', 'Mastered'].includes(status(c.id))).length; score.textContent = `Case Memory: ${done} of ${CASES.length} cases recalled · ${CASES.filter(c => status(c.id) === 'Mastered').length} mastered. Separate from your scenario accuracy.`;
  };
  const show = (id: string) => {
    const c = caseById(id); const ex = CASE_EXTRAS[c.name]; const t = typed[id];
    const input = h('textarea', { rows: '3', 'aria-label': 'Type the rule in your own words', placeholder: 'Type the rule from memory…' }) as HTMLTextAreaElement; const fb = h('p', { class: 'muted' });
    const pair = PAIRS.find(p => p[0] === c.name || p[1] === c.name);
    detail.replaceChildren(h('h3', null, c.name), h('div', { class: 'muted' }, `${c.cite} · Chapter ${c.chapter}`),
      h('h4', null, 'Facts (study guide)'), h('p', null, c.facts), h('p', { class: 'muted' }, ex ? 'Memory aid (authored for this game): ' + ex.memoryAid : ''),
      h('h4', null, 'Recall it'), input,
      h('div', { class: 'row' }, btn('Check my recall', () => {
        const sc = typedScore(input.value, c.rule); const ok = sc >= TYPED_PASS; typed[id] = { n: (t?.n ?? 0) + 1, ok: (t?.ok ?? 0) + (ok ? 1 : 0), last: sc }; store(typed);
        fb.textContent = (ok ? 'Good recall. ' : 'Not quite yet. ') + `You matched about ${Math.round(sc * 100)}% of the key terms. Rule: ${c.rule}`; draw();
      }, 'primary'), btn('Show the rule', () => { fb.textContent = 'Rule: ' + c.rule; })), fb,
      h('p', { class: 'muted tiny' }, t ? `Typed recall: ${t.ok} of ${t.n} passed (tracked separately from multiple choice).` : 'Typed recall is tracked separately from multiple choice.'),
      h('div', { class: 'compare', hidden: !pair }, h('h4', null, pair ? `Compare: ${pair[0]} / ${pair[1]}` : ''), h('p', null, pair ? pair[2] : '')));
    detail.focus();
  };
  const search = h('input', { type: 'search', placeholder: 'Search cases…', 'aria-label': 'Search cases', oninput: (e: Event) => { q = (e.target as HTMLInputElement).value; draw(); } });
  const filt = h('select', { 'aria-label': 'Chapter filter', onchange: (e: Event) => { ch = (e.target as HTMLSelectElement).value; draw(); } }, ...[['all', 'All chapters'], ['6', 'Chapter 6'], ['7', 'Chapter 7'], ['8', 'Chapter 8'], ['10', 'Chapter 10']].map(([v, l]) => h('option', { value: v }, l)));
  openModal(h('div', null, h('h2', null, 'Case Memory Archive'), score, h('div', { class: 'row' }, search, filt, btn('Memory drill (weakest first)', async () => { const r = await runMemoryDrill({ count: 5 }); draw(); void r; }, 'primary')), h('div', { class: 'enc' }, grid, detail)), { wide: true, label: 'Case Memory Archive' });
  draw();
}
