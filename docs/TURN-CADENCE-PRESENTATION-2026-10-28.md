# Consistent eight-direction turns

The renderer now retains elapsed-time remainder between its existing 70 ms
facing beats. Previously each step reset its timestamp to the current frame,
making turns slower at lower frame rates and leaving the body facing behind
its requested heading after a delayed frame. Positions, simulation direction,
gait geometry, anatomy, collision and action timing are unchanged.

The shared-file heads-up is recorded in
`PRESENTATION-COORDINATION-2026-10-28.md`. Only `Renderer.easedDir` changes runtime
behavior. It keeps the same interface, shortest-path convention and eight
integer headings. Original code is frozen from published `629ad29a` for the
before/after tests, rather than recreating a reference from the candidate.

Focused checks pass: `turn-cadence-presentation.mjs`, existing `animation.mjs`
and `motion-render.mjs`, syntax and architecture. The new check covers all 64
heading pairs, 24/30/60/120 fps, a delayed frame, no overshoot and unchanged
actor data. [Measured cadence](turn-cadence-2026-10-28/cadence-measurements.json)
and [native receipt](turn-cadence-2026-10-28/receipt.json) retain the scope.

The inspected [native comparison](turn-cadence-2026-10-28/native-turn-comparison.png)
uses an actual ordinary-world creature and native artwork. Only diagnostic
facing targets and frame timestamps are controlled. The corrected body reaches
the requested facing at 283 ms; the original remains one facing short at
320 ms. Complete canonical snapshots are identical before and after the
presentation fixture; native art is ready and browser errors are empty.

This is a bounded turn-cadence correction, not acceptance of every locomotion
or body-art requirement. Existing 32-pixel artwork and eight-direction support
are preserved. Claude owns comprehensive integration and maintained-gate
registration for the focused test. The branch includes a checked-in source
patch; no main integration or release is performed here.

Reproduce native evidence with:

`node tools/review-turn-cadence.mjs . <fresh-output-directory> GENVO8-TEST-A recorded`
