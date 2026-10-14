# GenVo8 — Dynamic World Events Spec v1

Status: creator direction captured2026-10-11; detailed contracts below are agent-authored proposals. Runtime implementation, tuning and visual acceptance are pending. Authority: creator attachment329008fd-1028-49b8-b665-dd10acbf09a2 and [ecological validation policy](ECOLOGICAL_VALIDATION_POLICY.md).

## Core rule

World events arise from environmental and geological conditions, while consequences emerge from the organisms, populations and ecosystems affected. High population makes a disaster more consequential; it does not summon an unrelated disaster. No population-threshold tornado, eruption or meteor, targeted catastrophe to restore ratios, guaranteed survivor quota or generation-eight catastrophe.

Population-driven processes retain causal inputs: actual infectious contacts, consumption, vegetation damage, soil work and predator/prey interactions. They may change vulnerability or downstream environmental conditions. For example, vegetation loss may change runoff when rain occurs; it does not directly trigger a hurricane.

## Event classes and dependencies

| Event | Proposed formation authority | Actual exposure and persistent consequences |
| --- | --- | --- |
| Local storm/tornado | Regional atmosphere/storm state and configured environmental prerequisites | Spatial wind/damage footprint, shelter integrity, vegetation disturbance; refuge and anatomy change exposure |
| Flood | Rain/runoff, drainage and connected water storage | Real inundation, traversal changes, transported finite stocks, sediment and damaged structures |
| Hurricane | Future ocean and regional atmospheric model | Connected storm path, coastal surge and inland decay; no damage to unreachable remote regions |
| Drought/heat/blizzard | Regional climate conditions and duration | Water/food change, exertion and thermal costs through organism physiology |
| Wildfire | Ignition, local combustible material and propagation conditions | Material consumption, smoke/ash, vegetation loss and later succession |
| Eruption | Future geological activity at a defined source | Local lava/ash, bounded atmospheric effects, cooling deposits and later weathering |
| Meteor | Extremely rare independent event process | Size-dependent footprint, crater and material displacement; exceptional climate effects need an explicit model |
| Epidemic | Existing infection/contact mechanisms | Transmission and actual disease outcomes; no disaster-based population cull |

These are game-model prerequisites, not calibrated scientific hazard forecasts. No invented real-world probabilities are approved by this document. Tune event frequency in simulation days against lifespans and generation durations, with reported parameters and seeds.

Local events are relatively common, regional events uncommon, and world-altering events extremely rare. These are design directions, not numerical frequency commitments. Ocean, salinity, volcanism, ash climate, fire propagation and crater terrain do not yet exist merely because a row names them.

## Lifecycle and causality

1. **Formation:** evaluate environmental prerequisites using world state and the event generator. Record why the event formed. Global actor count and species ratios are excluded from independent hazard formation inputs.
2. **Warning:** create observable local cues with actual propagation/range. Organisms respond through existing perception and behavior, according to their senses and knowledge. Warnings need not always be available. No omniscient evacuation or automatic safety teleport.
3. **Impact:** update a spatial footprint and apply effects only to intersecting cells, actors, structures and resources. Use existing injury, physiology, movement, shelter and mortality authorities; an event cannot independently duplicate damage or death accounting.
4. **Recovery:** immediate forcing ends, while world-owned effects persist, decay or undergo succession. Extinguishing the visual effect must not reset terrain, resources or ecology to their pre-event state.

Footprints can move and have intensity gradients. Different body plans can survive differently through actual capacities: grip, aquatic traversal, insulation or access to refuge. A burrow may shelter from wind and become dangerous when flooded. Species identity does not grant blanket immunity. Newly flooded areas may enable movement only through actual connected, anatomically traversable routes.

Use existing shared expression signals for perceived danger, fatigue, pain and alertness when that coordinator is implemented. Expressions neither announce unseen hazards nor grant physical protection.

## Proposed data contracts

| Record | Fields and semantics |
| --- | --- |
| `EventDefinition` | `id`, `kind`, `scale`, `prerequisites`, `formationRatePerDay`, `durationDays`, `footprintModel`, `warningCues`, `effectRules`, `recoveryRules`, `requiredCapabilities` |
| `EventInstance` | Stable `id`, definition/version, origin, formed/start/end days, lifecycle stage, intensity, path/footprint, environmental input receipt, dedicated deterministic event RNG state |
| `CellEventState` | Active forcing values, water/sediment/material changes, vegetation damage, effect ownership, decay/succession stage; sparse entries for affected cells |
| `EventImpactReceipt` | Event/tick/target identity, exposure inputs, actual funded transfers, injury/death authority references, structure damage and persistent habitat changes |
| `PopulationConsequence` | Before/after census, births/deaths by cause, movements and ancestry evidence; descriptive evidence, never a requested death quota |

