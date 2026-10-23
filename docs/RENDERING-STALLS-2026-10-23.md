# Rendering stalls while walking (October 23, 2026)

**Creator direction:** fix the measured rendering stalls. Investigate terrain water-mask rebuilding, canvas draw operations and dynamic terrain updates.

## How it was measured

All measurements use the real GPU (NVIDIA GeForce RTX 3050) in visible Chromium: an exported build, a fresh world (seed `GENVO-F6B2B88C`, which reproduced the stalls), walked by hand at 1x for 40 seconds.

- **`tools/profile-walking-frames.mjs`** wraps the renderer methods, the simulation step and the frame-loop subsystems in the page (measurement only) and records each frame's breakdown. It must time with `performance.now()`. The shared animation-frame timestamp shifts every record by one frame; that error first made the stalls look like they were outside the frame function.
- **`tools/trace-walking-gaps.mjs`** records a Chrome trace and lists the main-thread tasks inside every gap of 60 ms or more.
- **Test copies only:** the exported test copies (not the repository) were also instrumented around the HUD block, the whole frame function and the habitat, focal and wayfinding builders.

## What caused the stalls

The trace showed every long gap is the game's own frame function (150–220 ms). Garbage collection (121 ms in 15 s) and idle callbacks (62 ms) were minor. Within long frames ([before](rendering-stalls-2026-10-23/walk-probe2.json)):

1. **Water-mask building, about 100–112 ms per long frame (41% of long-frame time).**
   - Each terrain tile's shoreline contour takes 1,024 samples, and each sample does a weighted neighbourhood sum plus two noise lookups.
   - It was cached per tile, but the cache was wiped by every underground change (see 2).
2. **Whole-world cache resets on every underground change.**
   - Any passage dug, collapsed or re-aired by burrowers incremented the underground revision.
   - The renderer then reset almost all of its world caches: water masks, the habitat field, every tile cache, and the regional focal and transition lists.
   - Rebuilding the focals alone took 18–120 ms per long frame. The water masks for visible shorelines were rebuilt each time too.
3. **Simulation tick slices:** 36–88 ms in many long frames (see the remaining work below).

The canvas recorder flush (creature compositing) and creature drawing were steady costs of a few milliseconds, not stall causes.

## Fixes

- **Uniform tiles skip sampling** (`src/render/landform.js`). A sample in a tile reads only cells from x−2 to x+1 (and the same in y). If they are all land, every score is 0 (empty mask); if all water, every score is 1 (full mask). Those tiles now share one read-only mask that is identical to the sampled result. About 98% of tiles take this path, which also saves about 2 KB per tile (about 32 MB in a well-explored 128×128 world).
- **Underground changes keep what they cannot affect** (`resetWorldCaches({underground:true})`). Underground code only reads surface water, and the regional focals are already kept through the normal 20-second habitat refresh. So water masks and focals now survive a dig. Everything that can depend on dug terrain is still reset exactly as before: the habitat field, tile caches and terrain chunk signatures. Cave artwork keeps its own revision-based cache.

## Results

Same seed and walk, alternating builds:

| Build | Run | Frames over 100 ms | Worst | p99 | Water-mask time | `syncScene` time |
|---|---|---|---|---|---|---|
| Before | 1 | 37 | 353 ms | 192 ms | 3,678 ms | 785 ms |
| After | 1 | 16 | 353 ms | 98 ms | 553 ms | 102 ms |
| Before | 2 | 39 | 1,018 ms | 169 ms | 2,791 ms | 490 ms |
| After | 2 | 17 | 276 ms | 98 ms | 589 ms | 96 ms |

Raw data: [before 1](rendering-stalls-2026-10-23/cmp-anim-build-1.json), [after 1](rendering-stalls-2026-10-23/cmp-fix2-build-1.json), [before 2](rendering-stalls-2026-10-23/cmp-anim-build-2.json), [after 2](rendering-stalls-2026-10-23/cmp-fix2-build-2.json).

Frames over 100 ms fell by more than half, and p99 fell from 169–192 ms to 98 ms. Frames between 50 and 100 ms did not fall (51–53 before, 58–65 after). They are now mostly simulation slices. The median frame on this machine varied between 13 and 20 ms across runs regardless of build, so these comparisons alternate builds.

**`tests/landform-uniform-mask.mjs`** (gate):
- every shortcut tile across three worlds is byte-identical to the sampled contour (19,044 compared);
- through the real `syncScene`, an underground change keeps the water masks and focals, and a full reset still clears them.

**Gate:** 98 of 98 checks pass with the new test, including the camera zoom and pose rhythm work committed just before.

## Remaining work

- **Simulation ticks:** on this world the perception phase spikes to 134 ms and the decision phase averages 24 ms. The cost is spread over survey and dispersal helpers (crop yield, carrying surveys, habitat quality, reachability). Slicing ticks thinner would make walking stutter, because player movement waits while a tick is pending. The fix is making those helpers cheaper with outcome parity (`tools/simulation-parity.mjs`). That is the next performance step.
- **Shoreline water masks** still cost about 30 ms when many new shoreline tiles enter view at once. They could be warmed ahead of the view.
- **One-off spike:** in one run, a single `drawEnvironmentalHistory` call reached 173 ms; it was not reproduced.
- **Coverage:** only the RTX 3050 was measured, plus one seed for the comparison.
