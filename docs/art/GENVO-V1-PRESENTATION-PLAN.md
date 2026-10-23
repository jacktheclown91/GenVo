# GenVo v1 presentation work and integration handoff

Creator directive: GENVO v1 goal objective, received October 23, 2026. This is a presentation work plan, not replacement design authority or release approval.

## Baseline and ownership

Existing canonical working tree: `genvo-toolkit`, original GenVo repository. Live remote main was `96d9f96` when inspected. GenVo-v1 returned no HEAD or main refs to a read-only `git ls-remote` check. Its migration is not yet verified. Keep the functioning original source until Claude establishes and verifies the clean destination; do not independently migrate history or publish.

Codex owns presentation assets, styling, visual/audio design and rendering-specific modules. Claude owns biological/gameplay mechanisms, pacing, persistence, migration, technical playback/event wiring and test organization. Shared renderer, menu and UI integration requires coordination. The creator selected checked-in handoffs and patches as the coordination channel. Leave shared integration changes there for Claude; continue independently in presentation modules.

## Dependency order

1. Resolve creator's concrete terrain repetition feedback. Remove duplicate procedural plant accents; retain canonical native plants, food anchors and biological clipping. Vary retained substrate atlas sampling and minor plant placement. Verify actual gameplay before/after and state parity. Keep shared renderer edits as a narrow patch until coordinated.
2. Confirm Claude's maintained source snapshot and destination before broad interface work. Inventory runtime artwork/audio through the source graph and current build inventory; separate historical evidence from the clean public package without deleting dependencies.
3. Establish a single natural-history presentation system: dark green, warm cream, muted gold, restrained organic materials, coherent type/icon/button rules. Consume actual state. Build original reusable assets before shared UI integration.
4. Creature-first menu and New World styling, then the Creature Lab layout and part browsing. Preserve all valid starts, ancestry/editing constraints and existing input paths. Coordinate hooks and logic with Claude. Review desktop and small-window layouts in real Chromium.
5. Continue manual/AUTO animation and authentic environmental-state readability in bounded categories. Check actual anatomy/directions/action timing, selecting the weakest unrefined cases instead of repeatedly polishing completed work.
6. Audit existing audio and event interfaces. Prepare attributable, varied biome/contact/call/UI sound assets; let Claude own technical event/playback integration. Evaluate actual playback, levels and repetition.
7. Capture genuine gameplay review material from the integrated v1 build. Validate included assets and credits; leave final creator acceptance and public release separate from implementation claims.

No artificial biological events, survival tuning, time-policy changes or invented inherited capabilities are part of Codex presentation work. No full-game completion claim is made.

## Terrain patch for Claude

`assets/art/production-review/terrain-continuity-v1/renderer-integration.patch` is against the original renderer at `d7e50c0` (also unchanged in `96d9f96`). It imports `terrainGrainAt`, replaces per-block random brightness with a continuous world-space signal and removes two redundant rectangular static-ground overlays. Actual isolated runtime candidate frames were captured with this patch; committed-module evidence is separately labeled and uses the untouched shared renderer. Apply only after checking current renderer ownership and source, then run the focused checks and actual-runtime capture again.

The main presentation-module fix is independently usable. `drawHabitatClusterAccents` retains its public hook but no longer duplicates canonical plants with unsensed tiled combs/rectangles. Native vegetation remains the plant-display authority. Source artwork and physical stocks are preserved.
