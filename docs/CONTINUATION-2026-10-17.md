# GenVo continuation checkpoint - October 17, 2026

This checkpoint consolidates the three local Claude chats: Simulation readability and engagement; Soil-water cycle investigation and fix; Phase 3L: batched GPU creature rendering. Original reports, uncommitted source, and restoration backups remain in place. Nothing is committed, pushed, packaged, or declared creator accepted.

## Creator direction carried forward

- Guarantee biological rules, not biological outcomes. Overgrazing and population decline are valid ecological and evolutionary consequences; do not add rescue or population targets.
- Persistent seeded weather and a measurable soil-water budget are approved. Preserve weather save/resume and the independent weather random stream.
- Keep major changes separately reviewable. Keep known failures visible and do not silently increase timing budgets.
- Existing defaults remain on for soil water and weather. Storm frequency and the two plant-rule observations remain review items, not approval to recalibrate them.
- Visual clouds/fronts, pigmentation, and thermal physiology are later work. The roadmap is not evidence that those features are implemented.

## Recovered unfinished validation

Claude's long soil-water run had completed, despite its report still saying it was pending. Original structured evidence: `test-runs/long-soil-water-claude-2026-10-17.json`. It reports 7 pass, 1 known failure, 1 new hydrology failure, and 2 timeouts. See `soil-water/REPORT.md`, section 7.

The hydrology assertion required the legacy unbudgeted shoreline floor even with physical soil water enabled. The continuation keeps the 96-day natural-world scenario and route checks, adds daily budget closure and generated-world bank/inland comparison, and retains the original floor assertion for 96 isolated dry legacy soil steps. No simulation rules are changed.

Before that test update, a separate 96-day measurement on GENVO8-TEST-A found mean high-seepage shoreline moisture 0.393694 versus inland 0.150983, maximum absolute daily closure 0.000015431, and cumulative open-water inflow 1615.556336. These are mechanical measurements, not gameplay acceptance.

## Renderer handoff

See `render-batching/REPORT.md`. Existing batching and prepared-scene startup changes are retained. The reported day-120 frame rate is about 28-34 fps; 60 fps is not achieved and 30 fps is not consistent. Intermittent roughly 1.1-second stalls remain unverified in human play. These are inherited measurements, not measurements rerun by Codex.

## Outstanding work

1. Resolve natural-world-soak (1500 s) and wild-evolution (900 s) timeouts through diagnosis, without raising ceilings or weakening ecological integrity checks. Larger populations and flora-genome pruning are documented leads, not proven causes of these exact timeouts.
2. Run comprehensive validation after corrections; the older Phase 3L comprehensive run predates soil-water changes.
3. Inspect actual gameplay/runtime frames for renderer and startup acceptance on the integrated tree.
4. Keep storm-frequency, plant-moisture tolerance, and plant water-use calibration separate from validation repairs and creator decisions.

Hydrology continuation result: PASS in 88.5 s, under the existing 300 s limit (docs/test-runs/hydrology-codex-takeover-2026-10-17.json). All 9 suites run during this continuation passed. The recovered natural-world-soak and wild-evolution timeouts have not been resolved or rerun. Comprehensive and visual acceptance remain outstanding.

## Pre-split comprehensive run completed

`docs/test-runs/all-codex-continuation-2026-10-17.json` completed with **385 pass, 6 known failures, 0 new assertion failures, 2 timeouts**, no stale ledger entries, and no deferred suites (393 total; 3,203 s). Wild evolution timed out at 900.1 s and natural-world-soak at 1,500 s. The observer budget suite passed. No orphan simulation workers remained after completion.

This run used the pre-split loaded tests. It is preserved as historical performance/integration evidence and is **not post-split certification**. The subsequent controlled/observation separation does not claim to solve either timeout. Revised fast-suite and ecological-observation results are recorded in separate artifacts.