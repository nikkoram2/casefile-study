import { alderLane } from './gen-scenes';
import { SPRITES } from './gen-props';
import { allCharacterFrames } from './gen-characters';
const s = alderLane(); const get = (n: string) => SPRITES.find(p => p.name === n)!; const fr = allCharacterFrames();
const comp = s.bg; // preview composite
const car = get('veh/sedan_2'), pat = get('veh/patrol_occ');
comp.blit(car.img, 300 - 35, 262 - 36); comp.blit(pat.img, 400 - 35, 262 - 36 + 22, { flip: true });
const ch = (n: string, x: number, y: number) => comp.blit(fr.find(f => f.name === n)!.img, x - 12, y - 31);
ch('brooks/idle_left_0', 252, 262); ch('ward/idle_down_0', 220, 232); ch('player/idle_left_0', 200, 214);
comp.blit(get('prop/lamp').img, 330 - 9, 212 - 72); comp.blit(s.fg, 0, 0);
await comp.scaled('shots/scene-preview.png', 2);
