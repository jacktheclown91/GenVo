# GenVo — Producer Resource Contract

Integrated land-producer development checkpoint, 2026-10-13. Seven gameplay modules changed from the delivered Flora Tissue Bridge; this is a simulation/resource pass, not a layout or bulk-art pass.

## Actual gameplay change

Standing land producers now share finite soil-water and mineral stores, and maintain producer-owned chemical energy reserves. Rain and shore inflow are explicit external water inputs; evaporation/runoff are explicit outputs. Sunlight is incoming flux captured according to standing producer cover, not a finite soil stock. Growth must fund water, minerals and energy; shortages cap actual biomass production. Local producers submit growth demands together and share scarce soil inputs proportionally, avoiding priority from catalog iteration order. Existing habitat suitability, seasonal effects, scars, crop capacities and native plant presentation remain in use.

Grazing now changes whether a patch has reserves to recover. Plant losses, discarded tissue and decayed seeds enter the existing litter store. Litter decomposition returns finite minerals. Seed establishment is capped by consumed seed biomass, with unused material returned to litter. Feeding/collection exports and returning animal-carried seeds are explicit producer-ledger boundary transfers. Removing plant biomass exports its associated stored reserve instead of leaving energy behind in an empty patch. Existing anatomy-specific feeding, cargo and action execution remain canonical.

Crop inspection reports the actual growth constraint. Native verification exposed an older stale closure: Inspect previously retained the description from when its radial opened. It now queries current state when clicked, and the radial explanation updates without changing command ownership or keyboard focus.

## Source modules and ownership

- `src/ecology/plant-resources.js` is the new land-producer accounting helper: finite inputs, cover-based energy capture, proportional allocation, funded growth, losses, decomposition, boundary receipts and read-only resource views. It runs in the existing vegetation phase; it is not a second plant lifecycle controller.
- `src/world/world.js` initializes the world-owned stores deterministically.
- `src/sim/simulation.js` delegates the existing land-vegetation schedule and litter decomposition to the contract.
- `src/ecology/dispersal.js` reconciles seed decay/establishment, paid release and actual crop extraction with reserves and producer-boundary transfers.
- `src/persistence/save-manager.js` persists the stores and upgrades missing legacy state without changing existing plant biomass, seed quantities or RNG state. Invalid saved store types, lengths, negative or non-finite values are rejected.
- `src/ui/world-resource-target.js` presents actual crop growth constraints.
- `src/ui/creature-context-tray.js` fixes stale inspection descriptions and updates their presentation.

Exact module changes: `producer-resources-source-receipt.json`.

## Resource contract and provisional units

The schema uses explicitly normalized prototype units, not biological measurements. One biomass unit requires 0.5 water, 0.1 mineral and 1 stored energy. Water capacity is 2; per-producer energy capacity is 0.25. Legacy soil water initializes to twice the existing moisture index, minerals to 0.4 times the existing fertility index, and standing producer reserves to 0.1 times biomass capped at capacity. This creates a deterministic baseline inventory; it does not claim that the old fertility/moisture indices were physical stores. Existing moisture/fertility remain habitat indices. Coefficients are provisional and require calibration before evolutionary selection is balanced.

Rain input retains the existing 0.06 weather scale; shoreline inflow is an explicitly external reservoir boundary, not an unaccounted minimum moisture reset. This does not yet withdraw lake water or implement drainage/elevation. Energy has recorded photosynthetic inflow, respiration/spill, reserve exports and growth withdrawals. Mineral inventory covers soil plus standing land producers, seed banks and plant litter; animal meals/material collection and returning cargo cross its declared boundary. It is not a complete organism-wide nutrient ledger.

Six Float64 store arrays and four Uint8 limiting-state arrays occupy 832 KiB at the current 128×128 world size, plus scalar totals and at most 48 nearby receipts. No individual grass simulation, new creature classes, extra parts or bulk artwork were introduced. This is an allocation-size calculation, not measured whole-game performance certification.

## Verification

16 focused suites passed; `producer-resources-test-receipt.json` contains results. The new test verifies separate water/mineral/energy limitations, actual withdrawals, rain/evaporation/runoff reconciliation, land nutrient inventory through growth/release/seed decay/germination/decomposition, chemical reserve reconciliation, catalog-order-independent allocations, bounded receipts, invalid-state rejection and stock/RNG-preserving old-save migration. Existing feeding, anatomy, target selection, action states, saves, reproductive compatibility, courtship, tracking and input tests also passed.

**Controlled native Chromium, 800×600:** actual mouse feeding on existing crop stock, with the selected cell's minerals staged to zero and water/energy staged sufficient. After real-clock vegetation advancement, the crop requested growth but received none because minerals were unavailable. The player used Inspect, which now showed Nutrient limited in the actual game. The fixture also exercised real seed cargo/deposition and a separate fresh-world kernel-mouth action, cracking animation and resource-state save parity. `resource-growth-proof.json`, full screenshots and `resource-growth-runtime.webm` record this workflow. The soil fixture is not a naturally occurring drought or human playtest. Seed-mark reading was outside this capture's acceptance scope; expired/out-of-range marks correctly remain unavailable and their own regression suites remain in use.

**Separate natural observation:** 120 wall-clock seconds at normal speed with ordinary Auto/Keep the old body UI choices, no anatomy, stock, resource, RNG or clock fixtures. `natural-resources-proof.json` and `natural-resources-runtime.webm` record actual inputs, withdrawals, decomposition and limiting-state counts. Distinguish natural occurrence from the deliberately mineral-depleted fixture. No human comprehension, ten-minute engagement, long-term balance or creator visual acceptance is established by these captures.

Final-source natural run reached tick 975: soil water changed from 17522.71 at the first sample to 10401.54; mineral stores from 4042.41 to 3767.25. Last-sample producer/cell counts were water-limited 1072, nutrient-limited 0 and stored-energy-limited 4239. These are producer/cell states, not individual plant counts or retention outcomes. The observed run did not establish natural nutrient exhaustion.

## Remaining scope and next milestone

This contract admits four land producer aliases. Founder plant genotypes remain fixed. Fungal/carrion and aquatic production still have older accounting outside the admitted plant-litter contract; animal-body mineral/water inventories, lake/groundwater depletion, full drainage and all exceptional material returns are not globally reconciled. Current habitat indices can still be changed by older ecological systems independently of the new finite stores. Full ecosystem conservation must not be claimed.

No new scoped regression was observed. Four historical birth/courtship suite failures remain documented against the earlier Hybrid Lineages baseline; this pass does not certify the full historical suite.

Next meaningful milestone: close the organic/fungal/aquatic and material-return ledger boundaries, test longer resource-only and living-world trajectories, then admit botanical reproductive genetics and the first inherited allocation/defense feedback loop. The approved elevation/functional locomotion direction remains staged; physical height, climbing and flight are not implemented here.
