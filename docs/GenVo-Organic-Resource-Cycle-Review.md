# GenVo — Organic Food-Web Resource Cycle

Integrated development checkpoint, 2026-10-13. Ten gameplay modules changed against the delivered Producer Resource Contract. This pass extends actual food-web/resource behavior and existing carrying/storage controls.

## What players can experience

Fungi now grow by consuming real carcass or plant litter. Without substrate they lose tissue; they no longer grow through a photosynthetic-style formula or receive an independent free biomass addition. Consumed substrate partitions into actual fungal growth and minerals returned to the same finite soil store. Small existing mushroom clusters can render beside actual organic substrates instead of waiting for a generic mature-vegetation threshold. Inspection explains their dependence on organic matter; no new artwork library or fixed creature class was introduced.

Aquatic producers now fund growth from their owned stored energy and the world's finite mineral pool. Sunlight is incoming energy flux shared according to standing aquatic producer cover; resource shortages cap actual growth. Producer demands share scarce minerals proportionally. Trophic feeding retains unassimilated matter and maintenance losses as a non-edible aquatic organic litter pool, while the existing carcass conversion preserves its nutrition rule. Decomposition returns minerals. Waste does not become richer edible carrion for free. Shared mineralization totals and organic sub-totals are reported from one transfer function.

Carrying and material collection use canonical plant extraction, preserving crop tissue proportions and their fixed source genotype. Dropped/death-carried material returns with its retained seed/coating and chemical reserve fractions. Crop-capacity overflow enters litter rather than disappearing. Partial shelter storage consumes only its accepted fraction and leaves the remainder carried. Direct shelter caching gathers only the biomass its remaining capacity can accept, and construction debits the same extraction authority. Existing cache energy-credit multipliers and support controller remain in use.

## Source ownership

- `ecology/organic-resource-cycle.js` is the new shared transfer helper for substrate-funded fungi, organic mineralization, finite aquatic producer growth, aquatic reserve exports, material extraction/returns and carried-state validation. Existing vegetation/freshwater/carrying controllers remain owners of scheduling and execution.
- `ecology/freshwater-food.js` integrates finite producer growth and retained trophic waste/decomposition with existing densities, capacities, diets and harvest access.
- `ecology/plant-resources.js` includes fungal resource boundary transfers in the existing ledger.
- `gameplay/foraging.js` preserves aquatic reserve accounting and uses canonical extraction for ordinary plant meals.
- `habitat/shelter.js` funds construction/caching from real extraction and respects partial remaining capacity.
- `sim/simulation.js` schedules fungal processing, returns carried materials on death/drop, records actual carcass import and preserves partially stored loads.
- `world/world.js` initializes the new world-owned stores; `persistence/save-manager.js` retains them and migrates missing legacy state without changing current biomass, freshwater stocks or RNG. Negative/non-finite or malformed stores/carried tissue records are rejected.
- `ui/world-resource-target.js` explains carcass/fungal substrate and current aquatic growth constraints through existing inspection.
- `render/renderer.js` admits actual small substrate-fed fungal clusters using existing flora artwork.

Exact changed-module list: `organic-resource-source-receipt.json`.

## Verification

19 focused suites passed: organic-resource-cycle, plant-resource-contract, freshwater-food, freshwater-turnover, freshwater-foraging, freshwater-carrying, freshwater-encounters, shelter, seed-shore-niches, flora-tissue-propagules, contextual-interactions, mouse-resources, world-resource-selection, target-resource-states, world-trail-discovery, reproductive-compatibility, live-courtship-encounters, held-brace-input and canonical-source. New checks cover no-substrate fungal growth, funded decomposition, aquatic trophic/maintenance/waste inventory, absent-mineral growth restriction, tissue-preserving returns, overflow litter, partial storage and current/legacy saves. The earlier land-only inventory check now includes fungi, aquatic biomass, carrion and aquatic litter, so extending accounting cannot hide transfer losses.

