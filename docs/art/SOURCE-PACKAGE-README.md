# GenVo8 — Modular Creature Art Bible (source-ready package)
**Design edition:** 1.0 · **Date:** 2026-10-10 · **Status:** authoritative *design proposal* for implementation, NOT a claim that the game implements every rule.

This package is intended to be copied into the **single canonical GenVo8 source toolkit** without replacing current working source code. Copy `docs/art/`, `design/art/`, `schemas/`, `examples/` and `references/` into matching locations; reconcile if they already exist. Do not create a third toolkit. Review decisions with the creator before irreversible migration, irreversible saves, deleting older systems, or major changes to world scale.

## Read in order
1. `docs/art/00-ART-BIBLE.md`: guiding principles, quality language, direction, non-negotiable rules.
2. `docs/art/01-COLOR-AND-PALETTE.md`: visual language, heredity and ecological color rules.
3. `docs/art/02-PARTS-ANCHORS-AND-ASSETS.md`: 32px production, metadata, sockets, coordinate standard.
4. `docs/art/03-JOINTS-AND-ANIMATION.md`: part-owned animation grammar, coordinator, planted-foot behavior, eight directions.
5. `docs/art/04-MATERIALS-AND-LAYERS.md`: scales, armor, fur, skin, patterns, wounds and layered compositing.
6. `docs/art/05-ASSEMBLY-AND-RARE-CREATURES.md`: the same modular system for all species, including rare encounters.
7. `docs/art/06-IMPLEMENTATION-AND-ACCEPTANCE.md`: staged migration, exact release gates and test plan.
8. `docs/art/07-EXISTING-REGISTRY-INVENTORY.md` + CSV: snapshot of 72 **registered** definitions in the uploaded toolkit, not 72 finished authored assets.
9. `design/art/biological-palettes.v1.json`: **proposed** palette data (hex values editable by creator).
10. `schemas/genvo8.part-art.v1.schema.json` + `examples/eye-stalk-round-a.part.json`: forward-looking art contract and non-runtime reference example.
11. `references/stalk-eye-user-design.png`: creator-provided enlarged visual reference; red tip dot denotes attachment, never a pixel meant for production sprite export.

## Existing source inspected
Latest accessible toolkit from `genvo8-toolkit (2).zip`, extracted locally. README describes v1.59.0. Relevant existing modules: `src/lineage/part-registry.js`, `src/lineage/body-plan.js`, `src/lineage/phenotype-resolver.js`, `src/render/creature-assembler.js`, `src/render/part-sprites.js`, `src/render/socket-layout.js`, `src/render/fauna.js`, `src/render/genvo-draw.js`, `src/render/behavior.js`, `src/ui/creature-editor.js`. The current registry has **72 parts / 9 families / 9 body roots / 7 socket types**. Existing part art and motion are predominantly procedural: this package calls for a gradual authored-asset conversion.

## Status nomenclature
- **CURRENT**: found in inspected source at package creation; reverify on newest source before implementation.
- **LOCKED DESIGN**: established creative direction for this package, to be applied unless creator explicitly changes it.
- **PROPOSED CONTRACT**: detailed specification not yet implemented; do not pretend it is shipping.
- **ACCEPTANCE**: evidence required to mark something complete.

The source editor and game may evolve after these documents. Re-audit mappings on each migration milestone. No measured performance, test success, or gameplay completion is implied by this document package.
