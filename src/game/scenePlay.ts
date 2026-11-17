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
  const set = SETTINGS[hearing ? '10' : String(chapter)]; if (!set) return;
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
