# 06 — Integration Plan, Milestones & Acceptance Gates
**Status:** PROPOSED work order; preserve the canonical working build and gameplay.

## Architectural guardrails
- Keep **one canonical toolkit/source** and produce one public build from that same source. This document package is source additions only; no parallel runtime or extra toolkit.
- Evolve current `PartRegistry`, `BodyPlan`, phenotype, editor and renderer by bridges/adapters. Avoid a duplicate species-physics authority or a 'god animation script'.
- No full renderer rewrite until an integration slice proves anchors, palette, motion and saving through the game.
- The simulation is the authority for speed, attack damage, locomotion legality, thirst/temperature, AI behavior, reproduction and progression.
- Record creator design decisions and their implementation in existing provenance workflow. Preserve user-provided stalk-eye example as creator reference.
- Include creator review/approval of major art changes. No prototype screenshot described as final artwork without user acceptance.

## Phase 0 — freeze, map and instrument (REQUIRED)
1. Start from latest passing canonical source snapshot (uploaded toolkit may now be stale).
2. Regenerate inventory of current parts/sockets, existing hardcoded species branches, render paths, body plan save schema, art assets and editor call sites.
3. Confirm baseline real runtime screenshots, frame timing, regression suite and reproducible organism/seed fixtures.
4. Create versioned ArtRegistry **mapping** to PartRegistry IDs, not duplicate source of biological effects.
5. Publish baseline art/parity matrix and migration checkpoints; preserve original art as rollback reference.

**Gate P0:** matching source and release identity, terminal tests and screenshot proof, no source file deletion.

## Phase 1 — first fully authored modular slice
Select `small-torso`, one `walking-leg` or `runner-leg`, one feeding mouth, and creator-inspired new **stalk eye** (new part only if compatible with guided evolution). Implement separate 32px transparent art, masks, root anchors, proper joint spec, dynamic attachment and eight facings. Show art and construction in existing editor and gameplay.

**Gate P1:** no duplicated embedded eyes; attachment marker invisible at runtime; no disconnections/clipping at any facing; at least three compatible assemblies render correctly; gameplay stats unchanged unless explicitly connected to new biology.

## Phase 2 — part-owned animation and locomotion coordination
Build declarative joint definitions, clip curves, action requests and a shared gait/contact resolver. Use per-part motion graphs and explicit stance locks; preserve authoritative movement.

**Gate P2:** leg plants/replants correctly in idle, forward/back movement, turns, attack/recoil and slopes; eye stalk independently blinks/tracks; other part motion does not suppress locomotion; whole body does not rely on sine wobble.

## Phase 3 — inherited color and surface biology
Introduce one region-mask system, first 3 material treatments (hide, fine scales, heavy chitin/armor) and first 3 palette families, then expand. Color/pattern genotype and expression integrate with heredity and ecological selection *without* class-based color bonuses.

**Gate P3:** three related organisms retain recognizable pigments across generations; materials follow joints, camouflage test uses actual vision and biome contrast; changing paint alone cannot grant bite power.

## Phase 4 — complete existing part families
Convert all CURRENT registered parts in logical waves: bodies, limbs, mouths, eyes; tails/fins/defense/offense; metabolism/social/secondary spurs. Catalog with readiness state `REGISTERED`, `ART_REFERENCED`, `ASSET_AUTHORED`, `RIGGED`, `INTEGRATED`, `RUNTIME_VERIFIED` (not a binary 'done').

**Gate P4:** all current registered parts have traceable art behavior (some purposely static), correct socket, masks, warnings for missing art and runtime screenshots. No placeholder represented as finished.

## Phase 5 — wildlife/special parity and inheritance
Move current named wildlife through same body assembly and action solvers. Preserve recognizable historical abilities only where they arise from parts/physiology/experience; convert rare/full-silhouette cases to recipes. Verify reproducing populations and lineage divergence.

**Gate P5:** physically equivalent organisms are equivalent across named types; every special creature is a valid modular blueprint; offspring show inherited anatomy/color; no full-body identity drawing overrides.

## Phase 6 — polish and release validation
- run complete automated suite with terminal results; no claim of a full pass from partial focused checks;
- run world ecology/reproduction persistence on multiple declared seeds while renderer and AI interact;
- validate new 32px art at actual gameplay scale and across forests, deserts, water, night and snow backgrounds;
- actual moving footage of locomotion, editing, combat/eat/sleep/swim/contact, eight facings and special creatures;
- compare frame pacing and memory with baseline in scene with many distinct multi-part organisms;
- test paused/resumed, saved/loaded, migrated bodyplans/palette genes, fallbacks/missing art, web build and toolkit packages from identical source.

**Gate P6:** no gameplay or performance regressions, creator visual approval, source + public package aligned, provenance updated. The game is not release-ready on focused checks alone.

## Required automated validation groups
Authored animation slices also require [shared-state expression acceptance](10-SHARED-STATE-AND-EXPRESSION.md): anatomy-specific responses, mixed-signal arbitration, action/contact safety, deterministic recovery, palette preservation and measured many-creature runtime behavior. This is a design requirement, not current runtime proof.

All authored-part milestones also require [palette preservation acceptance](09-PALETTE-PRESERVATION.md): exact identity round trip, unchanged alpha/coverage, retained shading/detail, and unchanged animation across every frame and facing. This applies from the first authored slice, before inherited color expansion.
1. `art-catalog`: every referenced part has valid asset paths or explicitly pending fallback; alpha, dimensions, masks, checksums, version.
2. `socket-geometry`: per-body unique physical site, side mirror, pixel/world transform invariants, capacity and collision-overlap.
3. `rig-safety`: joints only use documented DOFs, no NaN angles, clamp extreme commands, joints never detach, no unsupported locomotion grant.
4. `pose-8dir`: snapshot every supported action in eight facings, testing near/far rendering, eye orientation, asymmetry and dynamic bounds.
5. `foot-ground`: stance world-space lock / release on slopes and real movement; no phantom legs.
6. `color-genetics`: stable coloration, cross-generation variation, no role bonus, color vision/contrast audit.
7. `material-coverage`: scale/armor localization, stable animation masks, physical hits affected only where covered.
8. `species-neutrality`: no fixed species renderer override; capability parity for equivalent body plans.
9. `save-inheritance`: old and current valid body plans, mutation budget, offspring rigs and palette persist correctly.
10. `runtime-perf`: near/medium/far LOD correctness; no new action lag; real long-form ecology and gameplay testing.

## Review board data for every part
`partId`, `family`, `currentCodePath`, `authoredArtPath`, `nativeSize`, `rootAnchor`, `joints`, `states`, `paletteMasks`, `materialMasks`, `8dirStatus`, `inheritanceStatus`, `gameplayStatus`, `performanceStatus`, `runtimeScreenshot`, `reviewerApproval`, `version`. No pass without evidence; remember the user's 32px stalk eye represents intended art fidelity, not the present catalog quality.

## Stop conditions / rollback
Immediately stop a pass if: living creature visual drifts from physics/hitbox; saved body plan silently changes meaning; creator's special features disappear; parts are clipping or camera occlusion regresses; frame pacing drops below verified baseline; art script makes biology depend on palette choice; or source release cannot be reproduced. Fix or revert the smallest pass, never paper over with passing test threshold changes.
