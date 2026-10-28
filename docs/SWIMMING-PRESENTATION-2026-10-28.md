# Anatomy-dependent water strokes

Implemented after grounded contacts `a7398616`. This is the C6 swimming slice of the major presentation objective, not completion of locomotion or the full initiative.

## Runtime

`swimming-limbs.js` replaces the terrestrial footfall geometry only for explicit body-plan limbs when the final render action is swimming. Mounted webbed limbs row in mirrored pairs, with fore/hind delay following sockets. Other mounted limbs use smaller alternating paddles. Power strokes fan outward; recovery folds toward the body instead of lifting walking toes. A stopped swimmer holds neutral limbs. Water limbs never assert ground support.

`creature-assembler.js` exposes the actual mounted part ID in renderer metadata. `genvo.js` uses that ID per limb, so a mixed body retains both movement styles. Existing native limb tissue frames open during the power stroke and fold during recovery. Native tail rotation and procedural tail fallback receive a continuous water sweep, with zero active sweep while stopped.

`renderer.js` resolves its existing liquid-contact/flight/landing action before computing body carriage. Previously ordinary aquatic-range swimmers could receive land bob because their action was converted afterward. Eligibility, actual movement, water rules, speed, energy, biological events and persistence are unchanged. Native32 stays default; optional64/128 and unrefined-part native32 fallback use the same articulation.

## Evidence

- `tests/swimming-limbs.mjs`: 7,209 smooth sampled strokes; power/recovery/cycle continuity, mirrored webbing, smaller ordinary paddles, neutral stops, continuous native tail rotation, legal mixed bodies in eight directions and final native skin insertion. Organisms remain exact.
- Existing gait coordination now explicitly expects changed mounted swimming limbs while retaining frozen-reference equality for every other swim field, static/action/display geometry and legacy bodies. The historical fixture is untouched. Terrestrial gait/contact, support carriage, anatomy locomotion, native limb/spur, wave-1 parts and part-animation checks pass. Architecture and canonical-source audits pass.
- [Native comparison](swimming-2026-10-28/native-reviewed/receipt.json): four legal real modular plans, identical optional64/native32 assets, size and behavior input; before uses a frozen `a7398616` draw/pose fixture with adjusted import paths and terminal whitespace only. Video cycles all eight facings. Canonical paused snapshot stays exact. This is a staged art review, not natural aquatic behavior.
- Matched uncached native composition of four sprites: median 1.4 ms before and 1.4 ms after, 30 measured samples each; p95 1.9/1.5 ms. This is CPU composition in this fixture, not end-to-end FPS or mature-crowd acceptance.
- [Actual swimming](swimming-2026-10-28/native-public-input/receipt.json): public Shore swimmer startup, followed by ordinary directional keys into real liquid water; 465 moving-swim observations for the actual player with two webbed and two ordinary limbs, seven observed moving NPCs, zero browser errors. No body, physical position, movement rule or terrain injection. The receipt's generic scope sentence predates the added key-navigation step; its navigation rows and recorded actor/intent/parts establish that the swimmer is player controlled. Its contact-toggle timing is a separate diagnostic and does not compare swimming implementations.

Native gameplay and staged before/after frames were inspected. The strokes have tighter recovery and recognizable fan/retraction rather than terrestrial walking in water. The first AUTO-only capture found no swimming and was rejected; that failed observation is retained separately. It is not product failure or acceptance evidence.

## Remaining

Natural autonomous aquatic swimming is not proven by this player capture. Tail-bearing swimmers, underwater behavior and artistic variety need broader native evaluation. Flight/glide/landing, climbing/burrowing, behavioral expression, art expansion, environments, audio/voices and interface/settings remain active. Claude owns comprehensive biological, integration and performance validation. No public release or save migration occurred.
