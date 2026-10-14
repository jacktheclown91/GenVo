# 09 — Palette substitution preserves authored art

Creator addition, received 2026-10-11. **LOCKED DESIGN; runtime acceptance remains pending.** Applies to every authored part, including bodies, attachments, materials, directional variants, animation sheets and approved LOD assets.

**Every authored part must support palette substitution without losing its original pixel shading, detail, or animation.**

Recoloring changes pigment values. It preserves authored pixel positions, transparency, shading relationships, texture clusters, outlines, highlights, facial details, frame selection, timing, anchors, joint transforms and facing. Palette selection cannot alter biology or motion.

## Representation and rendering contract

- Keep immutable original source art and its checksum. Define pigment regions separately from shade/detail information. Use indexed ramps with enough entries to preserve all authored tones, or lossless region masks plus per-pixel shade information; a three-color reduction is insufficient when the source contains more distinct shading.
- Assign every visible pixel a documented pigment/material treatment. Fixed-color features may use protected regions, preserving pupils, sclera, bone and other intentionally independent colors. They must not disappear when skin changes palette.
- Preserve ordering and distinctness of authored tones within each region. Validate target ramps before use; reject or report a ramp that collapses distinct authored shade/detail indices. Do not silently flatten them.
- Preserve alpha exactly. Do not replace the entire visible part with one color, regenerate its texture, blur/resample its pixels, or destructively overwrite the original image to recolor it.
- Every frame and facing uses matching pigment and shade data, transformed together with the artwork. Recoloring does not reset the animation, change frame duration, move a socket, or replace authored motion with a static pose.
- Cache identity includes asset version, palette/region values, frame, facing and applicable material/pose state. Changing palettes must not return stale colors or discard animation states.

## Acceptance evidence required for each authored part

1. An identity-palette round trip reproduces original RGBA pixels exactly for every frame and facing at native resolution.
2. Substitution preserves pixel coverage and alpha exactly, and preserves the pixel-to-region/shade assignment, shade ordering and distinct authored detail. Protected regions remain exact.
3. Frame count, duration, animation transitions, anchors and resolved pose are identical under palette changes, including substitution mid-animation.
4. Test contrasting light/dark palettes and the bible's five-family assembled-creature review. Reject unusable ramps rather than treating erased detail as success.
5. Show actual editor and gameplay animation at normal camera scale, including all supported facings. Pixel/data checks alone do not establish visual acceptance.

The existing procedural renderer and design-only schema are not evidence that this requirement is implemented. Authored conversion follows the staged integration gates in [06](06-IMPLEMENTATION-AND-ACCEPTANCE.md); no source renderer replacement or completed-art claim follows from importing these documents.
