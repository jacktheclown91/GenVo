# E14: Planetary Regions and Persistent Resource Authority (Foundation)

## What works

The previous planetary generator had a global 512×256 macro topographic field, but its only live 128×128 World always sampled the `(0,0)` landing zone. E14 allows physically **adjacent 128×128 regional Worlds** to sample nonzero global terrain coordinates from that **same immutable planetary descriptor**.

A region has an explicitly validated, tile-aligned global origin (`{x,y}`, multiples of 128). Inside it, every pre-existing controller still receives its familiar local World arrays, index arithmetic, finite plant reserves, soil water, snow, groundwater, organisms' terrain, fresh water and elevation. The local terrain, precipitation, ocean, flowing rivers, fertility, food-resource founders, and cold vegetation derive from **absolute global planetary coordinates**, so two neighboring regions are not randomly repeated copies of the starter map.

`PlanetRegionAtlas` owns a map of those region worlds. A requested neighbor is constructed lazily and **once**; subsequent requests return the **same mutable World instance** (including its depleted/changed food, water, seed banks and ecology), not a new ecological reset. Region keys and adjacent cardinal origins are typed; invalid, duplicate or incompatible planetary ownership is rejected.

The canonical save manager now serializes each explicitly materialized remote World separately, with exactly one main active region. Stored remote states use the same source-of-truth array format and validated origin, geography, surface topology, terrain, plant seed banks, resource funding and soil/snow fields as the local world. Older planetary saves default to origin `(0,0)` with **no invented remote regions**. Nonplanetary saves and their world-size behavior remain unchanged.

## Critical scope boundary

**E14 does not yet enable player or wildlife crossing from one World to another.** It exposes persistent neighboring physical regions, not global live actor migration, cross-border surface flux, offscreen ecosystem ticking, family/courtship authority reconciliation, cross-region cloud simulation, or a seamless camera. Crossing an edge while preserving organism identity and all dependent systems requires explicit creature/controller transfer, persistence and offscreen scheduling; these will be separate follow-on integration milestones.

**Do not claim continents are traversable yet.** The 128×128 cap on *each region* remains. The map spans real planetary coordinates, but region residency beyond the current play area is presently authoring infrastructure and test-accessible code rather than player interaction. This avoids pretending that flying the camera past a border safely preserves populations.

Tests: `tests/e14-planetary-regions.mjs` covers global coordinate sampling, 128-seam geographic continuity, independent real ecological stores, returning without regeneration, save/load byte parity, regional identity attacks, old-world save compatibility, and no nonplanetary changes. Full-browser and long-term economy validation remains outstanding.
