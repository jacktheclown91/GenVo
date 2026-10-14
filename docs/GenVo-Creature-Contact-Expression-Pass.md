# GenVo creature contact and expression pass

This focused development pass builds on the installed detailed face and dual-row limb artwork. Eight native leg source packs received inset ankle seams, bevels, dark sole/contact planes and discrete heel highlights. The source alpha, root anchors, bone rectangles and protected claw/webbing colors remain intact; compiled indexed art and PNG previews were refreshed through the canonical pipeline.

Native eyes now explicitly select the open image when physiological blink/squint is absent. Previously, the idle atlas timer could select closed eyes despite an open physiological state. Each leg now selects contact/lift paint from its own canonical lift amount, replacing synchronized time-based texture changes. Hip, knee and foot geometry still comes from the existing gait and no simulation rules changed.

Validation: native-contact-expression-v174, native-limb-detail-v173, native-face-expression-v172, native-anatomy-rig, motion-render and native-part-catalog passed. All 78 assets and 1,248 exact source/compiled frames passed catalog validation. Real Chromium gameplay loaded 196 living animals and all 78 native assets. The capture harness records video and saves actual gameplay plus two animated assembled-renderer frames using live animals. No page errors were recorded.

Evidence: runtime-v174-gameplay.png, runtime-v174-moving-creatures.png and runtime-v174-moving-creatures-next.png in this directory; recordings in runtime-v174-video/. The enlarged assembly overlay is a renderer review, separate from the gameplay frame. It uses real runtime animals and the same drawing pipeline, with controlled facing, palette and animation phase.

Visual status: development candidate, not creator approval. Some limb contours still read as blocky when enlarged. This pass improves contact detail and expression consistency; it does not claim a complete new animation suite or final creature-art acceptance.

Reproduce: node tools/refine-native-contact-v174.mjs; node tools/build-native-part-art.mjs; node tests/native-contact-expression-v174.mjs; node tools/capture-creature-contact-v174.cjs. The contact refinement is idempotent for v1.74 sources and does not regenerate pre-existing creature art.
