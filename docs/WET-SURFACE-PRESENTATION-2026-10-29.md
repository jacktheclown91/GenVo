# Wet surface presentation — October 29

Rain now makes sparse native pixel impacts on actual exposed liquid water. Warm overland water films receive restrained earth-toned highlights, and damp soil receives darker substrate patches using the existing available-water reading. Films disappear immediately when their inventory is depleted. These marks render beneath snow, vegetation and creatures; underground and submerged observer views exclude the live surface layer.

## Source and authority

`src/render/wet-surface-art.js` reads `atmosphereAt`, `surfaceIceCovered`, `liquidVolume`, `snowCover`, and the existing soil reading. `renderer.js` calls it within the existing visible ground pass. `identity.js` adds cached damp soil. Existing water glints also stop when an owned water inventory is depleted. No hydrology, water masks, organism state, resources, save format, rainfall or biological events change. An overland film never becomes a pond or drinkable source.

Rain marks retain the native half-art-unit pixel grid, absolute-coordinate continuity and paused-clock identity. Work is bounded to 64 impacts per frame (24 in low detail) and 1,024 cached tile readings. Nine shared immutable 9-by-7 canvases use 2,268 base RGBA pixel bytes; this excludes browser object overhead. Native controlled review observed zero additional canvas allocations across 30 repeated frames. Shoreline masks use an exact clipped fallback. Cached damp-soil updates retain the existing terrain refresh policy, including delayed distant refresh; only live film removal is immediate.

## Verification

Focused checks passed: `tests/wet-surface-art.mjs`, `tests/water-surface-art.mjs`, `tests/parched-ground.mjs`, `tests/seasonal-ground-art.mjs`, `tests/native-biome-substrates.mjs`, `tests/canonical-source.mjs`, and `tools/architecture-check.mjs`. Changed JS/MJS/CJS syntax and whitespace checks passed. The new tests cover actual rain, inventory depletion, snow/ice/phase exclusions, observer exclusions, native mask clipping, regional coordinate continuity, bounded caches and exact complete simulation snapshot graph preservation.

Native evidence lives in `wet-surfaces-2026-10-29/final/`: public New World loaded the recorded mature valley, Day 101, seed GENVO-VALLEY-REPLAY-30. Matched gameplay and actual-world shoreline survey before/current captures preserve the complete simulation graph. No weather, terrain, resource or organism state was altered to strengthen the demonstration. The world contained 162 rain-eligible water cells, 535 stored overland films and 14 high-available-water cells; these inventory counts do not imply that every cell received visible marks. The selected weather had liquid precipitation 0.1054, and the captured shoreline phase showed two impacts. This is modest rainfall, not natural severe-storm acceptance.

The final alternating warmed render observations (18 frames per state) measured median 21.5 ms before and 22.8 ms current; p95 40.6 and 36.2 ms respectively. The approximately 1.3 ms median increase is a local CPU render observation, not full performance acceptance or a frame-rate guarantee. Cached soil was retained in both timing states to isolate the live layer. Initial and intermediate receipts remain under `native/` and `stamped/`, including the initial slower implementation that prompted shared-stamp optimization. The first survey had incorrect vegetation padding; the final survey corrects it.

`controlled/` separately demonstrates dry/damp soil, stored/spent film, rain on liquid water, and cold film. These are explicitly controlled native layer fixtures, not natural habitat or gameplay ecology proof. The final surface captures precede the additional observer exclusion; focused tests verify that exclusion, with no change to the captured surface path. Subsequent formatting changes are behavior-neutral.

## Remaining scope

This is bounded C5 implementation, not completion of C5 or C1–C8. Broad wetland/rainforest/coastal/underwater habitat quality, natural extreme weather, giant environmental layering and comprehensive mature-world performance/creator acceptance remain open. Water topology and physical pond recession remain Claude-owned; stopping glints does not establish complete pond disappearance. Former river/lakebed history is absent and no fictional dry channels were painted. The existing 32px creature default and optional detailed artwork are unchanged.
