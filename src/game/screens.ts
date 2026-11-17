import { CASES, CHAPTERS, DEFINITIONS, OBJECTIVES, caseById, objectiveById } from '../content/guide';
import { SCENARIOS } from '../content/scenarios';
import { compute, coverage, missedObjectives, objectiveStatus, pctOf, recommendations } from '../learning/mastery';
import type { AttemptRecord } from '../persistence/save';
import { resetProfile } from '../persistence/save';
import { setMuted } from '../engine/audio';
import type { Game } from './game';
import { STEPS, chapterProgress, remainingMinutes } from './flow';
import { btn, confirmModal, h, openModal, toast, $ } from './ui';

const bar = (label: string, n: number, c: number) => h('div', { class: 'bar' }, h('span', { class: 'bl' }, label), h('span', { class: 'bt' }, h('i', { style: `width:${n ? Math.round(100 * c / n) : 0}%` })), h('span', { class: 'bv' }, n ? `${Math.round(100 * c / n)}% (${c}/${n})` : 'not attempted'));

export function showMenu(g: Game) {
  g.hud(false); g.world.frozen = true; g.showMenuWorld();
  const hasRun = !!g.profile.run;
  const lifetime = compute(g.profile.records);
  const root = h('div', { class: 'menuscreen' },
    h('div', { class: 'title' }, h('div', { class: 'eyebrow' }, 'A Criminal Procedure study adventure'), h('h1', null, 'CASEFILE'), h('h2', null, 'Shadows of Justice')),
    h('div', { class: 'mbtns' },
      btn('Start Full Investigation', async () => { if (hasRun && !(await confirmModal('Starting a new investigation replaces your saved session. Your lifetime practice history is kept. Continue?', 'Start new'))) return; root.remove(); g.startFull(); }, 'primary big', { autofocus: true }),
      btn(hasRun ? `⏵ Continue Session (${STEPS[g.profile.run!.stepIdx]?.chapter ?? 'Chapter 6'})` : '⏵ Continue Session', () => { root.remove(); g.continueRun(); }, 'big', hasRun ? {} : { disabled: true }),
      btn('Rapid Review (15–25 min)', () => { root.remove(); g.rapidReview(); }, 'big'),
      btn('Targeted Practice', () => openPracticeSetup(g, root), 'big'),
      btn('Case Encyclopedia', () => openEncyclopedia(g), 'big'),
      btn('Settings', () => openSettings(g), 'big'),
      lifetime.total ? btn('📊 My Results', () => showSummary(g, g.profile.records, { title: 'All practice so far' }), 'big ghost') : null),
    h('div', { class: 'mfoot' },
      h('p', null, 'Study aid only. It does not replace your assigned readings or instructor guidance, and playing does not guarantee exam readiness. Progress saves in this browser; no account needed.'),
      h('p', { class: 'muted' }, 'The full campaign covers Chapters 6, 7, 8 and 10 and ends with a final suppression hearing. Courtroom, interrogation-room and document-inspection presentation for Chapters 7, 8 and 10 still uses the standard decision panel.')));
  $('#ui').append(root);
}

export function openPracticeSetup(g: Game, menuRoot?: HTMLElement) {
  let chapter = 'all', focus = 'mixed', count = 10;
  const mk = (label: string, opts: [string, string][], get: () => string, set: (v: string) => void) => {
    const row = h('div', { class: 'chips', role: 'radiogroup', 'aria-label': label }, h('b', { class: 'cl' }, label));
    const draw = () => { row.querySelectorAll('.pill').forEach(x => x.remove()); for (const [v, t] of opts) row.append(h('button', { type: 'button', class: 'pill' + (get() === v ? ' on' : ''), role: 'radio', 'aria-checked': String(get() === v), onclick: () => { set(v); draw(); } }, t)); };
    draw(); return row;
  };
  const weak = g.profile.records.length ? '' : ' (no mistakes recorded yet)';
  const m = openModal(h('div', null, h('h2', null, 'Targeted Practice'), h('p', { class: 'muted' }, 'Pick exactly what you need. Questions come from the study guide, with fresh scenarios where available.'),
    mk('Chapter', [['all', 'All'], ['6', 'Ch 6'], ['7', 'Ch 7'], ['8', 'Ch 8'], ['10', 'Ch 10']], () => chapter, v => chapter = v),
    mk('Focus', [['mixed', 'Mixed'], ['cases', 'Case law'], ['definitions', 'Definitions'], ['topics', 'Core topics'], ['apps', 'Applications (Ch 6)'], ['weak', 'Weak areas' + weak]], () => focus, v => focus = v),
    mk('Questions', [['5', '5'], ['10', '10'], ['20', '20']], () => String(count), v => count = +v),
    h('div', { class: 'row end' }, btn('Cancel', () => m.close(), 'ghost'), btn('Start practice', () => { m.close(); menuRoot?.remove(); g.targeted({ chapter, focus, count }); }, 'primary', { autofocus: true }))), { label: 'Targeted practice setup' });
}

