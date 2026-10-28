# Powered flight, passive glide and landing presentation

Implemented after limb orientation `899245ad`. Claude's main evidence commit `516e4774` was merged first without conflicts. This is a C7 implementation slice; the larger presentation objective remains active.

## Runtime change

`aerial-presentation.js` observes actual airborne/glide/ground transitions on the existing pause-aware renderer clock. Powered flight now has a continuous asymmetric power/recovery cycle independent of walking distance, including hovering. The native wing's actual cached panels deploy and sweep about their original mirrored hinges; the central root paint stays fixed. The two native tissue frames follow the stroke rather than an unrelated idle loop. Passive glide holds deployment, sweep and wing/membrane tissue frames steady; native and procedural membranes fold continuously through landing instead of switching at a boolean threshold.

`genvo.js` folds mounted limbs close to their real hips in flight/glide. Observed takeoff eases deployment/tuck over 180 ms. Observed landing releases legs over 180 ms, folds wings and adds a short body settlement over 260 ms. This changes display geometry, not physical altitude, collision or movement. Tucked legs retain their specialized distal orientation; ordinary grounded forward-facing feet remain intact.

`renderer.js` samples the observer for all rendered creatures, excludes landing recovery from ground anchoring, supplies the aerial paint clock, and prevents active aerial poses from reusing stale sprite images. Paused keys include the exact frozen aerial posture. State is bounded to 512 actors, pruned, and reset for changed worlds/anatomy, backward clocks or observation gaps. Seeing a creature already airborne does not invent a takeoff. Jumping, perching, climbing, caves and underground states retain their existing paths.

No biological event, flight eligibility, lift/energy cost, actual navigation, world position, altitude, save schema or source artwork was changed. Native32 remains default; the same renderer uses the optional64 batch with native32 fallback.

## Verification and native evidence

- `tests/aerial-presentation.mjs`: actual-state takeoff/landing observation, exact frozen clock, hovering/travel rhythm parity, steady glide, no fabricated jump/perch launch, interpolated membrane folds, fixed membrane frames, bounded/reset/pruned state, 512 tucked eight-facing poses, continuous cycle boundaries, mirrored native hinge sweep, fixed root paint and cached surface reuse.
- Gait coordination, final ground-contact painting, limb handedness/forward feet, swimming, native powered/precursor-wing, part-animation, render-cache and world-swap checks pass. Architecture, canonical-source audit, syntax and whitespace checks pass.
- [Public native flight](aerial-2026-10-28/native-final-flight/receipt.json): Winged flier New World through public controls; `6` takeoff, sustained hover, directional travel and `6` landing. 288 powered-flight and 16 landing observations, actual optional64/native32 art, zero browser errors, exact paused canonical snapshots and exact frozen aerial pose. No organism, position, terrain, energy or eligibility injection. Only the player flew in this capture; natural autonomous flight/glide is not proven.
- [Native staged comparison](aerial-2026-10-28/native-final-comparison/receipt.json): actual public flier plan, legal paired-membrane glider and slowed landing inspection, eight facings, identical art and body proportions. Before uses original behavior fields with the new aerial fields absent, restoring preceding wing deployment and untucked legs. The real world stays paused and exact. This is a controlled pose comparison, not spontaneous gliding evidence.
- Native screenshots/contact sheets were inspected: powered strokes have clear extension/recovery, limbs tuck rather than walk in air, passive gliding stays deployed, and landing releases the limbs. Creator acceptance remains pending.

Matched paused young-world direct renderer composition, two visible creatures and 30 samples per window: preceding path / new aerial path / preceding path medians 3.3 / 3.5 / 3.6 ms, p95 3.9 / 4.4 / 4.3 ms. This is a small scene CPU measurement, not mature-population or end-to-end FPS acceptance.

The initial staged comparison hit a negative diagnostic RAF elapsed time and was rejected; elapsed time is now clamped at zero. An early long paused timing window also failed full snapshot parity because the existing main-loop `familyControlExplained` tutorial flag changed. The diagnostic preserves that difference and proves the aerial pose stayed exact. The final run waited for the ordinary tutorial message/flag to settle, omitted no fields, and passed full snapshot parity. The earlier successful native-verified-cost receipt is retained as preceding evidence; native-final-flight verifies the finalized membrane fields too. Failed captures are retained separately.

## Remaining initiative

Genuine autonomous aerial/gliding observations, broader tail/anatomy/landing-material review and creator artistic acceptance remain open. Climbing/burrowing, behavioral expressions, further production art, environments, soundscapes/voices and interface/audio settings remain active. Claude owns comprehensive simulation, performance and integration validation. No public release was published.
