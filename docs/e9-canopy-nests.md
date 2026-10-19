# E9: Woodspire canopy roosting and nesting

Content-first evolution milestone stacked on E8. **Canopy is a third, persistent ecological layer** within each tile of the current 128x128 world: ground, moving airborne and a stationary perch anchored to an existing living Woodspire stand.

## Anatomical / habitat gates
- `flight-wing` after the prior multi-generation filament, feather and proto-wing lineage.
- At least **two installed grasping or climbing legs**. Named species grants nothing.
- Tree must have at least **0.85** actual Woodspire biomass. The **real adult anatomical mass** must be no more than **1.65 times** that standing biomass. This is load-bearing capacity and no fictional tree canopy without biomass.
- The winged organism takes off with its existing finite food-energy cost; **7** or **Perch** in the mouse survival dock grips a viable tree. **6** relaunches if sufficiently fueled. **7** descends to ground; perched animals cannot walk or raid ground food. Roosting avoids the continuous flight burn, but normal metabolism still applies.
- Sudden depletion, flooding or loss of required limbs causes a physical **fall with injury**, not a teleport or free rescue. Wild animals can perch to avoid ground predators and leave when they need ground activities.

## A real, nonduplicated egg lifecycle
- An egg-laying mother already perched in a sufficiently strong canopy can build a nest directly from **0.18 Woodspire biomass**. The tree must still have enough tissue after nest construction to support the adult.
- The resulting nest is the normal canonical nest object with `layer:'canopy'` and its standard IDs, integrity, cost, parental care, clutch, incubation, exhaustion and decay. No second egg population or hidden food store. The same save/load retains the perch and nest height.
- A parent must actually be **perched at that tree** to care for a canopy clutch. Ground attackers cannot raid it, and flying attackers must perch to reach it. Deteriorating tree support directly erodes nest integrity.
- Existing funded eggs still **hatch on the surface under the tree**; no juvenile independent flight or biologically unsupported climbing is granted.
- If the tree cannot fund nest material while the parent is perched, the parent descends and lays un-nested ground eggs instead of creating floating eggs. Clutches remain vulnerable to weather and predators.

## Finite canopy nutrition
- Perched, compatible mouths may eat the actual Woodspire crop from their current tile through the existing `ForagingController.consume` and `PlantDispersalController.harvestMeal` authorities. This removes canonical plant, seed and coat tissue, charges processing costs and may carry viable seeds for later dispersal. No fabricated canopy food or free calories.
- `E` uses canopy feeding and, when available, nest tending; `Q` cycles existing actionable choices. No surface picking while perched.

## Boundaries
This is a stationary treetop/perch model, not continuous climbing heights, multi-level forest collision, aerial predation, juvenile canopy occupation, flight thermals or a streamed multi-continent world. The 32px authored replacement artwork and comprehensive wildlife tuning need later review. Fallback rendering offsets canopy bodies, eggs and nests in the **existing top-down** camera.

Validation: only targeted `tests/e9-canopy-nests.mjs`, module syntax and no full regression/benchmarks.