export function openSettings(g: Game) {
  const s = g.profile.settings;
  const row = (label: string, ctrl: Node) => h('div', { class: 'srow' }, h('label', null, label), ctrl);
  const size = h('select', { 'aria-label': 'Text size', onchange: (e: Event) => { s.textScale = +(e.target as HTMLSelectElement).value; g.applySettings(); } },
    ...[['1', 'Normal'], ['1.15', 'Large'], ['1.3', 'Larger'], ['1.5', 'Largest']].map(([v, t]) => h('option', { value: v, selected: +v === s.textScale }, t)));
  const chk = (key: 'reducedMotion' | 'highContrast' | 'muted') => h('input', { type: 'checkbox', checked: s[key], onchange: (e: Event) => { s[key] = (e.target as HTMLInputElement).checked; g.applySettings(); } });
  const m = openModal(h('div', null, h('h2', null, 'Settings'),
    row('Text size', size), row('Reduced motion', chk('reducedMotion')), row('High-contrast interface', chk('highContrast')), row('Mute sound', chk('muted')),
    row('Fullscreen', btn('Toggle fullscreen', () => g.toggleFullscreen(), 'small')),
    row('Controls', h('span', { class: 'muted' }, 'WASD / arrows move · E interact (or click) · Tab notebook · Esc pause · 1–9 pick options · H hint')),
    row('Progress', btn('Reset all saved progress', async () => { if (await confirmModal('Delete your saved session and all practice history from this browser? This cannot be undone.', 'Delete everything')) { g.profile = resetProfile(); g.applySettings(); toast('Progress reset.'); m.close(); g.toMenu(); } }, 'small danger')),
    h('div', { class: 'row end' }, btn('Done', () => m.close(), 'primary', { autofocus: true }))), { label: 'Settings', onClose: () => g.save() });
}

export function openEncyclopedia(g: Game, focusId?: string) {
  const detail = h('div', { class: 'encdetail', tabindex: '0' });
  const list = h('div', { class: 'enclist', role: 'list' });
  const show = (id: string) => {
    const c = caseById(id); detail.replaceChildren(
      h('h3', null, c.name), h('div', { class: 'muted' }, `${c.cite} · Chapter ${c.chapter} · ${c.list}`),
      h('h4', null, 'Facts (from the guide)'), h('p', null, c.facts), h('h4', null, 'Issue'), h('p', null, c.issue), h('h4', null, 'Holding / Rule'), h('p', { class: 'ruleline' }, c.rule),
      h('h4', null, 'Test-day takeaway'), h('p', null, c.takeaway),
      h('div', { class: 'aid' }, h('div', { class: 'tag alt' }, 'Study aid · not from the guide'), h('h4', null, 'Common confusion'), h('p', null, c.commonConfusion), h('h4', null, 'Memory aid'), h('p', null, c.memoryAid)),
      h('div', { class: 'row' }, btn('Practice this case', () => { m.close(); g.practiceCase(id); }, 'small')));
    list.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.id === id));
  };
  for (const ch of CHAPTERS) { list.append(h('div', { class: 'eh' }, `Chapter ${ch.n}: ${ch.title}`)); for (const c of CASES.filter(x => x.chapter === ch.n)) list.append(h('button', { type: 'button', class: 'enc', 'data-id': c.id, onclick: () => show(c.id) }, c.name)); }
  const m = openModal(h('div', null, h('h2', null, 'Case Encyclopedia'), h('p', { class: 'muted tiny' }, 'All 18 cases. Facts, issues and rules are taken from the study guide wording.'), h('div', { class: 'enc' }, list, detail), h('div', { class: 'row end' }, btn('Close', () => m.close(), 'primary'))), { wide: true, label: 'Case encyclopedia' });
  show(focusId ?? CASES[0].id);
}

