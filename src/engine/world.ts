// Walkable world built on the Stage: PNG scene layers, animated actors, lighting, rain. Public surface is unchanged for game.ts.
import { Assets } from './assets';
import { Actor } from './anim';
import { Stage, SW, SH } from './stage';
import { sfx } from './audio';
import type { Dir } from './spec';

export const W = SW, H = SH;
export interface Interactable { id: string; x: number; y: number; label: string }
interface Blocker { x: number; y: number; w: number; h: number }
interface NpcDef { id: string; char: string; x: number; y: number; dir: Dir; clip?: string; roam?: [number, number, number, number] }
interface PropDef { id: string; sprite: string; x: number; y: number; flip?: boolean }
export interface MapDef { id: 'precinct' | 'alder'; name: string; rain: boolean; spawn: [number, number]; props: PropDef[]; npcs: NpcDef[]; interactables: Interactable[]; blockers: Blocker[]; walk: Blocker; dim: number; police?: [number, number] }

function precinct(): MapDef {
  const desks: [number, number][] = [[200, 232], [440, 232], [140, 306], [520, 300]];
  return { id: 'precinct', name: 'Blackridge Precinct', rain: false, spawn: [320, 300], dim: 0.2,
    walk: { x: 24, y: 150, w: 592, h: 196 },
    props: [
      { id: 'board', sprite: 'off/board', x: 320, y: 110 }, { id: 'cab', sprite: 'off/cabinet', x: 60, y: 130 }, { id: 'copier', sprite: 'off/copier', x: 140, y: 134 }, { id: 'lock', sprite: 'off/lockers', x: 560, y: 132 },
      { id: 'plant', sprite: 'off/plant', x: 30, y: 342 }, { id: 'cool', sprite: 'off/cooler', x: 610, y: 204 }, { id: 'plant2', sprite: 'off/plant', x: 608, y: 344 },
      ...desks.map<PropDef>(([x, y], i) => ({ id: 'desk' + i, sprite: i % 2 ? 'off/desk_s' : 'off/desk', x, y })),
      { id: 'ch0', sprite: 'off/chair', x: 200, y: 262 }, { id: 'ch1', sprite: 'off/chair', x: 140, y: 336 }
    ],
    blockers: [...desks.map<Blocker>(([x, y], i) => ({ x: x - (i % 2 ? 24 : 30), y: y - 12, w: i % 2 ? 48 : 60, h: 12 })), { x: 40, y: 140, w: 40, h: 14 }, { x: 120, y: 134, w: 40, h: 12 }, { x: 530, y: 140, w: 60, h: 14 }, { x: 600, y: 190, w: 20, h: 14 }, { x: 24, y: 330, w: 14, h: 14 }],
    npcs: [
      { id: 'ward', char: 'ward', x: 440, y: 258, dir: 'down' },
      { id: 'clerkA', char: 'clerkA', x: 200, y: 268, dir: 'up', clip: 'type' }, { id: 'clerkB', char: 'clerkB', x: 520, y: 326, dir: 'left', clip: 'read' },
      { id: 'brooksP', char: 'brooks', x: 330, y: 190, dir: 'down', roam: [210, 170, 470, 200] }
    ],
    interactables: [{ id: 'ward', x: 440, y: 258, label: 'Detective Ward' }, { id: 'board', x: 320, y: 150, label: 'Case board' }, { id: 'door', x: 320, y: 340, label: 'Exit to Alder Lane' }] };
}
function alder(): MapDef {
  return { id: 'alder', name: 'Alder Lane', rain: true, spawn: [330, 232], dim: 0.5, police: [540, 276],
    walk: { x: 14, y: 180, w: 612, h: 158 },
    props: [
      { id: 'van', sprite: 'veh/van', x: 120, y: 326 }, { id: 'sedan', sprite: 'veh/sedan_0', x: 270, y: 262 }, { id: 'sedan2', sprite: 'veh/sedan2', x: 400, y: 262 }, { id: 'patrol', sprite: 'veh/patrol', x: 548, y: 306 }, { id: 'sedan3', sprite: 'veh/sedan_0', x: 596, y: 262 },
      { id: 'lampA', sprite: 'prop/lamp', x: 90, y: 214 }, { id: 'lampB', sprite: 'prop/lamp', x: 330, y: 214 }, { id: 'lampC', sprite: 'prop/lamp', x: 570, y: 214 },
      { id: 'bin', sprite: 'prop/bin', x: 160, y: 184 }, { id: 'mail', sprite: 'prop/mailbox', x: 250, y: 184 }, { id: 'bushA', sprite: 'prop/bush_a', x: 20, y: 186 }, { id: 'bushB', sprite: 'prop/bush_b', x: 470, y: 186 },
      { id: 'cone1', sprite: 'prop/cone', x: 190, y: 292 }, { id: 'cone2', sprite: 'prop/cone', x: 214, y: 300 }, { id: 'tent1', sprite: 'prop/tent_1', x: 304, y: 300 }, { id: 'tent2', sprite: 'prop/tent_2', x: 314, y: 308 }, { id: 'crate', sprite: 'prop/crate', x: 176, y: 340 }
    ],
    blockers: [{ x: 74, y: 296, w: 90, h: 30 }, { x: 236, y: 250, w: 68, h: 12 }, { x: 366, y: 250, w: 68, h: 12 }, { x: 514, y: 294, w: 68, h: 12 }, { x: 562, y: 250, w: 68, h: 12 }, { x: 86, y: 200, w: 8, h: 14 }, { x: 326, y: 200, w: 8, h: 14 }, { x: 566, y: 200, w: 8, h: 14 }, { x: 154, y: 176, w: 12, h: 8 }, { x: 466, y: 176, w: 10, h: 8 }, { x: 168, y: 330, w: 16, h: 10 }],
    npcs: [
      { id: 'vance', char: 'vance', x: 130, y: 198, dir: 'left', clip: 'cuffed' }, { id: 'brooksA', char: 'brooks', x: 152, y: 204, dir: 'left' },
      { id: 'marla', char: 'marla', x: 352, y: 190, dir: 'down' }, { id: 'brooksB', char: 'brooks', x: 520, y: 322, dir: 'right' },
      { id: 'wardVan', char: 'ward', x: 78, y: 336, dir: 'right' }, { id: 'hale', char: 'hale', x: 200, y: 330, dir: 'up' }
    ],
    interactables: [
      { id: 'van', x: 100, y: 342, label: 'Command van' }, { id: 'houseDoor', x: 42, y: 186, label: '142 Alder Lane' }, { id: 'vance', x: 130, y: 198, label: 'Vance (arrested)' },
      { id: 'cars', x: 335, y: 276, label: 'Vehicles on the street' }, { id: 'marla', x: 352, y: 190, label: 'Woman at Apartment 4C' }, { id: 'stop', x: 520, y: 330, label: 'Brooks\'s traffic stop' }
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
  map!: MapDef; px = 0; py = 0; dir: Dir = 'down'; t = 0; moving = false; frozen = false; targetId = ''; nearId = '';
  onInteract: (id: string) => void = () => {}; onHint: (msg: string) => void = () => {};
  private _reduced = false; private stage: Stage | null = null; private assets: Assets | null = null; private player = new Actor('player', 'player'); private stepAcc = 0; private hover = '';
  private pendingMap: { id: string; spawn?: [number, number] } | null = null; private roamT = new Map<string, { to: [number, number] | null; wait: number }>();
  constructor(private cv: HTMLCanvasElement, private input: Input) {
    cv.width = W; cv.height = H;
    void Assets.get().then(a => { this.assets = a; this.stage = new Stage(cv, a); this.stage.reduced = this._reduced; if (this.pendingMap) this.setMap(this.pendingMap.id, this.pendingMap.spawn); });
    cv.addEventListener('mousemove', e => { const p = this.toLogical(e); this.hover = this.interactableAt(p.x, p.y)?.id ?? ''; cv.style.cursor = this.hover ? 'pointer' : 'default'; });
    cv.addEventListener('click', e => { if (this.frozen || !this.map) return; const p = this.toLogical(e); const it = this.interactableAt(p.x, p.y); if (!it) return; if (this.dist(it) < 56) this.onInteract(it.id); else this.onHint('Move closer to inspect that.'); });
  }
  get reduced() { return this._reduced; } set reduced(v: boolean) { this._reduced = v; if (this.stage) this.stage.reduced = v; }
  private toLogical(e: MouseEvent) { const r = this.cv.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }; }
  private interactableAt(x: number, y: number) { return this.map?.interactables.find(i => Math.hypot(i.x - x, i.y - 12 - y) < 24 || Math.hypot(i.x - x, i.y - y) < 18); }
  private dist(i: Interactable) { return Math.hypot(i.x - this.px, i.y - this.py); }
  setMap(id: string, spawn?: [number, number]) {
    if (!this.stage || !this.assets) { this.pendingMap = { id, spawn }; this.map = MAPS[id](); const s = spawn ?? this.map.spawn; this.px = s[0]; this.py = s[1]; return; }
    this.pendingMap = null; this.map = MAPS[id](); const s = spawn ?? this.map.spawn; this.px = s[0]; this.py = s[1];
    const st = this.stage; st.loadScene(id); st.rain = this.map.rain; st.dim = this.map.dim; st.policeLights = !!this.map.police; if (this.map.police) st.policeAt = { x: this.map.police[0], y: this.map.police[1] };
    st.actors = []; st.props = []; st.focus(W / 2, H / 2, 1, true);
    for (const p of this.map.props) st.props.push({ id: p.id, sprite: p.sprite, x: p.x, y: p.y, flip: p.flip });
    for (const n of this.map.npcs) { const a = new Actor(n.id, n.char, n.x, n.y); a.dir = n.dir; if (n.clip) a.play(n.clip as any, n.dir); st.actors.push(a); }
    this.player.x = this.px; this.player.y = this.py; this.player.dir = 'down'; this.player.play('idle', 'down'); st.actors.push(this.player); this.roamT.clear();
  }
  setPosition(x: number, y: number) { this.px = x; this.py = y; }
  private blocked(x: number, y: number) {
    const m = this.map, w = m.walk, bx = x - 5, by = y - 5;
    if (bx < w.x || bx + 10 > w.x + w.w || y > w.y + w.h || by < w.y) return true;
    for (const b of m.blockers) if (bx < b.x + b.w && bx + 10 > b.x && y > b.y && by < b.y + b.h) return true;
    for (const n of this.stage!.actors) if (n !== this.player && Math.abs(n.x - x) < 9 && Math.abs(n.y - y) < 6) return true;
    return false;
  }
  update(dt: number) {
    this.t += dt; const keys = this.input.take(); const st = this.stage; if (!st || !this.map) return;
    this.roam(dt); st.update(dt);
    if (this.frozen) return;
    for (const k of keys) if (k === 'e' || k === 'enter') this.tryInteract();
    const d = this.input.down; let dx = 0, dy = 0;
    if (d.has('arrowleft') || d.has('a')) dx -= 1; if (d.has('arrowright') || d.has('d')) dx += 1; if (d.has('arrowup') || d.has('w')) dy -= 1; if (d.has('arrowdown') || d.has('s')) dy += 1;
    this.moving = !!(dx || dy);
    if (this.moving) {
      const sp = 92 * dt / (dx && dy ? 1.414 : 1);
      if (!this.blocked(this.px + dx * sp, this.py)) this.px += dx * sp; if (!this.blocked(this.px, this.py + dy * sp)) this.py += dy * sp;
      this.dir = dx < 0 ? 'left' : dx > 0 ? 'right' : dy < 0 ? 'up' : 'down'; this.player.play('walk', this.dir);
      this.stepAcc += dt; if (this.stepAcc > 0.28) { this.stepAcc = 0; sfx.step(); }
    } else this.player.play('idle', this.dir);
    this.player.x = this.px; this.player.y = this.py;
    let best: Interactable | null = null, bd = 48; for (const i of this.map.interactables) { const dd = this.dist(i); if (dd < bd) { bd = dd; best = i; } } this.nearId = best?.id ?? '';
  }
  /** Background NPC behaviour: only decorative actors with `roam` move; they never block the player's interaction targets. */
  private roam(dt: number) {
    if (this._reduced) return;
    for (const n of this.map.npcs) if (n.roam) {
      const a = this.stage!.actor(n.id); let s = this.roamT.get(n.id); if (!s) { s = { to: null, wait: 1 + Math.random() * 2 }; this.roamT.set(n.id, s); }
      if (s.to) { const dx = s.to[0] - a.x, dy = s.to[1] - a.y, dd = Math.hypot(dx, dy); if (dd < 2) { s.to = null; s.wait = 1.5 + Math.random() * 3; a.play('idle', 'down'); } else { a.x += dx / dd * 34 * dt; a.y += dy / dd * 34 * dt; a.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'); a.play('walk', a.dir); } }
      else if ((s.wait -= dt) <= 0) { const r = n.roam; s.to = [r[0] + Math.random() * (r[2] - r[0]), r[1] + Math.random() * (r[3] - r[1])]; }
    }
  }
  tryInteract() { if (this.nearId) this.onInteract(this.nearId); }
  render() {
    const st = this.stage; if (!st || !this.map) return; st.render();
    const c = st.ctx; c.imageSmoothingEnabled = false;
    for (const i of this.map.interactables) {
      if (i.id === this.targetId) { const bob = this._reduced ? 0 : Math.sin(this.t * 4) * 2; c.fillStyle = '#ffd68a'; c.strokeStyle = '#14161f'; c.beginPath(); c.moveTo(i.x - 6, i.y - 50 + bob); c.lineTo(i.x + 6, i.y - 50 + bob); c.lineTo(i.x, i.y - 41 + bob); c.closePath(); c.fill(); c.stroke(); }
      if (i.id === this.nearId || i.id === this.hover) { const label = i.id === this.nearId ? `[E] ${i.label}` : i.label; c.font = '10px monospace'; const w = c.measureText(label).width + 10; c.fillStyle = 'rgba(10,14,28,.92)'; const lx = Math.max(4, Math.min(W - w - 4, i.x - w / 2)); c.fillRect(lx, i.y - 66, w, 15); c.strokeStyle = '#c9a24a'; c.strokeRect(lx + .5, i.y - 65.5, w - 1, 14); c.fillStyle = '#f1e6c8'; c.fillText(label, lx + 5, i.y - 55); }
    }
  }
}
