# Remaining full-game development direction

Creator-supplied October 21, 2026, based on main at `2b2059713`. This records execution priorities and completion conditions, not implementation evidence or release authorization. The [completion matrix](../docs/FULL-GAME-COMPLETION-MATRIX.md) must be reconciled against source before selecting work. Counts of parts, templates and checks are not a completion percentage.

Close entire gameplay capabilities across canonical biology, physics, controls, presentation, persistence and verification. Preserve functional player features while completing the planet. Do not optimize by discarding biology, suppressing neutral variation, manufacturing evolutionary outcomes or weakening tests.

## 1. Procedural planetary world — highest architectural priority

Complete seamless terrain, wildlife and interactions at regional boundaries; smooth preload/unload; vegetation, soil, replay and snapshot performance; honest backlog management; wrapping, polar handling and stable coordinates; connected rivers, coastlines, water, seeds and animal movement; and readable planetary navigation.

Acceptance: responsive travel through numerous regions and biomes, return home, and find the genuinely changed environment intact. Visiting twenty regions in a test does not establish completion.

## 2. Planetary ecology

Support abundance through funded reproduction and resources, evolutionary stasis with neutral genetic variation, genuine colonization into suitable unexplored regions, inherited seasonal migration, population expansion/divergence/hybridization/isolation, credible distant demography, browsable reusable evolved-library entries with genetic diversity and deduplication, succession and recolonization.

Founding templates are starting possibilities. Library growth must come from actual successful organisms rather than permanent hardcoded species.

**Post-jam botanical task (creator decision 2026-10-22):** finish botanical competition and lifecycles together before enabling any `plant-lifecycle` policy. Option C (`turnover`, see docs/PLANT-LIFECYCLE-2026-10-22.md) stays opt-in and off for the jam build.
- Plant mortality, tissue turnover, flowering and regrowth must follow inherited traits and environmental conditions. Fast groundcover and slow woody vegetation should differ for biological reasons, never through per-plant-name tuning.
- Verify recovery after grazing, drought and wildfire: no permanent collapse and no unrealistic regeneration.
- Re-measure the food-web response (animals, starvation, decomposers) with matched observatory runs. Changes in animal survival must come from consistently applied rules, not from unfinished interactions.

## 3. Physical Living Planet

Implement coupled uplift/tectonics, earthquakes, volcanoes and rare meteor impacts. Expand marine depths, reefs, estuaries, coastal food chains and animal interactions. Complete natural multi-depth caves, connected groundwater, underground food webs/wildlife and regional underground travel. Extend long-term erosion, sedimentation, river channels/deltas, cross-region wildfire, storms/clouds, jungles/swamps and animal habitat engineering.

All effects modify the same persistent world and finite accounts; decorative reset events do not satisfy these requirements.

## 4. Creature evolution and anatomy

Prioritize existing evolutionary possibilities over increasing the part count. Complete legitimately evolvable full-normal-screen vision with range/acuity/FOV tradeoffs; movement combinations and valid habitats; proportions, sizes, organs, sockets and limb arrangements; reproductive anatomies, offspring viability, nursing and egg care; real recombination and progressive reproductive isolation; viable developmental intermediates; differential survival/reproduction; part-enabled communication, courtship, hunting, dominance, learning and cooperation.

Acceptance: player or autonomous lineages develop, inherit and visibly benefit or suffer from meaningfully different bodies through actual generations. Successful simple organisms remain equally valid.

**Explicit future task: remove the legacy species-carrier dependency (creator direction 2026-10-22).** No creature may be able or unable to do something merely because of its species name. Founding templates are starting bodies, not permanent species definitions. Named species should describe evolved outcomes.

**Post-jam: replace implicit legacy live birth with inherited ancestral reproductive physiology and genuinely evolved reproductive specializations (creator direction 2026-10-22).**
- Today `reproductiveMode` (`src/reproduction/reproductive-anatomy.js`) treats a body with neither an egg chamber nor a live womb as live-bearing by default. Conception then uses the species-carrier gestation duration. Live birth therefore does not depend on a live-birth organ, and evolving a womb adds nothing a founder lacked.
- Intended progression, with none universally superior:
  - ancestral reproductive tissue in every founding lineage (simple external spawning with finite reproductive material, fertilization and vulnerable developing offspring);
  - protected egg reproduction (egg chamber, provisions, incubation, possible parental protection);
  - internal gestation (live-bearing anatomy, higher parental investment, offspring born directly);
  - combinations only where biologically compatible.
