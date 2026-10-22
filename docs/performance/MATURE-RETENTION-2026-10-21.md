# Mature-world compatibility and genotype-retention work

This advances the creator's planetary responsiveness and working advanced-start requirements; it does not close Phase 1 or full-game acceptance.

## Player-facing compatibility repair

Profiling the immutable bundled Day-100 world failed on main's pending source with `Marine food fields disagree with their recorded policy.` The restore path constructed a modern planetary Simulation, then compared the saved policy to that temporary scaffold before restoring the recorded world. The older planetary fixture legitimately has neither the policy nor marine stocks.

`restoreSimulationSnapshot` now constructs with the checkpoint's marine opt-in and checks the policy against the checkpoint's actual fields. It still rejects fields without a policy, a policy without fields, unknown policies and invalid stock arrays. No existing checkpoint, history, hashes, organisms or saved physics were rewritten.

`tests/bundled-scenario-restore.mjs` opens the authentic Day-30 and Day-100 assets under their recorded SHA256, verifies unchanged organisms/stocks/RNG and historical marine absence, and compares complete roundtrips, continuation and the regeneration reference path. `tests/marine-food-web.mjs` retains both directions of malformed policy/field rejection. Both bundled checkpoints now belong to the playable gate.

The existing `tools/verify-scenario-browser.mjs` now exercises native Save and Continue for recorded/resident starts too, instead of limiting reload coverage to authored founders. The final exported Day-100 trial preserves saved tick, RNG, seed, player, population and marine opt-out; its New World and restored gameplay frames were inspected. This is controlled browser evidence, not a natural multi-generation play session or creator acceptance.

## Measured botanical bookkeeping

A fresh 48-tick profile of the real Day-100 fixture identified daily vegetation and complete genotype retention among the remaining atomic costs. The retained fixture has **859,096 positive seed cohorts** and **41,691 retained genotype definitions**. Every positive cohort, including arbitrarily rare ones, still participates in retention.

`pruneUnusedFloraGenomes` uses one Map.forEach callback for every cell. Map provides the owning collection as its third callback argument, avoiding per-cohort entry-pair arrays and per-cell callback closures. The same traversal order, zero-quantity deletions, ancestry/history/cargo references and genotype collection decisions remain intact.

The exact prior source is retained in `flora-genome-lifetime-before-2026-10-21.txt`, imported only by the comparison test and benchmark. `tests/flora-genome-lifetime.mjs` compares full record graphs against it, including 1e-300 positive cohorts, parental links, reproductive stocks, carried records and deletion without skipping adjacent survivors.

## Evidence and limits

- [Real-cohort alternating benchmark](../test-runs/flora-retention-final-micro-2026-10-21.json): prior mean 170.13 ms; candidate 152.77 ms over four samples each, with unchanged complete state. This is an isolated collection measurement, not browser frame acceptance.
- [Complete 48-tick parity](../test-runs/mature-retention-parity-2026-10-21.json): `isDeepStrictEqual` confirms the entire saved state after ticks 4800..4848 is identical. All 292 living animals remain under the same biological outcomes; both complete snapshot artifacts also have the same SHA256.
- Inspector-sampled complete-day totals: 2150.86 ms before, 2065.16 ms final; worst atomic tick 1314.65 vs 1268.04 ms; vegetation 1197.79 vs 1145.29 ms. These are single bounded samples, not evidence of a general frame-time improvement. The roughly one-second atomic stall remains unresolved.
- [Before profile](../test-runs/mature-work-before-2026-10-21.json), [final profile](../test-runs/mature-work-final-2026-10-21.json). Earlier candidate profiles and reference artifacts are preserved independently.

The [full playable gate](../test-runs/mature-restore-playable-2026-10-21.log) passes all 76 checks; source/export checks, botanical reproduction/safety and scenario transport also pass. The [final native browser receipt](../test-runs/mature-retention-browser-2026-10-21.json) records successful Save/Continue and the preserved historical policy. Long-distance catch-up throughput, cooperative vegetation/replay work, continuous regional crossing, neighbouring wildlife interaction and the rest of the full-game plan remain open. No population or biological budget was tuned; no tests or timeout ceilings were weakened.
