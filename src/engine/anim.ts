// Reusable animation controller: any actor can play any clip from spec.ts in any direction. 'right' is the mirrored 'left'.
import { CLIPS, Dir, frameName } from './spec';
import { Assets } from './assets';

export type Clip = keyof typeof CLIPS;
export class Actor {
  x = 0; y = 0; dir: Dir = 'down'; clip: Clip = 'idle'; t = 0; done = false; visible = true; alpha = 1; hold = false;
  private speed = 0; private target: { x: number; y: number } | null = null; private onArrive: (() => void) | null = null;
  constructor(public id: string, public char: string, x = 0, y = 0) { this.x = x; this.y = y; }
  /** Plays a clip. For one-shot clips `done` flips true when the last frame has been shown for one frame-time. */
  play(clip: Clip, dir?: Dir) { if (this.clip === clip && (dir === undefined || dir === this.dir)) return; this.clip = clip; if (dir) this.dir = dir; this.t = 0; this.done = false; }
  face(dir: Dir) { this.dir = dir; }
  /** Resolves the (clip, dir) pair to something the sheet actually has, falling back to idle/down. */
  private resolved(a: Assets): { clip: string; dir: string; flip: boolean } {
    let clip: string = this.clip, dir: string = this.dir, flip = false;
    const def = CLIPS[clip]; if (!def) clip = 'idle';
    const d2 = CLIPS[clip].dirs; if (dir === 'right') { flip = true; dir = 'left'; }
    if (!d2.includes(dir as Dir)) { if (clip !== 'idle' && clip !== 'walk') { dir = d2.includes('down') ? 'down' : d2[0]; } else dir = 'down'; flip = false; }
    if (!a.has(frameName(this.char, clip, dir, 0))) { clip = 'idle'; dir = 'down'; flip = false; }
    return { clip, dir, flip };
  }
  frameIndex(): number { const d = CLIPS[this.clip] ?? CLIPS.idle; const f = Math.floor(this.t * d.fps); if (d.loop) return f % d.frames; return Math.min(f, d.frames - 1); }
  update(dt: number) {
    this.t += dt; const d = CLIPS[this.clip];
    if (d && !d.loop && this.t * d.fps >= d.frames) this.done = true;
    if (this.target) {
      const dx = this.target.x - this.x, dy = this.target.y - this.y, dist = Math.hypot(dx, dy), step = this.speed * dt;
      if (dist <= step) { this.x = this.target.x; this.y = this.target.y; this.target = null; this.play('idle'); const cb = this.onArrive; this.onArrive = null; cb?.(); }
      else { this.x += dx / dist * step; this.y += dy / dist * step; this.dir = Math.abs(dx) > Math.abs(dy) * 1.2 ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'); this.play('walk'); }
    }
  }
  /** Walks to a point; resolves on arrival. If `instant`, snaps there (used for skip and reduced motion). */
  walkTo(x: number, y: number, speed = 62, instant = false): Promise<void> {
    return new Promise(res => { if (instant) { this.x = x; this.y = y; this.target = null; this.play('idle'); return res(); } this.target = { x, y }; this.speed = speed; this.onArrive = res; });
  }
  /** Used by skip: snap any pending walk to its destination. */
  snap() { if (this.target) { this.x = this.target.x; this.y = this.target.y; const cb = this.onArrive; this.target = null; this.onArrive = null; this.play('idle'); cb?.(); } }
  draw(ctx: CanvasRenderingContext2D, a: Assets) {
    if (!this.visible) return; const r = this.resolved(a);
    a.draw(ctx, frameName(this.char, r.clip, r.dir, Math.min(this.frameIndex(), CLIPS[r.clip].frames - 1)), this.x, this.y, { flip: r.flip, alpha: this.alpha });
  }
}
