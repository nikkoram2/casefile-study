# Milestone 1 — Audit of the v1 engine

**Verdict: extend, do not migrate to Phaser.** The custom canvas engine is small (≈750 lines) and the parts that must change (rendering, world, animation) are isolated from the parts that must not (content, learning, persistence). Phaser would add ~1 MB and a rewrite of input/UI glue without solving the actual problems, which are art and animation, not engine features. Migration remains an option later; everything below keeps rendering behind `engine/world.ts` so it stays cheap.

| Area | v1 state | Limitation | Decision |
|---|---|---|---|
| Resolution | 480×272, 16px tiles, 12×16 characters | Too small for facial features, props, readable objects | Move to **640×360**, characters **24×32**, camera over larger maps |
| Art | Filled rectangles drawn every frame (`art.ts`) | No shading, no detail, no layering, code-bound | **Asset pipeline**: pixel toolkit generates PNG atlases + layered background/foreground images at build time; runtime only loads images |
| World | Single-screen tile grid, no camera | Sparse, no depth layers, no occluders | Layered maps (background, depth-sorted actors/props, foreground occluders), scrolling **camera** with pan/zoom/shake |
| Animation | 2-frame walk, directional eyes | No poses (inspect/search/cuff), no sequencing | **Animator + Actor** with named clips, mirrored directions, and a **Director** that runs async sequences (walk, turn, play, camera, wait) with skip/accelerate |
| Lighting/FX | Flat dark overlay, 70 rain rects | No light sources, no puddles/reflections | Half-resolution **light mask** (street lamps, windows, patrol flasher), rain + splashes + puddle ripples, all gated by reduced-motion |
| Investigations | Walk → E → modal question | Player never sees the events analysed | **Investigation sequences**: observe → inspect facts → decide in-world → watch result → consequence. Benchmarked on vehicle search |
| UI | Navy rounded cards, emoji HUD | Looks like a website | HUD emoji replaced with SVG icons now; full case-file UI is Milestone 5 |
| Reusable | content/, learning/, persistence/, validator, sim tests, panels' hint+feedback logic | — | **Untouched.** Scenario IDs, save format, grading and 104 recall items are unchanged |

**Compatibility rules kept:** scenario IDs unchanged · `casefile.profile.v1` save format unchanged (new evidence cards are an optional additive field) · `npm run validate` and `npm test` must keep passing · static single-file distribution.
