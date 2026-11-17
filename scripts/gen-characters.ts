// Draws every character frame (24x32) from a spec + pose tables. Output: array of {name, img}.
import { Img, ramp, mix, lighten, darken } from './pixel';
import { CLIPS, FH, FW, frameName } from '../src/engine/spec';

export interface Spec {
  skin: string; hair: string; hairStyle: 'short' | 'bun' | 'long' | 'beanie' | 'fedora' | 'cap' | 'parted' | 'buzz';
  outfit: 'trench' | 'uniform' | 'jacket' | 'hoodie' | 'cardigan' | 'suit' | 'shirt';
  coat: string; accent: string; pants: string; shoes: string; glasses?: boolean; tie?: string; badge?: boolean; skirt?: boolean; item?: 'notebook' | 'briefcase' | 'flashlight' | 'none'; hatBand?: string;
}
export const SPECS: Record<string, Spec> = {
  player: { skin: '#e0b08a', hair: '#3b2a1f', hairStyle: 'fedora', outfit: 'jacket', coat: '#8a5a32', accent: '#c9a24a', pants: '#2b3550', shoes: '#2a1d14', item: 'notebook', hatBand: '#7a2f2f' },
  ward: { skin: '#c88f6a', hair: '#2a1a24', hairStyle: 'bun', outfit: 'trench', coat: '#7d2f46', accent: '#c9a24a', pants: '#1d2434', shoes: '#14161f', item: 'none' },
  brooks: { skin: '#f0c8a0', hair: '#2a2420', hairStyle: 'cap', outfit: 'uniform', coat: '#243a6b', accent: '#c9a24a', pants: '#1a2848', shoes: '#101218', badge: true, tie: '#101830', item: 'flashlight' },
  vance: { skin: '#e8bd98', hair: '#7a5a2a', hairStyle: 'beanie', outfit: 'hoodie', coat: '#5d6470', accent: '#b8453a', pants: '#3c3c4c', shoes: '#e8e8e8', item: 'none' },
  marla: { skin: '#b57a56', hair: '#5a2418', hairStyle: 'long', outfit: 'cardigan', coat: '#3f8a86', accent: '#e8dcc0', pants: '#33344a', shoes: '#5a3a2a', skirt: true, item: 'none' },
  hale: { skin: '#7d5238', hair: '#15151b', hairStyle: 'parted', outfit: 'suit', coat: '#3c4252', accent: '#e8dcc0', pants: '#2c303c', shoes: '#101218', glasses: true, tie: '#b8453a', item: 'briefcase' },
  clerkA: { skin: '#f0c8a0', hair: '#8a5a32', hairStyle: 'long', outfit: 'shirt', coat: '#e8dcc0', accent: '#3f8a86', pants: '#33344a', shoes: '#2a1d14', item: 'none' },
  clerkB: { skin: '#d9a07a', hair: '#1a1a1a', hairStyle: 'buzz', outfit: 'shirt', coat: '#9db4d4', accent: '#243a6b', pants: '#2c303c', shoes: '#101218', glasses: true, tie: '#243a6b', item: 'none' }
};

type V = [number, number];
interface P { bob?: number; head?: V; torso?: V; hands: [V, V]; feet: [V, V]; item?: 'paper' | 'bag' | 'flash' | 'notebook' | 'ground'; crouch?: number; mouth?: boolean; cuff?: boolean; sit?: boolean; flash?: boolean; fold?: boolean; hold?: 'L' | 'R' }
const F0: [V, V] = [[9.5, 30], [14.5, 30]], FS: [V, V] = [[11, 30], [13, 30]];

