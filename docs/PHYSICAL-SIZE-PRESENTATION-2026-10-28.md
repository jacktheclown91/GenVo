# Authoritative inherited size in gameplay presentation

The gameplay renderer now reads `adultSizeScale(animal)` from Claude's `body-size/1` authority. It scales the complete mounted rig, limbs, coverings, facial anatomy, body contact effects and shadows consistently. The existing development query still supplies juvenile proportions once; `currentScale` is not multiplied by growth again. A body without inherited size takes the exact existing scale-1 path.

Distance-driven gait now accounts for the inherited length of a stride. The grounded-contact tracker converts each animal's local artwork into world coordinates with its own size, resetting stale anchors if that size changes. Larger bodies receive larger view-edge margins and the existing UI obstruction bounds follow the actual draw scale. World-space ascent, dive and cave offsets retain world zoom rather than being multiplied by animal size. Regional fauna use the same drawAnimal path.

This consumes physical inheritance/mass/costs already implemented by Claude; it does not implement collision footprints, support capacity, structural reinforcement or inertia. S3 compatibility and clearance remain dependencies. No speed, movement, mass, alleles, resource balance, save schema or biological event is changed by this presentation package. It is not C4 completion or 3x giant support.

## Scratch surfaces

Continuous inherited scales exposed the old single-size scratch canvas being replaced whenever adjacent animals had different raster sizes. A maximum-eight-size LRU now reuses these surfaces. Base surfaces and finished-sprite rotations share the existing total 32 MiB budget. This changes neither cached biological state nor asset resolution. `sprite-scratch-size.mjs` verifies alternating-size reuse, eviction and the shared byte ceiling.

## Evidence

- Ground-contact paint: 159,654 consecutive support observations over real legal modular bodies, all eight directions, three zooms and sizes 0.5/1/1.5/2. Maximum anchored drift 2.29e-16 tiles. Actual painted foot coordinates are checked, not only an unpainted skeleton.
- Focused ground contacts, limb handedness (3,312 probes), canonical Lab development (160 rigs), body-size inheritance/persistence and S2 physics pass. Architecture and canonical-source gates pass.
- `tools/review-physical-size.cjs` launches the real app and public New World/onboarding/movement/pause controls. The final player moved 1.27 tiles. Actual naturally initialized adult scales span 0.9553-1.0440; screenshots at32/64/128 retain the same world reference.
- Explicitly controlled furred, feathered and armored clone-only bodies at0.5/1/1.5/2 and adult/newborn ages pass through actual renderer.drawAnimal at fixed normal2x zoom. These are 72 paint cases. They are neither added to Simulation nor presented as evolved large wildlife. The complete encoded saved graph remains exact before/after painting. 64px armored and128px fur comparisons were visually inspected.
- Final native receipt: `physical-size-presentation-2026-10-28/final/receipt.json`. Small-world median render times32/64/128:19.3/19.0/18.6ms; p95:25.4/24.7/28.7ms (12 samples each, no baseline claim). Six retained scratch sizes occupy4,840,064 bytes. Mature-world performance remains open.

Earlier native evidence and the review-server MIME failure are retained in their original directories. `native` covers the first legacy-shaped founder; `modular` records the missing .mjs MIME failure; `verified-modular` and `final` cover the actual modular specimens. Final source was rerun after the cache correction. No creator acceptance or global64px switch is claimed.

## Remaining

Demonstrate physically supported1x/1.5x/2x animals living together and navigating real structures, broaden movement and culling evidence around large rigs, expose inherited dimensions in Lab/evolution comparisons, and improve anatomy-dependent visual weight. Coordinate structural support, clearance and eventual3x with Claude. The full C1-C8 goal remains active.
