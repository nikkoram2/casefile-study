// Procedural pixel art: one coherent noir-city palette, 16px tiles, drawn in code (no external assets, no licensing issues).
export const T = 16;
export const PAL = {
  ink: '#10131c', night: '#1a2133', slate: '#2b3550', steel: '#46557a', fog: '#8895b3', paper: '#f1e6c8', paperDark: '#d6c79d',
  amber: '#f2b33d', amberDark: '#c1802a', red: '#c8483f', green: '#4f8f5b', greenDark: '#2f5d3c', teal: '#4aa3a2', skin: '#e0b48c',
  wood: '#8a5a36', woodDark: '#5f3b22', wall: '#3a4666', wallLight: '#4d5c85', floor: '#6a5a46', floorB: '#615240', road: '#2a2e3a',
  roadLine: '#d9c36a', sidewalk: '#7b8194', sidewalkB: '#70768a', grass: '#35603f', grassB: '#2d5236', white: '#f4f4f4', black: '#000'
};
const rect = (c: CanvasRenderingContext2D, col: string, x: number, y: number, w: number, h: number) => { c.fillStyle = col; c.fillRect(x, y, w, h); };

export function drawTile(c: CanvasRenderingContext2D, code: string, tx: number, ty: number, theme: 'indoor' | 'street') {
  const x = tx * T, y = ty * T, alt = (tx + ty) % 2 === 0;
  switch (code) {
    case '#': rect(c, PAL.wall, x, y, T, T); rect(c, PAL.wallLight, x, y, T, 3); rect(c, PAL.slate, x, y + T - 3, T, 3); if (alt) rect(c, PAL.slate, x + 3, y + 6, 4, 2); break;
    case '.': rect(c, alt ? PAL.floor : PAL.floorB, x, y, T, T); rect(c, 'rgba(0,0,0,.12)', x, y + T - 1, T, 1); if (theme === 'indoor' && tx % 3 === 0) rect(c, 'rgba(255,255,255,.04)', x + 2, y + 2, 4, 1); break;
    case ',': rect(c, alt ? PAL.grass : PAL.grassB, x, y, T, T); if ((tx * 7 + ty * 3) % 5 === 0) { rect(c, PAL.greenDark, x + 4, y + 5, 1, 3); rect(c, PAL.green, x + 10, y + 9, 1, 3); } break;
    case '=': rect(c, PAL.road, x, y, T, T); rect(c, 'rgba(255,255,255,.03)', x + (tx * 5) % 12, y + (ty * 3) % 12, 3, 1); break;
    case 's': rect(c, alt ? PAL.sidewalk : PAL.sidewalkB, x, y, T, T); rect(c, 'rgba(0,0,0,.18)', x, y + T - 1, T, 1); rect(c, 'rgba(0,0,0,.12)', x + T - 1, y, 1, T); break;
    case 'H': rect(c, '#5b4a45', x, y, T, T); rect(c, '#4a3b37', x, y + 5, T, 1); rect(c, '#4a3b37', x, y + 11, T, 1); break;
    case 'A': rect(c, '#46506e', x, y, T, T); rect(c, '#3b4560', x, y + 7, T, 1); break;
    case 'D': rect(c, PAL.woodDark, x, y, T, T); rect(c, PAL.wood, x + 2, y + 1, T - 4, T - 1); rect(c, PAL.amber, x + T - 5, y + 8, 2, 2); break;
    case 'T': rect(c, PAL.grassB, x, y, T, T); rect(c, PAL.woodDark, x + 6, y + 9, 4, 7); rect(c, PAL.greenDark, x + 1, y, 14, 11); rect(c, PAL.green, x + 3, y + 1, 9, 6); break;
    default: rect(c, PAL.ink, x, y, T, T);
  }
}
/** Windows on facades, drawn over 'H'/'A' tiles. */
export function drawWindow(c: CanvasRenderingContext2D, x: number, y: number, lit: boolean) {
  rect(c, PAL.ink, x, y, 12, 9); rect(c, lit ? PAL.amber : PAL.steel, x + 1, y + 1, 10, 7); rect(c, PAL.ink, x + 5, y + 1, 1, 7); rect(c, PAL.ink, x + 1, y + 4, 10, 1);
  if (lit) rect(c, 'rgba(255,220,120,.25)', x - 2, y + 9, 16, 4);
}
export function drawProp(c: CanvasRenderingContext2D, kind: string, x: number, y: number) {
  switch (kind) {
    case 'board': rect(c, PAL.woodDark, x, y, 96, 36); rect(c, '#6b7a55', x + 2, y + 2, 92, 32);
      for (let i = 0; i < 6; i++) { rect(c, PAL.paper, x + 6 + i * 14, y + 5 + (i % 2) * 10, 10, 12); rect(c, PAL.red, x + 10 + i * 14, y + 4 + (i % 2) * 10, 2, 2); }
      c.strokeStyle = PAL.red; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 16, y + 11); c.lineTo(x + 44, y + 26); c.lineTo(x + 72, y + 14); c.stroke(); break;
    case 'desk': rect(c, PAL.woodDark, x, y + 4, 80, 24); rect(c, PAL.wood, x, y, 80, 20); rect(c, PAL.paper, x + 8, y + 3, 14, 10); rect(c, PAL.ink, x + 50, y + 3, 14, 10); rect(c, PAL.teal, x + 52, y + 5, 10, 6); rect(c, PAL.amber, x + 30, y + 2, 4, 4); break;
    case 'cabinet': rect(c, PAL.slate, x, y, 32, 28); rect(c, PAL.steel, x + 2, y + 2, 28, 11); rect(c, PAL.steel, x + 2, y + 15, 28, 11); rect(c, PAL.fog, x + 13, y + 6, 6, 2); rect(c, PAL.fog, x + 13, y + 19, 6, 2); break;
    case 'plant': rect(c, PAL.woodDark, x + 4, y + 10, 8, 6); rect(c, PAL.green, x + 1, y, 14, 11); rect(c, PAL.greenDark, x + 5, y + 3, 5, 5); break;
    case 'van': rect(c, PAL.ink, x, y + 18, 64, 3); rect(c, '#e9edf2', x, y, 64, 20); rect(c, '#c4cad4', x, y + 14, 64, 6); rect(c, PAL.steel, x + 44, y + 3, 16, 9); rect(c, PAL.ink, x + 6, y + 18, 10, 5); rect(c, PAL.ink, x + 44, y + 18, 10, 5); rect(c, PAL.red, x + 4, y + 5, 28, 6); rect(c, PAL.white, x + 6, y + 7, 24, 2); break;
    case 'car': case 'car2': case 'patrol': { const body = kind === 'car' ? '#8a3d3a' : kind === 'car2' ? '#3d6b8a' : '#e9edf2';
      rect(c, PAL.ink, x, y + 14, 48, 3); rect(c, body, x, y + 4, 48, 14); rect(c, 'rgba(0,0,0,.2)', x, y + 14, 48, 4); rect(c, PAL.steel, x + 10, y, 22, 8); rect(c, PAL.ink, x + 12, y + 1, 18, 6); rect(c, PAL.ink, x + 6, y + 15, 9, 4); rect(c, PAL.ink, x + 33, y + 15, 9, 4);
      if (kind === 'patrol') { rect(c, PAL.ink, x, y + 8, 48, 3); rect(c, PAL.red, x + 14, y - 2, 8, 3); rect(c, '#3b6fd8', x + 22, y - 2, 8, 3); } break; }
    case 'lamp': rect(c, PAL.ink, x + 3, y + 4, 2, 12); rect(c, PAL.amber, x, y, 8, 5); rect(c, 'rgba(255,220,120,.18)', x - 6, y + 4, 20, 12); break;
    case 'crates': rect(c, PAL.woodDark, x, y, 16, 16); rect(c, PAL.wood, x + 1, y + 1, 14, 14); rect(c, PAL.woodDark, x + 1, y + 7, 14, 2); break;
  }
}

