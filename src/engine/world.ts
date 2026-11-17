import { Dir, LOOKS, PAL, T, drawCharacter, drawProp, drawTile, drawWindow } from './art';
import { sfx } from './audio';

export const W = 480, H = 272, COLS = 30, ROWS = 17;
export interface Interactable { id: string; x: number; y: number; label: string; }
export interface Npc { id: string; look: string; x: number; y: number; dir: Dir; cuffed?: boolean; }
export interface Prop { kind: string; x: number; y: number; w: number; h: number; solid: boolean; }
export interface MapDef { id: 'precinct' | 'alder'; theme: 'indoor' | 'street'; tiles: string[]; props: Prop[]; npcs: Npc[]; interactables: Interactable[]; rain: boolean; spawn: [number, number]; name: string; }

function grid(base: string) { return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => base)); }
function fill(g: string[][], x: number, y: number, w: number, h: number, c: string) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j]?.[i] !== undefined) g[j][i] = c; }
const rows = (g: string[][]) => g.map(r => r.join(''));

function precinct(): MapDef {
  const g = grid('.'); fill(g, 0, 0, COLS, 1, '#'); fill(g, 0, ROWS - 1, COLS, 1, '#'); fill(g, 0, 0, 1, ROWS, '#'); fill(g, COLS - 1, 0, 1, ROWS, '#'); g[16][14] = 'D';
  return { id: 'precinct', theme: 'indoor', name: 'Blackridge Precinct', tiles: rows(g), rain: false, spawn: [14, 13],
    props: [
      { kind: 'board', x: 3 * T, y: 1 * T, w: 96, h: 36, solid: true }, { kind: 'desk', x: 11 * T, y: 6 * T, w: 80, h: 24, solid: true },
      { kind: 'cabinet', x: 22 * T, y: 1 * T, w: 32, h: 28, solid: true }, { kind: 'cabinet', x: 24 * T, y: 1 * T, w: 32, h: 28, solid: true },
      { kind: 'plant', x: 27 * T, y: 1 * T, w: 16, h: 16, solid: true }, { kind: 'desk', x: 20 * T, y: 9 * T, w: 80, h: 24, solid: true }, { kind: 'plant', x: 1 * T, y: 14 * T, w: 16, h: 16, solid: true }
    ],
    npcs: [{ id: 'ward', look: 'ward', x: 12.5 * T, y: 8 * T, dir: 'down' }],
    interactables: [{ id: 'ward', x: 13 * T, y: 8.5 * T, label: 'Detective Ward' }, { id: 'board', x: 6 * T, y: 3.8 * T, label: 'Case board' }, { id: 'door', x: 14.5 * T, y: 15.5 * T, label: 'Exit to Alder Lane' }] };
}
function alder(): MapDef {
  const g = grid(','); fill(g, 0, 6, COLS, 2, 's'); fill(g, 0, 8, COLS, 4, '='); fill(g, 0, 12, COLS, 1, 's');
  fill(g, 2, 1, 9, 5, 'H'); g[5][6] = 'D'; fill(g, 17, 1, 11, 5, 'A'); g[5][22] = 'D';
  for (const [x, y] of [[0, 0], [12, 0], [14, 1], [15, 3], [29, 0], [1, 14], [10, 14], [12, 15], [16, 14], [20, 15], [26, 14], [28, 13], [14, 5]] as [number, number][]) g[y][x] = 'T';
  return { id: 'alder', theme: 'street', name: 'Alder Lane', tiles: rows(g), rain: true, spawn: [14, 7],
    props: [
      { kind: 'van', x: 3 * T, y: 13 * T - 2, w: 64, h: 22, solid: true }, { kind: 'car', x: 11 * T, y: 8 * T + 2, w: 48, h: 20, solid: true }, { kind: 'car2', x: 17 * T, y: 8 * T + 2, w: 48, h: 20, solid: true },
      { kind: 'patrol', x: 21 * T, y: 10 * T + 2, w: 48, h: 20, solid: true }, { kind: 'car', x: 25 * T, y: 10 * T + 2, w: 48, h: 20, solid: true },
      { kind: 'lamp', x: 9 * T, y: 4 * T + 8, w: 8, h: 16, solid: false }, { kind: 'lamp', x: 14 * T, y: 12 * T - 2, w: 8, h: 16, solid: false }, { kind: 'crates', x: 12 * T, y: 13 * T, w: 16, h: 16, solid: true }
    ],
    npcs: [
      { id: 'vance', look: 'vance', x: 9 * T, y: 6.2 * T, dir: 'left', cuffed: false }, { id: 'brooksA', look: 'brooks', x: 8 * T, y: 6.2 * T, dir: 'right' },
      { id: 'marla', look: 'marla', x: 21.2 * T, y: 6.2 * T, dir: 'down' }, { id: 'brooksB', look: 'brooks', x: 20.5 * T, y: 11.8 * T, dir: 'right' },
      { id: 'wardVan', look: 'ward', x: 7.5 * T, y: 12.3 * T, dir: 'left' }, { id: 'hale', look: 'hale', x: 8.7 * T, y: 13.2 * T, dir: 'up' }
    ],
    interactables: [
      { id: 'van', x: 6.6 * T, y: 12.6 * T, label: 'Command van' }, { id: 'houseDoor', x: 6.5 * T, y: 6.4 * T, label: '142 Alder Lane' },
      { id: 'vance', x: 9.5 * T, y: 6.7 * T, label: 'Vance (arrested)' }, { id: 'cars', x: 15.8 * T, y: 7.4 * T, label: 'Vehicles on the street' },
      { id: 'marla', x: 21.7 * T, y: 6.7 * T, label: 'Woman at Apartment 4C' }, { id: 'stop', x: 21 * T, y: 12.5 * T, label: 'Brooks\'s traffic stop' }
    ] };
}
export const MAPS: Record<string, () => MapDef> = { precinct, alder };