export function openNotebook(g: Game) {
  const run = g.profile.run; const tabs: Record<string, () => Node> = {};
  const idx = run?.stepIdx ?? 0;
  tabs['Objective'] = () => run ? h('div', null, h('h3', null, STEPS[Math.min(idx, STEPS.length - 1)].objective), h('p', { class: 'muted' }, STEPS[Math.min(idx, STEPS.length - 1)].chapter), bar('Session progress', 100, chapterProgress(idx)), h('p', null, `About ${remainingMinutes(idx)} minutes of designed content remain (an estimate, not a timer).`)) : h('p', null, 'Start the investigation to see objectives.');
  tabs['Evidence'] = () => h('div', null, ...(run?.evidence.length ? run.evidence.map(e => h('div', { class: 'ev' }, h('b', null, e.split(': ')[0]), h('p', null, e.split(': ').slice(1).join(': ')))) : [h('p', { class: 'muted' }, 'No evidence logged yet.')]));
  tabs['Mistakes'] = () => { const recs = (run ? g.profile.records.filter(r => r.runId === run.runId) : g.profile.records).filter(r => !r.correct); return h('div', null, h('p', { class: 'muted' }, 'Mistakes are for learning. Each missed doctrine returns later as a different fact pattern.'), ...(recs.length ? recs.map(r => { const sc = SCENARIOS.find(s => s.id === r.itemId); const o = objectiveById(r.objectiveId); return h('div', { class: 'ev' }, h('b', null, o?.name ?? r.objectiveId), h('p', null, sc ? sc.rule : o?.source ?? '')); }) : [h('p', null, 'No mistakes recorded.')])); };
  tabs['Cases'] = () => h('div', { class: 'chips' }, ...CASES.filter(c => c.chapter === 6).map(c => btn(c.name, () => openEncyclopedia(g, c.id), 'chip')), h('p', { class: 'muted' }, 'Open the encyclopedia from the main menu for all 18 cases.'));
  tabs['Coverage'] = () => { const cv = coverage(run?.encountered ?? []); return h('div', null, bar('Chapter 6 objectives encountered', cv.total, cv.seen), h('p', { class: 'muted' }, 'Encountered ≠ mastered. Mastery needs unassisted correct answers.')); };
  const body = h('div', { class: 'nbbody' }); const tb = h('div', { class: 'tabs', role: 'tablist' });
  const sel = (name: string) => { body.replaceChildren(tabs[name]()); tb.querySelectorAll('button').forEach(b => { b.classList.toggle('on', b.textContent === name); b.setAttribute('aria-selected', String(b.textContent === name)); }); };
  for (const name of Object.keys(tabs)) tb.append(h('button', { type: 'button', role: 'tab', class: 'tab', onclick: () => sel(name) }, name));
  const m = openModal(h('div', null, h('h2', null, 'Notebook'), tb, body, h('div', { class: 'row end' }, btn('Close (Tab)', () => m.close(), 'primary', { autofocus: true }))), { wide: true, label: 'Notebook' });
  sel('Objective');
}

export function openPause(g: Game) {
  const m = openModal(h('div', null, h('h2', null, 'Paused'), h('p', { class: 'muted' }, 'Progress is saved automatically.'),
    h('div', { class: 'col' }, btn('Resume', () => m.close(), 'primary', { autofocus: true }), btn('Notebook', () => { m.close(); openNotebook(g); }), btn('Settings', () => openSettings(g)), btn('Save and exit to menu', () => { m.close(); g.save(); g.toMenu(); }, 'ghost'))), { label: 'Pause menu' });
}

