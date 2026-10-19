# Finite carcass discovery and asynchronous save coherence

Current canonical repairs. Full fast gate: 453 pass, four known failures, zero new failures/timeouts/stale entries, 12 deferred of 469 in 217 seconds, with no code drift. Receipt: ../../test-runs/carcass-save-coherence-integration-2026-10-19.json. This is not a whole-resource, performance or release certificate.

## Carcass event

New worlds record carcassRules=existing-carrion/1. DiscoveryController searches existing land carrion within 22 tiles using stable cell order and the existing 0.1 marker threshold. It adds only a discovery marker: no food, death, RNG draw or replenishment. Duplicate live markers are refused. Existing predator stalking/warnings and depleted-marker retirement remain shared gameplay behavior. Current discovery copy describes actual remains instead of promising a large meal independent of stock.

Missing-policy historical saves retain exact absence and calendar-carcass/1 behavior. The explicit enableFiniteCarcass API records future-event adoption without debiting old rewards, altering organisms or fabricating prior resource flows. Adoption is idempotent and updates synchronized canonical archives atomically. Unknown/contradictory policy data and mixed regional rules reject. Outstanding debt and unsupported environmental-only clock conversion reject without changes. Historical-world UI adoption remains unfinished; new worlds need no adoption.

Canonical tests/carcass-food-policy.mjs covers empty food, actual controlled death-funded discovery, whole-World/RNG parity, predator lure, depletion, exact saves, historical event preservation, malformed data, region crossing and adoption guards. tests/discovery.mjs now supplies a declared canonical mortality fixture instead of expecting food from nothing. Current and --legacy audit modes are separately recorded in ../../performance/canonical-carcass-source-audit-2026-10-19.json and historical-carcass-source-audit-2026-10-19.json. The old unfunded receipt remains original evidence; no receipt is rewritten.

This fixes one food-creation path. It does not prove all carrion in a migrated historical world was death-funded, complete flesh/elemental conservation, or closure of grove multipliers/nest-material renewal. Previously created resources and markers remain attributable.

## Asynchronous save

createSimulationSnapshot borrows nested runtime structures for immediate transport. The previous saveNow captured them before awaiting metadata/database setup, allowing later ticks to mutate parts of a save while its captured clock remained old. A controlled regression reproduced stored tick 0 versus the intended tick-12 state after setup waits.

SaveManager now finishes those asynchronous setup waits before capture and enqueues IndexedDB writes in the same JavaScript turn. This avoids an additional full-world deep clone. Successful commit bookkeeping uses the captured tick and event signature, not the later live world. A genuine death occurring while a transaction is pending remains eligible for the following milestone save.

tests/save-async-coherence.mjs proves delayed setup, exact transported resource/actor/controller state, exact restoration and the later real event remaining pending. The storage fake clones synchronously at put to model the transport boundary; it is not browser acceptance alone.

Real Chromium/IndexedDB evidence: ../../performance/save-coherence-browser-2026-10-19/review.json, reproduced by tools/verify-save-coherence-browser.mjs. Actual stored/restored tick is 12, full restored state matches, and page errors are zero. The check also preserves 0.6455885768 represented food through death-funded marker discovery. It uses an independent controlled Simulation with real canonical ticks/mortality and actual IndexedDB, not human gameplay, mature-save performance or a main-loop timing claim.

## Provenance and outstanding work

Frozen pre-change comparison sources (not runtime authorities):

- docs/performance/discovery-before-finite-carcass.txt: SHA256 d15778c8a637c0f2d58e8efc9d5e080a40e08bfd17e8f08265300d4a4a014482.

- docs/performance/save-manager-before-async-capture.txt: SHA256 fc6bb3f84065c8d9be33f0d99dd1a4c120b540662718729675d852ac7fcfc361.

The full gate includes the new carcass policy and asynchronous-save tests, prior regional/save/export checks and the unchanged observer timing test. The four known failures and deferred suites remain explicit. Source remains local/uncommitted. Longer finite-rule ecological trials, mature planetary memory/frame cost, historical opt-in UI, complete material conservation and creator play/visual acceptance remain open. No population or biodiversity quota, budget increase, variant deletion, commit or push is introduced.
