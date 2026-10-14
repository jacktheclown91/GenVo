# GenVo v1.72.0 — Face Art and Expression Review (development)

**Creator direction:** Continue upgrading existing creature-part art at native 32×32 quality. The creator has **not approved final visual quality**. Do not treat asset coverage as aesthetic acceptance.

## Scope and results

- Refined **16 existing parts**: simple-eye, wide-field-eye, hunter-eye, tracker-eye, stalk-eye, compound-eye, glow-eye, display-eye, grazing-mouth, tearing-jaw, crushing-jaw, kernel-beak, reed-sieve-mouth, filter-mouth, sucker-mouth and gape-mouth.
- Each asset retains **eight directional views, two authored expression frames, its original part ID, pivot and display scale**, exact native RGBA pixels and semantic inherited-skin/protected-detail colors.
- Updated the native-art renderer to support an explicit animation-frame choice, without introducing a second anatomy or gait system.
- Blink/squint signals select the native closed-eyelid frame; feeding/drinking mouth-open signals select the active mouth frame. When art is not available, preserve the original procedural fallback. Fixed the double-drawn generic mouth when a native mouth is installed.
- Biological capability, genetic inheritance, part costs, reproduction, creature movement rigs and species ancestry were **not changed**.
- Existing human creator references are unchanged. The art generation script creates/editable AI-assisted candidates and does not claim human illustration authorship.

## Verified

- `node tools/build-native-part-art.mjs`: 78 native packs compiled with exact native RGBA identity.
- `node tests/native-face-expression-v172.mjs`: 16 distinct structures, 128 distinct expression transitions and explicit frame-selection behavior.
- `node tests/native-part-catalog.mjs`: all 1,248 frames verified.
- Indexed renderer, rig/depth, pigment, creature assembly, Creature Lab assembly and world-save regression tests passed.
- Chromium source run: 78/78 installed, all 16 assembled examples valid, new world launched, no page errors or missing requested assets.
- Chromium Creature Lab: tearing-jaw selected, edited/previewed successfully with both frames.
- Reference captures: `docs/runtime-v172-creature-review.png`, `docs/runtime-v172-gameplay.png`, `docs/runtime-v172-creature-lab.png`. Source review contact sheet: `references/generated-native-parts/face-expression-review-v172.png`.
- Existing `tests/animation.mjs` has an **inherited obsolete textual assertion** requiring `nearLegs.push(leg)`; it fails unchanged on v1.71.0 as well. This art pass does not rewrite unrelated historical tests to manufacture a passing result.

## Not claimed

- No claim that the art is creator-approved, that silhouettes are final, or that gameplay is visually polished. At gameplay zoom the limb stacks remain crowded and some facial detail is small.
- No claim that an external deployed browser has validated persistence. Chromium capture uses an intercepted-asset local test harness; save round-trip and IndexedDB contract have separate tests.
- Stable-release provenance has not been promoted; this is a development checkpoint.

## Further work

- Creator review of the 16 face assets at 1× gameplay scale before broad replacement.
- Better limb continuity, individual gait silhouettes and coherent head/body proportions on moving creatures.
- Extend expressive animation only once more gameplay state transitions are verified in live action, without hardcoded species-specific pose overrides.
