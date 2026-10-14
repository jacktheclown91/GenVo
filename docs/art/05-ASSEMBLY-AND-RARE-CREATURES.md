# 05 — Shared Creature Assembly & Rare Creature Rules
**Status:** LOCKED DESIGN; migration to existing wildlife renderer is staged.

## Every organism shares one composition path
The player, mate, children, unrelated wild populations, region-specific descendants, legendary/relic encounters and rare variants use a **valid body-part graph + phenotype + joint rigs + materials/pigments + runtime experience/condition**. A creature can have a name or taxonomy, but no hidden immutable role inherited from a full-silhouette sprite.

### One authoritative creature definition
- **Genome**: inherited compatible developmental plan, proportions, pigmentation, material possibilities and physiological genes.
- **BodyPlan**: physical attachment graph and individual placements validated against available sockets.
- **Phenotype**: expressed dimensions, supported movement, senses, feeding, defense, attack modes, capacities and biological maintenance.
- **Expression/condition**: maturity, injuries, hunger, hydration, age, pregnancy, wetness, stress.
- **Individual experience**: learned routes, avoidance, predator recognition, mate preference, familiarity, behavior priorities. These experiences influence action selection, not retroactively rewrite the inheritable anatomy.
- **Render assembly**: purely a visualization of resolved above; no damage/speed modifiers originating from sprite name or color preset.

## Special creatures: assembly recipes, never special renderers
A curated special may specify an extraordinary but valid combination of `bodyPlan`, rare part IDs, large/small inherited proportions, rare palette/material alleles, developmental history and behavioral experiences. It can have authored animation *styling data for its parts*, but no hardcoded full-body silhouette or species-specific game-world physics exception.

**Example design (not a runtime record):** an aggressive marsh hunter may use `sleek-torso`, `runner-leg`, `tearing-jaw`, a valid eye arrangement, armored dorsal scales, muted teal body, red display patch and learned stalking behavior. Swap its eyes or jaw via heredity and the renderer/gameplay should visibly and mechanically change; it must not secretly remain the identical 'hunter type'.

## Explicit migration targets in CURRENT source
- `src/render/fauna.js`: current `mosskip`, `rootling`, `needlejaw` species-targeted pose/drawing branches. Convert to organism assemblies and shared part-owned motion, keeping current creatures visually recognizable during migration where possible.
- `src/render/behavior.js`, `src/render/activity-detail.js`: creature-name conditional posture effects need to become action/part-driven.
- `src/render/genvo-draw.js`: hardcoded species markings and embedded facial drawing must convert to body/part/mask records.
- `src/render/renderer.js`: old species sprite dispatch should gradually use shared creature assembler/pose resolver.
- `src/render/part-sprites.js` and `src/render/creature-assembler.js`: useful existing sources of part-specific drawing and per-leg gait, but not yet proof of independent authored per-part rigs.
- `src/lineage/part-registry.js`: existing 72 definitions remain canonical biology reference, while art metadata may be managed in a separate versioned ArtRegistry keyed by matching part IDs.
- `src/lineage/body-plan.js`: retains graph validation and lineage identity; schema changes need explicit migration and serialization tests.

## Converting a rare creature
1. Capture/record actual current runtime creature art, poses, damage abilities, genotype and encounter behavior; do not erase the creative identity.
2. Decompose its unique silhouette into *named reusable components*, regional material masks, proportions and learned behavior tags. If an appearance is unique but not a physical part, express it as a pattern or material trait.
3. Catalog rare components in `PartRegistry` with actual developmental/unlock rules (including relic constraints where currently intended). They must fit the same sockets, not bypass validation.
4. Author transparent sprites, root anchors, joints, palette masks, eight facings and part motion profiles; make alternate visual assemblies while preserving feature readability.
5. Remove its hardcoded full-body drawing/animation path once parity tests prove the assembly produces the right encounter.
6. Verify offspring preserve only heritable features and that special acquired status/experience is not blindly transmitted as genetics.

## Zero fixed-role tests
- Two animals with same resolved anatomy/physiology but different legacy species labels produce equivalent physical capabilities in the same conditions (unless explicitly documented different learned experience or maturity).
- Replacing the hunter jaw with a grazing mouth removes hunter-specific bite anatomy; no hidden `species==='stalker'` re-grants bite damage.
- NPC reproduction can yield sibling morphological variation. Regional selection can cause different descendant populations to diverge while preserving ancestry.
- Exported rare creature blueprint is valid in the editor test habitat and the main runtime. No hand-crafted sprite-only exceptions.
- Old save migration either reconstructs equivalent assemblies or fails loudly with an actionable report; it must not silently drop rare parts.

## Design vocabulary
A 'species' is a population with shared ancestry and reproductive compatibility; a 'lineage' is a descended branch; a 'body plan' is the current anatomical graph; an 'ecological role' is an outcome of capabilities plus behavior and habitat. These terms must never be interchangeable hidden type switches.
