# GenVo v1.67.0 — Native torso and articulated limb art

**Development review only. None of the 17 new candidates nor the 14 prior candidates are creator-approved final art.** This is a focused first pass at coherent body/limb artwork, not a total visual overhaul.

## Art sources and renderer integration

The project retains 78 biological part IDs and the same canonical inheritance, socket, mutation, and phenotype authorities. Native 32×32 artwork is a separate presentation concern. The installed `assets/art/catalog.json` contains **31 native candidates** (14 eyes/mouths from v1.66 plus 9 torsos and 8 legs). Every part has 8 directional × 2 animation source frames: **496 checked source/compiled frame pairs**. The remaining 47 still draw through procedural fallback, including most tails, flank/dorsal anatomy, and surface organs.

The nine body candidates are small, soft, reinforced, sleek, light, stout, barrel, dome, and long. They have distinct pixel silhouettes and internal shading. The eight legs are walking, spring, grasper, runner, sturdy, webbed, padded, and digging forelimb. Upper and lower leg clusters are independently rasterized from each 32px native sheet; the **existing creature pose provides hip, knee and foot locations** on every frame. Native art cannot independently create or remove joints, increase leg reach, or change any creature capability. Native torso raster is sized from the existing body dimensions; the same socket layout remains authoritative.

The indexed native codec checks torso geometry or nonoverlapping articulated source regions. It preserves 32×32 RGBA identity, original source/compiled SHA checksums, region protection, frame timings, pivots and eight directions. The public game uses the prebuilt checked indexed formats; it does not run native authoring conversion at runtime. The original creator Pix2D and GIF files remain unchanged.

## Asset lab workflow

Open `tools/creature-lab/index.html` through the toolkit's local server. Search for an installed torso/leg. Select facing, edit the pixels of the selected frame, or change duration. **For rigged legs, the left highlighted region is the upper limb, the right highlighted region is the lower limb**; the colored dots are the section's endpoints. Painting pixels outside these regions may be visible in the source sheet but will not render on that limb. Selecting **Preview edited artwork in assembly** recompiles the native candidate in memory with all other facings retained, including the same torso/limb rig; the assembled preview uses the game's actual creature draw path. Preview is temporary and never modifies a source file.

To publish explicit reviewed edits: export authored JSON and run `node tools/install-native-art-draft.mjs <draft.json> <registered-id> <facing>` in the unpacked source, followed by `node tests/native-part-catalog.mjs` and `node tests/native-anatomy-rig.mjs`. The installer preserves native rig metadata and validates edited color membership before overwriting the part. The art generator `tools/generate-native-anatomy-art.py` is intentionally **additive only**; rerunning it refuses to overwrite edited source candidates.

## Verification and gaps

- Canonical source and export audits, 31-part catalog/496 RGBA exact round-trips, 17 newly rigged candidate tests and existing creature-assembly fallback passed.
- Real restricted Chromium runtime: 31/31 native packs loaded, 0 page errors and 0 failed asset requests; screenshots of gameplay, nine torso types in eight facings, and native torso/limb editing in Creature Lab captured.
- Lab runtime checks use a narrow crypto digest stub because its embedded intercepted test document has an opaque origin. This is **not** a deployed-browser HTTPS crypto/persistence test. The real game loads precompiled native formats and needs no runtime WebCrypto.
- Existing unrelated breeding fixture failures remain unmodified.
- **Not complete:** inherited color/tint ramp binding to native sprites, native tail/flank/dorsal assets, silhouette occlusion/layer masks beyond current renderer ordering, dedicated creature animation critique, creator artwork reconciliation, lab GUI editing of limb rig rectangles/endpoints (currently read-only overlays), full deployed save verification, aesthetic signoff. At world zoom and with many mounted parts, visual clutter still warrants deliberate tuning. Do not call the animals finished or visually approved.
