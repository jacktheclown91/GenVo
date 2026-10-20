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
- [x] Identify live clonal release in dispersal.js and sexual release in botanical-reproduction.js; both now use one optional wind-direction authority, with their shared deposited seed-bank/genome state unchanged. Broader legacy/duplicate audit remains.
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
- [x] Specify and implement versioned external-versus-paired ownership at known synchronized wet region seams; unsimulated surroundings still use the geographic reservoir.
- [ ] Build deterministic same-day freshwater/salt transfers across visited region seams, with exactly paired debit/credit and serialized pending handoffs.
- [ ] Apply finite ocean boundary exchange only where external unsimulated water is declared; remove boundary-mode ambiguity in a new version rather than reinterpreting old snapshots.
- [ ] Extend newly implemented paired dry-terrain runoff across known synchronized regions to sediment, groundwater and nutrient transport. Local runoff and cross-region wet/wet saltwater already have canonical ledger owners.
- [ ] Verify coast, estuary, lake, closed basin and adjacent-region cases, including replay and save/restore.

## Wind-to-flora integration checkpoint (October 19, 2026)
- New planetary regions record `dispersal.windSeedPolicy = planetary-wind/1`; historical saves lacking this controller field remain on legacy directions.
- The existing moving rainfall front now also yields a deterministic global-coordinate wind vector in `src/world/weather-fronts.js`. No second weather RNG or saved atmosphere was added.
- Wind selects direction for local clonal seed release and sexual embryo seed release in the existing dispersal controllers. Finite standing plant tissue, seed reserves, existing genome cohorts, deposition limits and invalid wet landing checks remain canonical.
- Unassisted local releases follow wind. Fruit/animal-compatible kinds still use their old local release directions for most pulses; animal gut transport is unchanged.
- `src/world/planetary-travel.js` carries the policy to both first-entry and restored regions so old saves do not change when exploring.
- Focused test assertions were added to `tests/dispersal.mjs`, `tests/weather-front-biomes.mjs`, and `tests/e15-planetary-travel.mjs`.
- **Verification status:** GitHub commits confirmed; the new targeted tests and browser playability have not yet been run here. The patch does not implement cross-region seed transport, global wind pressure circulation or ocean exchange.
- The wind field is an initial front-correlated model, not final atmospheric physics. Its ecology and visual readability require creator playtests and later weather integration.

## Weather-driven botanical pollination (October 19, 2026)
- `src/ecology/botanical-reproduction.js` now moves already-funded pollen one neighboring terrestrial cell downwind before same-flower self-pollination. Wind chooses direction, not viable mutations or fertilization success.
- Only a real, already-funded receptive flower can receive transported pollen. The existing `deliverBotanicalPollen` performs inherited receptor recognition, self-incompatibility, ovule investment, embryo generation, receipt generation and nonviable pollen/litter transfers. No new resource controller or special plant identity gate is introduced.
- Wind dispersal remains restricted to new planetary worlds with the explicit `planetary-wind/1` dispersal policy. Legacy saves lacking the policy keep previous self/animal-contact reproduction. A planetary-only wind policy on nonplanetary terrain is rejected during controller upgrade.
- `tests/planetary-wind-pollination.mjs` covers naturally funded neighboring pollen, one-packet transfer, conserved botanical mass including litter, recorded wind delivery and a missing-policy opt-out. Existing `tests/dispersal.mjs` covers invalid terrain/policy mismatch.
- **Verification:** isolated wind-dispatch smoke test and syntax parsing passed; full real-simulation Node suite and Chromium evidence are pending. No regional cross-border pollen transport, long-distance airborne dispersal, climate-dependent pollination physiology or browser visual feedback is claimed.

## Open-water boundary implementation checkpoint (October 19, 2026)
- New planetary worlds have `environment.boundaryWaterPolicy = geography-reservoir-water/1` while retaining schema 6 topology and physical water arrays. Historical snapshots lacking this policy keep the original salt-only boundary exchange, including after restore and remote replay.
- `src/world/planetary-boundary-water.js` owns finite **equal-volume** replacement at geography-declared wet region edges. Ocean/freshwater/mixed borders import water at their declared salinity and export the same water volume at the cell's current salinity. External salt inputs, salt outputs, water inputs and water outputs are separately accounted. There is no silent salinity reset, extra local volume or population rescue.
- `src/world/environment.js` includes water fluxes in day-local physical ledgers; policy, cumulative totals and last-day boundary receipts have rejection checks for invalid/corrupt snapshots. The core 128x128 World region remains the sole live array owner.
- `tests/planetary-boundary-water.mjs` and `tests/planetary-boundary-exchange.mjs` cover reservoir replacement, water/salt conservation, corruption rejection, real coastal simulation and historical fallback. An isolated numerical/syntax smoke passed, but native Node/Chromium integration tests have not been run here.
- **Limit:** this is a declared outside-geography reservoir and not yet a shared dynamically changing global ocean. Existing same-day `src/world/planetary-seam-salt.js` already pairs water and salt transfers for synchronized visited neighboring regions, but the new open-reservoir exchange does not yet exclude those loaded neighbors. A future version must arbitrate **one** boundary authority per edge before claiming continuous multi-region ocean circulation; do not silently reinterpret this policy in existing saves.

