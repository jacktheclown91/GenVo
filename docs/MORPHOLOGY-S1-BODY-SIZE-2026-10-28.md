# Morphological evolution S1 — inherited body size (foundation)

This is milestone S1 of the creator's morphological-evolution brief (October 28): an authoritative inherited body size, growth toward it, physical mass and size-scaled endurance.

**Status.** Complete. `body-size/1` is **on for new games** (`SURVIVAL_OPT_IN` in `src/main.js`, alongside fasting-2 metabolism, which it requires). Saved worlds keep their recorded rules: a world without `bodySizeRules` never gains it, and every conversion below is the identity for a body without an inherited size, so recorded worlds replay bit-identically.

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

## Reserve accounting

Food and water are absolute outside bodies: world plant, carrion, freshwater and snow stocks, groundwater, prey and carcass tissue and water, eggs, shelter stores, milk, and birth budgets. Each body keeps reserves in its species' capacity units, so one reserve unit of a body of scale s holds R = s³ absolute units. `body-size.js` has the boundary conversions `toReserve` / `toAbsolute`, plus `mouthScale` (s²) for per-action amounts.

| Site | Rule |
| --- | --- |
| Wildlife sip, player drink, cave seep | Draught × mouth area; the gain enters reserves ÷ R; seep debit capped by the absolute deficit |
| Freshwater meals and filter feeding (live, drinking, aquatic step, player, archived regions) | Harvest limit is the absolute deficit (or mouth-scaled rate); the gain enters ÷ R |
| Plant bites (wildlife, player, crop tissue, archived regions) and tissue water | Bite × mouth area; energy and water ÷ R; plant water per reference bite scales with the mouthful |
| Carrion bites, kill meals, player kills | Bite × mouth area; the gorge limit stays absolute tissue (body mass share); the deficit is converted to absolute |
| Prey, carcass and scavenged water | Absolute between bodies: the prey loses its reserve share × R_prey, the eater gains ÷ R_eater; the ledger is absolute |
| Egg predation, roots, snow (and melt energy) | Absolute contents and costs; the mouthful follows mouth area |
| Shelter stores (eating, autonomous support) | Draw is limited by the absolute deficit and a mouth-scaled rate; the gain enters ÷ R |
| Conception, birth and eggs | Each parent pays in its own units; investment, budgets and egg contents are absolute; newborns receive their share ÷ R_child; the mother's water debit equals the absolute water her young receive |
| Milk, nursing and provisioning | Caps are absolute (giver's spare, infant's deficit, infant mouth); the giver pays ÷ R_giver and the receiver gains ÷ R_receiver |
| Funded growth | The day's added tissue (∝ s³) is paid ÷ R, so growth takes the same share of reserves at any size; the `growthPaid` ledger is absolute |

These stay in the body's own units on purpose:
- Fixed effort costs, such as breaking ice, breaking nest cover, care effort, strikes and food handling. Size-dependent locomotion and effort costs belong to S2.
- Gill water uptake, which is already proportional to the body's own resting loss.
- Thermal demand, which S2/S4 will revisit with surface-area heat exchange.

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

`tests/body-size-reserves.mjs` (new, gated) runs the real site for a reference body and a 2× body. It proves absolute conservation and mouth-area scaling for:

- the wildlife sip and player drink;
- player plant meals;
- prey, carcass and scavenger water;
- kill meal limits;
- conception, birth budgets and newborn shares;
- funded growth;
- snow and melt energy;
- egg predation;
- a real live birth (mother's water debit = young's water);
- milk;
- provisioning caps and the father's tended transfer.

It also checks that unsized bodies convert nothing.

A 60-day new-game soak (planetary, full opt-ins, seed SOAK-SIZE-1), with and without body size, ran at the same per-day cost. Day 61 ended with 112 alive and 20 births with size, against 129 alive and 17 births without. Founders draw size alleles, so the runs diverge as different random streams. Inherited scale stayed within 0.95–1.05, with nothing selecting toward any size. This is a stability observation, not a tuning target.

Worlds without the rule are bit-identical: the modernization fixtures, the `/2`–`/3` and policy-compatibility references, and the body-reserve, tissue-energy, reproduction, parental-inheritance and persistence suites all pass unchanged.

## Next steps, in order

1. ~~Reserve conversion~~ — done (see Reserve accounting); enabled for new games.
2. **S2 movement and structure.** Acceleration and turning (inertia ∝ mass, force ∝ cross-section), locomotion cost per distance, jumping, climbing, flight feasibility and fall damage, all bounded by structural support from limbs and skeleton. No automatic size bonus.
3. **S3 anatomical compatibility.** Support requirements per part and body load, and explained invalid combinations.
4. **Later.** S4–S9 follow the brief, with the revised hydrology plan as S5.
