# Mature-world performance — regional replay (October 30)

The creator asked for performance work, especially in mature worlds. Benchmark throughout: the bundled day-100 valley with two archived regions (`tools/measure-mature-regions-browser.mjs`, headless Chromium, 60 s, quiet machine).

## Where the time goes

**Simulation alone** (`tools/profile-mature-ticks.mjs`, new, Node, active world only):
- 27 ticks/s on average. A typical tick takes 1.5 ms.
- About one tick in a hundred takes 1–1.7 s: the daily vegetation step, mostly plant genetics bookkeeping (`botanical-genetics`, `flora-genome-lifetime`, `flora-inheritance`) and garbage collection. The browser already spreads this step across frames.

**Browser** (`tools/profile-mature-regions-browser.mjs`, new: CPU profile of the real loop, with long busy stretches attributed). About half of all CPU goes to persisting archived regions, not to simulating them:

| Share | Where |
| --- | --- |
| 33% | `flora-seed-codec.js`: packing the plant seed bank |
| 11% | `snapshot-copy.js`: deep-copying snapshots |
| 4% | `restoreDetachedSimulationSnapshot`: cold restores |

Under synchronized replay, every 6 active ticks each archived region is stepped 6 ticks in lockstep and then republished. Republishing packs the region's whole seed bank and deep-copies the snapshot. In a mature region the seed bank holds **859,096 genetic cohorts across 45,577 cells** (about 19 per cell, each with 14 metadata fields). Measured per region pass (Node):

| Step | Time |
| --- | --- |
| Simulating the 6 ticks | 73 ms |
| Packing the seed bank | 1,104 ms |
| Copying the snapshot | 502 ms |
| A cold restore | about 4 s |

**Cold restores.** The warm cache keeps each archived region's live simulation between passes. But each day's seam transaction (water, salt, runoff, groundwater, minerals, sediment exchanged across borders) wrote into the region's checkpoint and marked the region dirty. The warm simulation lacked those edits, so the next pass discarded it and restored the region cold: about once per region per day, the source of the multi-second freezes. A two-region Node run showed 8 such invalidations in 200 ticks.

## Changes (exact: no simulation result changes)

1. **The seam transaction keeps warm regions valid** (`planetary-seam-salt.js`, `regional-warm-cache.js`).
   - The per-region publication is one function, applied to the checkpoint and, when the archived region has a valid warm simulation, to that simulation's world too.
   - The warm world is then rebuilt as a restore would rebuild it (drainage, land regions, hydrology), and its cache entry is re-keyed to the updated checkpoint.
   - `tests/regional-warm-cache.mjs` now runs three seam days. It asserts that warm simulations continued every stride, that no seam day forced a cold restore, and that the three-region world stays value-identical to restoring from the checkpoint every stride.
2. **Snapshot copying remembers frozen objects already found not deeply frozen** (`snapshot-copy.js`), instead of re-proving them every pass. Copy time fell from 502 to 433 ms. Copying such an object instead of sharing it is always a valid independent copy.

The Node two-region run went from 94.7 s to 76.0 s for 200 ticks, with zero invalidations.

## Result (browser, quiet machine, two runs each)

| | Main `0db4c528` | This change |
| --- | --- | --- |
| Frames over 250 ms (per 60 s) | 12–13 | 3 |
| Frames over 1 s | 4–5 | 1 |
| p99 frame | 167–183 ms | 83–100 ms |
| Worst frame | 1.78–2.12 s | 1.72–1.78 s |
| Ticks/s | 3.2–3.3 | 3.8–3.9 |

The remaining frame over 1 s is an archived region's first cold restore after loading, before it has a warm simulation.

## Seed-bank table reuse (second pass)

Measuring what actually changes settled the design. On the mature world, over 12 consecutive 6-tick passes, the seed bank changed in exactly one: the pass containing the day boundary, where 45,508 of 45,592 cells changed. In the other 11, not one cell changed. Chunked or incremental packing would not help, but reusing the previous pass's packed table would let 7 of every 8 passes skip packing entirely.

