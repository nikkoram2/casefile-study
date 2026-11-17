// Loads the generated atlas + scene layers (embedded as data URLs by esbuild) and draws frames by name.
import atlasUrl from '../assets/generated/atlas.png';
import alderBg from '../assets/generated/alder_bg.png';
import alderFg from '../assets/generated/alder_fg.png';
import meta from '../assets/generated/atlas.json';

export interface FrameInfo { x: number; y: number; w: number; h: number; ax: number; ay: number }
export interface SceneMeta { lights: { x: number; y: number; r: number; color: string; a: number }[]; puddles: { x: number; y: number; w: number; h: number }[]; walk: { x0: number; y0: number; x1: number; y1: number }; w: number; h: number }
const frames = (meta as any).frames as Record<string, FrameInfo>;
const scenes = (meta as any).scenes as Record<string, SceneMeta>;
const load = (src: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('image failed: ' + src.slice(0, 40))); i.src = src; });

export class Assets {
  atlas!: HTMLImageElement; layers: Record<string, { bg: HTMLImageElement; fg: HTMLImageElement }> = {};
  private static p?: Promise<Assets>;
  static get(): Promise<Assets> { return (Assets.p ??= (async () => { const a = new Assets(); a.atlas = await load(atlasUrl); a.layers.alder = { bg: await load(alderBg), fg: await load(alderFg) }; return a; })()); }
  has(name: string) { return !!frames[name]; }
  info(name: string) { return frames[name]; }
  scene(id: string) { return scenes[id]; }
  /** Draws a frame with its anchor at (x, y). `flip` mirrors horizontally around the anchor. */
  draw(ctx: CanvasRenderingContext2D, name: string, x: number, y: number, o: { flip?: boolean; alpha?: number; scale?: number } = {}) {
    const f = frames[name]; if (!f) return false; const s = o.scale ?? 1;
    ctx.save(); if (o.alpha !== undefined) ctx.globalAlpha = o.alpha; ctx.translate(Math.round(x), Math.round(y));
    if (o.flip) ctx.scale(-1, 1); ctx.drawImage(this.atlas, f.x, f.y, f.w, f.h, -f.ax * s, -f.ay * s, f.w * s, f.h * s); ctx.restore(); return true;
  }
}