export type Dir = 'down' | 'up' | 'left' | 'right';
export interface Look { coat: string; hair: string; pants: string; skin?: string; hat?: boolean; }
export const LOOKS: Record<string, Look> = {
  player: { coat: '#b47a2c', hair: '#2a1d14', pants: '#2b3550' }, ward: { coat: '#7a2f45', hair: '#3a2230', pants: '#1d2434' },
  brooks: { coat: '#2f4f8a', hair: '#1f1b18', pants: '#1c2a48', hat: true }, vance: { coat: '#6a6a3a', hair: '#7a5a2a', pants: '#3c3c4c' },
  marla: { coat: '#2f7a76', hair: '#5a2020', pants: '#33344a' }, hale: { coat: '#4a4a5a', hair: '#1a1a1a', pants: '#25252f' }
};
export function drawCharacter(c: CanvasRenderingContext2D, look: Look, x: number, y: number, dir: Dir, frame: number, cuffed = false) {
  const skin = look.skin ?? PAL.skin, bob = frame === 1 ? 1 : 0;
  rect(c, 'rgba(0,0,0,.28)', x + 1, y + 14, 10, 3);
  const step = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  rect(c, look.pants, x + 2, y + 10 + (step > 0 ? 0 : 0), 3, 5 + (step > 0 ? 0 : 0)); rect(c, look.pants, x + 7, y + 10, 3, 5 - (step > 0 ? 0 : 0));
  if (step) rect(c, PAL.ink, x + (step > 0 ? 2 : 7), y + 14, 3, 1);
  rect(c, look.coat, x + 1, y + 5 - bob, 10, 6); rect(c, 'rgba(0,0,0,.18)', x + 1, y + 9 - bob, 10, 2);
  if (dir === 'left') { rect(c, look.coat, x, y + 6 - bob, 3, 5); } else if (dir === 'right') { rect(c, look.coat, x + 9, y + 6 - bob, 3, 5); } else { rect(c, look.coat, x - 1, y + 6 - bob, 2, 5); rect(c, look.coat, x + 11, y + 6 - bob, 2, 5); }
  if (cuffed) rect(c, PAL.fog, x + 3, y + 10 - bob, 6, 1);
  rect(c, skin, x + 2, y - bob, 8, 6); rect(c, look.hair, x + 1, y - 2 - bob, 10, 4);
  if (look.hat) { rect(c, look.coat, x, y - 3 - bob, 12, 2); rect(c, PAL.ink, x + 2, y - 4 - bob, 8, 1); }
  if (dir === 'down') { rect(c, PAL.ink, x + 3, y + 2 - bob, 1, 2); rect(c, PAL.ink, x + 8, y + 2 - bob, 1, 2); }
  else if (dir === 'left') { rect(c, PAL.ink, x + 3, y + 2 - bob, 1, 2); rect(c, look.hair, x + 7, y - bob, 4, 5); }
  else if (dir === 'right') { rect(c, PAL.ink, x + 8, y + 2 - bob, 1, 2); rect(c, look.hair, x + 1, y - bob, 4, 5); }
  else { rect(c, look.hair, x + 2, y - bob, 8, 5); }
}

