# GenVo natural underground, first geology-to-art integration

This branch is a **review candidate**, not the completed subterranean ecology expansion. It builds on draft sensory PR #33, itself based on performance candidate PR #32. No code is merged to `main`; Codex's unfinished local cave/underwater work is not modified.

## Implemented

- `src/world/natural-caves.js` grows seeded natural caverns across multiple deterministic local geological fracture fronts, allowing adjacent pockets and branches rather than only a short straight path. Actual construction still uses `excavatePassage`: every void moves real surface material to a valid receiver, checks roof/floor validity, and creates a canonical passage. This does not draw fictional connected tunnels.
- `src/render/cave-surface.js` paints 32px native geology from the **same exact subsurface passage objects** used by collision, underground respiration and sight. It uses passage adjacency and floor-height agreement for continuous openings; solid neighbors become irregular bedrock boundaries. Actual flooding uses world water; surface-root coloration only appears where physical shrubs/woody plants grow above a passage. Animal-dug burrows use a soil palette, not cave stone.
- `src/render/subsurface.js` draws only nearby real voids using a revision-cached 32px native canvas per cell, with rock-mass darkness around them. Surface entries are irregular holes instead of square doorways; in-world CAVE/EXIT/BURROW labels were removed. Lightweight HUD guidance remains.
- Existing `caveFracture`, material/void conservation, sediment deposition, cave roof collapse, entrance traversal, underground air, physical reachability, dive rules and individual sensory fog all remain authoritative.

## Limitations and design debt

- Cave geology still occupies the existing **one-cell passage grid** with floor-height constraints. Multi-level fully 3D caverns, regional underground oceans, and real variable passage widths would require an explicit versioned physical geometry model plus validated migration. The new native rock silhouettes are the best representation this topology currently supports, not free-standing collision data.
- The cave texture is procedural surface coloration, not a new mineral resource stock. Don't interpret colors as geological minerals available to harvest.
- Sound propagation, scent plumes and true stratified subsurface food webs are not yet complete. Do not spawn fictional glowing flora or biomass as decorative content.
- Existing saved worlds retain their stored cave topology. New worlds use the updated initial growth rule, so seed-generated layouts may differ; this needs careful restore parity and creator approval before a canonical release. An explicit versioned world-generation policy may be appropriate for longer-term replay compatibility.
- No original author art assets have been removed or substituted.

## Required acceptance

1. Run `node tests/natural-caves.mjs` and `node tests/burrowing.mjs` to assert exact material conservation, deterministic RNG, entrance usage, collapse, traversal and save.
2. Run `node tests/natural-underground-art.mjs` to ensure all art derives from true physical voids, with linked openings, distinct dug earth, real water and correct revision invalidation.
3. Run existing sensory tests to ensure solid walls block sight and click targeting.
4. Capture actual Chromium gameplay in a naturally generated cave and a creature-dug burrow, with FPS overlay, at 1080p. Verify that geology looks like an irregular continuous underground, not a dungeon.
5. Validate new-game and prior-save starts and the Day 30/100 exported scenarios; if old-world differences occur, stop and design backed-up migration rather than silently changing authority.

Coordinate this PR with Codex's uncommitted local underwater/cave sensing implementation before any merge.
