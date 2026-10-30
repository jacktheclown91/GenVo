# Ground detail from real moisture and vegetation

The seasonal ground layer could paint green spring shoots on bare cells and frost during a warm regional winter. It now conditions those decorative marks on actual standing foliage, soil water and canonical local temperature. Fungal biomass does not count as green foliage. Existing edible plant amounts and their rendered bodies are unchanged.

`src/render/parched-ground.js` reads soil moisture relative to the existing field capacity/wilting point, standing biomass, snow cover and finite overland surface film. Low available water produces restrained desiccation marks: fissured treatment on more retentive ground, scuffed grains on less retentive ground, with warm/cold earth tones. These are visual interpretations, not new physical cracks, materials or substrate rules. Biomass reduces their strength but is not treated as a solid occlusion mask; the actual plant layer hides ground naturally. Water cells, substantial surface film, wet soil and snow suppress the paint. Absolute seeded anchors vary direction without tile-edge overflow or RNG use.

Both existing live and cached seasonal-ground calls pass the actual climate. Existing terrain refresh/chunk/pool ownership remains: nearby live details read current fields; distant cached surfaces retain the established refresh policy rather than forcing a new full-map rebuild. No per-frame bitmap assets, plant loss, hydrology, channel ownership, stock, ecology, save or collision changes.

## Evidence

- `tests/parched-ground.mjs`: actual eligibility, no bare/fungal spring shoots or warm frost, real wetting/snow/surface-film exclusion,512 deterministic native tile paints, regional anchor equivalence, exact bounds and complete saved-graph parity.
- Existing seasonal ground, native biome substrate, architecture and canonical-source checks pass.
- `tools/review-parched-ground.cjs` uses public existing Day100 world/resident86. The final observation is Day101, seed GENVO-VALLEY-REPLAY-30, actual planetary/1 world.2,493 cells qualify; the highest recorded exposure is0.2433 with available soil-water fraction0.2157 and standing cover proxy1. This is modest stress, not an observed extreme desert.
- Matched actual gameplay and read-only16x16 terrain-survey captures use the same recorded World. The survey does not relocate an animal. Complete encoded saved state remains exact, with no browser errors. Before painting uses the retained prior identity module through a tool-only delegating export; all other terrain/plant/art code is unchanged.
- Six explicitly controlled native ground-layer fixtures show severe retentive/loose soil, rewetting, surface film, cold dry and snow suppression. They never enter Simulation and are not natural climate/vegetation histories. The snow fixture demonstrates suppression of the ground layer; the separate full-game snow painter is not part of this fixture.
- Final receipt/images: `parched-ground-2026-10-29/final/`. Actual survey and gameplay context and the severe controlled treatment were visually inspected. The initial native-mature failure is retained: the first implementation incorrectly treated high biomass as complete ground occlusion. Corrected weighting preserves actual soil-water gates, not the failed assumption. `verified-mature` retains the intermediate successful observation before fungal gating/directional variation; `final` covers final source.

Final short warm-render observations: prior/current medians63.5/25.7ms, p9576.3/31.6ms (12 samples each). Sequential order, existing caches and scene warm-up prevent attributing this difference to the ground patch. It is not a speed-improvement or comprehensive mature-world acceptance claim.

## Remaining C5

The full C1-C8 goal remains active. Reliable per-cell former-channel history is absent after recession (current flags/totals do not establish an old dry bed), so no dry river or lake outlines are invented. Coordinate that witness with Claude. Real extreme arid regions, seasonal hydrology transitions, drought-damaged plant physiology/art, major wet habitats and giant environmental interactions still need implementation/evidence. This package is physical-state-grounded soil detail and truthful seasonal decoration, not C5 completion or proof of a naturally hostile desert.
