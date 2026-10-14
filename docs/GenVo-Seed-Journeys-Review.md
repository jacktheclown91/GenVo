# Seed journeys and feeding expression: completed integrated slice

The player can eat real fruit/pod tissue, carry its inherited seeds, leave them elsewhere through existing gut transit, read those marks to remember a patch, and revisit it from the journal after the surface trail fades. Returning can reveal actual new growth or the loss of a previously observed plant. Growth is neither created nor guaranteed by observation. This adds a discoverable activity between generations without adding planting stock or another biological controller.

A new plant is attributed through actual deposit contribution IDs inside the retained seed cohort selected by canonical germination. Coinciding genotypes alone no longer prove that a deposit grew. Mixed contributions are described as contributing to a patch. Each cohort retains at most eight recent IDs; older untracked contributions fail closed rather than inventing attribution. Discovery retains at most 32 observations; the journal displays the selected creature's eight most recent patches. Existing marks and old saves without deposit IDs remain inspectable, but cannot retroactively prove causality.

Journal Revisit uses shared action descriptors, anatomical sensing, actual route checks, PointerApproach and the existing movement costs. The radial, dock and E expose the same Read patch action. There is no remote growth monitoring: journal outcomes update only within current anatomical sensory reach or through a valid nearby reading. Patch icons use the last observed state; Inspect does not show a remote live plant thumbnail. Movement, attack, brace and courtship retain precedence over feeding poses.

Native receipt-driven expression now distinguishes a beak's peck, a crushing mouth's compression, and the pulling/recoil of ordinary coat handling. Seed fate and handling cost still belong to existing authoritative feeding/dispersal. The new renderer module changes posture and mouth animation only; it cannot extract tissue, spend resources, mutate ancestry or perturb RNG. Ordinary feeding, combat, courtship and offspring remain preserved.

## Gameplay source ownership

- ecology/flora-inheritance.js: bounded deposit contribution IDs on the existing seed quantities.
- ecology/dispersal.js: deposit serials and trace links; plain, deduplicated player deposit feedback.
- gameplay/seed-observations.js (new): bounded field memory, sensory eligibility and last-observed outcomes.
- gameplay/discovery.js: reads existing seed traces into that memory and updates visible observations.
- gameplay/interaction-command.js: shared Read patch validation/execution.
- render/feeding-expression.js (new), renderer.js: mounted-mouth-specific receipt poses.
- render/world-traces.js: remembered patch markers, still limited by the creature's senses.
- ui/journal.js, main.js, creature-context-tray.js: persistent records and native mouse Revisit through the existing approach route.
- ui/world-resource-target.js, resource-inspector.js: clickable remembered patches, plain observations and optional provenance.
- styles.css: readable full-width journal patch cards and 44px minimum revisit targets.

Full paths and canonical source hashes are in seed-journey-source-receipt.json.

## Verification

Sixteen targeted tests pass. tests/discovery.mjs still expects the old implicit nest collection result from an ambiguous command; it fails identically in the exact immediately preceding delivered ZIP. Its assertion was not weakened. See seed-journey-tests.json. Exact prior save restoration preserves plant, seed, coat, organic and genotype stocks and RNG; seed-journey-prior-save-receipt.json. Three 100-day producer-only runs retain tracked inventory within floating-point allowance (seed-journey-resource-probe.json); these exclude animal lifecycle balance.

Actual native Chromium, 800x600: three funded mounted-mouth handling modes, E fruit consumption, real walking, finite carried-seed deposition, mouse Read marks, journal recording, canonical growth, and journal-driven movement back to the patch. Seed origin carries the real recorded deposit ID; persistent observations and deposit counters survive save restore. See seed-journey-proof.json, PNGs and seed-journey-runtime.webm. Fixtures place the starting actor/camera and mount mouths, accelerate canonical transit and 20 vegetation phases, and move other animals away; they do not assign plant genotypes, create crop biomass or replace feeding/growth controllers. This is integrated controlled runtime proof, not unscripted ecological acceptance. The independent direct E/Q browser workflow passes again.

Separate 30-second normal fresh-world run, no commands or biological/terrain/reserve/position fixtures: tick 240, zero recorded gut deposits, zero carriers and zero remembered patches. This short negative observation does not establish natural discovery frequency, failed ecology, or first-time player comprehension. Existing historical birth/courtship, freshwater and habitat fixture failures remain documented; no full-suite regression-free claim or creator visual approval is made.

## Next meaningful milestone

This seed-journey/handling slice is closed. Next: an ordinary early-survival gameplay pass to make animal intentions and processing outcomes easier to read in crowded habitats, and to establish whether players actually encounter the new activity without directed fixtures. Avoid adding another persistent panel. Sexual flora rules, coat-dependent gut survival, aerial/vertical locomotion and evolutionary equilibrium remain open decisions/development rather than implicit additions here.
