# GenVo v1 presentation work and integration handoff

Creator directive: GENVO v1 goal objective, received October 23, 2026. This is a presentation work plan, not replacement design authority or release approval.

## Baseline and ownership

Existing canonical working tree: `genvo-toolkit`, original GenVo repository. Live remote main was `96d9f96` when inspected. GenVo-v1 returned no HEAD or main refs to a read-only `git ls-remote` check. Its migration is not yet verified. Keep the functioning original source until Claude establishes and verifies the clean destination; do not independently migrate history or publish.

Codex owns presentation assets, styling, visual/audio design and rendering-specific modules. Claude owns biological/gameplay mechanisms, pacing, persistence, migration, technical playback/event wiring and test organization. Shared renderer, menu and UI integration requires coordination. The creator selected checked-in handoffs and patches as the coordination channel. Use checked-in handoffs before shared-file presentation integration, review current source for concurrent work and verify the integrated result. This coordination channel does not itself impose a separate approval gate.

Claude has also prepared `design/GENVO-V1-PLAN-2026-10-23.md` in the canonical working copy. This presentation sequence complements that milestone plan; it does not change its technical phases or ownership.

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

## Presentation milestone status, October 23

- Terrain continuity: committed and shared renderer patch picked up by Claude in d9c2e97. [Evidence](../art-refinement-terrain-continuity-2026-10-23/README.md).
- Menu/New World: asset and responsive presentation candidate verified in five sizes and an actual exported-world start; runtime activation is applied; [integrated evidence](../art-refinement-interface-v1-2026-10-23/README.md) retains the actual build review.
- Creature Lab: candidate verified in five sizes, exact native editing, genuine inherited opportunity and an exported authored start; runtime activation and the comparison-heading correction are applied; integrated exported review preserves exact authored anatomy.
- Family Journal: immediate-family native portrait plate, actual four-child birth, five sizes and exact-state proof; source layout and retained pigment forwarding are integrated through [the coordinated portrait handoff](portrait-v1-handoff/README.md). Whole-population interactive genealogy and full UI acceptance are not established.
- Creature Inspector/Field Guide: native naturalist specimen candidate, genuine sensed body, current/retained separation, eight facings and five-size exported proof; [shared integration](specimen-v1-handoff/README.md) is applied; public Observe selects the actual retained body example. Full live individual telemetry and dense collection performance remain unproven.
- Evolution/first-young summary: genuine four-young litter with conception parents, shared adult scale, native pause/dismiss and five-size exported proof; [handoff](young-v1-handoff/README.md) integrated through the coordinated portrait change. Native capacity notice is preserved in flow and restored on dismissal. A [coordinated portrait fix](portrait-v1-handoff/README.md) now supplies genuine-pigment pixel proof, cached bounds and proposed-code regression evidence; its source patch includes this summary and the journal layouts. Shared journal/young presentation activation is now applied; integrated checks and exported-browser evidence are recorded separately from the historical proposal receipts.
- Map, HUD/notification consolidation, the full behavior-expression review and audio identity remain unfinished. These milestones do not narrow the creator's v1 goal or authorize migration/release before their gates.

- Portrait fidelity: confirmed and corrected the old HSL/native-RGB mismatch and omitted retained pigment. Genuine parent/newborn and journal pixels match their stored genomes in the independent proposed build. Nine proposed-code checks and the proposed canonical audit passed. Full natural succession/resident and dense-body/GPU acceptance remain unproven.

Current portrait integration: canonical RGB pigmentation, retained-genome forwarding and cached full-gait bounds are active runtime source. See [integrated evidence](../art-refinement-portrait-v1-2026-10-23/INTEGRATED.md). No migration or public release is implied.

Interface activation follow-up: menu, Lab and specimen source are active, including the original input moved into Advanced and exact checkpoint-day labels. Lab native-art revisions now invalidate fallback thumbnails and preview extents without replacing controls or editing drafts. [Integrated and merged evidence](../art-refinement-interface-v1-2026-10-23/README.md) separates the original and combined biology checkpoints and preserves unsuccessful harness runs.
