# GenVo8 — Dual reproductive anatomy (development design)

**Human creator direction:** 12 October 2026. **Implementation:** AI-assisted development of the existing canonical reproductive system. **Release status:** development-only.

## Physical expression and inheritance

- Existing creatures without specialized organs are live-bearing; old saves remain valid.
- A mounted `egg-chamber` expresses egg-laying ability. If no separate live-bearing organ is mounted, offspring are produced through the persistent egg lifecycle.
- A mounted `live-womb` provides the optional physical live-bearing pathway. Alone, it retains live birth with an anatomical cost; **with the `egg-chamber`, the body can choose either egg laying or live birth**. The creature cannot create two broods from one pregnancy.
- Both organs use real flank sockets and the original body-plan validator, physical crossover inheritance, editor mutation budget and procedural part-art renderer. Offspring may inherit both, either, or neither; selection is not guaranteed to preserve dual ability.
- Mating compatibility, reciprocal choice, anatomy-editor availability and actual newborn genetics remain governed by their original systems. Reproductive body configuration—not learned rituals or a species label—determines capability.

## Tactical choice and real costs

- Gestating player creatures with both organs can cycle their **next** brood strategy inside the mate panel with `V`: adaptive → live → egg → adaptive.
- Adaptive selection (also used by autonomous dual-bodied creatures) evaluates the actual laying site's suitability and the pregnant animal's finite current energy/hydration. It consumes no extra RNG. Egg laying can be favored at favorable, well-provisioned sites; otherwise live young are favored. This is a strategy, **not** a success guarantee.
- The choice freezes at successful conception and is written into `pregnant.mode`. Neither later body edits nor later player strategy changes can convert an already-funded pregnancy. The strategy itself is not inherited as a genetic preference.
- Dual capability occupies **12 combined mutation points** before other parts (egg chamber 5 + live womb 7), two anatomy slots, and adds 1.9 units of nominal part mass. The registry's descriptive upkeep metadata is not automatically executed across all parts; accordingly, dual mode separately pays explicit ongoing real energy and hydration consumption in `Simulation.phaseMetabolism()` (`0.022` energy and `0.008` hydration per metabolism tick) while both organs are present.
- Every dual conception additionally spends up to **6 maternal energy and 2 paternal energy** outside the ordinary brood investment. These switching costs do not become offspring reserves. A depleted organism may fail to support its young despite possessing both pathways. Reproductive resource availability can therefore select against costly generalism.
- Existing egg mode uses the established 3–5-egg finite clutch, optional nests, environmental incubation, parent care, and egg predation. Live mode uses the existing funded live-birth path. Do not claim uniform reproductive success across world seeds.

## Canonical module authority

`src/reproduction/reproductive-anatomy.js` is the one mode authority. `src/ecology/birth-investment.js` is the resource funding authority. `src/sim/simulation.js` owns actual conception, metabolism, egg laying, birth and hatching. `src/lineage/part-registry.js` and `src/render/part-sprites.js` own physical parts and drawings. No parallel offspring, renderer or simulation implementation exists for dual reproduction.

## Important limits

- Live-womb is the new optional paid organ; ordinary legacy live birth deliberately remains available without it.
- High-cost dual anatomy is neither guaranteed superior nor forced into or out of a population.
- Adaptive choice is a simple environmentally informed heuristic, not evolved maternal decision genetics, parental negotiation, or a new dynamic clutch-allocation system. Its exact thresholds and costs are **developer candidates** awaiting playtesting.
- Mutation and population success are not forced to converge across seeds. Safe mechanical tests check actual route, ancestry, payment, legacy saves, deterministic choice, physical validity and usable UI controls.
- Detailed dedicated reproductive animations and visual acceptance remain separate work.
