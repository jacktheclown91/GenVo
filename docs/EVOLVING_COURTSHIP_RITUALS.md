# GenVo8 — Evolving Courtship Rituals

**Canonical direction:** Creator direction, 12 October 2026. Implemented first vertical slice; not full ritual-evolution feature completion or a stable release. Design and code implementation are AI-assisted.

## Biological contract

1. **Anatomy grants actions.** Actual mounted, inherited body parts in `src/lineage/part-registry.js` enable individual moves. Leg joints support dance; mouth structure supports call; frills, display eyes, signal crests, and suitable tails support flare; scent glands support scent; grasping appendages support gesture. The ability is not granted by appearance, the species label, or a generic score. Any creature can attempt simple nonverbal approach without a special part.
2. **Preferences are inherited; rituals are learned.** A creature's mate-preference genotype includes variable attraction to dance, call, flare, scent and gesture, and tempo preference, inherited with bounded variation. Individual action sequences are learned by exploring, observing nearby performers who succeed, and practicing successful sequences. A ritual is NOT automatically a gene or an immutable script for an entire species.
3. **Ritual culture is emergent.** A locally common call→flare sequence may spread when individuals observe a successful performer, but only observers whose bodies support the moves can imitate. Branching lineages may develop different combinations. `observedRituals()` is a descriptive readout of currently living learned sequences, not the game's authority to command a species to perform one.
4. **Taste is a soft influence.** The target can prefer a well-timed sequence, especially when comparing multiple suitors, but no specific ordered combination is a reproductive prerequisite. Dance-only courtship can still sometimes succeed with a call-and-flare admirer, and missing advanced parts do not automatically make a lineage infertile. Repetition permits additional independent opportunities but NEVER guarantees an eventual yes; every refusal is real, and energy/time is consumed. Repeated courtship with an actively refusing target must not bypass species, kinship, maturity, illness, hydration, pregnancy, or finite reproductive costs.
5. **Competition is contextual.** The payoff from matching an elaborate ritual is larger with rival suitors; an isolated pair has less need to outperform anybody. The prospective mate still decides independently. The highest-ranked performer is not awarded automatic conception, nor is the lower-ranked rival barred from trying.
6. **Evolution remains divergent.** No population, lineage or seed is guaranteed survival, courtship success, or a dominant ritual. Cultural learning and genetic preferences can conflict, coevolve, diverge or be lost through extinction.

## Current implemented vertical slice

- Five action categories are declared on real part definitions; `courtship-performance.js` derives each animal's repertoire from `bodyPlan` through the single part registry. The generic approach action remains available without display parts.
- Short sequences (one to three actions) are explored deterministically from a dedicated per-attempt seed, with no shared ecology RNG draw. Repeated successful sequences increase an individual's tendency to repeat them, with periodic exploration. Failed attempts are recorded; nearby witnesses of a successful performance can learn a physically executable sequence. Individual memories are bounded and saved.
- A performance consumes existing finite energy, takes actual simulation time and can be interrupted. Recipients have independent stochastic acceptance draws seeded per real encounter; even a strongly disliked presentation has a nonzero chance, whereas a highly preferred ritual cannot force acceptance. These draws are distinct from fertility and do not change the shared ecology RNG stream. Only `Simulation.tryMate()` can conceive.
- The existing mate inspector exposes reachable ritual actions and a three-action queue: with the mate panel open, keys `1` dance, `2` call, `3` flare, `4` scent, `5` gesture. `Backspace` clears the sequence; `C` courts the selected mate. Unavailable actions cannot enter the queue. Without a queued sequence, the animal draws on learned or exploratory patterns.
- Renderer cues vary by active action, drawing from the existing canonical creature art and poses; no second sprite catalog is installed.
- Old saves with preference genotypes that predate action tastes receive deterministic fallback tastes on read. Existing schema 10 snapshots already preserve animal learning and staged sequences.

## Outstanding work — do not mislabel this slice as finished

- Rich 8-frame authored movement for dances, actual species/body-part-dependent audible calls and complex multimodal timing beyond the current pose/cue stage.
- Player timing and sequencing as expressive manual play rather than just selecting a three-move queue; longer rituals and interruptible reciprocal call-and-response behavior.
- Learning from *unsuccessful* witnessed performances and environmental conditioning; interspecific observation, teaching, generational cultural drift and innovations beyond the five starting categories.
- Explainable acceptance UI, social reputation, advanced dominance/territorial responses, multi-party courtship sessions, selection-pressure reporting and speciation effects.
- Biological courtship should not over-reward spam: future tuning must evaluate fatigue, temporary refusal memory and respecting avoidance without turning preference into a fixed hard gate.

## Test philosophy

Test part gates, move availability, finite cost, learnable innovation, optional success, individual refusal, target-specific taste, local rival comparison, save/reload, kinship and resource invariants, and cross-seed divergence. **Never assert that every seed evolves a particular ritual or that repeated attempts eventually succeed.** Preserve legacy historical population tests as observations rather than universal targets.
