// Headless simulation tests for grading, flow, coverage across branch paths, determinism and persistence.
import { SCENARIOS } from '../src/content/scenarios';
import { DOCTRINES, OBJECTIVES } from '../src/content/guide';
import { buildRecall } from '../src/learning/recall';
import { gradeRecall, gradeScenario } from '../src/learning/grade';
import { STEPS, scenariosForStep } from '../src/game/flow';
import { hashSeed, rng } from '../src/learning/rng';
import { compute, objectiveStatus, recommendations } from '../src/learning/mastery';
import type { AttemptRecord } from '../src/persistence/save';

let pass = 0, fail = 0;
const ok = (cond: boolean, msg: string) => { if (cond) pass++; else { fail++; console.log('FAIL: ' + msg); } };

// 1. Grading: correct answer passes, every single-option perturbation fails
for (const s of SCENARIOS) {
  ok(gradeScenario(s, s.correct).correct, `${s.id} correct answer grades correct`);
  if (s.type === 'choice') for (const o of s.options) if (o.id !== s.correct[0]) ok(!gradeScenario(s, [o.id]).correct, `${s.id}/${o.id} wrong pick grades wrong`);
  if (s.type === 'multi') {
    for (const c of s.correct) ok(!gradeScenario(s, s.correct.filter(x => x !== c)).correct, `${s.id} omitting ${c} grades wrong`);
    for (const o of s.options) if (!s.correct.includes(o.id)) ok(!gradeScenario(s, [...s.correct, o.id]).correct, `${s.id} adding ${o.id} grades wrong`);
  }
  if (s.type === 'order') ok(!gradeScenario(s, [...s.correct].reverse()).correct, `${s.id} reversed order grades wrong`);
}

// 2. Recall: every item solvable, answer positions balanced, no duplicate options
const recall = buildRecall(7);
const pos = [0, 0, 0, 0];
for (const r of recall) { ok(gradeRecall(r, r.correct), `${r.id} solvable`); pos[r.options.findIndex(o => o.id === r.correct)]++; }
const share = pos.map(p => p / recall.length);
ok(share.every(x => x > 0.12 && x < 0.40), `recall answer positions balanced: ${share.map(x => x.toFixed(2)).join(',')}`);
ok(recall.length === 104, `recall count ${recall.length} === 104`);
ok(buildRecall(7).every((r, i) => JSON.stringify(r) === JSON.stringify(recall[i])), 'recall is deterministic for a seed');

// 3. Campaign flow over many seeds and player types
const doctrineIds = DOCTRINES.map(d => d.id);
type Player = 'perfect' | 'wrong' | 'random';
let challengeReuse = 0;
for (const player of ['perfect', 'wrong', 'random'] as Player[]) {
  for (let seed = 1; seed <= 300; seed++) {
    const run = { seed, seenScenarios: [] as string[] }; const records: AttemptRecord[] = []; const r = rng(hashSeed(seed, player));
    const encountered = new Set<string>();
    for (const step of STEPS) {
      const missed = records.filter(x => !x.correct).map(x => x.objectiveId);
      const list = scenariosForStep(step, run, missed);
      if (step.objectives) ok(list.length === step.objectives.length, `seed ${seed} ${step.id}: scenario count`);
      if (step.challenge) ok(list.length === 2, `seed ${seed} ${player}: challenge has 2 scenarios (got ${list.length})`);
      for (const s of list) {
        if (run.seenScenarios.includes(s.id)) challengeReuse++;
        run.seenScenarios.push(s.id); encountered.add(s.objectiveId);
        const right = player === 'perfect' ? true : player === 'wrong' ? false : r() > 0.5;
        records.push({ itemId: s.id, objectiveId: s.objectiveId, chapter: 6, category: 'application', correct: right, hintsUsed: 0, ts: 0, mode: 'full', runId: 'x' });
      }
    }
    for (const d of doctrineIds) ok(encountered.has(d), `seed ${seed} ${player}: doctrine ${d} encountered`);
    ok(new Set(run.seenScenarios).size === run.seenScenarios.length, `seed ${seed} ${player}: no scenario served twice`);
  }
}
ok(challengeReuse === 0, `no scenario served twice in any run (reuse=${challengeReuse})`);

// 4. Determinism and variety across seeds
const sig = (seed: number) => { const run = { seed, seenScenarios: [] as string[] }; for (const st of STEPS) for (const s of scenariosForStep(st, run, [])) run.seenScenarios.push(s.id); return run.seenScenarios.join(','); };
ok(sig(42) === sig(42), 'same seed → same campaign');
ok(new Set(Array.from({ length: 40 }, (_, i) => sig(i + 1))).size > 10, 'different seeds produce different campaigns');

// 5. Mastery honesty: finishing is not mastery; assisted correct is not mastered
const rec = (o: string, correct: boolean, hints: number): AttemptRecord => ({ itemId: o, objectiveId: o, chapter: 6, category: 'application', correct, hintsUsed: hints, ts: 0, mode: 'x', runId: 'x' });
ok(objectiveStatus([rec('A', true, 1)], 'A') === 'assisted', 'assisted correct is not mastery');
ok(objectiveStatus([rec('A', true, 0)], 'A') === 'mastered', 'unassisted correct is mastery');
ok(objectiveStatus([rec('A', true, 0), rec('A', false, 0)], 'A') === 'missed', 'a later miss overrides');
ok(objectiveStatus([], 'A') === 'unseen', 'unseen objective');
ok(compute([rec('A', true, 0), rec('B', false, 2)]).firstAttemptAccuracy === 50, 'accuracy math');
ok(recommendations([rec('CH6-GANT', false, 0)])[0].includes('Gant'), 'recommendation mentions the missed doctrine and case');
ok(OBJECTIVES.length === 3 * 0 + 10 + 20 + 18 + DOCTRINES.length, 'objective count');

// 6. Persistence round trip (localStorage shim)
const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; } };
const { loadProfile, saveProfile, resetProfile } = await import('../src/persistence/save');
const p = loadProfile(); p.records.push(rec('CH6-GANT', false, 1)); p.settings.textScale = 1.25; saveProfile(p);
const p2 = loadProfile(); ok(p2.records.length === 1 && p2.settings.textScale === 1.25, 'profile round trip keeps records + settings');
store['casefile.profile.v1'] = '{corrupt'; ok(loadProfile().records.length === 0, 'corrupt save falls back to a fresh profile');
ok(resetProfile().records.length === 0, 'reset clears');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