function pose(clip: string, dir: string, i: number): P {
  const side = dir === 'left';
  const hang: [V, V] = side ? [[12, 21], [13, 21]] : [[7, 21], [17, 21]];
  const bob = (n: number) => (i % 2 === 1 ? -n : 0);
  switch (clip) {
    case 'idle': return { bob: i ? -1 : 0, hands: hang, feet: side ? FS : F0 };
    case 'walk': {
      const w = [0, -1, 0, -1][i];
      if (side) { const s = [[3, -3], [0, 0], [-3, 3], [0, 0]][i]; return { bob: w, hands: [[12 + s[1] * 0.9, 21 - (i % 2)], [13 + s[0] * 0.9, 21 - (i % 2)]], feet: [[11.5 + s[0], i === 1 ? 28 : 30], [12.5 + s[1], i === 3 ? 28 : 30]] }; }
      const sw = [[-1, 1], [0, 0], [1, -1], [0, 0]][i];
      return { bob: w, hands: [[7, 21 + sw[0]], [17, 21 + sw[1]]], feet: [[9 - (i === 0 ? 1 : 0), i === 1 ? 28 : 30], [15 + (i === 2 ? 1 : 0), i === 3 ? 28 : 30]] };
    }
    case 'talk': return { bob: bob(1), mouth: i === 1, hands: side ? [[12, 21], [9 - i, 16 - i]] : [[7, 21], [18 + i, 17 - i * 2]], feet: side ? FS : F0 };
    case 'react': return { bob: i ? -1 : 0, head: [0, i ? -1 : 0], mouth: true, hands: side ? [[8, 14 - i], [10, 13 - i]] : [[5 - i, 13 - i], [19 + i, 13 - i]], feet: side ? FS : F0 };
    case 'inspect': {
      if (dir === 'up') return { head: [0, [0, 1, 1][i]], torso: [0, 0], hands: [[9, 17 - i], [15, 17 - i]], feet: F0 };
      if (side) return { head: [-[0, 1, 2][i], [0, 1, 2][i]], torso: [-[0, 1, 1][i], 0], hands: [[9 - i, 17], [8 - i, 18]], feet: FS, item: 'flash' };
      return { head: [0, [0, 1, 2][i]], hands: [[7, 21], [[13, 11, 11][i], [15, 18, 19][i]]], feet: F0, item: i ? 'flash' : undefined };
    }
    case 'read': return side ? { head: [-1, 1], hands: [[10, 18], [9, 19]], feet: FS, item: 'paper', bob: bob(0) } : { head: [0, 1], hands: [[10, 19 + i], [14, 19 + i]], feet: F0, item: 'paper' };
    case 'search': {
      if (dir === 'up') { const h = [[[9, 10], [15, 10]], [[10, 8], [14, 8]], [[8, 11], [16, 9]], [[11, 9], [13, 11]]][i] as [V, V]; return { head: [0, 3], torso: [0, 1], hands: h, feet: [[9, 30], [15, 30]], bob: 1 }; }
      const hx = [[4, 15], [3, 17], [4, 19], [3, 16]][i] as V; return { head: [-5, 3], torso: [-3, 1], hands: [[hx[0] + 1, hx[1] + 1], hx], feet: [[10, 30], [14, 30]], bob: 1 };
    }
    case 'handcuff': { const o = [0, 1, 1][i]; return side ? { head: [-1, 1], hands: [[8 - o, 18], [7 - o, 18]], feet: FS, flash: i === 2 } : { head: [0, 1], hands: [[11 + o * 0.5, 19], [13 - o * 0.5, 19]], feet: F0, flash: i === 2 }; }
    case 'present': return side ? { hands: [[12, 21], [6, 15 - i]], feet: FS, item: 'bag', hold: 'R' } : { hands: [[7, 21], [19, 16 - i]], feet: F0, item: 'bag', hold: 'R' };
    case 'cuffed': return { bob: i ? 0 : 0, head: [0, 1 + i], hands: [[10, 22], [14, 22]], feet: side ? FS : F0, cuff: true, torso: [0, 0] };
    case 'type': return { sit: true, bob: 0, head: [0, 4], torso: [0, 4], hands: [[9, 19 + i], [15, 19 + (1 - i)]], feet: [[9, 30], [15, 30]] };
    case 'pickup': { const c = [2, 5, 2][i]; return { crouch: c, head: [0, c], hands: side ? [[9, 26], [8, 27 - i]] : [[8, 24 + (i === 1 ? 3 : 0)], [16, 24 + (i === 1 ? 3 : 0)]], feet: side ? FS : F0, item: i === 2 ? 'bag' : undefined }; }
  }
  return { hands: hang, feet: F0 };
}

function shade(cx: number, c: { hi: string; base: string; sh: string; dk: string }, w = 2) { return (x: number, y: number) => (x + 0.5 < cx - w ? c.hi : x + 0.5 > cx + w ? c.sh : c.base); }

