// Packs generated sprites into one atlas + writes scene layers. Run: npm run assets
import { writeFileSync, mkdirSync } from 'node:fs';
import { Img } from './pixel';
import { allCharacterFrames } from './gen-characters';
import { SPRITES } from './gen-props';
import { SCENES } from './gen-scenes';
import { ANCHOR } from '../src/engine/spec';
const OUT = 'src/assets/generated'; mkdirSync(OUT, { recursive: true });
const items: { name: string; img: Img; ax: number; ay: number }[] = [];
for (const f of allCharacterFrames()) items.push({ name: f.name, img: f.img, ax: ANCHOR.x, ay: ANCHOR.y });
for (const s of SPRITES) items.push({ name: s.name, img: s.img, ax: s.ax ?? Math.floor(s.img.w / 2), ay: s.ay ?? s.img.h });
items.sort((a, b) => b.img.h - a.img.h || b.img.w - a.img.w);
const AW = 1024; let x = 1, y = 1, rowH = 0; const placed: any[] = [];
for (const it of items) { if (x + it.img.w + 1 > AW) { x = 1; y += rowH + 1; rowH = 0; } placed.push({ it, x, y }); x += it.img.w + 1; rowH = Math.max(rowH, it.img.h); }
const AH = Math.ceil((y + rowH + 1) / 16) * 16; const atlas = new Img(AW, AH); const frames: Record<string, any> = {};
for (const p of placed) { atlas.blit(p.it.img, p.x, p.y); frames[p.it.name] = { x: p.x, y: p.y, w: p.it.img.w, h: p.it.img.h, ax: p.it.ax, ay: p.it.ay }; }
await atlas.save(`${OUT}/atlas.png`);
const scenes: Record<string, any> = {};
for (const mk of SCENES) { const s = mk(); await s.bg.save(`${OUT}/${s.id}_bg.png`); await s.fg.save(`${OUT}/${s.id}_fg.png`); scenes[s.id] = { lights: s.lights, puddles: s.puddles, walk: s.walk, w: s.bg.w, h: s.bg.h }; }
writeFileSync(`${OUT}/atlas.json`, JSON.stringify({ w: AW, h: AH, frames, scenes }));
console.log('atlas', AW, 'x', AH, Object.keys(frames).length, 'frames;', Object.keys(scenes).join(','));
