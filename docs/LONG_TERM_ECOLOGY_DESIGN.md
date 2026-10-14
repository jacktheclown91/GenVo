# GenVo8: shared-world evolutionary ecology

Creator direction: the two supplied development handoffs and the clarification of 2026-10-10. This document records design intent; it does not certify implemented features. Existing creator-authored pixel art remains the production direction.

## Identity and introductory challenge

The Rule of 8 is a minimum design standard, not a maximum content restriction. Preserve eight-direction compatibility and an eight-frame foundation for principal locomotion. Support richer direction sets and longer sequences where useful; a blink may still need only two frames. Do not force every animation or content family to contain eight items.

Generation 8 remains a meaningful introductory challenge: guide one fragile creature into an established, inherited lineage. Preserve the achievement, its history and the earlier progression goals. Living descendants can reproduce and be controlled indefinitely after that milestone. Reaching Generation 8 must not end the simulation or truncate ancestry, mutations or ecological records.

Stalker, Hopper, Digger and GenVo8 identify starting lineages. Anatomy, physiology, accessible food and learned or inherited behavior determine later lifestyles. Do not script a required endpoint called aquatic Stalker, winter Hopper or underground Digger. Every lineage can potentially acquire compatible capacities through the shared inheritance and selection rules.

## Three habitats in one persistent world

Surface, freshwater and underground habitats share time, organisms, resources, inheritance, death, nutrient recycling and carrying-capacity accounting. They are connected habitats rather than separate modes. An animal can enter a bank burrow, travel through a connected tunnel, emerge elsewhere and enter water when its anatomy permits.

Aquatic ecology needs finite algae/biofilm, duckweed, waterweed, larvae, small aquatic prey, and detritus/carrion. Producers renew according to conditions, consumers remove biomass, and waste/death return nutrients. Filter feeding must consume an actual resource; swimming must not generate unlimited energy. Aquatic breeding must use local underwater productivity and accessible prey rather than land-only food samples.

Underground topology is sparse and persistent. Allocate cells, chambers and links where natural cavities or actual digging create them, rather than a full second 128 by 128 map. Each occupied cell records soil hardness, moisture, temperature, roots, rock barriers, stability and oxygen access. Entrances connect explicit surface locations to tunnel nodes. Flooding and collapse follow local conditions and connectivity; they must not teleport animals or discard their lineage history.

Initial underground play includes entrances, digging costs, movement through connected tunnels, dens/nesting chambers and a minimal roots/fungi/grubs food chain. Later additions include caching, colonies, subterranean predators, insulation, flooding, collapse and rivals. Access requires suitable anatomy and abilities in any starting lineage. Underground resources and shelters enter the same capacity and resource budgets as surface and aquatic ones.

## Regional climate and seasonal ecology

Use a common seasonal clock with regional climate and habitat-specific conditions. One winter can be severe on an exposed surface, mild in another region, buffered underground and distinct underwater. Temperature, daylight, moisture and aquatic light/ice conditions determine biological responses. Calendar state alone must not switch every resource identically.

Spring supports regrowth and breeding opportunities; summer supports growth and accumulation with competition; autumn shifts fruiting, seed production and preparation; winter restricts some resources and creates survival pressure. These are tendencies produced by environmental drivers, not a prescribed event sequence.

Plant responses belong in extensible biological definitions:

| Plant family | Seasonal response and persistence |
| --- | --- |
| Annual grasses | Die back under adverse conditions; viable seeds persist |
| Perennial flowers | Aboveground dormancy with surviving belowground tissue |
| Deciduous bushes | Leaf loss and cessation of fruit production |
| Evergreens | Reduced but potentially continuing productivity |
| Roots and tubers | Finite underground food when accessible |
| Aquatic algae | Productivity responds to light, temperature and ice |
| Fungi | Local moisture, temperature and substrate govern growth |

Design physically possible winter survival strategies in suitable habitats, without guaranteeing that every seed or lineage finds them. Real failure to secure food, local collapse, and extinction are allowed evolutionary outcomes. Migration destinations must be productive, reachable regions. Migration is actual movement with travel costs, predation exposure and unfamiliar terrain; never disappearance and respawning elsewhere.

## Different survival strategies

Hibernation and torpor require reserves, suitable shelter and physiological capacity. Reduced expenditure has tradeoffs, and disturbance or depleted reserves can be fatal. Food caches contain real transported resources, can spoil, can be stolen and can require defense. Cold adaptation can support year-round activity at biological costs. Subterranean survival relies on insulated habitat and finite accessible food. Migration relies on mobility, perception or memory and real connected routes.

These are alternative strategies. No mandatory winter upgrade or universally superior body is prescribed. A migrating and a hibernating Hopper may both succeed in different local conditions.

