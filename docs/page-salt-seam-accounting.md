# B1 initial page-seam salt accounting (development branch)

Baseline: main `c4453fe8faf54f41c74aff90a82d6e92f76b3228`. This is the **first bounded B1/D foundation**, not completion of B1, D, continental ecology, or any LP criterion.

## Canonical ownership

- `World.environment.depth` and `World.environment.salt` remain the sole live water/salt stocks. `World.pages` are views and cannot mutate or evict biology. This change does not introduce regional copies, flush-on-unload, autonomous offscreen ecology, or new water flow.
- `advanceEnvironmentWater` continues the existing simultaneous four-neighbor salt advection and rain/reservoir terms unmodified. It now observes actual transfers when a pair straddles a `WORLD_PAGE_SIZE` page boundary, aggregating clockwise canonical east/south edges with **both gross directions** and a signed net amount.
- `environment.daily[].pageTransfers` and `environment.lastDay.pageTransfers` store compact versioned observed receipts. No new simulated supply/demand is introduced; no mutation draw or population heuristic is changed. Empty receipts explicitly mean no cross-page transfer in that update.
- `validateEnvironment` rejects malformed, nonadjacent, duplicate, nonfinite, negative or inconsistent net transfer receipts. Old saved daily receipts with no `pageTransfers` remain valid and untouched. This is observational evolution of the history format, not a new biological/save-policy migration.
- `pageSaltStorage(world)` reads canonical World-owned salt for verification; it owns no material and is never called as an ecology update.

## Focused proof added

`tests/page-salt-transfers.mjs` constructs a controlled 128×128 World-shaped water/salt state with two independent page crossings, one east/west crossing with equal opposing flows and one north/south crossing. With no rain or reservoir, sum of the directed seam receipts must match each page's actual stock delta and the whole-world salt budget must close. It also tests malformed receipt rejection, old-history tolerance, page-cache eviction noninterference, and ordinary `Simulation` snapshot/resume equality.

A local Node 22 execution of the standalone page-ledger helper checks passed, including directed edges, opposite flows, invalid input and inventory projection. The **repository-integrated suite and fast gate have not been executed** in this environment: a full checkout was unavailable because the container could not resolve github.com. The new test is present in Git for a normal runner to execute; do not call it passing until it is actually run.

## Remaining B1/D requirements

1. Review physical cross-region water/salt/mineral and surface runoff units plus explicit upstream/downstream ownership; current fixed-depth salt advection is only a limited observation surface.
2. Implement stable paged or regional **live** stock and organism ownership with atomic exact-once transfers and interrupted-update recovery before allowing populated region unloading. Do not duplicate the canonical World.
3. Prove deterministic seam transactions under different page load orders and multiple resumed worlds. The present existing World is dense and retained, so view unload alone is not a full offscreen simulation stress test.
4. Review and profile before any enlargement of the 128×128 biological extent. No visual continents or remote ecological instantiation are claimed by these receipts.
5. Keep separate tests for resource conservation, births/deaths, migrations, archival integrity and mature-world performance.

The original five known fast-gate failures and 12 deferred long suites remain the last **recorded** baseline; no new current-tree test-run receipt or visual acceptance has been fabricated. No release requested.

## Subsequent bounded B1 increment: actual land groundwater page seams

`exchangeTerrainGroundwater` already conservatively moves land groundwater between adjacent World cells, using the existing elevation/head, `SOIL_WATER.lateral`, and available local groundwater. This continuation **does not change that law**. It now exposes an optional observer only for real *land-to-land page-seam* movements. `advanceSoilWater` aggregates those signed quantities in `soilWater.pageGroundwaterTransfers`; `advanceSoilDay` places the resulting receipt in the daily/lastDay history. `validateSoilWater` rejects altered or nonadjacent page evidence while accepting earlier saves without it. Every stock remains in the original canonical groundwater array.

Boundary note: land/open-water exchange remains a fixed-reservoir source/sink in the existing `totals.lateral` soil-water budget and is **deliberately excluded** from land-to-land page transfers. Neither the generated planet nor the current detailed world has dynamic cross-region open-water reservoirs. Land-to-land receipts are not substitutes for accounting rain, evapotranspiration, runoff, deep drainage, and open-water exchanges.

The new `tests/page-groundwater-transfers.mjs` checks the exact prior terrain-exchange output with observation enabled/disabled, two-axis page seam balance from actual Float32 groundwater stores, opposing flows, malformed receipt rejection, no state mutation on view eviction and full Simulation save continuation. A local isolated Node 22 version of the ledger tests passed for directed movement, preservation of opposing flows and invalid receipt handling. **The integrated test and full fast gate remain unexecuted here** because github.com was not resolvable from the container. No verified runtime/browser outcome is claimed. The draft PR remains held for independent verification.

Further work is still required for true cross-region stocked **water volume** and mineral movements, exact-once unloaded-region event processing, and region-scale conservation before increasing live geography. No larger-world approval, biome completion or performance certification is inferred from this increment.
