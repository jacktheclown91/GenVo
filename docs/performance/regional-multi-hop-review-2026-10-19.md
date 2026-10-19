# Multi-region biological continuity (October 19, 2026)

## Reproduced and repaired

Crossing A to B retained A as a biological archive. Crossing B to C rebuilt the list of previously archived regions using only key and snapshot. This dropped A's biologicalMode, biologicalLedger and environmentalLedger. The biological scheduler then excluded A; the legacy environmental path could advance its weather while its animals remained frozen. Single-region outward/return tests did not expose the defect.

planetary-travel.js now retains the full record for every unaffected archive. Its snapshot and existing metadata are preserved; the source/destination transfer and transaction remain unchanged. The fix does not change biological cadence, IDs, capacity, coefficients or save format. It preserves legacy archive modes rather than promoting old worlds to new biology. Records already stripped by older code are not retrospectively reconstructed: their missing history cannot safely be inferred.

The new tests/regional-multi-hop-biology.mjs failed against the old transfer and passes with the repair. It uses actual traversable geography for A to B to C, controlled placement of the existing traveler, ordinary ticks and normally founded wildlife. It checks complete retained records, continued canonical biology in both archives, valid physical/biological receipts, honest time debt, exact whole-save roundtrip and uninterrupted-versus-resumed continuation over two life strides. E15, E17 and E18 existing checks also pass. No food, birth or mortality events were staged in the new test.

## Ten-day scale diagnostic

With three visited regions and two inactive archives, ten active days took 18.50 seconds in Node. Both archives advanced 240 real ticks (five days); active time advanced 480 ticks. Archived populations were 195 and 188, with no recorded births/deaths during those five remote days. These are observations, not population targets. Soil/salt ledgers pass. Receipt: regional-multi-hop-10day-2026-10-19.json.

The 31,805,412-byte raw Node checkpoint restores to its exact entire saved state. Two independently transported reloads continue for a full day identically. That latter check establishes deterministic reload continuation, not uninterrupted-versus-restored full-day parity; the targeted regression separately covers the uninterrupted comparison over two life strides. Restore measured 379 ms in one warm-cache sample, not a general benchmark. Receipt: regional-multi-hop-save-2026-10-19.json. The checkpoint is local/ignored and indexed in ../LOCAL-CHECKPOINT-MANIFEST.json.

The measured update calls have median 0.76 ms, p95 270.66 ms, maximum 819.99 ms, and 80 of 480 calls above 50 ms. This Node profile includes synchronous biological/reconstruction work and ordinary runtime/GC interference; it is not browser frame-time evidence. The long calls are a concrete responsiveness risk requiring browser proof and scheduling work.

## Scheduler remains incomplete

The current scheduler processes one archive for one life stride per active life stride. With two archives, incoming debt is twice processing capacity: each falls five days behind over ten active days. Once debt exceeds the entry limit, returning is refused. Continuing active-world time cannot drain this growing backlog. The current return-blocking advice is therefore insufficient for this case.

This pass repairs lost biological authority; it does not claim synchronized planetary life. A follow-up scheduling contract must define when active time waits for remote work, fair ordering across regions, deterministic identity allocation, bounded/yielding browser work, explicit save-policy compatibility and truthful catchup feedback. Merely increasing a batch limit or changing update order can alter birth IDs and inherited outcomes. No silent culling, offspring clipping, synthetic growth or discarded lineage variants are acceptable substitutes.

Reproduce the controlled diagnostic in fresh output paths:

```
node --max-old-space-size=4096 --expose-gc tools/profile-regional-replay.mjs FRESH_RECEIPT_JSON 10 --archives 2 --snapshot FRESH_LOCAL_SNAPSHOT
```

Mature archived-world day-100 replay, global ocean exchange, live cohort-memory scale, simple-origin accessibility and human play acceptance remain incomplete.

Full fast integration: 446 pass, four known failures, zero new failures/timeouts/stale entries, 12 deferred (462 total, 207 seconds, no code input drift). The unchanged observer timing gate passed. Receipt: ../test-runs/multi-hop-biology-integration-2026-10-19.json. Four known failures still preclude a blanket green claim. Changes remain local and uncommitted.
