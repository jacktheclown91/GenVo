# Heritable mate preferences — first integrated vertical slice

**Status:** Development implementation, not a stable release; separate from full social/dominance competition and speciation. Decisions originate with the creator's October 10–12 directions. Implementation and tests are AI-assisted.

## Biological model

Each animal has a distinct, inheritable `matePreferences` genotype with five signed preference axes: **body size, physical strength, ornamentation, courtship displays, and behavioral temperament**, plus an inherited degree of selectivity. The existing survival genes and anatomy remain the source of the visible/functional traits; the phenotype is **derived** from those existing authorities rather than an alternate sprite catalog. For instance, actual display frills and tails count toward ornament/displays, and genes/body parts affect the size/strength cues.

Positive values favor more of the trait; negative values favor less. The child's profile blends both parental profiles with bounded sibling variation using a per-offspring deterministic random stream. Neither sex has a universal selector or pursuer role. The two individuals evaluate one another independently. A pair can breed only when **both accept**, in addition to existing kinship, species, maturity, gestation, energy, disease, hydration and carrying-capacity gates. No acceptance dice, guaranteed offspring, artificial rescue mating, or success quota has been added. Availability changes can prompt new consideration; once accepted, the existing gestation and finite-reserve birth pipeline is unchanged.

**Distinct state:** current age, illness, energetic condition, water reserve, pregnancy and courtship cooldown are **not heritable mate-preference genes**. A preference for larger size is not the same as demanding high *current* health or nutrition. Environmental and population differences may favor different mate-choice traits over time without forcing populations to converge.

## Runtime authority and persistence

- Canonical genotype, inheritance and mutual evaluation: `src/reproduction/mate-preferences.js`.
- `src/sim/simulation.js` creates the field at birth, searches only reciprocally accepting mates for autonomous pursuit and rechecks acceptance at physical mating. The already canonical `src/reproduction/reproduction.js` still owns player mating selection, `src/reproduction/partner-encounters.js` owns local receptive approaches, and `src/ecology/gestation.js` freezes parental profiles at conception.
- The mate inspector shows each partner's dominant preference and whether mutual acceptance is currently predicted, while deliberately allowing the player to attempt courtship and receive a refusal. A refusal cannot create pregnancy and stops the current pursuit.
- Living animals, pregnancy snapshots and lineage history preserve preferences. Existing save schema 10 remains valid: old animals lacking the optional field acquire a deterministic seeded founder profile at load, without consuming the world simulation RNG; old already-conceived parents are filled likewise. Future births inherit the recorded conception-time profiles.
- `src/render/part-sprites.js` remains the only gameplay part drawing authority. No sprite sheets, duplicate render paths or cosmetic-only mating traits were added.

## Verification philosophy

Test deterministic inheritance, bounded variation, mutual response, refusal, real birth funding, conception-time snapshots, backward-compatible save/load, unchanged simulation RNG, gameplay source graph and public packaging. **Do not require** a particular pairing rate, equilibrium, genotype frequency, species survival or a universal successful courtship per seed. A world with high reproductive isolation or extinction is a valid outcome if caused by correct systems.

## Multi-partner comparison — implemented development slice

- Autonomously searching individuals now compare multiple **physically reachable and reciprocally accepting** animals in their normal permitted search radius. The chooser's own inherited preferences dominate a deterministic preference score; prospective partners' opinion and travel distance contribute to the ranking. No new random rolls, breeding bonuses, guaranteed pairings or fixed attractiveness hierarchy.
- Compatible animals can choose a farther partner when its traits are strongly preferred. Two individuals with opposite inherited preference alleles may choose different partners from the same available group. Neutral preferences favor closer candidates. The usual same-taxon-before-gene-flow search policy and existing close-range reciprocal courtship response still apply.
- The player inspector now shows a short ordered list of nearby candidates, their distances, and a qualitative suitability label ("strong fit", "favored", "compatible", or which party declines). `Q`/`E` still cycle and allow deliberate selection of a less-preferred or declining mate; `C` attempts actual courtship. These labels indicate **current preferences, not pregnancy probabilities or guaranteed offspring**.
- The authoritative compare/evaluation functions live in `src/reproduction/mate-preferences.js`. Existing `src/reproduction/reproduction.js`, `src/sim/simulation.js` and `src/ui/inspector.js` consume them; no new mate controllers were introduced. A local physiological refusal still outranks the ranking and environmental threats/foraging still outrank optional courtship.
- Tests cover opposite preferences choosing different mates, meaningful distance tradeoffs, neutral behavior, reciprocal refusal, saved-state reproducibility, player choice, and unchanged random-state/resource inventories.

## Still planned

- Broader courtship-display expression and rich individual explanations, plus player-accessible decisions about preferences in the future-generation editor.
- Full social dominance strategies, threat/contest costs, negotiated competition, coevolution and territorial context remain planned; local mate-audience competition alone is not this full system.
- More phenotype variation/content, coevolutionary selection-pressure visualization and population-level reproductive isolation evidence.
- Manual editor affordances for observing and making future-generation changes to mate preference within the approved mutation budget; this first slice uses natural heredity, not an instantly adjustable live-adult genotype.

The goal is more diverse endgames and consequential selection, not guaranteed births in every cohort.

## Costed live display and local competition — development slice

- `src/reproduction/courtship-performance.js` is the **only display/competition implementation**. `Simulation.resolveInteraction()` consults it *after a real physical approach* and calls the existing `tryMate()` only after display completion. Neither this module nor the renderer can conceive offspring.
- A display requires three simulation life-stride beats and costs a finite amount of the performer's **existing energy**. Intensity comes from the same inherited ornament/display anatomy used by the actual game renderer. No display-only fake part assets, stat reserves, RNG dice, or player-only shortcuts were introduced. Hunger, thirst, fear, illness, interrupted movement and survival choices may end the display. A new attempt must pay again.
- When multiple valid suitors are physically present, the potential partner's own **inherited preference** and observable display traits order local competitors. No static strongest-wins ranking or assigned sex roles. A displaced contender may seek another partner; one successful display does not force mutual consent or bypass pregnancy/resource checks.
- The existing `court` action already animates anatomy; the live renderer adds subtle signal pixels **only** when a funded display is active. The public preview does not load another sprite sheet. Active state and any lost-contest receipt persist through ordinary animal save serialization.
- This is a **local courtship contest**, not broad dominance, territorial combat, threat escalation, or full display-genotype evolution. It is not a proof of sustainable breeding colonies or target mating rates. Test rule validity and cross-seed divergence without balancing to a single endgame.

## Evolving rituals — amended creator direction (12 October 2026)

**See `docs/EVOLVING_COURTSHIP_RITUALS.md` (authoritative).** Earlier text about deterministic hard preference refusals, universal three-beat displays, or ranking losers out of mating is superseded for the actually performed courtship path. A pre-performance preference score remains a ranking forecast, not an irreversible rejection. Matching a liked dance, call, flare or mixed sequence affects reception probabilities, especially with rivals, while simple, repeated mismatched performances retain a nonzero chance. Actual reproduction still requires independently accepted, biologically eligible parties and passes solely through `Simulation.tryMate`. Part anatomy unlocks moves; learned patterns are individual/cultural, not genetically scripted for species.
