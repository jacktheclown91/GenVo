# Living Planet environmental expansion | implementation contract

Status: implementation map, not feature-complete or acceptance evidence.
Baseline: October 19, 2026, codex/repository-consolidation. Inspect current source and Git status before each implementation batch.

## Intended result
Continental geography, finite oceans/rivers/groundwater, moving weather, climate, and inherited plant diversity must jointly generate habitats and evolutionary pressures. Neither biome labels nor artwork determine ecological rules. All resources and organisms have one live owner. A region is a high-detail window on a larger geography, not an isolated miniature world containing all habitats.

## Current authorities and integration boundaries
| Mechanism | Existing canonical source | Implementation constraint |
| --- | --- | --- |
| Planetary macrogeography | src/world/planet-geography.js | Stable global coordinates and generator version; no seamless all-planet simulation claim |
| Regional terrain and substrate | src/world/planet-world.js; src/world/topography.js; src/world/world.js | Terrain mutations owned by World; keep old save topology |
| Dynamic surface water, runoff, salt | src/world/environment.js; src/world/planetary-runoff.js; src/world/planetary-internal-water.js | Conserve paired transfers and declared external inputs; do not reset salinity |
| Region borders and travel | src/world/planet-regions.js; src/world/planetary-travel.js | A border is shared physical space, not a second ocean or duplicated organisms |
| Remote time and biology | src/world/planetary-offscreen-biology.js; src/world/planetary-offscreen-environment.js | Use one canonical clock schedule, exact historical saves and deterministic continuation |
| Weather and regional rainfall | src/ecology/weather.js; src/world/weather-fronts.js; src/world/environment.js | Weather moves across world coordinates, never seeded independently per camera view |
| Soil and organic resources | src/ecology/soil-water.js; src/ecology/plant-resources.js; src/ecology/organic-resource-cycle.js | Plant growth and decay debit/credit finite stocks |
| Plants and inheritance | Existing flora and seed authorities under src/ecology and src/organisms | New form/trait registries must not introduce parallel reproduction or invented seed biomass |
| Persistence and migration | src/persistence/save-manager.js | New rules require explicit versions; absence of a version preserves historical semantics |
| Presentation | src/render and src/ui | Visuals consume live state; do not infer ecological state from decorative biome labels |

## Batch 1: authority and compatibility gate
- [x] Locate existing macrogeography, terrain, climate, water, soil and remote-region owners.
- [x] Record shared integration boundaries in this document.
- [ ] Enumerate all live plant reproduction and genetics entrypoints; identify duplicate or obsolete handlers before adding parts.
- [ ] Trace the full daily water/soil/plant ordering, including remote canonical days.
- [ ] Record measured hot-path budgets and serialize/restore coverage for new environmental fields.
- [ ] Add source-graph/audit checks against duplicate runtime authorities where possible.

## Batch 2: terrain
- [ ] Extend continent-scale elevation, lithology and substrate with stable world coordinates and historical generator compatibility.
- [ ] Make slope and ground material influence erosion, infiltration, movement and vegetation.
- [ ] Derive river courses, catchments and wetland locations from real drainage with boundary continuity.
- [ ] Fund deposited sediments and changed terrain explicitly; separate geological timescales from daily processes.
- [ ] Keep local region size at currently supported 128x128 until profiling justifies changes.

## Batch 3: connected water
- [ ] Specify ocean reservoir ownership: immutable unvisited geography versus mutable visited/archived neighboring stocks. Do not apply both at one border.
- [ ] Build deterministic same-day freshwater/salt transfers across visited region seams, with exactly paired debit/credit and serialized pending handoffs.
- [ ] Apply finite ocean boundary exchange only where external unsimulated water is declared; remove boundary-mode ambiguity in a new version rather than reinterpreting old snapshots.
- [ ] Connect soil runoff, river outflow, groundwater and saltwater mixing without fabricated water or double-counted nutrients.
- [ ] Verify coast, estuary, lake, closed basin and adjacent-region cases, including replay and save/restore.

## Batch 4: weather
- [ ] Introduce globally located wind/pressure/moisture fronts at a coarser atmospheric resolution than terrain, deterministically sampled by local regions.
- [ ] Route rainfall, snow, evaporation, cloud shade and temperature through the existing climate/soil/water authorities.
- [ ] Derive drought, flood, hail, storm, fog and wind exposure from actual conditions and bounded events, not biomes or scripted recovery.
- [ ] Apply physiological, plant and movement consequences through existing shared capabilities.

## Batch 5: long-term climate and habitats
- [ ] Combine latitude, elevation, seasonal insolation, windward/rain shadow, water proximity, soil and snowpack.
- [ ] Use history of physical conditions for habitat descriptors; never hard-swap species or water stocks when names change.
- [ ] Preserve year-to-year and cross-region history at an explicit storage budget.

## Batches 6-7: plant form and evolution
- [ ] Inventory existing tissue, propagule, sexual/clonal and genetic traits before adding forms.
- [ ] Expand functional structures: root systems, stems, leaves, flowers, spores, fruits, woody and protective tissue, storage and aquatic structures.
- [ ] Every structure requires mass/water/mineral/energy costs and a feeding, growth, dispersal or habitat consequence.
- [ ] Preserve ancestry and heritable mutation/recombination, selfing and compatibility rules; habitats select among variation without granting useful mutations.
- [ ] Add succession, canopy shade, decomposition, pollination, dispersal and aquatic producer interactions through canonical resource ledgers.

## Batch 8: integrated playability
- [ ] Readable top-down weather/terrain/plant art derived from actual live state.
- [ ] Accessible mouse-first investigation of plant form, habitat history and weather consequences.
- [ ] Player and wildlife use identical biological action costs; control and navigation respect elevation, water and abilities.
- [ ] Save/load, border travel and browser responsiveness are acceptance gates. Heavy multi-region and 100-day trials happen at integration milestones, not every small feature commit.

## Non-negotiable verification
1. Targeted deterministic mechanism test, at least one failure-path and an actual resource ledger assertion.
2. Historical missing-policy save continues under old rules unless explicitly migrated.
3. Save/restore plus regional exit/reentry and remote-day continuation preserve identical resulting state.
4. No silent clipping of populations, seed cohorts, births or distant biological clocks to meet performance.
5. Human playability, ecological balance and art acceptance are separately evaluated and never claimed from focused unit tests.