/** Illustrations for scenario panels, drawn once into an offscreen canvas and shown pixelated. */
export function sceneCanvas(kind: string, marker?: [number, number]): HTMLCanvasElement {
  const W = 280, H = 140, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d')!;
  c.imageSmoothingEnabled = false;
  const grid = (col: string, step: number) => { for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) rect(c, ((x / step + y / step) % 2) ? col : 'rgba(0,0,0,.08)', x, y, step, step); };
  if (kind === 'room' || kind === 'porch') {
    rect(c, PAL.floor, 0, 0, W, H); grid(PAL.floorB, 14);
    if (kind === 'room') { rect(c, PAL.wall, 0, 0, W, 6); rect(c, PAL.wall, 0, 0, 6, H); rect(c, PAL.wall, W - 6, 0, 6, H); rect(c, PAL.wall, 0, H - 6, W, 6); rect(c, PAL.wallLight, 170, 0, 4, 80); rect(c, PAL.wallLight, 170, 100, 4, 40); rect(c, PAL.wall, 8, 52, 0, 0);
      rect(c, '#7a3b3b', 40, 82, 70, 22); rect(c, '#5d2c2c', 40, 98, 70, 6); rect(c, PAL.wood, 62, 62, 28, 12); rect(c, PAL.amber, 200, 24, 28, 18); }
    else { rect(c, '#5b4a45', 0, 0, W, 50); rect(c, PAL.woodDark, 120, 4, 30, 46); rect(c, PAL.wood, 124, 8, 22, 42); rect(c, PAL.wood, 0, 50, W, H - 50); grid('#7a5030', 14); rect(c, PAL.ink, 0, 112, W, 5); for (let x = 0; x < W; x += 20) rect(c, PAL.fog, x, 100, 3, 17); }
  } else if (kind === 'house') {
    rect(c, PAL.grassB, 0, 0, W, H); rect(c, '#5b4a45', 10, 8, 200, 104); rect(c, PAL.floor, 14, 12, 192, 96); rect(c, PAL.wallLight, 106, 12, 3, 96); rect(c, PAL.wallLight, 14, 60, 192, 3);
    rect(c, PAL.sidewalk, 214, 8, 56, 104); rect(c, PAL.woodDark, 218, 14, 48, 44); rect(c, PAL.slate, 218, 62, 48, 44);
  } else if (kind === 'car' || kind === 'road') {
    rect(c, PAL.road, 0, 0, W, H); rect(c, PAL.roadLine, 0, 66, W, 2); for (let x = 0; x < W; x += 36) rect(c, PAL.roadLine, x, 100, 20, 2);
    if (kind === 'car') { rect(c, '#2d6b8a', 40, 38, 190, 60); rect(c, PAL.ink, 62, 44, 120, 48); rect(c, '#365d78', 66, 48, 112, 40); rect(c, PAL.ink, 190, 52, 28, 32); rect(c, PAL.fog, 232, 44, 6, 8); rect(c, PAL.fog, 232, 84, 6, 8); rect(c, PAL.ink, 52, 30, 28, 8); rect(c, PAL.ink, 52, 98, 28, 8); rect(c, PAL.ink, 160, 30, 28, 8); rect(c, PAL.ink, 160, 98, 28, 8); }
    else { rect(c, '#8a3d3a', 100, 66, 90, 34); rect(c, PAL.ink, 118, 70, 54, 26); rect(c, PAL.sidewalk, 0, 0, W, 20); rect(c, 'rgba(255,255,255,.4)', 0, 20, W, 2); }
  } else { rect(c, PAL.slate, 0, 0, W, H); rect(c, PAL.paper, 40, 8, 200, 124); rect(c, PAL.paperDark, 40, 8, 200, 4); for (let y = 24; y < 120; y += 12) rect(c, PAL.fog, 56, y, 168, 2); }
  if (marker) { const mx = Math.round(marker[0] * W / 100), my = Math.round(marker[1] * H / 100); drawCharacter(c, LOOKS.vance, mx - 6, my - 8, 'down', 0); c.fillStyle = '#fff'; c.font = '8px monospace'; c.fillText('arrestee', mx - 16, my - 14); }
  c.fillStyle = 'rgba(8,10,18,.25)'; c.fillRect(0, 0, W, H);
  return cv;
}
