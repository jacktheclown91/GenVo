# Mechanism-first validation implementation - October 17, 2026

Approved direction: [audit](MECHANISM-FIRST-VALIDATION-AUDIT-2026-10-17.md). No simulation balance values, food yields, reproduction probabilities, mortality rules, rain input, or genetics were changed. No population rescue target was introduced. Nothing committed, pushed, released, or declared creator accepted.

## Contracts changed and preserved

| Area | Preserved gates and workload | Deliberate contract change |
| --- | --- | --- |
| `tests/wild-evolution.mjs` | Starting registry bodies, functional legs/armor/venom/spines/digging, relic ownership, and 300 mutation attempts excluding exclusive parts | These controlled checks now run independently in the fast tier. A previously unreachable relic fixture now chooses `collect-relic` using the existing canonical interaction helper instead of assuming untargeted interaction collects immediately. Assertions remain strict. |
| `tests/wild-evolution-observation.mjs` | Original GENVO8-WILD-RUN seed, 420 days, 900 s limit; now also checks mechanical integrity | Natural species survival, evolved-survivor counts, and branch diversity are retained in observation records instead of required outcomes. The original assertions and known needlejaw finding remain archived; a timeout remains a failure. |
| `tests/natural-world-soak.mjs` | Same five seeds, 640/320-day horizons, every-tick advancement/capacity checks, daily finite-stock/identity/census/birth-death gates, finite final census, 1500 s limit | Complete extinction is recorded rather than forbidden. No seed or horizon was removed. |
| `tests/ecology-observation-100.mjs` | Same five canonical seeds and strict mechanical gates | Adds a 100-day diagnostic, never replaces long coverage. Its separate 300 s budget is new and initially unmeasured. |
| Historical ledger | Earlier reports and frozen evolution baseline remain untouched | The old `wild-evolution` outcome finding moved to `historicalObservations` in the ledger, because the controlled suite no longer contains that expectation. This is a reclassification, not a claim that wild evolution now finishes within 900 s. |

Original ecological assertions: `timeout-investigation/wild-evolution-outcome-assertions-before.txt`. Existing environmental mechanisms and defaults remain unchanged. Plant moisture tolerance and growth-only water uptake remain open mechanism questions, not population calibration tasks.

## Classification and reporting

`tests/validation-kinds.json` separates validation purpose from fast/long scheduling. Audited areas include the failing and slow scenarios, invariant/mechanism coverage, observations, performance, historical expectations, and release gates. Other suites remain explicitly **unclassified** rather than receiving guessed labels. Slow scenario purpose labels do not claim a complete per-assertion audit; those entries state the remaining review scope.

`tools/run-tests.mjs` keeps the original execution modes and adds `--kind` and `--list`. Mixed suites retain all their gates when selected. `byKind` counts overlap and must not be added together. Existing result fields remain; report schema is now `genvo.test-run/3`.

Examples:

```
node tools/run-tests.mjs --all --list
node tools/run-tests.mjs --kind biological-invariant --json docs/test-runs/invariants.json
node tools/run-tests.mjs --all --kind ecological-observation --json docs/test-runs/observations.json
```

Every selected long suite remains listed as deferred in fast mode. The runner preserves complete suite output, observation progress, and per-seed JSON/NDJSON in a unique artifact directory. An unfinished record is never a completed observation. Reports fingerprint `src`, `tools`, and `tests` code/configuration before and after execution and fail certification on input drift; this is not a release/provenance seal.

Timeout cleanup owns only the process tree the runner spawned. Controlled tests verify normal output, failure output, and termination of both an owned parent and grandchild. This prevents a timed-out soak from leaving workers that contaminate later measurements.

## Observation and scalability evidence

`tools/ecological-observation.mjs` records bounded in-memory samples and incremental disk evidence: census, births/deaths and causes, resources and producer flows, water budgets/flows, migration reasons, lineage events/status, wild-body variation and branch IDs, cohort/genome counts, history sizes, and cache sizes. Readouts do not alter biological state. The production additions are only read-only counters for the crop-yield and generated-genome caches; WeakMap/WeakSet retention cannot be enumerated and is explicitly not claimed measured.

Elapsed phase clocks and process RSS/heap measurements are available. Explicit `--gc` under `node --expose-gc` adds post-GC heap evidence; working set/RSS is not automatically a retained-heap or leak measurement. Phase clocks are inclusive and elapsed diagnostics include measurement/GC overhead. A CPU profile can target a mature window rather than only startup:

```
node --expose-gc tools/observe-ecology.mjs GENVO8-WILD-RUN 420 --profile --gc --cpu-start 280 --cpu-end 320
node tools/summarize-observations.mjs path/to/seed.ndjson path/to/summary.json
```

These commands are diagnostic workloads, not approval to raise test ceilings. Summaries accept a truncated last write as partial evidence, reject malformed complete records, and distinguish missing final receipts from completed runs. Recorded associations are not presented as causal explanations of extinction. Raw samples and receipts remain available for tracing actual mechanisms.

## Verification so far

