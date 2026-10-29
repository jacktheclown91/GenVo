# Fine sensory tissue in optional artwork

The refined face/limb comparisons still had conspicuous square feeler terminals. These were not part of an indexed asset: genvo-draw painted them unconditionally on the Native32 half-unit grid, even when the actual head used128px artwork.

The prepared indexed renderer now exposes its immutable compiled `resolution`. Genvo-draw selects the real loaded head renderer's resolution, including explicit artist overrides. Optional64/128 uses finely gridded tapered sheaths, a shallow curve, small shaded terminal ovals and sparse cuticular highlight breaks. All paint uses inherited body/shade/light colors and integer screen rectangles to retain crisp pixel art. Existing root and endpoint inputs, sensory reach, action sweep/pinning, direction and layering still own the geometry. No new sensory organ, ability, anatomy slot, physical effect or save state exists.

Native32 and unsupported custom resolutions decline the detail painter without drawing, then execute the exact original line/square calls. Detail is selected by the actual artwork, not camera zoom or a global resolution change. No assets, compiled checksums, pigment regions, canvas pools or per-frame bitmap generation were added. The existing body sprite cache retains normal ownership.

## Verification

- `tests/feeler-detail.mjs`:768 resolution/facing/side/phase/zoom probes, fixed immutable inputs, inherited colors, integer pixels, bounded geometry, safe empty strokes, immutable actual renderer resolution and untouched Native32 fallback.
- Existing part-art variants, detailed faces, handedness,158,630 dynamic torso-load painted contacts, inertia expression, portrait pigments, organism studies, scratch memory bounds, architecture and canonical-source checks pass.
- `tools/review-feeler-detail.mjs` uses three actual public authored-founder bodies (fur/feathers/shell), ordinary movement and full saved-state parity. Distances2.25/2.05/1.93 tiles. Matched normal gameplay captures include32/64/128.
- For the isolated before view, the same64/128 head drawing remains installed but its exposed metadata is wrapped as32 solely to select the original procedural tip calls. All other artwork stays identical. The Lab receives the actual gameplay organism study, with its recorded anatomy/size/age/pigmentation, then compares before/current in all8 directions at64/128 (96 total cases). Native128 fur before/current and feather current were visually inspected.
- Evidence under `feeler-detail-2026-10-29/native-fur`, `native-feathers`, `native-shell`: native gameplay, matching Lab canvases, contextual screenshots, video and receipts. No actor, position, terrain, food, weather or biological event injection. No browser errors.

Small-world prior/current64 whole-renderer medians: fur11.8/7.5ms, feathers9.4/8.7ms, shell10.0/9.4ms (10 samples each). These variable short runs are not a claim of speed improvement or mature-world acceptance. The candidate remains397,231 compressed bytes and19,660,800 decoded bytes.

C1 and the full C1-C8 objective remain active. This removes one visible mixed-resolution inconsistency; torso/head shape refinement, conditional anatomy, broader locomotion and environment extremes, supported large populations/navigation, mature-world performance and creator acceptance remain unfinished. Native32 remains the stable default/fallback.