Persist generator state, event IDs, lifecycle clocks, footprints and lasting cell effects with save schema migration. Do not reroll an event or apply its impact twice on load. Effect receipts must distinguish cumulative changes from current forcing. Bound detailed logs through aggregation/archive while preserving reproducible summaries.

## Simulation logic and accounting

Run formation at a defined world/environment cadence. Use a dedicated deterministic random stream so visual presentation or actor enumeration does not change hazard timing. The first release of such a stream needs explicit seed/version/save semantics; do not claim that adding it preserves older simulation trajectories.

For each active event: advance its environmental footprint; query only affected spatial buckets; calculate exposure from location, intensity, actual shelter/cover and anatomy; apply effects through canonical authorities; record transfers and causes; update persistent habitat state. Process stable IDs/order where outcomes depend on ordering. Render from the resulting state rather than performing ecological writes in the renderer.

Transport conserves finite stock. Moving seeds, carrion, organisms or sediment removes them from a source and adds them to a destination through accountable movement/transfer. No duplication at both sites. New precipitation or geological material must have an explicit environmental source and budget; distinguish external input from recycled nutrients. Burning, erosion, mortality and decomposition have declared sinks/conversions. An impact must not silently refill freshwater food or plants.

Event deaths use normal death/carcass accounting once. Population bottlenecks preserve the actual survivors' ancestry and inherited anatomy. Later diversification uses ordinary reproduction, mutation, selection and genetic drift; never generate replacement populations, guaranteed adaptations or copies of the latest player design.

Physical terrain changes require invalidating/recomputing affected connectivity, water access, spatial navigation and habitat/carrying caches. Trapped organisms face actual constraints; do not infer successful migration from a target flag. Recovery must support possible net habitat gains as well as loss through modeled succession, not an automatic benefit bonus.

## Canonical integration and gaps

Current simulation climate and world water/resource fields are starting seams. `src/gameplay/weather-exposure.js` explicitly serves the player and excludes background ecology; it is not a ready-made all-organism disaster system. `src/gameplay/family-weather.js` likewise does not establish regional flood physics. Audit these boundaries before generalizing exposure.

Use `src/world/world.js` for world-owned state, `src/sim/simulation.js` for update ordering and organism effects, existing migration/carrying/freshwater controllers for changed accessibility and demand, and `src/persistence/save-manager.js` for serialization. Final ownership/API design requires a source pass after foundations are accepted. Do not add a parallel shadow simulation to manufacture effects.

Persistent habitat recovery should share the [ecosystem engineering layer](ECOSYSTEM_ENGINEERS_AND_BIOME_SHAPING_SPEC_V1.md). Keep event forcing distinct from creature-created modifiers, with one owner for resulting vegetation and resource state. Authored damage/recovery sprites must retain palette substitution, pixel shading and animation under the art bible.

## Phases and acceptance

0. Complete the active ecology foundation, including reproduced eligibility/accounting defects, causal review of seeded worlds, persistence and actual runtime performance. Your revised policy permits supported high populations and genuine extinctions.
1. After regional climate/ecology exists, implement one bounded local storm/flood pilot. Prove spatial exposure, perception/refuge, finite transfers and persistent recovery. No hurricane without the required ocean model.
2. Add regional propagation and organism-specific consequences, with deterministic save/resume and real refuge/migration routes.
3. Introduce terrain-changing fire/volcanism/impacts only after persistent terrain modification, connectivity invalidation and recovery are reliable. Keep rare-event forcing independent of population counts.
4. Validate long-term recolonization, actual ancestry bottlenecks and diversification alongside ecosystem engineers and biome pressures.

Acceptance requires matched environmental inputs to produce the same independent hazard formation despite different actor counts; consequences may differ through exposure and feedback. Controlled fixtures test reachable footprints, supported refuge and flooded-refuge failure, conservation, single mortality accounting, no reroll/double impact on save/load, warning perception and persistent terrain history. Population feedback experiments must identify changed environmental mediators rather than assert equal future outcomes.

Natural-world trials record fixed seeds, parameters, event histories, finite stocks, mortality, migrations, regional populations and ancestry. Review booms, loss, survival and habitat gain causally. Do not require a predetermined number of survivors. Runtime verification includes a dense affected region, measured frame/simulation cost and visible event/recovery state. Passing a scripted fixture alone does not certify long-term ecology or smooth play.

## Geological timescale decision

The creator selected both gradual environmental/geological change and sudden catastrophes, coupled with ecosystem engineering. See [Living Planet System Spec v1](LIVING_PLANET_SYSTEM_SPEC_V1.md). Separate timescales, optional geological epochs and compact environmental history support this direction. This remains future implementation; it is not an eight-generation event schedule or permission to accelerate all geology during ordinary gameplay.
