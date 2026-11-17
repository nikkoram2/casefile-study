// UI-free campaign flow. Everything the validator/simulator needs lives here.
import { SCENARIOS, scenarioById } from '../content/scenarios';
import type { Scenario } from '../content/types';
import { pickChallenge, pickVariant } from '../learning/scheduler';
import type { Run } from '../persistence/save';

export interface Step {
  id: string; map: 'precinct' | 'alder'; target: string; objective: string; minutes: number;
  chapter: string; dialogue?: string; objectives?: string[]; fixedScenarios?: string[]; challenge?: boolean; transition?: 'alder' | 'precinct'; end?: boolean; recallChapter?: 6 | 7 | 8 | 10; chapterEnd?: 6 | 7 | 8 | 10; hearing?: boolean;
}
export const STEPS: Step[] = [
  { id: 'pro-ward', map: 'precinct', target: 'ward', objective: 'Talk to Detective Ward', minutes: 1, chapter: 'Prologue', dialogue: 'pro_intro' },
  { id: 'pro-board', map: 'precinct', target: 'board', objective: 'Examine the case board', minutes: 2, chapter: 'Prologue', dialogue: 'pro_board', fixedScenarios: ['S6-3STEP-1'] },
  { id: 'pro-door', map: 'precinct', target: 'door', objective: 'Head out to Alder Lane', minutes: 0.5, chapter: 'Prologue', transition: 'alder' },
  { id: 'a-van', map: 'alder', target: 'van', objective: 'Review the warrant at the command van', minutes: 3, chapter: 'Chapter 6 · A: Warrant', dialogue: 'a_van', objectives: ['CH6-WARRANT-REQ', 'CH6-WARRANT-SCOPE'] },
  { id: 'a-door', map: 'alder', target: 'houseDoor', objective: 'Brief the entry team at 142 Alder Lane', minutes: 1.5, chapter: 'Chapter 6 · A: Warrant', dialogue: 'a_door', objectives: ['CH6-KNOCK'] },
  { id: 'b-arrest', map: 'alder', target: 'vance', objective: 'Handle the arrest of Vance', minutes: 3, chapter: 'Chapter 6 · B: Arrest', dialogue: 'b_arrest', objectives: ['CH6-GRAB', 'CH6-ROBINSON', 'CH6-EXCEPTIONS'] },
  { id: 'c-cars', map: 'alder', target: 'cars', objective: 'Examine the vehicles on the street', minutes: 3, chapter: 'Chapter 6 · C: Vehicles', dialogue: 'c_cars', objectives: ['CH6-GANT', 'CH6-VEHICLE', 'CH6-CONTAINER'] },
  { id: 'd-consent', map: 'alder', target: 'marla', objective: 'Talk to the woman at Apartment 4C', minutes: 2, chapter: 'Chapter 6 · D: Consent', dialogue: 'd_consent', objectives: ['CH6-CONSENT'] },
  { id: 'e-stop', map: 'alder', target: 'stop', objective: 'Review Brooks\'s traffic stop', minutes: 2, chapter: 'Chapter 6 · E: Traffic stop', dialogue: 'e_stop', objectives: ['CH6-PRETEXT', 'CH6-EXIGENT'] },
  { id: 'f-challenge', map: 'alder', target: 'van', objective: 'Chapter challenge at the command van', minutes: 4, chapter: 'Chapter 6 · Challenge', dialogue: 'f_challenge', challenge: true, recallChapter: 6 },
  { id: 'g-wrap', map: 'alder', target: 'van', objective: 'Report to Ward at the van', minutes: 1, chapter: 'Chapter 6 · Wrap-up', dialogue: 'g_wrap', chapterEnd: 6 },
  { id: 'h-lot', map: 'precinct', target: 'ward', objective: 'Brief Ward on the impound-lot lead', minutes: 3, chapter: 'Chapter 7 · A: Inventory and special needs', dialogue: 'h_lot', objectives: ['CH7-INVENTORY', 'CH7-SPECIAL'], transition: 'precinct' },
  { id: 'h-board', map: 'precinct', target: 'board', objective: 'Review the case board: borders, schools and status searches', minutes: 4, chapter: 'Chapter 7 · B: Contexts', dialogue: 'h_board', objectives: ['CH7-BORDER', 'CH7-SCHOOL', 'CH7-STATUS'], recallChapter: 7, chapterEnd: 7 },
  { id: 'i-stop', map: 'alder', target: 'stop', objective: 'Review Brooks\'s roadside questions', minutes: 3, chapter: 'Chapter 8 · A: Custody and waiver', dialogue: 'i_stop', objectives: ['CH8-CUSTODY', 'CH8-WAIVER'], transition: 'alder' },
  { id: 'i-vance', map: 'alder', target: 'vance', objective: 'Question Vance: interrogation and voluntariness', minutes: 3, chapter: 'Chapter 8 · B: Interrogation', dialogue: 'i_vance', objectives: ['CH8-INNIS', 'CH8-VOLUNTARY'] },
  { id: 'i-marla', map: 'alder', target: 'marla', objective: 'Talk to Marla\'s son, a juvenile witness', minutes: 3, chapter: 'Chapter 8 · C: Juveniles and evidence', dialogue: 'i_marla', objectives: ['CH8-JUVENILE', 'CH8-TESTIMONIAL'], recallChapter: 8, chapterEnd: 8 },
  { id: 'j-prep', map: 'precinct', target: 'board', objective: 'Prepare the suppression hearing at the case board', minutes: 3, chapter: 'Chapter 10 · A: Why exclude?', dialogue: 'j_prep', objectives: ['CH10-FRUIT', 'CH10-JUSTIFY'], transition: 'precinct' },
  { id: 'j-ward', map: 'precinct', target: 'ward', objective: 'Run exceptions and remedies with Ward', minutes: 4, chapter: 'Chapter 10 · B: Exceptions', dialogue: 'j_ward', objectives: ['CH10-EXCEPTIONS', 'CH10-HUDSON'] },
  { id: 'j-board', map: 'precinct', target: 'board', objective: 'Final prep: good faith and the states', minutes: 3, chapter: 'Chapter 10 · C: Good faith', dialogue: 'j_board', objectives: ['CH10-GOODFAITH', 'CH10-MAPP'], recallChapter: 10, chapterEnd: 10 },
  { id: 'k-hearing', map: 'precinct', target: 'door', objective: 'The suppression hearing: head to court', minutes: 8, chapter: 'Final Hearing', dialogue: 'k_hearing', hearing: true, end: true }
];
export const stepIndex = (id: string) => STEPS.findIndex(s => s.id === id);
export const remainingMinutes = (idx: number) => Math.round(STEPS.slice(idx).reduce((a, s) => a + s.minutes, 0));
export const chapterProgress = (idx: number) => Math.round((100 * idx) / (STEPS.length - 1));

/** Scenarios shown at a step. The challenge step adapts to recorded mistakes; every other step is seeded variant selection. */
export function scenariosForStep(step: Step, run: Pick<Run, 'seed' | 'seenScenarios'>, missed: string[]): Scenario[] {
  if (step.fixedScenarios) return step.fixedScenarios.map(scenarioById);
  if (step.challenge) return pickChallenge(missed, run.seenScenarios, run.seed, 2);
  const out: Scenario[] = []; const seen = [...run.seenScenarios];
  for (const obj of step.objectives ?? []) { const s = pickVariant(obj, seen, run.seed); if (s) { out.push(s); seen.push(s.id); } }
  return out;
}
export const ALL_SCENARIO_COUNT = SCENARIOS.length;
