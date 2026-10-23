# Terrain repetition correction â€” October 23

The creator's crop showed rows of grass combs and repeated green rectangles. They came primarily from `drawHabitatClusterAccents`: a legacy procedural layer duplicating plant stocks already drawn by the native vegetation layer. That duplicate layer now paints nothing through its retained compatibility hook. Native plants, genuine resources, canonical food targets, sensory clipping, shoreline paint, biology and saves remain authoritative and intact.

Retained indexed dry/cold/rock artwork no longer repeats on a fixed two-tile cycle. A slow, world-space coordinate map samples the same four source cells across tile boundaries, computing warp corners once per tile. Material weights still derive from actual moisture, temperature and elevation; no terrestrial substrate paints actual water. Minor plant anchors span the cell interior rather than a three-row strip, and use the same exported anchors for food picking. Authored top-down tufts receive stable quarter-turn variation. Palette category offsets are smoothly reconstructed from the same physical fields.

## Evidence

The four `before/after-*-gameplay.png` files and `receipt.json` are actual 1250Ã—850 gameplay renderer captures at 2Ã— zoom with the shared renderer source **unchanged**. The location called meadow in the probe is actually a generated wetland (recorded in setup); the rock site is a highland grassland. Real generated terrain and canonical founders were installed through the existing load route. Only observer position was staged to legal nearby land. No climate, stock or anatomy values were rewritten. Paint clock was fixed and application RAF stopped for the paired observation. Full canonical snapshot graph equality held across every before/after stage; no browser errors.

Earlier full candidates in the raw archive also include dry and cold terrain and a proposed renderer patch. They are not substituted for the committed-module proof. The image in the creator's report is feedback, not newly fabricated runtime evidence.

Nine focused checks passed in `final-checks.json`, including native substrate provenance, new texture continuity and plant-anchor bounds, existing habitat/flora rendering, view modes and public export. The initial canonical audit lacked its ignored reference-sheet manifest; regeneration through the standard exporter resolved that prerequisite. `canonical-audit-final.json` has no errors. No receipt was rewritten to hide the initial result. Existing tests were not weakened. Retained original native art and source hashes are unchanged.

## Shared integration handoff

The creator selected checked-in handoffs and patches. `docs/art/GENVO-V1-PRESENTATION-PLAN.md` records the dependency order and ownership. The narrow `assets/art/production-review/terrain-continuity-v1/renderer-integration.patch` is prepared for Claude; it was **not applied** to shared main. It replaces random rectangular base-grain brightness and removes two redundant static-ground rectangles. The patch needs coordinated integration and renewed actual-runtime verification against Claude's current source.

This pass visibly removes the identified duplicate planting grid. It is not a claim that all remaining repetitive terrain, water or plant shapes are finished, nor creator approval. Further renderer work and the broader GenVo v1 milestone remain open.

## Performance

A longer ABBA/BAAB run used 400 warm measured draws per stage (3,200 total), the fixed paint clock, stopped RAF and drained terrain queue, while preserving the full snapshot graph. Mean CPU draw time was 14.295 ms before / 13.663 ms after; stage-averaged medians 4.750 / 4.375 ms and p95 57.950 / 54.275 ms. Cold cache draws averaged 823.7 / 891.45 ms: a measured +67.75 ms cold-build cost in this small, noisy sample. It is not a live frame-pacing or GPU-completion proof, and the game retains unrelated renderer/simulation stalls. The first short sample had noisier means, so it remains in the primary receipt instead of being overwritten. Performance recording changed no rendering work or test budget.

Original source and raw exploratory captures remain in the original repository's local raw archive. The new public GenVo-v1 migration should select justified runtime assets and authoring provenance, not copy this evidence packet blindly.
