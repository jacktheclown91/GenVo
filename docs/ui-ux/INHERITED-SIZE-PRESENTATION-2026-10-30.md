# Inherited size rendering — review candidate, October 30, 2026

## Scope and ownership

Parent baseline: `bb05eda54d8de4a7ab0871518adcb1359bbcd331` on `main`. This branch implements the first bounded presentation contract from `docs/PRESENTATION-CONTRACT-MORPHOLOGY-2026-10-29.md`.

Creator restored contributor ownership: Claude = simulation, persistence, gameplay, performance, testing and release; ChatGPT = UI/UX and visual presentation. Codex is inactive. **Shared renderer file requires Claude review before integration.** No merge, overwrite of an active checkout, simulation changes or public release.

## Problem

The inherited body-size rules `body-size/1` and `body-size/2` change mass, structural loading, caloric/water needs, visibility and reach in the authoritative simulation. On current `main`, `Renderer.drawAnimal` multiplies phenotype proportions by developmental growth but still draws all adult inherited sizes at the same base zoom. That makes 0.5×, 1× and 3× adults physically different yet visually almost indistinguishable.

## Fix

- Add `src/render/inherited-size-presentation.js`, a small read-only projection of the existing `adultSizeScale(animal)` biological authority. No second size value or mutable state.
- Preserve the renderer's existing visual-growth factors. Multiply only the missing adult inherited factor, **not** `currentScale`, because that would apply developmental growth twice.
- Apply size through `ctx.scale(inheritedScale,inheritedScale)` after camera positioning, leaving the pixel art's original raster `scale=this.zoom` and the existing bitmap/scratch/batch atlas dimensions untouched. This specifically avoids allocating different sprite canvases for each continuously inherited size.
- Give the existing stride timing the same inherited scale so a large body's planted toes can cross more distance before another gait cycle. No movement or physics changes.
- Extend the viewport-culling margin proportionally for giant silhouettes: reference animals retain the original two-tile margin; inherited 3× bodies can remain visible near viewport edges.
- The same `drawAnimal` path serves active animals and remote regional read-only facades. Existing screen bounds are transformed with the same 2D context, so UI avoidance grows with the pictured animal.

## Implementation safety

No changes to `src/sim`, animals, genetics, world rules, saved formats, gameplay action radius, physical collision, authored sprites, indexed art, animation state ownership or RNG. No new UI control surface or speculative state. Do not fake biological scale by copying or modifying `animal.bodySize`.

## Focused evidence

Connector-side inspection of source from this branch, executed actual `adultSizeScale` and `bodyDimensions` implementations with the small projection, and verified 0.5×, 0.75×, 1×, 1.5×, 2× and 3× sizes at 0.2, 0.55 and 1 developmental growth, plus gait length, culling margins, legacy identity and no mutation (53 checks). Full renderer and the new test parse under V8 after separating module imports.

**Important evidence boundary:** This is **not** a run of the repository's full `node tests/inherited-scale-presentation.mjs` or its current playable gate. The connector environment cannot run the complete game/browser. Do not report it as a Chromium acceptance, human art review or performance certification.

## Required verification before merge

1. Run `node tests/inherited-scale-presentation.mjs` and current `tools/check-playable.mjs` on Node 22 and 24 in an actual checkout.
2. Render an ordinary founder, 0.5× body, naturally or deliberately constructed 1.5×/2× body and 3× adult, plus one juvenile of each under the **actual running game renderer**. Verify the visual ratio against `bodyDimensionsOf` while avoiding double growth.
3. Capture actual game screenshots at 2×/3×/4× zoom, 1920×1080, 1366×768, 800×600, phone portrait and short-height embedded, with giant creature partly outside the viewport.
4. Verify creature selection and actor/target UI avoidance use transformed `screenBounds`, including airborne and underground presentations.
5. Stress with multiple distinct inherited sizes in one scene and in a mature region. Measure sprite preparation/compose p95/p99 frame times, memory, atlas overflow and GPU copy stalls against the exact main parent and test both `?spriteBatch=0` and default.
6. Compare real ancestral saves without body size: same pixels and gait cadence expected. Confirm genome, RNG, movement, species recognition and saves remain value-identical.
7. Listen/look for any unwanted scaled HUD markers, flight/climb/dive labels or apparent jump altitude at 3×. If world-distance offsets are mis-scaled, separate those transforms in a follow-up before merge.
8. Reconcile newest `main` and Claude's uncommitted edits before any shared-renderer integration. Confirm creator's visual acceptance.

## Next visual milestone

After this branch is approved and measured: gait lean/skid from `motionStateOf`, tissue strain from `structuralViability`, dormancy/frill expression from `aridExpressionOf`, and day/night from `dayPhaseOf`. Each remains its own reviewable implementation with exact browser evidence.
