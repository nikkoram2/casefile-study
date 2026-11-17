import type { RecallItem, Scenario } from '../content/types';

export interface Grade { correct: boolean; missing: string[]; extra: string[]; }
export function gradeScenario(s: Scenario, selection: string[]): Grade {
  if (s.type === 'order') {
    const ok = selection.length === s.correct.length && selection.every((x, i) => x === s.correct[i]);
    return { correct: ok, missing: ok ? [] : s.correct.filter((x, i) => selection[i] !== x), extra: [] };
  }
  const sel = new Set(selection), cor = new Set(s.correct);
  const missing = s.correct.filter(x => !sel.has(x)), extra = selection.filter(x => !cor.has(x));
  return { correct: !missing.length && !extra.length, missing, extra };
}
export const gradeRecall = (r: RecallItem, pick: string) => pick === r.correct;
