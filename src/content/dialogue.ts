// Short, skippable dialogue. Lines may be conditional on flags set by earlier decisions.
export interface Line { who: string; text: string; ifFlag?: string; ifNotFlag?: string; }
export const DIALOGUE: Record<string, Line[]> = {
  pro_intro: [
    { who: 'Ward', text: 'Rookie. Blackridge Tech Warehouse lost forty laptops in three weeks. Last night someone left a ledger page in a stolen van.' },
    { who: 'Ward', text: 'The ledger names an address on Alder Lane. We find the truth, but every piece of evidence has to survive a hearing.' },
    { who: 'Ward', text: 'Check the case board. Then we roll.' }
  ],
  pro_board: [
    { who: 'Ward', text: 'Every search question follows one path. Show me you know it.' }
  ],
  a_van: [
    { who: 'Ward', text: 'Our warrant covers 142 Alder Lane. Read it closely: place AND items.' },
    { who: 'Hale', text: 'ADA Hale here. If the paper is sloppy, the defense will find it. Walk me through it.' }
  ],
  a_door: [
    { who: 'Brooks', text: 'Entry team is ready, Detective. We have a valid warrant. What are the rules at the door?' }
  ],
  b_arrest: [
    { who: 'Brooks', text: 'We have Vance, living-room side. He is mine to search, but only so far. Where does the arrest let us look?' }
  ],
  c_cars: [
    { who: 'Ward', text: 'Two cars on the block tie into this. Remember: separate the justification for a search from its scope.' }
  ],
  d_consent: [
    { who: 'Brooks', text: 'A woman at Apartment 4C says she will let us in. Talk to her first. Authority is not just a word.' }
  ],
  e_stop: [
    { who: 'Brooks', text: 'My report on the stop is on the dash. I will admit I had a drug hunch. What matters in the report?' }
  ],
  f_challenge: [
    { who: 'Ward', text: 'Hale wants a clean evidence log before the hearing. Prove you can apply the rules to facts you have not seen.' }
  ],
  h_lot: [
    { who: 'Ward', text: 'The ledger points at the Blackridge impound lot. Cars get inventoried there, and that has its own rules.' },
    { who: 'Ward', text: 'Inventory searches and special-needs searches follow standardized policy. Check whether the procedure was actually followed.' }
  ],
  h_board: [
    { who: 'Ward', text: 'Three more contexts on the board: borders, schools, and people whose status changes their privacy. Take each in turn.' }
  ],
  i_stop: [
    { who: 'Brooks', text: 'I asked the driver a couple of roadside questions before I arrested him. No warnings. Was that a problem?' },
    { who: 'Ward', text: 'Miranda needs custody and interrogation. Work out which parts of this were which.' }
  ],
  i_vance: [
    { who: 'Ward', text: 'Vance is in the interview chair. Watch what the detective says, and what it is likely to get out of him.' }
  ],
  i_marla: [
    { who: 'Ward', text: 'Marla\'s teenage son saw something. Juveniles and physical evidence come with their own rules.' }
  ],
  j_prep: [
    { who: 'Hale', text: 'The defense will move to suppress everything. First, why do we even have an exclusionary rule?' }
  ],
  j_ward: [
    { who: 'Ward', text: 'Suppression is not the end of the road. Know the exceptions and which violations do not trigger exclusion.' }
  ],
  j_board: [
    { who: 'Hale', text: 'Last pieces: good faith, and where the rule applies. Then we go to court.' }
  ],
  k_hearing: [
    { who: 'Hale', text: 'The judge will test you on all four chapters. One decision from each. Take your time.' },
    { who: 'Ward', text: 'Whatever happens, we follow the rules. Let us go.' }
  ],
  g_wrap: [
    { who: 'Ward', text: 'The ledger page from the van lists a delivery address: the Blackridge impound lot. That is Chapter 7 territory.' },
    { who: 'Hale', text: 'Searches of that sort follow different rules. We will cover them next.', ifNotFlag: 'warrant_scope_error' },
    { who: 'Hale', text: 'And watch the scope of every warrant. Anything from that shed is going to be fought over.', ifFlag: 'warrant_scope_error' },
    { who: 'Ward', text: 'Good work today. Log your notes.' }
  ]
};
