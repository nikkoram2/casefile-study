import { Img, ramp, mix, lighten, darken, rngSeed } from './pixel';
export const SW = 640, SH = 360;
export interface Scene { id: string; bg: Img; fg: Img; lights: { x: number; y: number; r: number; color: string; a: number; flicker?: boolean }[]; puddles: { x: number; y: number; w: number; h: number }[]; walk: { x0: number; y0: number; x1: number; y1: number } }

export function alderLane(): Scene {
  const bg = new Img(SW, SH), fg = new Img(SW, SH), r = rngSeed(42);
  // sky gradient with dithered bands
  const bands = ['#0d1226', '#121a35', '#18224a', '#1f2c5a', '#2a3768'];
  for (let y = 0; y < 90; y++) { const k = Math.min(4, Math.floor(y / 18)); bg.rect(0, y, SW, 1, bands[k]); if (y % 18 > 14) for (let x = (y & 1); x < SW; x += 2) bg.set(x, y, bands[Math.min(4, k + 1)]); }
  for (let i = 0; i < 46; i++) bg.set(Math.floor(r() * SW), Math.floor(r() * 50), r() > 0.7 ? '#fff0b8' : '#9db4d4');
  bg.ellipse(540, 28, 11, 11, '#e8e4c8'); bg.ellipse(536, 25, 9, 9, '#f4f0d8'); bg.ellipse(545, 31, 2, 2, '#cfcaa8');
  // far skyline silhouette
  let x = 0; while (x < SW) { const w = 18 + Math.floor(r() * 28), h = 34 + Math.floor(r() * 46); bg.rect(x, 96 - h, w, h + 8, '#161d3a'); for (let j = 0; j < 4; j++) for (let i = 0; i < w / 8; i++) if (r() > 0.78) bg.rect(x + 3 + i * 8, 96 - h + 6 + j * 12, 2, 3, r() > 0.5 ? '#c9a24a' : '#7d6a3a'); x += w + 2; }
  // rowhouses
  const brick = ['#6a3a3a', '#5a4a52', '#4a5a6a', '#6a5a3a', '#4f3f5a']; let hx = -6, hi = 0;
  const houseTop: number[] = [];
  while (hx < SW) {
    const w = 96 + (hi % 2) * 14, top = 66 + (hi % 3) * 6, base = 172, c = ramp(brick[hi % brick.length]);
    bg.rect(hx, top, w, base - top, c.base); for (let y = top; y < base; y += 4) { bg.hline(hx, y, w, c.dk); for (let xx = hx + ((y / 4) & 1) * 4; xx < hx + w; xx += 8) bg.vline(xx, y, 4, c.dk); }
    bg.rect(hx, top, w, 3, c.hi); bg.rect(hx - 3, top - 4, w + 6, 5, darken(c.base, 0.4)); bg.rect(hx - 3, top - 4, w + 6, 1, c.sh); // cornice/roof
    bg.rect(hx + w - 2, top, 2, base - top, c.dk);
    for (let k = 0; k < 2; k++) { const wx = hx + 14 + k * 44, wy = top + 14, lit = (hi + k) % 3 !== 0; bg.rect(wx - 2, wy - 3, 24, 4, '#d9c9a3'); bg.rect(wx, wy, 20, 28, '#14161f'); bg.rect(wx + 1, wy + 1, 18, 26, lit ? '#e8b45a' : '#26324d'); if (lit) { bg.rect(wx + 1, wy + 1, 18, 8, '#f6d88a'); bg.rect(wx + 5, wy + 12, 10, 14, '#a8703f'); bg.ellipse(wx + 10, wy + 10, 3, 4, '#2a1d14'); } else { bg.line(wx + 2, wy + 24, wx + 8, wy + 3, '#3a4b6e'); bg.hline(wx + 1, wy + 8, 18, '#3a4b6e'); } bg.vline(wx + 10, wy, 28, '#2a2e3a'); bg.hline(wx, wy + 13, 20, '#2a2e3a'); bg.rect(wx - 2, wy + 28, 24, 3, '#c9bb90'); bg.rect(wx - 2, wy + 31, 24, 1, '#7a6a48'); }
    // door + stoop
    const dx = hx + (w - 22) / 2, dy = base - 38; bg.rect(dx - 3, dy - 4, 28, 4, '#d9c9a3'); bg.rect(dx, dy, 22, 38, darken(c.base, 0.45)); bg.rect(dx + 2, dy + 2, 18, 15, '#26324d'); bg.rect(dx + 2, dy + 20, 8, 16, '#3a2a22'); bg.rect(dx + 12, dy + 20, 8, 16, '#3a2a22'); bg.set(dx + 9, dy + 28, '#c9a24a'); bg.set(dx + 12, dy + 28, '#c9a24a'); if (hi % 2 === 0) bg.rect(dx + 3, dy + 3, 16, 12, '#e8b45a');
    for (let s = 0; s < 3; s++) { bg.rect(dx - 4 - s, base - 6 + s * 2 - 6, 30 + s * 2, 2, s ? '#8a8a96' : '#a8a8b4'); }
    houseTop.push(top); hx += w; hi++;
  }
  // sidewalk (walkable)
  bg.rect(0, 172, SW, 40, '#4a5470'); for (let y = 172; y < 212; y += 10) bg.hline(0, y, SW, '#3a4560'); for (let xx = 0; xx < SW; xx += 36) bg.vline(xx, 172, 40, '#3a4560');
  for (let i = 0; i < 300; i++) bg.set(Math.floor(r() * SW), 172 + Math.floor(r() * 40), r() > 0.5 ? '#56628a' : '#394563');
  bg.rect(0, 172, SW, 2, '#2a3250'); // shadow under facade
  // curb
  bg.rect(0, 212, SW, 4, '#9aa3bd'); bg.rect(0, 212, SW, 1, '#c8d0e4'); bg.rect(0, 216, SW, 3, '#4f5873');
  // asphalt, wet
  const as = ramp('#252a3d'); bg.rect(0, 219, SW, 141, as.base); for (let y = 219; y < SH; y++) { const t = (y - 219) / 141; if (t < 0.12) bg.hline(0, y, SW, as.sh); }
  for (let i = 0; i < 1800; i++) bg.set(Math.floor(r() * SW), 219 + Math.floor(r() * 141), r() > 0.55 ? as.hi : as.dk);
  for (let i = 0; i < 22; i++) { const px = Math.floor(r() * SW), py = 222 + Math.floor(r() * 130); bg.line(px, py, px + 6 + Math.floor(r() * 18), py + (r() > 0.5 ? 1 : 0), as.sh); }
  for (let xx = 0; xx < SW; xx += 44) bg.rect(xx + 6, 284, 26, 2, '#c9a24a'); // centerline dashes
  bg.rect(0, 340, SW, 20, '#1d2234'); bg.rect(0, 340, SW, 1, '#3a4560');
  // puddles w/ sky + glow reflections
  const puddles = [{ x: 78, y: 262, w: 70, h: 14 }, { x: 250, y: 318, w: 90, h: 16 }, { x: 440, y: 247, w: 60, h: 12 }, { x: 520, y: 304, w: 80, h: 14 }, { x: 150, y: 232, w: 40, h: 8 }];
  for (const p of puddles) { bg.ellipse(p.x + p.w / 2, p.y + p.h / 2, p.w / 2, p.h / 2, (xx, yy) => ((xx + yy) % 5 === 0 ? '#3a4b78' : (yy - p.y) < p.h * 0.35 ? '#26335a' : '#1a2340')); bg.ellipse(p.x + p.w / 2, p.y + p.h / 2, p.w / 2 - 1, p.h / 2 - 1, (xx, yy) => ((xx * 3 + yy) % 7 === 0 ? '#5a6fa8' : null)); }
  // lamp pools + curb drain
  const lampX = [90, 330, 570]; for (const lx of lampX) { for (let k = 0; k < 4; k++) bg.ellipse(lx, 224 + k, 54 - k * 10, 10 - k * 2, (xx, yy) => ((xx + yy) & 1 ? null : '#3a4468')); }
  bg.rect(468, 217, 12, 2, '#14161f');
  // foreground: tree branches top-left + fence bottom + hanging rain streak veil
  const f = ramp('#1d3a2a'); for (let i = 0; i < 16; i++) fg.ellipse(8 + r() * 120, 4 + r() * 22, 10 + r() * 12, 6 + r() * 6, (xx, yy) => (r() > 0.5 ? f.base : f.dk)); fg.line(0, 0, 90, 14, '#1a1410'); fg.thick(0, 0, 70, 12, 2, '#14100c');
  for (let xx = 0; xx < SW; xx += 20) { fg.rect(xx, 346, 4, 14, '#14161f'); fg.rect(xx, 346, 4, 1, '#2a3250'); } fg.rect(0, 350, SW, 2, '#14161f'); fg.rect(0, 356, SW, 2, '#14161f');
  const lights = [90, 330, 570].map(lx => ({ x: lx, y: 142, r: 96, color: '#ffd68a', a: 0.85 }));
  // lit windows glow
  lights.push({ x: 120, y: 118, r: 46, color: '#f6c870', a: 0.5 }, { x: 410, y: 126, r: 46, color: '#f6c870', a: 0.5 }, { x: 40, y: 110, r: 36, color: '#f6c870', a: 0.4 }, { x: 520, y: 100, r: 36, color: '#f6c870', a: 0.4 });
  return { id: 'alder', bg, fg, lights, puddles, walk: { x0: 12, y0: 176, x1: 628, y1: 338 } };
}
export const SCENES = [alderLane];
