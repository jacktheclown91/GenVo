# Selective breeding — physical ancestry field guide

**Implemented development slice:** descriptive player guidance over the single canonical physical crossover system. Egg laying and dual-mode reproductive organs are not yet implemented.

## Player experience

1. Open **M** to compare a prospective mate's physical parts with your creature. Each candidate indicates matching body versus a count of differing mounted sockets. The selected mate shows locations and parts. Matching body plans permit an editor *opportunity after a successful mating*, but never bypass kinship, maturity, health, taxon, consent or resources.
2. Physically different compatible parents create offspring from genuine mounted groups of both parent bodies; each actual child may differ.
3. Open **L** to inspect a descendant's journal. **Inherited body parts** shows matching parts shared by both parents, mother-only parts, father-only parts, and part arrangements in neither parent plan (potentially mutation/trait expression). This uses birth-time parent anatomy snapshots, not parents' current bodies or their learned behavior.
4. The journal also counts other living lineage animals with the **identical physical body plan**. They may be too young, related, otherwise incompatible, or unwilling to mate; the count is **not** a list of eligible mates.
5. Select and protect suitable descendants. Breeding two permitted identical physical builds reopens the mutation editor. Convergence within 2–3 generations is an accessibility *goal*, not forced inheritance.

## Single authority and historical honesty

- `body-plan.js` defines part/socket identity, `body-inheritance.js` controls actual mixing and editor matching, `evolution-editor.js` controls the offer, and `reproduction.js` controls mating eligibility.
- `breeding-guidance.js` is **read-only**: it does not compute offspring chances, affect RNG, change genes, alter part art, approve mating, or invent missing ancestry.
- `lineage.js` stores optional serialized `parentBodyPlans` captured from the actual mother/father gestational inheritance objects. Save/load preserves these snapshots without changing the schema. Older saved records without evidence display *not recorded*.
- A child's body parts may later differ from both parent snapshots due to spontaneous variation or trait reconciliation. “Other arrangement” does not claim a precise cause.

**Not implemented:** a pinned player-design target, automated family-wide eligible-pair suggestions, allele fixation, predictive offspring probability, or modular live/egg/dual reproduction. No forced species survival or uniform endgames.