export function showSummary(g: Game, records: AttemptRecord[], o: { title: string; narrative?: string[]; onAgain?: () => void; fiveMin?: boolean }) {
  const st = compute(records); const miss = missedObjectives(records); const recs = recommendations(records);
  const enc = new Set(records.map(r => r.objectiveId)); const mastered = [...enc].filter(id => objectiveStatus(records, id) === 'mastered').length;
  const cats: [string, string][] = [['case', 'Case recognition'], ['definition', 'Definition recall'], ['application', 'Legal application'], ['topic', 'Core topic recall']];
  const chapters = [6, 7, 8, 10];
  const text = () => [`CASEFILE study summary: ${o.title}`, `Questions answered: ${st.total}`, `First-attempt accuracy: ${st.firstAttemptAccuracy ?? 0}%`, `Unassisted: ${pctOf(st.unassisted.correct, st.unassisted.n) ?? '-'}%  |  With hints: ${pctOf(st.assisted.correct, st.assisted.n) ?? '-'}%`,
    `Topics mastered (unassisted): ${mastered} of ${enc.size} seen`, `Needs review: ${miss.map(x => objectiveById(x.id)?.name).join('; ') || 'none recorded'}`, 'Suggested next steps:', ...recs.map(r => '- ' + r)].join('\n');
  const m = openModal(h('div', { class: 'summary' }, h('h2', null, o.title),
    ...(o.narrative ?? []).map(n => h('p', { class: 'lead' }, n)),
    h('div', { class: 'three' },
      h('div', { class: 'metric' }, h('b', null, `${st.firstAttemptAccuracy ?? 0}%`), h('span', null, 'First-attempt accuracy'), h('i', null, `${st.total} questions`)),
      h('div', { class: 'metric' }, h('b', null, `${enc.size}`), h('span', null, 'Objectives encountered'), h('i', null, 'Content coverage')),
      h('div', { class: 'metric' }, h('b', null, `${mastered}`), h('span', null, 'Mastered unassisted'), h('i', null, 'Mastery, not completion'))),
    h('p', { class: 'muted tiny' }, 'Completion, coverage and mastery are separate measures. Finishing the story never counts as mastery.'),
    h('h3', null, 'Performance'), bar('Unassisted', st.unassisted.n, st.unassisted.correct), bar('With hints', st.assisted.n, st.assisted.correct),
    ...cats.map(([k, l]) => bar(l, st.byCategory[k]?.n ?? 0, st.byCategory[k]?.correct ?? 0)),
    h('h3', null, 'By chapter'), ...chapters.map(c => bar(`Chapter ${c}`, st.byChapter[c]?.n ?? 0, st.byChapter[c]?.correct ?? 0)),
    h('h3', null, 'Most frequently missed'), miss.length ? h('ul', null, ...miss.slice(0, 6).map(x => h('li', null, `${objectiveById(x.id)?.name ?? x.id} (${x.misses}×)`))) : h('p', null, 'No misses recorded in this set.'),
    h('h3', null, 'What to review next'), recs.length ? h('ul', null, ...recs.map(r => h('li', null, r))) : h('p', null, st.total ? 'Nothing specific. Try Targeted Practice on a different chapter for fresh questions.' : 'Answer some questions first.'),
    h('div', { class: 'row wrap end' },
      miss.length ? btn('5-minute review of missed items', () => { m.close(); g.fiveMinute(records); }, 'primary') : null,
      o.onAgain ? btn('Again', () => { m.close(); o.onAgain!(); }) : null,
      btn('Copy summary', async () => { try { await navigator.clipboard.writeText(text()); toast('Summary copied.'); } catch { toast('Copy failed; use Print.'); } }, 'small'),
      btn('Print', () => window.print(), 'small'), btn('Main menu', () => { m.close(); g.toMenu(); }, miss.length ? '' : 'primary', miss.length ? {} : { autofocus: true }))), { wide: true, closable: false, label: 'Results' });
  void OBJECTIVES; void DEFINITIONS; void setMuted;
}
