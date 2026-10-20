# GenVo planetary rain, runoff and persistent catchments (20 October 2026)

## Model and authority

Freshly generated `planetary/1` worlds now use `environment.schema:5`. Older `schema:1-4` saves retain their original physical and biological rules, without implicit surface inventory creation. The starting planetary geography, terrain elevation, fixed baseline bathymetry, water/land mask and existing 128×128 regional extent are unchanged.

The World owns two distinct, persistent `Float64Array` physical inventories:
- `environment.volume` stores water already occupying a connected wet cell.
- `environment.overland` stores rain/snowmelt runoff moving downhill or waiting in a closed basin **on land**. It is not a second body of open-water tiles and has no invented salt or animal population.

Both fields are included in new surface-budget receipts, saved/reloaded with the World, and never lost during regional replay. Soil water is still independently owned by `world.moisture` and `world.soilWater.groundwater`, with existing snowfall, infiltration, percolation, capillary exchange and vegetation uptake.

## Daily rain and soil transfer

1. `advanceEnvironmentWater` now physically admits freshwater precipitation to open water when it has capacity. `surfaceRainInput` records rain, `surfaceRainOutput` records rain rejected at the supported maximum water volume. Only the rejected water expels dissolved salt. Rain retained in an ocean/lake dilutes salinity without manufacturing an external salt loss.
2. `advanceSoilDay` runs its previous soil water law unchanged. The same exact `liquidRain - infiltration + physical groundwater/soil overflow` that leaves the soil ledger is captured in a temporary per-cell runoff buffer. It is not additional precipitation.
3. `routePlanetaryRunoff` credits that stock once to persistent land overland storage. The terrain's original `downstream` map guides one bounded downhill hop per day. A routed cell can hand off to another dry-land cell or to an existing natural river, lake or ocean cell. The latter credits `environment.volume` directly. A closed depression retains the stock; there is no synthetic disappearance through a dry edge and no teleport to the nearest river.
4. The surface receipt's `waterInput` is the sum of direct precipitation into existing water bodies and physically rejected soil runoff. Its `waterOutput` is the existing wet rain rejected due to maximum capacity. Wet-cell transfers and land routing are **internal** movements, not external inputs or outputs. `waterClosure` verifies the whole wet + overland surface inventory, and the soil runoff receipt remains an equal quantity leaving the soil system.
5. Internal wet-to-wet transport, geologically defined outer-ocean salt reservoirs and independently owned reciprocal regional water/salt transfers retain their preexisting authority and synchronized clocks.

New cumulative and bounded daily receipts include `surfaceRainInput`, `surfaceRainOutput`, `soilRunoffReceived`, `runoffDelivered`, `overlandMoved` and `overlandEdges`. The soil receipt records `surfaceRunoffCaptured`, `surfaceRunoffDelivered`, `overlandMoved` and `overlandStored`. Temporary runoff buffers are never persisted as an alternative live stock.

## Acceptance and remaining limits

`tests/planetary-rainfall-runoff.mjs` checks twelve actual soil/weather days, conserved surface-storage changes, the exact soil-to-surface source amount, a physical downhill land-to-water mouth, retained overland basins, immutable geography, exact canonical save/replay and intentionally unchanged schema-4 physics. The existing salt, regional replay, legacy save, browser, wildlife and flora suites continue to apply.

**Subsequent schema 6:** Enough locally stored overland runoff can now create a new shallow wet tile adjacent to an existing stream or lake, or in a filled closed depression, through an internally funded topology receipt. See [PLANETARY-INUNDATION-2026-10-20.md](PLANETARY-INUNDATION-2026-10-20.md). This original schema-5 runoff behavior is preserved in historical saves.

**Still not implemented:** returning shallow wet tiles to dry land, new water channels at regional edges, erosion of actual riverbeds, ocean tides, complete groundwater/wet-cell coupling, ocean-volume reservoir exchange or mature 100-day multi-region performance. Land-plant tissue and submerged soil water still need explicit ecological transition rules. No biological population outcome is forced.
