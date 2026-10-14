# GenVo8 — Physical inheritance, lineage stabilization and modular reproduction

**Creator-originated direction — 12 October 2026.** Current status: physical crossover and editor eligibility implemented as a **first development slice**; the `egg-chamber` and physical egg/incubation lifecycle are **implemented as a first slice**, while a distinct live-birth organ and dual-mode breeding remain planned. Authorship: design decisions supplied by the human creator; technical proposal and source implementation AI-assisted.

## Foundational rules

1. **Mating is not a free editor trigger.** The editor is guaranteed to be *offered* after a player-controlled creature mates with a compatible partner whose mounted physical body parts and sockets match exactly. This grants an opportunity to spend the existing mutation budget on the next litter, not a promise that a mating or pregnancy occurs. Behavioral preferences, learned rituals, personality, sex and temporary state do not change editor eligibility. Do not mistakenly use identical `species` label alone as the gate: player-led descendant branches can retain the same root species yet have radically different builds.
2. **Crossing different body builds produces inherited mosaics.** Offspring receive complete socket-mounted anatomical groups from either biological parent, including attached subparts such as spurs. Root/torso determines valid sockets. Paired/mirrored appendages usually inherit together. Only real parent-expressed parts are available for crossover; optional bounded spontaneous mutation can occur under the existing mutation rules. Never directly replace mixed kids with the player's complete desired target plan. Parentage and bodily capability must remain honest.
3. **Selective stabilization is gameplay.** The player selects and protects descendants who express the intended build, then pairs sufficiently similar builds. Two to three generations is the *intended accessible experience* when keeping and pairing compatible siblings/cousin branches, not a deterministic forced convergence. Natural selection, mutations, mate refusal, kinship and demographic scarcity can delay or defeat this. Future UX: each offspring's matching parts, family resemblance, and expected mating/editor gate. Stabilization means the *expressed part arrangement* matches, not that every latent hereditary allele is fixed; heterozygosity can remain and future offspring can vary.
4. **No hard script for lineage outcomes.** A stable body can later diverge again through an editor change, spontaneous mutation, gene flow, or reproduction-mode switching. A failed branch can go extinct. Trait distribution across seeds should remain diverse and causal.
5. **Current compatibility stays authoritative.** The existing species-level mating and kinship gates still apply. Different branches inside GenVo8 (`genvo`) can exchange genes when allowed. Truly cross-species hybrids across distinct root species are not supported by this slice and must not be advertised as playable.

## Implemented first slice

- `src/lineage/body-inheritance.js` is the canonical physical-recombination authority. Matching uses canonical part-plan ID; no arbitrary similarity threshold, behavior score or appearance-only metric. For mismatched plans, selection uses the existing seeded simulation RNG, chooses a root from one parent, and copies valid mounted groups from both parents. Core mouth/eye/limb groups have compatible-parent fallbacks to prevent accidentally fabricating missing vital parts. Non-vital absent ornament/defense groups can remain absent. Plans always pass canonical socket validation or conservatively fall back.
- `src/lineage/evolution-editor.js` offers next-generation editing only to matching physical pairs. Mixed pairs use inherited offspring instead; the player receives a notice and the mate panel distinguishes the two outcomes.
- This slice does **not** guarantee a 2–3 generation stabilization time, introduce recessive body-plan alleles, change species mate barriers, reduce DNA budgets, or alter live birth.

## Reproductive anatomy — egg lifecycle implemented; remaining direction

Make reproductive phenotype as modular and heritable as locomotion or display parts. This needs **real connected mechanisms**, not decorative egg art or species-fixed `litter` tuning.

