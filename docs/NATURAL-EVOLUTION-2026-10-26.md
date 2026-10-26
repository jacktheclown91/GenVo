# Natural evolution investigation — measured results

This is stage E of the October 26 engineering assignment. Performance checkpoint `3503dd628c6e074344883fda0fa29b382a0bc68d` is pushed; its exact 121-check CI run 40400067101 succeeded. The prospective long experiments started only after that checkpoint was verified.

## Completed 320-day field results

Four headless canonical-ecology runs, 76,800 ticks each (307,200 total), completed without organism/resource intervention. Each passes ecological integrity checks, retained full-snapshot signatures and independent six-tick restored continuation. This is natural simulation evidence, separate from native browser responsiveness. No balancing parameter was selected or retuned to obtain these outcomes.

| Seed | Policy | Initial / final living | Conceptions | Paid births | Offspring reaching maturity | Maximum ancestry depth |
|---|---|---:|---:|---:|---:|---:|
| LONG-0 | Original | 192 / 79 | 39 | 62 | 53 | 4 |
| LONG-0 | Balanced | 192 / 77 | 53 | 76 | 70 | 5 |
| LONG-1 | Original | 193 / 1 | 19 | 24 | 17 | 2 |
| LONG-1 | Balanced | 193 / 4 | 19 | 26 | 19 | 3 |

Across these two pairs, births were 86 original versus 102 balanced; conceptions 58 versus 72. Completed-display mutual acceptance was 68/408 (16.7%) versus 79/155 (51.0%). These are mixed-condition ecological rates, not the favorable-condition 65–80% target. The separate controlled holdout remains approximately 70–72% for near-identical founder/inherited cohorts. Fewer repeated rejected displays did not guarantee population growth: the first balanced world ended with two fewer living animals despite more births.

The second seed suffered 135 recorded wildfire deaths in the original run and 132 in the balanced run. Both controlled founder lineages died in wildfire on Day 94. The first seed's controlled founders died of dehydration on Day 72 original and Day 35 balanced. All four controlled lineages ended without descendants; other wild GenVo and fauna nevertheless reproduced across multiple generations. These outcomes are retained, not converted into protected populations or hidden by stopping at player death.

## Biological questions and limits

- **Separation and speciation:** no naturally recognized new taxon, secondary population centre or recognized species arose in any field. Therefore these runs do not establish that stronger similarity causes stable reproductive separation, and cannot estimate its effect on species incidence. The existing controlled speciation-threshold test passes with `--balanced` on Node 22/24: the reception policy does not disable recognition when its independent conditions exist. The architectural dependency below explains the missing autonomous recognition path; it is not repaired by forcing a threshold or declaring anatomical variants to be new species.
- **Divergent gene flow:** real conceptions occurred in appearance-distance bins 0.4–0.6 and 0.6–0.8. Across both seeds, distance ≥0.4 produced 10 original and 12 balanced conceptions. Cross-founding-label conceptions were 8/8 for LONG-0 and 6/5 for LONG-1 (original/balanced), including GenVo–Hopper and other compatible combinations. These founding labels are distinct from recognized evolutionary taxa: actual recognized cross-taxon conceptions were zero because no such boundaries arose. Divergent compatibility remains possible; there is no new distance cutoff.
- **Individual choice:** natural conceptions involving at least one negative similarity allele totalled 24 original and 27 balanced. Refusals remained common. This does not mean every unusual preference is fulfilled; the controlled strongest-contrast profile also retains its unchanged reception signal. Kinship, funded courtship, completion grace, disease and physiological restrictions remain under their existing owners and pass their contracts.
- **Successful bodies and variation:** LONG-0 ended with 32/46 original Hoppers and 33/47 balanced Hoppers retaining an initial Hopper body plan, alongside 21 and 29 globally novel birth-plan IDs. Both retained nonzero variation across all eight measured inherited quantitative genes. Recognition is not inferred from body-plan hashes, and this finite horizon does not establish equilibrium.
- **Inherited anatomical combinations:** naturally born G3 Hopper #223 combined filter mouth, walking legs and spring legs, matured on Day 107 and survived until wildfire on Day 294. Another G3 with the same plan, #240, matured on Day 206 and remained alive at the horizon. Compound-eye/limb combinations and other recombinations also occurred. This establishes viable inherited combinations through ordinary births, not universal reachability of every advanced catalog combination or indefinite anatomical stability. No mutation or body was forced.
- **Geographic adaptation:** spatial gene moments and prospective pressure history are retained. Variation and habitat-associated survival are observed; these two seeds do not isolate causal inherited geographic adaptation. Controlled founder lineages ended before developing the G3 population-centre history needed by the present recognition system. Do not infer adaptation merely from a changed allele mean or survivor count.

