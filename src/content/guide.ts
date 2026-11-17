import raw from './generated/guide.json';
import { CASE_EXTRAS } from './extras';
import type { CaseEntry, ChapterNo, CoreTopic, DefinitionCard, Objective } from './types';

const slug = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, '').replace(/^(.*?)V(?=[A-Z])/, '$1');
const CASE_SLUGS: Record<string, string> = {
  'Chimel v. California': 'CHIMEL', 'Arizona v. Gant': 'GANT', 'Whren v. United States': 'WHREN',
  'Illinois v. Rodriguez': 'RODRIGUEZ', 'Wyoming v. Houghton': 'HOUGHTON', 'State v. Green': 'GREEN',
  'South Dakota v. Opperman': 'OPPERMAN', 'Samson v. California': 'SAMSON', 'State v. Ellis': 'ELLIS',
  'Maryland v. King': 'KING', 'Miranda v. Arizona': 'MIRANDA', 'Berkemer v. McCarty': 'BERKEMER',
  'Berghuis v. Thompkins': 'THOMPKINS', 'Colorado v. Connelly': 'CONNELLY', 'State v. S.V.': 'SV',
  'Mapp v. Ohio': 'MAPP', 'Hudson v. Michigan': 'HUDSON', 'Herring v. United States': 'HERRING'
};
void slug;

export const CHAPTERS: { n: ChapterNo; title: string }[] = (raw.chapters as { n: number; title: string }[]).map(c => ({ n: c.n as ChapterNo, title: c.title }));

export const CASES: CaseEntry[] = (raw.cases as any[]).map((c, i) => {
  const x = CASE_EXTRAS[c.name];
  return {
    id: 'CASE-' + CASE_SLUGS[c.name], name: c.name, cite: c.cite, chapter: c.chapter as ChapterNo, list: c.list,
    facts: c.story, issue: c.issue, rule: c.rule, takeaway: (raw.table as any[])[i].takeaway,
    aliases: x?.aliases ?? [], commonConfusion: x?.commonConfusion ?? '', memoryAid: x?.memoryAid ?? ''
  };
});
export const DEFINITIONS: DefinitionCard[] = (raw.dcs as any[]).map(d => ({
  id: `DC${d.chapter}-${d.n}`, chapter: d.chapter as ChapterNo, n: d.n, term: d.term, definition: d.definition
}));
export const TOPICS: CoreTopic[] = (raw.topics as any[]).map(t => ({
  id: `TOP${t.chapter}-${t.idx}`, chapter: t.chapter as ChapterNo, label: t.label, text: t.text
}));

