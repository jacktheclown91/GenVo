# GenVo8 Ecosystem Engineers & Biome Shaping Spec v1

**Status:** source-ready design proposal, 2026-10-11. Runtime implementation and ecological acceptance are pending. Creator direction: creatures can maintain ecosystem processes through evolved anatomy and behavior; losing those creatures can change vegetation, food webs and habitat. Detailed contracts below are agent-authored implementation guidance.

## 1. Design pillar and scope

Creatures can alter the ecological opportunities available to other organisms. Anatomy enables a behavior; completed physical behavior changes local habitat; plants and animals respond through their existing resource, movement and reproduction systems. Continued populations maintain these processes. Their disappearance stops new work, and the world changes through persistence, decay and succession.

The reference chain is a cold-adapted root-digger disturbing tundra soil while feeding. Disturbance exposes suitable establishment sites for hardy plants. Those plants support grazers and their predators. If digging stops, exposed sites gradually close, plant recruitment can fall below loss, and dependent populations can decline. A sparse or barren tundra is a possible consequence, not an extinction script or guaranteed outcome.

Any starting lineage may acquire a compatible engineering role. “Digger,” “Hopper,” “Stalker” and “GenVo8” do not grant exclusive ecological powers. Roles are descriptions derived from actual capacities and repeated behavior, not bonuses assigned to species names.

Local habitat modification is the first deliverable. Regional identity, underground tunnels and water-topology changes require their own later acceptance gates. Preserve the meaningful eight-generation introduction and indefinite descendants afterward.

## 2. Non-negotiable system rules

1. **Completed actions cause effects.** No effect from merely equipping a part, standing nearby, selecting a role, planning a route or requesting an unsuccessful action.
2. **Actual access and costs apply.** Digging requires contact, traversable habitat, suitable anatomy, accessible substrate and funded exertion. Frozen ground, rock, injury, exhaustion and threats can prevent work.
3. **No free resources.** Soil disturbance changes accessibility or establishment conditions. It does not spawn roots, seeds, animals, food or nutrient mass. Plant production uses declared environmental inputs; nutrient mobilization transfers a measured stock.
4. **Finite space and diminishing returns.** Already disturbed ground cannot be disturbed without limit. Existing plants may be damaged by excessive digging or grazing. Engineering can have harmful as well as beneficial consequences.
5. **Population effects emerge from work.** Many successful actions can maintain a patch. A census count, population threshold or species-presence flag cannot directly make the biome fertile or barren.
6. **Habitat retains memory.** Patches persist after an actor leaves or dies, then decay according to substrate and conditions. No immediate reset on extinction; no continuing work from a dead actor.
7. **Shared ecological authority.** Plants, finite food, carrying capacity, migration, climate and inheritance consume the same world state. No separate engineering food allowance or duplicate capacity pool.
8. **No guaranteed outcomes.** Other engineers, surviving seeds, climate, erosion or different food sources may sustain the system. Natural extinction and failed colonization remain valid outcomes.
9. **Determinism and bounded work.** Use fixed simulation time and stable action ordering. Cosmetic updates do not change ecological state or simulation RNG.
10. **Creator art remains intact.** Habitat visualization and engineering animations obey the modular art bible. Every authored part supports palette substitution while preserving original pixel shading, detail, alpha, animation frames, timing and attachment transforms.

## 3. Example roles

| Role | Capacity and completed action | Local consequence | Dependencies and tradeoffs |
| --- | --- | --- | --- |
| Tundra root-digger | Cold-tolerant physiology plus effective digging limbs/root-foraging anatomy; excavates an accessible root patch | Soil disturbance and root exposure; finite roots are consumed or damaged | Existing hardy-plant seeds can establish; exposure can also increase frost damage, erosion and evaporation |
| Grassland grazer | Compatible grazing mouth and actual plant harvest | Removes vegetation, changes shading/space; seed transport only when feeding creates real cargo | Selective feeding changes competition; heavy feeding can prevent recovery rather than improve growth |
| Wetland burrower | Suitable digging/swimming anatomy; excavates bank material | Disturbed bank patch; later accepted burrow structures can affect shelter and drainage | Excavation costs energy and displaces material; unstable banks, flooding and collapse remain possible |
| Forest seed-spreader | Eats a seed-bearing resource and carries surviving seeds through normal travel | Deposits finite viable seed cargo at the actual location | Germination still needs substrate, light, moisture and temperature; eating a fruit does not guarantee a seedling |
| Aquatic silt-stirrer, later | Appropriate underwater contact/mobility and an actual substrate interaction | Transfers settled material into suspended silt | Can expose food or reduce light and harm producers; no automatic fry or spawning-zone creation |

