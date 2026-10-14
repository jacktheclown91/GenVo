# GenVo8 — Living Planet System Spec v1

Status: creator long-term direction captured2026-10-11 from attachment5c4cc053-fb8f-412d-9521-1eba4ad31d49. Architecture and contracts below are agent-authored proposals. No new runtime layer, terrain deformation or accepted history viewer is asserted.

## Direction

Combine gradual geological/environmental change, sudden world events and biological ecosystem engineering. They act at different timescales on the same persistent environment. The player can revisit an ancestral location and find a landscape changed by recorded processes, rather than a replacement map.

This resolves the earlier geological-timescale question: **both gradual change and sudden catastrophes belong in the long-term design**, alongside creature-driven change. Optional geological epochs or extended simulation allow slower processes; mountains and continents are not automatically accelerated into a handful of animal generations.

The creator's100-generation tundra/thaw/eruption/recovery example is illustrative, not a schedule, guaranteed outcome or biome-switch script. Independent disasters remain independent of population-control targets under the [world-events specification](DYNAMIC_WORLD_EVENTS_SPEC_V1.md). Supported booms and extinctions remain permissible under the [ecological validation policy](ECOLOGICAL_VALIDATION_POLICY.md).

## Layers and ownership

| Layer | Proposed state | Cadence direction |
| --- | --- | --- |
| Weather | Local/region temperature, precipitation, wind and storm conditions | Hours–days |
| Hydrology | Surface/ground water storage, flow, inundation and transported sediment | Days–years |
| Ecology | Finite plants/food, soil conditions, organisms and engineering work | Days–generations |
| Geomorphology | Erosion, deposition, channel movement and coastline change | Years–centuries |
| Geology | Uplift, faults, geological activity and material sources | Much longer intervals; optional epochs |
| Catastrophes | Bounded forcing, material displacement and lasting effects | Rapid impact with persistent recovery |

These timescales are creator design directions, not calibrated scientific rates. Actual parameters require explicit simulation units, tuning and evidence. Layer cadence is not permission to skip coupled processes or fabricate a final state.

One canonical regional world state owns physical fields. Layers submit accountable changes to that state; they do not keep competing copies of elevation, water, vegetation or fertility. Catastrophes are episodic forcing, not a second terrain authority. Ecosystem engineering supplies actual work/modifiers, not magic fertility increments. Weather/flow/geology provide declared external inputs and sinks.

## Proposed data

| Record | Fields and rules |
| --- | --- |
| `RegionalWorldState` | Stable region ID, world coordinates, elevation/material, soil, vegetation, temperature/moisture, surface/ground water, ecological modifiers, topology/version counters |
| `LayerClock` | Layer/version, last integrated world day, cadence, accumulated time, deterministic generator state and pending work |
| `WorldChangeBatch` | Stable ID, source authority/process, start/end times, affected cells, input/output budgets, before/after field references, topology effects |
| `EnvironmentalHistoryEntry` | Time interval, location/region, process/event ID, measured deltas, contributing species/lineage IDs, evidence coverage and references |
| `RegionKeyframe` | Bounded compressed state at selected milestones for shorelines/vegetation/habitat; sampling resolution and coverage explicitly recorded |
| `EpochRequest` | Explicit requested duration, supported layers, numerical integration limits, ecological coupling policy and resume checkpoint |

Actual schemas follow source implementation and save migrations; these are contracts, not existing engine fields. Stable coordinates, region IDs and ancestry identifiers must survive changing biome labels.

## Coupled update logic

At a defined world integration boundary: collect due environmental forcing and completed engineering work; compute local water/material/soil changes; reconcile finite budgets; commit a deterministic batch; invalidate affected navigation, carrying, habitat and rendering caches; let vegetation and organisms respond through existing simulation authorities; append attributable history summaries.

Final update ordering must be explicit and tested for the implemented model. Do not apply the same sediment or soil change once through engineering and again through flood recovery. Preserve source/sink accounting across region boundaries, including offscreen regions. Sparse or coarser integration needs conservative transfers and a recorded error budget, not free resources or frozen favorable habitat.

Water, seeds, soil/material and nutrients moved between cells are removed from their source. Rainfall, evaporation, geological input, decomposition and extraction have explicit sources/sinks and units. Habitat gains come from actual deposition, weathering, establishment and ecological work. Destroyed vegetation does not automatically respawn because an event finished.

