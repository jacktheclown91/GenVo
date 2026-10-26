# GenVo runtime architecture

**Scope:** canonical Creature-stage source and current implementation, October 21, 2026. This is a navigation guide, not an alternative ownership registry or a claim of complete gameplay acceptance. Always check [current design](../design/CURRENT-DESIGN.md), [current implementation](CURRENT-IMPLEMENTATION.md), [completion matrix](FULL-GAME-COMPLETION-MATRIX.md), and the **single authoritative** [implementation-ownership registry](../design/governance/implementation-authorities.json) before changing an authority.

## Entry points and orchestration

- `src/main.js` is the browser game entry. It starts the native UI, input, current Simulation, renderer, saving, user selection and source-built scenarios. The optional Creature Lab remains a separate authoring tool.
- `src/sim/day-clock.js` retains recorded 6/30-second policies and the shared compatibility view. clockScopedSteps reactivates the actual owner before each tick-iterator operation; Simulation retains the byte-identical ordered biological body. Regional replay validates work bounds against the archived core policy. Direct out-of-context subsystem calls remain a future isolation boundary.
- `src/sim/frame-stepper.js` admits ordered control steps and simulation ticks under a frame-work budget. One simulation step remains atomic. A slow botanical operation is **not** solved merely by lowering simulation frequency.
- `src/sim/planetary-work-queue.js` admits at most one destination, border, residency or far-biology background operation per animation frame. Async operations hold admission until settlement; world replacement clears queued work. Canonical tick and publication owners remain unchanged.
- `src/render/regional-scene.js` promotes native neighbouring terrain and retains an archived departing view during canonical border transfer. It keeps the existing canvas visible, invalidates actor/interaction state and adds no biology owner. Same-world geology uses revision-aware bounded terrain refresh; ordinary unrelated loads still clear caches.
- `src/ui/regional-pointer-route.js` keeps an explicitly selected neighbouring-ground point in planetary coordinates. PointerApproach emits ordinary controls and resumes only across the actual canonical travel receipt; shared movement/travel authorities retain all physical execution and resource costs. Neighbour selection is navigation-only.
- `src/sim/controller-composition.js` constructs the 47 existing domain controllers in explicit original order. It borrows the actual Simulation, preserves deferred flora setup for restore, and owns no tick, world, policy or biological resource authority.
- `src/sim/spatial-index.js` implements the existing rectangular bucket rebuild/query loops over a borrowed Simulation. Simulation constructs and owns the arrays/geometry and retains its public wrappers; callers retain circular distance and eligibility filtering. No global index or saved state is introduced.
- `src/sim/simulation.js` owns the gameplay orchestration and one active animal/world set. Controllers live in specific biological, ecological, player and lineage modules. Do not add a second Simulation engine or use this file as the only home for new mechanics.
- `src/world/world.js` owns active physical fields and the regional grid. `src/world/planetary-travel.js` manages active/archived region crossing; `src/world/planetary-offscreen-biology.js` and the frame stepper preserve synchronized background work. The planetary atlas is not a single giant actively simulated map.

### Simulation update lifecycle

For a nonpaused ecology tick in `Simulation.update`:

1. Finish any synchronized regional replay due before the next tick; reconcile paired planetary flows.
2. Increment `tickCount`. Advance the already-versioned thunderstorm, fire and habitat-hazard operators.
3. Record the selected organism's bounded survey when due. Advance active cave transition, roof/air conditions, paid excavation, climbing, ice support, and diving. These operate on their own declared time bases.
4. Advance remote environments and synchronized biology at the required stride; process player control, engaged predation, discoveries, capacities and succession.
5. On non-life-stride ticks, only the admitted locomotion work proceeds. On a life-stride tick, run **climate → soil → vegetation (once per game day) → perception → decision → movement → metabolism → lifecycle**, followed by daily disease/injury/world advancement when due.

Actual ordering and branches are defined by `Simulation.update`; preserve the same RNG draws, update ordering, canonical costs and side effects when refactoring. `phasePerception` updates shared controllers and neighborhood state; `phaseDecision` chooses intent, it does not create physical motion on its own; `phaseMovement` pays for movement and stamps physical movement evidence.

## Authorities by concern

| Concern | Entry/owner to inspect |
| --- | --- |
| Geography, water and soil | `src/world/world.js`, `src/world/environment.js`, `src/ecology/soil-water.js`, planetary runoff/seam controllers |
| Cave cells, material and traversal | `src/world/subsurface.js`, `src/world/natural-caves.js`, `src/lineage/burrowing.js`, `src/lineage/cave-traversal.js` |
| Weather, thermal, fire and hazards | `src/ecology/weather.js`, `src/ecology/thermal-weather.js`, `src/ecology/thunderstorms.js`, `src/ecology/wildfire.js`, `src/ecology/habitat-hazards.js` |
| Anatomy and inherited capabilities | `src/lineage/part-registry.js`, `src/lineage/body-plan.js`, `src/lineage/part-abilities.js`, `src/lineage/effects.js` |
| Reproduction and heredity | `src/reproduction/`, `src/lineage/`, versioned policy and physical offspring anatomy rather than editor overrides |
| Vision, hearing, scent and vibrations | `src/ecology/atmospheric-visibility.js`, `src/ecology/stratum-senses.js`, `src/ecology/sensory-world.js`, `src/ecology/threat-perception.js` |
| Controls and player interactions | `src/gameplay/interaction-command.js`, `src/ui/world-resource-target.js`, `src/ui/` |
| World and organism presentation | `src/render/renderer.js`, `src/render/subsurface.js`, `src/render/sensory-fog.js`, `src/render/creature-assembler.js`, native part-art pipeline |
| Storage and region continuity | `src/persistence/save-manager.js`, `src/world/planetary-travel.js`, versioned rule migration modules |

