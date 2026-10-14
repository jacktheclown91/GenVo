# GenVo v1.68.0 — Inherited native pigments and expressive appendages (development)

**Pending creator art approval.** This checkpoint extends native 32×32 pixel candidates to **48 of 78** registered functional parts: 31 from v1.66–1.67 plus **all nine tail types** and **eight dorsal types**. Every candidate supplies eight facings and two authored pixel frames. **768** individual RGBA source-to-compiled frame pairs are verified. The remaining **30** parts retain the canonical procedural fallback, including flank organs, additional dorsal structures and spur details. These are additive review assets, not replacement species templates.

## Inherited phenotype palette

The runtime now remaps the five unprotected `skin` shades to the creature's existing inherited body/shade/light palette. No DNA, physiology, species identity, socket or action code changes. Protected details such as eyes, claws, glow and membranes remain fixed, preserving artwork intent. The indexed renderer keeps a **bounded 64-frame-per-part LRU** for requested tinted frames; startup artwork is still precompiled, not generated on the render loop. Non-monotone special palettes safely use the original paint. `src/render/genvo-draw.js` provides a pure, tested `inheritedSkinRamp` function, and `src/render/indexed-part-renderer.js` owns the only palette rasterization path.

## Physical attachment

Native tails are mounted behind the actual creature mantle and drawn before limbs/torso. Native dorsal candidates are mounted on the back and drawn where dorsal sockets enter assembly, not at the face. Multi-socket parts choose flank when a flank-side mount is supplied. Original hip/knee/foot positions and facing frames remain canonical. `src/render/part-sprites.js` remains the only sprite dispatcher, and unconverted native or non-drawing contexts still fall back to old procedural sprites.

## Candidate art set

Tails: paddle, balance, club, spined, whip, prehensile, fat, flag, luminous. Dorsal: silt fin, signal crest, shell back, thorn carapace, sail fin, spine ridge, display frill, moss back. Review sheet: `references/generated-native-parts/appendages-wave-v168.png`.

Source specs are in `assets/art/parts/*.json`, PNG previews alongside them, indexed runtime representations compiled by `node tools/build-native-part-art.mjs`. The additive-only generator `tools/generate-native-appendage-art.py` refuses to overwrite existing reviewed/edited art. Creator reference originals were not changed. Creature Lab uses the same source and indexed formats and can edit these single-socket parts through its existing preview/export/installer workflow.

## Checks and limitations

The source audit detects 151 reachable modules and 78 parts with procedural drawing fallback. Tests cover 48/48 pack integrity, 768/768 native RGBA round trips, inherited palette RGB order, protected detail preservation, LRU cache reuse, anatomical mount points, nine torso rigs, eight two-bone limb rigs, body assembly, Creature Lab, menu world slots and IndexedDB storage contracts. Restricted Chromium demonstrated 48/48 installed native packs, actual gameplay and 17 valid assembled review animals across different facings and body colors without page errors or missing assets. The browser harness does not establish deployed IndexedDB save persistence; the screenshot records a save warning in this synthetic environment.

**Remaining:** Creator review of artwork, whole-body leg silhouette/occlusion improvement, 30 unconverted parts, independent color regions for horn/armor/feather surface organs, app-level deployed save/load verification, and previously documented unrelated breeding/digging tests. Large populations may require measured optimization of the palette LRU and sprite cache; this pass does not claim performance equivalence on the creator's hardware. No stable release was authorized.