export class Input {
  down = new Set<string>(); private queue: string[] = [];
  constructor() {
    window.addEventListener('keydown', e => { const t = e.target as HTMLElement | null; if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return; const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'tab'].includes(k)) e.preventDefault();
      if (!this.down.has(k)) this.queue.push(k); this.down.add(k); });
    window.addEventListener('keyup', e => this.down.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.down.clear());
  }
  take(): string[] { const q = this.queue; this.queue = []; return q; }
  clear() { this.queue = []; this.down.clear(); }
}

export class World {
  map!: MapDef; px = 0; py = 0; dir: Dir = 'down'; frame = 0; t = 0; moving = false; frozen = false; targetId = ''; reduced = false;
  private stepAcc = 0; private base!: HTMLCanvasElement; private drops: { x: number; y: number; v: number }[] = []; private hover = ''; nearId = '';
  onInteract: (id: string) => void = () => {}; onHint: (msg: string) => void = () => {};
  private ctx: CanvasRenderingContext2D;
  constructor(private cv: HTMLCanvasElement, private input: Input) {
    this.ctx = cv.getContext('2d')!; cv.width = W; cv.height = H;
    for (let i = 0; i < 70; i++) this.drops.push({ x: Math.random() * W, y: Math.random() * H, v: 2 + Math.random() * 2 });
    cv.addEventListener('mousemove', e => { const p = this.toLogical(e); this.hover = this.interactableAt(p.x, p.y)?.id ?? ''; cv.style.cursor = this.hover ? 'pointer' : 'default'; });
    cv.addEventListener('click', e => { if (this.frozen) return; const p = this.toLogical(e); const it = this.interactableAt(p.x, p.y); if (!it) return; if (this.dist(it) < 44) this.onInteract(it.id); else this.onHint('Move closer to inspect that.'); });
  }
  private toLogical(e: MouseEvent) { const r = this.cv.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }; }
  private interactableAt(x: number, y: number) { return this.map.interactables.find(i => Math.hypot(i.x - x, i.y - y) < 20); }
  private dist(i: Interactable) { return Math.hypot(i.x - (this.px + 6), i.y - (this.py + 10)); }
  setMap(id: string, spawn?: [number, number]) {
    this.map = MAPS[id](); const s = spawn ?? this.map.spawn; this.px = s[0] * T; this.py = s[1] * T; this.bake();
  }
  setPosition(x: number, y: number) { this.px = x; this.py = y; }
  private bake() {
    const b = document.createElement('canvas'); b.width = W; b.height = H; const c = b.getContext('2d')!; c.imageSmoothingEnabled = false;
    this.map.tiles.forEach((row, ty) => [...row].forEach((code, tx) => drawTile(c, code, tx, ty, this.map.theme)));
    if (this.map.id === 'alder') {
      for (const tx of [3, 6.5, 8]) drawWindow(c, Math.floor(tx * T) + 2, 3 * T + 2, tx !== 6.5);
      for (const tx of [18, 20, 24, 26]) { drawWindow(c, tx * T + 1, 2 * T, tx % 4 === 0); drawWindow(c, tx * T + 1, 4 * T - 4, tx % 4 !== 0); }
      c.fillStyle = PAL.roadLine; for (let x = 0; x < W; x += 28) c.fillRect(x, 10 * T - 1, 16, 2);
    } else { for (const x of [8, 15, 20]) drawWindow(c, x * T, 0, false); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, W, 4); }
    this.base = b;
  }
  private solidAt(x: number, y: number, w: number, h: number) {
    const x0 = Math.floor(x / T), x1 = Math.floor((x + w - 1) / T), y0 = Math.floor(y / T), y1 = Math.floor((y + h - 1) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) { const c = this.map.tiles[ty]?.[tx]; if (c === undefined || '#HADT'.includes(c)) return true; }
    for (const p of this.map.props) if (p.solid && x < p.x + p.w && x + w > p.x && y < p.y + p.h && y + h > p.y) return true;
    for (const n of this.map.npcs) if (x < n.x + 10 && x + w > n.x && y < n.y + 14 && y + h > n.y + 6) return true;
    return false;
  }
  update(dt: number) {
    this.t += dt; const keys = this.input.take();
    if (this.frozen) { return; }
    for (const k of keys) { if (k === 'e' || k === 'enter') this.tryInteract(); }
    const d = this.input.down; let dx = 0, dy = 0;
    if (d.has('arrowleft') || d.has('a')) dx -= 1; if (d.has('arrowright') || d.has('d')) dx += 1; if (d.has('arrowup') || d.has('w')) dy -= 1; if (d.has('arrowdown') || d.has('s')) dy += 1;
    this.moving = !!(dx || dy);
    if (this.moving) {
      const sp = 78 * dt / (dx && dy ? 1.414 : 1), bx = this.px + 2, by = this.py + 9;
      if (!this.solidAt(bx + dx * sp, by, 8, 6)) this.px += dx * sp; if (!this.solidAt(this.px + 2, by + dy * sp, 8, 6)) this.py += dy * sp;
      this.dir = dx < 0 ? 'left' : dx > 0 ? 'right' : dy < 0 ? 'up' : 'down';
      this.stepAcc += dt; this.frame = Math.floor(this.t * 8) % 2 === 0 ? 1 : 2; if (this.stepAcc > 0.28) { this.stepAcc = 0; sfx.step(); }
    } else this.frame = 0;
    let best: Interactable | null = null, bd = 30; for (const i of this.map.interactables) { const dd = this.dist(i); if (dd < bd) { bd = dd; best = i; } } this.nearId = best?.id ?? '';
  }
  tryInteract() { if (this.nearId) this.onInteract(this.nearId); }
  render() {
    const c = this.ctx; c.imageSmoothingEnabled = false; c.drawImage(this.base, 0, 0);
    type Item = { y: number; draw: () => void }; const items: Item[] = [];
    for (const p of this.map.props) items.push({ y: p.y + p.h, draw: () => drawProp(c, p.kind, p.x, p.y) });
    for (const n of this.map.npcs) items.push({ y: n.y + 15, draw: () => drawCharacter(c, LOOKS[n.look], Math.round(n.x), Math.round(n.y), n.dir, 0, n.cuffed) });
    items.push({ y: this.py + 15, draw: () => drawCharacter(c, LOOKS.player, Math.round(this.px), Math.round(this.py), this.dir, this.frame) });
    items.sort((a, b) => a.y - b.y).forEach(i => i.draw());
    if (this.map.rain && !this.reduced) { c.fillStyle = 'rgba(160,180,220,.55)'; for (const d of this.drops) { d.y += d.v; d.x -= 0.6; if (d.y > H) { d.y = -4; d.x = Math.random() * W + 20; } c.fillRect(d.x, d.y, 1, 4); } }
    if (this.map.theme === 'street') { c.fillStyle = 'rgba(10,14,30,.22)'; c.fillRect(0, 0, W, H); }
    for (const i of this.map.interactables) {
      if (i.id === this.targetId) { const bob = this.reduced ? 0 : Math.sin(this.t * 4) * 2; c.fillStyle = PAL.amber; c.beginPath(); c.moveTo(i.x - 5, i.y - 26 + bob); c.lineTo(i.x + 5, i.y - 26 + bob); c.lineTo(i.x, i.y - 19 + bob); c.fill(); }
      if (i.id === this.nearId || i.id === this.hover) { const label = i.id === this.nearId ? `[E] ${i.label}` : i.label; c.font = '8px monospace'; const w = c.measureText(label).width + 8; c.fillStyle = 'rgba(10,14,28,.9)'; c.fillRect(i.x - w / 2, i.y - 40, w, 12); c.strokeStyle = PAL.amber; c.strokeRect(i.x - w / 2 + .5, i.y - 40 + .5, w - 1, 11); c.fillStyle = PAL.paper; c.fillText(label, i.x - w / 2 + 4, i.y - 31); }
    }
  }
}
