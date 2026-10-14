# Learned outings and adolescent independence

## What changed

`src/family/learned-resource-target.js` is a read-only routing adapter to the existing foraging and reach authorities. It validates one remembered source against actual mounted feeding anatomy, current tissue/handling reserves, habitat access and drinkability. It never substitutes another food, consumes a resource, changes memory or creates a second interaction system. Floating aquatic food retains its source coordinates and a valid bank/swimming approach.

`src/family/family.js` uses that shared assessment for learned survival decisions and starting/rechecking solo practice. Changed diet, spent food, a lost route or unaffordable coat leads to a genuine aborted outing/return. A tick-zero start now expires under the existing timeout. Already learned danger no longer reactivates the tight teaching-only follow radius; unlearned danger retains that existing behavior around a real threat.

Practice credit now requires a positive receipt at the selected food cell/type or chosen water approach. Eating something unrelated or drinking along the route cannot masquerade as reaching the intended stop. A completed outward stop still requires an actual return before a completed outing is recorded.

`src/sim/simulation.js` forwards actual canonical hydration/harvest receipts and honors selected plant tissue in autonomous feeding. Existing execution, resource transfers, ecology, anatomical validators, physiological thresholds and reserve costs remain authoritative. No mutation costs, swimming policy, mass units or fertility rules changed.

## Tests and native runtime

All 16 focused checks pass in `learned-outings-tests.json`, including both previously failing learning/practice suites. Historical fixtures used manually spawned children without materialized inherited bodies, a remembered coordinate that was not necessarily drinkable, a fixed independence radius despite temperament, and a threat/child location that could be invalid or separated by a river. The repaired fixtures use canonical inheritance, actual reachable banks/ground and a capable reachable adult threat. They retain taught independence, two genuine food/water returns, recovered-danger history and no fabricated success.

Separate source regressions verify changed diets, depletion, barrier rejection, exact positive resource receipts, a true tick-zero timeout, and learned versus unlearned danger spacing with a real anatomical threat. Decision/learning checks retain no-RNG requirements. Family, compatibility, finite tissue and save integration remain covered.

`learned-outings-browser-proof.json` and `learned-outings-runtime.webm` show a valid inherited adolescent in the native 800x600 game completing one food and one water stop and returning twice. The setup controls age, readiness, prior lessons/memories, actor population and an empty shelter. Its feeding source, water and terrain are natural existing resources; no food was authored or stocked. After setup only ordinary simulation updates drive positions and outcomes, accelerated relative to recording wall time. Actual positive receipts, movement samples, field-readiness and exact save/load progress/body parity are recorded.

`learned-outings-start-800.png` and `learned-outings-return-800.png` are whole-runtime frames, not component screenshots. They do not establish creator visual approval or unfamiliar-person comprehension. Naturally learned lessons and natural offspring completing the loop without fixtures remain to be observed.

## Open work

Shared-demand performance is still slower than the earlier model. Source-based body-mass costs, the one/two-webbed-leg discrepancy, broader content balance, richer creature artwork, ecological selection, natural generation handoffs, subjective listening and human first-time playtesting remain open. This pass repairs functioning progression rather than claiming the entire consolidation roadmap or seven-priority goal is complete.

Next: reduce shared-demand update cost while preserving finite stock/individual eligibility, then conduct locomotion/feeding balance and native artwork comparisons under the approved consolidation plan.
