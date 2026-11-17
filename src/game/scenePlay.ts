// Short staged animation shown before decision panels for Chapters 7, 8, 10 and the hearing.
// Presentation only: it never touches grading, options or rules.
import type { Scenario } from '../content/types';
import { Assets } from '../engine/assets';
import { Stage } from '../engine/stage';
import { Actor } from '../engine/anim';
import { Director } from '../engine/director';
import { h, btn } from './ui';

type Setting = { scene: 'alder' | 'precinct'; label: string; rain: boolean; cast: (s: Stage, d: Director) => Promise<void>; focus: [number, number, number] };
const wait = (d: Director, ms: number) => d.wait(d.instant ? 0 : ms);

const E = (id: string, ch: string, x: number, y: number, dir: 'left' | 'right' | 'up' | 'down') => { const a = new Actor(id, ch, x, y); a.dir = dir; return a; };
/** Objective-specific staging (arrest, handcuffing, consent entry, residential search, document inspection, evidence presentation). */
const VARIANTS: [RegExp, Setting][] = [
  [/CH6-GRAB|CH6-ROBINSON|CH6-3STEP/, { scene: 'alder', label: 'ARREST', rain: true, focus: [340, 260, 1.5], cast: async (s, d) => {
    const v = E('v', 'vance', 330, 282, 'left'), b = E('b', 'brooks', 250, 290, 'right'); s.actors.push(v, b); await b.walkTo(300, 284, 62, d.instant);
    v.play('react', 'left'); await wait(d, 700); b.play('handcuff', 'right'); await wait(d, 1300); v.play('cuffed', 'left'); b.play('idle', 'right'); await wait(d, 700); } }],
  [/CH6-CONSENT|CH6-KNOCK/, { scene: 'alder', label: 'AT THE DOOR', rain: true, focus: [70, 200, 1.6], cast: async (s, d) => {
    const m = E('m', 'marla', 42, 190, 'down'), w = E('w', 'ward', 20, 210, 'right'); s.actors.push(m, w); const p = E('p', 'player', -10, 214, 'right'); s.actors.push(p);
    await p.walkTo(30, 214, 50, d.instant); w.play('talk', 'right'); await wait(d, 1200); m.play('talk', 'down'); await wait(d, 1000); await p.walkTo(44, 190, 40, d.instant); await wait(d, 500); } }],
  [/CH6-WARRANT|CH6-CONTAINER/, { scene: 'precinct', label: 'DOCUMENT INSPECTION', rain: false, focus: [320, 170, 1.6], cast: async (s, d) => {
    const w = E('w', 'ward', 300, 180, 'up'), p = E('p', 'player', 345, 182, 'up'); s.actors.push(w, p); w.play('read', 'up'); await wait(d, 1500); p.play('inspect', 'up'); await wait(d, 1500); w.play('talk', 'right'); await wait(d, 800); } }],
  [/CH6-EXIGENT|CH6-EXCEPTIONS|CH6-PRETEXT/, { scene: 'alder', label: 'RESIDENTIAL SEARCH', rain: true, focus: [90, 210, 1.5], cast: async (s, d) => {
    const b = E('b', 'brooks', 110, 215, 'left'), w = E('w', 'ward', 140, 220, 'left'); s.actors.push(b, w); await b.walkTo(60, 196, 55, d.instant); b.play('search', 'left'); await wait(d, 1400); b.play('pickup', 'left'); w.play('inspect', 'left'); await wait(d, 1000); } }],
  [/CH10-HUDSON|CH10-FRUIT|CH10-MAPP/, { scene: 'precinct', label: 'EVIDENCE PRESENTATION', rain: false, focus: [320, 200, 1.5], cast: async (s, d) => {
    const w = E('w', 'ward', 300, 230, 'right'), hl = E('h', 'hale', 350, 230, 'left'); s.actors.push(w, hl); w.play('present', 'right'); await wait(d, 1500); hl.play('inspect', 'left'); await wait(d, 1200); w.play('idle', 'right'); await wait(d, 300); } }]
];
const SETTINGS: Record<string, Setting> = {
  '7': { scene: 'alder', label: 'CHECKPOINT / IMPOUND LOT', rain: true, focus: [260, 250, 1.4], cast: async (s, d) => {
    const b = new Actor('b', 'brooks', 120, 290), w = new Actor('w', 'ward', 90, 300); s.actors.push(b, w); w.dir = 'right';
    await b.walkTo(255, 288, 62, d.instant); b.play('search', 'right'); await wait(d, 1400); b.play('pickup', 'right'); await wait(d, 700); w.play('inspect', 'right'); await wait(d, 900);
  } },
  '8': { scene: 'precinct', label: 'INTERVIEW ROOM', rain: false, focus: [320, 260, 1.5], cast: async (s, d) => {
    const v = new Actor('v', 'vance', 300, 270), w = new Actor('w', 'ward', 360, 270); v.dir = 'right'; w.dir = 'left'; s.actors.push(v, w); v.play('cuffed', 'right');
    w.play('talk', 'left'); await wait(d, 1500); v.play('react', 'right'); await wait(d, 900); w.play('idle', 'left'); await wait(d, 400);
  } },
  '10': { scene: 'precinct', label: 'SUPPRESSION HEARING', rain: false, focus: [320, 250, 1.4], cast: async (s, d) => {
    const w = new Actor('w', 'ward', 270, 268), hl = new Actor('h', 'hale', 370, 268), c = new Actor('c', 'clerkA', 320, 230); w.dir = 'right'; hl.dir = 'left'; c.dir = 'down'; s.actors.push(w, hl, c); c.play('type', 'down');
    hl.play('talk', 'left'); await wait(d, 1300); w.play('present', 'right'); await wait(d, 1200); hl.play('idle', 'left'); await wait(d, 300);
  } }
};