- **Change counter** (`ecology/seed-bank-epoch.js`, new). Every function that can create, alter or delete a seed cohort bumps a counter on its dispersal controller: `seedCell` (through which reconciliation, addition, scaling and selection all pass), establishment, initialization, `settleSeedCell` and the daily decay's cell deletion. These are the only writers, in `flora-inheritance.js`, `seed-viability.js` and `dispersal.js`. The counter lives in a module-level WeakMap, so it never enters a save.
- **Reuse** (`world/planetary-offscreen-biology.js`). A warm publication reuses its previous packed table when it is the same warm simulation and the same seed bank, and the counter is unchanged. Packed tables are read-only once published (a detached restore decodes them into independent rows), so consecutive checkpoints may share one.
- **Proof.** `tests/regional-warm-cache.mjs` turns on a verify switch, under which every reuse also packs afresh and must be structurally identical. The test asserts that reuse happened, and the three-region world stays value-identical to restoring every stride across three days.

The Node two-region run went from 76.0 s to 33.0 s for 200 ticks: 56 of 64 passes reused their table.

**Browser, mature world (quiet machine, two runs each):**

| | Previous `main` `8cbd631a` | Seed-table reuse |
| --- | --- | --- |
| Ticks/s | 3.6–3.9 | **7.1–7.2** |
| p95 frame | 50 ms | 67–83 ms (more simulation per frame) |
| p99 frame | 83–100 ms | 100 ms |
| Frames over 250 ms (per 60 s) | 3 | 3–4 |
| Worst frame | 1.72–1.82 s | 1.72–1.73 s |

Across the day: from 3.2 to 7.2 ticks/s, against the 8 tick/s target.

## Remaining

- **Snapshot copy.** Each pass still deep-copies the region's other state, about 250 ms per pass in Node. Most of it is plant reproduction structures: pollen 16,000 entries, flowers 23,000, embryos 12,000, bank genomes, producer origins and 41,700 genomes. Some of these change during the day (animal contact with flowers), so reuse would need change tracking at many more write sites.
- **Saves.** The worst remaining frame (567 ms) is a save (a lineage-milestone save takes 655 ms). Saves capture the active world and both regions; making the capture resumable is the next responsiveness step.

## No more freezes over one second (load prewarm)

Timing the long frames against the save manager showed where the last 1.7 s freeze came from. It appeared about one second after a loaded world first appears: each archived region's first replay pass restored it cold. Loading now restores each archived region right after installing the loaded world (`prewarmRegion`, `planetary-offscreen-biology.js`; one call in `main.js` `loadSavedLineage`) and hands it to the warm cache. The first in-game stride then continues warm.
- **Exactness.** The prewarmed simulation is the same restore the pass would have made, and the warm cache's fingerprint still discards it if the checkpoint changes. `tests/regional-warm-cache.mjs` asserts that prewarming fills the cache once per canonical region and that the next stride continues warm.
- **Cost.** About 1.7 s per archived region moves into the load action.

**Browser, mature world, quiet machine, two runs:**

| Measure | Result |
| --- | --- |
| Frames over 1 s | none (was 1) |
| Worst frame | 567 ms, a save (was 1.72–1.75 s) |
| Frames over 250 ms (per 60 s) | 3–4 |
| p99 frame | 100 ms |
| Ticks/s | 7.19 |

## Test sweep

All 547 tests outside the gate were run on this tree and at the brief's reference commit `5cb2ea19`. Two new failures were found and fixed, plus one found earlier:
- `planetary-handoff-copy-parity.mjs` broke when `climate-water/6` added paired sides to region pairing. It now normalizes them like the paired boundary mask and checks their value.
- `gestation-surface.mjs` evaluates `spriteKey` from source; Codex's locomotion cache token now reaches it. It fails the same way on Codex's branch.
- `player-presence.mjs` checked that the player anchor sits within three source lines of the weather overlay. The day/night and underwater layers now sit between them. It now checks that weather, the day/night wash, the underwater view and sensory fog are all painted before the anchor. It fails the same way on both source branches.

All three join the playable gate (231 checks). The other failures are the four Codex catalog tests and 32 tests that already fail at the reference commit, unchanged.
