# Morphological evolution S8 — autonomous size evolution

S8 of the creator's brief asks that wild populations inherit, keep or lose the new morphological characteristics through ordinary biological processes. Scenario E: inherited variation is exposed to selection, survival and reproduction decide what persists, and nothing is forced. The brief's evidence rule: do not lower speciation thresholds; make sure new variation can actually be inherited and selected.

**Status.** Implemented for `body-size/2` worlds, which are the current new games. Saved worlds keep their evidence rules.

## Audit

- **Inheritance paths.** Every birth goes through the same newborn authority: live births, eggs, player and wildlife, and archived regions (which use `tryMate`, gestation and `spawnFundedOffspring`). So every birth inherits size, one allele from each parent. Conception snapshots carry size if a parent dies before the birth (S1).
- **Gap 1: evidence.** Inherited-physical evidence (`inherited-parts/1`) counted body parts only. Size divergence could never contribute to recognising a new species.
- **Gap 2: the evolved library.** Library entries stored a representative anatomy but not size. Founding from a naturally evolved configuration therefore restarted near 1×.
- **Wild anatomy varies in ordinary new games.** In an 80-day run there were 5 accepted body mutations in 18 births, and 7 offspring with a plan unlike either parent's.
- **Autonomous evolution (species recognition) was not enabled in new games**; it ran only in the field tools. The creator enabled it on October 29 (below).

## Implemented

- **`inherited-parts-size/1`** (`lineage/inherited-anatomy-evidence.js`, used in `body-size/2` worlds).
  - The same part evidence, plus an inherited ancestral **baseline size**: the mean of the parents' baselines in log scale, or their own size in the first generation.
  - A body whose inherited adult scale differs from that baseline reads as **Larger body** or **Smaller body**. Strength is |ln(scale/baseline)| ÷ ln 2, under the same floor (0.16, a change of about 12%) and cap (0.72) as parts.
  - Persisting divergences gain lineage depth across generations, exactly as part divergences do.
  - Thresholds and recognition gates are unchanged; size is simply now inherited variation the gates can see.
  - Saved evidence is validated: a size baseline is only allowed under the size rule, and must be finite.
- **Evolved library** (`lineage/evolved-library.js`). Entries from a sized cohort record `traits.bodySize`, the mean and standard deviation of log size. Founding from such an entry draws both alleles around that mean, spread by its standard deviation (`evolvedFounderSize`) within the world's bounds. Older entries without size found exactly as before.
- **Measurement tool.** `tools/measure-size-selection.mjs` runs a full new-game world and reports, per species:
  - adult size mean and spread over time;
  - the midparent-to-offspring regression (a heritability estimate);
  - the selection differential (the breeding parents' mean minus the adult population's);
  - size at death against living adults.

## Natural evidence (observation, nothing staged)

Two 200-day new-game fields with every rule on, receipts in `docs/size-selection-2026-10-29/`:

| | SIZE-SELECTION-1 | SIZE-SELECTION-2 |
| --- | --- | --- |
| Mosskip births | 43 | 25 |
| Mosskip heritability slope | 0.79 | 0.83 |
| Mosskip selection differential (log size) | −0.003 | −0.0004 |
| Births in other species | 0–2 | 0–2 |
| Mean adult size change, any species | within about ±3% | within about ±3% |
| Standing variation (s.d. of log size) | about 0.02 | about 0.02 |

What this shows honestly:
- **Heritable:** inherited size responds to parents as designed.
- **Little selection so far:** over 200 game days there is almost no breeding outside mosskip, and the selection differentials are near zero, so size does not measurably evolve.
- **No outcome forced:** standing variation (founders 0.95–1.05×, ±0.03 mutation per allele) is biologically modest. Giants or dwarfs would need many generations of consistent selection. Nothing pushes them.

## Evidence

- `tests/size-evolution.mjs` (new, gated) covers:
  - a 1.3× lineage reading as a larger body, deepening across generations;
  - changes under 12% not counted, and smaller bodies read the other way;
  - parts-only evidence without the rule;
  - real births in a `body-size/2` world with autonomous evolution recording and saving size-aware evidence, with corrupted or mismatched evidence refused;
  - `body-size/1` keeping parts-only evidence;
  - library founders centred on the recorded size and spread, and a real library entry recording its cohort's size.
- The inherited-anatomy, proto-speciation, recognition, autonomous-evolution `/1`–`/3` compatibility, cross-region `/4`, evolved library and founding suites all pass unchanged.

## Species recognition in new games (creator decision, October 29: "Enable it")

`SURVIVAL_OPT_IN` now records `autonomousEvolution` (`autonomous-evolution/4`, cross-region references) for new games, alongside the autonomous populations it requires. Saved worlds keep whatever they recorded.
- **Construction:** it builds and runs on both world types `main.js` creates (the first legacy-generator world and planetary worlds).
- **Cost:** measured sequentially over 40 days of the same world, it adds no measurable time (79 s with recognition against 82–84 s without).
- **Biology:** in 60-day soaks it left seed 1 identical (148 alive, 25 births), and seeds 2 and 3 within spread (130/8 and 156/2).
- **Browser:** a headless new game records it and runs with no page errors.

The recognition gates and thresholds are unchanged. A new species is recognised only when real inherited divergence, of parts or now size, meets them.

## Not yet

- **Longer fields.** Seeing natural size change will take runs of years, not days, and more breeding species. The tool is ready for them.
- **Size-dependent mate choice.** Mate preferences already include log body mass, which carries size. Mating feasibility between very different sizes is a later step.
