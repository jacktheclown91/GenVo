# GenVo planetary wet-cell hydrology, schema 4

## Authority

New `planetary/1` worlds initialize `environment.schema:4`. Geological `terrain.elevation` and geographic `environment.depth` remain the original immutable source of terrain and baseline water structure. The separate `Float64Array environment.volume` is the owned conserved water inventory. The `Float64Array environment.salt` is the dissolved-salt inventory, and a changing salt concentration is derived from the **current volume**, not from the old geographic depth.

Each complete physical day:

1. The historical wet-cell salt mixing, rain salt-displacement receipts, and finite exterior freshwater/ocean reservoir exchange continue unchanged except that actual mutable volumes set their concentrations.
2. The new `advanceInternalPlanetaryWater` pass traverses only orthogonally connected, existing wet cells in deterministic row-major order. A real surface-head difference (`terrain.elevation + volume`) produces bounded movement between the two owned inventories. Head direction is determined from the old physical day; staged water provides the available mass and capacity limits. A source cell retains positive water volume, and no receiving cell may exceed its allowed physical capacity.
3. Water transports the donor's current dissolved-salt concentration. Each accepted source debit has an exactly matching destination credit. The pass validates volume closure and physical salinity bounds before publishing the new water buffer.
4. The same day's `environment.lastDay`, bounded `environment.daily`, and `environment.totals` now track `internalWaterMoved`, `internalSaltMoved`, and `internalWetEdges`. These are internal movement statistics, **not external inputs or outputs**; the external environmental water receipts remain zero for this internal-only pass. Existing salt inputs and outputs continue to report actual rain export and the exterior ocean reservoir.

On the next completed synchronized regional day, `planetary-seam-salt.js` applies its separate, already paired finite-volume and saline-water transport across connected live/archived World boundaries. Both schema 3 and schema 4 participate in this paired authority. A mixed schema 3/4 border can exchange paired water, but only the schema-4 region moves its water within its own map.

## Backwards compatibility and topology

Historic `environment.schema:1/2` physical saves retain their historical laws. Existing `schema:3` saves retain their fixed *internal* water inventory while still supporting the previous reciprocal border exchange. No historical water levels, plant genomes, animals or population outcomes are regenerated or silently upgraded.

Explicit surface-water topology edits use the existing conservation contract and now also import/export the saved `volume` array consistently for schema 3 and 4; the physical pass itself never dries a shoreline, floods a land tile, or fabricates freshwater and sea channels.

## Tests and unfinished systems

`tests/planetary-internal-water.mjs` covers an actual saline connected wet-cell pair, controlled head gradient, transfer of real water and dissolved salt, unchanged topology/bathymetry, mass closure over ten physical days, schema-3 inactivity, exact persisted simulation and biological replay, and rejection of invalid saved volumes. `tests/planetary-paired-seam-salt.mjs` ensures the outer regional exchange remains conservative. The full planetary GitHub workflow covers remote biological time, border crossings, legacy save migrations and deterministic three-region replay.

**Still not implemented:** rainfall increasing retained surface-water volume; groundwater becoming a new open channel; geological evolution of riverbeds; lakes that inundate or drain landscape tiles; tide/ocean circulation; true 100-day multi-region mature-world memory and frame-pacing acceptance. Passing focused physical tests is not equivalent to claiming any of these exist.
