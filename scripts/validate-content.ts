// Content coverage validator (Spec §12.3). Exits non-zero on any ERROR. Writes COVERAGE_REPORT.md.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CASES, CHAPTERS, DEFINITIONS, DOCTRINES, OBJECTIVES, OBJECTIVE_LINKS, TOPICS } from '../src/content/guide';
import { SCENARIOS } from '../src/content/scenarios';
import { DIALOGUE } from '../src/content/dialogue';
import { buildRecall } from '../src/learning/recall';
import { STEPS } from '../src/game/flow';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const norm = (s: string) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
const guide = norm(readFileSync(join(root, 'src/content/source/study-guide.txt'), 'utf8'));
const errors: string[] = [], warnings: string[] = [];
const err = (m: string) => errors.push(m), warn = (m: string) => warnings.push(m);

// Counts
if (CHAPTERS.map(c => c.n).join() !== '6,7,8,10') err(`Chapters expected 6,7,8,10 but found ${CHAPTERS.map(c => c.n).join()}`);
if (CASES.length !== 18) err(`Expected 18 cases, found ${CASES.length}`);
if (DEFINITIONS.length !== 20) err(`Expected 20 definition cards, found ${DEFINITIONS.length}`);
for (const ch of CHAPTERS) {
  if (CASES.filter(c => c.chapter === ch.n).length === 0) err(`Chapter ${ch.n} has no cases`);
  if (DEFINITIONS.filter(d => d.chapter === ch.n).length !== 5) err(`Chapter ${ch.n} should have 5 definition cards`);
}

// Duplicate IDs
const seen = new Set<string>();
for (const id of [...OBJECTIVES.map(o => o.id), ...SCENARIOS.map(s => s.id)]) { if (seen.has(id)) err(`Duplicate ID: ${id}`); seen.add(id); }
const recall = buildRecall(1);
const rseen = new Set<string>();
for (const r of recall) { if (rseen.has(r.id)) err(`Duplicate recall ID: ${r.id}`); rseen.add(r.id); }

// Source mapping: every authored-from-guide string must literally appear in the guide.
const inGuide = (label: string, text: string) => { if (!guide.includes(norm(text))) err(`Broken source mapping (${label}): "${text.slice(0, 70)}..." not found in study guide`); };
for (const c of CASES) { inGuide(c.id + ' facts', c.facts); inGuide(c.id + ' issue', c.issue); inGuide(c.id + ' rule', c.rule); inGuide(c.id + ' takeaway', c.takeaway); inGuide(c.id + ' name', c.name); inGuide(c.id + ' cite', c.cite);
  if (!c.commonConfusion || !c.memoryAid) err(`${c.id} missing encyclopedia study aids`); if (!c.issue || !c.rule || !c.facts) err(`${c.id} missing facts/issue/rule`); }
for (const d of DEFINITIONS) { inGuide(d.id + ' term', d.term); inGuide(d.id + ' definition', d.definition); }
for (const t of TOPICS) { inGuide(t.id + ' label', t.label); inGuide(t.id + ' text', t.text); }
for (const d of DOCTRINES) inGuide(d.id + ' source', d.source);

// Scenario integrity
const objIds = new Set(OBJECTIVES.map(o => o.id)), caseIds = new Set(CASES.map(c => c.id));
let longest = 0, singles = 0;
for (const s of SCENARIOS) {
  if (!objIds.has(s.objectiveId)) err(`${s.id}: unknown objective ${s.objectiveId}`);
  for (const c of s.caseIds) if (!caseIds.has(c)) err(`${s.id}: unknown case ${c}`);
  const ids = s.options.map(o => o.id);
  if (new Set(ids).size !== ids.length) err(`${s.id}: duplicate option ids`);
  if (s.correct.length === 0) err(`${s.id}: no correct answer`);
  for (const c of s.correct) if (!ids.includes(c)) err(`${s.id}: invalid answer reference "${c}"`);
  if (s.type === 'choice' && s.correct.length !== 1) err(`${s.id}: choice must have exactly one correct answer`);
  if (s.type === 'order' && [...s.correct].sort().join() !== [...ids].sort().join()) err(`${s.id}: order answer must be a permutation of the options`);
  if (s.type === 'multi' && s.correct.length === ids.length) err(`${s.id}: multi has every option correct`);
  if (!s.explanation || !s.detail || !s.rule) err(`${s.id}: missing explanation/detail/rule`);
  if (s.hints.some(h => !h || h.length < 8)) err(`${s.id}: hints incomplete`);
  if (!s.consequenceRight || !s.consequenceWrong) err(`${s.id}: missing consequences`);
  if (s.scene && s.type === 'multi' && s.options.some(o => !o.rect)) err(`${s.id}: scene multi-select options need hotspot rects`);
  if (s.type !== 'order') for (const o of s.options) if (!s.correct.includes(o.id) && !o.misconception) warn(`${s.id}/${o.id}: wrong option lacks a misconception note`);
  if (s.type === 'choice') { singles++; const L = Math.max(...s.options.map(o => o.text.length)); if (s.options.find(o => o.id === s.correct[0])!.text.length === L) longest++; }
  if (s.setup.length > 360) warn(`${s.id}: long setup (${s.setup.length} chars)`);
}
if (singles && longest / singles > 0.6) warn(`Answer-length bias: the correct choice is the longest option in ${Math.round(100 * longest / singles)}% of single-choice scenarios`);
for (const o of DOCTRINES) if (SCENARIOS.filter(s => s.objectiveId === o.id).length < 2) warn(`${o.id}: fewer than 2 scenario variants (replay/adaptive review limited)`);

