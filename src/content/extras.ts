// STUDY AIDS: authored for this game. They are NOT from the study guide and are labelled as such in the UI.
export interface CaseExtra { aliases: string[]; commonConfusion: string; memoryAid: string; }
export const CASE_EXTRAS: Record<string, CaseExtra> = {
  'Chimel v. California': {
    aliases: ['Chimel'],
    commonConfusion: 'Arrest does not open the whole house. Only the person and the grabbable area, not rooms the arrestee cannot reach.',
    memoryAid: 'Chimel: the arrestee\'s reach, not the whole house.'
  },
  'Arizona v. Gant': {
    aliases: ['Gant'],
    commonConfusion: 'Gant is not a ban on car searches. It limits only the search-incident-to-arrest route. The vehicle exception (probable cause) is a separate justification.',
    memoryAid: 'Gant: two doors in: Grab it, or Gather evidence of the arrest crime.'
  },
  'Whren v. United States': {
    aliases: ['Whren'],
    commonConfusion: 'Officer motive does not matter if objective probable cause for a traffic violation exists. A hunch with no violation is a different situation.',
    memoryAid: 'Whren: the violation counts, the officer\'s motive doesn\'t.'
  },
  'Illinois v. Rodriguez': {
    aliases: ['Rodriguez'],
    commonConfusion: 'Apparent authority is judged by what a reasonable officer would believe, not by what is later found to be true. It does not rescue a belief that was unreasonable.',
    memoryAid: 'Rodriguez: judge the officer\'s belief by what was reasonable then.'
  },
  'Wyoming v. Houghton': {
    aliases: ['Houghton'],
    commonConfusion: 'Passengers\' belongings are searchable only if capable of holding the target evidence. Probable cause is for the car, and the scope follows the evidence sought.',
    memoryAid: 'Houghton: if a container can hold the target, it can be searched.'
  },
  'State v. Green': {
    aliases: ['Green'],
    commonConfusion: 'The owner\'s arrest does not require an extra emergency before searching a parked car. Probable cause plus a readily mobile vehicle is enough under the guide\'s rule.',
    memoryAid: 'Green light: probable cause + mobile car, no extra emergency needed.'
  },
  'South Dakota v. Opperman': {
    aliases: ['Opperman'],
    commonConfusion: 'Inventory searches are about cataloging, not investigating, so they must follow standard routine procedures rather than act as a pretext.',
    memoryAid: 'Opperman: follow the Policy manual, or it\'s not an inventory.'
  },
  'Samson v. California': {
    aliases: ['Samson'],
    commonConfusion: 'Parole status itself reduces privacy expectations. Suspicion of a new crime is not needed, unlike an ordinary citizen.',
    memoryAid: 'Samson: parolees have shrunken privacy, so no suspicion needed.'
  },
  'State v. Ellis': {
    aliases: ['Ellis'],
    commonConfusion: 'The RAs\' discovery does not give police a free pass. A dorm room has full home protection, so police still need a warrant or an exception.',
    memoryAid: 'Ellis: a dorm room is a home.'
  },
  'Maryland v. King': {
    aliases: ['King'],
    commonConfusion: 'This is about booking identification after a serious arrest, like fingerprinting. It is not a general power to swab anyone.',
    memoryAid: 'King: booking swab = fingerprint for the DNA age (serious arrests).'
  },
  'Miranda v. Arizona': {
    aliases: ['Miranda', 'Ernesto Miranda'],
    commonConfusion: 'Miranda needs both custody AND interrogation. Warnings alone are not enough, since a valid waiver is also required.',
    memoryAid: 'Miranda = custody + interrogation, then 4 warnings + waiver.'
  },
  'Berkemer v. McCarty': {
    aliases: ['Berkemer', 'McCarty'],
    commonConfusion: 'Roadside questioning at an ordinary traffic stop is not "custody" yet. Custody begins at formal arrest (or its functional equivalent).',
    memoryAid: 'Berkemer: brief public roadside stop is not custody.'
  },
  'Berghuis v. Thompkins': {
    aliases: ['Thompkins'],
    commonConfusion: 'Silence is not invocation. A suspect must unambiguously invoke, and speaking after understanding the rights can be an implied waiver.',
    memoryAid: 'Thompkins: speaking can waive, but silence alone does not invoke.'
  },
  'Colorado v. Connelly': {
    aliases: ['Connelly'],
    commonConfusion: 'Mental illness alone does not make a confession involuntary under Due Process. Coercive police conduct is required.',
    memoryAid: 'Connelly: no police coercion, no Due Process problem.'
  },
  'State v. S.V.': {
    aliases: ['S.V.'],
    commonConfusion: 'Police need not notify parents first, but once the juvenile asks for his parents, questioning must stop immediately.',
    memoryAid: 'S.V.: juvenile asks for parents, questioning stops.'
  },
  'Mapp v. Ohio': {
    aliases: ['Mapp', 'Dollree Mapp'],
    commonConfusion: 'Mapp applies the exclusionary rule to the states. It does not say every violation always leads to exclusion.',
    memoryAid: 'Mapp: puts the exclusionary rule on the state map.'
  },
  'Hudson v. Michigan': {
    aliases: ['Hudson'],
    commonConfusion: 'A valid warrant plus a knock-and-announce violation does not trigger the exclusionary rule. Rule violated ≠ evidence excluded.',
    memoryAid: 'Hudson: knocked too soon, but exclusion still isn\'t triggered.'
  },
  'Herring v. United States': {
    aliases: ['Herring'],
    commonConfusion: 'Isolated clerical negligence is not enough for exclusion. Deliberate, reckless, or grossly negligent conduct (or systemic negligence) is.',
    memoryAid: 'Herring: a clerk\'s slip is not deliberate police misconduct.'
  }
};