## Paired ocean and freshwater seam ownership (October 19, 2026)
- New worlds now use `geography-reservoir-water/2` with a per-region, saved directional `blockedBoundaries` mask. The initial mask is empty until a physically wet neighboring region becomes part of the synchronized archive set. Historical `geography-reservoir-water/1` and missing-policy saves retain their prior behavior.
- On planetary travel, `syncPlanetaryBoundaryOwnership` pairs real wet-to-wet border cells from the active World with independently archived World snapshots. It publishes the archived boundary masks copy-on-write, so a completed crossing does not mutate the caller's previous snapshots. Only synchronized, canonical-tick archived regions are eligible. No animal, seed or resource stock is duplicated.
- During local daily physical updates, blocked edge directions no longer import/export external-reservoir water or salt. Later, the existing paired-seam simulation transfers bounded water volume and dissolved salt directly between the two actual regional inventories, with reciprocal receipts.
- Corner water cells use directional ownership rather than shutting off the whole cell. When a corner has both paired and unpaired wet sides, the open sides alone supply replacement water at their sampled geographic salinity and a proportional per-edge rate.
- Water-only (zero-dissolved-salt) paired flux is retained as a valid seam receipt. Freshwater transport must not be omitted merely because no salt moved.
- Targeted regression coverage: `tests/planetary-water-seam-ownership.mjs`, `tests/planetary-boundary-water.mjs`, `tests/planetary-paired-seam-salt.mjs`, and `tests/planetary-boundary-exchange.mjs`.
- **Verification:** JavaScript parsing and isolated ownership/finite-exchange checks are available; full Node tests, offscreen replay, browser frame performance, and long-lived ocean ecology remain unverified. The connected ocean applies only to registered synchronized regions, not a globally conserved mutable ocean covering the entire planet. External unvisited seas are still declared geographic reservoirs. River runoff across previously unvisited dry boundaries remains future work.

## Cross-region river runoff implementation (October 19, 2026)
- `src/world/planetary-seam-runoff.js` implements the versioned `paired-overland-runoff/1` policy. New planetary Worlds opt in; archived Worlds without the policy keep their historical boundary isolation. It adds no second daily water clock, new water inventory, or unloaded-world outflow.
- At an independently owned, synchronized 128-tile region seam, dry land cells with **existing** `environment.overland` stocks can send bounded runoff downhill to actual adjacent dry terrain or an existing wet channel. The proposal reads terrain elevation, donor store, receiving water head, finite donor fraction and channel capacity. Uphill routes, nonexistent neighbors, incompatible historical policy and unsupported wet-to-dry flooding do not generate water.
- `src/world/planetary-seam-salt.js` commits this runoff alongside already supported paired ocean water and salt in the **same** tick-synchronized atomic receipt. A donor's overland stock decreases exactly as the destination's overland or channel volume increases. The ledger records direction-specific `runoffAToB/runoffBToA`, included in the reciprocal water totals. Separate cumulative `seamRunoffInput/Output` are observational, never additional physical resource stores.
- Historical saved environments with no policy preserve their original runoff behavior. Invalid policy/receipt values and overdrawn or nonfinite border stocks are rejected.
- `tests/planetary-seam-runoff.mjs` covers dry-to-dry, dry-to-wet capacity, both directions, uphill and absent-neighbor rejection, conservation, ledger forgery, malformed-stock safety, and new/legacy save continuity.
- **Verification:** source syntax and direct isolated execution of the committed seam transaction passed for dry/dry and dry/wet flows, historical policy opt-out, uphill refusal and malformed-source refusal. Native Node/Chromium integration tests are not yet run. Sediment and nutrients are not yet transferred, flooded dry-to-wet topology changes remain local, and this is not hydrology across unsimulated continents.

