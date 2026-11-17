// Chooses which validated scenario variant a player sees. Same objective is never repeated identically:
// prefer an unseen variant; seeded so runs are reproducible.
import { SCENARIOS } from '../content/scenarios';
import type { Scenario } from '../content/types';
import { hashSeed, rng } from './rng';

export function pickVariant(objectiveId: string, seen: string[], seed: number, salt = ''): Scenario | null {
  const pool = SCENARIOS.filter(s => s.objectiveId === objectiveId);
  if (!pool.length) return null;
  const unseen = pool.filter(s => !seen.includes(s.id));
  const use = unseen.length ? unseen : pool;
  const r = rng(hashSeed(seed, objectiveId, salt));
  return use[Math.floor(r() * use.length)];
}
/** Chapter challenge: revisit missed objectives first (different variant), then transfer on high-difficulty doctrines. */
export function pickChallenge(missed: string[], seen: string[], seed: number, n = 2): Scenario[] {
  const prio = ['CH6-GANT', 'CH6-CONSENT', 'CH6-VEHICLE', 'CH6-CONTAINER', 'CH6-GRAB', 'CH6-PRETEXT', 'CH6-KNOCK', 'CH6-ROBINSON'];
  const order = [...missed.filter(m => prio.includes(m) || m.startsWith('CH6-')), ...prio];
  const chosen: Scenario[] = []; const used = new Set<string>(); const seenNow = [...seen];
  for (const obj of order) {
    if (chosen.length >= n) break;
    if (used.has(obj)) continue;
    const pool = SCENARIOS.filter(s => s.objectiveId === obj);
    const unseen = pool.filter(s => !seenNow.includes(s.id));
    if (!unseen.length) continue;          // never serve the identical question again for credit
    used.add(obj);
    const r = rng(hashSeed(seed, obj, 'challenge'));
    const s = unseen[Math.floor(r() * unseen.length)];
    chosen.push(s); seenNow.push(s.id);
  }
  return chosen;
}
