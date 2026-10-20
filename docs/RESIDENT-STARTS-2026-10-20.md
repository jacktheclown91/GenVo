# Independent existing-creature starts

The New World menu now separates **Starting point** from **Starting creature**. Fresh ecology, a saved-world fork, an imported scenario and a bundled evolved world can retain their recorded controlled lineage or offer living regional residents. The chooser displays actual body artwork, generation, age, developmental stage, health, food and hydration. Cancellation allocates no save slot; confirmation installs an independently restored world and creates a separate save.

`src/persistence/resident-start.js` selects an existing organism rather than spawning or editing one. Bodies, genes, reproductive genomes, pigment, ages, reserves, parent IDs, generations, physical stocks and biological RNG remain unchanged. Existing real descendants become the playable cohort. Retained ancestor records keep actual birth dates and parent IDs; absent ancestors remain unknown. Previous genealogy records remain available. A saved `existing-resident` entry records the selected actor, previous player, prior gameplay founder, actual entry time, generation and parent IDs. This entry means a change of player control, not a claim that the human evolved the selected body.

Existing unspent player mutation bonuses and the old pending editor offer do not transfer as the resident's achievements. Historical logs and biological pregnancies/targets remain. Shared lineage rewards now recognize adopted non-GenVo founding labels, using their actual species maturity. Future births consult current playable membership instead of blindly reviving old lineage flags from conception snapshots. Entry provenance and archived cohort flags follow regional ownership, replay and save restoration.

## Presentation repairs exposed by actual play

The initial Day 30 choice was a real two-day-old generation-two Hopper, ID 197, parents 59 and 55, replacing recorded control of ID 109. It remained young and retained its condition. Juvenile guidance now explains growth and survival before courtship. Selecting a resident near the western edge exposed a large blank region outside the finite map; the renderer now bounds its camera to available terrain while keeping normal interior following. No creature or geographical boundary moves to repair the frame. The final exported-build screenshot was inspected and shows the actual world filling the viewport, the selected Hopper, growth guidance and the action dock.

## Evidence

- `tests/resident-start.mjs`: real wild-body candidates; unchanged biology, world stocks, RNG and source save; retained ancestors; new-lineage future births and rewards; rejection of old unrelated conception flags; explicit malformed-provenance refusal; actual regional crossing and restored actor/entry continuity PASS.
- `tests/camera-bounds.mjs`: all four boundaries, three zoom levels, interior following and oversized viewports PASS.
- Existing scenario, family agency, save persistence, E15/E16 travel, physical breeding, reproduction, mate preference, editor, opening goals, discovery, player presence, world-swap and menu checks PASS.
- Expanded `tools/check-playable.mjs`: all 17 focused checks PASS. Public-export parity and canonical audit PASS (289 reachable runtime modules, 91 parts). The initially attempted nonexistent `tests/evolution-budget.mjs` was not a valid check; actual editor/discovery and new resident reward checks supplied the applicable coverage.
- Exported 666-file web build: real Chromium Day 30 menu, cancellation with unchanged slot count, actual resident selection, complete renderer frame and independent IndexedDB fork PASS. Stored and controlled player IDs both 197; actual calendar Day 31 retained. Evidence: `test-runs/resident-start-exported-2026-10-20/report.json`, `resident-chooser.png`, `advanced-world-playable.png`.
- Earlier source-browser captures remain as observations, including the first frame exposing the camera defect. Final evidence uses the exported-build frame. No screenshot was substituted as human play or natural-evolution proof.

The final menu additionally awaits its starting-point refresh before creation; menu/export contracts pass after that ordering guard. The exported browser capture predates only that guard, not the resident biology, camera or guidance implementation.

## Remaining scope

This completes a usable existing-resident start path; it does not supply custom authored founders, an unrestricted anatomy sandbox, or selection of residents in a different inactive region before entering it. Broad species-history UI, all advanced care/gameplay combinations and complete long-term adopted-lineage ecological acceptance remain open. Existing full-fast-gate failures and observer performance from the prior pass remain unresolved; no new full regression or long ecological campaign was run for this pass. Full-game Gates B through E remain open.