## Synchronized land groundwater exchange (October 19, 2026)
- New planetary `World.environment.groundwaterSeamEligibility` explicitly permits `paired-land-groundwater/1` when its soil-water controller is first initialized. The operative policy remains stored in the **canonical** `soilWater` state. Existing saves with no soil policy stay on closed regional groundwater borders. Worlds with no soil controller AND no new-world eligibility marker cannot silently acquire the new rule when soil water is reconstructed.
- The new `src/world/planetary-seam-groundwater.js` stages finite lateral flow **between two real land cells** at an adjacent synchronized regional seam, driven by hydraulic head (`terrain.elevation + groundwater`). Donor groundwater provides the water; recipient capacity and the existing lateral exchange coefficient limit flux. It does not invent water from unsimulated neighbors or turn soil water into ocean surface volume.
- The existing `reconcilePlanetarySaltSeams` transaction retains groundwater-only receipts, publishes both groundwater stores, updates **soil-water** daily input/output/storage balances and cumulative paired groundwater totals, and leaves surface-water receipts unchanged. Float32 inventory rounding is audited, not disguised as a new external source.
- Saved `groundwaterAToB/groundwaterBToA` ledger fields identify the direction, fail on invalid values, and remain distinct from `waterAToB/waterBToA` (surface flows). Soil daily receipts are checked for paired input/output compatibility.
- `tests/planetary-seam-groundwater.mjs` exercises head-driven flows in both directions, a dry donor, wet cells, missing neighbors, legacy rule opt-out, malformed donor rejection, groundwater-only ledger entries, and snapshot policy continuity.
- **Verification:** isolated JavaScript execution of the committed paired transaction and syntax parsing passed in both directions with conservation within Float32 tolerance, historical opt-out and dry-source refusal. The complete native Node suite, browser performance and multi-region saved biology replay remain unexecuted.
- Future extensions: feed groundwater into physically funded springs and wetlands; boundary lithology and permeability; geological aquifer layers; transported dissolved nutrients; long-term climate effects.

## Funded groundwater springs and emergent wetlands (October 19, 2026)
- **Gameplay implementation:** `src/world/groundwater-springs.js` adds deterministic spring outlets on real, warm, sufficiently saturated downhill terrain. Each day's discharge is capped per cell and across the active region, and is withdrawn from the canonical Float32 `soilWater.groundwater` stock using its **actual rounded debit** before the same quantity is passed into `environment.overland` via `routePlanetaryRunoff`. Rainfall, snowmelt, soil overflow, and springs thus share one surface-flow inventory and its existing topographic routing, channel delivery, and funded inundation authority.
- **Conditions and seasons:** Groundwater threshold, present soil moisture, positive downstream drainage, temperature and snowpack govern where springs can flow; insufficient groundwater, freezing weather or a missing outlet means no spring. Rotation of candidate scanning by deterministic day avoids favoring one map corner, with no new creature RNG.
- **Water budgets:** `soilWater.totals.springDischarge` is a recorded output from the soil budget; `soilWater.lastDay.springDischarge` is included in the existing daily closure. The runoff handoff records that identical quantity as incoming physical overland water. No hidden water stock is created; normal runoff/flood receipts still own wet-cell creation.
- **Ecological effect:** `src/world/biomes.js` may classify a site as wetland when existing soil moisture, actual high groundwater and accumulated overland water justify it, *without* plant identity gates, geographic hardcoded wetlands or automatic biodiversity. As the water disperses or seasons change, the label can revert.
- **Legacy semantics:** New planetary environment state carries `springEligibility = funded-groundwater-springs/1`, which authorizes new `soilWater.springPolicy` on the **first** soil initialization. Old snapshots without eligibility remain on their old soil behavior even if their soil controller must be initialized later. Unsupported saved policies and forged spring expenditure receipts are rejected.
- **Focused checks:** `tests/planetary-groundwater-springs.mjs` covers a funded outlet, freezing/no-outlet refusal, dynamic wetland state, the normal physical soil/runoff day, and round-trip/forged saves. An isolated smoke of the committed daily soil transfer showed ~0.022 spring water debited from groundwater and credited to runoff, with a Float32 soil closure of ~2.45e-7. Full native test suite and browser playtesting remain **unexecuted**.
- **Limits:** Springs are terrain/water-table outlets, not yet persistent multi-layer artesian aquifers or groundwater chemistry. Plant adaptation to spring moisture, sediment and nutrient transport, and regional flood feedback remain future work.