[Curated measurements](NATURAL-EVOLUTION-2026-10-26.json) retain source/observer hashes, distances, preference groups, births by species, juvenile outcomes, genetic moments, body examples, extinction ranges and endpoint state signatures. [Compressed original receipts](NATURAL-EVOLUTION-2026-10-26-field-receipts.json.gz) preserve all four successful JSON files plus the original failed-verification JSON verbatim, with original SHA256 checks. Full V8 terminal snapshots and logs are also retained outside the managed worktree under the current release candidate's `evidence/natural-fields/`. Reproduce summaries with `tools/summarize-natural-evolution.mjs`; it requires complete real receipts and their matching full snapshots and does not accept partial worlds as final evidence.

## Observation and parity

`tools/observe-natural-evolution.mjs` constructs an ordinary new planetary world using the same survival opt-ins as the game and enables the existing AUTO control. Normal constructor founder/mate preparation remains identical in both compared policies. It does not introduce special animals, edit reserves, teleport creatures, issue population-forming directives, select mutations, guarantee reproduction or request species outcomes. It advances the canonical simulation without the presentation-only tutorial or birth modals; biological family-control and death behavior remain authoritative.

Passive wrappers record existing conception results, refusal records, paid births and deaths. Daily census records juvenile maturation, body plans, inherited gene moments by geographic cell, lineage versus founding fauna anatomy, actual population centres, pressure history and the existing speciation/tree records. Statistical observations do not assign identity, mutate genes or call the state-updating speciation evidence UI. The report retains actual birth records, sampled census history and observed reproductive events. Founder ancestry depth is an analytical label, separately reported from the game's generation authority.

An initial 96-tick probe matched the uninstrumented complete snapshot but exercised no reproduction. A 4,800-tick / 20-day probe of `SIMILARITY-FIELD-0` then matched complete uninstrumented state with one actual conception. A separate 5,760-tick / 24-day probe of previously observed `SIMILARITY-FIELD-1` matched complete uninstrumented state with six mating calls, two conceptions and one actual Hopper birth. These are diagnostic observer checks, not the prospective long-term sample or a success-rate estimate. Original fixed snapshots and RNG are compared without rounding. These checks are stored in ignored `reports/engineering-E-observer-*.json`.

## Prospective long field sample

- Two new seeds, fixed before observing their outcomes: `SIMILARITY-LONG-0` and `SIMILARITY-LONG-1`.
- For each seed, both `original` and `balanced` existing reception policies; identical normal initialization options apart from the explicit versioned similarity opt-in.
- 320 ecological days per world at the actual modern 30-second clock. This exceeds the 290-day GenVo founder lifespan and permits turnover across multiple potential reproductive generations; no minimum survival, birth, branch or species count is imposed.
- Continue canonical world ecology after player death rather than ending the sample when one animal dies. Do not force a replacement or unpause the simulation; any actual inability to advance is an explicit failed run.
- Save progress every ten days, report all outcomes including extinction, and verify a real final snapshot and independent six-tick restored continuation. Runtime fingerprints and observer hashes identify the actual code; source changes during a run fail closed.