- Exact saved-state parity between ordinary updates and observed/profiled/yielded updates passes.
- An accounted extinct world passes integrity; corrupt stock still fails.
- Partial/truncated evidence cannot be reported as a completed observation.
- Controlled process timeout cleanup and category/ceiling/history checks pass.
- Controlled wild-body suite passes after the explicit-action fixture repair; its 420-day observation remains separate and visible.
- Three controlled inheritance suites pass.
- Four botanical suites pass with read-only cache counters.
- Classified fast invariant/mechanism gate run: 16 pass, 4 long scenarios explicitly deferred.
- All five release/provenance/style gates still execute and report their existing known failures.
- Three-day CPU/GC capture smoke check completes and writes a raw CPU profile and phase/memory samples. This proves instrumentation, not mature-world scalability.

The pre-split comprehensive run is still historical work in flight. Its old wild-evolution workload timed out at 900.1 s. It must not be presented as a post-split certification. New five-world observations, the full new fast suite, and mature-world performance conclusions are reported separately when actually run.
## Pre-split comprehensive run completed

`docs/test-runs/all-codex-continuation-2026-10-17.json` completed with **385 pass, 6 known failures, 0 new assertion failures, 2 timeouts**, no stale ledger entries, and no deferred suites (393 total; 3,203 s). Wild evolution timed out at 900.1 s and natural-world-soak at 1,500 s. The observer budget suite passed. No orphan simulation workers remained after completion.

This run used the pre-split loaded tests. It is preserved as historical performance/integration evidence and is **not post-split certification**. The subsequent controlled/observation separation does not claim to solve either timeout. Revised fast-suite and ecological-observation results are recorded in separate artifacts.
## Profiled observer performance correction

The first revised fast run recorded 380 pass, 5 known failures, and a new Observer Play performance failure (546 ms against the existing 500 ms budget). An isolated run reproduced it at 544 ms. These failed reports remain intact. A CPU profile identified crop-yield, overlap and supply-survey work as the largest relevant costs; the profiled test itself is diagnostic, not a budget acceptance run.

A private WeakMap receipt in `dietary-demand.js` now reuses source preparation and consumer-context overlap within an existing caller-owned, synchronous, read-only non-hunter candidate scan. It is guarded by simulation, exact supply, actor ID, reserve level and tick. Hunters still discover prey freshly. Current stocks, actor affordability, reach, neighborhood membership and appetite weights retain their existing authorities; no biological coefficient changed. The receipt cannot become a saved simulation field.

`dietary-scan-parity.mjs` compares against the frozen pre-change demand function: exact complete saved state through eight ordinary natural days, plus 648 real candidate/reserve-edge comparisons. The six carrying tests also pass, including immediate harvest/depletion and individual handling-funding behavior. Isolated Observer Play then measured 446 ms under the unchanged 500 ms limit. The full fast regression suite is rerunning on the guarded final implementation.

The runner now records the actual audited `failureKind` and `byFailureKind`, independently of a mixed suite's purpose labels. Timeouts are performance failures; known release gates stay release gates; unaudited mixed failures remain unclassified. The input-drift guard remains active.
## Post-split verification results

The final fast suite (`docs/test-runs/fast-mechanism-first-reviewed-2026-10-17.json`) completed with **382 pass, 5 known release/provenance/style failures, 0 new failures, 0 timeouts, 12 long suites explicitly deferred** (399 total; 137 s). Its before/after code fingerprints match. Observer Play measured **483 ms** under the unchanged 500 ms budget. This is separate from the earlier retained 546/544 ms failures and the 446 ms isolated measurement.

The additional five-world 100-day observation completed in **159.8 s** under its 300 s diagnostic budget, with no invariant failures and matching code fingerprints. At day 100:

| Seed | Living animals | Births | Deaths | Recorded causes | Seed cohorts |
| --- | ---: | ---: | ---: | --- | ---: |
| A | 367 | 192 | 6 | 6 predation | 338,969 |
| B | 359 | 185 | 8 | 8 predation | 330,255 |
| C | 327 | 168 | 20 | 20 predation | 310,143 |
| D | 371 | 197 | 6 | 6 predation | 322,477 |
| E | 322 | 162 | 21 | 20 predation, 1 starvation | 324,039 |

No initially founded species disappeared during this 100-day window. This is an observation, not a survival requirement or a conclusion about later equilibrium. Largest sampled absolute daily water-budget closure was about 0.0000345. Per-seed samples record initially absent species separately from subsequent losses. Summary: `docs/test-runs/ecology-observation-100-2026-10-17.summary.json`.

A separate original-seed 420-day diagnostic is running alone under the **same 900 s ceiling**, with explicit GC and a CPU window at days 280-320. Diagnostic overhead is included. Its results must distinguish completion from partial evidence; it does not replace the unchanged long tests or certify an unprofiled workload merely by reclassifying outcomes.
## Development priority update

The 420-day diagnostic ended at its unchanged 900-second timeout; the last complete sample covers 300 completed days. No final observation receipt exists. Short CPU-profile chunk retention now passes a dedicated fixture. No long rerun is scheduled. The creator has replaced routine multi-world validation with one primary 100-day integration benchmark and focused checks; see `DEVELOPMENT-SCHEDULE-2026-10-17.md` for checkpoints, measured effort, environmental dependencies and the lean execution schedule.
