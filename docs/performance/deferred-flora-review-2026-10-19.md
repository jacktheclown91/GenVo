# Deferred redundant flora initialization (October 19, 2026)

A five-day, two-archive CPU profile identified restore and flora upgrade as substantial work. About 5.88 sampled seconds were inside restore; structuredClone used about 2.32 seconds of self time. These overlapping whole-process samples include startup/crossing, not just browser frames. See regional-synchronized-cpu-summary-2026-10-19.json. The raw local profile is indexed in ../LOCAL-CHECKPOINT-MANIFEST.json.

A restoring Simulation previously initialized generated flora through PlantDispersalController.upgrade before applying the saved controller, then ran upgrade/validation again on loaded state. Restoration now defers the generated initialization only when a saved dispersal controller exists. All final loaded-state validation and callback attachment still run. Saves lacking that controller retain the original initialization fallback. Fresh worlds are unchanged. No tick ordering, replay policy, schema, migration, biological arithmetic, resource ownership or identity allocation changed.

The previous save manager is SHA-locked in save-manager-before-deferred-flora.txt as comparison evidence, not another runtime authority. tests/restore-deferred-flora.mjs compares complete restores, full-day continuations and subsequent crop consumption across three generators, missing controllers and valid legacy-field fixtures. It also requires malformed crop tissue to be rejected by both versions. A first synthetic fixture removed a mature genotype registry while retaining references into that registry; the old implementation rejected it too. The legacy-field fixture now starts from founded state rather than pretending that corrupted mature state is a historical save.

## Measured evidence

| Workload | Before | After | Scope |
|---|---:|---:|---|
| Three-region day-10 checkpoint restore | 206.96 ms | 155.71 ms | Mean of two samples each, before/after/after/before |
| Full ten-day two-archive run | 36.58 s | 33.56 s | One ordered pair, about 8.2% less observed time |
| Mature default day-100 checkpoint restore | 2,498 ms | 2,490 ms | Mean of two samples each; no meaningful gain established |

The three-region checkpoint and the 88.7 MB day-100 checkpoint both match the entire previous restored state and full next day exactly. Each independently restored world receives its own binary transport buffer. The complete ten-day replay also matches the pre-change active-plus-archived checkpoint exactly, including clocks, flora, animals, controllers and ledgers. All remote regions remain within one six-tick stride at the observation endpoint. No cohorts or animals are removed.

Receipts: deferred-flora-regional-benchmark-2026-10-19.json, deferred-flora-day100-benchmark-2026-10-19.json and regional-deferred-flora-10day-2026-10-19.json. Reproduce checkpoint checks with tools/benchmark-deferred-flora.mjs INPUT_BIN FRESH_RECEIPT_JSON under node --max-old-space-size=4096 --expose-gc. Inputs remain local/ignored and indexed in the local manifest; a clone alone needs to regenerate or obtain those listed checkpoints.

## Browser and limits

Real Chromium's main game loop and IndexedDB pass again: three visited regions, one local day, both archives within six ticks, eight sampled frames with held local time and remote progress, a visible catchup notice, exact IndexedDB roundtrip and zero page errors. Receipt and inspected runtime captures: regional-deferred-flora-browser-2026-10-19/.

The maximum observed browser frame gap was 583 ms, compared with 450 ms in the earlier diagnostic. These are isolated runs subject to rendering/GC/cache/runtime interference. No smoother-frame claim follows from reduced mean restore cost. Individual transactions remain expensive and need a stronger execution strategy. The transient notice is verified by DOM visibility/frame samples, not guaranteed to remain in the asynchronous captures. Controlled border views are not creator art approval.

Mature-save scaling, live cohort-memory growth, worker/transaction execution, mature multi-region day-100 replay, global ocean exchange, simple-origin evolutionary accessibility and human playability remain incomplete. The overall goal stays active. Changes remain local and uncommitted.

Full fast integration: 448 pass, four known failures, zero new failures/timeouts/stale entries, 12 deferred (464 suites, 215 seconds, no code input drift). The original observer timing gate passed unchanged. Receipt: ../test-runs/deferred-flora-integration-2026-10-19.json. Four known failures remain; this is not complete acceptance.