Each table entry is a **navigation pointer**. The [authority registry](../design/governance/implementation-authorities.json) resolves exact ownership when names overlap. Render code and HUDs may display physical observations, not invent ecological events, genetic capability, hidden map knowledge or material resources.

## How to add a creature part or ability

1. Check existing ancestry, sockets, prerequisites and capabilities in `part-registry.js` and `body-plan.js`. Do not hardcode a category count, mandatory species gate, new mutation shortcut or an unconstrained part editor.
2. Define measurable costs in the canonical anatomy/resource rules (load, upkeep, work) and derived effects in `part-abilities.js` and `effects.js`. Evolving a capability does not grant unrestricted access regardless of body configuration.
3. Implement its physical consequence in the relevant simulation/biological owner. Share the rule between wildlife and the player; a mere item description or sprite does not count as implemented gameplay.
4. Extend the existing 32px modular renderer, poses and mouse-first feedback without replacing source artwork. Visuals reflect actual organism state.
5. Verify inherited routes, save/restore, player use, autonomous behavior, finite resources, and where necessary regional continuity. Document what was controlled in tests versus naturally observed.

**Example:** ground vibrations reuse movement timestamps, active paid digging and landing impulse records; `stratum-senses.js` checks substrate, `sensory-world.js` produces an uncertain cue, and the existing threat/fog consumers use that one cue. No parallel observer, extra randomness or hidden-position lookup is necessary.

## How to add an environmental system

- Choose the single physical owner in `src/world/` or `src/ecology/`, then record it in the registry. Couple to existing water, thermal, soil, geological and fauna authorities rather than double-counting stocks or advancing a second weather clock.
- Declare whether new worlds have a versioned policy. Ordinary historical restore cannot silently change physics; use explicit, validated, backed-up continuation and consistent archived-region policies when needed.
- Preserve seeded deterministic behavior, atomic resource transfers, state signatures and side-effect order. Separate debug/review flags from permanent gameplay rules; a flag is not a substitute for an authoritative mechanism.
- Render/announce conditions only through actual observable state, then test fixed conditions, boundary crossings and recovery. Do not claim global climate/planet coupling on the basis of one local fixture.

## Persistence and compatibility

`src/persistence/save-manager.js` creates snapshots from the single active simulation and restores versioned world/genome/controller state. Runtime policies with historical meaning must be validated and present in the correct regional cores. `src/world/planetary-travel.js` carries these policies across active and archived regions. The [movement adoption contract](MOVEMENT-ADOPTION-2026-10-20.md) illustrates explicitly backed-up, reversible policy changes. Avoid silently rewriting legacy animals, anatomy, topology, RNG progression or saved geography. Exports must contain source-identical reachable runtime files; never patch generated public files as a second canonical source.

## Verification map

| Invariant | Focused tests / tools |
| --- | --- |
| Sensory observation, ground signals and cave optics | `tests/sensory-perception.mjs`, `tests/stratum-senses.mjs`, `tests/vibration-sensing.mjs`, `tests/threat-perception.mjs` |
| Cave geometry, air, entrance feedback and body access | `tests/natural-caves.mjs`, `tests/cave-air.mjs`, `tests/cave-exploration-feedback.mjs` |
| Part functionality, inherited bodies and visual assemblies | `tests/part-abilities.mjs`, `tests/founder-body.mjs`, `tests/indexed-part-art.mjs` |
| Weather, physical resource and vegetation continuity | `tests/soil-water.mjs`, `tests/page-vegetation-work.mjs`, `tests/weather-soil-resume.mjs`, `tests/ecological-integrity.mjs` |
| Regional biology and deterministic travel | `tests/regional-synchronized-replay.mjs`, `tests/regional-traveler-mortality.mjs` |
| Save/export and source coherence | `tests/save-persistence.mjs`, `tests/public-export.mjs`, `tools/canonical-source-audit.mjs`, `tools/run-tests.mjs` |
| Real UI, lifecycle and performance acceptance | `tools/verify-stratum-senses-browser.mjs` and existing Chromium harnesses; targeted profiling receipts; creator play |

Run affected contract tests **before** expensive long-horizon ecology. A green focused gate is not equivalent to browser usability, ecological balance, mature-world frame pacing or creator acceptance. Known baseline failures/deferred suites live in [test inventory and policy](TEST_INVENTORY_AND_POLICY.md) and [current implementation](CURRENT-IMPLEMENTATION.md), not in a silent success list.

## Safe development and handoff

Feature branches must start from a verified `main` commit, preserve unrelated local files and retained history, and contain reviewable behavior + tests together. Keep `main` untouched until integration is approved. The interim vibration branch is intentionally not a replacement for the local canonical source that Codex may resume from; evaluate ancestry/overlap and merge only completed, green changes in dependency order.

Physical regional bounds and first-line step clipping are owned by `src/world/regional-frontier.js`. Fresh starts enable the version explicitly; persistence, page residency, canonical travel, pointer routing and scene handoff retain that same recorded authority. See [physical frontier](REGIONAL-FRONTIER-2026-10-21.md).

## Modernization dependency map

Run `node tools/architecture-check.mjs --graph` for the complete current direct module map, existing strongly connected components, biological/presentation boundaries and largest modules. It reuses the canonical export graph; source reachability is not proof that historical test/tool imports are disposable. The pre-refactor snapshot gate and actionable continuation live in [Git continuation](GIT-CONTINUATION-HANDOFF.md) and [refactor backlog](REFACTOR-BACKLOG.md).