// Recall integrity: the correct option exists, masks hold, no duplicate option texts
for (const r of recall) {
  if (!r.options.some(o => o.id === r.correct)) err(`${r.id}: invalid correct reference`);
  if (new Set(r.options.map(o => o.text)).size !== r.options.length) err(`${r.id}: duplicate option text`);
  if (!objIds.has(r.objectiveId)) err(`${r.id}: unknown objective`);
  if (r.kind === 'case-from-facts') { const c = CASES.find(x => x.id === r.objectiveId)!; for (const a of c.aliases) if (r.prompt.includes(a)) err(`${r.id}: party name "${a}" leaks into the prompt`); }
}

// Dialogue and flow
for (const st of STEPS) {
  if (st.dialogue && !DIALOGUE[st.dialogue]) err(`Step ${st.id}: unknown dialogue ${st.dialogue}`);
  for (const o of st.objectives ?? []) if (!SCENARIOS.some(s => s.objectiveId === o)) err(`Step ${st.id}: no scenario for ${o}`);
  for (const f of st.fixedScenarios ?? []) if (!SCENARIOS.some(s => s.id === f)) err(`Step ${st.id}: unknown fixed scenario ${f}`);
}
const scheduled = new Set(STEPS.flatMap(s => s.objectives ?? []).concat(STEPS.flatMap(s => (s.fixedScenarios ?? []).map(f => SCENARIOS.find(x => x.id === f)!.objectiveId))));
for (const d of DOCTRINES) if (!scheduled.has(d.id)) err(`Doctrine ${d.id} is never scheduled in the Chapter 6 campaign`);

// Coverage report
const rows: string[] = ['| Objective | Chapter | Kind | Scenario variants | Recall items | Encyclopedia | Status |', '|---|---|---|---|---|---|---|'];
let gameplayed = 0;
for (const o of OBJECTIVES) {
  const sc = SCENARIOS.filter(s => s.objectiveId === o.id || s.objectiveId === OBJECTIVE_LINKS[o.id] || (o.kind === 'case' && s.caseIds.includes(o.id))).length;
  const rc = recall.filter(r => r.objectiveId === o.id).length;
  const enc = o.kind === 'case' ? 'yes' : '-';
  if (rc === 0 && o.kind !== 'doctrine') err(`${o.id}: no recall opportunity`);
  const status = sc ? 'gameplay + recall' : (rc ? 'recall only (gameplay mission not built yet)' : o.kind === 'doctrine' ? 'gameplay' : 'MISSING');
  if (sc) gameplayed++;
  rows.push(`| ${o.id} | ${o.chapter} | ${o.kind} | ${sc} | ${rc} | ${enc} | ${status} |`);
}
const byChapter = [6, 7, 8, 10].map(n => { const os = OBJECTIVES.filter(o => o.chapter === n); const g = os.filter(o => SCENARIOS.some(s => s.objectiveId === o.id || s.objectiveId === OBJECTIVE_LINKS[o.id] || s.caseIds.includes(o.id))).length; return `Chapter ${n}: ${g}/${os.length} objectives have gameplay scenarios; ${os.length}/${os.length} have recall/encyclopedia`; });
// Animated sequence mappings must stay consistent with the graded scenarios.
import { VEHICLE_SEQS } from '../src/content/sequences';
for (const q of VEHICLE_SEQS) {
  const s = SCENARIOS.find(x => x.id === q.scenarioId); if (!s) { err(`sequence ${q.scenarioId}: scenario missing`); continue; }
  if (s.type !== 'choice') err(`sequence ${q.scenarioId}: only 'choice' scenarios supported`);
  for (const o of s.options) if (!q.acts[o.id]) err(`sequence ${q.scenarioId}: option ${o.id} has no officer action`);
  if (q.hotspots.length !== new Set(q.hotspots.map(h => h.fact)).size) err(`sequence ${q.scenarioId}: duplicate fact hotspot`);
  for (const hs of q.hotspots) if (!s.facts[hs.fact]) err(`sequence ${q.scenarioId}: hotspot ${hs.id} points to missing fact ${hs.fact}`);
  for (let i = 0; i < s.facts.length; i++) if (!q.hotspots.some(hs => hs.fact === i)) err(`sequence ${q.scenarioId}: fact ${i} is not reachable through any hotspot`);
  if (!q.finding) err(`sequence ${q.scenarioId}: no finding sprite`);
}
for (const n of [7, 8, 10]) warn(`Chapter ${n}: gameplay mission not built yet (recall + encyclopedia only)`);
const report = `# Content Coverage Report\n\nGenerated by \`npm run validate\`.\n\n- Cases: ${CASES.length}/18\n- Definition cards: ${DEFINITIONS.length}/20\n- Core topics: ${TOPICS.length}\n- Scenario variants: ${SCENARIOS.length}\n- Recall items: ${recall.length}\n- ${byChapter.join('\n- ')}\n\n## Errors\n${errors.length ? errors.map(e => '- ' + e).join('\n') : 'None'}\n\n## Warnings\n${warnings.length ? warnings.map(e => '- ' + e).join('\n') : 'None'}\n\n## Matrix\n${rows.join('\n')}\n`;
writeFileSync(join(root, 'COVERAGE_REPORT.md'), report);
console.log(`cases=${CASES.length} definitions=${DEFINITIONS.length} topics=${TOPICS.length} scenarios=${SCENARIOS.length} recall=${recall.length}`);
console.log(byChapter.join('\n'));
warnings.forEach(w => console.log('WARN  ' + w));
errors.forEach(e => console.log('ERROR ' + e));
console.log(errors.length ? `\nFAILED: ${errors.length} error(s)` : '\nVALIDATION PASSED');
process.exit(errors.length ? 1 : 0);
