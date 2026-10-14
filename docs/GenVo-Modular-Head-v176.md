# GenVo modular head base — v1.76 development pass

Implemented in the current source, extending the existing registry, graph, native-art codec, assembler, gameplay editor and Creature Lab. This is one neutral head base, not a new creature preset or species rule.

## Structure and ownership

- `head-base` is the 79th registered anatomy part and has native editable 32x32 art: eight facings, two frames, inherited five-tone skin pigments.
- Every torso owns a `head` attachment socket. The head owns its mouth, primary eyes and secondary-eye sockets.
- `src/render/head.js` owns head pose, facial socket positions, native drawing and the no-canvas fallback. Inline head artwork/size rules were removed from the whole-creature drawer.
- The prepared indexed renderer uses one shared surface routine for torso and head rigs. Head preview uses the same authored timing as the other native components.
- `src/lineage/head-plan.js` owns structural attachment/detachment. Adding the head reparents existing facial organs and descendants without manufacturing new organs. Detaching restores compatible organs to the torso; unsupported sockets reject the operation without losing parts.
- Headed graphs reject torso-owned facial organs, preventing ambiguous or duplicate head/body faces. Editors hide those invalid torso facial targets while exposing the head's own connections.
- The gameplay editor has a Head category, correct nested mirroring, attach/remove/undo and native thumbnails. Creature Lab uses the same graph helpers and installed native catalog.

## Compatibility and biology

Old body plans retain their exact graph IDs and serialized structure. Their previously implicit head is rendered through the new shared component as a compatibility default. Existing founders are not silently rewritten, and new worlds continue using the established founder biology. Explicit heads enter the graph through the existing editing/authoring paths.

Headless anatomy is supported with `headMode: torso`: mouth/eyes attach directly to the torso and no default head is drawn. The explicit absence participates in canonical identity, draft editing, inheritance and serialization. This avoids confusing a deliberately headless body with an older graph that omitted the formerly hardcoded head.

The first head base has zero mass, upkeep, mutation cost and action capabilities. Moving an existing facial organ between its torso/head socket is a neutral structural conversion, not purchase/removal of that organ. Ordinary removal pricing and the established editor opportunity gate remain in effect.

Nested mouths and eyes remain visible to the canonical capability, diet, freshwater and aquatic readers. Head attachment preserves the tested functional coefficients. Jaw trait reconciliation edits the actual mouth parent. Whole head subtrees pass through existing recombination and actual newborn inheritance. This does not replace the remaining founding-species biology, introduce advanced head variants or provide free unrestricted body editing.

## Verification

Passed: modular-head-v176, native-part-catalog, indexed-part-renderer, native-anatomy-rig, native-anatomy-depth, native-inherited-pigment, native-contact-expression-v174, organic-creature-presentation-v175, motion-render, socket-layout, evolution-draft, parts-wave1, parts-wave2, observed-creature-guide-v175, discovery and canonical-source-audit.

The head-specific check covers neutral functional parity, old founder ID stability, attachment/detachment/undo, rejected detach preserving organs, Creature Lab parity, 192 inheritance crosses, actual newborn inheritance, all eight directions and save round-trip. Catalog coverage is 79 assets / 1,264 exact source/indexed RGBA frames. The catalog assertion derives the required count from the registry rather than the obsolete hardcoded 78; full 16-frame coverage and no missing/orphan parts remain required. Socket checks were updated for the newly authored torso head mount.

Two other suites still fail:

1. `part-abilities.mjs`: the digging-context fixture gets `E · Drink water` where it expects `Dig for roots`.
2. `founder-body.mjs`: an old-save rejection assertion expects the obsolete phrase `earlier GenVo8`; the implementation already says the save predates GenVo's modular bodies.

Both failures recur in `reports/head-v176-prior-contract-check/` with the prior registry and root-only organ readers restored. This is a bounded reconstruction of those prior contracts, not a pristine historical checkout. Neither assertion was skipped or weakened; no full-suite-green claim is made.

## Runtime evidence

- `runtime-v176-legacy-compatibility.png`: a fresh world before explicit head staging, using its original graph structure and the new shared default head renderer.
- `runtime-v176-gameplay.png`, `runtime-v176-gameplay-close.png`, `runtime-v176-moving-creatures.png`: actual game renderer with explicitly headed inherited bodies.
- `runtime-v176-motion-review.webm`: moving-world and assembled-review recording.
- `runtime-v176-proof.json`: actual mounted head and three facial organs parented to `root/head`; relabeling the same anatomy with an unknown lineage changes zero native channel values.
- `runtime-v176-head-lab.png`, `runtime-v176-head-lab-assembly.png`: real head attachment, native source opening and temporary art installation in Creature Lab. The assembly crop hides socket guides for visual review.
- `runtime-v176-head-lab-proof.json`: native head frame count and successful art installation status.
- `runtime-v176-errors.json`: no page errors in the final browser verification.

The gameplay harness deliberately attaches heads to 196 living animals using the canonical helper as a controlled review fixture. It does not prove automatic migration or that all fresh-world founders already have explicit head nodes. The enlarged overlay uses live anatomy with controlled palette/facing/phase, and is separate from the in-world screenshots. Artwork remains a development candidate awaiting creator review.

Reproduce: `python tools/author-head-base-v176.py`, `node tools/build-native-part-art.mjs`, `node tests/modular-head-v176.mjs`, `node tools/capture-modular-head-v176.cjs`, `node tools/capture-head-lab-v176.cjs`. The author command replaces only the development head source candidate; review later creator edits before rerunning it. Original human artwork and the stable release-provenance manifest remain untouched.
