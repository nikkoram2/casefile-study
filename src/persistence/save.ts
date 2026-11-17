export interface AttemptRecord {
  itemId: string; objectiveId: string; chapter: number;
  category: 'case' | 'definition' | 'topic' | 'application';
  correct: boolean; hintsUsed: number; ts: number; mode: string; runId: string; variant?: string;
}
export interface Settings { textScale: number; reducedMotion: boolean; highContrast: boolean; muted: boolean; }
export interface Run {
  runId: string; seed: number; mode: 'full'; startedAt: number; elapsedMs: number;
  stepIdx: number; map: string; px: number; py: number;
  seenScenarios: string[]; seenDialogue: string[]; evidence: string[]; flags: Record<string, boolean>;
  completedSteps: string[]; chapterDone: Record<string, boolean>; encountered: string[];
  challenge: string[]; recallQueue: string[];
}
export interface Profile { v: 1; records: AttemptRecord[]; run: Run | null; settings: Settings; endingsUnlocked: string[]; }

const KEY = 'casefile.profile.v1';
export const defaultSettings = (): Settings => ({ textScale: 1, reducedMotion: false, highContrast: false, muted: false });
export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const p = JSON.parse(raw) as Profile; if (p && p.v === 1) { p.settings = { ...defaultSettings(), ...p.settings }; return p; } }
  } catch { /* storage unavailable or corrupted: fall through */ }
  return { v: 1, records: [], run: null, settings: defaultSettings(), endingsUnlocked: [] };
}
export function saveProfile(p: Profile) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode: progress simply won't persist */ } }
export function resetProfile(keepSettings = true): Profile {
  const old = loadProfile();
  const p: Profile = { v: 1, records: [], run: null, settings: keepSettings ? old.settings : defaultSettings(), endingsUnlocked: [] };
  saveProfile(p); return p;
}
