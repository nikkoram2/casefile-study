import type { AttemptRecord, Profile } from '../persistence/save';
import { OBJECTIVES, objectiveById, CASES } from '../content/guide';

export interface Stats {
  total: number; firstAttemptAccuracy: number | null;
  assisted: { n: number; correct: number }; unassisted: { n: number; correct: number };
  byCategory: Record<string, { n: number; correct: number }>; byChapter: Record<number, { n: number; correct: number }>;
}
const pct = (c: number, n: number) => (n ? Math.round((100 * c) / n) : null);
export const pctOf = pct;

export function compute(records: AttemptRecord[]): Stats {
  const s: Stats = { total: records.length, firstAttemptAccuracy: null, assisted: { n: 0, correct: 0 }, unassisted: { n: 0, correct: 0 }, byCategory: {}, byChapter: {} };
  let correct = 0;
  for (const r of records) {
    if (r.correct) correct++;
    const bucket = r.hintsUsed > 0 ? s.assisted : s.unassisted; bucket.n++; if (r.correct) bucket.correct++;
    (s.byCategory[r.category] ??= { n: 0, correct: 0 }).n++; if (r.correct) s.byCategory[r.category].correct++;
    (s.byChapter[r.chapter] ??= { n: 0, correct: 0 }).n++; if (r.correct) s.byChapter[r.chapter].correct++;
  }
  s.firstAttemptAccuracy = pct(correct, records.length);
  return s;
}
/** An objective counts as "mastered" only after an UNASSISTED correct attempt that was not later contradicted by a miss. */
export function objectiveStatus(records: AttemptRecord[], id: string): 'unseen' | 'missed' | 'assisted' | 'mastered' {
  const rs = records.filter(r => r.objectiveId === id);
  if (!rs.length) return 'unseen';
  const last = rs[rs.length - 1];
  if (!last.correct) return 'missed';
  return rs.some(r => r.correct && r.hintsUsed === 0) && last.hintsUsed === 0 ? 'mastered' : 'assisted';
}
export function missedObjectives(records: AttemptRecord[]): { id: string; misses: number }[] {
  const m = new Map<string, number>();
  for (const r of records) if (!r.correct) m.set(r.objectiveId, (m.get(r.objectiveId) ?? 0) + 1);
  return [...m.entries()].map(([id, misses]) => ({ id, misses })).sort((a, b) => b.misses - a.misses);
}
export function recommendations(records: AttemptRecord[]): string[] {
  const out: string[] = [];
  for (const { id, misses } of missedObjectives(records).slice(0, 6)) {
    const o = objectiveById(id); if (!o) continue;
    const tail = misses > 1 ? ` (missed ${misses} times)` : '';
    if (o.kind === 'case') out.push(`Review ${o.name}: ${CASES.find(c => c.id === id)?.takeaway ?? ''}${tail}`);
    else if (o.kind === 'definition') out.push(`Re-learn the definition card "${o.name}"${tail}`);
    else if (o.kind === 'doctrine') out.push(`Practice ${o.name}${o.caseIds.length ? ' (' + o.caseIds.map(c => CASES.find(x => x.id === c)!.name).join(', ') + ')' : ''}${tail}`);
    else out.push(`Review the core topic "${o.name}"${tail}`);
  }
  return out;
}
export function coverage(encountered: string[]): { seen: number; total: number; missing: string[] } {
  const set = new Set(encountered);
  const chapters6 = OBJECTIVES.filter(o => o.chapter === 6);
  return { seen: chapters6.filter(o => set.has(o.id)).length, total: chapters6.length, missing: chapters6.filter(o => !set.has(o.id)).map(o => o.id) };
}
export const weakIds = (p: Profile) => missedObjectives(p.records).map(m => m.id);
