# Far-region performance — October 21, 2026

No ecological rule changed in this pass. Every optimization was checked for value-identical results against the code it replaced.

## Measured cost

A CPU profile of population-model days on a 195-animal region showed:

| Phase | Share of a day |
|---|---|
| daily vegetation (botanical reproduction 22%, land producer growth 14%) | 43% |
| soil | 11.5% |
| population behavior (half of it canonical conception checks) | 11% |

A separate measurement of one replay stride found that restoring the detached regional Simulation from its snapshot cost about 84 ms. The six ticks it then ran cost 31–38 ms, and snapshotting 4 ms. About 70% of every far- or near-region stride job was rebuilding the region.

## Changes

- **Warm regional replay** (`src/world/regional-warm-cache.js`):
  - Resident replay (`advanceRemoteBiology`) keeps the Simulation a successful stride produced and reuses it for that session's next stride.
  - Reuse requires the session to hold exactly the published snapshot: same object, same owner revision, and the same shallow field identity of snapshot, core and world. Any replacement, in-place seam publication or policy adoption falls back to an ordinary restore.
  - A warm session publishes an independent deep copy (about 37 ms), so later ticks can never alter an archived checkpoint. A failed stride discards the warm Simulation while the published state stays intact.
  - Capacity is 8 Simulations, and canonical neighbours (stepped inside player frames) displace far regions, never the reverse.
  - The cache is cleared on crossing and world install; unloading a region drops its entry. Leased replay from storage is unchanged.
- **Botanical flowering:** a cell holding no flower, pollen or embryo is mature exactly when it is land and its stock reaches the threshold, so such cells skip key construction and map lookups. Decisions and their order are unchanged.
- **Population-model pairing:** canonical conception availability is evaluated lazily in distance order and stops after two allowed partners, instead of being computed for every nearby male. A female pre-check on breeding support was tried and rejected because survey caching made it change outcomes.
- **Browser scheduling:**
  - Far population-model regions advance in idle callbacks (`advanceNextDemographicRegion`), and only when they owe a whole life stride.
  - Headless and Node simulations keep stepping them inside `update`.
  - Residency catch-up now advances lagging regions one stride per action instead of a day.

## Evidence

- **Exact parity:**
  - Canonical-structure digests of complete checkpoints match the previous commit for 6 and 28 days on a 195-animal valley and a founded region, in both canonical and population modes, including 9–55 births.
  - Warm and cold three-region worlds (canonical neighbour plus far population region) are value-identical after 2 and 8 days, and in a 120-stride lockstep run.
  - `tests/regional-warm-cache.mjs` covers capacity priority, invalidation, value parity and checkpoint independence.
- **Speed:**
  - Population-model days: 168 → 130 ms (valley) and 135 → 106 ms (founded region).
  - Three-region world: 2.56 → 1.72 s and 3.37 → 2.22 s per simulated day (Node, about 33%).
- **Browser frames** (exported build, four crossings, 15 s per mode):
  - Median frame 17 ms and 95th percentile 50–67 ms in both modes.
  - The worst stall fell from about 517–550 ms to 350–367 ms once catch-up was stride-sized.
  - The first idle-driver attempt was worse, because it ran many one-tick jobs; it now waits for whole strides.
- **Other checks:** E15–E18, demography, residency, journal, seam, records, preparation and founding tests, plus residency, storage and border Chromium checks, pass.

## Limits

- **Memory:** each warm Simulation is extra memory (about 12 MB for a young region; mature regions are much larger), bounded by the capacity of 8.
- **Remaining cost:** vegetation and soil remain the dominant per-region cost; reducing them needs deeper changes to the ecology modules.
- **Measurement scope:** worst stalls of 300–500 ms remain around crossings and rotation; long-run browser profiling with many far regions is not done.
- **Behaviour gap:** the population model's behavioural difference from canonical simulation (more births on the valley over 28 days, fewer in a founded region over 40) is reported, not tuned.
