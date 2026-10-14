# Indexed part art foundation

Status: standalone codec preparation. The gameplay renderer is unchanged. This is not authored-art or P0/P1 visual acceptance.

Every authored part must preserve its original pixel shading, detail, alpha and animation under palette substitution. src/render/indexed-part-art.js establishes an immutable 32 by 32 indexed representation tied to the canonical part registry. Each pigment region retains its complete shade ramp; protected regions retain their exact RGB values. Substitution must provide every shade in strictly increasing luminance order. Collapsed, reversed, incomplete and unknown ramps are rejected.

Frames retain explicit state, facing, index, duration and all pixel alpha values. A local root anchor belongs to the asset. Compilation copies and freezes source data and hashes normalized metadata and pixels with SHA-256. Identity palettes reconstruct exact RGBA, including transparent pixels. Cache keys distinguish asset version/checksum, frame, palette and caller-supplied material pose; no cache or animation coordinator is implemented here.

Validation uses synthetic six-tone skin and protected two-color eye fixtures across eight facings and two frames. All sixteen frames preserve identity, alpha, protected detail, timing and anchor. Real Chromium renders identity, green and violet substitutions; the preview is synthetic test artwork. Existing creature assembly regression passes.

Remaining work: source-image ingestion, authored assets, native joints and action/expression coordination, inherited palette/material state, renderer bridge, all-facing assembly/editor/gameplay proof and creator art review. Larger justified native canvases require a future explicit schema extension. Key validation currently reconstructs a frame and allocates pixels; performance acceptance is pending.

## Source RGBA ingestion

compileSourceRgbaPart now accepts decoded unpremultiplied RGBA frames. indexSourceRgbaFrame resolves exact RGB against declared pigment ramps, retaining every alpha byte and transparent RGB value. Overlapping colors across regions require a per-pixel regionIds map; there is no color quantization or anatomical guess. Unknown colors, ambiguous regions, malformed buffers and invalid assignments reject ingestion. Inputs remain detached from compiled assets. PNG decoding and authored assets remain pending.