`organic-long-resource-receipt.json` records three seeds × 100 resource-only days, with no animal lifecycle and no stock fixtures. Mineral inventory reconciles soil plus standing producers/fungi, all aquatic trophic fields, carrion, seed banks and both litter pools. Drift remains within the explicit 0.001 normalized-unit allowance for Float32 standing-stock rounding. This proves the scoped resource transfers, not ecological stability, animal nutrient conservation or a natural evolutionary outcome.

**Controlled native Chromium, 800×600:** a staged existing animal placement and canonical death produced an actual carcass; real-clock decomposition consumed it and grew fungi. Mouse selection/Inspect showed the resource's organic role. A valid mounted grasper with matching canonical legacy anatomy exercised real Z pickup, movement and drop; 0.18 existing moss biomass was collected and returned. Current resource and organic stores survived save round-trips. A separate selected water cell was deliberately stripped of non-algal stocks/carrion/litter and minerals, while retaining actual algae; actual growth became nutrient-limited and mouse Inspect showed it. This isolation fixture is not naturally occurring nutrient exhaustion. `organic-resources-proof.json`, full runtime screenshots and `organic-resources-runtime.webm` record the workflow. The partial shelter-capacity test is an isolated controller fixture, not a claimed native shelter playtest.

**Separate natural observation:** 120 wall-clock seconds, normal speed, fresh generated world, ordinary Auto/Keep the old body UI choices only. No anatomy, resource, stock, RNG or clock edits. `natural-organic-proof.json` and `natural-organic-runtime.webm` record actual fungal processing, aquatic growth, waste and mineral return counters. Natural occurrence is reported separately from the depleted-cell and valid-body fixtures; no human comprehension, ten-minute engagement or full ecological acceptance is claimed.

**Existing failure:** `freshwater-access` expects E to silently Drink even when multiple contextual interactions exist. It fails identically at the same assertion in this source and the exact previously delivered Producer Resource Contract source. The assertion was not removed or weakened; current/prior evidence is in `organic-resource-test-receipt.json`. Four previously documented birth/courtship failures also remain outside full-suite certification. No new failure appeared in the scoped passing checks.

Final natural run reached tick 976. Cumulative fungal growth was 24.6977, aquatic growth 401.9745, retained aquatic waste 11.0636, and organic mineralization 10.9874 normalized units. These counters establish occurrence, not long-term ecological balance.

## Prototype contracts and remaining limits

Normalized mineral/energy units remain provisional. Fungal assimilation is currently 20% of consumed substrate; mineral content retains the previous 0.1-per-biomass normalization. Aquatic light capture uses prototype cover-dependent flux. Lake water is an explicit external input matching producer uptake; this does not implement finite lake depletion or hydrological drainage. Atmospheric carbon/heat and detailed organism nutrients remain outside the ledger.

Animal bodies, births/healing, egg nutrition and shelter food-energy credits still use their existing physiological models across declared resource boundaries. This is not whole-ecosystem elemental conservation. Returned food still enters existing aggregate resource fields rather than becoming individually simulated detached items. Legacy carried tissue without component data uses the fixed founder allocation as an explicit inference, not recovered historical genotype diversity. Plants and fungi do not yet have sexual reproduction or evolving genotype cohorts. Small fungal clusters can remain difficult to distinguish at native zoom; final artwork/visual acceptance remains open. The existing map-edge camera blank space also remains outside this focused pass.

New organic state adds one Float64 litter array, three aquatic energy arrays and three Uint8 limiting-state arrays: 560 KiB at the present 128×128 world size, plus scalar totals. This is storage-size accounting, not a full performance certification.

**Next substantial milestone:** botanical reproductive genetics and a small inherited allocation/defense feedback loop, preserving real pollen/propagule costs, compatible parent material, selfing/propagation distinctions and persistent genotype diversity. Exact compatibility genetics, numerical balance and final art remain creator decisions; physical elevation/climbing/flight remain staged separately.
