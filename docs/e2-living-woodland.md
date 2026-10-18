# E2: Living Woodland, not painted forest

The second content-first GenVo ecology wave adds **woodspire**, a genuine slow-growing canopy producer that consumes the same soil water, minerals and photosynthetic energy as existing plants. Its seeds use the same canonical seed banks, genotype registry, tissues, botanical reproduction and animal dispersal as existing genetically inheritable flora.

## Biological/ecological behavior
- New `PLANTS.woodspire`: sparse deterministic woody founding stands on suitable land; slower growth and greater mature standing biomass than bramble; higher water demand, seed-limited establishment, coat-bearing seeds, inherited seed allotment, finite seeds and canopy biomass. Mouths differ in their capacity to harvest the woody producer, rather than every creature eating every tree.
- `advancePlantInputs` now determines ground light interception from **actual living woodspire biomass** at the cell. A tall/strong canopy can reduce sunmoss and bramble photosynthesis up to 60%, other understory photosynthesis less, but never creates light energy or new mineral/water. Dead/harvested canopy permits ground species to recover, subject to physical reserves. Species continue to compete for the original water/mineral stores through `fundPlantGrowth`.
- The physical biome observation adds `woodland` when standing woodspire passes a canopy threshold, except if actual salinity, water, cold/alpine, aridity or wetland conditions dominate. Woodland can appear or disappear as physical tree biomass changes. No hardcoded creatures are renamed into forest species and no arbitrary survival bonuses are granted.
- `render:'tree'` draws a distinct procedural overhead crown/wood center with seasonal foliage in `src/render/flora.js`, including trace styling. This is functioning top-down pixel-art visualization, **not** the planned polished 32x32 authored asset wave.

## Save compatibility
- Previous schema-10 saves lack woodland arrays. Restore zeros **only those truly absent** plant, seed-bank, photosynthetic energy and growth-limit fields, never regenerates free trees and seeds in a historical world. `PlantDispersalController.upgrade` registers new seed-kind bookkeeping without crediting material to older saves.
- New world founders have real woodspire stocks that evolve under the same rules. Old worlds remain biologically intact and may later receive woodspire only via explicit physical seed introduction; E2 does not magically repopulate a restored world.
- No map resizing, no background agents, no architectural disk transaction, no alteration to global animal authority.

## Verification
`tests/living-woodland.mjs` checks deterministic sparse tree populations, water exclusion, inherited woody seed genome, actual intercepted photosynthetic energy, dynamic woodland classification/removal, complete save/restore and 96-tick parity, and zero tree/seed/energy invention on an older save without new flora. E2 CI also checks prior botanical, seed cohort, soil water, vegetation, render/part code, D5 complete page archive, 4x observer benchmark and original unchanged fast regression.

**Outstanding work:** proper mature 32x32 authored tree art, canopy collisions if biologically justified, habitat-dependent animal behavior, multiple tree lineages and understory species, climate survival specialization, pollination diversity and biome-specific audio. E2 begins a real forest food web, not completed forests or all planned parts. The 500ms 4× performance gate remains unchanged. Keep draft and off main until validated.
