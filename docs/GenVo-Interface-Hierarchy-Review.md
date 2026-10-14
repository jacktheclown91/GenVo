# GenVo interface hierarchy correction

This is a focused UI correction. The larger creature-art and biological roadmap remains unfinished.

Utilities (Tasks, Family, Auto, Speed, Journal, Home, World, Help) now sit behind Menu at the top right. Their existing listeners and deeper panels remain in place. The bottom strip owns creature portrait, needs and independent Eat/Drink/Rest controls. A selected target adds only its name, clear control and relevant creature modes. Water has no Combat/Social controls. Target action lists are rendered by the radial, not duplicated as dock cards. The dock expands for the actual courtship queue and returns to compact when the canonical encounter finishes, is cancelled, or is dismissed. Combat uses the existing selected-target controller and held guard input, with the mode reflecting the attack.

Radials use the same descriptors and execution validators as the dock adapter, retain the selected resource during ordinary navigation, and refresh action availability. Direct Approach & Drink rechecks the selected source on arrival. Native radial icons use mounted anatomy; decorative icons grant no capabilities. Radials sit beside the target so the creature and selection ring remain visible.

Bare-ground selection previously treated invisible low-density biomass as a plant. Selection now uses full native plant draw anchors from the renderer, with canonical plant biomass rechecked for depletion and world ownership. The flora anchor math is shared without changing plant art, food availability, diets or simulation RNG. Keyboard feeding still queries canonical nearby food independently of plant presentation. Render cache reset clears the visual pick registry.

## Native verification at 800 x 600

Run `node tools/capture-unified-dock.cjs`. The final run passed:

- Natural visible plant selection, ordinary approach, exact-patch consumption.
- Right-click natural water, no irrelevant modes or duplicate dock action list, direct Approach & Drink.
- Idle breath recovery through Rest.
- Actual selected-partner courtship queue, Play and Back Off; a second real courtship ran to completion and automatically compacted the interface.
- Radial pointer-held Brace and release; actual attack against an existing hunter with canonical target binding.
- Escape and empty-ground dismissal; top utilities and journal Escape without unintended pause.
- No page errors or dock button overflow.

The proof receipt is `hierarchy-proof.json`. The compact dock measures 57 px high after encounter completion and dismissal (9.5% of the viewport). Courtship measured 184.375 px (30.7%), reserved for its active queue/encounter controls.

Inspected full-game frames: `hierarchy-idle-800.png`, `hierarchy-water-radial-800.png`, `hierarchy-creature-selection-800.png`, `hierarchy-courtship-800.png`, `hierarchy-combat-800.png`, `hierarchy-details-800.png`.

The browser fixture uses a deterministic world with existing natural resources and real actors. Actors are positioned/readied for repeatable interactions; mate preferences, anatomy restrictions and reciprocal acceptance are unchanged. This proves UI/controller behavior, not unassisted play or retention.

Targeted checks passed: world-resource-selection, target-resource-states, mouse-resources, mouse-courtship, held-brace-input, selected-combat-actions, flora-landmarks, world-swap-render, render-cache. Canonical source audit passed for 172 modules and 79 registered/native part definitions, with no identical source copies.

First-time comprehension still requires observation of people who have not played GenVo. The proposed 30-second through 30-minute experience milestones are design targets, not measured results. No biological redesign, new creature preset, or removal of existing gameplay controls is part of this correction.
