# Interim performance review | October 21, 2026

## Scope and source

The interim branch did **not** replace the botanical engine, compress positive seed cohorts, reduce populations, relax ecological cadence, reorder canonical phases or alter biome/resource accounting to win benchmarks. It preserved the documented [October 20 mature-tick profile](MATURE-TICK-2026-10-20.md) and ran the repository's bounded identical-input seed-bank parity tool with GitHub Actions. No claim of a new mature-world acceleration is made.

## Previously measured mature-world bottleneck

The immutable Day-100 scenario in `MATURE-TICK-2026-10-20.md` advanced tick 4800 to 4848, with 292 living creatures. Baseline 48-tick Node replay took **2878.7 ms**, with worst tick **1855.5 ms** and daily vegetation **1696.5 ms**. Cold perception also reached **486.4 ms**. The older candidate took 3699.0 ms and its vegetation phase 2235.8 ms; that candidate did **not** prove a full-world speedup. Source fingerprints, saved state and limitations are recorded in that document and the original diagnostics. This interim pass did **not** rerun that expensive mature scenario.

## Newly rerun bounded cohort parity

[GitHub Actions run 39554432483](https://github.com/jacktheclown91/GenVo/actions/runs/39554432483) ran `node tools/benchmark-seed-daily-hotpath.mjs` on Node 22:

- 8,192 synthetic cells, 20 seeded cohorts per cell, **163,840 positive cohorts**, 3 modeled days.
- Historical reference loop durations: **27.69 ms**, **22.72 ms**, mean **25.21 ms**.
- Existing optimized runtime loop durations: **25.69 ms**, **17.53 ms**, mean **21.61 ms**.
- Exact seed-bank arrays, litter, active-index order, cohort identifiers and each positive amount matched the reference after every modeled day according to tool assertions. `tests/botanical-identity-parity.mjs` also passed all 512 historical comparisons and forged-ID rejection.

The sample means describe only the preexisting `scaleSeedCohorts` implementation versus the tool's historical reference. They are **not a speedup created in this branch**, not statistically robust frame pacing, and not a substitute for whole-game state replay or long-session Chromium observation.

## Diagnosis and recommended next operation

The persistent highest-risk cost is **atomic daily botanical reproduction/vegetation work**, especially complete positive-cohort and genotype bookkeeping, plus a cold perception spike. The `FrameStepper` budget cannot interrupt one expensive `Simulation.update` call. The existing stored botanical hash improvement demonstrates only isolated identity speedup. Future work should:

1. Profile the same immutable checkpoint and exact versioned baseline in alternating runs with source/input fingerprints, without guessing that warmer caches equal a fix.
2. Attribute `phaseVegetation` to specific seed-cohort lookups, botanical registration and per-cell work using existing profiler hooks; isolate one redundant scan or copy with a provably equivalent replacement.
3. Compare complete snapshots with `isDeepStrictEqual`, including every positive/rare cohort, genetic ID, seed and litter quantity, RNG, all creature records and regional biology, before claiming success.
4. Only then repeat representative browser frame pacing and player progress in real Chromium.

There was **no demonstrated safe mature-world improvement** in this interim window, so no botanical-runtime replacement is included in the PR. The goal is to hand Codex an exact baseline and next experiment rather than an unverified frame-time claim.
