# Crop-yield performance evidence (October 19, 2026)

The unchanged observer-play test previously failed at 509 ms per real second (560 animals, 4x; limit 500 ms). CPU sampling identified cropYield as the leading sampled function. The following changes retain the same biological arithmetic:

- Forecasts use shared finite-tissue arithmetic without constructing harvest provenance or explanation strings. Actual harvest still produces complete receipts.
- Mouth-specific bite handling costs are cached with the existing tissue/genotype/bite recipe. Affordability always reads the actor's current energy. Costs are not cached across mouth groups, stock changes, genotype changes or bite changes.
- Empty standing crop returns zero immediately, checking current stock each call. Depletion and regrowth cannot reuse a stale zero.

Frozen pre-change source in crop-yield-before-scalar-cost.txt and plant-handling-before-scalar-cost.txt is essential comparison evidence, not live runtime authority. Both SHA256s are asserted by tests/crop-yield-performance-parity.mjs. That test establishes exact complete saved-state parity over four natural days and 3,520 comparisons spanning mouths, changing crop stocks and energy reserves. Existing finite harvesting and handling tests also pass. No biological coefficients, population targets, RNG rules or save migrations changed.

Alternated diagnostic: node --expose-gc tools/benchmark-crop-yield.mjs. crop-yield-benchmark-2026-10-19.json records three before and three after runs in alternating order: 546.96 ms before versus 476.42 ms after on average (12.90% less). All six resulting saved-state hashes match. Explicit GC and shared-process timing differ from the original gate; these numbers support a relative comparison, not a replacement timing threshold. One optimized diagnostic sample still exceeded 500 ms.

The unchanged observer-play test then passed at 439 ms. The full integration rerun recorded 443 pass, four known failures, zero new failures/timeouts/stale entries and 12 deferred suites (459 total, 212 seconds), with no input drift. Its observer gate passed at 453 ms. Receipt: docs/test-runs/crop-yield-integration-2026-10-19.json. Four known failures remain, so this is not universal acceptance or a release gate. Browser responsiveness, mature-world scale, offscreen-region scheduling and First 100 Days acceptance remain separate requirements.


For the subsequent mature-save work, see seed-codec-save-review-2026-10-19.md. It verifies default-world day-100 save/continuation and speeds up the lossless seed codec without reducing cohorts. The newer integration receipt has 444 passing suites, four known failures and no new failures; the crop-yield receipt above remains historical evidence for that pass.

For subsequent offscreen replay work, see world-restore-cache-review-2026-10-19.md. A bounded generated-base cache preserves exact whole-region replay state in a five-day comparison; mature planetary/browser performance remains unproven.

See regional-multi-hop-review-2026-10-19.md for the subsequent third-region travel repair and ten-day two-archive evidence. Older archives retain their full biological authority, but the current scheduler still accumulates debt with multiple archives and has long synchronous update calls.

New-world synchronized timing and actual browser/IndexedDB evidence are documented in regional-synchronized-review-2026-10-19.md and REGIONAL-REPLAY-POLICY.md. Historical saves keep their original schedule. Bounded temporal debt is now demonstrated for new worlds; smooth frames and mature planetary scale remain unfinished.

The latest restore follow-up is deferred-flora-review-2026-10-19.md: redundant generated flora initialization is deferred only when a saved controller replaces it. Whole-state and next-day parity pass, including the mature day-100 checkpoint. Regional runtime improves in the bounded diagnostic; browser frame stalls and mature-save scaling remain unfinished.

For the mature restore follow-up, see metadata-copy-restore-review-2026-10-19.md. Plain seed-metadata copying preserves full tables, historical extension handling and actual three-region continuation. The measured day-60 restore improvement is scoped to that checkpoint; mature frame pacing, memory and broader acceptance remain unfinished.
