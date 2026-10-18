# World start and load: timing, feedback, responsiveness (October 17, 2026)

Measured with `tools/world-load-timing.cjs` in headed Chromium on the RTX 3050 machine, seed PHASE4-ORDINARY (`before.json`, `after.json`). This is automated measurement, not visual acceptance.

## 1. Loading time

| | New world | Continue saved world |
| --- | --- | --- |
| Click to live world (art ready, unpaused, ticks advancing) | 2.0–2.3 s | 1.7–2.0 s |
| Longest main-thread block | 1.0–1.3 s | 0.96–1.1 s |

The individual steps, timed in the page, are small:

| Step | Time |
| --- | --- |
| Building the world (`new Simulation`, 181 animals) | 63 ms |
| Snapshot | under 1 ms |
| Structured clone | 5 ms |
| Restoring a snapshot | 40 ms |
| Snapshot size | about 3.3 MB |

Page boot to menu takes 1.4 s.

## 2. Status text

**Before.** A new world showed "Saving..." during start-up, because the first save runs immediately and its message stayed on screen through the blocking first frame.

**Now** (`src/main.js`, `src/persistence/save-manager.js`):
- **New world:** "Preparing ecosystem..." is painted before the heavy work and stays until the first world frame has drawn. The world-start save then runs under the same label, followed by "Saved".
- **Loading a saved world:** "Loading world...", then "World loaded" (or an error message if the save can't be loaded).
- Other saves still say "Saving...".

## 3. Responsiveness

**The main thread does block, for about 1.0–1.3 s.** This is not a paused screen. The blocking work is the first frame after the world is installed, which builds the visible terrain caches all at once (`Renderer.buildTerrainChunk` is 38% of the start-up window). The save itself is quick.

**The 21 seconds was not reproduced by the game itself.** The likely source is our own measurement harnesses (frame profilers, GPU benchmarks). They start a world, which triggers the first save and its status text, then fast-forward many game days in one synchronous call. The browser cannot repaint during that, so the last status text stays frozen on screen. A 20-day fast-forward takes 6.3 s even in Node, and 120 days takes 60 s.

If that recording came from ordinary play rather than a test tool, I need to know how it was made to reproduce it.

## Suggested next step (renderer, Phase 3L)

Spread the cold terrain build over the first frames: draw the nearest chunks first and queue the rest, as the existing refresh queue already does for stale chunks. That would remove the 1-second freeze.