| Proposed capability module | Biologically meaningful effect | Costs and constraints |
|---|---|---|
| Embryo-support organ | Supports live gestation and live-born offspring | Continuous metabolic load, gestation occupancy, smaller typical brood, larger newborn reserves |
| Oviposition organ | Supports producing external eggs | Up-front energy and water investment, clutch size limited by stored reserves, egg protection and incubation required |
| Shell/coating gland | Increases egg resistance in dry or cold environments | Part cost, ongoing upkeep, material sourcing |
| Brood/nursery pouch | Temporary embryo/egg/young protection; does not independently grant reproduction | Carrying cost, increased body burden, predation vulnerability or mobility penalties |
| Incubation/heat organ | Improves incubation in some climates; can be absent if ambient habitat works | Sustained metabolic cost, higher caloric demand |
| Dual-mode reproductive regulator | Lets one compatible body select live birth or egg laying at conception when it also has both functional delivery systems | High mutation/DNA-point budget and upkeep, heavy reproductive reserves per use; **never** two free broods from the same mating |

**Cost model:** use the existing per-part mutation cost and mass/upkeep pipeline; add a reproducible per-embryo investment budget before assigning brood number. Larger clutches should trade off offspring starting condition, clutch safety and habitat fit; no new energy or hydration created at laying/hatching. Both modes may disappear through inheritable part loss, freeing mutation capacity for other adaptation choices. Do not universally reward one reproductive form.

**Evolutionary tradeoffs:** egg layers can colonize favorable nest habitats with higher clutch potential and mortality risk; live bearers invest in fewer better provisioned offspring; expensive dual-mode lineages can flex between strategies but pay for unused complexity. These are directions for emergent selection, not prescribed dominant strategies or fixed litter quotas.

**Biological roles:** the current engine assumes binary `M`/`F` roles and one pregnant live-bearing parent. Refactor reproductive *capabilities* separately from social sex labels before adding eggs or dual mode. Compatibility must reflect viable reproductive roles and actual parts. Do not let arbitrary anatomy grant reproduction without a necessary gamete pathway; do not impose universal behavioral sex roles.

**Entity/data obligations before declaring egg laying finished:** actual egg entities with lineage/genetic snapshots at conception, distinct life-stage/temperature/moisture/nest risks, finite energy accounting, birth and hatch history, environmental predation, collision/rendering/audio, parent investment decisions, saved/loaded incubation state, simulation-capacity limits and real movement/offspring registration. Mid-gestation and mid-incubation older saves need explicit migration policy. Separate conception, laying, hatching and recruitment events in ecology observers.

## Tests and implementation sequence

1. **Current:** canonical physical-build editor gate, valid mixed parent socket parts, mirrored limb group inheritance, deterministic seeds, saved offers, mixed-pair notices, no runtime art duplicates. Do not assert that each seed stabilizes by G3.
2. **Next:** render a parent/offspring resemblance summary, count variant part arrangements and opportunities to recover a matching pair in 2–3 simulated generations *without forcing them*. Add a bounded, understandable player-facing selective-breeding workflow respecting kinship rules.
3. **Next:** add registry definitions and authored procedural sprites for reproductive organs via the single PartRegistry and PartSprites pipelines, with validation of part costs and prereqs.
4. **Then:** implement external eggs and nest/incubation life cycle, with resource accounting and save migrations. Prove that eggs are real entities and that embryonic mortality or successful hatching is causal.
5. **Then:** add dual-mode switching and real DNA/mass/metabolic tradeoffs; examine divergent reproductive outcomes across seeds, not uniform population targets.

**Release constraint:** a working physical-mix slice is not a release-ready reproductive overhaul. Retain the previous stable-release manifest until runtime play and the full reproduction tests are audited.

## Selective breeding player information (implemented)

`M` now reports exact physical-socket differences and `L` records each descendant’s birth-time maternal/paternal/shared/other anatomical placements and same-build peers. `src/lineage/breeding-guidance.js` is a read-only adapter, not a second crossover or mating engine. An older save without parental snapshots shows unknown. This does not offer automatic eligible pairs or guarantee G3 stabilization. See `docs/SELECTIVE_BREEDING_FIELD_GUIDE.md`.

## Egg lifecycle implementation checkpoint

Anatomy-gated egg laying, environmental incubation, birth-on-hatch, finite energy allocation and persistence are implemented. The full details and limitations are in `docs/MODULAR_REPRODUCTIVE_ANATOMY.md`. The `brood-pouch` remains care-only. Dual mode, dedicated live organ, and egg predators are future work.
