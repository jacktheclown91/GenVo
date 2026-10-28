# Regional hydrology — plan

Status: plan only. No source behaviour changes here. This follows [neighbour-region collapse](NEIGHBOUR-REGION-COLLAPSE-2026-10-28.md) and [founding water](FOUNDING-WATER-2026-10-28.md). Ownership: Claude owns the simulation, geography and water authorities; Codex owns how water looks (coordination note in `PRESENTATION-COORDINATION-2026-10-28.md`).

## Measured facts

**Scale.** The planet circumference is 1,048,576 tiles on a 512 × 256 macro grid (`planet-geography.js`). One macro cell is therefore about 2,048 × 2,048 tiles, roughly 16 × 16 regions of 128 tiles. Surface water at generation comes from three sources only:

- ocean below sea level;
- rivers drawn as straight segments between macro-cell centres where macro flow is at least 8, 1–4 tiles wide;
- lakes at closed macro basins.

The start valley is chosen on such a river. In a survey of 15 regions around the origin on each of four seeds, most regions have 0 open-water cells (`regional-evolution-fields-2026-10-28/region-water-survey.json`; the 200-day home water balance is `home-water-balance-seed1-200d.json`, from `tools/measure-home-water-balance.mjs`).

**The existing dynamic water system cannot create water in a dry region.** Measured in the waterless neighbour of `POPULATION-FOUNDING-PROBE-1` over 40 days:

- soil runoff is 0 every day, overland water never exceeds 0.005 per cell, and there are 0 new wet cells;
- its 93 closed-basin cells never fill: inundation needs a closed basin holding at least 0.65, or a cell next to existing water;
- springs need a water table of at least 0.72 and moisture of at least 0.55, and none fire.

**The soil and groundwater balance has a large generation transient.** Groundwater starts equal to each cell's generated moisture, about 0.5. Evaporation then exceeds rain while capillary rise draws groundwater up, and recharge is near zero.

| Home valley, seed 1 | Day 11 | Day 140 | Day 200 |
|---|---:|---:|---:|
| Groundwater | 7,755 | about 2,400 | about 2,400 |
| Mean soil moisture | 0.44 | 0.13–0.36 | 0.13–0.36 |

The water balance reaches a real equilibrium at about 30% of the starting groundwater. Animals (127–147) and plants (about 17,000) stay stable through it. So every world spends its first ~140 days drying out from an over-wet start. A dry region dries the same way, with no surface water to fall back on.

**Generated wet geography is permanent.** Channel recession (`funded-temporary-channels/1`) only removes runoff-created channels. Rivers and lakes exchange water with the world's geography reservoir at region borders (`geography-reservoir-water/2`).

**Presentation reads the same mask.** The renderer draws water per tile from `world.water`, so any new wet cell appears with the existing river and lake art.

## Goal

Regions whose rainfall and terrain would carry streams, ponds or springs actually have them, so water availability follows real geography instead of the macro grid's coarseness. This applies to new worlds only, through a versioned geography policy. Recorded worlds, bundled scenarios and frozen fixtures keep their recorded geography exactly.

## Constraints

- **One authority.** Water stays in `World` and the existing environment inventories, with no second hydrology system. New water is part of the generated initial state, and afterwards it is moved only by the existing conserved flows.
- **Seams agree by construction.** Streams must be sampled from planet coordinates, as rivers are, so two regions sharing a border generate the same channel without exchanging state. Border crossings use the existing boundary-water codes.
- **No outcome tuning.** Stream and pond thresholds come from the hydrology itself: catchment area, macro rainfall and the soil model's equilibrium water surplus. They must not be chosen to make fauna survive or recognition happen. Dry regions may remain dry.
- **Determinism and cost.** The same seed gives the same water. Region generation stays within its current preparation budget (measured before and after), and any planet-level computation is lazy and cached per macro cell.
- **Save compatibility.** Saved worlds record their geography policy, and loading never adopts a new one.

## Design, in dependency order

**H1 — Survey tool.** Measure, per seed, the share of regions with any open water and the distribution of land distance to drinkable water across many regions. Also measure equilibrium groundwater, runoff and evaporation per region. This is the before baseline, and it scores every later step without targeting a number.

**H2 — Meso drainage in the planet geography** (`planet-hydrology/2` or a projection-compatible geography version, new worlds only).

- **Grid.** Within each macro cell, compute a deterministic meso grid of about 32-tile cells from the same fine elevation noise the region terrain already uses. Route each meso cell to its steepest lower neighbour.
- **Inflow.** Inflow at the macro cell's upstream edges comes from the macro flow graph, so meso streams join the existing rivers rather than replacing them.
- **Streams.** A meso cell carries a stream when its upstream catchment area times its macro rainfall exceeds the catchment that the soil model's equilibrium surplus needs to sustain flow. That surplus is precipitation minus equilibrium evaporation, measured in H1.
- **Ponds.** Closed meso basins with enough catchment become ponds.
- **Sampling.** Streams are sampled exactly like existing river segments (nearest-segment distance against a width from flow), so region borders agree automatically.
- **Caching.** Results are cached per macro cell and bounded like the existing macro cache.

**H3 — Funding and persistence.**

- Generated streams and ponds are permanent geography, like rivers.
- Where a stream crosses a region border, the existing boundary-water reservoir supplies it, as for rivers. Streams rising inside a region begin at a recorded source cell; whether that cell is a spring funded by groundwater is decided by measuring H1's equilibrium, not assumed.
- Verify a year of conserved water accounting, recession, ice and salinity per region with the existing closure checks.

**H4 — Ecology and gameplay validation** (Claude).

- Re-run the two-region and stay-east fields and a wider multi-seed survey under the new geography with founding `/2`. Measure founded populations, dehydration deaths and dispersal outcomes, without targets.
- Check the player's water access in ordinary exploration.
- Confirm `/1`–`/4` evolution controls, modernization fixtures and bundled scenarios are unchanged.

**H5 — Presentation** (Codex). Narrow streams, banks, ponds, seasonal ice, map and minimap. The simulation exposes read-only per-cell facts, such as a stream width or order already implied by the sample. Presentation never decides where water is.

**Separate decision — the generation transient.** Worlds start at about 3× their equilibrium groundwater. Options are to keep it (a wet first season), or to generate groundwater nearer equilibrium for new worlds through an explicit, versioned spin-up. That changes early-game ecology, so it is the creator's call and is not bundled into H2.

## Decisions needed from the creator

1. Approve a new geography version for new worlds that adds meso streams and ponds, leaving existing worlds and scenarios unchanged.
2. Whether new worlds should keep the wet first ~140 days or start near water-balance equilibrium.
3. The acceptable region-preparation time budget, to be measured in H1 and H2.

## Acceptance evidence

- Determinism and seam agreement, tested by generating both sides of many borders.
- Conserved water closure over a full year per region.
- Exact recorded-world controls on Node 22 and 24.
- Before and after survey distributions.
- Field outcomes reported as measured, including regions that remain dry.
- Native browser observation of new water with Codex's presentation.
- The full playable gate.
