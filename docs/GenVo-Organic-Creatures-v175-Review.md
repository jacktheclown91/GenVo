# GenVo organic creature anatomy and motion review

This development pass follows phase 1 of the creator's supplied expansion priorities: coherent living creatures assembled from functional inherited anatomy. Emergent speciation and inherited reproductive compatibility remain subsequent architectural work.

The v1.74 screenshots fail a strict organic-animal assessment. Broad rectangular limbs resemble paddles or toy components; eyes read as bright buttons pasted onto disc heads; serial surface tiles fragment the creature; tails balloon around their mounting point; duplicate procedural toes create block feet. The old circular foot sweep and synchronized atlas paint do not convincingly convey a supported body. More opaque pixels did not solve these problems.

## Authored revision

35 existing modular assets were re-authored: nine torsos, eight articulated limbs, nine eye types and nine tails. This is 560 native directional/expression frames. The full catalog remains 78 parts, each with eight facings and two native source frames. The revision retains native 32x32 sources and the canonical indexed compiler.

Muscle volume now narrows toward tendons and ankles, with anatomy-specific skin folds, fascia and smaller distal feet. Eye apertures sit inside skin and lids; compound-eye active frames retain facets rather than borrowing a vertebrate blink. Torso planes show softer tissue, folds and rounded undersides. Tails taper away from their root instead of centering a swollen sprite on the socket. Gape and sucker mouth display scales were corrected. Original Pix2D and GIF reference files were inspected and remain untouched.

The gait is a continuous two-bone pose with one recovery swing and a longer support phase. Feet return along the direction of travel; upper/lower joints remain connected to the inherited socket rig. Distance-driven cadence uses inherited limb proportions for both player and autonomous presentation. This improves contact timing; it is not persistent physical world-space foot locking. Native limb flex paint follows individual feet. Native feet no longer receive a second procedural foot overlay. Head proportions and overlapping layers were reduced, and blink state is included in the sprite cache key.

## No fixed creature artwork

The live renderer uses one assembled-anatomy path. Founder species IDs no longer choose whole-creature sprites, scale overrides, special palettes, species markings or body-language emphasis. Visible pigmentation comes from inherited phenotype values returned as RGB hex, fixing the previous HSL/native-ramp mismatch. Morphology governs movement emphasis and ground-contact cues.

The Field Guide now presents the current player and actual observed body plans, genes and proportions. Immutable appearance observations survive save/restore. It does not synthesize preset founder or rare-creature portraits. Existing recognized lineage names are used when available; an unnamed observed specimen is not falsely declared a new biological species.

Current sprite exports load native art and draw actual seeded runtime animals, selected by distinct inherited body-plan IDs. Legacy fauna drawing remains only for historical evidence and older presentation tests; the source authority manifest classifies it accordingly.

This does not eliminate fixed biological rules or founding population templates in organisms/species.js, organisms/wild-bodies.js and the simulation/reproductive/ecology authorities. Those remain the explicit phase-2 gap from the creator's roadmap. No reproduction, movement authority, resource, mutation or species-recognition rule was changed by this visual pass.

## Evidence and limits

Inspected final Chromium gameplay, enlarged live-animal assemblies, and observed Field Guide screenshots. The enlarged overlay uses controlled facing/palette and animation phase with actual runtime body plans; it is a rendering review, distinct from the gameplay screenshot. Before/after frames use different gait phases and are not a frame-matched visual measurement.

- organic-creatures-before-after-v175.png: preserved v1.74 versus revised v1.75 runtime assemblies.
- runtime-v175-gameplay.png and runtime-v175-gameplay-close.png: actual world presentation.
- runtime-v175-moving-creatures.png and runtime-v175-moving-creatures-next.png: different continuous pose samples.
- runtime-v175-motion-review.webm: recorded running gameplay and assembled motion review; this is review evidence, not motion signoff.
- runtime-v175-observed-field-guide.png: observed anatomy portrait flow.
- native-organic-anatomy-v175.png: native source contact sheet, not gameplay.
- runtime-v175-proof.json: native pixels remain identical when the same inherited anatomy is relabeled with an arbitrary unregistered lineage ID (zero differing channel values, 2,404 opaque pixels).
- runtime-v175-errors.json: no browser page errors.

All 78 assets loaded in Chromium; the inspected world began with 196 living animals. Focused checks passed: native-part-catalog, native-forms-quality-v171, native-limb-detail-v173, native-face-expression-v172, native-anatomy-rig, native-anatomy-depth, native-inherited-pigment, indexed-part-renderer, socket-layout, native-contact-expression-v174, organic-creature-presentation-v175, observed-creature-guide-v175, discovery, motion-render, player-motion-presentation, behavior-readability, render-cache, world-swap-render, sprite-sheet-export and canonical-source-audit. Existing density and distinct-expression checks were retained; asset failures found during authoring were repaired in the assets.

All 256 creature cells in the newly generated reference sprite sheets are non-empty and have clear clipping margins. The 20 unchanged flora cells are non-empty, but the existing flora exporter touches cell edges in 12 samples; flora clipping is not claimed resolved by this creature pass. The current exporter contract was updated explicitly because the old check required a retired fixed-creature renderer; it now requires native catalog loading, actual body-plan samples and the shared current renderer.

Strict final judgment: the new core anatomy is more tapered, continuous and coherent than the baseline. It is not final visual approval. Some untouched mouths, dorsal structures and specialized attachments still have ornamental or block-like shapes. The native pack still contains two authored microstates, not a complete eight-frame raster action suite; smooth locomotion comes from the continuous rig. Body-material nuance and convincing behavior-specific locomotion still have room to improve.

## Reproduction and preservation

Author: python tools/author-organic-anatomy-v175.py
Compile: node tools/build-native-part-art.mjs
Runtime review: node tools/capture-organic-creatures-v175.cjs
Export: node tools/export_sprite_sheets.cjs references/generated-organic-sprite-sheets-v175

The author script replaces the development candidate packs. Original v1.74 sources, previews, compiled pixels and screenshots are preserved under reports/organic-creatures-before-v175/. Do not rerun it over later creator edits without reviewing/backing up those edits. The stable release-provenance manifest is unchanged.
