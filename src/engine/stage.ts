// Cinematic stage: 640x360 logical canvas, layered scene, depth-sorted actors/props, camera, lighting mask, rain, glows.
import { Assets } from './assets';
import { Actor } from './anim';

export const SW = 640, SH = 360;
export interface Prop { id: string; sprite: string; x: number; y: number; flip?: boolean; visible?: boolean; alpha?: number; lift?: number }
interface Light { x: number; y: number; r: number; color: string; a: number; flicker?: boolean }
interface Ripple { x: number; y: number; t: number }
interface Drop { x: number; y: number; vy: number; land: number }

export class Stage {
  cv: HTMLCanvasElement; ctx: CanvasRenderingContext2D; view = document.createElement('canvas'); vctx: CanvasRenderingContext2D; mask = document.createElement('canvas'); mctx: CanvasRenderingContext2D;
  actors: Actor[] = []; props: Prop[] = []; lights: Light[] = []; extraLights: Light[] = []; reduced = false;
  cam = { x: SW / 2, y: SH / 2, z: 1 }; private camTo = { x: SW / 2, y: SH / 2, z: 1 }; private shakeT = 0; private shakeA = 0;
  onFrame: (() => void) | null = null; time = 0; rain = true; policeLights = false; policeAt = { x: 440, y: 232 }; flash: { x: number; y: number; ang: number; on: boolean } | null = null; dim = 0.52; fade = 0;
  private drops: Drop[] = []; private ripples: Ripple[] = []; private raf = 0; private last = 0; private sceneId = 'alder'; private fx: { x: number; y: number; t: number; kind: string }[] = []; private running = false;
  constructor(public canvas: HTMLCanvasElement, public assets: Assets) {
    this.cv = canvas; this.cv.width = SW; this.cv.height = SH; this.ctx = canvas.getContext('2d')!; this.ctx.imageSmoothingEnabled = false;
    this.view.width = this.mask.width = SW; this.view.height = this.mask.height = SH; this.vctx = this.view.getContext('2d')!; this.mctx = this.mask.getContext('2d')!; this.vctx.imageSmoothingEnabled = false;
    for (let i = 0; i < 150; i++) this.drops.push(this.newDrop(true));
  }
  loadScene(id: string) { this.sceneId = id; const m = this.assets.scene(id); this.lights = m.lights.map(l => ({ ...l, flicker: false })); }
  private newDrop(init = false): Drop { const x = Math.random() * (SW + 60) - 30, y = init ? Math.random() * SH : -10; return { x, y, vy: 220 + Math.random() * 120, land: 222 + Math.random() * 126 }; }
  actor(id: string) { return this.actors.find(a => a.id === id)!; }
  prop(id: string) { return this.props.find(p => p.id === id)!; }
  focus(x: number, y: number, z = 1, instant = false) { this.camTo = { x, y, z }; if (instant || this.reduced) this.cam = { ...this.camTo }; }
  shake(a = 2, t = 0.25) { if (this.reduced) return; this.shakeA = a; this.shakeT = t; }
  spark(x: number, y: number) { this.fx.push({ x, y, t: 0, kind: 'spark' }); }
  start() { if (this.running) return; this.running = true; this.last = performance.now(); const loop = (t: number) => { if (!this.running) return; const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t; this.update(dt); this.render(); this.onFrame?.(); this.raf = requestAnimationFrame(loop); }; this.raf = requestAnimationFrame(loop); }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }
  update(dt: number) {
    this.time += dt; for (const a of this.actors) a.update(dt);
    const k = this.reduced ? 1 : 1 - Math.pow(0.001, dt); this.cam.x += (this.camTo.x - this.cam.x) * k; this.cam.y += (this.camTo.y - this.cam.y) * k; this.cam.z += (this.camTo.z - this.cam.z) * k;
    if (this.shakeT > 0) this.shakeT -= dt;
    if (this.rain && !this.reduced) for (const d of this.drops) { d.y += d.vy * dt; d.x -= 24 * dt; if (d.y >= d.land) { if (this.ripples.length < 36 && Math.random() < 0.5) this.ripples.push({ x: d.x, y: d.land, t: 0 }); Object.assign(d, this.newDrop()); } }
    for (const r of this.ripples) r.t += dt; this.ripples = this.ripples.filter(r => r.t < 0.5);
    for (const f of this.fx) f.t += dt; this.fx = this.fx.filter(f => f.t < 0.5);
  }
  render() {
    const c = this.vctx, A = this.assets, L = A.layers[this.sceneId];
    c.clearRect(0, 0, SW, SH); c.drawImage(L.bg, 0, 0);
    this.drawPuddleSheen(c);
    // depth-sorted drawables by foot y
    type D = { y: number; draw: () => void };
    const list: D[] = [];
    for (const p of this.props) if (p.visible !== false) list.push({ y: p.y, draw: () => { c.fillStyle = 'rgba(5,8,20,0.38)'; const f = A.info(p.sprite); if (f) { c.beginPath(); c.ellipse(p.x, p.y - 2, f.w * 0.46, 4, 0, 0, 7); c.fill(); } A.draw(c, p.sprite, p.x, p.y - (p.lift ?? 0), { flip: p.flip, alpha: p.alpha }); } });
    for (const a of this.actors) if (a.visible) list.push({ y: a.y, draw: () => { c.fillStyle = 'rgba(5,8,20,0.42)'; c.beginPath(); c.ellipse(a.x, a.y, 8, 3, 0, 0, 7); c.fill(); a.draw(c, A); } });
    list.sort((p, q) => p.y - q.y); for (const d of list) d.draw();
    c.drawImage(L.fg, 0, 0);
    this.drawReflections(c);
    if (this.rain) this.drawRain(c);
    for (const r of this.ripples) { const k = r.t / 0.5; c.strokeStyle = `rgba(190,210,255,${0.5 * (1 - k)})`; c.beginPath(); c.ellipse(r.x, r.y, 1 + k * 5, 0.5 + k * 2, 0, 0, 7); c.stroke(); }
    this.drawLighting(c);
    for (const f of this.fx) { const k = f.t / 0.5; A.draw(c, `fx/spark_${Math.min(3, Math.floor(k * 4))}`, f.x, f.y, { alpha: 1 - k * 0.6 }); }
    // vignette
    const g = c.createRadialGradient(SW / 2, SH / 2, SH * 0.45, SW / 2, SH / 2, SW * 0.62); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)'); c.fillStyle = g; c.fillRect(0, 0, SW, SH);
    if (this.fade > 0) { c.fillStyle = `rgba(0,0,0,${this.fade})`; c.fillRect(0, 0, SW, SH); }
    // camera blit
    const z = this.cam.z, vw = SW / z, vh = SH / z; let cx = Math.max(vw / 2, Math.min(SW - vw / 2, this.cam.x)), cy = Math.max(vh / 2, Math.min(SH - vh / 2, this.cam.y));
    if (this.shakeT > 0) { cx += (Math.random() - 0.5) * this.shakeA * 2; cy += (Math.random() - 0.5) * this.shakeA * 2; }
    this.ctx.drawImage(this.view, Math.round(cx - vw / 2), Math.round(cy - vh / 2), Math.round(vw), Math.round(vh), 0, 0, SW, SH);
  }
  private drawPuddleSheen(c: CanvasRenderingContext2D) { const m = this.assets.scene(this.sceneId); c.save(); c.globalCompositeOperation = 'lighter'; for (const p of m.puddles) { const sh = 0.05 + 0.03 * Math.sin(this.time * 1.5 + p.x); c.fillStyle = `rgba(120,150,230,${sh})`; c.beginPath(); c.ellipse(p.x + p.w / 2, p.y + p.h / 2, p.w / 2, p.h / 2, 0, 0, 7); c.fill(); } c.restore(); }
  private drawReflections(c: CanvasRenderingContext2D) {
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const l of this.lights.filter(l => l.r > 80)) { const g = c.createLinearGradient(0, 222, 0, 300); g.addColorStop(0, `rgba(255,214,138,${0.22 * l.a})`); g.addColorStop(1, 'rgba(255,214,138,0)'); c.fillStyle = g; c.fillRect(l.x - 3 + Math.sin(this.time * 2 + l.x) * 0.8, 222, 6, 78); }
    if (this.policeLights) { const ph = Math.floor(this.time * 4) % 2; const col = ph ? '255,60,60' : '70,110,255'; const g = c.createLinearGradient(0, 258, 0, 318); g.addColorStop(0, `rgba(${col},0.22)`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(this.policeAt.x - 10, 262, 20, 56); }
    c.restore();
  }
  private drawRain(c: CanvasRenderingContext2D) { c.strokeStyle = 'rgba(170,190,255,0.32)'; c.beginPath(); for (const d of this.drops) { c.moveTo(Math.round(d.x), Math.round(d.y)); c.lineTo(Math.round(d.x - 2), Math.round(d.y + 6)); } c.stroke(); }
  private drawLighting(c: CanvasRenderingContext2D) {
    const m = this.mctx; m.globalCompositeOperation = 'source-over'; m.clearRect(0, 0, SW, SH); m.fillStyle = `rgba(6,10,30,${this.dim})`; m.fillRect(0, 0, SW, SH);
    m.globalCompositeOperation = 'destination-out';
    const all = [...this.lights, ...this.extraLights];
    for (const l of all) { const fl = l.flicker && !this.reduced ? 0.85 + Math.random() * 0.15 : 1; const g = m.createRadialGradient(l.x, l.y, 2, l.x, l.y, l.r); g.addColorStop(0, `rgba(0,0,0,${Math.min(1, l.a * fl)})`); g.addColorStop(1, 'rgba(0,0,0,0)'); m.fillStyle = g; m.beginPath(); m.arc(l.x, l.y, l.r, 0, 7); m.fill(); }
    if (this.flash?.on) { const f = this.flash; m.save(); m.translate(f.x, f.y); m.rotate(f.ang); const g = m.createRadialGradient(0, 0, 2, 0, 0, 62); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); m.fillStyle = g; m.beginPath(); m.moveTo(0, 0); m.arc(0, 0, 62, -0.42, 0.42); m.closePath(); m.fill(); m.restore(); }
    c.drawImage(this.mask, 0, 0);
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const l of all) { const g = c.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r * 0.8); g.addColorStop(0, hexA(l.color, 0.22 * l.a)); g.addColorStop(1, hexA(l.color, 0)); c.fillStyle = g; c.beginPath(); c.arc(l.x, l.y, l.r * 0.8, 0, 7); c.fill(); }
    if (this.policeLights) { const ph = Math.floor(this.time * 4) % 2, col = ph ? '255,50,50' : '60,100,255', p = this.policeAt; const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 120); g.addColorStop(0, `rgba(${col},0.22)`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(p.x - 120, p.y - 120, 240, 240); c.fillStyle = `rgba(${col},0.9)`; c.fillRect(p.x - 6 + (ph ? 0 : 6), p.y - 2, 5, 3); }
    if (this.flash?.on) { const f = this.flash; c.translate(f.x, f.y); c.rotate(f.ang); const g = c.createRadialGradient(0, 0, 0, 0, 0, 62); g.addColorStop(0, 'rgba(255,244,200,0.45)'); g.addColorStop(1, 'rgba(255,244,200,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 62, -0.42, 0.42); c.closePath(); c.fill(); }
    c.restore();
  }
  /** Canvas-space (logical) point for a mouse event, accounting for CSS scaling and camera. */
  toLogical(e: MouseEvent) { const r = this.cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * SW, y: (e.clientY - r.top) / r.height * SH }; }
  /** Projects a world point to percent-of-canvas for HTML overlays. */
  project(x: number, y: number) { const z = this.cam.z, vw = SW / z, vh = SH / z, cx = Math.max(vw / 2, Math.min(SW - vw / 2, this.cam.x)), cy = Math.max(vh / 2, Math.min(SH - vh / 2, this.cam.y)); return { x: ((x - (cx - vw / 2)) * z) / SW * 100, y: ((y - (cy - vh / 2)) * z) / SH * 100 }; }
}
function hexA(h: string, a: number) { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
