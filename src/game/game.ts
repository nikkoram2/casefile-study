import { CASES, DEFINITIONS, DOCTRINES, TOPICS, caseById, objectiveById } from '../content/guide';
import { DIALOGUE } from '../content/dialogue';
import { SCENARIOS } from '../content/scenarios';
import type { RecallItem, Scenario } from '../content/types';
import { sfx, setMuted, startRain, stopRain } from '../engine/audio';
import { Input, MAPS, World } from '../engine/world';
import { buildRecall } from '../learning/recall';
import { hashSeed, rng, shuffle } from '../learning/rng';
import { missedObjectives, weakIds } from '../learning/mastery';
import { pickVariant } from '../learning/scheduler';
import { AttemptRecord, Profile, Run, loadProfile, saveProfile } from '../persistence/save';
import { STEPS, Step, chapterProgress, remainingMinutes, scenariosForStep } from './flow';
import { Outcome, runRecall, runScenario } from './panels';
import { seqFor } from '../content/sequences';
import { playSceneIntro } from './scenePlay';
import { runMemoryDrill } from './memoryArchive';
import { runVehicleSequence } from './vehicleSequence';
import { handleEscape, h, btn, modalDepth, runDialogue, toast, $, openModal } from './ui';
import { openEncyclopedia, openNotebook, openPause, showMenu, showSummary } from './screens';

type Item = { kind: 'scenario'; s: Scenario } | { kind: 'recall'; r: RecallItem };
/** Pick one of two recall kinds for an objective. The random choice is made BEFORE the lookup. */
function pick2(rc: RecallItem[], q: () => number, a: string, b: string, id: string): RecallItem { const prefix = q() > 0.5 ? a : b; return rc.find(x => x.id === prefix + id)!; }

