import { Img, ramp, mix, lighten, darken, rngSeed } from './pixel';

export interface Sprite { name: string; img: Img; ax?: number; ay?: number }
const out: Sprite[] = [];
const add = (name: string, img: Img, ax?: number, ay?: number) => out.push({ name, img, ax, ay });

// ───── vehicles (side view, facing LEFT; viewer sees the driver's side) ─────
function car(opts: { body: string; w?: number; open?: number; patrol?: boolean; occupied?: boolean; van?: boolean; suv?: boolean }): Img {
  const W = opts.van ? 86 : 70, H = opts.van ? 44 : 36, g = new Img(W, H), c = ramp(opts.body), r = rngSeed(7);
  const top = opts.van ? 3 : opts.suv ? 5 : 9, belt = opts.van ? 26 : 22, bot = H - 7;
  // lower body
  g.poly([[2, belt], [5, belt - 5], [W - 6, belt - 6], [W - 2, belt - 1], [W - 1, bot - 1], [W - 3, bot + 1], [2, bot + 1], [1, belt + 6]], (x, y) => y < belt - 1 ? c.hi : y > bot - 3 ? c.sh : c.base);
  // cabin
  const cl = opts.van ? 6 : 17, cr = opts.van ? W - 6 : W - 17;
  g.poly(opts.van ? [[cl, belt - 4], [cl + 3, top], [cr - 14, top], [cr - 4, top + 4], [cr, belt - 4]] : [[cl, belt - 5], [cl + 7, top], [cr - 5, top], [cr + 3, belt - 5]], (x, y) => y < top + 3 ? c.hi : c.base);
  // windows
  const wy = top + 2, wh = belt - 6 - wy;
  const glass = (x0: number, x1: number) => g.poly([[x0, wy + wh], [x0 + 3, wy], [x1 - 2, wy], [x1, wy + wh]], (x, y) => ((x - y) % 9 === 0 ? '#6b87b8' : y < wy + 3 ? '#3a4b6e' : '#26324d'));
  if (opts.van) { glass(cl + 9, cl + 24); } else { glass(cl + 4, W / 2 - 2); glass(W / 2 + 2, cr - 1); }
  if (opts.occupied) { g.ellipse(W / 2 + 12, wy + 6, 2.6, 3, '#d9a07a'); g.ellipse(W / 2 + 12, wy + 5, 2.8, 2, '#1a1410'); g.rect(W / 2 + 9, wy + 9, 7, 3, '#e8a23a'); g.set(W / 2 + 11, wy + 6, '#1a1a24'); g.set(W / 2 + 14, wy + 6, '#1a1a24'); }
  // door seams / handles (driver door = front door), closed state
  const dx0 = opts.van ? 30 : Math.round(W / 2 - 14), dx1 = opts.van ? 58 : Math.round(W / 2 + 1);
  const open = opts.open ?? 0;
  if (open === 0) {
    g.vline(dx0, belt - 4, bot - belt + 4, c.dk); g.vline(dx1, belt - 4, bot - belt + 4, c.dk); g.rect(dx1 - 5, belt - 1, 4, 1, c.glow);
  } else {
    // open driver door: dark interior where door was, door swings toward viewer about the FRONT hinge (left edge, dx0)
    g.rect(dx0 + 1, belt - 4, dx1 - dx0 - 1, bot - belt + 2, '#14161f'); g.rect(dx0 + 2, belt - 3, dx1 - dx0 - 3, 6, '#2d3858'); g.rect(dx0 + 3, belt + 3, dx1 - dx0 - 5, 5, '#3a2a22');
    const th = (open / 3) * (Math.PI / 2 * 0.85), len = dx1 - dx0, fx = dx0 + len * Math.cos(th), fy = 9 * Math.sin(th), hy0 = belt - 4, hy1 = bot - 1;
    g.poly([[dx0, hy0], [fx, hy0 + fy], [fx, hy1 + fy], [dx0, hy1]], (x, y) => (y < hy0 + fy + 6 ? c.hi : c.base));
    g.poly([[dx0 + 1, hy0 + 1], [fx - 1, hy0 + fy + 1], [fx - 1, hy0 + fy + 7], [dx0 + 1, hy0 + 6]], '#26324d');
    g.line(fx, hy0 + fy, fx, hy1 + fy, c.dk); g.set(fx - 2, hy0 + fy + 9, c.glow);
  }
  // wheels
  const wheel = (cx: number) => { g.ellipse(cx, bot + 1, 7, 6.5, '#111319'); g.ellipse(cx, bot + 1, 4.2, 4, '#2a2e3a'); g.ellipse(cx - 0.5, bot + 0.5, 2.3, 2.3, '#8895b3'); g.set(cx - 1, bot - 0.5, '#e8edf5'); g.set(cx + 4, bot + 6, '#0a0c16'); };
  wheel(opts.van ? 16 : 14); wheel(opts.van ? W - 18 : W - 15);
  // lights, bumpers, plate
  g.rect(0, belt - 3, 3, 4, '#fff0b8'); g.rect(0, belt + 1, 3, 2, '#c9a24a'); g.rect(W - 3, belt - 3, 3, 4, '#d9453b'); g.rect(0, bot - 1, 4, 3, '#8895b3'); g.rect(W - 4, bot - 1, 4, 3, '#8895b3'); g.rect(W - 14, belt + 4, 8, 4, '#e8dcc0'); g.hline(W - 13, belt + 6, 6, '#6a6a7a');
  if (opts.patrol) {
    g.rect(0, belt + 5, W, 6, '#1c2a52'); g.hline(0, belt + 5, W, '#243a6b'); g.rect(dx0 + 3, belt + 5, 10, 6, '#e8edf5'); g.rect(W - 30, belt + 4, 18, 1, '#c9a24a');
    g.rect(W / 2 - 8, top - 3, 14, 3, '#2a2e3a'); g.rect(W / 2 - 8, top - 3, 5, 3, '#6b2a2a'); g.rect(W / 2 + 1, top - 3, 5, 3, '#2a3b6b');
  }
  if (opts.van) { g.rect(2, belt + 4, W - 4, 3, '#b8453a'); g.rect(2, belt + 8, W - 4, 2, '#243a6b'); g.ellipse(52, belt - 2, 7, 5, '#243a6b'); g.ellipse(52, belt - 2, 4.5, 3, '#c9a24a'); g.rect(W - 12, 6, 4, 18, c.sh); g.rect(30, 3, 1, 24, c.sh); }
  // roof sheen + wet highlight
  g.hline(cl + 8, top + 1, 14, '#ffffff'); g.hline(2, belt - 1, 10, c.glow);
  for (let i = 0; i < 16; i++) g.set(4 + Math.floor(r() * (W - 8)), belt + 1 + Math.floor(r() * (bot - belt - 3)), c.sh);
  g.outline(0.7); return g;
}
for (let o = 0; o < 4; o++) add(`veh/sedan_${o}`, car({ body: '#3b6fa8', open: o }), 35, 36);
add('veh/sedan2', car({ body: '#9a3d3a' }), 35, 36);
add('veh/patrol', car({ body: '#e9edf2', patrol: true }), 35, 36);
add('veh/patrol_occ', car({ body: '#e9edf2', patrol: true, occupied: true }), 35, 36);
add('veh/van', car({ body: '#e9edf2', van: true }), 43, 44);

