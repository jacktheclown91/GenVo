# 11 — Editor socket colors and biological palette roles

The creator's supplied reference images define two separate conventions.

## Attachment markers

| Socket | Editor color | Meaning |
| --- | --- | --- |
| Limb | Cyan `#20c8ef` | Legs, arms, fins |
| Eye | Orange `#f5a524` | Sensory organs |
| Mouth | Red `#f05a5a` | Jaws, feeding parts |
| Tail | Purple `#a478f1` | Rear appendages |
| Dorsal | Yellow `#e8ca44` | Back structures |
| Flank | Pink `#e878bc` | Side structures |
| Spur | Green `#70c86c` | Claws and subparts |

Markers are editor overlays and socket metadata. They do not enter exported artwork, become inherited pigments, or grant biological capabilities. Include a socket name or icon so color is not the only identifying cue. The lab's current values are defined in `tools/creature-lab/socket-guides.js`.

## Example biological shading ramp

| Role | Example color |
| --- | --- |
| Outline | `#172a2c` |
| Shadow | `#34554e` |
| Base | `#699a81` |
| Light | `#a4c7a5` |
| Highlight | `#dde5c3` |

These swatches illustrate shading roles, rather than prescribing one universal creature color or limiting authored artwork to five tones. Retain every required source shade, protected detail and alpha value. Substitute inherited pigment ramps while preserving the original pixel layout, shade relationships, frames and timing, as required by [09 — Palette preservation](09-PALETTE-PRESERVATION.md).

The lab's example swatches are defined in `tools/creature-lab/palette-roles.js`. Indexed artwork conversion and timed rendering have focused pixel-preservation tests; persistent game catalog integration and full gameplay visual acceptance remain unfinished.
