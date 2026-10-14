# GenVo — Clonal Flora Inheritance

Integrated botanical development checkpoint, 2026-10-13. The creator explicitly selected clonal inheritance first. Eight gameplay modules changed from the delivered Organic Food-Web Resource Cycle. Sexual reproduction, compatibility genetics and hybrids remain outside this slice.

## What changed in the living world

Funded propagules can now inherit a reproductive-allocation variant. New clonal propagule packets can mutate their seed allocation; established standing crop cohorts retain their adult genome. An incoming genotype cannot overwrite a living crop, and genotype objects are frozen after creation and load. Genome identities derive from actual trait values rather than an animal species class or a plant display name.

More reproductive allocation leaves less edible flesh in the same finite crop biomass. Through the existing foraging controller, a seed-rich crop gives less edible energy but supplies more viable propagule biomass to a compatible eater. Flesh-rich crops reverse that tradeoff. Local release still debits its real parent reserve. Clonal offspring created during actual viable-seed extraction or local release carry their source/parent genotype; mutations never change adult traits or grant free food, biomass, currency or energy.

Seed banks and animal cargo retain separate genotype quantities. Equal genotypes can share a cohort; distinct rare genotypes are never discarded just to meet a record limit. Physical decay and consumption change their quantities. Establishment samples actual cohort weights instead of always choosing the largest record, and an established tiny seedling is protected from the previous generic low-stock reset. Current aliases/cell each hold one standing producer genotype; other genotypes remain in its bank until an establishment opportunity exists. Source provenance is marked ambiguous when identical genotypes from different parents/routes merge.

Existing crop inspection now identifies seed-rich/flesh-rich inherited crops and actual tissue amounts. Mature fruit presentation uses the inherited allocation for small native fruit/color differences through the existing flora renderer. Seed evidence understands mixed-genotype cargo and only claims a later establishment when timing and cohort information support it. Normal Interact/radial/keyboard execution remains shared with the established feeding authorities.

## Source modules and ownership

- `ecology/flora-genotype.js` retains founder migration payloads and validates immutable clonal variants.
- `ecology/flora-inheritance.js` is the new helper for registered genotypes, frozen standing cohorts, funded-production inheritance, independently hashed mutations, persistent seed cohorts, weighted establishment and migration/validation. State belongs to the existing dispersal controller; there is no new simulation reproduction controller or modified animal reproduction implementation.
- `ecology/dispersal.js` integrates the helper with paid local release, actual viable-seed harvests, mixed cargo, deposition, decay and occupied-cell protection. Old `bankGenomes` metadata remains a compatibility view; actual genotype quantities live in `floraState.seeds`.
- `ecology/plant-resources.js` preserves established offspring during early growth without bypassing their finite resource inputs.
- `gameplay/discovery.js` handles mixed-genotype deposit evidence and avoids overstating parentage of merged records.
- `render/flora.js` and `render/renderer.js` carry the actual inherited allocation into existing native crop drawing.
- `ui/world-resource-target.js` presents inherited identity and actual tissue constraints through existing inspection.

Exact source changes: `clonal-source-receipt.json`.

## Contracts and prototypes

The approved reproduction mode is clonal propagation. The existing resource aliases remain migration/feeding keys, not sexual compatibility rules. Bramble and pod reproductive tissue allocations can mutate; reeds currently clone their unchanged founder profile. One production packet is a genotype quantity cohort, not an individually simulated counted seed. This pass does not introduce pollen, flowers, selfing, gametes, sexual recombination or hybrids.

Conditional mutation probability is provisionally 0.12 per production packet with a ±0.02 allocation step, bounded to 0.08–0.36. Other traits stay inherited and unchanged. These values are implementation prototypes, not approved biological balance. Physical soil/water/mineral/energy and tissue accounting remains the prior normalized resource contract. Genome tables preserve registered identities; current cohorts use continuous biomass quantities, not integer plant population counts. A standing crop/cell may depict several native plant clusters sharing its genotype, rather than independent plant agents.

An independent deterministic inheritance hash uses the world seed, source cell, day and production serial. Plant reproduction does not consume animal RNG. Mutation happens in newly created material; no stable adult phenotype is rewritten. Birth receipts are bounded to 128 recent events, but registry/cohort identity is not deleted for that logging bound. Same-genotype grouping can make precise source parentage ambiguous; it never fabricates a uniquely known parent after merging.

