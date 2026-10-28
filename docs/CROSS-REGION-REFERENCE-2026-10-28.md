# Cross-region related references — `autonomous-evolution/4`

This is prospective, opt-in work toward cross-region recognition. It does not complete regional recognition, establish natural species emergence or enable autonomous evolution in new worlds; the default stays off. It continues the next steps listed in [regional pressure observations](REGIONAL-PRESSURE-OBSERVATIONS-2026-10-28.md).

## Problem

`referenceForAutonomousPopulation` searched only the evaluating region's own populations. When a population's recorded ancestral, source or parent population lived in another region, the search fell back to the nearest same-species local population. Differential and separation were then measured against a reference the record does not support, or not at all.

## Published policies stay exact

`/3` is now frozen first. `tests/autonomous-evolution-v3-compatibility.mjs` compares against complete-world references recorded only from untouched `629ad29a`, the commit that published `/3` (src tree SHA-256 `58f859b2…`). The world uses ordinary AUTO with an actual birth and a regional pressure observation, and both Node 22.23.4 and 24.14.0 are covered. It checks:

- the exact 5,760-tick signature;
- value-exact restoration;
- the exact signature after six continued ticks.

A restored Simulation assigns its own fields in a different order from a constructed one. That was already true at the source and is not a value change, so restoration is compared by value. The `/1` and `/2` controls, unflagged modernization fixtures and policy-compatibility references all still pass. Loading never adopts a later policy.

## `/4`

- **Policies.** `AUTONOMOUS_EVOLUTION` is now `{policy:'/4', observed:'/3', regional:'/2', legacy:'/1'}`. `autonomousEvolution: true` selects `/4` for new explicit experiments. Both `/3` and `/4` record and validate the bounded pressure observations; only `/4` resolves foreign references.
- **Reference resolution** (`evolution-tree.js`, read-only helper `regional-reference.js`). The recorded chain is unchanged: recognized-parent or ancestor origin, then source, then recorded parents.
  - A key signed for this region (`natural:<originX>,<originY>:n`), and every non-natural key, resolves exactly as in `/3`.
  - A key signed for another region resolves to that region's *established* population, placed in this region's frame through both origins.
  - If that evidence is unavailable, the reference is unknown (null). It is never the nearest unrelated local population.
  - Populations without foreign recorded keys, including every single-region world, behave exactly as `/3`.
- **Differential** (`proto-speciation.js`). Against a foreign reference, both pressure profiles come from the latest biological day both histories actually observed: the `/3` buffer plus each current day. With no common day it is unknown. The original five-day and score gates and all recognition thresholds are unchanged.
- **Separation** (`speciation.js`, unchanged code) now measures across the actual border, because the foreign reference is placed in local coordinates.
- **Evidence sources.**
  - The active world reads its resident regions' published snapshots.
  - An archived region replayed in a resident stride receives, like its dispersal context, the active world's live population memory and every other resident region's published snapshot. That context is frozen, never saved, and cleared after the stride.
  - Stored (unloaded) replay, like dispersal, has no neighbour context, so its foreign references are unknown.

Availability can therefore delay recognition. It can never create one from substituted or misaligned evidence. No population, ancestry, resource, reproductive, RNG or player-lineage rule changes, and no threshold was changed.

## Evidence

`tests/autonomous-cross-region-reference.mjs` (new, gated, Node 22 and 24) runs on a real controlled two-region `/4` world: one real crossing, region `128,0` active, `0,0` archived. Its population records and pressure histories are controlled fixtures built from the real record fields and observation helpers. They test resolution only, never natural qualification. It checks:

- signed-key parsing and foreign detection;
- day alignment against a lagging region, and unknown with no shared day;
- that the remote parent is chosen over a nearer unrelated local population;
- cross-border separation;
- an aligned differential whose deltas favour the population that actually met more pressure;
- unchanged `/3` behaviour on the same world;
- unknown when the remote record or a shared day is missing;
- that unestablished remote populations are excluded;
- replay-context contents, frame placement, non-persistence and clearing.

All autonomous, evolution, recognition, population and regional suites pass with `true` now meaning `/4`. `tests/autonomous-soil-engineering.mjs` (ungated) fails identically on untouched `main` and is unchanged. The full local playable gate passes 150 of 150; no budget or assertion was relaxed. The canonical source audit (including the authority registry), the architecture gate and its adversarial test, and the public export pass.

## Remaining

- Natural final-source fields with `/4` across preselected seeds, retaining zero-recognition outcomes, to see whether real migrations produce foreign recorded references and qualifying aligned differentials.
- Stored-replay evidence for unloaded neighbours, read through the bounded regional reader, if fields show it matters.
- Global tree consistency after cross-region recognition, verified with real recognition events, extinction and save continuation, before any default activation.