function drawHead(g: Img, s: Spec, dir: string, hx: number, hy: number, p: P) {
  const skin = ramp(s.skin), hair = ramp(s.hair), cx = 12 + hx + (dir === 'left' ? -0.5 : 0), cy = 8 + hy;
  if (dir === 'left') {
    g.ellipse(cx + 0.5, cy, 4, 4.8, (x, y) => (x + 0.5 < cx - 1 && y < cy ? skin.hi : x > cx + 2 ? skin.sh : skin.base));
    g.set(cx - 4, cy + 1, skin.base); g.set(cx - 4.5, cy + 1.5, skin.sh); g.set(cx + 1, cy + 0.5, skin.sh); g.set(cx - 1.5, cy - 0.5, '#1a1a24'); g.set(cx - 2.5, cy + 3, skin.dk); if (p.mouth) g.set(cx - 2.5, cy + 3.5, '#5a2a2a');
    g.set(cx + 3, cy + 0.5, skin.sh);
  } else {
    g.ellipse(cx, cy, 4.3, 4.8, (x, y) => (x + 0.5 < cx - 2 && y < cy + 1 ? skin.hi : x + 0.5 > cx + 2 ? skin.sh : skin.base));
    if (dir === 'down') { g.set(cx - 2, cy + 0.5, '#1a1a24'); g.set(cx + 2, cy + 0.5, '#1a1a24'); g.set(cx - 2, cy - 0.5, skin.dk); g.set(cx + 2, cy - 0.5, skin.dk); g.set(cx, cy + 2, skin.sh); g.set(cx - 1, cy + 3.5, p.mouth ? '#5a2a2a' : skin.dk); g.set(cx, cy + 3.5, p.mouth ? '#5a2a2a' : skin.dk); g.set(cx + 1, cy + 3.5, p.mouth ? '#5a2a2a' : skin.dk); g.set(cx - 5, cy + 1, skin.sh); g.set(cx + 4, cy + 1, skin.sh); }
  }
  // glasses
  if (s.glasses && dir !== 'up') { if (dir === 'down') { g.rect(cx - 3.5, cy, 3, 2, '#1a1a24'); g.rect(cx + 1, cy, 3, 2, '#1a1a24'); g.rect(cx - 2.5, cy + 0.01, 1, 1, '#9db4d4'); g.rect(cx + 2, cy + 0.01, 1, 1, '#9db4d4'); g.set(cx - 0.5, cy, '#1a1a24'); } else { g.rect(cx - 4, cy - 1, 3, 2, '#1a1a24'); g.set(cx - 3, cy - 1, '#9db4d4'); g.hline(cx - 1, cy - 1, 4, '#1a1a24'); } }
  // hair / headwear
  const H = hair;
  const cap = (poly: [number, number][], c = H.base) => g.poly(poly.map(([x, y]) => [x + hx, y + hy] as [number, number]), (x, y) => (x + 0.5 < 12 + hx - 2 ? (c === H.base ? H.hi : lighten(c, 0.15)) : x + 0.5 > 12 + hx + 2 ? (c === H.base ? H.sh : darken(c, 0.2)) : c));
  const st = s.hairStyle;
  if (st === 'short' || st === 'parted' || st === 'buzz') {
    const top = st === 'buzz' ? 3.6 : 2.6;
    if (dir === 'down') { cap([[7.5, 7], [7.3, 5], [8.5, top + 0.6], [12, top - 0.4], [15.5, top + 0.6], [16.7, 5], [16.5, 7], [15.5, 5.6], [13.5, 4.6], [10.5, 4.6], [8.5, 5.6]]); if (st === 'parted') { g.set(10 + hx, 4 + hy, H.hi); g.set(11 + hx, 3.4 + hy, H.hi); } }
    else if (dir === 'up') cap([[7.3, 9.5], [7.2, 5], [8.5, 3], [12, 2.2], [15.5, 3], [16.8, 5], [16.7, 9.5], [14.5, 11], [9.5, 11]]);
    else cap([[8, 5.5], [8.6, 3.2], [11, 2.4], [14, 3.4], [16, 6], [16, 10.5], [14, 11], [13.5, 7], [11.5, 5], [9.5, 5.4]]);
  }
  if (st === 'bun') {
    if (dir === 'down') { cap([[7.4, 7.5], [7.3, 5], [8.6, 3], [12, 2.2], [15.4, 3], [16.7, 5], [16.6, 7.5], [15.4, 5.4], [12, 4.4], [8.6, 5.4]]); g.ellipse(12 + hx, 2 + hy, 2.3, 2, H.base); g.set(11 + hx, 1 + hy, H.hi); }
    else if (dir === 'up') { cap([[7.3, 10], [7.2, 5], [8.5, 3], [12, 2.2], [15.5, 3], [16.8, 5], [16.7, 10], [14.5, 11.4], [9.5, 11.4]]); g.ellipse(12 + hx, 3 + hy, 2.6, 2.3, H.base); g.set(11 + hx, 2 + hy, H.hi); }
    else { cap([[8, 5.5], [8.6, 3.2], [11, 2.4], [14, 3.4], [16, 6], [16, 10], [14, 10.5], [13.5, 7], [11.5, 5], [9.5, 5.4]]); g.ellipse(15 + hx, 4 + hy, 2.4, 2.3, H.base); g.set(14 + hx, 3 + hy, H.hi); }
  }
  if (st === 'long') {
    if (dir === 'down') { cap([[7.2, 17], [7, 6], [8.4, 3], [12, 2.2], [15.6, 3], [17, 6], [16.8, 17], [15.4, 17], [15.2, 7], [12.5, 4.6], [9, 6], [8.8, 17]]); g.set(9.5 + hx, 4.5 + hy, H.hi); }
    else if (dir === 'up') cap([[6.8, 19], [6.8, 5], [8.5, 2.8], [12, 2], [15.5, 2.8], [17.2, 5], [17.2, 19], [12, 20]]);
    else cap([[8, 5.5], [8.6, 3.2], [11, 2.4], [14, 3.4], [16.4, 6], [17, 12], [16.6, 19], [13.4, 19], [13.5, 8], [11.5, 5], [9.5, 5.4]]);
  }
  if (st === 'beanie') {
    const c = s.accent; const cuffC = lighten(c, 0.1);
    if (dir === 'down') { cap([[7.2, 6.6], [7.5, 4], [9, 2.6], [12, 1.8], [15, 2.6], [16.5, 4], [16.8, 6.6]], c); g.rect(7 + hx, 5.5 + hy, 10, 2, cuffC); g.hline(7 + hx, 6.6 + hy, 10, darken(cuffC, 0.25)); g.set(12 + hx, 1 + hy, c); }
    else if (dir === 'up') { cap([[7.2, 8], [7.5, 4], [9, 2.6], [12, 1.8], [15, 2.6], [16.5, 4], [16.8, 8]], c); g.rect(7 + hx, 7 + hy, 10, 2, cuffC); g.set(12 + hx, 1 + hy, c); }
    else { cap([[8, 6.6], [8.4, 4], [10, 2.6], [13, 1.8], [15.6, 3], [16.4, 6], [16.4, 8]], c); g.rect(8 + hx, 5.5 + hy, 9, 2, cuffC); g.set(13 + hx, 1 + hy, c); }
    // hair tufts under beanie
    g.set(7 + hx, 8 + hy, H.base); g.set(16 + hx, 8 + hy, H.sh);
  }
  if (st === 'fedora') {
    const band = s.hatBand ?? '#7a2f2f', felt = mix(s.coat, '#3a2a1e', 0.5), fr = ramp(felt);
    g.ellipse(12 + hx, 5.2 + hy, 7, 1.8, (x) => (x + 0.5 < 12 + hx - 2 ? fr.base : fr.sh));
    g.poly([[8, 5], [8.6, 2.2], [10, 1], [14, 1], [15.4, 2.2], [16, 5]].map(([x, y]) => [x + hx, y + hy] as [number, number]), shade(12 + hx, fr, 2));
    g.rect(8 + hx, 3.6 + hy, 8, 1.4, band); g.set(11 + hx, 1 + hy, fr.dk); g.set(12 + hx, 1 + hy, fr.dk);
    if (dir === 'left') { g.ellipse(10.5 + hx, 5.4 + hy, 5.5, 1.6, fr.base); }
    g.set(7.3 + hx, 7 + hy, H.base); g.set(16.5 + hx, 7 + hy, H.sh);
  }
  if (st === 'cap') {
    const c = ramp('#1c2a52');
    if (dir === 'down') { g.poly([[7.4, 5], [7.8, 2.8], [10, 1.4], [14, 1.4], [16.2, 2.8], [16.6, 5]].map(([x, y]) => [x + hx, y + hy] as [number, number]), shade(12 + hx, c, 2)); g.ellipse(12 + hx, 5.2 + hy, 5.4, 1.3, '#0e1222'); g.set(12 + hx, 3 + hy, '#c9a24a'); g.set(11 + hx, 3 + hy, '#a58236'); g.set(12 + hx, 2 + hy, '#c9a24a'); g.hline(8 + hx, 4.4 + hy, 8, '#0e1222'); g.set(7 + hx, 7 + hy, H.sh); g.set(17 + hx, 7 + hy, H.sh); }
    else if (dir === 'up') { g.poly([[7.2, 6.4], [7.6, 3], [10, 1.4], [14, 1.4], [16.4, 3], [16.8, 6.4]].map(([x, y]) => [x + hx, y + hy] as [number, number]), shade(12 + hx, c, 2)); g.hline(7 + hx, 6.4 + hy, 10, darken(c.base, 0.35)); g.rect(7.5 + hx, 8 + hy, 9, 3, H.base); }
    else { g.poly([[8.4, 5], [8.8, 2.8], [11, 1.4], [14.6, 1.8], [16.4, 4], [16.6, 6]].map(([x, y]) => [x + hx, y + hy] as [number, number]), shade(12 + hx, c, 2)); g.rect(4.6 + hx, 4.8 + hy, 6, 1.6, '#0e1222'); g.set(9.5 + hx, 3 + hy, '#c9a24a'); g.rect(13 + hx, 7 + hy, 3, 3, H.base); }
  }
}

