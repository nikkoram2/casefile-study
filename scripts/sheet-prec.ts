import { precinct } from './gen-scenes'; import { SPRITES } from './gen-props';
const s = precinct(); const g = (n: string) => SPRITES.find(p => p.name === n)!;
for (const [n, x, y] of [['off/desk', 200, 230], ['off/desk', 440, 230], ['off/cabinet', 60, 128], ['off/lockers', 560, 130], ['off/board', 320, 100], ['off/plant', 30, 340], ['off/cooler', 610, 200], ['off/copier', 140, 134]] as [string, number, number][]) s.bg.blit(g(n).img, x - (g(n).ax ?? 0), y - (g(n).ay ?? 0));
await s.bg.scaled('shots/prec.png', 2);
