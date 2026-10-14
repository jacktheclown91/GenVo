# Funded feeding performance

This implements one focused presentation/authority slice of the active seven-priority goal. It does not close the whole goal or approve mass/swimming numbers, creature art standards, ecological balance or human comprehension.

## What changed in gameplay source

- `src/render/feeding-expression.js`: genuine positive crop, freshwater-harvest and manual freshwater-food receipts produce source-facing reach, anatomy-specific processing and settlement. Pulling, pecking, crushing and filtering have distinct timed head/mouth/body responses. The age of the funded meal drives the performance instead of arbitrary idle gait phase. Renderer-owned WeakMap timing uses the existing pause-aware clock; no biology, preferences, reserves, RNG or save records are authored by presentation. A render movement segment may finish before the bite begins. Resumed movement, brace, attack and courtship interrupt that receipt and prevent replay. World replacement resets presentation.
- `src/render/renderer.js`: fulfilled meals orient toward their actual source after the simulation releases the target. Temporary eating/crushing replaces generic idle/search presentation while safe; alarm and combat attention take priority. Active non-player meal performances bypass the generic sprite cache, whose old key omitted receipt processing state. Existing cache capacity is unchanged. No permanent actor targets or new interaction commands.
- `src/render/head.js`: explicit and implicit modular heads can reach along facing while mouth and eye mounts remain attached. The bounded reach integrates with existing body language and native indexed artwork.
- `src/sim/simulation.js`: a stale/forced carrion feeding target now checks canonical plantPreference for carrion before extraction. A grazing mouth cannot destroy meat while gaining zero energy. Valid scavengers retain their existing meal quantity, energy, disease and learning paths. No biological balance values changed.

Players can see an actual meal become a short organic response, facing the consumed resource, with visibly different mouth use. Wildlife receives the same presentation. Actual filtering food during direct hydration responds without coupling Drink to a combat/social mode. Failed actions do not fabricate meal poses.

## Evidence

16 focused suites pass: funded performance/interruption/pause/read-only actor and RNG, seed observation, motion, resting contacts, player motion, native animation/catalog/render/art, handling, targeted feeding, saves, learned outings and shared demand. Paired 480-update natural simulations still match positions, reserves, intentions, reproduction drive and RNG exactly. This checks normal valid AI outcomes, not every possible evolved combination.

The targeted-feeding historical failure was independently reproduced in the exact pre-pass source: its carnivore fixture gave a grazing mouth carrion. The corrected test preserves original consumption, energy, target release, save/load and distance assertions, adds invalid-anatomy non-consumption, and then installs a canonically valid scavenging mouth. The runtime extraction guard fixes the underlying bypass too; no assertion was disabled.

Paired native Chromium 800x600 evidence uses actual E on existing pod stocks and complete valid bodies. Prior/current scenes record normal running simulation and presentation clocks following each E. Current grazing, beak and kernel mouths each pass reach -> process -> settle, without state-machine outcome fabrication. A non-player beak body resolves a real meal through the existing simulation; its native presentation is observed and its receipt/body survive exact save/load. Actual Shift+E at a natural drinkable bank funds a finite freshwater harvest and displays filtering. Browser errors: none.

Body/location/reserve/other-actor placement are explicitly controlled fixtures, not natural ecological outcomes. The capture setup clears prior explicit quick choices as a mouse selection does; an earlier setup failed to do so and incorrectly sampled an old receipt. Captures now require a fresh receipt timestamp. Existing controller behavior was preserved.

Screenshots: `feeding-performance-{before,after}-{grazing-mouth,beak-mouth,kernel-beak}-800.png`, `feeding-performance-npc-800.png`, `feeding-performance-filter-800.png`. Actual running native recordings: `feeding-performance-before-runtime.webm`, `feeding-performance-after-runtime.webm`. Proof: `feeding-performance-browser-proof.json`.

## Limits and next milestone

The source-facing whole creature response is verified and the paired whole screenshots were inspected. Small anatomy is still difficult to distinguish at normal embedded zoom; improved joint/limb silhouettes and a broader natural encounter review remain necessary. No creator visual approval, unfamiliar-player success or soundtrack listening is claimed. Corpse processing and ordinary non-tissue forage retain their existing presentation; no invented organ or new assets were added.

The cache bypass is bounded to actual active meals but has not established large-ecosystem render performance acceptance. The earlier consolidation simulation timing result is historical evidence, not a fresh frame-rate claim for this rendering pass. Natural plant selection, generations, seed cohort scalability and human playtesting remain open. Physical mass/swimming remain creator-review proposals.

Next: whole-creature support and locomotion expression at gameplay zoom, then the existing courtship/combat feedback and vegetation/audio cohesion priorities. Continue to use canonical anatomy/controllers rather than hand-authored creature templates.
