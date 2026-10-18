# E3: Evolution-earned insulation, gripping limbs, and flightless wing precursors

## Biology first

E3 adds six costly, inheritable modular anatomical parts. Each stays bound to real torso, limb or spur sockets, the existing lineage editor budget, and the ancestral prerequisite graph:

| Part | Mount | Ancestral prerequisite | Mutation points | Applied function |
|---|---|---|---:|---|
| Filament tuft | Dorsal | None | 2 | Weak cold insulation |
| Fur mantle | Dorsal | Filament tuft | 4 | Strong dry cold insulation, reduced when wet, heat penalty |
| Feather mantle | Dorsal | Filament tuft | 5 | Cold insulation, better when wet than fur, heat cost |
| Proto-wing | Dorsal | Feather mantle | 7 | Display precursor ONLY. No lift, flight or air movement |
| Climber leg | Limb | Grasper | 4 per leg | Requires at least two gripping units to improve uphill purchase |
| Hook pad | Spur | Grip pad | 3 per pad | Two paired hook pads provide smaller uphill purchase |

The lineage editor offers these within the existing 8-point base budget (+ at most 4 earned points). A new body plan cannot skip `filament-tuft -> feather-mantle -> proto-wing` in one edit, nor can it create a climber leg without ancestral grasping limbs. Stable matching-body mating grants the next-generation editing opportunity; hybrid mating continues through the existing recombination and inheritance authorities. Existing living adults are never edited.

## Actual physical effects and honest limits

- `src/lineage/terrain-cover-physiology.js` reads actual mounted part counts, not named species.
- The ordinary `Simulation.phaseMetabolism` multiplies its existing **temperature-dependent energy cost** by body insulation. In cold, bare skin is reference 1; filament tuft 0.78, fur 0.48 dry, feather 0.55 dry, proto-wing 0.83. Wet fur loses more of its insulating benefit than feather cover; a wet coat is derived from actual rain and soil moisture and never invents stored water or energy. Hot conditions increase thermal burden of dense fur, feathers or membrane. The existing part-upkeep system separately raises metabolic expense for complex anatomy.
- `movementProfile` applies real uphill purchase only after `terrainTravel` computes physical height/grade. At least two mounted climber legs, or equivalent pairs of hooked pads, are necessary. Grip offsets only a fraction of the existing uphill speed and movement-energy costs; flat ground has a slight penalty. No flying, vertical layers, tree canopy traversal, wall teleport or cliff immunity has been introduced.
- The proto-wing is a **costly evolutionary precursor for later flight engineering**, not an already functional flying creature. Airborne movement requires future aerodynamic lift, strength/weight, thrust, fatigue, collision, altitude, feeding and lineage balance contracts. Adding an action named `fly` without those rules is prohibited.
- New art is not yet the final authored 32x32 anatomy pack. The art pipeline will need custom visual silhouettes, mounted body layer integration and more animation detail in its own workstream.

## Verification

`tests/anatomical-climate-precursors.mjs` verifies ancestor gating over successive lineage handoffs; real mutation costs; no ability to gain flight; wet/cold/hot thermal tradeoffs; the actual creature's food-energy use through `phaseMetabolism`; multi-limb grip and real slope speed; and exact save-and-resume with an inherited feather plan. GitHub CI runs part-registry/editor, reproduction/lineage, thermal survival, terrain/movement and save contracts, plus unchanged full fast tier including original absolute 500 ms at 4x.

### Scope boundary

No new energy or materials are created. No constant species bonuses, no additional RNG stream, no extra global actor scans. Existing bodies and world simulation behave unchanged without the mounted E3 parts. This is an evolutionary physiology feature on the current world, **not yet** continental fauna, finished flight, climbing into a second elevation level or final visual art.
