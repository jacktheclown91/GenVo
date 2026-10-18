# D1: Canonical page-scheduled land producer work

Parent: D0 draft PR #3. This change is a bounded **real ecological execution pass** over the current World, not a virtual distant continent or a new resource store.

## Single authority, preserved physics

- The only plant biomass and fungi inventories remain `world.plants`, the existing organic-resource cycle and finite plant/soil-water/mineral stores. The existing `growLandProducers`, `advanceFungi`, `advancePlantInputs`, `advanceFreshwater`, botanical reproduction, litter and soil engineering code are reused **unchanged**.
- `Simulation.phaseVegetation` is guarded by the persisted `pageDayWork` day marker. Once the *whole physical producer phase* finishes, the day receipt records a per-page count of actual land cells worked and the total. Calling the phase a second time in the same day cannot produce a second crop, decompose litter twice or duplicate a mineral/seed effect.
- `visitLandByWorldPage` is used for the real land-cell producer/fungal work. Each tile is visited once, in the **same global row-major linear index order** as the original implementation, including when a row crosses page seams. This matters for preserving all biological RNG and world update ordering. For each page, the completed receipt counts the processed land cells and excludes canonical water cells.
- The camera's `WorldPages` cache is never queried to choose which cells are simulated. Evicting visual pages has no effect. Real ecology still advances in every part of the current 128x128 World.
- `pageDayWork` saves in existing schema 10 core state and is strictly validated on restore. Missing field on older schema-10 snapshots is accepted without fabricating earlier receipts. An incomplete phase is **fail closed**: a partial journal is not replayed on top of mutated stocks, and saved pending phases are rejected. This does *not* yet provide crash recovery/rollback of partially performed work.
- `WORLD_PAGE_SIZE=64`, the world dimensions, day length, ecosystem source/sinks, weather, stamina, mating and population rules are unchanged. No RNG draws are added by the scheduler.

## Acceptance and limits

`tests/page-vegetation-work.mjs` verifies partial-page traversal order, coverage and no duplicate indices; real daily producer receipts and material stock continuity; camera eviction invariance; same-day duplicate-call neutrality including RNG; strict corrupted/unfinished/future-dated save rejection; historical-save compatibility; and resumed ecology equality. CI also runs offscreen birth/death, regional identity, soil/plant/carrion, save and full-fast regressions.

D1 does **not** implement independent offscreen creature AI, genuine independent page unloading, atomic plant stock transfer between pages, world enlargement, suspended workers, timers, or geological epochs. D1's page receipt records **completed** whole-phase work; interrupted updates still require restoring a checkpoint. Future region ownership needs stronger unit-of-work atomicity and explicit exactly-once animal movement/birth/death transactions with durable checkpoint recovery. No claim of complete D/LP milestones or shipping-quality performance is made.
