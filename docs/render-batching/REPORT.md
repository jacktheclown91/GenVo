# Phase 3L — Batched GPU creature rendering and playable performance (October 17, 2026)

Nothing is committed or pushed, and no release is packaged. These are automated measurements in headed Chromium on this machine (NVIDIA RTX 3050, Windows, D3D11, a 75 Hz display). They are not visual or gameplay acceptance by a person.

## Result

| Day-120 world, 1440×900, headed GPU | Before Phase 3L | Phase 3L |
| --- | --- | --- |
| Presented frame rate (60 s runs) | 12.0–12.5 fps | 28.6–29.9 fps |
| Excluding the intermittent ~1.1 s stalls present in both paths (see Remaining limits) | 14.2 fps | 32.9–34.0 fps |
| Later 60 s runs with no stalls at all (after the start-up change, `startup/steady-*.json`) | — | 28.2–29.4 fps |
| Ten-minute session (world grows to day 208, 370 animals) | — | 33.9 fps |
| Frame time p50 / p95 | 66.7 / 120 ms | 26.7 / 40–53 ms |
| Render p50 (whole frame's drawing) | 52.6–53.4 ms | 17.6–19.4 ms |
| Creature preparation + composition p50 | 57 + 0 ms (baseline) | 8.1 + 3.5 ms |
| Canvases created per second | about 280 (25 s runs) | 40 over the ten-minute session; 200–240 in 25 s runs while caches fill |

On a 75 Hz display, frames are presented at 2 refresh intervals (26.7 ms, 37.5 fps) or 3 (40 ms, 25 fps). Most Phase 3L frames now take 2.
- **Borderline:** 30 fps. Runs land between 28 and 34 fps, depending on run-to-run variance and whether the stalls occur. Two later 60 s runs with no stalls measured 28.2 and 29.4 fps, so 30 fps is not met consistently.
- **Not met:** 60 fps at day 120.

Nothing was removed from the simulation or the artwork:
- 32-pose walking, organic joints, expressions, reactions and eight-direction drawing are unchanged.
- The two renderers produce pixel-identical frames in deterministic rendering (see Parity).

## What the bottleneck was

1. **Earlier benchmarks did not use the GPU.** By default, headless Chromium renders through SwiftShader, a software GPU. Every frame measurement from Phase 3H to 3K was taken that way, and hid this cost. The new harness (`tools/gpu-render-benchmark.cjs`) runs a visible window and refuses to measure if the browser reports a software renderer.
2. **The real cost was flushing a just-repainted canvas once per creature.** Chrome records 2D canvas drawing and rasterizes it only when the canvas is read or shown. The old flow painted each fresh creature into a scratch canvas and immediately copied it to the screen. Each copy forced the browser to finish that canvas's pending work, about 0.4–0.6 ms per creature on the GPU path (83.5 ms of a 112 ms frame at day 20). Day 120 shows 70–85 freshly drawn creatures per frame, because walking poses rarely repeat.

## What changed (all switchable; `docs/CHANGE-MANIFEST-2026-10-15.md` group T)

| Module | Change |
| --- | --- |
| `src/render/canvas-recorder.js` (new) | During the creature pass, page-context operations are recorded, then replayed in exactly the original order once every creature is prepared. Property reads come from a shadow state kept through save/restore. Any other read (`getTransform`, `getImageData` and so on) replays pending work first, so its answer is exact. |
| `src/render/genvo-draw.js` | **Staging** (`SPRITE_BATCH`, `?spriteBatch=0` turns it off). See the steps below the table. |
| `src/render/renderer.js` | The creature loop runs through the recorder (`frameStats` timing). **Terrain tile canvas pool** (`?tilePool=0` turns it off). Every terrain refresh (season, or at most every 20 s) had cleared the tile caches, and every stale tile got a new canvas: about 270 a second while walking, each later finalized by the garbage collector. Tiles now recycle canvases, reset exactly like new ones, with at most 4,096 spare. |
| `src/render/indexed-part-renderer.js` | A tinted part frame used in the current frame is never recycled within that frame (`beginTintFrame`). With 200 walking, individually pigmented creatures, the 256-frame cache was exceeded inside a single frame. Repainting frames that staged bodies still referenced brought the per-creature flush back: creature preparation went from 10 to 134 ms. The cache may now grow to 2,048 per asset for that frame and shrinks back afterwards. |
| `src/main.js` | Switches `?spriteBatch=0`, `?batchMode=exact\|gpu`, `?batchPage=`, `?batchPages=` (staging size, used by the overflow test), `?tilePool=0`. |

How staging works:
1. Each fresh creature body is drawn at the origin of its own small canvas from a per-frame pool (at most 384). That is exactly how the old scratch canvas rasterized it.
2. Before the replay, all outlines are composed in one pass into slots of large final pages (at most 4 of 1024², each slot surrounded by a 2-pixel transparent gutter).
3. The replay copies each finished sprite from its slot to the screen.

So every staging surface is written completely before anything reads it, and each is flushed about once per frame. If staging fills, everything prepared so far is replayed and staging restarts, so no creature is ever dropped. A cached sprite evicted mid-frame is closed only after the replay that may still draw it.

Alternatives measured and rejected (evidence in `docs/render-batching/rejected-variants/`):
- **One CPU atlas page**, sprites copied in from the scratch canvas: still one flush per creature (62 ms of creature preparation).
- **Finishing sprites directly in the atlas:** 176 ms; the repainted body canvas stalled in the same way.
- **GPU-backed scratch canvases:** no effect. Chrome keeps canvases this small in software.
- **`gpu` mode,** drawing bodies straight into a large GPU page: as fast as `exact` in three alternating rounds (25–31 against 22–35 fps). But drawing at an offset inside a large surface rounds a few rotated-part edge pixels differently, so `exact` is the default. `gpu` remains selectable (`?batchMode=gpu`).
- **Least-recently-used sprite-cache eviction** and **larger tint caches** at ordinary loads: no measurable gain.
- **CPU-backed final pages:** no change in GPU differences.

Simulation untouched: no change to decision timing, movement parity, genetics, resources, predation, reproduction or RNG sequences. All presentation reads the same canonical organism state. Benchmarks compared old and new renderers on a frozen copy of the Phase 3K simulation (the restoration backup with only these rendering files overlaid). That was needed because concurrent simulation work in the shared tree, the developmental-symmetry changes, alters the day-120 world.

## Start-up: prepared first scene (creator conditions of 2026-10-17)

Starting or loading a world blocked the page for 1.0–1.3 s. The cause was the first frame building every visible terrain chunk at once (found by the world-load session, `docs/world-load/REPORT.md`).

**What changed:**
- `Renderer.prepareScene` builds the visible chunks, nearest first, within a 24 ms budget per frame, through the same chunk cache `render()` uses (no second cache).
- The page is not drawn meanwhile: the canvas shows the scene's own background colour and the loading text, never a partial scene, so there is no pop-in.
- The first real frame is drawn only once every visible chunk exists, and the loading text changes after that frame (`renderer.sceneReady()`).
- The start of every frame (world switch, habitat field, macro habitat, camera, view range) was moved verbatim into `syncScene()`, which `render()` and `prepareScene()` share, so preparation sees exactly the state the first frame draws.
- Off-screen chunks are still built by the existing refresh queue, one every other frame. The queue now picks the chunk nearest where the camera is heading (half a second ahead) instead of first-in-first-out.
- The simulation keeps running during preparation, and its timing is untouched. `render()` still builds anything missing itself, so tools and tests that never prepare are unchanged.
- Chunks are invalidated only by the existing rule (the habitat-field day signature and the terrain refresh at most every 20 s); nothing new rebuilds them.

**Measured** with `tools/world-load-timing.cjs` in headed GPU Chromium (`startup/prepared.json`; the before numbers are from `docs/world-load/after.json`):

| | Before | Now |
| --- | --- | --- |
| New world: longest main-thread task | 1,299 ms | 206 ms |
| New world: longest gap between frames | 1,374 ms | 374 ms |
| New world: loading text until the complete first scene | 1.7 s | 2.3 s |
| Continue saved world: longest main-thread task | 1,078 ms | 390 ms |
| Continue saved world: longest gap between frames | 1,174 ms | 387 ms |
| Continue saved world: "World loaded" shown | 1.5 s | 2.7 s |

Both cases stay under the 3 s goal. The complete scene arrives about 0.6–1.2 s later than with the single blocking frame, because the same work is now spread over budgeted frames while the game stays responsive. The remaining 0.2–0.4 s frame is the first real frame's other cold work (sprite and tint caches, habitat scenes, the live vegetation window); it is still well below 1 s.

**Pixel equivalence** (software, all six moving scenes, 40 frames each):
- Prepared against unprepared: 240/240 frames identical (`startup/parity-prepared-sw.json`), with preparation at the same tick and clock.
- Previous renderer against the current one (`syncScene` refactor and queue order): 240/240 identical (`startup/parity-renderer-before-after-sw.json`).

Preparing a few frames earlier means chunks capture plant state as of preparation time. That is the same kind of staleness the chunk cache always had: chunks refresh at most every 20 s, and the area around the player is drawn live.

**Steady gameplay:** no regression. Day 120 at 1440×900 measured 28.2 and 29.4 fps in 60 s runs (earlier 28.6–29.9).

**Save/load:** unchanged; this is rendering only.

**Test-tool fast-forward overlay** (`tools/fast-forward-overlay.cjs`). The benchmark, profilers and parity tools now paint a full-screen "Simulating N days… (test tool fast-forward, not game loading)" notice before fast-forwarding. They remove it, and wait for a repaint, before measurement starts. Tools updated: `gpu-render-benchmark`, `profile-population-frames`, `profile-cpu-functions`, `profile-render-sections`, `moving-frame-parity`, `render-parity`.

## Measurements (headed GPU; `docs/render-batching/matrix/`, `curve/`, `final/`, `stalls/`)

Presented fps, old → new (20 s runs):

| Day | 800×600 | 1440×900 | 1920×1080 |
| --- | --- | --- | --- |
| 0 (181 animals) | 71.7 → 72.6 | 70.4 → 71.7 | 61.7 → 70.2 |
| 20 (187 animals) | 53.3 → 62.1 | 27.9 → 58.1 | 17.9 → 40.0 |
| 120 (321 animals) | 25.7 → 43.7 | 10.8 → 25.5 | 7.8 → 20.7 |

The day-120 entries include the intermittent stalls described below. At 1440×900, render p50 fell from 69 to 23.9 ms and creature cost from 57 to 10.4 + 4.2 ms. Simulation mean is 2–4 ms per frame and unchanged.

**Workload curve** (staged walking creatures added to a day-0 world, 1440×900; creature preparation + composition p50):

| Walking creatures (fresh sprites per frame) | Old | New |
| --- | --- | --- |
| 10 (11–13) | 4.7 ms, 59.9 fps | 1.6 + 0.7 ms, 70.4 fps |
| 25 (22–24) | 7.4 ms, 48.4 fps | 2.7 + 1.3 ms, 66.0 fps |
| 50 (40–48) | 17.3 ms, 26.8 fps | 4.8 + 2.3 ms, 51.9 fps |
| 100 (83–99) | 31.3 ms, 14.8 fps | 10.0 + 4.7 ms, 32.3 fps |
| 200 (174–202) | 133.2 ms, 5.7 fps | 33.9 + 10.0 ms, 14.2 fps (the cliff of 134 ms before the tint fix) |

The cost grows about linearly to 100 walkers, then somewhat faster (twice the fresh sprites cost about 3.2× at 200). The cliff the curve exposed was the tint-cache recycling described above.

**CPU and GPU costs.** CPU-side cost per fresh creature is about 0.12–0.15 ms (body drawing including part tinting) plus about 0.05 ms of composition. The GPU's share isn't separable with these tools; the frame-time totals above include it.

**Memory and canvases.**
- Staging: at most 16 MB of final pages plus about 12 MB of body pool at the current zoom.
- Terrain pool: at most 16 MB of spare tiles.
- Canvas creation over the ten-minute session: 40 a second, against about 280 on the old path (the tile pool removes the per-refresh reallocation). Short runs show 200–240 a second while tile and tint caches fill.
- JS heap after the ten-minute session: 225 MB, down from 314 MB at the start.

**Stability.** Ten minutes of continuous walking at day 120 and beyond: no page errors, simulation live throughout, player alive.

## Parity (`tools/moving-frame-parity.cjs`; `docs/render-batching/parity/`)

The earlier 24-frame paused comparison did not exercise walking. This tool runs two clients on the same seed with identical simulation ticks and inputs and a frozen clock. Each client has a fresh renderer, and the harness waits for sprite bitmaps so cache hits match. Every frame is rendered and hashed while creatures move.

| Scene | What it exercises |
| --- | --- |
| natural | Day-120 world, player on AUTO |
| crowd | 60 extra walkers, up to 134 moving |
| water | Swimmers (13–14 in water on screen) |
| bound | Spring-leg bounding (up to 54–113 spring-legged animals on screen) |
| combat | A Stalker engaged on the sprinting player |
| weather | Heavy rain and night |

- **Deterministic (software) rendering:** old and new are pixel-identical in every frame, 480/480 and 720/720 across all six scenes (46–134 moving creatures per frame). That holds for the final design and with forced staging overflow (one 256-pixel page holding 4 sprites, many flushes per frame): 60/60.
- **GPU rendering is not deterministic even for the old renderer.** The old path against itself matches on only 19–24 of 40 frames, differing by up to 6 pixels per frame with channel differences of 1–2. New against old: mean 0.8–1.1 differing pixels per frame, at most 6 in a frame, almost all of 1–2 levels. Across two 40-frame scenes, 2–9 pixels reached 12–30 levels. Every such pixel inspected lay on the anti-aliased edge of a vector overlay (the readability ring) drawn after the creatures, over identical creature pixels (`gpu-diff-crop.png`). That points to GPU anti-aliasing of vector shapes, which varies slightly with the GPU work batched around it.
- An earlier GPU-only bleed (neighbouring slot pixels sampled at fractional offsets) is prevented by the transparent gutters. With a transparent surround, sub-rectangle copies equal whole-canvas copies at every tested offset on the GPU.

## Remaining limits

1. **Intermittent ~1.1 s stalls.** About 7 per minute in recent runs, in both the old and new renderers, outside JavaScript (no render, simulation or GC time in those frames). They were absent in the matrix runs earlier the same day. The likely cause is browser or OS-level, such as the visible test window being covered or throttled, or the GPU driver. This is unverified and needs a check in a person's own play.
2. **60 fps at day 120 is not reached.** Per frame: render about 18–24 ms (creatures 12, terrain and vegetation about 6–9), simulation 2–4 ms, browser and composition the rest. Further options, none implemented:
   - **Cache genuinely reusable walking poses.** Sampled keys never repeated within 4 seconds, partly because head-turn and other key fields multiply the 32 phases; finding which fields vary without visual effect could make strides reusable.
   - Move terrain chunk building (about 10% of the frame while walking) off the critical frames.
   - A WebGL creature compositor, only after a separate architecture comparison, as the directive requires.
3. **Simulation ecology steps** are not split across frames (that would change simulation ordering); their cost appears as occasional p95 frames.

## Verification

- **Fast tier:** 374 pass, 5 known failures, 0 new (`docs/test-runs/fast-phase3l-2026-10-17.json`). New test: `tests/canvas-recorder.mjs`.
- **After the start-up change:** `performance-hotfix` failed because the refresh-queue ordering read a camera that this test's stub renderer lacks; fixed, it falls back to queue order. `observer-play` (simulation only) failed at 532 ms against its 500 ms limit while a parity run loaded the CPU; on an idle machine it measured 475–483 ms, which passes but is close to the limit (it was 465 ms before the concurrent simulation changes). Fast tier: `docs/test-runs/fast-phase3l-startup-2026-10-17.json`.
- **Full tier:** 383 pass, 7 known failures (the same 7 as before), 0 new, 0 timeouts, in 871 s (`docs/test-runs/all-phase3l-2026-10-17.json`). This ran on the shared working tree, which also includes the concurrent developmental-symmetry work.
- **Benchmarks** were run in a frozen Phase 3K simulation tree. Parity was checked in both software and GPU modes.

## Compromises to artwork or animation

None requested. The default mode is pixel-identical in deterministic rendering. The faster-in-theory `gpu` mode, which would round a few rotated-part edge pixels differently, is optional and off.
