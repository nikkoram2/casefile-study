import { Img } from './pixel';
import { SPRITES } from './gen-props';
let x = 4, y = 4, rowH = 0; const W = 700; const sh = new Img(W, 330); sh.rect(0, 0, W, 330, '#2d3858');
for (const s of SPRITES) { if (x + s.img.w + 4 > W) { x = 4; y += rowH + 4; rowH = 0; } sh.blit(s.img, x, y); x += s.img.w + 4; rowH = Math.max(rowH, s.img.h); }
await sh.scaled('shots/props-sheet.png', 2); console.log(SPRITES.length, 'sprites');
