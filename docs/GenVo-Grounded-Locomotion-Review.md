# Grounded locomotion implementation

This is a focused animation integration pass on the active seven-priority development goal. The full goal remains active. The current main branch remains the single development branch.

## What the player experiences

Mounted feet retract through stance at the same distance that the body advances, then recover with their part's characteristic trajectory and lift. Body bounce flexes the torso/joints above support; it no longer lifts the entire sprite and its contact shadow together. Juvenile cadence follows its actually displayed limb scale. Contact versus recovery artwork follows the real support phase, including low-lift recovery edges.

This is generated from the actual assembled body and existing movement, not a library of scripted creature types. Runner, sturdy, spring, padded, digging, grasping and webbed limbs retain their declared presentation distinctions. Static and courtship-display pose geometry is preserved exactly.

## Runtime source

- `src/render/genvo.js`: one presentation travel contract links cycle distance to supported-toe retraction. Recovery styles affect free swing, not sliding support. Body-edge clearance uses a stable footprint during movement, retaining existing non-moving geometry. Repeated edge calculations and per-foot parameter objects are avoided.
- `src/render/renderer.js`: gait distance uses the final juvenile/adult limb scale; existing bounce is applied to body rise instead of whole-sprite translation. Ground contact/shadow remains anchored. Movement, anatomy, costs and ecology controllers are unchanged.
- `src/render/part-sprites.js`: planted/lifted native toe artwork uses the actual support flag, with the existing lift fallback for older preview callers.
- `src/render/creature-assembler.js`: gait documentation is clarified; registry/gait numeric values are unchanged.

Only render source changed. All registered identities, original human artwork, inherited genes, reproductive compatibility, speed, energy costs, mass and swimming eligibility are preserved. The accepted mass/swimming proposals remain awaiting creator review. Movement eligibility, force/stability and actual terrain support surfaces remain their existing systems.

## Verification

15 focused suites pass: grounded locomotion, motion/idle/player presentation, funded feeding, seed observations, native part animation/catalog/render/source RGBA, saves, learning/practice, targeted feeding and shared-demand natural parity.

Exact rig measurements cover 256 complete valid body/facing/limb-scale cases: eight mounted limb types, eight facings and four scales. Supported-toe movement in world coordinates remains below 1e-9 per sampled step (floating-point tolerance). Recovery connects continuously to stance. Separate equality checks preserve prior idle and courtship-display geometry, including wide/long proportions. These are rig-coordinate checks, not a claim of pixel-perfect contact under every turn, rasterization or phenotype.

Paired 800x600 native browser captures use the exact prior versions of changed rendering modules with unchanged runtime dependencies. Real keyboard movement is exercised on existing terrain for walking, runner, sturdy, spring, mixed eight-leg and juvenile complete bodies. The body/age/genes/reserves/one-actor placement are controlled fixtures; terrain and post-input movement/expenditure are real. Before/after whole-game screenshots and actual WebM clips are retained. Browser errors: none.

A separate initial full world runs on its normal clock with no input or anatomy/actor/resource/terrain fixtures: 196 animals, 75 ticks, no births/deaths during this brief observation, exact animal anatomy/genetics and freshwater-stock save/load parity. It is not a generation transition or ecological acceptance result.

## Render observations and limits

The video-recorded pair measured mean CPU render-command time 5.78 ms prior and 6.65 ms current, with variable tail costs. Four alternating unrecorded runs measured prior means 5.70 / 5.12 ms and current 5.15 / 5.20 ms. Sprite hit/miss counts were comparable. Results vary with capture and warmup; no stable performance gain or regression is claimed. GPU completion is excluded. This view averages about 2.5 visible creatures despite 196 living animals, so it does not establish a dense visible-ecosystem budget.

Whole screenshots were inspected. Small anatomy remains difficult to distinguish at normal zoom, and creator visual approval remains open. Sharp turns, changing developmental scale during contact, uneven support, exhaustive anatomical combinations and dense-world rendering need further validation. No new balance/physical rules or hard minimum limb count were introduced. Unfamiliar-player comprehension, real soundtrack/action-sound listening, natural generation outcomes and adaptive ecological equilibrium are still open.

The next meaningful integration milestone is visual/audio cohesion in the living world: reduce repetitive vegetation while preserving real resource signals, and refine/listen to the existing game audio during natural interactions. Creature readability and naturally occurring encounters remain part of that work.

Evidence: `locomotion-support-measurements.json`, `locomotion-tests.json`, `locomotion-browser-proof.json`, `locomotion-render-profile.json`, `locomotion-{before,after}-runtime.webm`, and complete-body/natural 800x600 screenshots.
