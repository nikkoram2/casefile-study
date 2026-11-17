# CASEFILE: Shadows of Justice

A top-down detective game for studying Criminal Procedure (Chapters 6, 7, 8 and 10). Study aid only. It does not replace your assigned readings or your instructor, and playing does not guarantee exam readiness.

## For classmates
1. Open the link your classmate sent you (or open `index.html` in a modern desktop browser).
2. Press **Start Full Investigation**. No account, install or sign-in. Progress saves in your browser (use the same browser to continue).
3. Move with WASD/arrows, **E** to interact (or click), **Tab** notebook, **Esc** pause, **1–9** choose options, **H** hint.

**What is playable in this version**
- Prologue + the full **Chapter 6** investigation (warrants, knock-and-announce, arrest, vehicles, consent, pretext stops, a chapter challenge and a retrieval round).
- **Rapid Review**, **Targeted Practice** and the **Case Encyclopedia** cover all 18 cases and 20 definition cards across Chapters 6, 7, 8 and 10.
- Investigation missions for Chapters 7, 8 and 10, the final hearing, multiple endings and Case Reopened are **not built yet**.

## For the maintainer
Needs Node 20+ (only to build; classmates need nothing).
```
npm install
npm run check     # extract guide → validate coverage → typecheck → simulation tests → production build
```
Output is the static site in `dist/`. See `DEPLOY.md`. Other scripts: `npm run validate` (writes `COVERAGE_REPORT.md`), `npm test`.
Browser tests: `tests/e2e.ts` and `tests/e2e-practice.ts` (need Playwright + Chromium).

## Structure
`src/content` (guide JSON, cases, scenarios, dialogue; no rendering code) · `src/learning` (recall builder, grading, mastery, scheduler) · `src/engine` (canvas world, procedural art, audio) · `src/game` (UI, flow, screens) · `src/persistence` · `scripts` · `tests`.
`src/content/source/study-guide.txt` is the extracted study guide. `scripts/extract-guide.ts` regenerates `generated/guide.json` from it, and the validator checks every guide-derived string against it.
