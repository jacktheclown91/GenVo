# GenVo8 — Modular reproductive anatomy (development slice)

**Creative design direction:** human creator, 12 October 2026. **Implementation:** AI-assisted extensions to one canonical source. **Status:** the mounted egg-chamber and external egg lifecycle are working, with a subsequent first slice of paid nest building, parental tending and wild-hunter predation. An optional live-womb organ now enables expensive dual capability when mounted alongside the egg chamber; see `DUAL_MODE_REPRODUCTIVE_EVOLUTION.md`. These development passes are not stable-release acceptance.

## Canonical rules

The **mounted physical body plan**, not the species name or learned behavior, determines whether a pregnant creature produces live young or lays eggs. The `egg-chamber` flank organ selects egg mode. Creatures without the organ retain legacy live birth for compatibility with existing save files and species. Mode freezes at conception using the actual pregnant parent's anatomy. A newborn can inherit the egg organ through existing physical crossover and later lose it through breeding or editing.

A part takes a real flank socket and uses the same mutation-cost, mass, and upkeep metadata as other anatomy. The egg chamber costs 5 mutation points and carries above-average mass/upkeep. The existing `brood-pouch` is **not** an egg organ; it remains a separate care/carrying trait. No parallel biological part or renderer catalog is introduced.

## Egg life cycle

1. Real mating and reciprocal choice remain authoritative. At conception, the mother's physical part plan determines live or egg mode and the clutch is planned and funded through `birth-investment.js`.
2. Egg-bearing gestation completes at the regular species interval. Rather than spawning children, the mother deposits **physical eggs** into the world. Egg clutches can be 3–5, with the larger total expense and finite shared parental reserves creating a tradeoff. Egg creation is **not** counted as a live birth.
3. Each egg records the frozen maternal and paternal conception snapshots, location, incubation days, viability, energy and hydration reserves. Each is a physical entity drawn on the terrain, not an instant-birth animation or hidden queue.
4. Incubation takes nine in-game days. Submersion, cold/heat extremes and severe dryness degrade viability. Eggs may perish before hatching. There is no forced success/failure probability and no need to maintain a certain population.
5. Hatchlings use the **same** simulation newborn-authority method as live births: normal genetics, body inheritance, lineage/care records, and biological resource caps. The live parent need not survive. World population capacity delays hatching rather than silently deleting a paid viable egg.
6. Eggs and their state persist in current-schema saves via the simulation's core record. Old current-schema saves with no egg records get an empty array and continue working.

## Scope boundaries and needed follow-ups

- An optional live-womb organ now enables **dual choice**, but a single pregnancy still follows exactly one committed route (egg or live). See `DUAL_MODE_REPRODUCTIVE_EVOLUTION.md`.
- Eggs have environmental viability plus the first finite local-material nest, costed parent care, and wild-hunter egg attacks. No egg transport, species-specific nests, detailed heat-care behavior, or authored animation yet; see `EGG_NEST_CARE_AND_PREDATION.md`.
- Eggs currently share finite parent-contributed energy and no more than 30% of the laying parent's hydration. Longer-run tuning will be evidence-led and must allow world-by-world extinction and divergence, not prescribe population outcomes.
- The egg art is procedural and deliberately simple; 32px authored visual refinement and dedicated sound are subsequent presentation passes.
- Existing artificial family/observer assumptions based on gestation and live birth need eventual dual-mode-aware expansion, but are not loosened to make ecological seeds converge.

## Verification boundary

The dedicated `tests/reproductive-anatomy-eggs.mjs` covers mounted-part mode detection, real egg laying, birth counting, save/restore, parent mortality before hatching, environmental loss and legacy live-mode loading. Regression selection, source audit, source/web parity and archive integrity are recorded in the development report. These are **feature-correctness** checks, not full ecological-balance acceptance.
