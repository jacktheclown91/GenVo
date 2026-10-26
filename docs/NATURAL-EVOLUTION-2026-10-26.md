# Natural evolution investigation — prospective protocol

This is stage E of the October 26 engineering assignment. Performance checkpoint `3503dd628c6e074344883fda0fa29b382a0bc68d` is pushed; its exact 121-check CI run 40400067101 succeeded. The prospective long experiments started only after that checkpoint was verified.

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

All four prospective worlds are rerunning under that stable runtime, to new `reports/engineering-E-fixed-long-*` paths. Each now also retains a terminal V8 snapshot before save verification so any later failure can be diagnosed without rerunning the entire world. A failure remains strict but emits a compact error rather than dumping the full ecosystem into the console. First-run observations will be compared with the corrected rerun to check that the UI cleanup did not change ecology or RNG. Exact-head 122-check CI remains required.

## Current status

Observer implementation and diagnostic parity are established. The four prospective 320-day experiments are running sequentially. Their observed ecological consequences, any justified targeted correction and final exact-head verification remain outstanding. A separate source-3503dd62 release candidate has passed extraction integrity and native controls; advanced-start verification is in progress. No natural species, stable advanced body plan or long-term reproductive outcome is claimed from the short observer checks.
