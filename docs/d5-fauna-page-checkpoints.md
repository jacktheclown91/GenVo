# D5: Page-addressed, fail-closed canonical fauna checkpoints

D5 adds a **separate, explicitly invoked save packaging API**. It is a transitional storage format built from **actual** canonical GenVo creature state. The existing `save-manager.js` save slots, schema 10, `Simulation.animals`, real world resources, parentage, AI and evolution laws remain unchanged.

## What is implemented

`createFaunaPageCheckpoint(sim, options)` captures a coherent, detached `structuredClone` of the normal canonical save. Its `header` contains the normal world/controller/tick/RNG state **without** a second `animals` array. The organism records are partitioned by their true 64-tile world coordinates into `pages: Map<pageKey, actorRecords[]>`, with explicit `outside` for living scripted actors beyond current boundaries and `retired` for dead actor records still present in the canonical array. No organisms are fabricated or culled.

The `slots` manifest preserves the **exact canonical `Simulation.animals` index order**, including dead actors. This is essential: lifecycle, courtship and predation use the original sequence and RNG draws must remain invariant. Page map insertion order is deliberately not used to restore gameplay order.

`validateFaunaPageCheckpoint` checks save schema/world size/page geometry, unique positive actor IDs and manifest slots, exact one-to-one records across pages, valid physical coordinates for each stored owner, no aliased duplicates or missing pages, and exclusion of a duplicate actor array from the header. Validation fails before the normal full-world restore begins. `restoreFaunaPageCheckpoint` clones input, reconstructs the actor array in manifest order, then invokes the **existing** authoritative `restoreSimulationSnapshot` to rebuild the full World and all controllers, genetics, player selection and resources. Restored runtime D4 page indexes are derived from those canonical actor objects, never independently authoritative.

`pageCheckpointActors(archive,pageKey)` returns detached page records without starting any offscreen creature simulation or changing the archive. This enables page-addressed inspection and eventual storage-layer partitioning.

## Proof and acceptance

`tests/fauna-page-checkpoint.mjs` covers real crossing, dead and off-map actor slots, no duplicate actor arrays, real world and controller parity against regular save format, exact continuation over 90 ticks, and rejection of missing/duplicate/misowned/unmanifested records. The GitHub CI workflow also runs D0–D4 conservation/save tests, pinned D4-vs-D5 full-state SHA-256 parity, and the unchanged full fast suite.

## Important limitations

D5 is a **portable complete-world archive with page-addressed actor records**, not yet a partially independent playable region. Restoring requires *all* pages, and resource fields (plants, water, soil, climate, weather, carrion, seed bank), global controller state, and inter-creature relationships are still shared across the whole world. The archive does not migrate the live actor state authority out of `Simulation.animals`, implement transactions across separate storage records, add write-ahead logs or crash recovery, provide autonomous loaded/unloaded fauna updates, or enlarge the map to continents. No direct IndexedDB save UI integration is claimed. The archive uses structural validation, **not a cryptographic authenticity signature**, and should not be treated as tamper-proof.

The existing observer-play 4× acceptance budget remains at 500ms. That known CI performance blocker is not changed or suppressed by this work. No release or main merge until full validation and real-browser gameplay review.
