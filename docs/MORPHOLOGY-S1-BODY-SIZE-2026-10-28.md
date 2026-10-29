# Morphological evolution S1 — inherited body size (foundation)

This is milestone S1 of the creator's morphological-evolution brief (October 28): an authoritative inherited body size, growth toward it, physical mass and size-scaled endurance.

**Status.** Implemented and tested with the rule **off by default**. `body-size/1` is recorded only when a world is created with `bodySize: true`. It will be switched on for new games only after the reserve-conversion step described under "Next steps" lands. Until then, larger bodies would pay costs in the wrong units at food intake.

## What existed (inspected first)

- **Adult mass.** Under `relative-anatomical-load/1` adult mass is the sum of each part's reviewed load × 0.29. The legacy policy uses per-species mass. Current mass is adult mass × `growth³`, where `growth` is the linear development fraction from `developmentFor` (`organisms/body-mass.js`).
- **Growth is funded.** `ecology/juvenile-biology.js` charges a juvenile for each day's added tissue, and its development clock waits when reserves are below the growth floor.
- **`fasting-2`** (`ecology/metabolism-policy.js`, creator decision October 23) calibrates each body's resting cost so full reserves last 15 days of food and 3.5 of water at rest, regardless of size or anatomy. Reserve capacity is the species constant `maxEnergy` / `maxHydration`.
- **`genes.body`** (0.72–1.28) only affects strike damage and the visual proportions in `phenotypeFor`. It is not physical size and is unchanged.

## `body-size/1`

- **Genome.** Each body carries `bodySize: {schema: 1, alleles: [a, b]}` in natural-log units. Adult linear scale is `exp(mean(a, b))`, relative to the body's own anatomy.
  - Inheritance takes one allele from each parent (segregation), each with a uniform mutation of ±0.03.
  - Founders draw both alleles in ±0.05, a scale of about 0.95–1.05.
  - `/1` bounds the scale to 0.5–2×. Larger bodies wait for structural support (S3/S7).
  - Nothing selects toward any size.
- **Inheritance paths.** Conception snapshots (`gestation.js`) carry the allele pair, so a father who dies before the birth still contributes. Wildlife and the player use the same `spawnAnimal` path. Regions entered later inherit the rule at construction, so their founders carry size, and the rule appears in the rule copy and the preparation key.
- **Mass.** Adult mass = anatomical mass × scale³, at equal density. `bodyMass`, funded growth, prey biomass and predator appraisal then follow automatically. Young bodies grow along the existing curve to their own inherited size.
- **Endurance.** Reserves are kept in species capacity units, so capacity effectively grows with mass. In `basalScale`, resting energy follows mass^0.75 (Kleiber) and evaporative water loss follows body surface, mass^(2/3).
  - A reference-size body keeps `fasting-2` exactly.
  - A 2× body (8× mass) lasts 8^0.25 ≈ 1.68× as long without food and 8^(1/3) = 2× as long without water. It needs 8^0.75 ≈ 4.8× the total resting food.
- **Persistence.** The rule and every organism and snapshot size are validated on restore. A size without the rule is rejected, as are an unknown rule and out-of-range or malformed alleles.
- **Presentation contract** (read-only, proposed to Codex in `PRESENTATION-COORDINATION-2026-10-28.md`): `bodyDimensionsOf(animal)` returns `{adultScale, currentScale, growth, stage, adultMass, mass}`.

## Evidence

`tests/body-size.mjs` (new, gated, Node 22 and 24). This is the controlled Scenario A demonstration: parent sizes are set, and inheritance, growth and costs use the real rules. It checks:

- founder variation;
- 40 offspring of a 1.5× mother and a 1.1× father, each with one allele from each parent, at scales 1.25–1.32 around the geometric mean;
- bounds;
- the conception snapshot;
- newborn and adult dimensions;
- mass = anatomy × scale³;
- growth cost in proportion to scale³;
- endurance exponents exact, with the reference body unchanged;
- exact save and restore with six continued ticks, and five rejection paths.

Worlds without the rule are bit-identical: the modernization fixtures, the `/2`–`/3` and policy-compatibility references, and the body-reserve, tissue-energy, reproduction, parental-inheritance and persistence suites all pass unchanged.

## Next steps, in order

1. **Reserve conversion** (completes S1; then enable for new games).
   - Divide every absolute intake of food energy and water by `reserveScale` (scale³). That means about 20 energy sites and 14 water sites: plants, carrion, kills, freshwater and marine meals, eggs, caches, roots, cave water, snow, tissue water and population-model meals.
   - Convert transfers between bodies (milk, provisioning, birth budgets) from the giver's units to the receiver's.
   - Divide mass-based absolute costs, such as growth cost and birth funding, by the payer's `reserveScale`.
   - Scale bite amounts with mouth area (scale²), so large bodies are not starved by a fixed bite size.
   - Prove every site with a paired accounting test, and keep old worlds bit-identical, since R = 1 there.
2. **S2 movement and structure.** Acceleration and turning (inertia ∝ mass, force ∝ cross-section), locomotion cost per distance, jumping, climbing, flight feasibility and fall damage, all bounded by structural support from limbs and skeleton. No automatic size bonus.
3. **S3 anatomical compatibility.** Support requirements per part and body load, and explained invalid combinations.
4. **Later.** S4–S9 follow the brief, with the revised hydrology plan as S5.