The first pilot is soil disturbance plus plant establishment. The grazer and seed-spreader examples reuse existing harvest and dispersal seams. Wetland tunnels, aquatic sediment and forest canopy change remain later work, not implied Phase 1 features.

## 4. State and data contracts

### 4.1 Definitions: proposed design data

Add versioned engineering definitions beside existing biological definitions. Resolve capabilities through the shared body/part-effect authority; do not independently parse anatomy into a second biology model.

| Field | Type / unit | Meaning |
| --- | --- | --- |
| `id`, `version` | string, integer | Stable role-definition identity and migration version |
| `action` | enum | Initially `root_excavation`; later approved actions extend this registry |
| `requiredCapabilities` | capability predicate | Current usable anatomy and physiology required to perform the action |
| `substrate` | predicate | Land/water contact, hardness, freezing, material and biome-response constraints |
| `workRate` | work units / simulated day | Potential work before physical and physiological limits |
| `energyPerWork`, `waterPerWork` | reserve units / work unit | Costs drawn from the existing actor reserve/exertion systems |
| `effects` | bounded response definitions | Habitat effects per accepted work, including damage and material transfers |
| `responseByEnvironment` | parameter references | Climate/substrate responses; no species-specific exceptions |
| `definitionProvenance` | decision/source references | Creator direction and agent-authored implementation remain attributable |

Example definition shape, **illustrative and uncalibrated**:

```json
{
  "id": "root-excavation",
  "version": 1,
  "action": "root_excavation",
  "requiredCapabilities": {"digging": "usable", "rootForaging": "usable"},
  "substrate": {"contact": "land", "material": "soil"},
  "costProfile": "digging-v1",
  "responseProfile": "soil-disturbance-v1",
  "effects": [{"field": "disturbance", "response": "saturating-work"}]
}
```

Profiles must declare units, bounds, environmental response and provenance before implementation. Tunable numerical values require calibration evidence; this example is not a validated balance configuration.

### 4.2 World-owned local state

Use one world-owned `engineering` state with versioned definitions and a sparse active-cell index. It must not be owned by the creature that happened to create a patch.

| Field | Unit / bound | Responsibility |
| --- | --- | --- |
| `disturbance` | fraction, 0–1 | Recently worked/establishment-compatible surface |
| `compaction` | fraction, 0–1 | Soil resistance independent of recent activity |
| `rootExposure` | fraction, 0–1 | Accessibility of existing root biomass; never additional biomass |
| `lastAdvancedTick` | integer | Exact elapsed-time integration and save continuity |
| `substrateProfileId` | definition ID | Decay, hardness and response authority |
| `activeCells` | sorted cell IDs or indexed set | Cells requiring updates; avoid all-cell scans for every animal |

Initial implementation may allocate typed fields for the existing bounded world plus a sparse active index. If regions grow substantially, use sparse chunks. Unchanged substrate baselines belong in world generation, not duplicated per engineering event.

Later fields such as `tunnelDensity`, `nestDensity`, `suspendedSilt`, `settledSilt` and `canopyOpening` require explicit units and separate mechanics. A tunnel-density value never substitutes for navigable tunnel topology. Existing seed banks, carrion, plants and freshwater fields remain their own canonical stocks.

### 4.3 Completed-action event

```ts
type EngineeringWork = {
  eventId: string;             // unique; consumed exactly once
  completedTick: number;
  actorId: number;             // attribution, not ownership of persistent state
  action: "root_excavation";
  cellId: number;
  definitionVersion: number;
  acceptedWork: number;        // funded, physically completed amount
  energyDebit: number;
  waterDebit: number;
  stockTransfers: Array<{
    from: string; to: string; amount: number; unit: string;
  }>;
};
```

Action eligibility is checked at completion. A creature killed before completing work causes no new effect. Work already completed before death remains valid. Cancelled requests and retries cannot replay an event. Retain bounded audit aggregates rather than every historical event indefinitely.

## 5. Simulation logic

### 5.1 Completion and accounting