## Verification and runtime evidence

20 focused suites passed, recorded in `clonal-test-receipt.json`. The new check covers actual clonal mutation, adult immutability, inherited tissue allocation, weighted selection of a rare genotype, rare-record retention through decay, mixed-genotype cargo/deposition, occupied-cell protection, resource-funded harvest, independent RNG, old/current saves and invalid genotype rejection. A controlled phenotype comparison runs the real feeding command for 18% versus 22% seed allocation: flesh-rich feeding yields more actual energy; seed-rich feeding transfers more viable propagule mass. This is controller consequence proof, not a natural selective outcome.

`clonal-prior-save-receipt.json` verifies snapshots generated by the exact previously delivered Organic Resource Cycle source. Current plant stocks, seed stocks, organic resources and RNG round-trip unchanged; legacy scalar banks are represented as known founder cohorts without inventing historical variation.

**Controlled native Chromium, 800×600:** controlled player/reserve placement and 180 canonical vegetation phases mature actual paid crops. There are no genotype/biomass writes or animal RNG edits; actual resource inputs are charged. This is explicit phase-fixture maturation, not natural elapsed gameplay or a new player ability to advance plant phases. The player mouse-selects, inspects and eats an actually established 22%-allocation crop. The 0.16 meal produces approximately 0.1248 edible flesh and 0.0352 viable propagules, preserving its parent genotype. Full Map-aware save comparisons cover registry/adults/seed cohorts and mixed cargo rather than merely JSON-stringifying Maps as empty objects. `clonal-flora-proof.json`, full screenshots and `clonal-flora-runtime.webm` record this workflow. No new artwork/visual approval is claimed from it.

**Separate natural observation:** 120 wall-clock seconds at normal speed, fresh generated world, ordinary Auto/Keep the old body UI choices only. No anatomy, genotype, stock, RNG or clock fixtures. `natural-clonal-proof.json` and `natural-clonal-runtime.webm` report actual funded propagules, mutations, variant establishment and mixed seed banks. These establish occurrence, not human discoverability, ten-minute retention, stable selection or long-term ecological acceptance.

**Measured resource-only probe:** three seeds × 100 resource days reconcile nutrient inventory under the new inheritance model; no animal lifecycle or field fixtures. `clonal-resource-probe.json` includes retained cohort counts, registered genotypes, actual serialized snapshot bytes and vegetation-phase timing. These are machine/scene measurements, not settled performance budgets. The current probe does not establish naturally reproducing later-generation variants; retained variant-parent birth receipts are separately reported. The controlled native meal does demonstrate that a variant parent produces genotype-preserving offspring.

Final natural observation reached tick 975: 13696 production packets, 1330 mutated packets, 51 live variant standing cohorts, and 363 mixed-genotype bank cells. These are cohort quantities/locations, not counted individual plants. The three 100-day probes retained 37868–38290 seed-cohort records; serialized snapshots were 17.56–17.66 MiB, with measured mean vegetation phases 27.34–30.88 ms. This increased persistence footprint is an explicit remaining cost; it was not reduced by erasing rare variants.

## Limits and next substantive work

Pollen-based sexual reproduction/selfing/hybridization and exact compatibility genetics remain open. No natural allele fixation, long-term adaptive advantage, multi-generation natural plant lineage, integer demographic counts or independent trees have been proven. Other plant anatomical/physiological traits remain fixed; protective coating inheritance and actual anatomy-specific resistance are still future work. Normalized units and reproduction coefficients need calibration before asserting evolutionary balance.

The admitted environmental inventory still excludes complete organism/egg/cached-food elemental accounting and lake depletion. Existing map-edge blank space and small/crowded crop silhouettes remain presentation limitations. Genotype cohort persistence increases snapshot size and needs continued measurement as more trait axes are admitted; rare variation was not silently removed to improve these measurements.

The prior freshwater-access assertion and four documented historical birth/courtship failures remain outside full-suite certification. No new scoped failure was observed.

**Next meaningful milestone:** an inherited protective-tissue/feeding slice with real mouth handling and costs, so plant defense changes actual feeding and reproductive consequences. Then admit pollen-based reproduction through a creator-approved compatibility model. This progresses toward the proposed plant–animal feedback loop without silently resolving sexual genetics or bulk-generating content. Physical elevation/climbing/flight remain staged separately.