function drawTorsoAndLimbs(g: Img, s: Spec, dir: string, p: P) {
  const coat = ramp(s.coat), acc = ramp(s.accent), pants = ramp(s.pants), shoes = ramp(s.shoes), skin = ramp(s.skin);
  const bob = p.bob ?? 0, [tx, ty] = p.torso ?? [0, 0], crouch = p.crouch ?? 0;
  const sy = 13 + bob + ty + crouch, hipy = 22 + bob + ty + crouch;
  const sit = !!p.sit;
  const cx = (dir === 'left' ? 12 : 12) + tx;
  const trench = s.outfit === 'trench', skirt = !!s.skirt;
  const leg = (hx: number, fx: number, fy: number, c: any, far = false) => {
    const hy = hipy; const col = far ? darken(c.base, 0.18) : c.base;
    const fyy = Math.min(fy + crouch * 0, 31);
    if (sit) { g.rect(hx - 1.5, hy, 3.4, 4, col); return; }
    g.thick(hx, hy, fx, fyy - 1, 3.4, col); g.thick(hx - 0.6, hy, fx - 0.6, fyy - 1, 1.2, far ? col : c.hi);
    const sw = dir === 'left' ? 4 : 4; const sx = dir === 'left' ? fx - 2.5 : fx - 2; g.rect(sx, fyy - 1, sw, 2, far ? darken(shoes.base, 0.1) : shoes.base); g.set(sx + 0.5, fyy - 1, shoes.hi);
  };
  const arm = (shx: number, shy: number, hx: number, hy: number, c: any, far = false, sleeveCol?: string) => {
    const col = far ? darken(c.base, 0.18) : c.base; g.thick(shx, shy, hx, hy, 3, sleeveCol ?? col); g.set(hx, hy, skin.base); g.set(hx + 0.5, hy + 0.5, skin.sh); g.rect(hx - 1, hy - 1, 2, 2, far ? skin.sh : skin.base);
    g.set(shx - 1, shy, c.hi);
  };
  const drawItem = () => { /* drawn after arms */ };
  void drawItem;
  // ───── back / front / side compositions
  if (dir === 'left') {
    const lf = p.feet[0], rf = p.feet[1];
    leg(11.5 + tx, rf[0] + tx, rf[1], pants, true); leg(11.5 + tx, lf[0] + tx, lf[1], pants);
    arm(12.5 + tx, sy + 1, p.hands[1][0] + tx, p.hands[1][1] + bob + crouch * 0.4, coat, true);
    const w = trench ? 7 : 6.5; const hem = trench ? 27 + bob + crouch : skirt ? 26 + bob + crouch : hipy + 0.5;
    g.poly([[cx - w / 2 + 0.5, sy], [cx + w / 2 - 0.5, sy], [cx + w / 2 + (trench || skirt ? 1.5 : 0), hem], [cx - w / 2 - (trench || skirt ? 1 : 0), hem]], shade(cx, coat, 1.5));
    if (s.outfit === 'uniform') { g.hline(cx - 3.5, hipy - 1, 7, '#14161f'); g.set(cx - 2, hipy - 1, '#c9a24a'); g.rect(cx + 0.5, hipy - 1, 2, 3, '#2a2a32'); }
    if (trench) { g.hline(cx - 4, hipy - 0.5, 8, acc.base); g.vline(cx - 3, sy, 3, coat.dk); }
    if (s.outfit === 'hoodie') { g.ellipse(cx + 2.5, sy + 0.5, 2.5, 2, coat.sh); g.set(cx - 1.5, sy + 3, '#e8e8e8'); }
    if (s.outfit === 'suit') { g.vline(cx - 2, sy + 1, 5, coat.dk); if (s.tie) g.vline(cx - 3, sy + 1, 5, s.tie); }
    if (s.outfit === 'jacket') { g.hline(cx - 3.5, hipy, 7, coat.dk); g.set(cx - 1, sy + 3, acc.base); }
    if (s.outfit === 'cardigan') g.vline(cx - 2, sy + 1, 8, acc.base);
    if (s.outfit === 'shirt' && s.tie) g.vline(cx - 3, sy + 1, 5, s.tie);
    if (s.badge) g.set(cx - 3, sy + 3, '#c9a24a');
    const ah = p.hands[0]; arm(11.5 + tx, sy + 1, ah[0] + tx, ah[1] + bob + crouch * 0.4, coat);
    if (p.item === 'flash') g.rect(ah[0] - 3 + tx, ah[1] + bob, 4, 2, '#2a2a32'), g.set(ah[0] - 3 + tx, ah[1] + bob, '#fff0b8');
    if (p.item === 'paper') { g.rect(ah[0] - 4 + tx, ah[1] - 4 + bob, 6, 5, '#f1e6c8'); g.hline(ah[0] - 3 + tx, ah[1] - 3 + bob, 4, '#9a8f70'); g.hline(ah[0] - 3 + tx, ah[1] - 1 + bob, 3, '#9a8f70'); }
    if (p.item === 'bag') { g.rect(ah[0] - 4 + tx, ah[1] - 3 + bob, 5, 6, '#d8e6f0'); g.rect(ah[0] - 3 + tx, ah[1] + bob, 3, 2, '#b8453a'); g.hline(ah[0] - 4 + tx, ah[1] - 3 + bob, 5, '#b8453a'); }
    drawHead(g, s, 'left', tx + (p.head?.[0] ?? 0), bob + ty + (p.head?.[1] ?? 0), p);
    return;
  }
  const back = dir === 'up';
  const lh = p.hands[0], rh = p.hands[1], lf = p.feet[0], rf = p.feet[1];
  // legs (skirt hides upper legs)
  leg(9.5 + tx, lf[0] + tx, lf[1], pants); leg(14.5 + tx, rf[0] + tx, rf[1], pants);
  const hem = trench ? 27 + bob + crouch : skirt ? 26 + bob + crouch : hipy + 0.5;
  const hasHem = trench || skirt;
  // arms behind torso when raised high & back view; otherwise drawn after torso
  const armsFirst = back && lh[1] < 14;
  const drawArms = () => { arm(8 + tx, sy + 1, lh[0] + tx, lh[1] + bob * 0 + (lh[1] > 18 ? bob + crouch * 0.4 : 0), coat); arm(16 + tx, sy + 1, rh[0] + tx, rh[1] + (rh[1] > 18 ? bob + crouch * 0.4 : 0), coat); };
  if (armsFirst) drawArms();
  if (!p.cuff || true) {
    g.poly([[7.2 + tx, sy], [16.8 + tx, sy], [16.8 + tx + (hasHem ? 1.6 : 0), hem], [7.2 + tx - (hasHem ? 1.6 : 0), hem]], shade(12 + tx, coat, 2.2));
    g.set(7 + tx, sy, [0, 0, 0, 0] as any); 
  }
  if (sit) { g.rect(8 + tx, sy + 6, 8, 4, coat.sh); }
  if (!back) {
    if (trench) { g.vline(12 + tx, sy + 1, hem - sy, coat.dk); g.hline(7.5 + tx, hipy - 0.5, 9, acc.base); g.set(12 + tx, hipy - 0.5, '#c9a24a'); g.poly([[8.5 + tx, sy], [12 + tx, sy + 4], [11 + tx, sy], ], coat.hi); g.poly([[15.5 + tx, sy], [12 + tx, sy + 4], [13 + tx, sy]], coat.sh); g.set(9 + tx, sy + 5, acc.base); g.set(15 + tx, sy + 5, acc.base); }
    if (s.outfit === 'uniform') { g.hline(7.5 + tx, hipy - 1, 9, '#14161f'); g.rect(11 + tx, hipy - 1, 2, 2, '#c9a24a'); g.rect(8 + tx, hipy - 1, 2, 4, '#2a2a32'); g.rect(14 + tx, hipy - 1, 2, 3, '#2a2a32'); g.vline(12 + tx, sy + 1, 6, coat.dk); g.rect(10 + tx, sy + 1, 4, 1, '#e8edf5'); g.vline(12 + tx, sy + 2, 3, s.tie!); g.rect(14 + tx, sy + 2, 2, 2, '#c9a24a'); g.set(9 + tx, sy + 2, '#a8b4cc'); g.hline(8 + tx, sy, 3, '#e8edf5'); }
    if (s.outfit === 'hoodie') { g.ellipse(12 + tx, sy, 4.5, 1.8, coat.hi); g.rect(9 + tx, sy + 5, 6, 3, coat.sh); g.vline(10.5 + tx, sy + 1, 4, '#e8e8e8'); g.vline(13.5 + tx, sy + 1, 4, '#e8e8e8'); g.rect(8 + tx, sy + 5, 8, 1, coat.dk); g.set(12 + tx, sy + 8, acc.base); }
    if (s.outfit === 'suit') { g.poly([[8.5 + tx, sy], [12 + tx, sy + 6], [11 + tx, sy]], '#e8edf5'); g.poly([[15.5 + tx, sy], [12 + tx, sy + 6], [13 + tx, sy]], '#d0d8e8'); g.vline(12 + tx, sy + 1, 6, s.tie!); g.rect(11 + tx, sy + 1, 2, 1, s.tie!); g.vline(8.5 + tx, sy + 2, 6, coat.hi); g.vline(15.5 + tx, sy + 2, 6, coat.sh); }
    if (s.outfit === 'jacket') { g.vline(12 + tx, sy + 1, 9, coat.dk); g.hline(7.5 + tx, hipy, 9, coat.dk); g.ellipse(12 + tx, sy + 0.5, 3, 1.4, '#e8dcc0'); g.rect(8 + tx, sy + 5, 3, 2, coat.sh); g.set(9 + tx, sy + 3, acc.base); }
    if (s.outfit === 'cardigan') { g.vline(12 + tx, sy + 1, 9, acc.base); g.poly([[9 + tx, sy], [12 + tx, sy + 3], [15 + tx, sy]], acc.base); g.rect(8 + tx, sy + 6, 3, 2, coat.sh); g.set(9 + tx, sy + 4, acc.hi); g.set(15 + tx, sy + 4, acc.hi); }
    if (s.outfit === 'shirt') { g.poly([[9 + tx, sy], [12 + tx, sy + 3], [15 + tx, sy]], '#ffffff'); if (s.tie) { g.vline(12 + tx, sy + 2, 5, s.tie); g.set(12 + tx, sy + 2, darken(s.tie, 0.2)); } else g.vline(12 + tx, sy + 3, 6, coat.sh); g.rect(8.5 + tx, sy + 5, 3, 2, coat.sh); }
  } else {
    if (trench) { g.vline(12 + tx, sy + 3, hem - sy - 3, coat.dk); g.hline(7.5 + tx, hipy - 0.5, 9, acc.base); g.hline(8 + tx, sy + 0.5, 8, coat.hi); }
    if (s.outfit === 'uniform') { g.hline(7.5 + tx, hipy - 1, 9, '#14161f'); g.rect(10 + tx, sy, 4, 1, '#e8edf5'); g.rect(8.5 + tx, hipy - 1, 2, 3, '#2a2a32'); }
    if (s.outfit === 'hoodie') { g.ellipse(12 + tx, sy + 2, 5, 3.5, coat.hi); g.ellipse(12 + tx, sy + 2.5, 3.6, 2.4, coat.sh); g.rect(9 + tx, sy + 6, 6, 3, coat.sh); }
    if (s.outfit === 'suit' || s.outfit === 'jacket' || s.outfit === 'cardigan' || s.outfit === 'shirt') g.vline(12 + tx, sy + 2, 8, coat.dk);
  }
  if (p.cuff) { g.hline(10 + tx, hipy + 1, 5, '#a8b4cc'); g.set(12 + tx, hipy + 1, '#e8edf5'); }
  if (!armsFirst && !p.cuff) drawArms(); else if (p.cuff) { g.thick(8 + tx, sy + 1, 9.5 + tx, hipy, 2.4, coat.sh); g.thick(16 + tx, sy + 1, 14.5 + tx, hipy, 2.4, coat.sh); }
  if (p.item === 'paper') { const px = 12 + tx; g.rect(px - 4, lh[1] - 4 + bob, 8, 6, '#f1e6c8'); g.hline(px - 3, lh[1] - 3 + bob, 6, '#9a8f70'); g.hline(px - 3, lh[1] - 1 + bob, 5, '#9a8f70'); g.hline(px - 4, lh[1] + 1 + bob, 8, '#c9bb90'); }
  if (p.item === 'bag') { const bx = rh[0] + tx; g.rect(bx - 2, rh[1] - 1, 5, 6, '#d8e6f0'); g.hline(bx - 2, rh[1] - 1, 5, '#b8453a'); g.rect(bx - 1, rh[1] + 2, 3, 2, '#b8453a'); }
  if (p.item === 'flash') { g.rect(rh[0] + tx - 1, rh[1] - 2, 2, 4, '#2a2a32'); g.set(rh[0] + tx - 1, rh[1] - 2, '#fff0b8'); }
  if (p.flash) { g.set(12 + tx, 19, '#ffffff'); g.set(11 + tx, 19, '#e8edf5'); g.set(13 + tx, 19, '#e8edf5'); }
  drawHead(g, s, dir, tx + (p.head?.[0] ?? 0), bob + ty + (p.head?.[1] ?? 0), p);
  // carried items (idle-ish poses only)
  if (!['search', 'inspect', 'read', 'handcuff', 'present', 'cuffed', 'type', 'pickup'].includes('')) { /* handled below by caller */ }
}

