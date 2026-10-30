# Swimming turn and braking articulation — October 29

Actual liquid swimming now reads the committed inertia/1 motion query. Angular rate × speed gives lateral acceleration; the body's own canonical swimming acceleration limit normalizes a bounded steering amount. Longitudinal deceleration gives a bounded braking amount. No desired heading, target, synthetic velocity, speed rule or resource cost is introduced.

The outer bank of existing limbs rows farther and the inner bank less during a real turn. Existing webbed versus ordinary stroke shapes, per-socket timing and recovery feathering remain intact. Braking slightly shortens the sweep and opens the actual paddles; torso yield, dorsal roll and tail follow-through remain above this contact-free skeleton. These are paint projections, not new thrust or swimming capabilities. Mounted anatomy alone determines what is drawn.

SwimMotionPresentation smooths only its visual values over75ms and holds them when paused. Player values stay continuous; autonomous values quantize to sixteenths for cache reuse. The renderer supplies the resulting cache token. Histories are capped at256, expire after2.5s offscreen and reset across worlds, anatomy changes, clock reversal, stopping, unsupported actions and loss of real liquid contact. Straight constant travel releases the preceding turn pose. Existing non-swimming and worlds without inertia/1 return no added pose. Canonical world position, motion, facing, growth, saved state and physical swimming remain untouched.

## Verification

- tests/swim-motion.mjs:72 legal body/size/facing cases (small/long/dome;0.5/1/2×;eight headings) driven by canonical planMotion/commitMotion; differential outer-bank rowing, mirrored opposing turns, continuous power/recovery seams, braking, paused hold, stop/action/legacy gates, settling, bounded/pruned history and exact full saved-graph preservation for both neutral and positive swimming queries.
- tests/swimming-limbs.mjs:7209 continuous stroke samples plus legal mixed assemblies/native insertion.
- tests/animation.mjs, tests/inertia-expression.mjs, tests/canonical-source.mjs and tools/architecture-check.mjs passed. Historical grounded-support receipts were not regenerated.
- tools/review-swim-turns.mjs:public Shore swimmer New World and ordinary keyboard input into actual liquid, optional64/native32 fallback. In the recorded-turn run,2117 visual queries produced285 active samples,224 turn samples and256 braking samples (categories overlap).273 player samples and12 autonomous samples were observed; actual autonomous IDs145 and135. No organism, motion rule, position, terrain or resource injection.
- Same paused-world comparison preserved the entire encoded canonical snapshot. Normal gameplay captures were inspected. The first enlarged-capture attempt landed after the current turn settled and produced no close-up; its receipt remains under final and is not enlarged-view proof. The recorded-turn receipt instead retains an actual positive-event organism study, committed motion, canonical animation phase and life reading. Its32/64/128 isolated before/current close-up was inspected. This is an enlarged rendering of recorded real state, not a new physical trajectory or a Lab simulation.
- Mean query cost in the final run was0.00265ms across visible-creature calls, including early exits. This is local query timing, not GPU/frame performance, mature-world acceptance or comprehensive testing.

Evidence: [recorded native receipt](swim-turns-2026-10-29/recorded-turn/receipt.json), [actual-state close-up](swim-turns-2026-10-29/recorded-turn/actual-state-closeups-turn.png). Original native and intermediate observations remain retained.

## Remaining scope

C3 remains active: broader aquatic configurations, asymmetric/injured movement, long and large-body field behavior, and creator animation acceptance remain open. Controlled size cases do not establish an evolved2× field lineage or giant clearance. No3× physical support, new swimming anatomy, new simulation event or global artwork-resolution change is claimed. Full C1–C8 remains active.
