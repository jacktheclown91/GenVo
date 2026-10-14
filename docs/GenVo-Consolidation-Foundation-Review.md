# Consolidation foundation implementation

The creator's current-content review is implemented as a bounded correctness/performance pass. The learning/practice fixes already delivered remain intact; both suites pass without removing their assertions. This closes this foundation slice, not the full consolidation or development goal.

## Runtime source changes

- `src/lineage/part-abilities.js`: cache raw anatomy separately from contextual legacy-normalized results. Sharing a body-plan object or changing an actor context cannot reuse another context's result. The current legacy baseline behavior is preserved; removing it would change biological numbers and remains a reviewed migration/rebalancing decision. Correct kernel-beak description: crushing destroys seeds.
- `src/ecology/dietary-demand.js`: reuse the focal canonical resource receipt for funded consumers with the same mounted mouth and connected traversal context. Live-prey overlap, individual low reserves, different mouths and different habitat access retain full evaluation. No stocks or outcomes are cached across the day.
- `src/ecology/dispersal.js`: avoid allocating a tissue-view object on every cached yield hit; preserve exact current total/seed/coat/genotype/bite invalidation and individual affordability.
- `src/ecology/plant-handling.js`: numeric ecological preflight and explained player receipts share the same effort, anatomy and reserve helpers; repeated queries avoid explanation-string allocation.

No new feeding, movement, courtship, genetics or reproduction controller. No part IDs removed. Mouse-first HUD/Lab layout unchanged. Part-weight/swim/birth-route and mutation-point numbers are unchanged.

## Verification

18 focused suites passed, including learning/practice, parts, resource handling, kinship, conception and save persistence. Paired old/current natural simulations match exactly over 480 updates for every actor's positions, energy, hydration, life state, intentions, reproduction drive and main RNG, with sampled carrying-state equality.

Six alternating fresh native Chromium runs measured mean full simulation-update time 3375.03 ms before versus 2947.20 ms after over 480 updates: 12.68 percent less. Rendering is excluded from this timing. Tail costs are variable (one after p95 was 25.8 ms); this does not restore the older pre-shared-demand budget or prove large-world frame-rate acceptance. Exact pre-change source and CPU profiles are retained for reproduction.

Seven complete valid adult bodies were exercised inside the actual 800x600 game: walking, runner, sturdy, spring, one-webbed, two-webbed, and kernel-feeding anatomy. Canonical direct-control walking/sprint and real water movement consumed actual energy. Canonical meals depleted naturally present pods, transferred edible tissue and viable/destroyed seeds, charged processing and saved/restored exact anatomy and energy. Body/age/genes/location/reserves were controlled fixtures; ecology and outcomes were not fabricated. Native screenshots and WebM are captured. The camera/creature scale still makes small anatomy difficult to distinguish; no creator visual approval is claimed.

The separate normal 600-second accelerated lifecycle run had 91 births, six deaths, 281 living animals, zero extinctions and zero pollen crosses. Botanical state save/load parity passed. This seed reproduces the previous recorded outcomes, not an ecological balance result. No human playtest or natural teaching/handoff proof.

## Findings and next work

Runner legs increased ordinary travel from 4.0313 to 4.4344 tiles for 120 controls with correspondingly greater expenditure. Sturdy legs moved 3.7894. Spring legs matched walking pace but sprinted 7.1232 versus 6.2484 tiles and spent 0.14625 versus 0.10872 energy. These measure actual actions, not isolated displayed multipliers.

Kernel feeding genuinely differs: the demonstrated meal consumed kernels, destroyed seeds and used specialized coat effort. Its misleading dispersal wording was corrected rather than altering genetics. One webbed leg and two webbed legs still disagree between crossing eligibility and body propulsion. All measured neutral adults still mass 1.45. Live womb value/default birth route and repeated carry/sensory roles remain unresolved audit findings; no arbitrary penalties or exclusion rules were introduced.

The next meaningful milestone is creator-reviewed physical mass and one authoritative swimming contract, followed by whole-body locomotion/feeding expression and reproductive-organ value. Concrete alternative contracts and complete-body comparisons are in `design/consolidation/Physical-Mass-and-Swimming-Proposals.md`. They require review before biological rules change.