- Ancestral tissue may be foundational physiology rather than a visible starter part.
- Not before the jam: the change affects every founding population, reproduction timing, offspring survival, The First Legacy, save compatibility and long-term stability. It needs a versioned policy and matched runs.

- **Done so far:** shared breeding support (`breeding-support/1`) replaces species forage minimums, prey counts, crowding caps and drive scales in new worlds.
- **Remaining:** about 79 source files still read species records. These records supply maturity and growth (the most-read field), lifespan, litter, gestation, postpartum, reproductive cost and the breeding energy gate; max energy and hydration; legacy mass and `WILD_SCALE` body size; diets for legacy bodies; social mode and family care; the hunter flag; and the prey species' predation vulnerability and lifespan used in capture and prey turnover.
- **Approach:** derive each from inherited anatomy, physiology and development, one versioned policy at a time, keeping prior behaviour for comparison and preserving saves. Do not attempt a wholesale rewrite before the jam build.

## 5. Living ecosystems

Expand plant functional diversity, natural evolution, regional divergence, pollination, hybridization and dispersal; inheritable fungal/decomposition food webs; habitat-specific predation/evasion/group defence; marine migration, schooling, underwater reproduction and deep adaptation; multiple homes, storage, seasonal preparation, dependent movement and protection; persistent grazing/digging/burrowing/seed/nest engineering.

Different biomes must supply different biological opportunities and pressures, beyond visual differences.

## 6. Complete player journey

Connect understandable first-generation survival, abilities, wildlife and meaningful choices to mates, reproduction, care, family control, heirs and explained evolutionary editor opportunities. Validate normal/custom/evolved/advanced starts with real provenance and families. Make ancestry, evolved configurations, adaptations and library discoveries inspectable. Give exploration meaningful organisms, resources, danger, mates, migration and settlement opportunities.

Acceptance: a meaningful loop of survival, exploration, reproduction, evolution and sustained lineage development.

## 7. Visual and audio completion

Retain the 32x32 modular top-down foundation. Improve inherited silhouettes, proportions, age and specialization; articulation and functional poses for all actions; biome identity, natural caves, elevation, flora and weather; quiet ambience/music, creature voices and environmental feedback; visible sensory/body/ability evolution.

Keep compact mouse-first controls clear of the creature at 1920x1080, 1366x768, 1024x768 and 800x600. Anatomy should be recognizable through the creature's appearance and actions.

## 8. Architecture and integration — alongside construction

Separate oversized responsibilities, share calculations, audit obsolete paths/flags before removal, preserve versioned saves, and retain one biological/resource authority per mechanism. Connect each feature to simulation, controls, animation, UI and persistence. Avoid a single sweeping rewrite.

## 9. Stabilization and release — after substantial integration

Run sustained browser journeys at continental scale; natural stable/divergent lineages over generations; anatomy/reproduction/hybridization/action/save coverage; mature frame-time, memory, storage and distant-processing measurements; creator-controlled play with recorded progress/failures; defect and balance review without forced outcomes; credits/provenance and packaging.

Use targeted regression and browser checks throughout construction. Reserve expensive comprehensive acceptance for substantial integration. Automated evidence, browser observation and creator acceptance remain separate. Commit, push and release only within current creator authorization.

## Dependency order

1. Responsive reliable traversal and distant processing.
2. Seamless wildlife/world interactions, migration and colonization.
3. Population continuity and evolved-library functionality.
4. Anatomy accessibility, especially vision, viable complexity and inheritance.
5. Missing geology, deep oceans, underground systems and ecological interactions.
6. Full multi-generational player journey and long-distance exploration.
7. Final creature/world presentation, animation, audio and interface quality.
8. Comprehensive acceptance, remaining optimization and release preparation.
