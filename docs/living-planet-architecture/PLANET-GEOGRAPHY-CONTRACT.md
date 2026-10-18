# Planet geography contract for the next review

October 17, 2026. APPROVED for the bounded B0 pass on the current map; not runtime configuration or authorization to enlarge the map. Numeric descriptor: planet-geography-contract.json. This tightens the approved overall architecture and preserves the full A-H scope.

## Distinct scales and an explicit candidate

World owns a saved planet descriptor and regional page store. The macro generator builds geography before any biome or organism placement. Detailed terrain refines a small region of that geography; a local map never defines the planet's latitude range or required biome inventory.

Candidate scale for review: equatorial circumference1,048,576 existing terrain tile units; immutable coarse raster512 x256; detailed pages64 x64. The initial detailed extent remains128 x128. A later256 x256 region is only1/4096 of the equatorial circumference; it is a local region, not a compressed continent or miniature planet. This supersedes any reading of the earlier phrase '256x256 continental slice' as containing every major climatic zone.

The scale is an explicit design candidate, not measured physical calibration. It does not equate tiles to metres or the world to Earth. Any future conversion to physical units must reconcile organism size, movement, development and weather time without silently changing their saved meaning. This proposal neither adds time acceleration to travel nor imposes a required traversal duration.

Save planetId, planetSeed, geographyVersion, circumferenceTiles, coarseDimensions, coordinateUnits, localProjectionVersion and anchor latitude/longitude. None derives from current loaded extent, viewport, density, player location or cache state. Changes create a new generator contract rather than remapping an old save under its organisms.

## Coordinate mapping and projection boundary

For the first bounded regional implementation, retain existing signed global tile coordinates and continuous organism positions. Local surface distance is one existing tile unit. At saved anchor latitude phi0 and longitude lambda0, map x/y tile offsets through:

- phi = phi0 - 2*pi*y/circumferenceTiles
- lambda = lambda0 + 2*pi*x/(circumferenceTiles*cos(phi0))
- coarse u = (lambda+pi)/(2*pi)*macroWidth
- coarse v = (pi/2-phi)/pi*macroHeight

This is a versioned regional equirectangular approximation. Its supported latitude/distortion range must be specified and checked before enabling new anchors; do not clamp invalid samples into a polar tile. The initial example anchor is35 degrees north. Longitude may be canonicalized for macro sampling, but organism travel does not gain a wrap/teleport seam until movement, distance, weather, migration and save tests pass. Global spherical travel and polar transitions remain a later reviewed coordinate extension.

Page coordinates continue floor division by64, including negatives. Samples depend on immutable planet parameters and global coordinates. They must not use page-local coordinates as latitude or reseed when a page loads. Refinement noise is keyed by world coordinates, generator version and field, with the same neighbor halo on either side of a seam. Floating-point coordinates and rounding rules are versioned; deterministic does not mean promising cross-engine bit equality without verification.

## Geography ownership and generation order

1. Generate macro elevation/ridges, sea level, bathymetry and continental land components over the planet domain. Candidate raster size is a resolution parameter, not a request to simulate every coarse cell as an individual ecosystem.
2. Derive basin/watershed IDs, outflow edges and accumulated flow from the same topography. Closed basins remain closed; lake outlets and river connections are graph facts, not separately painted local rivers.
3. Derive substrate, initial retention and climate inputs: latitude, altitude, broad wind exposure, ocean influence and rain-shadow context. Biome names describe resulting conditions. No requirement places tundra, desert and tropical forest in one regional window.
4. Refine local elevation and hydrological paths. A shared boundary crossing has one canonical ID/position and one flux owner. Local noise cannot disconnect a prescribed river outlet or create conflicting sea levels at neighboring page edges.
5. Initialize finite local stocks through the existing water/soil/producer authorities. Later changes are transactions in World. Macro immutable geography is not a second owner of live water or food.

World owns both descriptor and page access; Simulation owns transitions, entities and event ordering. Renderer owns views/caches only. Existing water/weather/soil, reproduction and ancestry authorities remain shared. Birth/event identity must be independent of page visit order. No offscreen organism is deleted or respawned to fit a cache.

## Reservoirs, offscreen persistence and saves

A coarse ocean or catchment map does not itself account for water/salt. Every refined-domain boundary must identify an explicit external reservoir, counted inflow/outflow and salt concentration. Internal page transfers use equal/opposite receipts and a unique edge owner. Weather forcing cannot double count rainfall in macro and local ledgers. Reject incoherent masks/depth/salt as in A0; never repair a corrupt saved state by silently painting a new coastline.

Unviewed existing organisms, plants/cohorts, eggs, resources, ancestry and pending interactions persist. Macro geography alone does not prove global populated ecology. The first implementation must honestly distinguish generated land from simulated/persisted life. Do not invent a new population on each visit or claim a full living planet from an empty geographical descriptor.

Historical freshwater/1 and coastal/1 saves keep their existing generator and finite fields with no geographic reinterpretation. New planetary worlds require an explicit generator descriptor. Save layout, flux owner revisions and rules version; unknown versions fail clearly. A separately reviewed migration may attach historical regions later, preserving physical state and recorded provenance, but it is not part of this initial contract.

## Ordered implementation and acceptance gates

B0, proposed next: implement and validate the immutable descriptor/macro generator and current128-region sampling behind explicit new-world selection. Keep the default/current legacy saves intact until inspection. Compare differently ordered region requests and seams; prove identical generated values, watershed crossings and persisted descriptor. The creator subsequently approved this B0 boundary in NEXT-REVIEW-CHECKPOINT.md; implementation may proceed at current extent.

B1, after B0 evidence: route current-sized terrain and hydrology through canonical page/refinement access; verify negative coordinates, seam transactions, water/salt budgets, organism movement and exact save continuation. Inspect actual runtime geography and ordinary player traversal. Reuse existing renderer; no replacement art system.

B2/D scale expansion, separate review: only after current-size correctness and measured mature workload. Profile actual actor/cohort counts, per-phase time, frame p50/p95/max, queued simulation time, memory and startup preparation on declared hardware. Compare equal biological time and disclose fresh, mature and synthetic fixtures separately. No raised performance ceiling, population clipping, time-skipped biology or forced survivorship. A256-region candidate is not a promise it will fit or satisfy planetary ecology.

Current evidence is narrower: the earlier fresh-world browser sample has181 actors, p50 13.3ms, p95 13.5ms and max80ms over2.506seconds. The forced-backlog fixture verifies ordered recovery, not capacity at continental scale. The actual webbing lineage survives/reproduces through day77 in a small controlled founding scenario; it is not a mature diverse-world performance benchmark. These measurements cannot authorize bigger biology by extrapolation.

October30 remains the visible feature freeze. Unfinished geography, tissue physics, neutral inheritance or player experience must remain marked incomplete rather than redefined or scripted into acceptance. No commit, push or release is included in this review request.