1. Normal sensing identifies an actual accessible root/soil target. Existing hunger, threat and movement decisions still apply.
2. Existing route authority moves the creature to contact. Engineering does not bypass predators, water restrictions or environmental exposure.
3. Compute possible work from functional anatomy, condition, substrate resistance, remaining disturbance opportunity and elapsed simulated time.
4. Bound work by available actor reserves and finite affected stocks. Resolve simultaneous requests against one cell budget; proportionally allocate accepted work in stable order when necessary.
5. Debit costs once through existing exertion/resource accounting. Emit only the accepted completed work. Displaced roots/material enter declared destinations; harvest and disturbance cannot claim the same biomass twice.
6. Apply work to world-owned state. Clear consumed events and invalidate affected ecology/render caches.

Useful bounded disturbance response:

```text
D_after_work = 1 - (1 - D_before_work) * exp(-workResponse * acceptedWork)
```

`D` is dimensionless. `workResponse` has inverse-work units. This saturates at fully disturbed soil and creates no nutrient mass. Resource transfers have separate ledgers and cannot be inferred from this equation.

### 5.2 Persistence and decay

```text
D_next = D_after_work * exp(-decayRate(environment) * elapsedDays)
```

Declare decay rates per simulated day. Time comes from ticks, not render frames or wall-clock time. Climate, moisture, substrate and freezing can change decay; frozen disturbance may persist longer than churned wetland mud. Rates must remain finite and nonnegative. Avoid repeated rounding that makes a patch permanently immortal.

An inactive patch is removed from the active index only below a declared precision threshold. Removal restores a negligible modifier, not food or fertility. Base soil traits and other persistent stocks survive removal. Save/load must preserve both field values and elapsed-time bookkeeping.

### 5.3 Plant response and establishment

Plants declare an `engineeringResponse` profile: disturbance suitability, compaction sensitivity, exposure/frost tolerance, establishment preference and over-disturbance damage. Different plants respond differently; every plant does not receive the same growth bonus.

For germination, combine existing viable seed availability and environmental fit with substrate suitability. A suitable site with no viable seed remains empty. Consume the seed-bank amount actually used. Newly established tissue and subsequent growth follow declared producer inputs and finite space.

Disturbance alone cannot execute `fertility += bonus`. Mobilizing nutrients requires a finite bound/available nutrient pool with a declared conversion. The current normalized fertility field is a proxy, not proof of nutrient-mass conservation. Establish its units and accounting before enabling nutrient-enrichment mechanics.

Roots exposed by digging remain the same finite biomass. If digging damages roots, debit them and account for consumed tissue, discarded detritus and loss. New root growth is plant production, not a disturbance reward.

Moisture-retention effects initially modify a bounded loss/retention response. They cannot create water. Drainage or water movement requires a separately accepted flux model and source/destination accounting.

### 5.4 Food webs, migration and regional change

Animals respond to actual changed vegetation/food through normal sensing, foraging and carrying pressure. Predators respond to actual prey. Engineering fields can influence habitat suitability but cannot grant a second resource capacity on top of the resulting food.

When a maintaining population declines, successful work declines. Patches decay; recruitment may fail to replace vegetation losses; grazers and predators may change behavior, migrate or decline. There is no `onSpeciesExtinct => barren` handler.

Regional summaries aggregate measured patch cover, vegetation, work, resources and populations. They may describe a region as sparse, recovering or strongly engineered. They do not overwrite its physical climate or terrain because a label changed. Regional identity changes only after local causal mechanics are accepted.

## 6. Canonical source integration seams

These are verified existing seams and **proposed changes**, not implemented APIs:

| Existing source | Proposed responsibility |
| --- | --- |
| `src/world/world.js` | Own engineering fields, substrate baselines and active cells; preserve current terrain/connectivity authority |
| `src/sim/simulation.js` | Call a bounded engineering controller at documented phase boundaries; complete actions before subsequent vegetation responses |
| `src/ecology/dispersal.js` | Apply plant establishment suitability to existing finite seed banks and germination; reuse animal seed cargo |
| `src/ecology/freshwater-food.js` | Later sediment/light response; preserve finite freshwater stocks and trophic accounting |
| `src/ecology/carrying.js` | Read the resulting accessible food and demand once; no additive “engineer capacity” |
| `src/ecology/migration.js` | Use actual sensed changed habitats and the existing physical routes |
| `src/persistence/save-manager.js` | Version, validate and restore engineering state; migrate older saves once, without resetting established worlds |
| Proposed `src/ecology/engineering.js` | Capability-gated completion, bounded work allocation, persistence, decay, response queries and diagnostics |
| Proposed `src/ecology/engineering-definitions.js` | Data-driven action and substrate/plant response profiles |

