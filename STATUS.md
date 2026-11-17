# Build status vs. the specification (honest)

**Built and tested**: extraction of the guide (18 cases, 20 DCs, 10 core topics); content validator + coverage report; seeded scenario-variant engine (29 validated Ch. 6 variants, 13 doctrines, never repeats an identical scenario in a run); recall engine (104 items); 3-level hints tracked separately; first-attempt / assisted / unassisted / per-category stats; completion vs. coverage vs. mastery separated; autosave + resume; Rapid Review, Targeted Practice (chapter / cases / definitions / topics / applications / weak areas), 5-minute review, Case Encyclopedia (18 cases), notebook, results dashboard with copy/print; settings (text size, reduced motion, high contrast, mute, fullscreen); playable Prologue + Chapter 6; static production build.
**Tests**: `npm test` (19k assertions over 900 simulated campaigns), validator, and headless-Chromium end-to-end runs of the built game (all-correct, all-wrong, all-hints, practice modes, reload/resume). No console errors.

**Not built yet**: Chapter 7, 8, 10 investigation missions (their content is available through practice/encyclopedia only); the final Blackridge Hearing; the five endings, epilogues, ending archive and Case Reopened (scenario `flags` are already recorded for them); chapter-specific interrogation interface; sound beyond simple synth effects; real-student playtime measurements (the ~15 min Ch. 6 figure is a design estimate, not measured).
**Deviation**: Phaser 3 and Vite could not be installed (no network for package installs here), so the game uses TypeScript + esbuild with a custom Canvas renderer and HTML overlay. Output is still a static site; swapping the renderer later is possible but is a rewrite of `src/engine`.
**Not deployed.** See `DEPLOY.md`.

## Overhaul status (M1–M3 done; M4–M8 NOT done)
- M1 audit + style guide: `docs/AUDIT.md`, `docs/STYLE_GUIDE.md`, `docs/ASSET_WISHLIST.md`.
- M2 art pipeline: `scripts/gen-*.ts` generate PNG atlas (606 frames) + Alder Lane layers; engine loads them (`engine/assets.ts`, `anim.ts`, `director.ts`, `stage.ts`). Art is code-generated, not final.
- M3 benchmark: animated vehicle-search sequence for S6-GANT-1..3 and S6-VEH-1..3 (`game/vehicleSequence.ts`, `content/sequences.ts`). Other scenarios still use the classic panel.
- Not built: full precinct/street redesign (M4), UI overhaul with portraits and notebook (M5), other animations (M6), Chapters 7/8/10 + final hearing + endings (M7), Case Memory system, real-playtime measurement, deployment.
- Tests: validator passes (now checks sequence mappings), sim 19,155 assertions, e2e correct/wrong/hints, `tests/e2e-seq.ts` 85 checks.

## Update: campaign complete
Done and tested (validator, 41,801 sim checks, e2e correct/wrong/hints/practice, vehicle-sequence e2e 85 checks):
- Chapters 6, 7, 8, 10 playable in one campaign, with chapter recall rounds, a final suppression hearing with a precedent-citation round, and five endings.
- New walkable world on the Stage engine; animated vehicle-search benchmark (Ch 6); staged scene intros for every other scenario (arrest and handcuffing, consent door entry, document inspection, residential search, interview room, evidence presentation, hearing).
- Dialogue with portraits, typewriter text and a conversation log; notebook with evidence tab.
- Case Memory Archive: case cards with status, search, chapter filter, typed recall (stored separately), comparison pairs, and a three-stage Memory Drill (timed fact reveal, precedent selection with progressive difficulty, typed rule) that targets weakest cases first.

Known limits (honest): all art is code-generated placeholder-quality pixel art; Ch 7/8/10 reuse the precinct and Alder Lane backgrounds; scene intros are short staged loops, not full cutscenes; no dedicated courtroom background; the correct option is often the longest in the new scenarios (validator warning); a few new wrong options lack misconception notes; the typed-recall matcher is keyword-based and can be too lenient or strict; live-site behaviour is unverified from the build environment.