Run one world per process, sequentially, preserving output paths. Example:

```sh
node --expose-gc tools/observe-natural-evolution.mjs reports/engineering-E-long-0-original.json SIMILARITY-LONG-0 320 original
node --expose-gc tools/observe-natural-evolution.mjs reports/engineering-E-long-0-balanced.json SIMILARITY-LONG-0 320 balanced
```

Repeat for seed 1. Do not compare raw courtship acceptance alone with conception, viable births or surviving descendants. Gene/space associations are observational; they do not establish causal adaptation by themselves. Absence of a rare part or recognized species in this finite sample does not prove impossibility. Positive controlled anatomy and cross-taxon fixtures remain separate mechanism evidence.

## Architectural constraint to investigate against field records

The existing `SpeciationController` evaluates the populations supplied by `PopulationPressureMemoryController`. That list consists of the primary home and `GenerationProgressionController` centres. The only runtime call that adds a secondary centre is successful completion of a G3 leadership objective; those objectives depend on scout/gather or satellite-settlement actions. Recognition additionally uses lineage members, inherited trait depth, ecological history and actual recent births/gene flow. `evidenceFor` updates recognition evidence, so the observer deliberately does not invoke it independently.

Consequently, naturally different animal cohorts do not automatically become recognized species merely because their courtship changes. The field records must establish whether the required population history/centres actually arise under ordinary AUTO. This is a documented implementation boundary to distinguish from reproductive infertility or a numerical threshold that should be tuned to manufacture a split. No recognition threshold, mutation rule or population protection has been changed.

## Demonstrated save defect and targeted correction

The first original-policy world reached Day 321 / tick 76,800, 62 births, 39 conceptions and fourth ancestry depth, with the controlled founder lineage extinct. Its final strict continuation check failed: the live actorless reproduction controller retained selected mate #124 after that formerly selected creature died, while restore correctly removed the dead target ID. The original report and failure log remain `reports/engineering-E-long-0-original.json[.log]`; ecological observations are preserved, but the run is not reported as verified save continuation.

`LineageTracker.handleActiveDeath` now calls the existing reproduction `onActiveChanged` cleanup when there is no heir, just as it does when an heir takes over. No birth, death, mating, resource, anatomy or mutation equation changes; cleanup consumes no RNG. The controlled regression fails on the old code and passes on Node 22/24, including subsequent death of the former partner, full snapshot/continued ecology equality, both clocks and historical still-living selection fields. No saved field or migration is added. The gate retains all 121 checks and adds this case as check 122. Original snapshot goldens, mixed clocks, architecture and source audit pass.

All four prospective worlds completed under corrected runtime `1cbd46e82badb02d2c8e37bddefea1649da21b9e`, to new `reports/engineering-E-fixed-long-*` paths. Each now also retains a terminal V8 snapshot before save verification so any later failure can be diagnosed without rerunning the entire world. A failure remains strict but emits a compact error rather than dumping the full ecosystem into the console. First-run observations will be compared with the corrected rerun to check that the UI cleanup did not change ecology or RNG. Exact-head 122-check CI [40405119717](https://github.com/jacktheclown91/GenVo/actions/runs/40405119717) passed. The corrected first world matches every recorded ecological census, gene/anatomy observation, birth and reproductive event from the pre-cleanup world; only its strict save verification is now successful.

## Current status

The required multigenerational investigation and targeted save correction are complete at their stated scopes. The runtime checkpoint passed all 122 checks; the current separately named source-1cbd46e8 release candidate passes independent extraction, native controls and both advanced-start save/Continue workflows. The final report/handoff commit still needs its own exact-head CI. Naturally stable new species and causal geographic adaptation remain **not established**, not silently accepted. The next biological task is to extend the existing population-memory/recognition interfaces with prospective autonomous geographic-cohort evidence while preserving old saved policies and keeping one recognition and mating authority. That is a broader architectural feature, not a numerical balancing adjustment justified by these outcomes.
