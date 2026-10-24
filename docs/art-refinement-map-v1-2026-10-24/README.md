# Biological exploration map presentation

The Field Guide now has an active Map page, available directly through Game utilities > Map and through the existing Y/Field Guide tabs. It displays this controlled creature's retained terrain observations, with separate region/layer choices, fitted or whole-region extents, cardinal orientation, scale and the actual current creature marker. Hatching means unrecorded terrain. Place markers use the current region's family Field Guide discoveries and are explicitly historical observations, not live condition reports. Earlier regions do not borrow current-region places or a ghost actor; their place records are labelled unavailable here rather than falsely absent.

The map reads the shared sensoryRegionKey / sensoryMemoryCellSize and existing sensoryMemory schema-1 rows. It never samples live water/plant/height/temperature arrays, the planetary generator, remote archives or wildlife positions. It does not load regions, introduce travel commands, reveal resources, call recordSensoryMemory or add a save field. Existing four-region/800-area biological retention is unchanged. Unknown/historical worlds do not silently adopt observation recording; empty disabled views explain the unavailable recording rule. Personal terrain observations and family-discovery markers retain their separate provenance.

Map controls, focus, scroll and optional details survive read refreshes. Unchanged text/list content is retained rather than repeatedly replaced. World/actor identity tokens use weak keys: a closed map must not retain an evicted World or old controlled creature. Actual new World/actor ownership resets the selected view and extent. Only a bounded retained observation model is passed to the canvas painter.

## Automated and actual exported-game evidence

Eight focused checks pass: exploration-map, sensory-perception, knowledge, view-modes, stratum-senses, menu-task-usability, public-export and world-swap-render. The new contract checks ordinary canonical survey recording, poisoned live-field getters, world/region/layer separation, known-family-site-only markers without hidden current-condition reads, no creation of memory, historical disabled-recording compatibility, independent copied models, bounded map extents and complete saved-state/RNG parity. Extra region/layer/disabled-rule cases are explicitly unit fixtures, not fabricated gameplay.

The normal export contains 840 files / 415 module/dependency entries. Canonical source audit passes. Actual public New World, Game utilities/Map, Y and native Field Guide controls work. Twelve real map views (two extents at 1920x1080, 1366x768, 1024x768, 800x600, 600x800 and 390x844) show only matching retained rows, nonempty native map pixels, no horizontal overflow and exact saved-graph parity across synchronous redraws. Six utilities-menu layouts stay on screen and clear of the protected player. UI-cache invalidation is an explicitly labelled presentation fixture; it preserves canvas/select identity, focus and open details without changing discovery or biology.

Native Save & Return/Continue preserves recorded terrain classes and the selected creature; ordinary ticking may legitimately refresh observation timestamps after resume, so the browser receipt does not claim an exact paused whole-state load comparison. A second genuine New World in the same application uses its own record key/count and resets the extent instead of borrowing the prior world.

A separate ordinary journey holds D across the real east border, from origin 0,0 to 128,0, without setting any observer position, world, survey, stock or event. The same individual retains both region views. Selecting the earlier view shows its actual remembered terrain, no ghost current actor, no borrowed current-site records and exact read/draw state parity. Selecting the current view restores its actual actor marker. Public Save & Return/Continue retains both selectable views. Screenshots from desktop, narrow and actual regional journeys were inspected.

The first draft test incorrectly expected a survey after six updates. Existing recording cadence is CFG.simHz*2 (16 ticks). Only test setup was corrected to sixteen ordinary updates; the assertions, shared cadence, perception, biology and budgets were not weakened. The original failure record is retained.

## Scope and remaining work

This is a usable biological observation map, not a substitute for the full planetary navigation/storage architecture. Long-history/family-terrain knowledge, indexed observations beyond native creature retention, archived-region landmark exposure, travel/route commands, natural underwater/underground map journeys, broad evolved-checkpoint acceptance beyond the Day 31/101 starts and creator/GPU acceptance remain open. Those mechanisms need their existing owners; no hidden region is reconstructed as a cosmetic preview. Full GenVo v1 remains incomplete.

The full shared-interface integration gate passed 106/106 at commit 4de5c21c9ee843027e3ba8ca0aa28be53e40359b. This is the gate result before the bounded compact/expanded placement follow-up and later winter-water integration; eleven focused checks and fresh exported browser reviews cover that merged follow-up. The focused and actual-browser evidence above is established separately. No complete release, migration or creator approval is claimed.

## Reproduce and handoff

Export with node tools/export-public.mjs <new-output>. Run node tools/review-exploration-map.cjs <export> <new-report> for the responsive/public-save review and node tools/verify-map-regional-journey.cjs <export> <new-report> for the actual crossing. Current review build: C:\Users\jackt\AppData\Local\Temp\genvo-map-v1-web-20261024-commit.

The checked-in integration handoff and exact applied patch are in ../art/exploration-map-v1-handoff/. Do not reapply the historical patch to integrated source. The canonical development archive reports/art-session-20261024-map-v1-raw preserves earlier/current observations and receipts with SHA verification. All cartographic artwork is original code-native canvas/SVG; no external models, images, libraries or new licences.

## Compact placement and recorded worlds follow-up

Map defaults to a compact pane beside the controlled creature on desktop, or above/below it on narrow windows. Placement reads only the current creature's existing screen position, including clamped cameras; explicit Expand map / Restore map controls provide the larger book view. Leaving Map clears its placement and expansion styles. Six real screen sizes retain actual actor clearance, both extents, terrain visibility and save-state parity. Twelve explicitly labelled screen-space placement fixtures cover opposite corners without editing any simulation/world position. These fixtures are layout evidence, not natural gameplay frames.

The first compact overview candidate obscured the tiny retained terrain patch; scale-aware markers improved it but still failed the unchanged terrain-pixel threshold. Rounded pixel-aligned observation cells fixed the remaining fractional rasterization. Both failed reviews are retained alongside the passing review; no visibility threshold or native observation policy was relaxed.

Real catalogue Day 31 and Day 101 starts were opened through public controls. Their existing observation availability and biological rule flags are respected, with exact synchronous read-state parity; mature-world Save/Continue preserves those rules and the creature. This establishes recorded-world UI compatibility for those starts, not broad evolved-world biology or creator acceptance.

Merged-source checks also include winter-water, gameplay-actions and contextual-interactions. Latest reproducible browser build: C:\Users\jackt\AppData\Local\Temp\genvo-map-v1-web-20261024-tab-reset. Raw archive includes the original 106-check gate and the later focused/browser receipts with their separate source scope.
