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

This is **not yet full finite-volume hydrology**. Water *volume* stays fixed; river discharge and bidirectional flows of finite water inventories, real ocean circulation, erosion coupling and mature 100-day multiregion performance remain unfinished. The external geography-composition reservoir still exists at open borders even where paired exchanges occur, and its exchanges have separate receipts.
