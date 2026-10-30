# Morphology presentation contract (for Codex)

Claude owns authoritative morphology; Codex owns its presentation (brief §15). Everything below is **read-only**: each function returns a value (frozen where noted) computed from canonical state, and presentation never writes it back. No new mutable state was created for presentation.

This complements `PRESENTATION-COORDINATION-2026-10-28.md`. That document is left untouched because Codex has open edits to it.

| Information (brief §15) | Source | Returns |
| --- | --- | --- |
| Current physical dimensions, inherited adult size, growth stage | `bodyDimensionsOf(animal)` in `organisms/body-mass.js` | Frozen `{adultScale, currentScale, growth, stage, adultMass, mass}`. `currentScale` is the linear scale to draw at, relative to the anatomy's reference size (0.5–3× in `body-size/2` worlds). |
| Body proportions and structural anatomy | `animal.bodyPlan` (canonical nodes), `phenotypeFor(animal)` in `organisms/species.js` | Existing anatomy and phenotype, unchanged |
| Structural load and stress | `structuralViability(sim, animal)` in `organisms/structural-support.js` | Frozen `{state: 'sound' \| 'strained' \| 'overloaded', stress, legs, bodyLoad, legLoad, limits, reasons}`, for posture or effort cues |
| Supported locomotion | `movementProfile(animal, world, …)` in `lineage/lifestyle.js`, `flightLoading`, `glideLoading`, `jumpLoad` | Existing travel profile (swimming, ice, grip, `traction`) and launch feasibility |
| Actual movement state | `motionStateOf(animal)` in `organisms/motion.js` | Frozen `{vx, vy, speed, heading, ax, ay, acceleration, braking, turnRate}`, for gait blending, lean into turns and skids (`inertia/1`) |
| Anatomical expression state | `aridExpressionOf(sim, animal)` in `ecology/arid-physiology.js` | Frozen `{heat, frillFlushed, waxSealed, aestivating}` |
| Physiological stress | `animal.energy`, `animal.hydration` against the species maximums; `animal.torpor` and `animal.torporKind` (`'aestivation'`); `structuralViability` | Canonical fields |
| Environmental conditions | `dayPhaseOf(sim)` and `airTemperature(sim, i)` in `ecology/diurnal-temperature.js`; `sim.climate` | Frozen `{timeOfDay, daylight, night}` for lighting; air temperature by the hour |
| Interaction reach and render bounds | `sim.reachBetween(a, b, base)` | Contact distance that grows with body size under `body-size/2`; suitable for matching render bounds to physical reach |
| Visibility | `visuallyObservable(sim, observer, target)` (existing) | Already includes apparent size under `body-size/2`. Small and young animals are visible to the player at shorter range. |

## Shared-file changes made during S1–S9

Each change is one line in `src/main.js` `SURVIVAL_OPT_IN`, announced in its commit message:

`bodySize: 'body-size/2'`, `inertia`, `structuralSupport`, `aridPhysiology`, `climateWater`, `diurnal`, `autonomousEvolution`, and founding `/3` through `REGIONAL_FOUNDING.policy`.

No renderer, audio, UI, style or HTML file was changed.

## Open presentation items (Codex)

- Draw creatures at `currentScale`, so giants and young bodies appear at their real size.
- Day–night lighting from `dayPhaseOf`.
- Gait, lean and skid from `motionStateOf`.
- Strain posture from `structuralViability`.
- Frill flush, wax sheen and a dormancy pose from `aridExpressionOf`.
- Seasonal pools and recession already use the existing water mask and art.
