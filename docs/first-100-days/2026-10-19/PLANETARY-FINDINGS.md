# Planetary First 100 Days findings

Both tested local planetary regions completed 100 autonomous days with finite-resource/census checks passing, exact whole-state save restoration, and identical full-day continuation after restoration. Both use GENVO8-TEST-A and existing configured founding templates. Neither run visits archived regions or proves player-guided/simple-origin evolution.

| Case | Origin in terrain tiles | Initial living | Births | Deaths | Day-100 living | Raw Node checkpoint |
|---|---|---:|---:|---:|---:|---:|
| Inland planetary | (0, 0) | 196 | 152 | 47 | 301 | 83.4 MB |
| Mixed land/sea | (0, 2560) | 172 | 156 | 7 | 321 | 73.9 MB |

Raw observations, compact summaries and save receipts are retained in planetary-inland/ and planetary-coast/. The large checkpoints remain ignored/local and are indexed in ../../LOCAL-CHECKPOINT-MANIFEST.json. The coastal case was selected by geography alone: actual ocean and dry land coexist, with positive initial salt. No population outcome was selected. No extra food or organisms were injected beyond normal initialization, and no useful mutations were forced.

## Physical accounting passes; surrounding-ocean exchange is missing

The inland case has no salt, so its zero salt budget does not establish salinity dynamics. The coastal case includes direct audits on all 100 completed days. Maximum absolute soil-water closure was 3.107e-6 water-index units; maximum daily salt closure 5.871e-12; cumulative salt closure 9.436e-12, within the existing limits.

Its salt stock nevertheless fell from 659.887 to 0.354685: 659.533 was explicitly exported by rainfall displacement, with zero salt input. This is accounted flow, not an unexplained numerical leak. It reveals a model limitation: initializePlanetWorld deliberately sets external boundary reservoirs to zero, so a local ocean patch freshens without exchange with the surrounding ocean. Mechanical closure does not establish a connected planetary ocean or ecological calibration.

The next hydrology work must introduce an explicit shared exchange authority and versioned compatibility, rather than resetting salinity, inventing salt, tuning reproduction, or rescuing populations. Keep detailed regions at the reviewed 128x128 extent. Coarse planetary structure and local physical state must remain distinct, with finite/declared flows and no duplicate regional stock. A concrete geography/flow contract should establish ownership, saved history and dormant-region replay before implementation.

## Archived life is correct over five days, but reconstruction is costly

A separate PLANET-B0-A diagnostic placed the existing player at a real legal frontier and performed the existing border crossing. Five ordinary days advanced the archived region through 240 canonical ticks, with zero remaining time debt and valid biological/physical ledgers. No births or deaths were staged. This controlled placement is not proof of natural navigation or autonomous migration.

The CPU-profiled run took 12.09 seconds, with 1.93 seconds inside active-world phase wrappers. The remainder includes real offscreen biology, restore/clone work, integrity checks, GC and readouts; it is not all avoidable overhead. Across the whole sampled process, about 5.18 seconds were under restore (2.27 seconds constructing Worlds), 1.04 seconds under structured cloning outside restore, and 0.153 seconds under snapshot projection. Profiling also includes startup/crossing and is not browser frame time. Receipts: ../../performance/regional-replay-5day-2026-10-19.json and regional-replay-cpu-summary-2026-10-19.json in that same performance directory.

This identifies an E19 target: reduce repeated restoration/generation while preserving atomic publication, exact canonical ticks, identity allocation, historical saves and finite resources. Do not replace distant life with synthetic population updates or let computational limits decide reproduction. Mature multi-region performance and 100-day archived replay remain unproven.

## Scope remaining

Live seed-memory growth, browser/IndexedDB responsiveness, global ocean/river coupling, genuine simple-origin anatomical accessibility, autonomous regional migration and human play acceptance remain open. Passing these local cases does not complete the Living Planet goal. Runtime source was unchanged in this pass; the new diagnostic options and profile tool were exercised directly, with observation parity and E18 checks passing. The prior full runtime gate remains 444 pass, four known failures, no new failures and 12 deferred; it was not rerun solely for diagnostic additions.
