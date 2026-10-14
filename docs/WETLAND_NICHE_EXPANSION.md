# Wetland niche expansion — GenVo8 v1.61.1 (development)

**Scope:** Species, Anatomy, and Ecological Niche Expansion. This is a focused AI-assisted implementation of the creator's established goal of anatomically grounded, inheritable ecological diversity. Species names, initial population counts, anatomy costs and food preferences here are development candidates, not claims of independent creator approval.

## Added organisms and ecological niches

- **Rillsifter:** freshwater filterer. Spawns in real water and uses existing aquatic behavior, finite freshwater food fields, inherited modular bodies, vitality, mating and lifecycle systems. Starts with gills, webbed feet, a paddle tail, a `silt-fin` and a `reed-sieve-mouth`. It consumes actual larvae/detritus stock; its resources are not conjured from an unbounded feeding action.
- **Mirelick:** terrestrial marsh-edge scavenger, with sensory/foraging anatomy and existing plant, detrital and predatory ecosystem interactions. Spawns on passable ground, never through an aquatic cheat or forced route. Its inherited body plan uses established part definitions plus existing wildlife controls.

Two new registry parts have independently drawn 32-pixel procedural artwork and physical, gameplay-significant effects: `silt-fin` favors water locomotion but costs land fitness and maintenance; `reed-sieve-mouth` favors freshwater feeding but is less effective on land food. Both are subject to the same compatibility, energy, part mounting and heredity systems as other animal anatomy. The expanded wildlife appears in the canonical field guide, behavior renderer and sound mapping. No new parallel sprite or genetics registry was created.

## Boundaries and deliberate limitations

- Other species and populations remain free to survive, diversify or disappear; no predetermined successful breeding, migration or ecological equilibrium is imposed.
- The new part sprites are procedural authored forms, not dedicated frame-by-frame animation sheets. Behavior animations reuse the canonical animation system. Body rendering still needs creator visual review; no quality approval is claimed.
- This does not implement the planned complete Living Planet geological epochs, all new biomes, or advanced social learning. It does not replace the prior reproductive specialization milestone.
- Explicit `birth-hydration` regression failure at mating setup is inherited from the baseline and remains unresolved in this checkpoint.

## Verification performed

- Canonical source graph and sprite/part coverage: 145 runtime reachable JS modules, 76 registered parts with matching artwork.
- Focused `tests/wetland-niches.mjs`: spawn habitat, real freshwater resource deduction, part presence, inherited body plan, save/load and ordinary sim ticks.
- Passed existing part, reproductive, aquatic, freshwater, wildlife and core source tests.
- A real Chromium scene captured both new species by the riverside without page errors. The web archive is exported from the authoritative source graph, not independently maintained.
- Provenance explicitly records AI-assisted scoped implementation. This is a **development** checkpoint and does not supersede the last stable-release manifest.
