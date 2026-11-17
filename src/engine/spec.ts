// Shared by the asset generator (scripts/) and the runtime (engine/). Frame names: `${char}/${pose}_${dir}_${i}`.
export type Dir = 'down' | 'up' | 'left' | 'right';
export const FW = 24, FH = 32;                 // character frame size; feet anchor at bottom-centre (12,31)
export const ANCHOR = { x: 12, y: 31 };
export interface ClipDef { frames: number; fps: number; loop: boolean; dirs: Dir[] }
// Directions drawn by the generator ('right' is the mirrored 'left').
export const CLIPS: Record<string, ClipDef> = {
  idle: { frames: 2, fps: 2, loop: true, dirs: ['down', 'up', 'left'] },
  walk: { frames: 4, fps: 8, loop: true, dirs: ['down', 'up', 'left'] },
  talk: { frames: 2, fps: 4, loop: true, dirs: ['down', 'left'] },
  react: { frames: 2, fps: 4, loop: true, dirs: ['down', 'left'] },
  inspect: { frames: 3, fps: 5, loop: false, dirs: ['down', 'up', 'left'] },
  read: { frames: 2, fps: 3, loop: true, dirs: ['down', 'left'] },
  search: { frames: 4, fps: 5, loop: true, dirs: ['up', 'left'] },
  handcuff: { frames: 3, fps: 4, loop: false, dirs: ['down', 'left'] },
  present: { frames: 2, fps: 3, loop: true, dirs: ['down', 'left'] },
  cuffed: { frames: 2, fps: 2, loop: true, dirs: ['down', 'left'] },
  type: { frames: 2, fps: 6, loop: true, dirs: ['up'] },
  pickup: { frames: 3, fps: 5, loop: false, dirs: ['down', 'up', 'left'] }
};
export const CHARACTERS = ['player', 'ward', 'brooks', 'vance', 'marla', 'hale', 'clerkA', 'clerkB'] as const;
export type CharId = typeof CHARACTERS[number];
export const frameName = (char: string, pose: string, dir: string, i: number) => `${char}/${pose}_${dir}_${i}`;
export interface FrameInfo { x: number; y: number; w: number; h: number; ax: number; ay: number }
