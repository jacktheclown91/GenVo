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

## Remaining limit and next step

Throughput is still below the 8 tick/s target, because every pass republishes each region's 859,000-cohort seed bank (about 1.1 s of packing and 0.4 s of copying per region pass).

Exact shortcuts were ruled out:
- The cohort records and their metadata arrays are changed in place in several places (deposits merge into existing cohorts), so a cheap exact change check is not available.
- Cohorts are genetically distinct, so merging them would change the biology.

The next step is a design decision: **incremental seed-bank publication**.
- Track changed cells at every seed-bank write.
- Publish only the changed cells' columns, reusing unchanged columns from the previous checkpoint.
- Encode that in a seed-column format `/3` that `/2` readers can still read.

That removes most of the per-pass cost, but it touches roughly 20 write sites and the save format, so it needs its own parity tests.

Making the first cold restore resumable (spread across frames) would remove the last freeze over 1 s.

## Test sweep

All 547 tests outside the gate were run on this tree and at the brief's reference commit `5cb2ea19`. Two new failures were found and fixed, plus one found earlier:
- `planetary-handoff-copy-parity.mjs` broke when `climate-water/6` added paired sides to region pairing. It now normalizes them like the paired boundary mask and checks their value.
- `gestation-surface.mjs` evaluates `spriteKey` from source; Codex's locomotion cache token now reaches it. It fails the same way on Codex's branch.
- `player-presence.mjs` checked that the player anchor sits within three source lines of the weather overlay. The day/night and underwater layers now sit between them. It now checks that weather, the day/night wash, the underwater view and sensory fog are all painted before the anchor. It fails the same way on both source branches.

All three join the playable gate (231 checks). The other failures are the four Codex catalog tests and 32 tests that already fail at the reference commit, unchanged.
