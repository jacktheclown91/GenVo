# Save cadence and genome-prune slicing — October 28, 2026

Performance-only correction to two measured sources of long browser stalls in mature worlds. No biological rule, RNG draw, saved field or save schema changes. Creator acceptance and Windows GPU behaviour are not claimed.

## Measured causes (Day 100 catalogue world, Node 24.14.0)

1. **Saves.** One save of `mature-valley-d100` costs about 1.3–1.5 s to capture plus about 1.6 s of structured cloning (what IndexedDB `put` does synchronously on the main thread). About 90% of the clone is the plant dispersal controller: its snapshot serializes to 158 MB (flora genome registry 41,691 genomes, about 860,000 seed cohorts, botanical flowers/pollen/embryos). Capture is dominated by the seed-column codec's `intern` (about 790 ms).
2. **Save frequency.** `SaveManager.signature` counts every wildlife birth and death. In mature worlds it changes every 2–11 s of play, and each change scheduled a prompt "lineage-milestone" save. A pre-existing scheduling race also ran some saves twice: `observe()` re-armed `schedule()` every ~120 ms, which cleared the timer but not an already-queued idle callback.
3. **Atomic tick segment.** The daily tick is already resumable (about 690 segments), but its last vegetation segment, `pruneUnusedFloraGenomes`, scanned all seed cohorts in one piece: 170–225 ms.

## Changes

- `SaveManager.lineageSignature` covers the player's own lineage and works (shelters, handoffs, tree events, completed generations, highest generation, lineage records and living members). A change there still saves after 900 ms. A wildlife-only change remains unsaved and eligible. It is scheduled for the end of the routine autosave window (45 s since the last save) unless a save is already pending. The existing contract in `tests/save-async-coherence.mjs` (a wildlife death during commit stays eligible for a later `lineage-milestone` save) is retained unchanged.
- `schedule()` cancels a request already queued for idle time before it arms a new one. `observe()` no longer re-arms an overdue autosave while one is pending.
- `pruneUnusedFloraGenomesSteps` yields between seed cells, at most every 2,048 cohorts. `pruneUnusedFloraGenomes` remains as a synchronous drain wrapper. Nothing else steps while a tick is pending, so the scan visits the same records in the same order.

## Evidence

- **Complete-state parity:** after 100 ticks (two daily vegetation passes), untouched `8e724f72` with atomic `update()`, the candidate with atomic `update()`, and the candidate resumed after every single generator segment (3,498 and 2,372 resumes) produce identical complete snapshot signatures and RNG. This holds on both `mature-valley-d100` (`81e28648…`) and `established-valley-d30` (`f8eb78be…`).
- **Historical oracle:** `tests/flora-genome-lifetime.mjs` still compares against the preserved original collection source. It now also checks that a 3,000-cell bank yields and that its result and mutated graph match the original exactly.
- **Save scheduling:** the new `tests/save-milestone-cadence.mjs` checks that lineage births and deaths save promptly, that wildlife events defer without being pushed later, that overdue events are not deferred, that a pending autosave is not re-armed, and that a superseded idle request never runs. The existing save coherence, concurrency and persistence tests pass. All of these pass on Node 22.23.4 and 24.14.0.
- **Worst atomic tick segment** (Day 100, 144 ticks): 216 ms before, 56 ms after. The remaining largest segments are perception (phase 3) and tick start/soil.
- **Native browser loop:** headless Chromium, 1440×900, `tools/measure-mature-browser.mjs` (now records routine save timings), 150 s on the Day 101 fork at 1x with AUTO. These are single runs on a shared machine, not a device benchmark.

| Run | Routine saves | Frames > 1 s | Frames > 250 ms | p99 | Worst frame | Ticks advanced |
|---|---:|---:|---:|---:|---:|---:|
| Baseline `8e724f72` | 13 (12 milestone) | 12 | 16 | 216.7 ms | 2566.6 ms | 1,038 |
| Cadence only (first candidate) | 7 (two duplicate pairs) | 7 | 12 | 200.0 ms | 2233.2 ms | 1,126 |
| All changes | 3 (at 8.9 s, 57.8 s, 106.9 s) | 3 | 3 | 100.0 ms | 2083.3 ms | 1,182 |

The remaining frames over 1 s coincide with the three saves themselves (about 2.0–2.3 s each). Median (50 ms) and p95 (83 ms) are unchanged. No page errors occurred, AUTO stayed active, and the world was never paused or blocked. Raw receipts are retained outside the repository in the session scratchpad; the table above is their complete summary.

## Remaining

Each remaining save still blocks for about 3 s on a Day 100 world. The cause is the size and shape of the dispersal state, and offscreen regional replay restores and re-captures the same snapshots (`planetary-offscreen-biology.js`), which is the likely root of the measured 5.7 s regional ticks. The next step is a versioned compact representation for the flora genome registry and botanical records. It must rebuild the frozen-genome identity sharing exactly, keep the `/1` seed-column decoder for existing saves, and pass complete-state parity. Moving IndexedDB transport off the main thread does not help, because `postMessage` clones the same object graph.
