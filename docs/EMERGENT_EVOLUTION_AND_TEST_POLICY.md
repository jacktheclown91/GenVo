# GenVo8 — emergent evolution and verification contract

**Canonical creative direction — creator, 2026-10-12.** This supersedes interpretations of previous reports that require every world seed to reach a stable final ecological state, maintain starting species, produce continuing digging, or establish reproducing engineer colonies. It supplements `ECOLOGICAL_VALIDATION_POLICY.md` and `WILDLIFE-SPREAD-ACCEPTANCE.md`.

## Design identity

**GenVo8 guarantees causal biological rules, not biological outcomes.** Each playthrough may reach a radically different world: rich food webs, specialized lineages, migrations, collapses, extinction, low-diversity recovery, predator dominance, or geological transformation. None is a predetermined ending. Different players using the *same seed* must be able to influence histories through real choices: mate selection, trait inheritance, foraging, defense, dispersal, ecological engineering, and eventual habitat adaptation.

The world seed provides initial conditions and deterministic randomness; it is not an authored outcome script. Genetic inheritance, reproduction eligibility, anatomy, species interactions and resources remain grounded in the shared simulation. A world with no survivors may be a valid result if it follows working mechanics, not a broken input, inaccessible water, fake energy or silent pathfinding failure.

The Rule of 8 remains an expressive design language, not a content maximum; Generation 8 is an early lineage milestone, not the simulation's end. Additional species, regional climates, underground/water habitats, social competition, inherited mate preferences, and Living Planet engineering/events remain planned expansion, not assumed complete.

## Test categories and ownership

| Category | Must pass | Must **not** require |
| --- | --- | --- |
| Mechanical contracts (fast, each feature) | Valid inheritance, correct parentage, anatomy ability gates, bounded state, finite resources, viable save/load, no duplicate authorities | Survival of a named starter species in all seeds |
| Controlled causal experiments (targeted) | Specific action under explicit fixture prerequisites produces its documented mechanism; an alternative control isolates cause | Arbitrary action frequency in every natural world |
| Natural-world integrity (selected seeds) | Simulation progresses; numerical/energy/resource invariants, valid birth/death lineage, honest history, no broken navigation | Universal colonization, mating frequency, stable population, engineering or forest growth |
| Divergence studies (milestones) | Collect trait/population/niche/dispersal/extinction histories across multiple seeds and divergent player strategies; explain credible variation | Every seed producing equal diversity, nor forced divergence just to pass a metric |
| Performance/runtime/release | Real game rendering, responsiveness, persistence, asset/source parity, no browser errors where measured | Promotion based only on headless experiments |

**Historical test receipts remain true reports of their scenarios.** Tests that demand e.g. `digs > 15`, `returns > 0`, or same-region births are now **scenario probes**, not universal gameplay acceptance. They can be run for deliberate reproduction of that exact experiment; a new world seed whose population chooses not to dig, relocate, or reproduce must not automatically fail release acceptance. Do not delete those tests or falsify their past measurements. Name them as controlled or legacy-scenario in the test inventory.

Avoid 'balance fixes' solely to make a seed produce desired species counts. Report what went wrong causally and classify it as (a) mechanics defect, (b) measurable design issue/tradeoff, or (c) legitimate emergent outcome. Never hardcode rescue spawns, invisible fertility buffs or predetermined winners. Report simulations' horizon and seed, observational uncertainty, and whether changes affected RNG draw order.

## Release/development gates

1. For each feature: unit/contract tests, save compatibility, deterministic mechanism fixture, and source authority audit.
2. For each integrated expansion: playtest meaningful choices and observed tradeoffs; record screenshots of the *real* build where possible. If browser tooling is blocked, mark visual verification missing.
3. At milestones: diverse seed runs with descriptive distributions of outcomes, failures explained by event histories where possible; don't require a particular winner.
4. Before stable release: end-to-end persistence, performance budgets, data/asset ownership, and coherent player experience; review ecosystem-wide regressions after major systems are integrated.

The existing development-to-stable manifest separation remains mandatory. Do not rewrite the stable-release fingerprint during exploratory work.

## New feature priorities

Shift from repeated colony-balancing research to feature-completion: heritable mate-preference genotypes (distinct from transient hydration/age), explicit courtship acceptance, mating competition, richer ecological diversity and anatomical abilities, Living Planet regional physical change, then full UI/world-slot/Guided Survival integration. Test mechanics during implementation; perform deeper population calibration once the interacting expansions exist. Natural extinction and reproductive isolation are intended capabilities.

## Heritable mate selection (integrated vertical slice)

`src/reproduction/mate-preferences.js` is the single authority for inherited size, strength, ornament, display and behavior preferences plus selectivity. Each living animal makes an independent phenotype-based decision, regardless of sex. Their acceptance must be reciprocal at the actual reproduction event; survival-state and ancestry checks remain separate. Two seeds can legitimately develop incompatible preferences or mutually reinforcing displays. Use deterministic contract tests to verify the mechanism, not reproduction counts to prescribe the result. See `HERITABLE_MATE_CHOICE.md` for implementation limits.

## Mate-choice feature acceptance (multi-partner slice)

Biological variation may favor different partners *within the same reachable pool*. The rules require reciprocal acceptance, real phenotypic signals from inherited genes/parts, explicit distance and compatibility costs, genuine optionality for the player, and stable outcomes under unchanged conditions and saves. Acceptance does not require particular mating/birth frequencies, a preferred genotype becoming common, long-term colony stability, or even that an available candidate is attractive. Tests must include two opposing inherited preference profiles that select different partners without forcing an outcome.
