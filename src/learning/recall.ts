// Recall items are assembled ONLY from study-guide text (verbatim facts, rules, definitions) plus same-chapter distractors.
// No legal content is invented at runtime. Answer position is shuffled with a seed.
import { CASES, DEFINITIONS, TOPICS } from '../content/guide';
import type { CaseEntry, ChapterNo, RecallItem } from '../content/types';
import { hashSeed, rng, shuffle } from './rng';

export function maskFacts(c: CaseEntry): string {
  let t = c.facts;
  for (const a of [...c.aliases].sort((x, y) => y.length - x.length)) t = t.split(a).join('the defendant');
  return t;
}
function pick<T>(correct: T, pool: T[], n: number, r: () => number, same: (a: T, b: T) => boolean, preferred: (x: T) => boolean): T[] {
  const others = pool.filter(p => !same(p, correct));
  const pref = shuffle(others.filter(preferred), r), rest = shuffle(others.filter(x => !preferred(x)), r);
  return [...pref, ...rest].slice(0, n);
}
function make(id: string, kind: RecallItem['kind'], category: RecallItem['category'], objectiveId: string, chapter: ChapterNo, prompt: string,
  correctText: string, wrongTexts: string[], explanation: string, seed: number): RecallItem {
  const r = rng(hashSeed(seed, id));
  const opts = shuffle([{ id: 'c', text: correctText }, ...wrongTexts.map((t, i) => ({ id: 'w' + i, text: t }))], r);
  return { id, kind, category, objectiveId, chapter, prompt, options: opts, correct: 'c', explanation };
}

export function buildRecall(seed = 1): RecallItem[] {
  const out: RecallItem[] = [];
  const dummy = () => 0.5; void dummy;
  for (const c of CASES) {
    const r = rng(hashSeed(seed, c.id));
    const wrong = pick(c, CASES, 3, r, (a, b) => a.id === b.id, x => x.chapter === c.chapter);
    const expl = `${c.name}, ${c.cite}. Rule: ${c.rule}`;
    out.push(make(`R-CFACTS-${c.id}`, 'case-from-facts', 'case', c.id, c.chapter,
      `Which case matches these facts?\n\n"${maskFacts(c)}"`, c.name, wrong.map(w => w.name), expl, seed));
    out.push(make(`R-CRULE-${c.id}`, 'case-from-rule', 'case', c.id, c.chapter,
      `Which case established this rule?\n\n"${c.rule}"`, c.name, wrong.map(w => w.name), expl, seed));
    out.push(make(`R-RULEC-${c.id}`, 'rule-from-case', 'case', c.id, c.chapter,
      `What is the rule in ${c.name}?`, c.rule, wrong.map(w => w.rule), expl, seed));
  }
  for (const d of DEFINITIONS) {
    const r = rng(hashSeed(seed, d.id));
    const wrong = pick(d, DEFINITIONS, 3, r, (a, b) => a.id === b.id, x => x.chapter === d.chapter);
    out.push(make(`R-DTERM-${d.id}`, 'term-from-definition', 'definition', d.id, d.chapter,
      `Which term matches this definition?\n\n"${d.definition}"`, d.term, wrong.map(w => w.term), `${d.term}: ${d.definition}`, seed));
    out.push(make(`R-DDEF-${d.id}`, 'definition-from-term', 'definition', d.id, d.chapter,
      `What does "${d.term}" mean?`, d.definition, wrong.map(w => w.definition), `${d.term}: ${d.definition}`, seed));
  }
  for (const t of TOPICS) {
    const r = rng(hashSeed(seed, t.id));
    const wrong = pick(t, TOPICS, 3, r, (a, b) => a.id === b.id, x => x.chapter === t.chapter);
    out.push(make(`R-TOPIC-${t.id}`, 'topic-from-label', 'topic', t.id, t.chapter,
      `Chapter ${t.chapter} core topic: which statement goes with "${t.label}"?`, t.text, wrong.map(w => w.text), `${t.label}: ${t.text}`, seed));
  }
  return out;
}
export const recallFor = (items: RecallItem[], objectiveId: string) => items.filter(i => i.objectiveId === objectiveId);
