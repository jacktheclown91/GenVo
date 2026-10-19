# Current part-route structural audit (October 19, 2026)

This audit uses all 91 current registered parts and actual mutatePlan transitions. It preserves the earlier 79-part receipts as historical evidence. No runtime, mutation policy, growth coefficient, anatomy route or long-trial input was changed.

The bounded catalog search found operator witnesses for 82 parts, including already-present founder structures. Eight existing exclusive/relic parts remain excluded by the current mutation policy: horn-crest, tusk-jaw, gliding-membrane, luminous-tail, shell-back, armored-hide, glow-eye and echo-crest. A twelve-leg body has a legal operator witness. The initial search did not find mammary-gland; a declared larger 512-expansion search also missed it. Neither negative result proves impossibility.

A separate declared target sequence resolves the structural gap:

1. small-torso to soft-torso
2. soft-torso to stout-torso
3. acquire filament-tuft
4. develop fur-mantle
5. acquire live-womb
6. acquire endothermic-core
7. acquire mammary-gland

Each step enumerates existing mutation choices, selects the declared target through the unchanged mutatePlan authority, validates the result, and replays the exact branch/index sequence. No body is assembled by direct placement in this witness. The final body retains fur, womb, endothermic core and glands simultaneously. Stout torso has flank capacity three per side; its paired organs fit without displacing their support. The bounded prerequisite-distance search does not explicitly favor this capacity expansion, illustrating a search limitation rather than a missing registry part.

Together, these receipts provide structural witnesses for all 83 non-exclusive parts. That is not full evolutionary accessibility. The current founderPlan is already a four-legged, two-eyed, feeding organism; calling it the founder does not demonstrate evolution from truly minimal life. The witnesses do not establish ordinary mutation frequency, real inherited births, recombination, paid growth, viable reproduction of intermediates, simplification pathways for every function, or observed physiological/gameplay consequences. The final paired organs and their costs still require those lineage-level experiments. No advanced feature is required to arise in every ordinary 100-day run.

## Evidence and reproduction

- current-part-route-audit-2026-10-19.json: complete bounded 91-part audit, source hashes, 10,990 enumerated choices and replayed witnesses.
- mammary-route-expanded-search-2026-10-19.json: explicitly bounded negative search, 59,423 choices, not an impossibility claim.
- mammary-constructed-operator-route-2026-10-19.json: seven actual transitions, complete intermediate bodies, operator receipts and exact replay.
- tools/audit-current-part-routes.mjs reuses the preserved multistep audit algorithm with fresh output/import resolution and optional declared goal/expansion bounds. Its receipt records the original script hash and the changes.
- tools/check-mammary-structural-route.mjs reproduces the declared sequence into a fresh receipt.

The three-region autonomous 100-day trial runs independently with runtime source fixed. At the observed day-30 checkpoint, raw V8 size was 140,143,857 bytes and sampled post-GC heap about 364 MB. It subsequently passed day 33; no day-100 completion is claimed. Occasional small diagnostic processes ran alongside it, so elapsed time is observational rather than a dedicated isolated benchmark. Live process/log state, not this note, determines subsequent progress.