// ───── street props ─────
function lamp(): Img { const g = new Img(18, 72); const m = '#2d3858'; g.rect(7, 12, 3, 58, '#3a4668'); g.rect(8, 12, 1, 58, '#56658f'); g.rect(4, 66, 10, 4, '#2a3250'); g.rect(5, 64, 8, 2, '#3a4668'); g.poly([[2, 8], [16, 8], [14, 3], [4, 3]], '#2a3250'); g.rect(4, 8, 10, 3, '#fff0b8'); g.rect(6, 9, 6, 1, '#ffffff'); g.hline(3, 2, 12, '#56658f'); g.outline(0.6); void m; return g; }
add('prop/lamp', lamp(), 9, 72);
function bush(sz: number, seed: number): Img { const g = new Img(sz, Math.round(sz * 0.7)), r = rngSeed(seed), c = ramp('#2f5d3c'); const h = g.h; for (let i = 0; i < 7; i++) g.ellipse(sz * (0.2 + r() * 0.6), h * (0.4 + r() * 0.3), sz * 0.26, h * 0.34, (x, y) => y < h * 0.42 ? c.hi : y > h * 0.66 ? c.dk : c.base); g.ellipse(sz * 0.4, h * 0.3, sz * 0.15, h * 0.1, lighten(c.hi, 0.1)); for (let i = 0; i < 10; i++) g.set(Math.floor(r() * sz), Math.floor(h * (0.3 + r() * 0.5)), c.glow); g.outline(0.7); return g; }
add('prop/bush_a', bush(34, 3), 17, 24); add('prop/bush_b', bush(24, 9), 12, 17);
function bin(): Img { const g = new Img(14, 18); const c = ramp('#4a5470'); g.poly([[1, 4], [13, 4], [12, 17], [2, 17]], (x) => x < 5 ? c.hi : x > 9 ? c.sh : c.base); g.rect(0, 2, 14, 3, c.hi); g.rect(5, 0, 4, 2, c.dk); for (let x = 4; x < 12; x += 3) g.vline(x, 7, 8, c.dk); g.outline(0.7); return g; }
add('prop/bin', bin(), 7, 18);
function mailbox(): Img { const g = new Img(12, 26); g.rect(5, 12, 2, 13, '#4a3a2a'); g.rect(1, 3, 10, 9, '#2f4f8a'); g.rect(1, 3, 10, 2, '#4a6fb8'); g.rect(9, 4, 2, 5, '#d9453b'); g.set(3, 7, '#e8edf5'); g.outline(0.7); return g; }
add('prop/mailbox', mailbox(), 6, 26);
function fence(): Img { const g = new Img(16, 22); g.rect(0, 5, 16, 3, '#d9c9a3'); g.rect(0, 14, 16, 3, '#d9c9a3'); g.rect(0, 8, 16, 1, '#b0a07a'); for (const x of [2, 10]) { g.poly([[x, 2], [x + 2, 0], [x + 4, 2], [x + 4, 21], [x, 21]], '#e8dcc0'); g.vline(x + 3, 2, 19, '#b0a07a'); g.set(x + 1, 3, '#ffffff'); } g.outline(0.6); return g; }
add('prop/fence', fence(), 8, 22);
function crate(): Img { const g = new Img(18, 18); g.rect(0, 0, 18, 18, '#8a5a36'); g.rect(1, 1, 16, 16, '#a8703f'); g.rect(1, 8, 16, 2, '#6a4528'); g.line(2, 2, 15, 15, '#7a4e2e'); g.rect(0, 0, 2, 18, '#6a4528'); g.rect(16, 0, 2, 18, '#6a4528'); g.outline(0.6); return g; }
add('prop/crate', crate(), 9, 18);
function cone(): Img { const g = new Img(10, 14); g.poly([[3, 2], [7, 2], [9, 12], [1, 12]], (x, y) => (y % 5 < 2 ? '#e8edf5' : '#e8782a')); g.rect(0, 12, 10, 2, '#2a2e3a'); g.outline(0.6); return g; }
add('prop/cone', cone(), 5, 14);
function tent(n: number): Img { const g = new Img(12, 17), d: Record<number, string[]> = { 1: ['010', '110', '010', '010', '111'], 2: ['110', '001', '010', '100', '111'], 3: ['110', '001', '010', '001', '110'], 4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '110', '001', '110'], 6: ['011', '100', '110', '101', '010'] }; g.poly([[2, 16], [10, 16], [8, 1], [4, 1]], (x, y) => (x < 6 ? '#ffd84a' : '#d9a82e')); g.rect(2, 15, 8, 2, '#a07a1e'); (d[n] ?? d[1]).forEach((row, j) => [...row].forEach((v, i) => { if (v === '1') { g.set(4 + i * 1.5 + 0, 5 + j * 1.6, '#1a1a24'); g.set(5 + i * 1.5, 5 + j * 1.6, '#1a1a24'); } })); g.outline(0.6); return g; }
for (let n = 1; n <= 6; n++) add(`prop/tent_${n}`, tent(n), 6, 17);
// ───── evidence items (16x16) ─────
function ev(kind: string): Img {
  const g = new Img(16, 16);
  if (kind === 'baggie') { g.poly([[3, 4], [13, 4], [12, 14], [4, 14]], '#dfeaf2'); g.rect(3, 3, 10, 2, '#b8453a'); g.ellipse(8, 10, 3, 2.6, '#f4f4f4'); g.set(7, 9, '#ffffff'); g.line(4, 6, 4, 12, '#ffffff'); }
  if (kind === 'pills') { g.poly([[3, 4], [13, 4], [12, 14], [4, 14]], '#dfeaf2'); g.rect(3, 3, 10, 2, '#b8453a'); for (const [x, y, c] of [[6, 9, '#e8782a'], [9, 10, '#d9453b'], [7, 12, '#f0f0f0'], [10, 8, '#e8782a']] as [number, number, string][]) g.ellipse(x, y, 1.6, 1.2, c); }
  if (kind === 'blade') { g.poly([[2, 11], [12, 4], [13, 6], [4, 13]], '#c8d4e8'); g.line(3, 11, 12, 5, '#ffffff'); g.rect(10, 8, 4, 3, '#f4f4f4'); g.set(11, 9, '#ffffff'); g.rect(1, 12, 4, 2, '#4a5470'); }
  if (kind === 'knife') { g.poly([[2, 9], [10, 7], [10, 10], [2, 11]], '#c8d4e8'); g.hline(3, 9, 6, '#ffffff'); g.rect(10, 6, 5, 5, '#2a2e3a'); g.rect(11, 7, 3, 1, '#4a5470'); }
  if (kind === 'ledger') { g.rect(3, 2, 10, 12, '#e8dcc0'); g.rect(3, 2, 2, 12, '#7a2f2f'); for (let y = 4; y < 13; y += 2) g.hline(6, y, 6, '#9a8f70'); g.set(11, 3, '#d9453b'); }
  if (kind === 'laptop') { g.poly([[2, 4], [14, 4], [14, 10], [2, 10]], '#3a4668'); g.rect(3, 5, 10, 4, '#6b87b8'); g.rect(1, 11, 14, 3, '#8895b3'); g.hline(2, 12, 12, '#56658f'); }
  g.outline(0.65); g.rim('#ffffff', 0.25); return g;
}
for (const k of ['baggie', 'pills', 'blade', 'knife', 'ledger', 'laptop']) add(`ev/${k}`, ev(k), 8, 15);
// fx sprites
for (let i = 0; i < 4; i++) { const g = new Img(11, 11); const s = [2, 3, 4, 2][i]; g.line(5, 5 - s, 5, 5 + s, '#fff0b8'); g.line(5 - s, 5, 5 + s, 5, '#fff0b8'); g.set(5, 5, '#ffffff'); if (i === 1 || i === 2) { g.set(3, 3, '#ffd77a'); g.set(7, 7, '#ffd77a'); g.set(3, 7, '#ffd77a'); g.set(7, 3, '#ffd77a'); } add(`fx/spark_${i}`, g, 5, 5); }
// ───── precinct furniture ─────
function desk(w = 60, flip = false): Img {
  const g = new Img(w, 44), wood = ramp('#8a5a36'); g.poly([[0, 22], [w, 22], [w, 38], [0, 38]], (x, y) => (y < 25 ? wood.hi : wood.base)); g.rect(0, 38, w, 3, wood.dk); g.rect(2, 41, 4, 3, wood.dk); g.rect(w - 6, 41, 4, 3, wood.dk);
  g.rect(w - 14, 26, 10, 10, wood.sh); g.hline(w - 13, 31, 8, wood.dk); g.set(w - 9, 29, '#c9a24a');
  if (!flip) { g.rect(w / 2 - 12, 8, 24, 14, '#14161f'); g.rect(w / 2 - 11, 9, 22, 11, '#2a5a8a'); g.rect(w / 2 - 9, 11, 10, 1, '#9db4d4'); g.rect(w / 2 - 9, 14, 14, 1, '#6b87b8'); g.rect(w / 2 - 3, 22, 6, 2, '#14161f'); g.rect(w / 2 - 8, 25, 16, 3, '#2a2e3a'); g.hline(w / 2 - 7, 26, 14, '#56658f'); }
  g.rect(4, 24, 12, 8, '#e8dcc0'); g.hline(5, 26, 9, '#9a8f70'); g.hline(5, 28, 7, '#9a8f70'); g.rect(6, 22, 12, 8, '#d6c79d'); g.ellipse(w - 22, 25, 3, 2, '#e8e8e8'); g.rect(w - 25, 22, 6, 4, '#d9453b'); g.outline(0.65); return g;
}
add('off/desk', desk(), 30, 44); add('off/desk_s', desk(48), 24, 44);
function chair(): Img { const g = new Img(18, 28); g.rect(3, 0, 12, 14, '#2a2e3a'); g.rect(4, 1, 10, 11, '#3a4668'); g.rect(2, 14, 14, 5, '#2a2e3a'); g.rect(8, 19, 2, 6, '#56658f'); g.hline(3, 26, 12, '#14161f'); g.outline(0.6); return g; }
add('off/chair', chair(), 9, 28);
function cabinet(): Img { const g = new Img(36, 52), m = ramp('#56658f'); g.rect(0, 0, 36, 50, m.base); g.rect(0, 0, 36, 4, m.hi); g.rect(0, 46, 36, 4, m.dk); for (let i = 0; i < 3; i++) { g.rect(2, 6 + i * 14, 32, 12, m.sh); g.rect(3, 7 + i * 14, 30, 10, m.base); g.rect(13, 11 + i * 14, 10, 2, m.dk); g.set(14, 12 + i * 14, m.glow); } g.outline(0.65); return g; }
add('off/cabinet', cabinet(), 18, 52);
function locker(): Img { const g = new Img(60, 58), m = ramp('#3d4a6e'); g.rect(0, 0, 60, 56, m.dk); for (let i = 0; i < 4; i++) { g.rect(2 + i * 14, 2, 13, 52, m.base); g.rect(2 + i * 14, 2, 13, 3, m.hi); g.rect(4 + i * 14, 8, 9, 3, m.dk); g.rect(4 + i * 14, 12, 9, 1, m.dk); g.rect(10 + i * 14, 30, 2, 5, '#c9a24a'); g.rect(5 + i * 14, 40, 7, 8, '#e8dcc0'); g.hline(6 + i * 14, 43, 5, '#9a8f70'); } g.outline(0.65); return g; }
add('off/lockers', locker(), 30, 58);
function board(): Img { const g = new Img(104, 48); g.rect(0, 0, 104, 48, '#5a3a22'); g.rect(3, 3, 98, 42, '#6b7a55'); g.rect(3, 3, 98, 2, '#7d8c66'); const r = rngSeed(5); const pts: [number, number][] = []; for (let i = 0; i < 9; i++) { const x = 8 + (i % 5) * 18 + Math.floor(r() * 4), y = 7 + Math.floor(i / 5) * 19 + Math.floor(r() * 4); pts.push([x + 6, y + 3]); g.rect(x, y, 13, i % 3 === 0 ? 15 : 11, i % 2 ? '#e8dcc0' : '#f1e6c8'); g.hline(x + 2, y + 4, 8, '#9a8f70'); g.hline(x + 2, y + 7, 6, '#9a8f70'); g.rect(x + 5, y - 1, 2, 2, '#d9453b'); } for (let i = 0; i + 1 < pts.length; i += 2) g.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], '#b8453a'); g.rect(40, 34, 24, 9, '#14161f'); g.hline(42, 37, 20, '#e8dcc0'); g.hline(42, 40, 14, '#e8dcc0'); g.outline(0.6); return g; }
add('off/board', board(), 52, 48);
function plant(): Img { const g = new Img(20, 34), c = ramp('#2f5d3c'); g.rect(5, 22, 10, 11, '#7a4a2a'); g.rect(5, 22, 10, 2, '#a8703f'); for (const [x, y, rx] of [[10, 12, 6], [6, 16, 4], [14, 16, 4], [10, 6, 4]]) g.ellipse(x, y, rx, 6, (px, py) => (py < y - 2 ? c.hi : c.base)); g.outline(0.7); return g; }
add('off/plant', plant(), 10, 34);
function cooler(): Img { const g = new Img(16, 38); g.rect(2, 12, 12, 24, '#cfd8e8'); g.rect(2, 12, 12, 3, '#ffffff'); g.rect(4, 0, 8, 13, '#6bb8e8'); g.rect(5, 1, 3, 10, '#a8d8f8'); g.rect(6, 20, 4, 3, '#2a2e3a'); g.rect(2, 34, 12, 3, '#8895b3'); g.outline(0.6); return g; }
add('off/cooler', cooler(), 8, 38);
function copier(): Img { const g = new Img(34, 30); g.rect(0, 6, 34, 22, '#cfd8e8'); g.rect(0, 6, 34, 3, '#ffffff'); g.rect(2, 2, 30, 5, '#8895b3'); g.rect(4, 13, 12, 8, '#2a3250'); g.rect(20, 13, 10, 3, '#3f8a86'); g.set(22, 14, '#9ff0c0'); g.rect(0, 28, 34, 2, '#56658f'); g.outline(0.6); return g; }
add('off/copier', copier(), 17, 30);
function rugC(): Img { const g = new Img(120, 60); g.rect(0, 0, 120, 60, '#5a2f3a'); g.rect(3, 3, 114, 54, '#7a3a4a'); g.rect(8, 8, 104, 44, '#5a2f3a'); for (let i = 0; i < 6; i++) g.rect(14 + i * 17, 14, 9, 32, i % 2 ? '#8a4a5a' : '#6a3a4a'); g.outline(0.5); return g; }
add('off/rug', rugC(), 60, 60);
export const SPRITES = out;
