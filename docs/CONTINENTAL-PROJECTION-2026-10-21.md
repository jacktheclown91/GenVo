# Continental planetary projection — October 21, 2026

New worlds record the planet descriptor projection `regional-equirectangular/2`. Worlds created earlier keep `regional-equirectangular/1`, and every World derived from them — travel destinations, preparation scaffolds, atlas Worlds and border-presentation Worlds — inherits that descriptor; a historical world never adopts the wider map by crossing a border.

## What changed

Both versions use the same equirectangular mapping around the landing anchor, so terrain is identical wherever `/1` reached (tested on sampled windows). Only the explorable extent differs:

| | `/1` (historical) | `/2` (new worlds) |
|---|---|---|
| latitude | within ±15° of the landing site and ±60° absolute | up to ±80° (polar limit) |
| longitude | within ±15° of the landing site | up to the landing site's antimeridian, no wrap |
| approximate extent (seed `PLANET-B0-A`, landing at 38.3°N) | about ±268 regions east-west, 683 north-south | about ±3,213 regions east-west, 3,641 north-south |

There is no wrap, so terrain is never repeated: the far side of the map is an edge rather than a seam. Regional origins are validated up to the planet's circumference. The atlas refuses to mix Worlds of different projections. The preparation cache key includes the projection. The crossing refusal now says whether the polar limit, the far side of the map, or a historical world's original boundary is ahead.

Climates become genuinely different. Measured mean land temperature on seed `PLANET-B0-A`: landing site 0.35, subpolar (≈70°N) 0.22, equatorial 0.55. Regional founding responds with different communities: lichen crawlers, burrow voles and highland GenVo in the north; dune skippers and sage browsers in hot dry equatorial land; jungle browsers, fruit peckers, mire wallowers, humid foragers and leaf rotters in warm humid lowlands.

## Verification

`tests/continental-projection.mjs`:

- descriptor versions and rejection of unknown ones;
- identical terrain in the original window;
- the `/1` boundary, the polar limit and the antimeridian edge;
- distinct climates at three latitudes;
- a historical `/1` world keeping `/1` through preparation, a real crossing and save/restore;
- new worlds using `/2`.

The border-terrain test checks the `/1` edge. Existing geography, E14/E15, walkthrough, preparation, records, direct-restore and founding tests pass.

## Limits

- **Distortion:** the mapping keeps the landing latitude's east-west scale everywhere, so terrain is stretched east-west toward the poles (about 3× at 75°). A distortion-free paging projection would be a later version.
- **Poles:** ±80° is a hard limit; polar caps are not traversable.
- **Ocean:** marine regions have no founded food web.
- **Hydrology:** large distances use the same macro hydrology grid (512×256), so continent-scale rivers are coarse at high resolution.
- **Unmeasured:** natural long journeys and their performance.