export function carriedItem(g: Img, s: Spec, dir: string, p: P) {
  if (!s.item || s.item === 'none' || p.item || p.cuff || p.sit || p.crouch) return;
  const bob = p.bob ?? 0;
  if (s.item === 'notebook') { const [hx, hy] = p.hands[0]; const left = dir === 'left'; g.rect(left ? hx - 3 : hx - 2, hy - 3 + bob, 4, 5, '#7a2f2f'); g.vline(left ? hx - 3 : hx - 2, hy - 3 + bob, 5, '#c9a24a'); g.hline(left ? hx - 2 : hx - 1, hy - 3 + bob, 2, '#d9453b'); }
  if (s.item === 'briefcase') { const [hx, hy] = p.hands[0]; const left = dir === 'left'; const x = left ? hx - 3 : hx - 3; g.rect(x, hy + bob, 7, 5, '#5a3a22'); g.hline(x, hy + bob, 7, '#7a5232'); g.rect(x + 2, hy - 1 + bob, 3, 1, '#2a1d14'); g.set(x + 3, hy + 2 + bob, '#c9a24a'); }
}

export function renderFrame(char: string, clip: string, dir: string, i: number): Img {
  const s = SPECS[char], g = new Img(FW, FH), p = pose(clip, dir, i);
  drawTorsoAndLimbs(g, s, dir, p); carriedItem(g, s, dir, p);
  g.outline(0.66); g.rim('#ffffff', 0.18);
  return g;
}
export function allCharacterFrames(): { name: string; img: Img }[] {
  const out: { name: string; img: Img }[] = [];
  for (const char of Object.keys(SPECS)) for (const [clip, def] of Object.entries(CLIPS)) {
    if (clip === 'type' && !['clerkA', 'clerkB'].includes(char)) continue;
    for (const dir of def.dirs) for (let i = 0; i < def.frames; i++) out.push({ name: frameName(char, clip, dir, i), img: renderFrame(char, clip, dir, i) });
  }
  return out;
}
