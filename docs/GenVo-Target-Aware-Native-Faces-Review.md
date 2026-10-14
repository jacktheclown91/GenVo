# Target-aware native faces

Current native creatures could aim their entire body at a target, but heads and facial organs stayed rigid relative to the torso. Heads now follow existing biological attention independently within a bounded half-radian turn. This is presentation, not a new sensory/decision authority.

## Runtime source

- `src/render/head-attention.js`: reads existing perceived threats, committed attack aim, encounter partners, funded meal source positions, active action targets and known caregivers. No nearby-creature scan, hidden preference read, RNG or simulation command. Renderer-owned WeakMap state eases on the existing pause-aware clock and returns to neutral. Torso-faced headless designs gain no imaginary movable head. NPC angles are quantized together with cached geometry; player angles remain continuous.
- `src/render/renderer.js`: feeds those authoritative references to the head pose after existing feeding/encounter expression. Actual movement/torso facing, costs and controller outcomes remain simulation-owned. World resets clear the transient tracker.
- `src/render/head.js`: rotates facial socket points rigidly around the existing head insertion. Eye and mouth radii stay exact across all directions. Existing implicit legacy heads and mounted head-base use the same read-only pose.
- `src/render/indexed-part-renderer.js` and `src/render/part-sprites.js`: native head texture and installed face components share the head turn. Original 32x32 RGBA artwork, pigment protection, blink/action frames and part identities are unchanged. This is anatomical assembly improvement, not newly painted eye frames or independent pupil animation.
- `src/render/genvo-draw.js`: connects primary/extra eyes and mouth to the pose; sprite cache identity includes the displayed head angle, preventing stale head orientation.

Neutral poses remain at the same insertion and facial geometry. Gameplay records, inherited anatomy, mating preferences, action availability and swimming/mass policy remain unchanged. No save schema or migration was added.

## Verification and inspection

16 focused checks pass: head attention, modular head, face readability/native expression, catalog/renderer, native knees/anatomical rig, live courtship, feeding, grounded/player movement, tissue draft, swimming review, saves and demand parity. New coverage includes 48 implicit/mounted head-direction-turn combinations, exact host-relative facial radius, target priority, bounded easing, pause/return, NPC quantization and immutable records. Existing modular-head inheritance and save tests still pass.

Paired real Chromium 800x600 game runs include seven legal complete-body keyboard fixtures and separate ordinary initial-world observations. Both observations contain 196 living animals and 74-75 normal ticks, no births/deaths, no browser errors, exact anatomical/genetic and freshwater snapshot parity. They are short initial-world evidence, not natural courtship/ecological verification. Fixed pose boards supplement actual gameplay at ordinary and enlarged scale.

A controlled mature valid pair starts courtship through actual mouse Dance/Play controls. The existing controller funds the dance with 0.345952 energy. At tick 11, before/after actor energy, positions, sequence and cost match exactly; the current performer's head turns approximately -0.332 radians toward its moving partner. The partner is moving away and does not receive invented attraction. Preferences and compatibility are retained; no conception/acceptance is forced. The trial proves an actual funded performance, not natural mate choice or human comprehension. Final optimized source was recaptured for this workflow.

Inspected before/after close game frames and the native pose board. Connected face direction is clearer up close; ordinary-zoom readability remains limited. Creator visual approval and unfamiliar-player testing are still open. Some limb silhouettes remain segmented rather than organic.

Four final alternating normal-world render profiles (without video) average 8.273 ms before and 8.819 ms after: +0.546 ms / 6.6 percent, approximately 32.4 visible creatures. An earlier sample measured +0.337 ms / 4.0 percent. Sampling variability and changed cache misses matter; no speed gain, GPU latency or dense-world budget acceptance is claimed. Neutral poses avoid unnecessary trigonometry/easing but active face orientation still costs rendering work.

## Continuing work

This pass advances creature expression without activating unapproved mass coefficients or swimming migration. The full active goal remains unfinished. Next meaningful pass should address anatomy-specific readable attack/defense/rejection performances and dense-world rendering costs, rather than another HUD restructuring. Physical calibration, live-womb review, legacy swimming adoption, wider ecological generations and human acceptance remain open. Matching current source/web archives follow exported HTTP game/Lab and exact runtime-byte checks.
