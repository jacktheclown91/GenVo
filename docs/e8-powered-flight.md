# E8: powered flight, first functional aerial-travel slice

**Design:** top-down movement remains 8-directional. The new bilateral `flight-wing` is a descendant of `proto-wing`, which is descended from `feather-mantle` and ancestral `filament-tuft`. Each step must enter the lineage in a reproductive-editor generation: the final wing has a mutation cost of **8**, ongoing part upkeep **0.43**, and physical mass load **0.92**. A named species does not automatically gain flight.

## Actual game effects
- Flight eligibility derives from a living, sufficiently mature, healthy animal's **mounted wing** plus the existing **adult-body mass** calculation (maximum 2.25 relative units), energy reserve, and physical takeoff cell. Heavy/equipped lineages remain grounded.
- Takeoff consumes **6 energy**, not a free action. While airborne, both manual movement and autonomous movement use the existing traversal authority to fly across actual open water and steep terrain. Movement applies its energy/terrain cost; an additional **time-based** flapping energy expense continues while hovering. Rain increases flapping demand.
- The air/surface distinction is persisted as a real animal state, `airborne`. Aerial animals cannot drink, eat from surface resources, or bite surface-dwelling prey, and surface predators cannot simply bite them from the ground. Flying can be used by autonomous evolved wildlife when detecting a nearby predator; wildlife attempts to land in normal non-escape activity.
- Landing requires a valid cell. A non-swimmer cannot land over open water. Exhausting flight energy forces a fall with health damage; it does **not** teleport the creature to land or grant swimming.
- Mouse-first control: **Take off / Land** in the survival action dock. Hotkey: **6**. `R` remains the pre-existing family-command wheel and is not overridden.
- The renderer shows two animated overhead wings, an offset body above the ground, and a separate ground shadow. Ground-contact steps are suppressed while aloft. Art is a procedural fallback pending edited native 32px eight-direction sprites.

## Explicit limits
This does **not** complete aerial ecology: flight height is initially a single above-ground traversal stratum, not multiple collision altitudes. High canopy feeding, airborne prey capture, wind thermals, wing fatigue adaptations, airborne nesting, elevation-based takeoff, richer lift aerodynamics and species specialization remain future work. The world remains the current 128x128 live map; there is no continent paging in this feature. Initial lift/energy figures are provisional balance values, not calibrated physical SI quantities.

## Validation
Only syntax checks for edited gameplay modules and one targeted `tests/e8-powered-flight.mjs` scenario. No heavyweight simulation suite, performance benchmark or release claim. Full saves, art review, actual browser playtest and ecological balance remain integration tasks.
