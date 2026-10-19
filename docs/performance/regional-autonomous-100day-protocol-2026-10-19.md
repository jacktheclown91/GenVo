# Three-region autonomous 100-day protocol

Started October 19, 2026. The first attempt stopped after day 15 on a stale traveler-position validation failure. Its log/checkpoints are retained. A corrected fresh run is planned after integration verification; this protocol is not a successful day-100 receipt. Authoritative progress is the live process and local docs/test-runs/artifacts/regional-autonomous-100day-2026-10-19.log. Final structured output, if successful, is regional-autonomous-100day-2026-10-19.json.

## Fixture and scope

PLANET-B0-A uses the existing planetary generator, 128x128 detailed regions, current synchronized-strides/1 policy, ordinary founding templates and current finite biological rules. The existing traveler is placed at actual traversable frontiers for two genuine regional crossings. No animals or resources are injected. After crossing, playerEnabled/playerId/player flags are disabled; the traveler remains a real organism and joins autonomous wildlife. This deliberate fixture change removes manual control and player succession pauses. It is not a player-guided trial, natural navigation, simple-origin diversification or human acceptance proof.

One active and two inactive visited regions run through 100 local days. Every inactive life step uses the canonical kernel with its biological/physical ledgers, not synthetic population updates. No population quota, extinction rescue, mutation direction or resource refill is applied. Runtime source is fingerprinted before and after; drift fails the diagnostic. No runtime source changes are planned during this run.

## Checkpoints and persistence

Full observations and local V8 checkpoints are captured at day 0, 1, 10, 30, 60 and 100. Progress checkpoints may contain the ordinary final six-tick remote barrier. After day 100 the diagnostic completes that remaining barrier without advancing local time, then writes a separate final checkpoint. It verifies the whole saved state on restore and a complete next-day continuation against the uninterrupted simulation. Independent binary transport copies prevent V8 buffer aliasing between compared worlds.

The verification continuation advances the diagnostic worlds beyond the measured horizon. Final replay clocks and ledgers are captured separately before this extra day; receipt result samples refer to the original horizon. The earlier two-day smoke receipt preceded that measurement separation and must not be used as a final-clock comparison. The corrected one-day smoke regional-autonomous-smoke-r2-2026-10-19.json passes exact save/continuation with zero debt after its final flush.

Large checkpoints/logs stay ignored and local. Stable checkpoint files are indexed with size/hash in ../LOCAL-CHECKPOINT-MANIFEST.json. Sampling retains milestone observations, not a 64-row tail that would lose early milestones. Daily progress logs report archived clocks and populations. Per-update times and explicit GC/memory samples are diagnostic Node measurements; they include observation/checkpoint work and are not browser frame rates or an isolated performance benchmark.

Reproduce only into fresh output paths:

```
node --max-old-space-size=4096 --expose-gc tools/profile-regional-replay.mjs FRESH_JSON 100 --archives 2 --autonomous --flush-remote --verify-save --checkpoint-dir FRESH_PROGRESS_FOLDER --snapshot FRESH_FINAL_BIN
```

No major biology or scheduler mechanism was changed to start this trial. The prior runtime gate remains 448 pass, four known failures and 12 deferred. Diagnostic options were exercised in short real three-region runs. The full Living Planet goal remains incomplete regardless of the result of this one fixture.

## First-attempt failure and repair

The long trial exposed a real bookkeeping defect: canonical mortality removes earlier wildlife but previously left departed traveler positions unchanged. A later archive validation failed once such an index exceeded the shortened list. Compaction now shifts single/cohort return positions using exactly the same alive-or-player predicate as the animal filter, before removing fauna. It preserves surviving order and the positions of appended newborns. The focused regression fails without the repair, then passes for actual remote death, save/restore and real return. Existing family/E18 checks pass. No old missing order is fabricated or retroactively recovered; stale historical checkpoints remain attributable evidence. Failure receipt: regional-autonomous-first-attempt-failure-2026-10-19.json.

## Corrected attempt

The repair passes full fast integration: 449 pass, four known failures, zero new failures/timeouts/stale entries, 12 deferred (465 total, 215 seconds, no code input drift). Receipt: ../test-runs/traveler-mortality-integration-2026-10-19.json. A fresh corrected trial uses output regional-autonomous-100day-r2-2026-10-19.json, local log ../test-runs/artifacts/regional-autonomous-100day-r2-2026-10-19.log and the matching local milestone folder. Runtime source is held fixed while it runs. Do not interpret the first failed attempt as a day-100 result.

The corrected process has been observed live beyond day 18, past the original failure. Both archives continue canonical ticks with natural mortality and bounded stride debt. This is interim progress, not a day-100 acceptance claim. Continue polling the same live process before starting any replacement.

## Newly discovered interpretation limit

Read-only day-30 offspring/action inspection exposes unfunded digging rewards in the fixed runtime. The trial is retained for computational/census/replay/persistence evidence, not complete resource-balance certification. See ../first-100-days/2026-10-19/REGIONAL-BIRTH-FINDINGS.md. Repair and fresh targeted balance verification remain required after this fixed-input run.
