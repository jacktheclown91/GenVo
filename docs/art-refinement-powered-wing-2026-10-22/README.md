# Powered-wing candidate — 22 October 2026

Native feather planes replace the basic powered-wing paint. Short warm quills remain protected material; the surrounding feather pigment follows inherited skin. The original root, dorsal panel rig, sockets, frame keys, 320 ms timing and palette definitions remain exact. All 16 native frames retain opaque roots and transparent outer margins.

Implementation commits: `5a61359` (paint) and `5a51194` (wind-cue clearance). Runtime evidence was refreshed on `4123bb1`, including published First Legacy changes. This detached candidate is not installed on canonical main and has no creator approval.

## Actual gameplay

[Ground directions](ground-directions.png) and [airborne directions](airborne-directions.png) contain 1:1 pixel crops from normal 1000×750 gameplay at zoom 2: eight directions, both native paint frames, before/after. Whole east/west screenshots and four live-flight screenshots accompany them. These are controlled adult founder anatomy/observation fixtures, not natural evolution evidence. Terrain, vegetation, other organisms, genes and reserves were retained.

The ordinary flight action paid 6 energy to take off. Four real movement segments stayed airborne, advanced position and flight maintenance, and consumed energy. The ordinary landing action returned to ground with the wings folded. [Receipt](receipt.json) records the values and exact full canonical snapshot equality for ground, airborne and landed art swaps. Graph encoding retains cycles and aliases; no gameplay fields were filtered. No browser page errors occurred.

The raised west wing originally intersected the physical wind label; its existing signal now uses the shared overlay-placement authority to clear the normal-scale body. [Earlier overlap](wind-label-before.png) is retained for comparison. Edge-placement tests cover desktop and compact viewports. No changes to wind physics or shared renderer.

## Reproduction and checks

[Master, exact prompt and original source](../../assets/art/production-review/powered-wing-v1/) are retained. `tools/prepare-powered-wing-art.py` performs mechanical native preparation. Skin/alpha sampling uses nearest pixels; a separate area-sampled master quill mask prevents protected highlights disappearing on diagonals. It does not invent geometry. [Rebuild parity](rebuild-parity.json) confirms all 292 checked catalog/part files remained byte-identical after preparation and compilation.

Focused native-wing, wind-label, existing powered-flight, existing wind, catalog and canonical-source-audit checks passed. Catalog validation covers 97 parts and 1,552 exact source/compiled frames. Focused receipts are adjacent. The existing playable integration gate passed all 88 focused checks on source tree 4123bb1; its complete log is adjacent. No long ecology run was added.

The 100-draw paused CPU samples exclude GPU completion. Ground mean changed 5.626→5.203 ms; airborne 5.308→5.158 ms. These bounded samples show no substantial local regression; they are not a general performance guarantee.

The first attempted capture crossed world startup and was rejected. The replacement waits for the requested seed and same simulation object, asserts pause state at every capture/snapshot boundary, and clears heading easing before directional inspection. [Diagnostic](rejected-startup-run.json).

Broader creature, biome, action and effect completion remains active. This packet proves only this powered-wing candidate; natural inheritance, creator acceptance and canonical integration remain open.
