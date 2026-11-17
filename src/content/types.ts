export type ChapterNo = 6 | 7 | 8 | 10;

export interface CaseEntry {
  id: string;            // e.g. CASE-CHIMEL
  name: string;          // verbatim from guide
  cite: string;
  chapter: ChapterNo;
  list: string;          // Gold List / Green List / Legal Brief (from guide)
  facts: string;         // guide "Story"
  issue: string;
  rule: string;          // guide "Rule"
  takeaway: string;      // guide comparison-table row
  aliases: string[];     // party names masked in fact-recall questions
  commonConfusion: string; // STUDY AID (authored, not from guide)
  memoryAid: string;       // STUDY AID (authored, not from guide)
}
export interface DefinitionCard {
  id: string;            // e.g. DC6-1
  chapter: ChapterNo;
  n: number;
  term: string;
  definition: string;
}
export interface CoreTopic {
  id: string;            // e.g. TOP6-1
  chapter: ChapterNo;
  label: string;
  text: string;
}
export type ObjectiveKind = 'topic' | 'definition' | 'case' | 'doctrine';
export interface Objective {
  id: string;
  chapter: ChapterNo;
  kind: ObjectiveKind;
  name: string;
  source: string;          // verbatim guide wording this objective derives from
  caseIds: string[];
  difficulty: 1 | 2 | 3;
}

export type ScenarioType = 'choice' | 'multi' | 'order';
export interface Option {
  id: string;
  text: string;
  /** Shown when a player picks/omits this option wrongly: the specific misunderstanding it represents. */
  misconception?: string;
  /** Hotspot placement inside the scene illustration (x,y,w,h in 0..100 %). */
  rect?: [number, number, number, number];
}
export interface Scenario {
  id: string;
  objectiveId: string;
  caseIds: string[];
  variant: string;               // short label of what makes this variation different
  type: ScenarioType;
  scene?: 'room' | 'car' | 'house' | 'porch' | 'road' | 'doc';
  title: string;
  setup: string;
  facts: string[];
  prompt: string;
  options: Option[];
  correct: string[];             // option ids; for 'order' the required sequence
  explanation: string;           // concise
  detail: string;                // expanded explanation
  rule: string;                  // rule restated
  hints: [string, string, string];
  difficulty: 1 | 2 | 3;
  consequenceRight: string;
  consequenceWrong: string;
  flags: { right?: string; wrong?: string };   // narrative flags used by endings (later chapters)
  marker?: [number, number];                   // arrestee/officer figure position on the scene (%)
  interview?: { q: string; a: string }[];      // optional questions the player can ask first
  fictional: true;
}
export interface RecallItem {
  id: string;
  kind: 'case-from-facts' | 'case-from-rule' | 'rule-from-case' | 'term-from-definition' | 'definition-from-term' | 'topic-from-label';
  category: 'case' | 'definition' | 'topic';
  objectiveId: string;
  chapter: ChapterNo;
  prompt: string;
  options: { id: string; text: string }[];
  correct: string;
  explanation: string;
}