Terrain change updates actual accessibility. Recompute connected routes, water/bank access, cached carrying surveys and shelter conditions where needed. Existing organisms, nests and resources retain identity and accountable state. They can be exposed, stranded, damaged or die through normal mechanics; preservation does not grant universal survival. No silent deletion, safe-position teleport, duplicate stocks or unrestricted migration after a topology change.

## Biomes as derived conditions

Temperature, moisture, water regime, soil/material, elevation, vegetation and ecological activity determine habitat characteristics. A biome label describes those conditions; it must not itself trigger a replacement map or a hidden plant/resource reset.

Transitions can be gradual or abrupt depending on actual changes. Display labels may use documented smoothing/hysteresis to avoid flicker, while physiology and food access use the underlying state. A region becoming wetter does not automatically grant organisms aquatic anatomy; inherited adaptation occurs through real reproduction and selection.

Engineers can affect drainage, seed transport, vegetation and soil stability through completed, funded behavior. Their extinction stops that work; persistent effects decay or change according to the model, potentially reversing trends. Use the [ecosystem engineering specification](ECOSYSTEM_ENGINEERS_AND_BIOME_SHAPING_SPEC_V1.md) as the shared biological seam.

## Environmental history

Record compact evidence from the first persistent-change stage, even though the full viewer comes later. Do not postpone collection and invent a retrospective story.

History should support previous shorelines, former vegetation, engineering populations, local extinctions, world events and surviving ancestry. Store important changes and sparse keyframes rather than every rendered frame. Bound storage through declared aggregation and retention rules. Old periods may have coarse or missing coverage; the UI must identify that limitation instead of inventing detail.

A region view can compare selected intervals, show measured condition changes and navigate events or associated lineages. Narrative explanation must distinguish observed changes from inferred causal links. A barren region formerly maintained by an extinct engineer requires actual work, habitat and population evidence; temporal coincidence alone is insufficient.

Historical records describe a sampled past. They are not automatically an exact replay. Exact replay requires the appropriate source/version, seed, inputs, snapshots and deterministic state. Changing current terrain must not alter archived keyframes. History and ancestry must persist through save/resume.

## Optional geological epochs

Epochs are explicit long-time simulation operations, not automatic catastrophe triggers. No generation threshold or global population count starts one. Define world-day duration and supported integration before enabling the feature.

Advancing time must advance organisms, resources, climate, reproduction, mortality and inheritance consistently with the supported model. Do not age geology while silently freezing living populations, or fabricate descendants after a skipped interval. If the engine cannot integrate a requested epoch faithfully, report that limitation and preserve the current world.

Checkpoint before the operation, expose progress/cancellation at safe boundaries and record what was simulated versus approximated. No claim of millions of years of ancestry from a handful of fabricated steps. Large-timescale numerical precision, rate limits and save-size behavior require their own acceptance pass.

## Phased implementation

0. Finish current ecological integrity, causal seeded-world review, persistence and measured runtime requirements. Do not insert tectonics into the ongoing correction pass.
1. Persistent soil, water and vegetation changes with finite budgets, save continuity and minimal history receipts.
2. Organism-driven habitat engineering, persistence/decay and actual downstream plant/food-web responses.
3. Regional floods, droughts, storms and recovery through regional climate/hydrology and spatial exposure.
4. Erosion, deposition and changing waterways, including connectivity/cache invalidation and inter-region conservation.
5. Geological activity and rare landscape-altering events after persistent terrain operations are reliable.
6. Environmental history exploration and optional geological epochs; use receipts collected in earlier phases.

Each stage feeds the existing ecology and preserves canonical ownership, genuine inheritance, saves and the32×32 authored-part/palette direction. It does not replace the game with a disconnected geological demonstration.

## Acceptance evidence

- Controlled transfers reconcile water, material, seed and nutrient budgets; no duplicated engineering/event writes.
- Terrain changes preserve identities and state, update real routes/access, and expose organisms through existing physiology and mortality.
- Save/load reproduces clocks, pending changes, history, generator state and inheritance without reroll or duplicate commits.
- Coupled runs retain fixed reported seeds, environmental histories and causal evidence for supported booms, decline, extinction and recolonization.
- Different update granularities are compared for conservation and documented approximation limits, not assumed equivalent.
- History compares actual keyframes and measured changes; missing records remain missing.
- Ancestral coordinates remain recognizable through real accumulated change, demonstrated in the actual runtime.
- Performance is measured with many organisms and affected regions, including cache rebuilds, offscreen work, history storage and saves. Population counts alone do not establish computational acceptance.

Runtime implementation and all acceptance gates remain pending for this long-term system.