## Conserved riverborne mineral nutrients (October 19, 2026)
- New planetary regions opt into `conserved-runoff-minerals/1`. `src/world/planetary-mineral-runoff.js` is a **transport law only**, not a new resource controller or mineral inventory. The existing Float64 `plantResources.minerals` (consumed by land and aquatic plant growth) remains the sole owner of the nutrient stock.
- **Local physical effect:** when finite `environment.overland` moves along the steepest-downhill drainage graph into other dry land or existing lakes/rivers, a capped fraction of the actual donor's mineral reserves is debited and credited to the receiving cell. Mineral movement requires **actual water flow** and shares the established runoff transaction, rather than merely incrementing regional fertility from rain or a biome label. Delivery to water increases the nutrients existing aquatic producers can subsequently use.
- **Regional effect:** `src/world/planetary-seam-runoff.js` stages equivalent mineral movement with the previously added synchronized land-to-land / land-to-water border runoff. `src/world/planetary-seam-salt.js` publishes these mineral deltas along with water, salt and groundwater transfers in its reciprocal transaction. Regional `seamMineralsInput/seamMineralsOutput` receipts and `mineralsAToB/mineralsBToA` seam fields are observational and do not create independent mass stores. Forged mineral movement with no corresponding runoff is rejected before publication.
- **Conservation, legacy and controls:** cumulative `runoffMineralsMoved` is bounded by real donor reserves and a per-flow mobile fraction. No external region receives mineral stock when no known, synchronized neighboring World exists. Saved older environments missing this policy preserve their original mineral locations; invalid policies and nonfinite donor mass fail validation. Physical soil fertility ratings remain independent slowly varying environmental indices; transport moves usable *minerals*, not an invented geological elevation field or a separately simulated sediment deposit.
- **Focused tests:** `tests/planetary-mineral-runoff.mjs` covers local downstream and receiving-water fertilization, cross-region dry/dry and dry/wet transports, stock conservation, refusal without runoff, historical-rule opt-out, invalid donor stock, and forged seam receipts. Direct isolated execution of the committed transfer functions demonstrated exact mineral closure and unchanged water closure for both local and paired channels. The native Node suite, browser rendering and full ecosystem balance have **not been run**.
- **Remaining:** multi-step river silt accumulation, topographic erosion, floodplain fertility history, groundwater mineral chemistry, watershed-wide sediment budgets and effects on long-term plant species divergence.

## Conserved terrain erosion and floodplain sediment (October 19, 2026)
- **New gameplay system:** `src/world/terrain-sediment.js` implements `conserved-runoff-sediment/1` for newly generated planetary regions. The existing mutable Float32 `terrain.elevation` is the only terrain-material stock: real downhill surface water removes a tightly bounded quantity of elevation from an upstream dry cell and credits that same height to a lower, dry receiving cell. Erosion is capped by real water moved, existing height, slope and recipient capacity. It is not a decorative particle/terrain effect or a second fictional sediment reservoir.
- **Terrain interaction:** local `routePlanetaryRunoff` stages erosion alongside water/mineral routing and publishes height only after conservation checks. It re-derives `terrain.downstream` and `terrain.slope` from the changed elevations so future flows, local travel difficulty, groundwater head and alpine biome classification can respond to the evolved landscape.
- **Regional interaction:** synchronized wetland/river runoff can move conserved land sediment across actual land-to-land regional seams. The existing `reconcilePlanetarySaltSeams` transaction stages opposite height deltas, verifies no loss or source overflow, and records `sedimentAToB/sedimentBToA` with corresponding `seamSedimentInput/Output`. Active drainage graphs rebuild; dormant regions' changed `terrain.elevation` remains in their independent saved World snapshots and re-derives on restoration.
- **Save/history governance:** new worlds opt in through explicit `environment.terrainSedimentPolicy`. Historical saves without the rule retain their prior elevations; unsupported policies, invalid height deltas and forged sediment receipts without runoff are rejected. Precision-tolerant conservation respects Float32 elevation rounding.
- **Scope limit:** fixed water masks and water depth are not silently changed by deposited sediment. This first terrain-morphology pass erodes and deposits on *dry-to-dry* runoff. Minerals already travel into lakes and rivers under `conserved-runoff-minerals/1`, but physical submerged-bed aggradation, altered water-body depth, dynamically opened river branches, landslides and cross-unvisited-region sediment remain future coupled topology work.
- **Evidence:** direct execution of the committed runoff + seam functions passed local height transfer (0.000468 normalized elevation) and synchronized regional transfer (0.0015), with matching donor loss and recipient gain within Float32 precision and renewed drainage. Regression cases are in `tests/planetary-terrain-sediment.mjs`. Native Node, full world lifecycle and browser integration tests were *not* run.

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
