# Physical movement expression — review candidate, October 30, 2026

## Dependency and boundaries

**Stacked on draft PR #47** (`ux/inherited-scale-render-20261030`), not on `main`. Do not merge this branch first or cherry-pick the shared renderer without rechecking the current base. Claude owns simulation/physics/testing and merge/release engineering; ChatGPT owns presentation. Codex is inactive.

This change introduces no new biological rule, authoritative movement data, sprite assets, telemetry, gameplay command, mutable simulated state, or save field. It reads the live `motionStateOf` and `structuralViability` authorities already implemented in morphology S3/inertia/1.

## Changes

- `src/render/physical-motion-expression.js`: small read-only presentation adapter; creates bounded body-language offsets and transient ground scuffs.
- `src/render/renderer.js`: reads the adapter for visible creatures and composes it with the existing behavior/articulation system; does not overwrite existing encounter, family, social or locomotion expressions.
- `tests/physical-motion-expression.mjs`: focused regression and historical-rule cases.

## Physical behavior

- Acceleration creates a slight backward pitch; braking creates forward pitch and widened planted stance.
- Lateral acceleration creates a small lean to the turn side; visual lean follows real acceleration, not random sine or assumed target intent.
- Structural stress lowers stance; a heavy adult visibly carries its weight, while a young body uses **current growth** in stress evaluation.
- Short parallel scuffs appear only during genuine sufficiently strong braking on dry/muddy ground. Nothing is painted into the ecological terrain; wet water, grass, flight, burrowing, stillness, torpor or legacy motion rules do not get arbitrary marks.
- Always preserve the original creature silhouette, facial/action language, native pixel-part animation, gait timing and inherited size behavior from PR #47.
- Read-only calls have no RNG, no simulation tick, no target update, no ancestry mutation, and no future-state prediction.

## Focused evidence

Connector-side V8 execution loaded and evaluated actual source of `src/organisms/body-size.js`, `src/organisms/motion.js`, `src/organisms/structural-support.js` and the new adapter, proving 19 independent implementation/wiring checks (motion pitch, turn, genuine braking and transient marks, structural support stages, juvenile stress, rule-gated legacy parity). Both the full renderer source and new test source parsed.

**Not yet run:** complete Node test from a checkout, Chromium actual screenshots, creator perceptual inspection, independent GPU performance or save/load parity. Do not describe this as stable or integration-tested. A focused test was added to the repo to run in Claude's actual checkout.

## Required integration / visual acceptance

1. First review PR #47 current inherited-size changes and reconcile shared `src/render/renderer.js` edits; PR #48 must be merged after #47, if approved.
2. Run `node tests/inherited-scale-presentation.mjs` and `node tests/physical-motion-expression.mjs` plus full `node tools/check-playable.mjs` on Node 22 and Node 24. Account for known off-gate tests without weakening tests.
3. In an actual Chromium game, capture matched stills/video for **stationary → accelerate → cruise → brake → turn** on dry meadow, dry soil, muddy soil and water, with moving adult, wild juvenile and inherited 0.5×/3× adult. Use naturally valid simulation states and label any synthetic scripted playback as such.
4. Compare original and candidate same seed/tick: visually leg plantedness, visible body lean, predator/flight/river exceptions, scuff thickness, overlay overlap and facial readability at 2×, 3× and 4× zoom.
5. Measure frame p50/p95/p99, creature prep/compose, `CanvasRecorder` operations, GPU upload/scratch atlas and memory against the parent PR #47, at initial and mature regional populations. This adapter adds per-visible-actor support evaluation and short Canvas operations during braking; do not accept an unexplained regression.
6. Verify legacy worlds with no `inertia/1` or `structural-support/1` produce no new effects; verify unchanged simulation snapshots, RNG and saved-world records.
7. Creator visually checks that cues communicate real weight, stop and turns without becoming exaggerated or twitchy.

## Next stage

After these physical cues and #47 are tested, layer day-night lighting from `dayPhaseOf` in a separate presentation-only PR; then anatomical heat frills/wax and drought-dormancy presentation from `aridExpressionOf`. No new biology.
