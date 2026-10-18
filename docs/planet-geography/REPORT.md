# B0: opt-in planetary geography at current extent

October 17, 2026. Implements the creator-approved B0 pass. The live biological world remains 128 x 128 tiles. This is geography foundation evidence, not acceptance of a populated living planet or enlarged simulation.

## Implemented

- One saved, versioned immutable planetary descriptor uses 1,048,576 existing terrain tile units around the equator, a 512 x 256 macro raster and 64-tile page coordinates. It makes no metres/Earth-size claim. The local projection has explicit bounds; unsupported polar or distant requests reject.
- Seeded spherical macro elevation, latitude-dependent temperature, rainfall, substrate, descending drainage and watershed IDs precede detailed terrain. Static regional samples and shared river boundaries depend on global coordinates rather than visit order. A generated inland river edge determines the starting region, without selecting organism outcomes.
- The existing World arrays, water/salt environment, producers, weather and soil-water systems own live state. The atlas is initial geology only. It never refreshes depleted stocks. This preview has closed local boundaries and no invented external reservoir supply; dynamic cross-region flux remains B1/D work.
- New World offers an explicit planetary river preview. Established local geography remains the default. Historical local/coastal saves retain their original generator. Planet saves require their exact supported descriptor; missing, altered or conflicting descriptors reject. Saved live water masks/depth/salt remain authoritative.
- Restart preserves the chosen generator. Renderer and organism rules are shared with established local worlds.

## Verification

`tests/planet-geography.mjs` passes: all 131,072 macro cells have consistent descending drainage and watershed identity; region request order, negative coordinates and shared page boundary descriptions agree; unsupported requests/descriptors reject; the current World has finite valid fields; page view eviction does not change biological state; complete save restoration and 60 ordinary updates match exactly. Historical legacy roundtrip remains covered.

Focused world-generators, surface-topology, surface-water-persistence, save-persistence, regional-environment, menu-task-usability and world-swap-render checks pass. The broader fast receipt is pending at the time of this entry; see the appended final receipt below when available. No major 100-day trial was run for this pass.

`tools/capture-planet-geography.cjs` uses a new nonpersistent headed Chromium context, normal New World selection, ordinary keyboard travel and explicit save/Continue. No user browser profile or autosave is opened; no animal is relocated or genetically edited. The resulting `runtime/evidence.json` records the exact descriptor, 188 actors, player 109 moving approximately 3.41 tiles, preserved identity/position after Continue and no browser page errors. New World choice, resumed gameplay and the diagnostic macro atlas were visually inspected. The dark area beyond the bounded map is visible in the resumed frame; no wider travel is claimed.

Soil-water state is lazily initialized by the existing first daily update. The browser start was day 1 and resumed into day 2; the presence of this state changed normally, not because a setting was altered. The capture now labels this diagnostic `soilWaterStateInitialized`.

An initial browser capture failed on Continue because a geography validation line had been inserted into the load callback rather than the create callback. It was moved to the correct callback. Failed screenshots and receipt are preserved in `first-capture-failure/`; the corrected full path passes. Do not count the failed attempt as a successful run.

## Remaining limits

The coarse atlas visibly retains raster/polar drainage artifacts and is a diagnostic, not final terrain art or hydrology. The tiny current region can reasonably contain one nearly straight river reach; it does not compress the planet's biome range into 128 tiles. Coastal oceans, local channel carving against terrain, global reservoir transactions, persistent populated regions outside this map, mature performance, world expansion and full biome ecology remain unfinished. B0 does not authorize those expansions.

Neutral inheritance and independent supported water anatomy are documented separately in the living-planet architecture reports. The current-policy swimmer's normal growth and later descendants still need their own evidence; historical lineage receipts cannot substitute for that. Tissue-derived costs and major developmental routes remain incomplete. Autonomous and player-guided 100-day trials remain separate evaluations under the same biology. October 30 remains the feature freeze. No commit, push or release was performed.
## Completed B0 fast validation receipt

`docs/test-runs/planet-b0-fast-2026-10-17.json`: 395 pass, five known failures, zero new failures, zero timeouts, zero stale ledger entries and 12 deferred long suites of 412, in 119 seconds. Validation source/configuration fingerprints match (`bb94b3c628afe3d71aeaef72ecf2607f909695fe85d88c1c2b7495854194a037`), inputDrift=false. The five known failures remain ai-disclosure, canonical-source, evolution-contract, player-copy-style and provenance; this is not an all-green release gate. Observer-play passes at 401 ms against its unchanged 500 ms ceiling for its declared 560-animal fixture. Prior 518 ms overrun remains preserved; this result does not prove mature planetary capacity. No source edits occurred during the run.

This receipt supersedes the pending-fast-gate wording above. The two approved bounded implementation passes have current evidence. Full A-H completion, larger worlds, global living ecology and new anatomical routes are not claimed. See `docs/planet-geography/REPORT.md` and the neutral/water reports for exact scope.

## Multi-seed current-size continuity check

`tools/check-planet-seed-continuity.mjs` completed eight declared seeds B0-CONTINUITY-000 through007. More than four different macro worlds were generated and revisited in reverse order, exercising shared-cache eviction. Descriptors, negative/remote static samples, page boundary descriptions and detailed region hashes remained identical. Each actual128-tile simulation and its restored copy completed64 ordinary updates through the first daily boundary with exact complete-state equality; environment validation and ecological identity/resource accounting passed. Initial populations181-185, water tiles512-656. Three deaths across two seeds were retained and reconciled; no survival target or resource rescue was used.

Receipt: `docs/planet-geography/seed-continuity.json` relative to repository root, including source hashes and each seed's outputs. This is short continuity/finite-state evidence, not a100-day ecosystem outcome, mature performance, bigger-world approval or global water exchange. No product source or biological rule changed. The optional-organ loss implementation review remains pending; no new route was activated.
