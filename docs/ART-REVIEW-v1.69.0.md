# GenVo v1.69.0 — Creature depth, attachment and flank/spur art (development)

**Status: candidate art, not creator-approved.** Continue from the single v1.68 canonical source and public builds. No biological part or ability was added or modified; all 78 part definitions, inheritance, saves, ecological behavior and reproductive pathways remain governed by the same code. These changes are presentation-only.

## New 32x32 candidates

13 source-preserving, editable native RGBA art packs: seven flank forms (`armor-plate`, `venom-gland`, `storage-sac`, `gliding-membrane`, `gill-slits`, `spine-cluster`, `brood-pouch`) and six articulated spurs (`claw`, `barb`, `hook-spur`, `dew-claw`, `heel-spike`, `sensory-bristle`). Each supplies eight facings and two distinct authored frames. All are AI-assisted review artwork following the creator's modular 32px direction, not claimed human-made art or final polished assets. The original creator reference files were preserved.

The native catalog now contains **61/78** parts and **976/976 exact-source RGBA frames**; **17 parts** retain the prior procedural fallback. The review contact sheet lives at `references/generated-native-parts/flank-spur-wave-v169.png`. Editable RGBA JSON, native PNG review tiles, and compiled indexed runtime representations live beside prior assets in `assets/art/parts/`. To regenerate from a clean pre-wave source, run `python tools/generate-native-flank-spur-art.py` once, then `node tools/build-native-part-art.mjs`. The generator refuses to overwrite installed entries. Creator Lab uses the existing part catalog and edit/install pipeline.

## Rendering fixes

- `src/render/anatomy-depth.js` is a small **presentation-only** screen-space limb depth evaluator; `genvo-draw.js` draws distant appendages behind the body and near appendages ahead, ordered deterministically by hip/knee/foot positions. It does not alter gait, entity collision or navigation.
- Head paint is applied after torso dorsal details so back organs do not overlay the face during rotation.
- `part-sprites.js` now mounts tails against the actual body ellipse along the creature's heading rather than multiplying X by width and Y by height; where the torso provides an explicit `tail`, `dorsal`, or `flank.left/right` socket, that authored socket wins.
- Spur render anchors are attached to real limb joints and reflect existing procedural anatomy: knee (barb, hook, sensory bristle), shin (dew claw), foot (claw, heel spike). Species names never control these choices.
- Existing procedural drawings continue to work for headless contexts and parts without installed native sheets. The source catalog, compiled catalog, renderer, and editor remain one pipeline.

## Evidence and known limits

Source audit, anatomy depth/attachment tests (64 movement/facing combinations), native catalog identity, rig validity, assembled bodies, wave-one/two parts, render cache, menu world slots and save contracts are the appropriate focused regression suites. Source-run Chromium verified **61 native sheets loaded** and a 13-body isolated assembled gallery with legal body plans, no page JavaScript errors and no missing runtime assets. `tests/native-part-catalog.mjs` checks all 976 individual RGBA frame pairs. Browser inspection is real but does not replace hands-on creator review of the finer native silhouettes or deployed-site IndexedDB persistence.

Not finished: remaining 17 procedural parts; clearer multi-limb silhouettes at normal gameplay zoom; limb/armor material color layering; additional individually expressive animation; legacy reproduction/hydration and digging defects from earlier baselines. The stable-release manifest is intentionally **not** upgraded by this development pass. Do not describe this as accepted art or release QA.
