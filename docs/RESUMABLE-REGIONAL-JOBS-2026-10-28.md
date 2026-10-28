# Resumable archived-region jobs — October 28, 2026

Performance-only. No biological rule, RNG draw, saved field or job order changes. Creator acceptance and native GPU behaviour are not claimed.

## Problem

Under synchronized regional replay, every 6 ticks each archived region runs one job: restore or reuse its Simulation, run 6 ticks (one of them sometimes a whole daily vegetation pass), capture, copy and publish. The browser admitted one job per frame, but each job was atomic, so mature regions caused multi-second frames.

## Change

- `stageRemoteBiologySteps`, `advanceRemoteBiologySteps` and `prepareRegionalBiologySteps` are generators. They pause inside and between the archived region's own ticks, during seed packing (every 4,096 cohorts) and while copying the published checkpoint (between its parts, controllers and controller fields). The archived region is exclusively owned by the job until publication, so a pause reads and writes nothing. The synchronous exports are drain wrappers, so every existing caller is unchanged.
- The job pre-packs the region's seed table with the same ownership option, and `createSimulationSnapshot` accepts it as `seedTable` instead of packing the same unchanged bank again.
- `Simulation.stepRegionalBiology(deadline)` begins or resumes the job the next tick would otherwise run first. The job runs in the same place as before: one admission before the tick, never during one.
  - While a job is pending the world counts as `tickInProgress`. Existing guards therefore hold background work, travel, saves and keyboard input, and `finishTick()`, `update()` and every capture complete the job first.
  - Each resume restores the `CFG` clock view its pause left, and the world's own clock is active between frames.
  - A failing job is dropped, never left pending.
- `src/main.js` (shared integration file) calls it with the frame's slice deadline. As with a sliced tick, a started job completes even while paused, and held input replays when it finishes.
- `SaveManager.maintainRegionalResidency` also stands down after an IndexedDB wait if the world has entered a tick or job.

## Evidence

- **Parity.** The controlled Day 100 two-hop scenario was run for 96 ticks three ways. All three give the same complete state, with seed tables decoded and per-session sharing severed (`7e07b6ec…`), the same signature as earlier `main`:
  - jobs run inside each tick (`update()`);
  - whole jobs before each tick (the previous browser order);
  - jobs resumed after every single pause (30 jobs, 10,623 segments).
- **`tests/regional-job-slicing.mjs`** (new, gated, Node 22 and 24) checks that:
  - sliced, whole and in-tick jobs give identical worlds;
  - applying a different day clock between every pause changes nothing;
  - a pending job is mid-tick;
  - a capture, `update()` and `finishTick()` each complete it first, and a capture sees the completed job;
  - no job starts during a pending tick;
  - a failing job never stays pending.
- **Regressions.** The regional, warm-cache, offscreen, clock, sliced-tick, residency, record and seed-ownership suites, plus the original-source modernization fixtures, all pass on Node 22 and 24. The full local playable gate passes 148 of 148; no budget or assertion was relaxed. The architecture, source audit and export checks pass.
- **Real game loop.** `tools/verify-regional-replay-browser.mjs` passes on this change and on `main`. It covers the actual IndexedDB fixture, native frames, held local time with remote progress, the visible notice and an exact save/load round trip.
  - That verifier had been failing on `main`: `JSON.stringify` threw on snapshot reference cycles.
  - Its comparison now marks only true cycles. It stays alias-insensitive like the original, keeps Map, Set and array order, and compares plain-object fields by key. A restored Simulation assigns its own fields in a different order from a constructed one; that is pre-existing and not a value change.
- **Mature browser timing.** `tools/measure-mature-regions-browser.mjs` (new) uses headless Chromium at 1440×900 with the bundled Day 100 world, a controlled two-hop crossing, and save and load through the real game, followed by 90 s of the unmodified native loop. Single runs on a shared machine:

| | `main` `1ba0c3e1` | This change |
|---|---:|---:|
| Frames over 1 s | 12 | 6 |
| Frames over 250 ms | 46 | 18 |
| p99 frame | 867 ms | 200 ms |
| Worst frame | 4.13 s | 1.87 s |
| Ticks per second | 2.98 | 3.20 |
| Median frame | 16.7 ms | 33.3 ms |

The median rises because regional work now fills each frame's slice instead of arriving as rare multi-second blocks. No page errors occurred in either run, and the world was never paused.

## Remaining

- **First restore.** Each region's first job after entering or loading restores it from its archived snapshot. On the Day 100 home region this takes about 2.2 s (0.74 s clone, about 1.5 s Simulation and flora rebuild) and is still atomic.
- **Garbage collection.** Collection pauses in this allocation-heavy work can still land in any slice.
- **Throughput.** Mature regional play advances about 3.2 ticks per second against the 8 a real-time day needs. Making the work resumable smooths frames but does not reduce the total.
- **Next candidates.** Cheaper first restore (reusing the departed region's live Simulation) and a versioned genome-table save encoding.
