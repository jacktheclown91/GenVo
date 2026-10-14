# 08 — Implementation Handoff for Claude / Codex / Other Collaborators
**Read first:** `README.md`, `00-ART-BIBLE.md`, `02-PARTS-ANCHORS-AND-ASSETS.md`, `03-JOINTS-AND-ANIMATION.md`, `06-IMPLEMENTATION-AND-ACCEPTANCE.md`.

## Assignment
Bring the current **single canonical** GenVo8 toolkit toward a fully authored, biologically expressive modular-part art and animation system. The founder, every wildlife species, and every rare/special creature must eventually share construction, rendering, joint/motion and material rules. **A single full-body species silhouette must never override the assembled body.** Do not add a new sprite system parallel to a still-authoritative old species renderer.

## Start with facts, not feature counts
1. Read the newest source, not just this document package. Log actual build version, test baseline, package hashes, source file map and current authored assets.
2. This package was prepared from an uploaded toolkit whose README was v1.59.0 and `PartRegistry` had 72 registered parts. Those numbers are a **snapshot** and may be stale as development continues.
3. Re-run source inventory and confirm which existing parts are only numeric entries, which draw pixels procedurally, and which have independently authored art and joint rigs. **Do not mislabel procedural diagrams as authored assets**.
4. Preserve the user's supplied eye design reference (with the little red stalk-tip attachment point) and the creator's 32×32-per-part direction. The provided enlarged image is not a finished 32px animation sheet.

## First implementation deliverable (small integrated pass)
- Register an `ArtRegistry` adapter keyed to existing biological part IDs, versioned and independently validated, without duplicating gameplay effects.
- Implement one independently authored body piece, one leg with hip/knee/foot rig, one jaw and one stalk-eye 32px asset + anchors + masks. They must assemble via the existing editor and runtime. Part animation profiles are declared on the part, not on fixed creature species.
- Establish a world-grounded foot contact lock during stance and a clean swing/plant cycle, with bounded joint angles and no creature-wide wave as locomotion.
- Establish eye scanning/blinking, including body turn, near/far occlusion and eight facing views. Anchor debug marker must appear only in the editor; never in game sprites.
- Add an initial material overlay (fine scales or armored hide) and an editable palette family, without affecting anatomy authority.
- Capture actual running-game screenshot/video at idle, walking, turning, attacked/feeding and editor assembly views; show at actual game camera scale.

## Mandatory deliverables after each pass
- Change inventory: exact files changed, modules introduced, source version, tests run and actual terminal results.
- One or more *real* runtime screenshots/video; comparative capture against pre-pass source.
- Failing-first regression where feasible, plus automated validation for anchors, joint limits, sprite bounds, direction changes, palette masks and save/lineage implications.
- Body-plan save / inheritance / evolutionary budget compatibility report (or explicit blocker).
- Performance comparison against verified baseline, especially screen populated with dissimilar creatures.
- Fresh toolkit/source and public build from **same canonical source**, only after required checks pass. Do not package an unverified release.
- Unresolved issues and next smallest integration step. Do not present work as visually approved before creator approves it.

## Explicit things NOT to do
- Do not global-replace the world tile scale with 32 to satisfy artwork resolution.
- Do not replace gameplay physics with animation-driven coordinates or teleports.
- Do not automatically assign aggression, diet, damage or toughness from red/green/yellow paint choices.
- Do not convert special creatures into fixed sprites or provide their stats by species name after modular parts are installed.
- Do not build a giant animation table per creature; parts own rig/vocabulary, shared action coordinator schedules it.
- Do not make biologically incompatible structural mutation appear instantly on adult player characters.
- Do not claim 72 finished assets merely because 72 parts are registered in a source registry.
- Do not remove old render paths before parity and rollback are demonstrated.

## Question/approval triggers
Ask the creator before deciding: actual sprite art style that changes the silhouette, pixel-camera zoom, major palette aesthetic, new fantasy anatomy incompatible with current body plan, changing core mutation/inheritance semantics, or removing existing rare creature appearance identity.

**Acceptance summary:** Articulated, cataloged, recolorable, material-aware modular parts should assemble into *visibly distinct, mechanically honest* organisms that move via their own joints and use the same rules across the entire world.
