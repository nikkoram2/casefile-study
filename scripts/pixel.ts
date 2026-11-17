// Tiny pixel-art toolkit: RGBA buffer, shapes, selective outline, dithering, noise. No anti-aliasing anywhere.
import sharp from 'sharp';
export type RGBA = [number, number, number, number];
export const hex = (s: string, a = 255): RGBA => { const n = parseInt(s.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a]; };
export const toHex = (c: RGBA) => '#' + [c[0], c[1], c[2]].map(v => v.toString(16).padStart(2, '0')).join('');
export const mix = (a: string, b: string, t: number) => { const A = hex(a), B = hex(b); return toHex([0, 1, 2].map(i => Math.round(A[i] + (B[i] - A[i]) * t)) as unknown as RGBA); };
export const lighten = (c: string, t = 0.2) => mix(c, '#ffffff', t);
export const darken = (c: string, t = 0.25) => mix(c, '#0a0c16', t);
export const ramp = (c: string) => ({ dk: darken(c, 0.38), sh: darken(c, 0.2), base: c, hi: lighten(c, 0.22), glow: lighten(c, 0.45) });
export function rngSeed(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export class Img {
  data: Uint8ClampedArray;
  constructor(public w: number, public h: number) { this.data = new Uint8ClampedArray(w * h * 4); }
  inb(x: number, y: number) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  set(x: number, y: number, c: string | RGBA) {
    x = Math.round(x); y = Math.round(y); if (!this.inb(x, y)) return; const C = typeof c === 'string' ? hex(c) : c; const i = (y * this.w + x) * 4;
    if (C[3] === 255) { this.data[i] = C[0]; this.data[i + 1] = C[1]; this.data[i + 2] = C[2]; this.data[i + 3] = 255; return; }
    const a = C[3] / 255, ba = this.data[i + 3] / 255, oa = a + ba * (1 - a); if (oa === 0) return;
    for (let k = 0; k < 3; k++) this.data[i + k] = (C[k] * a + this.data[i + k] * ba * (1 - a)) / oa; this.data[i + 3] = oa * 255;
  }
  get(x: number, y: number): RGBA { if (!this.inb(x, y)) return [0, 0, 0, 0]; const i = (y * this.w + x) * 4; return [this.data[i], this.data[i + 1], this.data[i + 2], this.data[i + 3]]; }
  rect(x: number, y: number, w: number, h: number, c: string | RGBA) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  hline(x: number, y: number, w: number, c: string) { this.rect(x, y, w, 1, c); }
  vline(x: number, y: number, h: number, c: string) { this.rect(x, y, 1, h, c); }
  line(x0: number, y0: number, x1: number, y1: number, c: string) { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; for (;;) { this.set(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } }
  thick(x0: number, y0: number, x1: number, y1: number, w: number, c: string) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0))); for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; this.rect(Math.round(x - w / 2 + 0.01), Math.round(y - w / 2 + 0.01), w, w, c); } }
  ellipse(cx: number, cy: number, rx: number, ry: number, c: string | ((x: number, y: number) => string | null)) { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) { const col = typeof c === 'function' ? c(x, y) : c; if (col) this.set(x, y, col); } } }
  poly(pts: [number, number][], c: string | ((x: number, y: number) => string | null)) { const ys = pts.map(p => p[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys)); for (let y = y0; y <= y1; y++) { const xs: number[] = []; for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= y + 0.5 && by > y + 0.5) || (by <= y + 0.5 && ay > y + 0.5)) xs.push(ax + ((y + 0.5 - ay) / (by - ay)) * (bx - ax)); } xs.sort((a, b) => a - b); for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) { const col = typeof c === 'function' ? c(x, y) : c; if (col) this.set(x, y, col); } } }
  blit(src: Img, dx: number, dy: number, o: { flip?: boolean; alpha?: number } = {}) { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const p = src.get(o.flip ? src.w - 1 - x : x, y); if (p[3]) this.set(dx + x, dy + y, [p[0], p[1], p[2], Math.round(p[3] * (o.alpha ?? 1))]); } }
  /** 1px outline around opaque pixels, tinted from the neighbouring pixel colour (selective outline). */
  outline(strength = 0.62, tint?: string) { const out: [number, number, RGBA][] = []; for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { if (this.get(x, y)[3]) continue; let n: RGBA | null = null; for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const p = this.get(x + ox, y + oy); if (p[3] === 255) { n = p; break; } } if (n) { const t = tint ? hex(tint) : n; out.push([x, y, [Math.round(t[0] * (1 - strength)), Math.round(t[1] * (1 - strength)), Math.round(t[2] * (1 - strength) + 6), 255]]); } } for (const [x, y, c] of out) this.set(x, y, c); return this; }
  /** Apply a top-left rim highlight to opaque pixels that border transparency to their upper-left. */
  rim(c: string, t = 0.35) { const upd: [number, number, string][] = []; for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const p = this.get(x, y); if (p[3] !== 255) continue; if (this.get(x - 1, y)[3] === 0 || this.get(x, y - 1)[3] === 0) { upd.push([x, y, mix(toHex(p), c, t)]); } } for (const [x, y, col] of upd) this.set(x, y, col); return this; }
  dither(x: number, y: number, w: number, h: number, c: string, density = 0.5, r: () => number = Math.random) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (((i + j) & 1) === 0 && r() < density * 2) this.set(x + i, y + j, c); }
  noise(x: number, y: number, w: number, h: number, cols: string[], r: () => number) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, cols[Math.floor(r() * cols.length)]); }
  sub(x: number, y: number, w: number, h: number) { const o = new Img(w, h); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const p = this.get(x + i, y + j); const k = (j * w + i) * 4; o.data[k] = p[0]; o.data[k + 1] = p[1]; o.data[k + 2] = p[2]; o.data[k + 3] = p[3]; } return o; }
  async save(path: string) { await sharp(Buffer.from(this.data.buffer), { raw: { width: this.w, height: this.h, channels: 4 } }).png({ compressionLevel: 9 }).toFile(path); }
  async scaled(path: string, k: number) { await sharp(Buffer.from(this.data.buffer), { raw: { width: this.w, height: this.h, channels: 4 } }).resize(this.w * k, this.h * k, { kernel: 'nearest' }).png().toFile(path); }
}
