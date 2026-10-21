# Mature atomic-update attribution and botanical work

The immutable bundled mature scenario reproduces a long synchronous biological update on canonical source. `tools/profile-scenario-ticks.mjs` profiles 1–96 ordinary ticks, records phase timing and CPU samples, separates restore cost, and optionally saves the final complete snapshot for exact replay comparison. It does not change populations, anatomy, resource stocks, policies, phase order or simulation frequency. Current tool output includes source/input fingerprints and refuses existing receipt paths.

## Observed bottleneck

The recorded Day-100 scenario (`c95c8909e8ab3adeddf03a14dadf0ad3936bfc4948295c642349dc4d7e7f53d6`) advances from tick 4800/day 101 to tick 4848/day 102, retaining 292 living animals. Before the change, 48 ticks took 2878.7 ms in Node, with median 2.05 ms and maximum 1855.5 ms. Daily vegetation took 1696.5 ms; perception had a 486.4 ms cold maximum. Botanical reproduction, genotype construction/identity and retained-genome scanning appear among sampled costs. Inspector/native attribution is incomplete, and nested phase durations must not be added as independent work.

The candidate replay took 3699.0 ms, with maximum 2424.7 ms and vegetation 2235.8 ms. Those sampled end-to-end runs do **not** establish a frame-time improvement. Inspector overhead, warmup, host load and GC differ. The long vegetation update remains unresolved. No browser FPS, sustained-session or player-recording acceptance is claimed.

## Exact bounded changes

- Botanical content identity computes its two unchanged FNV hashes during one payload traversal, preserving the original prefixed hash state and UTF-16 behavior. It still checks cached full payloads for collisions.
- Validation immediately recognizes the module-owned immutable founder object by identity. Other objects, including forged copies, retain ordinary validation.
- Daily reproduction removes a second consecutive registration of the same already-registered adult genotype. There is no skipped reproductive decision or altered mutation probability.

An alternating same-process diagnostic on 2000 real mature genotypes (8000 identity computations per measured row) observes roughly 18.4–21.1 ms before and 12.7–13.4 ms after following the first round. All identity values match. This supports only the isolated hashing improvement; it does not resolve the full simulation stall.

The complete post-day snapshots are exactly equal using `isDeepStrictEqual`, including physical stocks, all organisms, RNG, genotype/seed registries, botanical receipts and controllers. The historical reference source is retained in `botanical-genetics-before-hash-pass-2026-10-20.txt` with SHA256 `76308231f447cfffba3cb771a4b85c88249e430d0e8a21e3c388c23ea4f69c92`; `tests/botanical-identity-parity.mjs` exercises 512 full historical identity/content comparisons, Unicode cases, founder validation and forged-ID rejection. Existing botanical genetics, reproduction, safety and embryo/save checks pass. Source/export checks and the focused playable integration gate pass.

Raw diagnostic receipts and exact comparison snapshots are under `C:\Users\jackt\.codex\visualizations\2026\10\20\01a1583e-f787-7bb3-a369-b0b62a443366`: `mature-ticks-before.json`, `mature-ticks-after.json`, corresponding `.v8` snapshots, `botanical-identity-micro.json` and `botanical-profile-playable-gate.txt`. The initial two phase receipts predate the profiler's source-fingerprint metadata addition; their source boundary is the parent `acf7663` versus the three documented candidate edits. They have not been rewritten.

## Next performance work

Daily botanical reproduction, complete positive-cohort/genotype bookkeeping and cold perception need deeper algorithmic work or a carefully versioned cooperative execution design. The frame budget cannot preempt their current atomic update. Keep real positive/rare cohorts, all births and unchanged biological cadence. The complete game, late-session responsiveness and creator acceptance remain unfinished.
