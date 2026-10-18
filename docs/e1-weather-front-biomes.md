# E1: Moving regional rain fronts and physical biomes

## Player-world direction

This is the first **content-first** Living Planet increment after D0-D5. The D6 disk transaction design is postponed, not deleted: it is needed for independently unloaded continent-sized worlds, but it is **not** needed to establish real weather, physical regional habitat conditions, genetics or new anatomy on the existing map.

## Actual ecological behavior

- `src/world/weather-fronts.js` defines a seeded, deterministic, moving regional rain anomaly over the existing `coastal/1` and `planetary/1` worlds. It is evaluated from **world seed + x/y position + absolute simulation day**, with no invented water stocks, no added RNG draws, no unsaved transient task, no offscreen simulation. Two continuous wet/dry bands move through the existing spatial rain-shadow gradients at .31 radians/day. The front ranges from 0.55× to 1.45× of the real regional rain; a full east-west row averages to 1 before the existing real rain-shadow factor.
- `localRain` reads the moving anomaly only when the authoritative water simulation supplies `frontDay`. Existing read-only legacy climate calls without a day retain their previous static values. The normal `advanceSoilDay` and `advanceEnvironmentWater` pass the same current day, so **real** infiltration, runoff, groundwater, soil evaporation and rainfall-driven salt displacement receive matching locally varying precipitation. Existing freshwater and salt boundary source/sink accounting remains intact and conserved. The original no-environment/legacy world retains its exact prior physics.
- `src/world/biomes.js` reads the resulting **live physical conditions** (local temperature, actual atmospheric rain, current soil moisture, elevation, water/salinity, ground seepage, bramble and reed abundance) and derives habitat types: saline waters, fresh water, alpine slopes, cold open ground, arid plain, dry steppe, wetland, dense thicket, moist meadow and grassland. The classification grants no free food, creatures or abilities and cannot hardcode species outcomes. It can change with seasons, droughts, water, vegetation and geology.
- `World.biomeAt(x,y,climate)` and `World.biomeCounts(climate)` give future world map, creature editor and exploration UI a readable habitat API. World queries automatically use the last completed soil-water/environment day when no explicit `frontDay` is supplied, so UI reads the current physical weather front rather than a static climate. Low-level `biomeAt(world,index,climate)` also accepts an explicit `frontDay` for comparisons and tests. The underlying plants and animals already respond to real soil water and local temperature; biome labels are observations, not new biological restrictions.

## Test/implementation boundaries

`tests/weather-front-biomes.mjs` proves seeded repeatability, movement of contiguous wet/dry fronts, the balanced full-row anomaly, actual regional rain feed into soil-water and ocean salinity, conservation-closed daily water/salt budgets, deterministic rain receipts, biome classification based on modified real fields, and exact 96-tick coastal-world save/resume continuation.

The unchanged full fast gate and an explicit seeded **legacy-world parent-to-E1 full-state comparison** guard against regressions in ordinary play. No thresholds or known-failure ledgers are relaxed.

**Not yet implemented:** thunder and lightning events, snow accumulation, wildfire, tornadoes, rivers changing topology in real time, visually drawn biome-specific trees/grass, biome-colored terrain, map enlargement or new anatomical art/abilities. E1 supplies spatial weather physics and biome observation, not every weather effect or content asset. The next content waves should add plant communities/forests, temperature adaptation/insulation parts and procedural storms with visual feedback, while preserving the underlying finite ecology and player-driven lineage rules.
