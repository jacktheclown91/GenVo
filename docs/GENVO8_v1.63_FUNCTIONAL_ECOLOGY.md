# GenVo8 v1.63.0 — Functional ecology migration (development checkpoint)

## Creator direction
The creator challenged the addition of hardcoded new species in v1.61 and v1.62. GenVo8 must produce functional ecological niches from anatomy and inheritance rather than letting a fixed species label grant diet, predation, or behavior. This pass is a direct architectural correction, not approval of the previous named-species direction.

## Implemented
- A single new `src/ecology/functional-diet.js` defines food abilities of **mounted mouth types** and physiology, not species names. Plant categories come from the existing plant registry. Live predation eligibility and effective meal value depend on functional jaw, size ratio, digestion genetics, kin, and actual prey. No arbitrary species whitelist governs these interactions.
- Core `Simulation` routes live hunting checks, prey identification, inflicted damage, energy from consumed prey biomass, nearby danger, auto-forage choice, food commitment, and finite plant/carrion consumption through phenotype evaluation. Swimming and aquatic foraging were already part-driven.
- `WildlifeRhythmController` chooses background action based on individual aquatic, burrowing, seed-beak, carnivore or scavenger anatomy, not founding species IDs.
- Resource capacity/crowding, connected competitor demand, migration forage/predator pressure, individual/family threats, foraging, reproduction egg predation, and family sustainability are routed to functional food/threat evaluations.
- The old `SPECIES` data remains in place for **founder templates, historical compatibility, family records, and legacy animals lacking any bodyPlan**; it is NOT the core feeding/hunting authority for normal living animals. Version increases to 1.63.0 with the existing save schema untouched.
- A new focused test demonstrates a seed-eating descendant becoming a hunter through jaw replacement, losing seed-food capability, reproducing into a jaw-equipped child, surviving save/load and retaining the new ecological role. Removing the jaw reverses the role. Legacy ecological niche, 32px sprite drawing and genetic reproduction tests still run.

## Legacy boundaries (not completed by this pass)
- Founding categories still define fixed initial population counts, initial body plans, nominal sex/reproduction compatibility and much of life-history/social logic. This is **not yet a population-genetics system where new species identity emerges from reproductive isolation**, and therefore no such completion is claimed.
- Some earlier subsystems, HUD labels, specialist encounters, niche registries and optional family/lifestyle routines retain founding-species assumptions; the migration should continue only with real tests, preserving existing guided progression.
- Body-part effect factors normalize many legacy wildlife statistics to a species' starting anatomy. The feeding and predation gates now use physical organs but full physical-stat normalization should be replaced deliberately in a future pass.
- Mating eligibility remains an older same-ancestry check; biological divergence/compatibility must replace that in a carefully governed migration with save support.
- The initial eight starting lineages are still authored bootstrap genetic populations. Replace/collapse them only after emerging inheritance and taxonomy safely preserve player saves, controls, ecosystem survival, and named achievements.

## Verification and acceptance
The new tests include causal phenotype swap, effective hunt and energy, reversible loss of capability, real inherited newborn, save/load, baseline ecology regressions and browser export. No ecological seed is forced to produce specific species. Real Chromium screenshot `docs/runtime-v163-functional-ecology.png` captures the live web scene; browser reported 0 page errors / 0 failed assets. Full 420-day ecological regression and human visual/feel approval remain outstanding. Both `birth-hydration` and `birth-reserves` fail at the same conception-fixture setup in **unmodified v1.62.0** (separately reproduced) and remain known outstanding tests rather than new v1.63 regressions. The stable release manifest stays unchanged; this package is a development checkpoint.
