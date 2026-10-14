# GenVo v1.64.0 — public title and generated lineage names

**Creator decision, October 12, 2026:** Public title is **GenVo** (previously GenVo8). Preserve technical `genvo8-*` identifiers that existing save files, world seeds, JavaScript integrations, IndexedDB, and schema contracts depend on. The Rule of 8 remains historical design inspiration and is not a limit on species, content or lifespan of a world.

## Naming design and actual implementation

Newly **recognized** evolutionary branches obtain a name only after the existing speciation mechanism demonstrates population separation, inherited local traits, gene flow and survival. Name generation is a *presentation-only outcome* and does not affect reproduction, mating choice, ecology or capability evaluation.

`src/lineage/taxon-name-generator.js` holds the naming vocabulary. Each rule names an anatomical category by **actual mounted body-part capability metadata** or cohort-wide inherited part tags, and the second word fragment is selected from **measured cohort habits** when the habit is strong enough. Otherwise the second component is explicitly attributed to environmental selection pressure, not falsely labeled learned behavior. Parent genus derives from the evolutionary tree. Deeper branches may produce a derived genus.

A deterministic branch ID breaks naming ties and resolves collisions without consuming the game's random-number generator. Species labels do not fluctuate every day as individuals change habits or molt; each identity and its `nameOrigin` explanation persists in the evolutionary tree, family records and save data. Descendant branches inherit their actual genealogical parent, not a newly invented founder roster.

The family journal displays why a generated name was chosen. The generator is *extendable data*, not a `switch` on legacy species IDs: adding capability rows to `TAXON_VOCABULARY` is sufficient for future body parts/habits. The current vocabulary is modest and still requires art/phonetic polish; this pass does not implement genetic reproductive isolation, automatic common-name dialects, or new mating controllers.

## Compatibility

The runtime still uses `genvo8-root`, `genvo8-saves`, `genvo8.bodyplan/0`, `window.__GENVO8__`, existing seed defaults, and unchanged save schema 10. Old `GenVo8` ancestral labels in loaded world snapshots are normalized to `GenVo` for display only; previously assigned descendant taxon names remain historically accurate. The current web title, menu logo, manual labels and itch copy say **GenVo**.

## Verification

`node tests/taxon-name-generator.mjs` verifies causally changed names, naming persistence, deterministic collision handling, no random-simulation dependence, and a simulated old-save ancestral-label migration. `node tests/speciation-threshold.mjs` verifies actual branch formation and name assignment. Existing save, ecology and lineage tests continue to apply. Chromium screenshots of the canonical build are required before calling presentation verified. This remains a development checkpoint, not a stable release.