Keep the current phase order explicit. Work completed after a vegetation phase affects the next scheduled vegetation phase; do not retroactively regrow food or run a second vegetation update. Derived forage caches must invalidate affected cells/buckets on the appropriate ecological boundary. Do not change the biological update cadence merely to make a test pass.

## 7. Persistence, visuals and observability

Save the engineering schema version, actual field values, active index, definition versions and timing. Preserve deterministic replay and the next simulation RNG state. Regenerate derived render caches after loading; reject malformed non-finite/out-of-range state rather than silently refilling stocks. Older worlds receive neutral new modifiers through an explicit versioned migration.

Show disturbed soil, exposed roots and vegetation changes at normal play scale. Visible patch strength follows state, not actor proximity. Do not repaint the entire biome instantly after a death. Action animations remain attached to the actual body pose and completed work; palette substitution cannot erase authored pixel shading/detail or interrupt motion. Debug overlays are optional and separate from the normal player view.

Capture per region: accepted work by action, costs, disturbed cover, patch creation/decay, viable seeds, germination, plant biomass, affected stock transfers, births/deaths and causes, migrants and predator/prey populations. Explanations use observed events: “soil disturbance fell and recruitment declined,” not an unsupported claim that one named species caused every change.

## 8. Phased implementation and acceptance

**Gate 0 — existing ecosystem foundations.** Complete the active migration, freshwater and population objective. Retain unchanged ecological thresholds and terminal full-suite plus three fixed-seed1400-day results. Engineering cannot conceal current collapses or population/performance failures. Design work can proceed now; enabling this feature waits for the prerequisite gate.

**Phase 1 — local soil pilot.** One completed excavation action, disturbance/compaction response, actual costs, finite root accounting, one plant establishment response and debug visualization. Use the existing world; a controlled cold substrate fixture may test responses without claiming a shipped tundra biome. Prove failed actions, unusable anatomy, rock/frozen resistance and exhausted reserves produce no effect. Verify repeated work saturates and can damage vegetation.

**Phase 2 — persistence and decay.** Add substrate/climate-specific decay, save migration, active-cell updates and rendering. Prove continued work maintains patches and ceased work allows decay. Compare equal simulated elapsed time under different rendering/update batching. Verify save/reload, world reset, death and stale-event handling.

**Phase 3 — ecological dependencies.** Connect viable seeds, hardy plant recruitment, normal grazer feeding and predator response. Track actual resource ledgers and carrying demand. Require seeded-versus-unseeded controls, excessive-disturbance controls and multiple independent worlds. Do not force dependent animals to survive or plants to germinate.

**Phase 4 — regional tundra and other roles.** After persistent regional biomes and physiology are reliable, introduce a substantial cold region and inherited engineer adaptations. Add grazer/seed-spreader roles through shared mechanics. Burrow topology, sediment and canopy change each need separate conservation, connectivity and performance proofs.

**Phase 5 — lineage influence.** Demonstrate a player-designed inherited lineage forming independently reproducing engineer families whose repeated work affects actual habitat and food webs. Preserve ancestry, genetic diversity and the introductory Generation8 achievement. Do not spawn copies of the latest player design to populate an engineering region.

Required causal validation compares matched fixed-seed worlds with engineering enabled/disabled and controlled anatomy/action differences. Use targeted ablation only in explicitly labelled experiments; never alter the acceptance worlds or call removed animals a natural extinction. Separately observe naturally declining/extinct engineer populations and distinguish their disappearance from food, climate and software defects. Report cases where other processes sustain vegetation.

Acceptance requires finite accounting, actual inherited capability, persistence, responsive vegetation/food webs, real migration, terminal regression and multi-world results, measured smooth-play performance, and inspected gameplay/editor visuals. A green local test or attractive barren-tundra screenshot is insufficient. Parameter calibration and every failed world remain recorded.

## 9. Explicit exclusions from v1

No global terrain rewrite, permanent species-assigned powers, instant barren-biome toggle, creature/food rescue spawn, guaranteed engineering evolution, tunnels represented only by a scalar, unlimited nutrient enrichment, duplicated carrying capacity, or completed-runtime claim from this document. The intended result remains a persistent world whose creatures and habitats affect one another through accountable mechanics.
