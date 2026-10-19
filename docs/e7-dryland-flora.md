# E7: dryland flora niches

Feature continuation stacked on E6 (not the performance PR sequence). Real world vegetation content with two additional genetically propagating plant families:

| Family | Habitat origin | Edible niche | Biological resources |
|---|---|---|---|
| Dune Bulb | Drier, non-flooded fertile land | Fleshy fruiting-shrub food for browsers; crushable seeds | Finite adult biomass, seeds, coats, germination, animal seed transit, light, water, minerals and energy |
| Dust Sage | Dry but somewhat broader terrain | Coated seed heads particularly suitable for inherited seed-cracking beaks | Same canonical finite-resource, seed-bank, dispersal and reproductive genetics machinery |

These grow in existing `World.plants`, not a duplicate vegetation system. Their initial distribution depends on actual generated soil moisture, fertility and deterministic coordinates. Growth competes for **the same conserved plant-resource water/minerals/energy input pool** as existing species. Both are exposed through the body-dependent mouth authority, genuine tissue-harvest receipts, seed banks, clonal inheritance, botanical pollen/ovules and player-accessible forage. No automatic species assignment or artificial wildlife survival boost.

The two overhead fallback silhouettes are top-down, distinct and deterministic, with trail miniatures; authored 32x32 sprites still need the user's review. The base game still uses the same 128x128 live World. Planetary continents and page-to-page player travel are **not yet implemented**. The existing larger macro-geography is a seed and sampling model, not a streamed simulation.

## Compatibility boundary
Restoring existing schema-10 saves lacking these species must leave their standing stocks **zero** rather than spontaneously seeding an old world. Existing save restoration already zeroes missing plant and seed-bank arrays; initial finite energy and limits arrays for newly introduced kinds are filled. No save-format change made; new genetic registry entries are seeded at initialization.

## Validation policy
One targeted `tests/e7-dryland-flora.mjs` and syntax checks only, not full test suite, benchmark or artificial population benchmarks. The test checks real initial habitat founders, mouth compatibility, finite harvested crop and resulting seed cargo, restored states and procedural render paths. Full equilibrium balancing, archival-save regression, performance, player screenshots and ecological multi-generation testing remain for later integration.

Next larger-world milestone needs dynamic world sizing across renderer/simulation/save authorities or paged live-world transition rather than an unverified tweak to `CFG.worldSize`.
