# GenVo8 — Finite nesting, care and egg predation

**Development checkpoint, 12 October 2026.** Creator direction: evolvable reproductive strategies, larger egg broods with biological costs and environmental vulnerability, optional care and protection, and divergent evolutionary outcomes. The precise nest costs and predator behavior are AI-assisted candidate implementations pending playtest; they are **not** mandated by the creator as fixed balance values.

## Single canonical implementation

`src/reproduction/reproductive-anatomy.js` remains the **only egg/live mode authority**. `src/ecology/birth-investment.js` remains the conception and investment authority. `src/sim/simulation.js` remains the **sole** mating, egg-creation, incubation, and newborn registration authority. `src/reproduction/egg-ecology.js` supplies pure and bounded operations for nests, care, and predation. It introduces neither a parallel egg lifecycle nor a second renderer. `src/render/renderer.js` draws the real nests and eggs. Saves store `sim.nests` and `sim.eggs` in the existing schema-10 core state; older schema-10 records missing nests recover with empty nests.

## Actual mechanics

1. Females with an inherited, mounted `egg-chamber` lay real eggs after conception. Default live birth remains unchanged; dual mode is still unimplemented.
2. A nest is **optional**, not spawned freely: only laying mothers with enough extra energy and at least 0.18 units of harvestable local vegetation create one. A nest uses 2.4 additional energy and consumes exactly 0.18 of one existing plant resource. No suitable vegetation means exposed eggs, not a failed clutch. World nesting sites have a bounded cap of 64.
3. A nest holds a physical location, material provenance, finite integrity and unique ID. It buffers moderate dryness or temperature stress but never protects flooded eggs. Natural decay continues; after the clutch disappears, the nest falls away. The renderer displays the actual terrain nest, not another creature sprite definition. The player may use `E` beside a nest containing their eggs to tend it when physiologically able.
4. Either living parent can optionally tend their own clutch if they remain within range, are adequately hydrated and fed, and have sufficient energy. Tending costs 0.65 energy and occurs no more than once per nest per day. A mounted `brood-pouch` strengthens nest upkeep; it **does not** grant egg laying or infinite safety. Normal drinking, danger response, feeding, and mating priority retain precedence.
5. Hungry wild hunters search for nearby **actually reachable** eggs only when their existing diet supports that egg's species. A hunter physically approaches and strikes a protected nest over time, spending energy, before eating an egg. Consumption removes the real egg and transfers bounded existing parental nutrient reserves into the predator; no additional food stock appears. Parent protection is neither absolute nor mandatory.
6. An older egg-funding behavior unintentionally drained 100% of laying-parent hydration on the birth day. The egg water investment is now bounded to 30% of current hydration, so eggs still have paid reserves while the parent is not automatically rendered critically dehydrated by the birth accounting itself. This is a gameplay candidate, not final biological balance.
7. Eggs can still hatch after both parents die. Hatchlings still pass through `Simulation.spawnFundedOffspring`; lineages, genetics, animation parts, brood events, and save/load are not duplicated.

## Intentional limits

- These are first-pass fixed costs, not a final evolutionary fitness model. No seed is required to preserve an egg or establish a colony.
- Egg predation is currently implemented for hungry wild hunter species with applicable prey diets. More specialized egg specialists, scouting, guarding, active egg transport, nests with different architectures, authored pixel art and dedicated sound are further expansions.
- Brood pouch care is optional and inherits through the existing body plan. Dedicated nesting appendages and expensive dual-mode reproductive organs remain future anatomical extensions.
- Automated tests check causal correctness, resource accounting, inheritance, persistence, and interaction routing. Population-balance and guaranteed clutch-survival targets are expressly excluded.

## Verification

`tests/egg-nest-predation.mjs` checks paid nest construction, depleted material refusal, parental care limits, body-part protection, nest-to-egg links through save/restore, hunter detection in the real decision path, physical consumption, and old-save behavior. `tests/reproductive-anatomy-eggs.mjs` checks exposed egg legacy and hatching. Other selected regressions are recorded in `reports/FEATURE-FINITE-EGG-ECOLOGY.md`.
