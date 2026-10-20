# Paired planetary salt exchange, synchronized regions

## Live ownership

New planetary regions already exchange finite amounts of salt with a geography-defined ocean or freshwater reservoir at their physical outer edges. That externally accounted boundary stays in place. This change adds a **separate paired exchange** where two genuinely materialized, canonical biological regions are adjacent and both have completed the same physical day.

`src/world/planetary-seam-salt.js` finds matching water cells along adjacent 128×128 World borders. Only an existing wet cell with a declared open boundary may exchange. A signed concentration difference generates a bounded one-day salt flow. The donor is debited and the recipient is credited by exactly the same amount; neither creates a duplicate water or salt authority. Every donor is limited by its actual available salt and every recipient by its physical dissolved-salt capacity. Corner cells shared by multiple seams are budgeted on their already staged available amounts.

The two stocks continue to reside independently in their own active World and archived World snapshot. A region's external geography reservoir is **not** treated as its neighbor's mutable salt stock, and boundary-reservoir salt is not deducted from the neighbor.

## Clock, ordering, and persistence

- Exchange is admitted only under the new synchronized regional replay policy, after every archived canonical region has caught up to the active world's exact biological tick, on a completed physical day.
- The sync barrier visits adjacent region pairs in a stable order. Flows are staged and checked before any World array is mutated. Each pair has a signed, order-stable salt receipt.
- Each region's daily `environment.lastDay`, bounded `environment.daily`, and cumulative `environment.totals` account for its own positive `pairedInput` and `pairedOutput`. These are **separate** from its `boundaryInput` and `boundaryOutput` to the vast outside ocean or freshwater reservoir.
- The canonical `planetaryTravel.seamLedger` records completed ticks and a bounded recent history of paired receipts. The last completed tick prevents reapplying the same daily transfer after a save, frame yield, or return crossing. World travel carries the ledger forward, and restored saves validate its schema and receipt ordering.
- Historical planetary regions with the old physical schema, regions not running canonical biology, unready regions, and partially replayed days receive **no** new paired adjustment. Nothing is silently migrated or refilled.

The number of detailed world regions and the 128×128 extent remain unchanged.

## Verification boundaries

`tests/planetary-paired-seam-salt.mjs` loads real coastal geography in two neighboring regions, starts them with a controlled salinity contrast, runs genuine day ticks, and verifies equal source debits and destination credits, bounded local inventories, complete physical receipts, exact save/restore, no same-day double transfer and canonical continuation.

The existing three-region synchronous versus yielded replay regression remains the acceptance test for frame ordering and mid-barrier saves. Historical save tests, salt/conservation checks, gameplay and browser checks continue in GitHub Actions.

## Dynamic water inventories, environment schema 3

New planetary Worlds now retain immutable Float32 geographic bathymetry in `environment.depth`, while owning a separate Float64 `environment.volume` inventory. The independently saved volume can change by a finite physical amount at a genuine adjoining wet seam, rather than being silently reset. A higher surface head (terrain elevation plus current volume) supplies bounded outgoing water. Donor salinity determines how much actual dissolved salt that transfer advects.

The same synchronized, once-per-day paired authority stages both water and salt debits/credits. It never deletes a wet tile, floods a land tile, or crosses an unconnected geographical edge. Every accepted transfer is capacity bounded, with a persistent `waterAToB` / `waterBToA` pair receipt. Each World independently records `pairedWaterInput`, `pairedWaterOutput`, `waterBefore`, `waterAfter` and `waterClosure` alongside its existing dissolved-salt receipts. The sum of physical volumes in both regions is conserved to floating-point precision.

Restored `schema:1` and `schema:2` environments retain their historical rules, without fabricated volume fields or implicit migrations. A paired salt seam between an old and new region cannot move water until both actually own a schema-3 dynamic volume ledger.

`tests/planetary-paired-seam-salt.mjs` now verifies an actual hydraulic height gradient, equal source/destination volume flux, salt advection, exact checkpoint restoration and subsequent canonical ticks, v2 fallback, and corrupted-volume rejection.

This is **not yet full finite-volume hydrology**. Water volume changes across already wet *regional seams*; local tile-to-tile water volumes, rainfall-driven changes in stored water depth, tidal/ocean circulation, river discharge across land, and shoreline inundation/drying remain outside this pass. The existing external geography-composition reservoirs continue to use separate physical salt receipts. A mature 100-day multiregion performance and stability run remains required.
