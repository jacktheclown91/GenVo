# Generated-world restore cache review (October 19, 2026)

Repeated offscreen replay reconstructs deterministic starting terrain before applying saved state. Restore now reuses a bounded cache of pristine generated scaffolding. It still restores through the existing validation path and executes every canonical biological tick; scheduling, identity allocation, save schemas and resource rules are unchanged.

Only restoration opts in. Ordinary new-world construction remains unchanged. The four-entry cache keys seed, generator, regional origin and mutable generation configuration. World method replacement invalidates entries. Each result receives independently cloned mutable state, preserves plant-field aliases and receives new page views owned by that world. Only immutable planetary geography is shared. Unsupported configuration or cloning falls back to ordinary generation. The cache neither stores live simulations nor changes atomic offscreen publication.

## Evidence

The SHA-locked previous save manager is retained in save-manager-before-generated-base-cache.txt as comparison evidence, not a second implementation authority. tests/world-restore-base-cache.mjs compares freshwater, coastal and planetary construction, entire restored states and full-day continuations; it checks historical missing-field defaults, mutable-array isolation, page ownership, configuration changes, bounded eviction, invalid inputs and disabled-cache fallback. Existing save-persistence and E18 offscreen-biology tests also pass.

A paired five-day PLANET-B0-A diagnostic uses one real legal border crossing after controlled player placement. Uncached replay took 11.580 seconds; cached replay took 9.342 seconds, about 19.3% less time. The entire final active-plus-archived saved state matches exactly. Both complete 240 remote ticks with zero debt and valid environmental/biological ledgers. The cache recorded one miss and 39 hits. Receipts: regional-replay-uncached-2026-10-19.json and regional-replay-cached-2026-10-19.json.

This is one ordered comparison, not a repeated benchmark or browser frame-rate claim. Timings include actual biology, explicit GC, integrity checks and readouts. Five days with one archived region do not establish mature multi-region performance, browser persistence, natural migration or simple-origin diversification. No organisms, seed variants or offspring were clipped.

Reproduce in fresh output paths:

```
node --max-old-space-size=4096 --expose-gc tools/profile-regional-replay.mjs FRESH_BEFORE_JSON 5 --uncached --snapshot FRESH_LOCAL_SNAPSHOT
node --max-old-space-size=4096 --expose-gc tools/profile-regional-replay.mjs FRESH_AFTER_JSON 5 --reference FRESH_LOCAL_SNAPSHOT
```

The reference snapshot stays local/ignored and is indexed in ../LOCAL-CHECKPOINT-MANIFEST.json. A clone can regenerate it with the first command. This performance pass does not repair the separately documented missing planetary ocean exchange or live cohort-memory growth.

Full fast integration: 445 pass, four known failures, zero new failures/timeouts/stale entries, 12 deferred (461 suites, 208 seconds). Receipt: ../test-runs/world-restore-cache-integration-2026-10-19.json. The unchanged observer timing gate passed. Four known failures remain; this is not full acceptance.