/** Resolves when the intro finishes or is skipped. Never throws: callers fall back to the plain panel. */
export async function playSceneIntro(s: Scenario, chapter: number, hearing: boolean, reduced: boolean): Promise<void> {
  const obj = s.objectiveId; const set = hearing ? SETTINGS['10'] : (VARIANTS.find(v => v[0].test(obj))?.[1] ?? SETTINGS[String(chapter)]); if (!set) return;
  const assets = await Assets.get(); const dir = new Director(); dir.reduced = reduced;
  const canvas = h('canvas', { class: 'seq-canvas', role: 'img', 'aria-label': `${set.label}. ${s.setup}` }) as HTMLCanvasElement;
  const label = h('div', { class: 'eyebrow' }, `${set.label} · ${s.title}`);
  const cap = h('p', { class: 'cap-text', 'aria-live': 'polite' }, s.setup);
  const skip = btn('Continue ▸', () => dir.skip(), 'skip small', { 'aria-label': 'Skip scene (S)' });
  const stageWrap = h('div', { class: 'seq-stage' }, canvas, h('div', { class: 'caption on' }, h('div', { class: 'cap-who' }, set.label), cap), skip, h('div', { class: 'bar top' }), h('div', { class: 'bar bot' }));
  const root = h('div', { class: 'seq', role: 'dialog', 'aria-label': s.title }, stageWrap, h('div', { class: 'seq-panel' }, label));
  document.getElementById('app')!.append(root);
  const stage = new Stage(canvas, assets); stage.reduced = reduced; stage.loadScene(set.scene); stage.rain = set.rain;
  const key = (e: KeyboardEvent) => { if (['s', 'S', 'Enter', ' '].includes(e.key)) { e.preventDefault(); dir.skip(); } };
  window.addEventListener('keydown', key, true);
  try { stage.focus(set.focus[0], set.focus[1], set.focus[2], true); stage.start(); await set.cast(stage, dir); await wait(dir, 1800); }
  finally { stage.stop(); window.removeEventListener('keydown', key, true); root.remove(); }
}
