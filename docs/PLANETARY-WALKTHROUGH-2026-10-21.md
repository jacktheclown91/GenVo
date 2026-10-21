# Procedural planet walkthrough and default | October 21, 2026

## Creator requirement

GenVo should feel like one continuously traversable procedural world with continents, oceans, mountains, rivers, deserts, tundra and persistent local evolutionary ecology, rather than a self-contained 128x128 map.

## Present reality (do not confuse the two)

The existing **planetary/1** geography derives a 512x256 globe-scale macro field, flowing river networks, oceans, climate, elevations and fixed regional pages. Each live Simulation still owns one **128x128 local region**. The existing E14–E19 cross-region authorities preserve animal identities, regional ecology, current organism genetics/body, families, and offscreen replay with validated saved state. Traveling had to be manually requested via Cross Region (9). The default New World menu used **freshwater/1**, a genuinely finite local world.

This commit changes the default New World geography to **planetary/1** and interprets **manual keyboard movement outward** near a **physically valid border** as an ordinary cross-region request through `planetaryTravelAvailability` and `crossPlanetaryBorder`. No second transport system is built. Input stays held during a successful walking transition. A compact HUD label shows the actual absolute planetary tile and region. The legacy local-world choice remains available and existing saved games retain their recorded generator.

Crossing cannot proceed when the player is paused, lacks physical traversal, is underwater, pregnant, has an unresolved dependent/family constraint, is in combat, lacks resources, or when the archived destination requires biological/ecological catchup. The same existing rule gates still apply.

## Important limits, explicitly **not** solved

- **Not a procedurally endless map yet:** the globe uses a finite 1,048,576-tile equatorial model with a bounded regional projection, an archive of at most 16 inactive regional simulations and an in-memory region atlas of at most 17 Worlds. These boundaries currently stop expansion.
- **Not visually seamless:** crossing activates a separately owned simulation and prepares a new local scene, with a brief interruption. Renderer chunk streaming only covers the current region.
- **Not full on-demand ecological paging:** archived animal, soil, seed and surface-water worlds live inside a save snapshot rather than a scalable region-storage index. Removing the 16-region limit without paged persistence would jeopardize memory, browser storage, load times and single-owner biological continuity.
- **Not an infinite flat map:** a spherical planet should eventually wrap and cover a finite surface. If the desired product must be literally unbounded in both directions, the planetary geometry and world identity must adopt a separate explicitly versioned planar generator, never rewrite existing planetary/1 saves.

## Next architecture milestone

Build a **paged, persistent region store** keyed by immutable planet identity + global region origin. Evict cold regions atomically only after a validated snapshot and weather/biology ledger; restore the exact saved state on return, and deterministically generate only never-seen regions. Keep bounded hot neighboring regions in memory; make saves reference durable content-addressed region records, not recursive full-region snapshots. Preserve rollback, unique actor IDs, family custody, cross-seam water/mass closure, and historic world policies. Then stream visual border chunks and prepare neighbor simulations before entry to remove the visible transition.

Acceptance requires genuine walking in multiple compass directions across several regions with unchanged physical stores on return, family migration, old-save fidelity and measured Chromium frame/storage behavior, not merely a zoomed-out 128x128 map.
