# GenVo v1.71.0 — Creature form and limb art revision (development)

This checkpoint responds to the creator's request to **upgrade actual creature-part artwork**, not expand the part catalog or invent fixed species templates.

## Scope and creative boundaries

- Reworked **nine existing torso source packs** (`small`, `soft`, `reinforced`, `sleek`, `light`, `stout`, `barrel`, `dome`, `long`) and **eight existing two-bone limb packs** (`walking`, `spring`, `grasper`, `runner`, `sturdy`, `webbed`, `padded`, `digging`).
- Each remains **32×32 native RGBA**, with **eight facings × two authored states** and exact original part IDs, root anchors, and limb-rig rectangles. This was a visual revision, **not** an animation-system completion or an eight-frame character animation suite.
- Distinct alpha silhouettes and purposeful highlight / midtone / shadow clusters replace the more uniform round body forms and straight rod limbs. Digging claws, webbed feet, padded feet, runners, graspers, and spring anatomy use different small-scale contours.
- Palette substitutions continue to preserve all five creator-directed skin tones (ink, shadow, base, light, glint); specialized keratin, bone, water, and other protected details retain their art colors.
- Existing `assets/art/catalog.json`, the compiled native atlas, Creature Lab, and one shared creature-rendering/biology pipeline remain authoritative. No new species IDs or new biological capabilities were added.
- Original human creator artwork in `Original (human) arts/` and the stable-release provenance manifest remain unmodified. These 17 images were **AI-assisted pixel drawings** implementing the creator's art bible; they have **not** been accepted as final art.

## Inspection and reproducibility

- Artist source: `assets/art/parts/<part>.json` and the associated PNG; runtime form: `<part>.indexed.json`.
- Repeatable art update script: `python tools/upgrade-native-creature-art-v171.py` (regenerates these 17 **development candidate** sheets; do **not** invoke on user-revised candidates without approval).
- Catalog build: `node tools/build-native-part-art.mjs`
- Full registry/frame check: `node tests/native-part-catalog.mjs`
- Added art-shape and joint-region validation: `node tests/native-forms-quality-v171.mjs`
- Art contact sheet: `references/generated-native-parts/native-forms-review-v171.png` (nearest neighbor, not gameplay).
- Actual assembled gameplay renderer capture: `docs/runtime-v171-creature-review.png`; actual browser capture of gameplay: `docs/runtime-v171-gameplay.png`.
- Existing Creature Lab browser flow tested with `sturdy-leg`, both frames accessible and temporary creature-preview installation functional.

## Still unfinished

The whole-creature experience still needs stronger motion-dependent silhouettes, individual expression and connection between adjacent limbs. Two idle/micro-motion frames per part are not complete cinematic animations. No static screenshot certifies creature motion, save persistence on a deployed hosting platform, or final creator visual quality acceptance. The current inherited reproductive/ecology test defects remain outside this purely visual pass.