/** Doctrine-level objectives used by scenarios (Chapter 6 gameplay). IDs are stable. Source = verbatim guide wording. */
export const DOCTRINES: Objective[] = [
  { id: 'CH6-3STEP', chapter: 6, kind: 'doctrine', name: '3-step search analysis', source: '3-Step Search Analysis: (1) Was it a government search? (2) Was it reasonable? (3) If unreasonable, should the evidence be excluded?', caseIds: [], difficulty: 1 },
  { id: 'CH6-WARRANT-REQ', chapter: 6, kind: 'doctrine', name: 'Warrant requirements (particularity, probable cause affidavit)', source: 'Warrant Requirements: Requires particularity (specific place and items), a probable cause affidavit', caseIds: [], difficulty: 1 },
  { id: 'CH6-WARRANT-SCOPE', chapter: 6, kind: 'doctrine', name: 'Particularity: place and items limit the search', source: 'Requires particularity (specific place and items)', caseIds: [], difficulty: 2 },
  { id: 'CH6-KNOCK', chapter: 6, kind: 'doctrine', name: 'Knock-and-announce and its exceptions', source: 'following the knock-and-announce rule (unless an exception applies: preventing violence, destruction of evidence, or escape)', caseIds: [], difficulty: 2 },
  { id: 'CH6-EXCEPTIONS', chapter: 6, kind: 'doctrine', name: 'Five warrant exceptions', source: 'Five Warrant Exceptions: Searches incident to arrest, consent searches, vehicle searches, container searches, and emergency (exigent circumstances) searches.', caseIds: [], difficulty: 1 },
  { id: 'CH6-GRAB', chapter: 6, kind: 'doctrine', name: 'Search incident to arrest: person and grabbable area', source: 'searches incident to arrest are limited to the arrestee\'s person and their "grabbable area"', caseIds: ['CASE-CHIMEL'], difficulty: 2 },
  { id: 'CH6-ROBINSON', chapter: 6, kind: 'doctrine', name: 'Robinson bright-line rule (custodial arrest vs citation)', source: 'Police may automatically conduct a full search of anyone they lawfully take into custodial arrest (does not apply to citations).', caseIds: [], difficulty: 2 },
  { id: 'CH6-GANT', chapter: 6, kind: 'doctrine', name: 'Vehicle search incident to arrest (Gant)', source: 'Only if the arrestee is unsecured and within reaching distance of the cabin, OR it is reasonable to believe evidence of the crime of arrest is inside.', caseIds: ['CASE-GANT'], difficulty: 3 },
  { id: 'CH6-VEHICLE', chapter: 6, kind: 'doctrine', name: 'Vehicle exception: probable cause + mobile vehicle', source: 'probable cause and a readily mobile vehicle are enough for a warrantless search.', caseIds: ['CASE-GREEN'], difficulty: 2 },
  { id: 'CH6-CONTAINER', chapter: 6, kind: 'doctrine', name: 'Container searches: passengers\' containers', source: 'officers with probable cause to search a car may search passengers\' containers capable of holding the target evidence.', caseIds: ['CASE-HOUGHTON'], difficulty: 2 },
  { id: 'CH6-CONSENT', chapter: 6, kind: 'doctrine', name: 'Consent: actual/apparent authority; withdrawal', source: 'Warrantless searches permitted voluntarily by someone with actual or apparent authority (consent can be withdrawn anytime).', caseIds: ['CASE-RODRIGUEZ'], difficulty: 3 },
  { id: 'CH6-PRETEXT', chapter: 6, kind: 'doctrine', name: 'Pretext stops need objective probable cause', source: 'pretext stops are valid so long as objective probable cause exists for the traffic violation.', caseIds: ['CASE-WHREN'], difficulty: 2 },
  { id: 'CH6-EXIGENT', chapter: 6, kind: 'doctrine', name: 'Emergency (exigent circumstances) searches', source: 'emergency (exigent circumstances) searches', caseIds: [], difficulty: 1 }
];

export const OBJECTIVES: Objective[] = [
  ...TOPICS.map<Objective>(t => ({ id: t.id, chapter: t.chapter, kind: 'topic', name: t.label, source: `${t.label}: ${t.text}`, caseIds: [], difficulty: 1 })),
  ...DEFINITIONS.map<Objective>(d => ({ id: d.id, chapter: d.chapter, kind: 'definition', name: d.term, source: `${d.term}: ${d.definition}`, caseIds: [], difficulty: 1 })),
  ...CASES.map<Objective>(c => ({ id: c.id, chapter: c.chapter, kind: 'case', name: c.name, source: `${c.name}, ${c.cite} [${c.list}] Story: ${c.facts} Issue: ${c.issue} Rule: ${c.rule}`, caseIds: [c.id], difficulty: 2 })),
  ...DOCTRINES
];
export const caseById = (id: string) => CASES.find(c => c.id === id)!;
export const objectiveById = (id: string) => OBJECTIVES.find(o => o.id === id);

/** Which gameplay objective teaches each definition card / core topic (used for coverage reporting). */
export const OBJECTIVE_LINKS: Record<string, string> = {
  'DC6-1': 'CH6-GRAB', 'DC6-2': 'CH6-ROBINSON', 'DC6-3': 'CH6-PRETEXT', 'DC6-4': 'CH6-CONSENT', 'DC6-5': 'CH6-VEHICLE',
  'TOP6-1': 'CH6-3STEP', 'TOP6-2': 'CH6-WARRANT-REQ', 'TOP6-3': 'CH6-EXCEPTIONS'
};
