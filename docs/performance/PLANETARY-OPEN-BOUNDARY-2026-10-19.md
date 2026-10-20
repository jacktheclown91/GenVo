# Planetary finite open-water boundary contract (October 19, 2026)

## Scope and ownership

New `planetary/1` regions retain a local 128×128 World as the sole owner of live water depth and dissolved salt. The immutable `PlanetGeography` samples define the OUTSIDE composition at open edges, not a second mutable water array. The geographical border is checked at the actual neighboring tile on all four sides. Interior bodies and blocked land borders receive no external salt input.

Environment `schema:2` established the original finite-rate open-boundary authority, and remains valid in historical saves. New planetary regions use `schema:3` with the same declared salt-reservoir boundary plus a separate Float64 conserved `volume` inventory:
- `boundary[i]=0`: no external water; `1`: freshwater outside; `2`: ocean outside; `3`: mixed freshwater/ocean contact at a corner
- At the daily hydrological step, neighboring local wet cells perform their existing conservative exchange. Rain displaces and exports dissolved salt with its existing explicit receipt
- Exposed water exchanges equal volumes with the declared open-boundary reservoir. The salt difference flows at `0.08 × local water depth × (external salinity − current salinity)` and cannot change a cell's stock outside physical `[0,2 × depth]` bounds
- Any positive salt transfer is recorded in `saltInput` and `boundaryInput`; negative flow is recorded in `saltOutput` and `boundaryOutput`. Daily receipts record both dedicated boundary quantities and the existing conservation closure
- No algorithm directly sets an ocean cell back to its initial salinity; replacement is **finite** and comes with accounting

The open-boundary mechanism described here is not itself paired with the neighboring World's inventory. It remains an independently accounted exchange with a geography-defined external reservoir, even when the neighbor is simulated. **In addition**, the separate synchronized seam authority now supports reciprocal cross-region dissolved-salt and finite-water-volume transfer when both Worlds have reached the same completed day and use schema 3. See [PLANETARY-PAIRED-SEAM-SALT-2026-10-19.md](PLANETARY-PAIRED-SEAM-SALT-2026-10-19.md). This is not yet a fully coupled planetary ocean or river-volume model.

## Backward compatibility

`schema:1` ocean/coastal environments continue to use the previous edge behavior. Existing historical planetary region snapshots with empty boundaries remain closed and do not silently gain ocean salt during restoration. No save migrations, version changes to the planetary geography projection, artificial ecological rescue, demographic quotas, or changes to the day/season clocks were added.

The region-local `schema:2` and `schema:3` boundary codes and cumulative/daily receipts are persisted by the current save system, including archived biological region snapshots. Schema 3 additionally saves live water-volume inventories and reciprocal transfer receipts; existing schema-2 saves are restored without invented volume stocks. A malformed boundary outside the geographical edge or negative boundary receipt is rejected.

## Acceptance and limits

`tests/planetary-boundary-exchange.mjs` checks natural mixed coastal geography `GENVO8-TEST-A` at `(0,2560)`, exposed ocean/freshwater/river edges, explicit positive external marine input, daily/cumulative salt closure, exact save/restored continuation, and a historical zero-flux planetary save.

`tests/regional-environment.mjs`, `tests/planet-geography.mjs`, `tests/e17-offscreen-environment.mjs`, `tests/e18-offscreen-biology.mjs`, and `tests/regional-synchronized-replay.mjs` guard older freshwater/coastal worlds, pure-physical archives, real fauna and deterministic synchronized offscreen ecology.

The new paired-seam test establishes finite cross-region water-volume and salt conservation for adjoining wet tiles, but not a 100-day coastal equilibrium, browser frame-rate improvement, full finite-volume ocean circulation, or river discharge across land. Those remain explicit acceptance items. Those remain explicit acceptance items.
