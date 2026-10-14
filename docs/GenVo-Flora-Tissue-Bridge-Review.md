# GenVo — Flora Tissue and Propagule Bridge

Substantive integrated development checkpoint, 2026-10-13. This completes the first transfer slice of the capability expansion, not autonomous plant evolution.

## What changed in gameplay

Fruit/pod crops now partition their existing finite biomass into edible tissue, seed reserve and coating. Compatible mouths eat flesh while carrying intact propagules; actual seed-cracking mouths consume kernels and destroy those seeds. The kernel-beak's declared crushing ability now has a real consequence. Tearing mouths remain unable to eat plant resources. Crop/kernel choices travel through the same authoritative validation and execution used by Interact, radial actions and feeding shortcuts. Selected targets and tissue choices do not silently substitute another patch.

Carried viable seeds preserve a fixed producer genotype and source identity, then pass through the existing gut-transit controller. Actual deposits fund seed banks; actual establishment preserves parent producer ancestry. Local reproduction also withdraws its propagules from parent crop reserves. Discarded coatings/flesh and failed seed transfers enter litter and existing decomposition. Lost cargo on death is reconciled. Main vegetation growth and other material consumption adjust the same tissue partition. This is finite meal/propagule accounting; environmental growth is still the previous abstract model.

Player deposits leave temporary selectable evidence. Read marks explains the actual bank or resulting young crop; it grants neither food nor mutation currency. Kernel feeding has a planted, stronger mouth-compression pose and crumbs driven by real meal receipts, for player and autonomous creatures. Sprite caching preserves this changing pose. Drawn seedlings and sparse plants have real hit anchors, and taller crop crowns no longer share moss's ground-level hit point.

## Source ownership

17 gameplay modules differ from the previous delivered Hybrid Lineages source; exact list is in `flora-source-change-receipt.json`.

- `ecology/flora-genotype.js` defines immutable founder payloads, current tissue allocations and mouth-derived handling channels; no mutation or species-based animal privileges.
- `ecology/dispersal.js` owns tissue reserves, harvest receipts, genotype cargo, paid local release, deposition, establishment ancestry and litter. `functional-diet.js`, `carrying.js` and the existing part registry derive accessible food from actual mouth capability.
- `gameplay/foraging.js`, `interaction-command.js`, `sim/simulation.js` and `world/world.js` preserve exact tissue selection and share actual consumption/growth authorities across manual and autonomous feeding.
- `gameplay/discovery.js`, `render/world-traces.js`, `render/behavior.js`, `render/flora.js`, `render/renderer.js`, `ui/action-icons.js` and `ui/world-resource-target.js` present actual seed evidence, feeding motion, anatomy icons and illustrated crop targets.
- `persistence/save-manager.js` upgrades legacy tissue/bank/cargo state deterministically while retaining plant quantities, seed-bank quantities and RNG state.

## Verification and actual runtime evidence

13 focused suites passed: flora-tissue-propagules, dispersal, seed-shore-niches, dispersal-feeding-priority, foraging-choice, mouse-resources, contextual-interactions, world-trail-discovery, manual-resource-pose, reproductive-compatibility, live-courtship-encounters, held-brace-input and canonical-source. Checks cover diet/capability differences, read-only queries, exact targeting, finite transfers, replay prevention, dry kernel hydration, death loss, establishment ancestry, legacy stock migration and saves. Existing dispersal fixtures now perform funded harvests; the kernel-beak niche fixture distinguishes real kernel destruction from a valid grazing-mouth variant's transport.

**Controlled native browser workflow at 800×600:** two freshly generated identical worlds; staged player position/reserves and a valid kernel-beak body variant; real crop stocks, clocks and RNG untouched. Mouse fruit feeding removed 0.16 crop biomass, yielded approximately 0.128 edible flesh and carried 0.032 viable seeds. Keyboard movement moved the animal; real gut passage deposited that payload at another cell, where a young crop established with matching genotype and parent producer identity. The player selected/read its real deposit marks. A separate fresh-world kernel action yielded approximately 0.032 edible kernels, destroyed those seeds and discarded the remaining flesh; no viable cargo. Actual receipt-driven cracking pose and transport/current saves were checked. `flora-tissues-proof.json` and `flora-tissues-runtime.webm` contain receipts and continuous native gameplay. Screenshots show the entire HUD/world, not component mockups.

**Separate unstaged observation:** 120 wall-clock seconds in a fresh normal-speed world, ordinary Auto and Keep the old body choices only, no biology/resource/time fixtures. `natural-flora-proof.json` and `natural-flora-runtime.webm` record local paid dispersal, genotype-bearing establishment and autonomous seed destruction. No animal gut transport occurred in this bounded run. Controller and controlled-browser transport proof must not be presented as natural occurrence.

## Limits and next milestone

Founder genotypes are fixed migration payloads. There are no plant mutations, pollen, selfing, sexual hybrids or preserved multi-genotype distributions yet. Tissue allocations (20% seeds; pod coating 25%) are prototype values, not creator-approved balance. Existing genotype-bank metadata describes one fixed founder per resource alias; it is not the future rare-variant cohort solution. Actual seed banks are finite, but current plant growth still uses abstract moisture/fertility, not conserved environmental water/nutrient stores. Rendered crop amount controls availability; sprites do not yet portray every tissue compartment or inherited plant trait.

No human first-time comprehension, ten-minute engagement, creator visual approval or ecological balance is claimed. No new regression was observed in the scoped checks; four historical birth/courtship suites remain known failures recorded against both previous and current Hybrid Lineages source in `reproductive-compatibility-test-receipt.json`. The full historical suite has not been certified by this pass.

**Next meaningful milestone:** implement the environmental resource contract and explicit transfers before botanical reproductive genetics, diverse cohorts and the first adaptive defense/feeding loop. The creator's subsequent attachments approve plant-specific sexual/asexual architecture, functional body validity and fundamental elevation; their staged contracts are now in `design/GenVo-Biological-Capability-Expansion.md`. Numerical coefficients, exact compatibility genetics and final art remain open. No flight, climbing, physical elevation or fully evolving plants were added in this checkpoint.
