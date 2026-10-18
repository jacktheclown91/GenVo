# D4 exclusive regional fauna object owners

This is the **first runtime physical organism indexing boundary** needed for genuinely separately addressable pages. It is not yet a partitioned multiregion population authority.

## Runtime ownership contract

`src/ecology/page-fauna-owners.js` maintains one private registry *per Simulation instance*. Each living `Simulation.animals` object has exactly one entry by its globally unique ID and belongs to exactly one 64-tile page bucket, or to the explicit `outside` bucket when a test/script places it outside the 128x128 world. Each bucket references the **identical in-memory actor object**, never a copy of its body, genes or resources.

- Birth through the existing spawn authority immediately enters its physical page.
- Actual page-crossing movement moves the **same actor reference** between buckets. Source no longer lists that actor. Repeated same-page synchronization is idempotent.
- Death through the canonical `kill` authority immediately removes the actor's ID from its bucket. No changes to death, carcass, genetic or predator rules.
- Existing regional daily census reconciles script-driven moves and removed/respawned actors. For advanced tools calling direct coordinate edits, `pageActors(key,{refresh:true})` forces reconciliation. Regular page queries use the indexed bucket instead of iterating every animal.
- Saved D0 page-residency receipts continue to preserve historical crossings and ownership *IDs*. Saved `Simulation.animals` preserves each complete actor exactly once. D4's runtime object references are **derived from those saved canonical actors**, held in a WeakMap, and do not introduce duplicate serialized creature data or a new save schema. On restore the index is rebuilt from restored actors on first use.
- A conflicting second live object with the same ID fails immediately. A dead actor has no owner. Page views and camera cache eviction are independent of these buckets.

## Production integration

`RegionalEcologyController.notePageBirth`, `notePageMove`, `notePageDeath` and `reconcilePages` are hooked to the new live ownership registry. `pageActors(key)` and `pageOwner(animal)` are the forward-facing page-specific APIs. Existing gameplay iteration, original causal ordering, lifespan, reproduction, ecology and RNG remain untouched. This avoids a costly all-creature scan on every query to a specific indexed page.

A daily census is currently the fallback for movement code that bypasses explicit page crossing hooks; independent page scheduling must not yet treat this index as an atomic movement transaction until every mover is integrated.

## Verification and limitations

`tests/page-fauna-owners.mjs` checks actual player seam crossing, source removal/destination object identity, single transfer receipt, no duplicated genes, spawn, death, off-map recovery, camera view eviction, rebuild from full simulation save, original RNG and exact continued reproduction/ecology equality, and duplicate-ID fail-closed behavior. CI checks earlier D0-D3 contracts and complete save-state parity versus the pinned D3 parent without excluding *any* fields. The original 500 ms 4× performance gate remains unchanged.

Not delivered here: separately serializable/discardable actor ownership pages, page-local autonomous AI, independent world-cell or genetic registries, unloaded parallel workers, cross-continent transfer checkpoints, partial-crash rollback, or larger continents. Those require canonical ownership migration and per-page durable checkpoints. `Simulation.animals` is still the one global authoritative actor collection and all ecologies still run in the current world.
