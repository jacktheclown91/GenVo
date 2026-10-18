# Timeout investigation and bounded continuation - October 17, 2026

Nothing committed, pushed, packaged, or declared creator accepted.

## Diagnosis

The recovered soil-water long tier had natural-world-soak time out at 1,500 s and wild-evolution at 900 s. Its hydrology assertion has since been repaired and passes under the original 300 s timeout (see the continuation checkpoint).

A 120-day CPU profile of GENVO8-WILD-RUN, with ordinary animals and both soil-water/weather defaults enabled, took 103.7 s. Population grew from 180 at day 21 to 416 at day 121. Flora-genome pruning accounted for about 9.0 s of sampled self time. Other substantial costs were crop-yield evaluation and food-overlap/supply surveys. No single profile proves the timeout's entire cause.

The comprehensive runner also overlaps three suites by default, while natural-world-soak itself starts five child worlds. The soak now uses the existing serial scheduling facility so its internal five-worker pool runs without other suites. Its horizons, assertions, worker count, and 1,500 s timeout are unchanged. Wild-evolution still uses its original 900 s timeout.

## Scoped optimization

`src/ecology/flora-genome-lifetime.js` now streams seed-cohort Map entries, registered genotype keys, and botanical stock records instead of copying each collection into temporary arrays every day. Deletion touches only the current Map entry and never inserts a new one; surviving traversal order is preserved. Positive cohorts of any size, founders, ancestry, receipts, pollen, seed cargo, and last meals retain the same genotype references. No resource quantity, biological coefficient, random draw, or simulation ordering is changed.

`tests/botanical-safety.mjs` adds expired records before and after the existing positive 1e-30 cohort, checking that deletion cannot skip or remove it. All four botanical suites pass.

## Differential evidence

The original source is frozen in `flora-genome-lifetime-before.txt`. Run:

```
COMPARE_PRUNING=1 node tools/profile-natural-simulation.mjs GENVO8-WILD-RUN 120 docs/timeout-investigation/after-wild-120.json
```

(The environment-variable syntax above is POSIX; in PowerShell set `$env:COMPARE_PRUNING='1'` first.)

The diagnostic compares complete projected pruning state against that frozen original at days 21, 41, 61, 81, 101, and 121. Each snapshot also receives an unused genotype and expired cohort to exercise collection. All six comparisons are exact: return counts, retained definitions, and every remaining record. Live population and genotype counts match the baseline at all six checkpoints.

Pruning sampled self time was 5.7 s in the after profile versus 9.0 s before. Five of six individual snapshot comparisons were faster; one was slower. The after diagnostic also clones and deeply compares large states, so its 113.1 s total is not an end-to-end speed comparison. These measurements support a local allocation/cost improvement, not a claim that the long-suite timeouts are fixed.

## Validation artifacts

- `before-wild-120.json`: baseline profile.
- `after-wild-120.json`: profile plus six exact real-world pruning comparisons.
- `../test-runs/botanical-pruning-2026-10-17.json`: all four botanical suites pass.
- Comprehensive validation and isolated headed runtime evidence are recorded separately as they finish.
## Inspected runtime smoke evidence

`runtime/evidence.json` and the three inspected screenshots (`new-world.png`, `walking.png`, `continued.png`) record a headed Chromium session in an explicit empty nonpersistent browser context. It creates its own test save and never opens an existing user browser profile. The normal game menu, keyboard movement, and Continue path were used. No creature, weather, or resource state was staged.

The player moved from (42.5, 37.5) to approximately (47.536, 38.979); ticks advanced 27 to 69 and the world reached day 2 with 180 living animals. Continue reopened the initial saved world and advanced to tick 55, with the player alive and soil-water/weather state present. There were no page errors. Inspected frames show complete terrain, vegetation, creatures, water, player ring, and readable HUD without blank regions or clipped controls at 1440 x 900.

This is limited fresh-world and continue-path evidence, not a mature-world performance benchmark, first-frame pop-in proof, extended gameplay acceptance, or creator acceptance.

The initial localhost HTTP transport dropped eight art requests, leaving a partial catalog and causing readiness to time out. Those diagnostic files remain as `runtime/failure.json` and `runtime/failure.png`. The successful run uses the repository's established Playwright file-routing transport and requires the full art catalog to be ready. No application fetch behavior was changed to hide the transport failure.
## Comprehensive run: evolution timeout reproduced

In `../test-runs/all-codex-continuation-2026-10-17.log`, wild-evolution timed out again at 900.1 s. For most of that interval no other simulation suite was running. This rules out nested suite concurrency as the sole explanation for that timeout. The local pruning optimization is insufficient to clear it. The known needlejaw-body assertion was not reached, so this remains a timeout, not a known ecological failure.

At that point, the first 390 suites had completed without a new assertion failure. The five-worker natural-world soak started afterwards on its own, under its unchanged 1,500 s ceiling. The observer wall-clock budget check is also scheduled serially. Final results will be appended after completion.
## Pre-split comprehensive run completed

`docs/test-runs/all-codex-continuation-2026-10-17.json` completed with **385 pass, 6 known failures, 0 new assertion failures, 2 timeouts**, no stale ledger entries, and no deferred suites (393 total; 3,203 s). Wild evolution timed out at 900.1 s and natural-world-soak at 1,500 s. The observer budget suite passed. No orphan simulation workers remained after completion.

This run used the pre-split loaded tests. It is preserved as historical performance/integration evidence and is **not post-split certification**. The subsequent controlled/observation separation does not claim to solve either timeout. Revised fast-suite and ecological-observation results are recorded in separate artifacts.