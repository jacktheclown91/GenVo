# Correct limb handedness and forward-facing feet

Creator reported that arms/legs face different forward/backward positions in the Creature Lab. Two paint-transform defects were corrected in the shared game/Lab renderer:

- Paired leg geometry was reflected, but asymmetric upper/lower/hip/knee tissue used the same handedness. `part-sprites.js` now supplies anatomical side; `indexed-part-renderer.js` reflects tissue across each bone's transverse axis.
- Distal foot paint was locked to the shin direction. Rearward shins could therefore display backward feet. The existing horizontal lower-limb tissue is partitioned once into overlapping shin/foot sections; the grounded distal section points along body forward, with its endpoint on the exact original contact. Hip, knee and foot coordinates remain unchanged. Swimming, climbing, digging, flight, gliding, jumping and raised strikes retain their specialized distal orientation.

No source artwork was repainted, no sockets/body plans were changed, and no biological/save authority was edited. Existing correct reflection for paired armor, gills and claws remains intact. The correction is shared by gameplay, Lab, native32 and optional64/128.

`tests/limb-paint-handedness.mjs` passes 3,312 reflected tissue probes across eight facings, three zooms, both skin frames and all three resolutions. It directly checks distal forward orientation and exact contact placement; the preceding unmirrored transform fails the paired-tissue condition. It also checks specialized-action exclusions, real assembly handoff, unchanged input geometry, surface reuse and 24 actual paired armor/gill/claw cases. Ground-contact painting (39,876 observations), swimming strokes, articulation, indexed renderer, native spur/wing art, candidate asset loading, architecture and canonical-source checks pass.

[Native Lab receipt](part-mirroring-2026-10-28/verified/receipt.json): actual public import and Artwork controls at 32/64/128, exact unchanged plans, zero browser errors. Before/after eight-facing sheets and real Lab screenshots are retained alongside the receipt. Native images were inspected. The live-tab control tool failed to initialize, so the user's existing tab/unsaved assembly was left alone; the native Lab checks used a separate browser session.

Matched uncached four-sprite composition medians before/after: native32 1.4/1.3 ms; 64px 1.0/1.3 ms; 128px 1.1/1.1 ms (30 measured samples each). This is a small native composition fixture, not mature-crowd/FPS acceptance. Distal segmentation adds one draw per grounded limb and reuses existing cached tissue. Creator acceptance remains pending. Refreshing the Lab loads the corrected source.

Flight/gliding and the broader presentation objective remain active; no release was published.