export class Game {
  profile: Profile = loadProfile(); input = new Input(); world: World; private last = performance.now(); private inMenu = true; private busy = false;
  constructor(cv: HTMLCanvasElement) {
    this.world = new World(cv, this.input);
    this.world.onInteract = id => void this.interact(id); this.world.onHint = m => toast(m);
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !e.defaultPrevented) { if (handleEscape()) return; if (!this.inMenu && !this.busy) openPause(this); }
      if (e.key === 'Tab') { e.preventDefault(); if (!this.inMenu && !this.busy && !modalDepth()) openNotebook(this); }
    });
    this.applySettings(); this.world.setMap("alder"); this.world.frozen = true;
    const loop = (t: number) => { const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t; this.world.frozen = this.inMenu || this.busy || modalDepth() > 0; this.world.update(dt); this.world.render(); this.tickClock(dt); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    setInterval(() => { if (this.profile.run && !this.inMenu) this.save(); }, 15000);
    document.addEventListener('visibilitychange', () => this.save());
  }
  private tickClock(dt: number) { const r = this.profile.run; if (r && !this.inMenu && !this.busy && modalDepth() === 0) r.elapsedMs += dt * 1000; }
  save() { const r = this.profile.run; if (r && !this.inMenu) { r.px = this.world.px; r.py = this.world.py; r.map = this.world.map.id; } saveProfile(this.profile); }
  applySettings() {
    const s = this.profile.settings, root = document.documentElement; root.style.setProperty('--fs', String(s.textScale));
    root.classList.toggle('hc', s.highContrast); root.classList.toggle('rm', s.reducedMotion); this.world.reduced = s.reducedMotion; setMuted(s.muted);
    const m = $('#mute'); if (m) m.classList.toggle('off', s.muted); this.save();
  }
  toggleFullscreen() { if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen?.().catch(() => toast('Fullscreen is not available here.')); }
  showMenuWorld() { this.world.setMap('alder'); this.world.targetId = ''; }
  toMenu() { this.inMenu = true; this.busy = false; stopRain(); $('#ui').replaceChildren(); showMenu(this); }
  hud(on: boolean) {
    const el = $('#hud'); el.hidden = !on; if (!on) return;
    const r = this.profile.run!, st = STEPS[Math.min(r.stepIdx, STEPS.length - 1)];
    $('#hud-ch').textContent = st.chapter; $('#hud-obj').textContent = 'Objective: ' + st.objective;
    $('#hud-bar').style.width = chapterProgress(r.stepIdx) + '%'; $('#hud-time').textContent = r.stepIdx >= STEPS.length ? 'Done' : `≈ ${remainingMinutes(r.stepIdx)} min left`;
  }
  private head() { return this.profile.run!; }
  record(r: Omit<AttemptRecord, 'ts'>) { this.profile.records.push({ ...r, ts: Date.now() }); this.save(); }

  // ───── Full investigation ─────
  startFull() {
    const seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0;
    this.profile.run = { runId: 'run' + seed, seed, mode: 'full', startedAt: Date.now(), elapsedMs: 0, stepIdx: 0, map: 'precinct', px: 0, py: 0, seenScenarios: [], seenDialogue: [], evidence: [], flags: {}, completedSteps: [], chapterDone: {}, encountered: [], challenge: [], recallQueue: [] };
    this.enterWorld(true);
  }
  continueRun() { if (!this.profile.run) return this.toMenu(); this.enterWorld(false); }
  private enterWorld(fresh: boolean) {
    const r = this.head(); this.inMenu = false; this.busy = false; $('#ui').replaceChildren();
    this.world.setMap(fresh ? 'precinct' : (r.map in MAPS ? r.map : 'precinct'));
    if (!fresh && r.px) this.world.setPosition(r.px, r.py);
    this.syncStep(); this.hud(true); this.input.clear();
    if (this.world.map.rain) startRain(); if (fresh) toast('WASD or arrows to move · E to interact · Tab for notebook');
  }
  private syncStep() { const r = this.head(); const st = STEPS[Math.min(r.stepIdx, STEPS.length - 1)]; if (st.map && st.map !== this.world.map.id) { this.world.setMap(st.map); if (this.world.map.rain) startRain(); else stopRain(); } this.world.targetId = st.target; this.hud(true); this.save(); }

  private async interact(id: string) {
    if (this.inMenu || this.busy || modalDepth()) return; const r = this.head(); const step = STEPS[r.stepIdx];
    if (!step) return;
    if (id !== step.target && !(step.target === 'van' && id === 'van')) { toast(id === 'ward' && this.world.map.id === 'precinct' ? 'Ward: "Case board first, rookie."' : `Nothing more here yet. ${step.objective}.`); return; }
    this.busy = true; sfx.discover();
    try { await this.runStep(step); } finally { this.busy = false; this.syncStep(); }
  }
  private lines(key: string) { const flags = this.head().flags; return (DIALOGUE[key] ?? []).filter(l => (!l.ifFlag || Object.keys(flags).some(f => f.includes(l.ifFlag!) && flags[f])) && (!l.ifNotFlag || !Object.keys(flags).some(f => f.includes(l.ifNotFlag!) && flags[f]))); }
  private async runStep(step: Step) {
    const r = this.head();
    if (step.dialogue) { const key = 'dlg:' + step.dialogue; await runDialogue(this.lines(step.dialogue), r.seenDialogue.includes(key)); if (!r.seenDialogue.includes(key)) r.seenDialogue.push(key); }
    const missed = missedObjectives(this.profile.records.filter(x => x.runId === r.runId)).map(m => m.id);
    this.hearingNow = !!step.hearing; const list = step.hearing ? this.hearingScenarios(r, missed) : scenariosForStep(step, r, missed);
    for (let i = 0; i < list.length; i++) await this.playScenario(list[i], { index: i, total: list.length, mode: 'full' });
    if (step.recallChapter) await this.recallRound(step.recallChapter);
    r.completedSteps.push(step.id); r.stepIdx++; sfx.discover(); this.save();
    if (step.hearing) r.flags['hearing_ids:' + list.map(s => s.id).join(',')] = true;
    if (step.chapterEnd) { r.chapterDone[String(step.chapterEnd)] = true; this.save(); toast(`Chapter ${step.chapterEnd} complete. Keep going: the case continues.`); }
    if (step.end) { const pr = await runMemoryDrill({ count: 3, title: 'Final hearing: cite the precedent' }); r.flags['precedents:' + pr.right + '/' + pr.total] = true; this.busy = false; this.finale(list, pr); }
  }
  private hearingNow = false;
  private async playScenario(s: Scenario, o: { index?: number; total?: number; mode: string }) {
    const r = this.profile.run; const seq = seqFor(s.id); let out: Outcome | undefined;
    if (seq && !['rapid', 'review'].includes(o.mode)) { try { out = await runVehicleSequence(s, seq, { ...o, reduced: this.profile.settings.reducedMotion, onCase: id => openEncyclopedia(this, id) }); } catch (e) { console.error('sequence failed, using classic panel', e); } }
    if (!out && !['rapid', 'review'].includes(o.mode)) { const ch = objectiveById(s.objectiveId)?.chapter ?? 6; { try { await playSceneIntro(s, ch, !!this.hearingNow, this.profile.settings.reducedMotion); } catch (e) { console.warn('scene intro failed', e); } } }
    out ??= await runScenario(s, { ...o, onCase: id => openEncyclopedia(this, id) });
    this.record({ itemId: s.id, objectiveId: s.objectiveId, chapter: (objectiveById(s.objectiveId)?.chapter ?? 6) as 6 | 7 | 8 | 10, category: 'application', correct: out.correct, hintsUsed: out.hintsUsed, mode: o.mode, runId: r?.runId ?? 'practice', variant: s.variant });
    if (r && o.mode === 'full') {
      r.seenScenarios.push(s.id); for (const id of [s.objectiveId, ...s.caseIds]) if (!r.encountered.includes(id)) r.encountered.push(id);
      const f = out.correct ? s.flags.right : s.flags.wrong; if (f) r.flags[f] = true; r.evidence.push(`${s.title}: ${s.setup}`); if (out.evidenceNote) r.evidence.push(out.evidenceNote);
    }
    return out;
  }
  private async playRecall(it: RecallItem, o: { index?: number; total?: number; mode: string }) {
    const r = this.profile.run; const out = await runRecall(it, { ...o, onCase: id => openEncyclopedia(this, id) });
    this.record({ itemId: it.id, objectiveId: it.objectiveId, chapter: it.chapter, category: it.category, correct: out.correct, hintsUsed: out.hintsUsed, mode: o.mode, runId: o.mode === 'full' && r ? r.runId : 'practice' });
    if (r && o.mode === 'full' && !r.encountered.includes(it.objectiveId)) r.encountered.push(it.objectiveId);
    return out;
  }
  /** End-of-chapter retrieval practice: no explanation shown beforehand; one case-recall per Chapter 6 case + the 5 definition cards. */
  private async recallRound(ch: 6 | 7 | 8 | 10 = 6) {
    const r = this.head(); const rc = buildRecall(r.seed); const q = rng(hashSeed(r.seed, 'round' + ch));
    const items: RecallItem[] = [...CASES.filter(c => c.chapter === ch).map(c => pick2(rc, q, 'R-CFACTS-', 'R-CRULE-', c.id)), ...DEFINITIONS.filter(d => d.chapter === ch).map(d => pick2(rc, q, 'R-DTERM-', 'R-DDEF-', d.id))];
    await runDialogue([{ who: 'Ward', text: `Quick retrieval round on Chapter ${ch}: cases and definitions, no notes. ${items.length} questions.` }], false);
    for (let i = 0; i < items.length; i++) await this.playRecall(items[i], { index: i, total: items.length, mode: 'full' });
  }
  private fade(mid: () => void): Promise<void> {
    return new Promise(res => { const f = $('#fade'); if (this.profile.settings.reducedMotion) { mid(); return res(); } f.classList.add('on'); setTimeout(() => { mid(); f.classList.remove('on'); setTimeout(res, 350); }, 400); });
  }
  /** One adaptive decision per chapter: a missed objective from that chapter if there is one, otherwise its hardest doctrine. */
  private hearingScenarios(r: Run, missed: string[]) {
    const out: Scenario[] = []; const seen = [...r.seenScenarios];
    for (const ch of [6, 7, 8, 10]) {
      const miss = DOCTRINES.filter(d => d.chapter === ch && missed.includes(d.id)).map(d => d.id);
      const hard = DOCTRINES.filter(d => d.chapter === ch).sort((a, b) => b.difficulty - a.difficulty).map(d => d.id);
      let s: Scenario | null = null;
      for (const id of [...miss, ...hard]) { s = pickVariant(id, seen, r.seed, 'hearing'); if (s && !out.includes(s)) break; s = null; }
      if (s) { out.push(s); seen.push(s.id); }
    }
    return out;
  }
  private finale(hearing: Scenario[], pr?: { right: number; total: number }) {
    const r = this.head(); const recs = this.profile.records.filter(x => x.runId === r.runId);
    const hs = hearing.map(s => recs.filter(x => x.itemId === s.id).slice(-1)[0]).filter(Boolean); const won = hs.filter(x => x.correct).length;
    const acc = recs.length ? Math.round(100 * recs.filter(x => x.correct).length / recs.length) : 0;
    const errFlags = Object.keys(r.flags).filter(f => /_error$/.test(f) && r.flags[f]).length;
    const excOk = recs.some(x => x.itemId === 'S10-EXC-1' && x.correct);
    let id: string, title: string, text: string[];
    if (won === hearing.length && !errFlags) { id = 'perfect'; title = 'Ending: Perfect Case'; text = ['Every ruling went your way. The searches held, the statements came in, and the judge denies the motion to suppress. Hale shakes your hand: "Clean from the first warrant to the last question."']; }
    else if (won >= hearing.length - 1 && errFlags && excOk) { id = 'discovery'; title = 'Ending: Unexpected Discovery'; text = ['One search went wrong earlier, but you proved the item would have been found lawfully anyway. The judge admits it under inevitable discovery, and the case survives.']; }
    else if (won >= hearing.length - 1) { id = 'complications'; title = 'Ending: Justice With Complications'; text = ['Most of the evidence comes in, but one ruling costs you something. The case stands, with a few gaps the defense will keep poking at.']; }
    else if (won >= 2) { id = 'suppressed'; title = 'Ending: Suppressed Case'; text = ['The judge grants part of the motion to suppress. Key evidence is excluded, and the prosecution is left with a much thinner case.']; }
    else { id = 'unresolved'; title = 'Ending: Unresolved Case (Case Reopened)'; text = ['The hearing goes badly and the case is left unresolved. Ward reopens the file: "We missed something. Review what went wrong and try again." Use the 5-minute review below, or replay the investigation.']; }
    if (pr) text.push(`Precedents cited correctly at the hearing: ${pr.right} of ${pr.total}.`);
    text.push(`Final hearing: ${won} of ${hearing.length} decisions correct. First-attempt accuracy across the session: ${acc}%. Playtime: about ${Math.round(r.elapsedMs / 60000)} min.`);
    text.push('This ending reflects how you applied the rules in this session. It is a story result, not a grade, and is separate from mastery.');
    if (!this.profile.endingsUnlocked.includes(id)) this.profile.endingsUnlocked.push(id);
    r.chapterDone['hearing'] = true; this.save();
    showSummary(this, recs, { title, narrative: text });
  }

  // ───── Practice modes ─────
  private async runItems(items: Item[], title: string, mode: string, again?: () => void) {
    this.inMenu = false; this.busy = true; this.hud(false); $('#ui').replaceChildren(); const startIdx = this.profile.records.length;
    for (let i = 0; i < items.length; i++) { const it = items[i]; if (it.kind === 'scenario') await this.playScenario(it.s, { index: i, total: items.length, mode }); else await this.playRecall(it.r, { index: i, total: items.length, mode }); }
    this.busy = false; this.inMenu = true; showSummary(this, this.profile.records.slice(startIdx), { title, onAgain: again });
  }
  private seedNow() { return (Date.now() ^ this.profile.records.length * 7919) >>> 0; }
  rapidReview() {
    const seed = this.seedNow(), rc = buildRecall(seed), q = rng(seed); const items: Item[] = [];
    for (const c of CASES) items.push({ kind: 'recall', r: pick2(rc, q, 'R-CFACTS-', 'R-CRULE-', c.id) });
    for (const ch of [6, 7, 8, 10]) for (const d of shuffle(DEFINITIONS.filter(x => x.chapter === ch), q).slice(0, 2)) items.push({ kind: 'recall', r: pick2(rc, q, 'R-DTERM-', 'R-DDEF-', d.id) });
    for (const obj of ['CH6-GRAB', 'CH6-GANT', 'CH6-CONSENT', 'CH6-PRETEXT', 'CH7-INVENTORY', 'CH8-CUSTODY', 'CH10-GOODFAITH']) { const s = pickVariant(obj, [], seed, 'rapid'); if (s) items.push({ kind: 'scenario', s }); }
    const ordered = [...items.filter(i => i.kind === 'recall' && i.r.chapter === 6), ...items.filter(i => i.kind === 'scenario'), ...items.filter(i => i.kind === 'recall' && i.r.chapter !== 6)];
    void this.runItems(ordered, 'Rapid Review results (condensed: not equivalent to full coverage)', 'rapid', () => this.rapidReview());
  }
  targeted(o: { chapter: string; focus: string; count: number }) {
    const seed = this.seedNow(), rc = buildRecall(seed), q = rng(seed); const chap = (c: number) => o.chapter === 'all' || +o.chapter === c; const items: Item[] = [];
    const weak = new Set(weakIds(this.profile));
    const pool: Item[] = [];
    if (['mixed', 'cases', 'weak'].includes(o.focus)) for (const c of CASES.filter(x => chap(x.chapter))) for (const k of ['R-CFACTS-', 'R-CRULE-', 'R-RULEC-']) pool.push({ kind: 'recall', r: rc.find(x => x.id === k + c.id)! });
    if (['mixed', 'definitions', 'weak'].includes(o.focus)) for (const d of DEFINITIONS.filter(x => chap(x.chapter))) for (const k of ['R-DTERM-', 'R-DDEF-']) pool.push({ kind: 'recall', r: rc.find(x => x.id === k + d.id)! });
    if (['mixed', 'topics', 'weak'].includes(o.focus)) for (const t of TOPICS.filter(x => chap(x.chapter))) pool.push({ kind: 'recall', r: rc.find(x => x.id === 'R-TOPIC-' + t.id)! });
    if (['mixed', 'apps', 'weak'].includes(o.focus)) for (const s of SCENARIOS.filter(s => chap(objectiveById(s.objectiveId)?.chapter ?? 6))) pool.push({ kind: 'scenario', s });
    let use = pool;
    if (o.focus === 'weak') { use = pool.filter(i => weak.has(i.kind === 'scenario' ? i.s.objectiveId : i.r.objectiveId) || (i.kind === 'scenario' && i.s.caseIds.some(c => weak.has(c)))); if (!use.length) { toast('No mistakes recorded yet, so here is a mixed set.'); use = pool; } }
    const seenObj = new Set<string>();
    for (const it of shuffle(use, q)) { const key = it.kind === 'scenario' ? it.s.objectiveId : it.r.objectiveId; if (seenObj.has(key)) continue; seenObj.add(key); items.push(it); if (items.length >= o.count) break; }
    if (items.length < o.count) for (const it of shuffle(use, q)) { if (items.length >= o.count) break; if (!items.includes(it)) items.push(it); }
    void this.runItems(items, `Targeted Practice results (${o.chapter === 'all' ? 'all chapters' : 'Chapter ' + o.chapter})`, 'targeted', () => this.targeted(o));
  }
  practiceCase(id: string) {
    const seed = this.seedNow(), rc = buildRecall(seed); const c = caseById(id);
    const items: Item[] = ['R-CFACTS-', 'R-CRULE-', 'R-RULEC-'].map(k => ({ kind: 'recall' as const, r: rc.find(x => x.id === k + id)! }));
    for (const s of SCENARIOS.filter(s => s.caseIds.includes(id)).slice(0, 2)) items.push({ kind: 'scenario', s });
    void this.runItems(items, `Practice: ${c.name}`, 'targeted', () => this.practiceCase(id));
  }
  fiveMinute(records: AttemptRecord[]) {
    const seed = this.seedNow(), rc = buildRecall(seed); const items: Item[] = [];
    const used = new Set(records.map(r => r.itemId));
    for (const { id } of missedObjectives(records).slice(0, 8)) {
      const o = objectiveById(id); if (!o) continue;
      if (o.kind === 'doctrine') { const s = pickVariant(id, [...used], seed, 'five'); if (s) items.push({ kind: 'scenario', s }); }
      else { const fresh = rc.filter(r => r.objectiveId === id && !used.has(r.id)); const r = fresh[0] ?? rc.find(r => r.objectiveId === id); if (r) items.push({ kind: 'recall', r }); }
    }
    void this.runItems(items, 'Five-minute review of your missed items', 'review', () => this.fiveMinute(records));
  }
}
void openModal; void h; void btn;
