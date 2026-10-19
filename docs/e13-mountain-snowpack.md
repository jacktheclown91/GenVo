# E13: Mountain Snowpack, Meltwater, and Persistent Cold Terrain

## Live physical fields
Snow is accumulated *precipitation stored as water-equivalent depth*, on the existing `soilWater.snowpack` field of the canonical World. Snow accumulation, local snowfall fraction and thaw respond to physical local temperature and moving precipitation. Higher elevations naturally stay colder through already generated regional temperature offsets; there is no new alpine biome power or arbitrary creature/taxon whitelist.

Daily `advanceSoilDay` partitions regional precipitation into liquid rain and solid snowfall. Liquid rain enters the established infiltration/runoff/evaporation/percolation/groundwater cycle. Snow is withheld from the soil until warm spells cause real snowmelt. Meltwater enters the *same existing* infiltration/runoff paths without adding a second water source. Water accounting includes snowpack in land storage, and reports snowfall/melt alongside normal water flux and conservation closure. Existing saves without snow stores start at **zero historical snow**, instead of silently constructing snow from the current biome; post-E13 worlds preserve their exact water-equivalent snow on save/load. Snow is stored only on nonwater land.

## Selection pressure
- Deep snow blocks sunlight and plant growth without instantly creating extra food or destroying buried mature plants, which remain subject to their other finite growth, nutrients and temperature limits.
- Actual snow depth slows ground movement and increases movement energy cost. Multiple inherited broad pads or wide webbed feet partially offset snow sinking; no named species receives a free snow bonus. Flying/swimming creatures keep their existing separate locomotion authority.
- Biome inspection returns the **current local snow depth** in addition to elevation and temperature.
- Top-down snow drifts, snow-covered ridge patches and light frost shading are rendered **dynamically** over cached terrain, under living vegetation. Art is provisional procedural pixel styling, not a side-view or invented climate label.

## Scope and limitations
This is **persistent seasonal snowpack**, not a claimed glacial-flow/ice-sheet solver. Glacier creep, erosional valley carving, avalanche/landslide hazards, ice freezing entire lakes, river ice, specialized cliff nesting and expansive connected continental mountains are not part of E13. The world remains 128×128 playable; macrogeographic continent traversal is future work. Long-term ecological balancing and browser acceptance are still needed.

`tests/e13-mountain-snowpack.mjs` covers real altitude temperature differences, recurring actual snowfall, conservation, thaw and soil runoff, movement by anatomy, nonmagical plant shading/growth factors, exact save restoration and older-world zero-snow migration, and pure overhead rendering. No heavyweight comprehensive sweep.
