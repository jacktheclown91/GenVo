# Test consolidation (October 15, 2026)

**Status: code complete and verified. Not creator accepted. Uncommitted.**

## Result

| | Before | After |
| --- | --- | --- |
| Suites | 377 | 373 |
| Fast tier (default, `node tools/run-tests.mjs`) | 772 s wall, red (38 fail, 4 timeout) | **69 s** wall, **green** (325 pass, 37 known-fail) |
| Comprehensive (`--all`) | 772 s + 453 s, 4 suites never finished under the 240 s cap | **919 s**, every suite finishes (333 pass, 40 known-fail, 0 timeout) |
| Exit code meaning | Red whenever any of the 42 old failures failed | Red only on a **new** failure, a timeout, or a stale ledger entry |

No assertion was weakened, and no failing suite is skipped. All 40 known failures still run every time.

## 1. One natural-world soak replaces five overlapping suites

`headless`, `headless-short`, `ecology-stability`, `probe-kills` and `probe-recovery` each re-simulated the canonical seeds separately: 6,720 world-days for what 2,560 cover.

`tests/natural-world-soak.mjs` simulates each seed once, in parallel child processes:

- seeds A, C and E to day 640;
- seeds B and D to day 320.

It keeps every check the three asserting suites made:

| When | Check |
| --- | --- |
| Every tick | The simulation advances; living animals never exceed `CFG.maxAnimals + 8` |
| Every day | `checkEcologicalIntegrity` |
| End | Living animals remain; every census value is finite |

### Equivalence proof

Recorded in `docs/test-runs/soak-equivalence-2026-10-15.json`. The old suites were run uncapped. Every one of them passes when given enough time; they had only been hitting the cap.

- **57 of 57 comparisons equal.** For each seed and horizon, the soak and the old suites agree on population, births, deaths, peak, causes of death and the performance/ceiling flags.
  - Against `headless` and `ecology-stability`: day 640.
  - Against `headless-short`: day 320. The soak records a day-320 checkpoint for seeds A, C and E.
- **Wall time.** The old suites took 1,366–1,475 s each. The soak takes 497 s.

## 2. Probes are now a diagnostic tool

`probe-kills` and `probe-recovery` contained no assertions, so they never tested anything. They are replaced by `node tools/probe-natural-world.mjs [seed] [days] [out]`, which:

- runs one simulation;
- writes recovery samples, births, deaths by cause, and late rootling/GenVo kills to `docs/probes/`.

Its output is identical to the two old probes: kill records equal and all 28 recovery samples equal. The current run is saved as `docs/probes/natural-world-GENVO8-TEST-C.json`.

## 3. Tiers

`tests/test-tiers.json` lists 11 long suites, each measured at 80 s or more:

- natural-world-soak, wild-evolution, autonomous-soil-engineering;
- ecology-resume, family-observer-resume, engineer-loss-return;
- evolution-baseline, engineer-colony-natural, family-recruitment-observer;
- engineer-natural-regional-observation, hydrology.

Each has a measured runtime and a timeout with headroom. Everything else is the fast tier: the slowest fast suite takes 29 s, under a 120 s cap. In fast runs, long suites are listed as `deferred`.

## 4. Known-failure ledger

`tests/known-failures.json` holds 40 entries. Each records:

- a **category**;
- a **signature**: the failing assertion's location (`at`, e.g. `tests/flank-placement.mjs:11`), or a message substring (`match`) for the two long-tier suites;
- a note.

How the runner treats them:

- **Matching signature:** reported `known-fail`.
- **Different location:** reported as a new `fail`, with "expected …, got …". A known-broken suite can't hide a fresh regression.
- **Passes now:** reported `stale`, and the run goes red until the entry is removed, so the ledger can't go out of date.

Both mismatch paths were exercised with a scratch ledger via `--ledger <file>`.

| Category | Suites |
| --- | --- |
| aquatic-breeding-decision | birth-hydration, birth-reserves, conception-parental-inheritance, gestation-inheritance, maternal-birth-authority |
| release-bookkeeping | ai-disclosure, canonical-source, evolution-contract, player-copy-style, provenance |
| performance-budget | observer-play |
| ecological-finding | wild-evolution |
| test-budget | engineer-loss-return |
| untriaged-drift (27) | community-ui-feedback, context-guidance, core, creature-assembly, engineer-breeding-habitat, engineer-family-settlement, evolution-baseline, flank-placement, food-commitment, food-web-feedback, forage-patches, forage-season-competition, handoff-transition, immunity-awareness, lineage-dispersal-resume, lineage-purpose, lineage-strategy, observer-readability, player-presence, special-creatures, species-coexistence, species-leadership, stalker-den-reading, strategy-arcs, strategy-encounters, water-teaching, wildlife-rhythm |

When an entry is fixed, delete it. The runner will flag any you forget.

## Observation from the soak (not a test result)

The canonical worlds decline heavily by day 640 at current defaults:

| Seed | GenVo | Rootling | Mirelick | Bankjaw |
| --- | --- | --- | --- | --- |
| A | 66 | 0 | 0 | 0 |
| C | 41 | 1 | 0 | 0 |
| E | 0 | 1 | 0 | 0 |

The soak deliberately asserts mechanics, not survival: "guarantee biological rules, not outcomes". This is ecological-review material.

## Files

- **New:** `tests/natural-world-soak.mjs`, `tests/known-failures.json`, `tools/probe-natural-world.mjs`, `docs/probes/`, `docs/test-runs/soak-equivalence-2026-10-15.json`, `docs/test-runs/{all,fast}-consolidated-2026-10-15.json`.
- **Removed:** `tests/headless.mjs`, `tests/headless-short.mjs`, `tests/ecology-stability.mjs`, `tests/probe-kills.mjs`, `tests/probe-recovery.mjs`. They are tracked in git and recoverable with `git checkout -- <file>`.
- **Changed:** `tools/run-tests.mjs` (ledger, `known-fail`/`stale` statuses, stderr head capture, `--ledger`, 3 jobs by default), `tests/test-tiers.json`, `README.md` (test list and runner paragraph).
- **Not updated:** `provenance/tree-state.json` and `provenance/decision-map.json` still name the removed files. They are regenerated with the release ledger, which `provenance` already flags.
