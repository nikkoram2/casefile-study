# Asset wishlist (what hand-made art would replace)

All art in this build is **code-generated pixel art** (`scripts/gen-*.ts`). It is a working benchmark, not final art. It is original, so there are no licensing questions, but a human pixel artist would improve it a lot.

| Asset | Current state | Ideal replacement |
|---|---|---|
| Characters (8) | 24×32 procedural paper-doll, 12 clips, 3 directions + mirror | Hand-drawn sheets with the same frame names (`char/pose_dir_i`), same anchor (12,31) |
| Faces / portraits | Not built (M5) | 64×64 portraits with 3–4 expressions per speaker |
| Vehicles | One sedan (door-open frames), patrol car, occupied patrol car, van | Variants, interior view for searches, trunk and rear-door frames |
| Alder Lane | One layered night street (bg/fg PNG) | Two or three block variations, porch and apartment interiors |
| Precinct | Props generated (desks, lockers, board); room not yet composed | Composed room background with lighting |
| Evidence | 6 icons 16×16 | Full set per chapter |
| Audio | WebAudio synth | Recorded ambience, door, footsteps, rain, music |

Swap procedure: replace `src/assets/generated/atlas.png` and `atlas.json` with an artist's atlas using the same frame names; no code changes needed.
