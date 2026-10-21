# Current GenVo design

Authority: creator-approved Living Planet direction and subsequent bounded decisions, consolidated October 18, 2026. This document states intent; implementation status lives in ../docs/CURRENT-IMPLEMENTATION.md. Original reviews remain attributable historical evidence.

GenVo is a Living Planet, an open-ended evolutionary possibility engine and a playable survival/lineage game. Players influence habitat, actions, partners, care and descendant choices within legitimate ancestry and resource constraints. They do not receive guaranteed evolutionary outcomes.

## Full Creature-stage completion direction

The creator's October 20 directive establishes the complete, interconnected Creature-stage game and supporting Living Planet as the current delivery scope. Canonical development remains in the existing local project on synchronized `main`; coherent completed passes may be committed and pushed through normal history. The [full-game matrix](../docs/FULL-GAME-COMPLETION-MATRIX.md) tracks actual implementation and missing systems. Build missing gameplay and its controls, visuals, animation, audio, inheritance and persistence in dependency-aware passes, using targeted checks during construction. Concentrate prolonged ecology, balancing and opt-in human observation after substantial functional and presentation coverage. The earlier First 100 Days milestone remains useful evidence, not a substitute for full-game acceptance or a restriction on the new scope.

## Immediate architectural priority: persistent planetary streaming

The creator's October 21 handoff makes scalable, continuous Living Planet exploration the immediate implementation priority after reconciling PRs 36-40. Default planetary generation and automatic keyboard border crossing are groundwork, not completion. Replace whole-history in-memory regional archives with independently indexed, atomic persisted records and a bounded nearby working set; preload neighbors, preserve unique organism identity and exact modified ecology on eviction/restoration, and render/navigation across seams. Remove the low exploration-region ceiling through actual storage/residency architecture, not by raising limits or discarding distant biology. Address the finite projection through an explicit versioned geographic policy. Do not substitute a larger static map, cosmetic preview or duplicated regional engines. Existing biological, resource and save authorities remain canonical. Branch-local first-generation slice documents describe feature evidence and do not narrow this full-game scope.

## Biological rules

- One World and Simulation own physical resources and organisms. Player and wildlife use shared biological authorities. Rendering, labels and cameras cannot decide ecology.
- Variation is inherited and independent of what would be useful. Environmental conditions select among variations; they must not instruct useful mutations. Development must support gain, duplication, specialization and loss, including successful simpler bodies.
- A part catalog alone does not prove possibility. Audit legal inherited routes, recombination, development and viable intermediates through actual lineage experiments. New anatomy needs observable consequences for movement, sensing, survival, reproduction, behavior and appearance.
- Costs must follow shared finite resources. Anatomy, growth, work and reproduction cannot invent food or materials. Approved relative game-unit mass is distinct from unfinished complete tissue/material conservation.
- Internal population limits must be reported and managed transparently; silent birth clipping cannot masquerade as natural selection. Decline after day 100, collapse and extinction are legitimate outcomes when produced by sound rules.
- Preserve historical saves with explicit generator/rule migrations. Do not silently reinterpret old bodies, topology, genes or mass policies.

## Planet and player

Planet-scale continents, oceans and climate structure are distinct from detailed locally simulated terrain. An initial map or continental slice must not compress every biome into a small artificial patchwork. Pages need stable coordinates, persistent organisms, boundary continuity and measured performance before increasing scale.

Anatomical complexity must remain legible in gameplay. Flight changes movement, insulation changes climatic tolerance, and sensory organs change detection. Player-guided strategies and autonomous evolution are separate validation questions; neither may substitute for the other.

The action bar shows possessed biological capabilities and hides absent ones. Temporarily unavailable abilities remain visible with an explanation from the shared execution authority. Common survival commands remain accessible, specialized actions compact automatically, and anatomy, inheritance, load and control changes refresh the presentation without UI-specific biological rules.

## First 100 Days milestone

Demonstrate functioning mechanisms and a readable, engaging early-life experience, with causal observations around days 1, 10, 30, 60 and 100. Use a normally initialized young world and a separate established-world fixture with genuine ancestry. Do not demand a biodiversity, population, advanced-organ or survival quota within 100 days. Targeted ancestry experiments can establish accessibility without waiting for rare traits in every ordinary run.

Keep the full planetary, developmental, physiological and player-life-cycle roadmap visible. The October 30 feature freeze is a checkpoint, never grounds for false completion or compromised biology. Targeted deterministic verification supports construction; human runtime review and integrated acceptance remain distinct.

## Decision provenance

The Continental Living Planet A-H proposal and creator-approved A0/A, neutral inheritance, current-map planetary geography, optional-organ loss, explicit head structure and anatomy-based game-unit mass reviews remain in docs/living-planet-architecture/. Their original text is preserved. Later feature branches must be reviewed against these constraints; merging code does not retroactively confer creator approval on every feature.
