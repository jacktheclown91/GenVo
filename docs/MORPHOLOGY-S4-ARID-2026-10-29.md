# Morphological evolution S4 — extreme survival biology (`arid-physiology/1`)

S4 of the creator's morphological-evolution brief is about water conservation, thermal adaptation, dormancy and alternative hydration, with realistic costs. Scenario C: an ordinary water-dependent organism in an extremely dry environment comes under real hydration pressure; an adapted one survives longer through physiology and behaviour; neither receives artificial water.

**Status.** First slice implemented and **on for new games** (`SURVIVAL_OPT_IN`). Saved worlds without `aridPhysiologyRules` are unchanged and bit-identical.

## What existed (inspected first)

- **Dryland anatomy:**
  - wax plates: up to 24% less evaporative water on dry soil, but they trap heat (×1.18);
  - heat frill: sheds heat (×0.72 heat load) but costs more in cold;
  - arid pads, storage sacs, and fat pad or fat tail.
- **Thermal physiology:** thermal load (`thermal-demand.js`), seasonal coats, burrow temperature buffering, cold-season torpor (fat-fuelled), thermal refuges and cold migration.
- **Alternative hydration:** tissue water from prey and carrion (`tissue-water/1`) and plant-meal water. Both are accounted against real stocks, and S1 makes them size-correct.
- **Climate geography.** Temperature is 0.83 − 0.55·|sin latitude| − 0.4·altitude per region, plus the season. The temperate home region (about 35°) runs 0.39–0.63; equatorial regions reach about 1.0 in summer. Within one region, temperature is nearly uniform (p5–p95 spread about 0.002), and there is no day–night temperature cycle.
- **The gap.** Heat raised food use only. Water loss rose with the *global* climate temperature, not with the body's local heat load. So heat refuges, frills, cover and burrows did nothing for water, and deserts were not physically harsher on water.

## Implemented (`ecology/arid-physiology.js`)

**Heat costs water.** Above its comfort temperature a body sheds its heat load partly by evaporation (panting, sweating, wet surfaces). The heat-side thermal load already charged as food now also drives water loss:
- evaporative water per step = the body's own resting water cost × 40 × heat load;
- the heat load carries everything that already shaped it: local or burrow temperature, shelter, fur's heat cost, the frill's dissipation, the wax plates' heat retention, and dormancy exposure;
- size enters through the surface-scaled resting water cost (S1).

Anchor: an exposed founder in an equatorial summer (0.43 above comfort, heat load 0.052) about triples its water turnover. Desert mammals show 2–4×. The temperate home summer adds about a fifth. Nothing creates water.

**Aestivation (drought dormancy).** A second torpor kind on the existing machinery, so it shares predator wake-ups, fire wake-ups and vulnerability (×1.46).
- **Entry:** an adult with fat stores (fat pad or fat tail), hot (0.1 above comfort) or on dry soil (moisture below 0.2), at or below 55% water with at least 45% food. There must be no drinking water within 12 tiles, and the body must be underground or in cover of at least 0.32, with no predator within 5.
- **Effect:** energy ×0.55, water ×0.35, heat exposure ×0.5. Reserves still drain.
- **Wake:** cooler, moister ground (moisture ≥ 0.3), water below 20% or food below 27%, illness or injury, or any predator, fire or movement wake-up.
- **Behaviour:** wildlife chooses it autonomously after the cold-torpor check. The player's torpor toggle offers it when cold torpor is unavailable and aestivation is.
- **Saves:** `torporKind` is saved and validated against the rule. Any wake-up clears it.

**Conditional expression (Codex, read-only).** `aridExpressionOf(sim, animal)` returns:
- `heat`: degrees above comfort;
- `frillFlushed`: a frill in heat;
- `waxSealed`: wax plates on dry soil;
- `aestivating`.

This is the expression state behind the inherited capability. Presentation never writes it.

## Evidence

`tests/arid-physiology.mjs` (new, gated) runs the real metabolism step on a controlled hot (0.98), dry (0.08) and waterless patch:

| Body | Water loss per day | Days to dehydration from half water |
| --- | --- | --- |
| Ordinary, temperate | 1× | — |
| Ordinary, hot | 2.4× temperate | 0.63 |
| Frill and wax plates, hot | 83% of ordinary hot | 0.75 |
| Aestivating in cover, hot | 37% of ordinary hot | 1.25 |

The test also checks:
- no water gained at any step;
- the same hot patch costs only the old heat-blind amount in worlds without the rule;
- dormancy requirements: fat fuel, shelter, drought, need and no water within reach;
- rousing on eased conditions and on low water;
- expression state;
- exact saves, and refusal of inconsistent saves.

60-day new-game soaks with all morphology rules on, day 61:

| Seed | Alive / births | Dehydration deaths |
| --- | --- | --- |
| SOAK-SIZE-1 | 130 / 13 | 1 |
| SOAK-SIZE-2 | 136 / 6 | 2 |
| SOAK-SIZE-3 | 162 / 9 | 4 |

The home region is temperate, so the effect there is modest. These are observations; nothing was tuned.

## Not in this slice

- **Metabolic water.** Oxidation water is already folded into fasting-2's net water endurance. Making it explicit needs a stoichiometric anchor between the game's energy and water units (fat yields about 1.07 g of water per 39 kJ). That waits for the creator's call on the unit anchor.
- **Day–night temperature, and therefore nocturnal activity.** There is no diurnal cycle yet. That belongs with the climate work in S5.
- **New water-conservation parts** (excretory or kidney adaptations, reflective coats). They need reviewed loads and Codex art.
- **Drought migration.** Cold migration exists; a dryness-driven equivalent, using real knowledge of water, is the next behavioural step.

## Next

S5, physically derived regional hydrology (the revised plan's §10), or the remaining S4 items above.