Physical capacity and behavior remain distinct. Carrying anatomy enables a load; memory, practice or instinct determines caching. Movement anatomy enables travel; behavior determines when and where to migrate. Do not reduce all learned strategies to interchangeable part-stat bonuses.

Extensible trait families include digging, thermoregulation, seasonal behavior, food processing, storage, locomotion, senses, defense and social behavior. Traits must change accessible actions, risk or resource use with corresponding costs, rather than merely increasing a stat.

## Anatomical and engine constraints

No arbitrary global eight-item ceiling applies to body-part registries, categories, traits, species, abilities, biomes, habitats or generations. Available content can grow without granting unlimited attachments to an individual. Authored geometry and valid sockets, mass, energy requirements, development and compatibility impose real anatomical constraints.

Audit fixed arrays, category assumptions, indexing, direction masks, animation tables, editor controls, mutation eligibility, save serialization and lineage/history storage before expanding these systems. Keep older eight-direction saves and existing bodies compatible. Richer direction sets must have explicit coordinate and animation semantics; removing a bit mask alone is insufficient.

The editor must accommodate dozens of categories and hundreds of designs through discoverable grouping, filtering and scalable browsing. Do not expose internal registry or index details in player-facing flows. Preserve creator authorship and provenance for new geometry/art; design references are not approved production assets.

## Implementation sequence and acceptance gates

### Dynamic world events

Environmental and geological conditions generate events; affected organisms and ecosystems determine consequences. High populations do not summon unrelated disasters. Formation, warning, impact and recovery leave persistent world history. See [Dynamic World Events Spec v1](DYNAMIC_WORLD_EVENTS_SPEC_V1.md) for finite transfers, exposure, bottlenecks, canonical integration and phased gates. Local storms/flooding follow regional climate foundations; volcanism and impacts require later persistent terrain capabilities.

The creator selected gradual environmental/geological change alongside catastrophes and ecosystem engineering. [Living Planet System Spec v1](LIVING_PLANET_SYSTEM_SPEC_V1.md) defines shared persistent regional state, separate layer clocks, condition-derived biomes, compact environmental history and optional geological epochs. Implementation follows the current ecology work; no scripted100-generation progression is prescribed.

The [ecological validation policy](ECOLOGICAL_VALIDATION_POLICY.md) supersedes universal population, recovery-cohort and starting-species survival acceptance in earlier plans. Performance counts are diagnostics; causal integrity, persistence and measured runtime remain required.

### Ecosystem engineering design pillar

Creatures can maintain habitat processes through evolved anatomy and completed behavior: soil disturbance, finite seed transport, vegetation removal and later accepted burrow/sediment systems. Those processes can support other plants and animals; when work stops, persistence, decay and succession can change the food web. Extinction does not directly toggle a biome to barren.

The source-ready design and phased gates are in [GenVo8 Ecosystem Engineers & Biome Shaping Spec v1](ECOSYSTEM_ENGINEERS_AND_BIOME_SHAPING_SPEC_V1.md). It specifies local modifiers first, accountable costs/stocks, actual plant establishment, and regional influence only after the active ecosystem and regional foundations are reliable. This is a design commitment, not runtime acceptance.

1. Finish the current aquatic and predator-prey ecology pass. Recover existing work; reproduce collapse; validate recovery, finite underwater food, inherited adaptation, viable aquatic offspring and long-running seeded worlds. Keep short, headless and live visual evidence distinct. Failed seeds remain recorded.
2. Audit and remove artificial Rule-of-8 ceilings while preserving existing eight-direction movement, saves, inheritance and rendering.
3. Add sparse persistent underground topology, entrances, anatomy-dependent digging, traversal costs and a minimal food chain. Validate connected movement, persistence and conservation before adding hazards.
4. Add regional seasonal ecology with environmental drivers, distinct plant responses and viable winter routes across the connected habitats.
5. Add and compare torpor/hibernation, caching, cold adaptation, migration and subterranean survival over multiple simulated years and generations.

Each pass preserves modular architecture, current gameplay, canonical source, creator-authored art and provenance. Verify one pass before advancing or producing source/public release packages. No scripted populations, guaranteed evolved endpoints, fabricated captures or silently relaxed ecological thresholds substitute for acceptance.

Ecology checks must cover all relevant resources and habitats, species-specific births and deaths, density and food competition, trait-dependent survival and traceable inherited changes. Recovery-cohort expectations and population ceilings are diagnostics, not universal ecological acceptance rules. Computational acceptance requires measured performance. Runtime captures demonstrate actual rendering and interaction; they do not by themselves prove long-term ecological stability.
