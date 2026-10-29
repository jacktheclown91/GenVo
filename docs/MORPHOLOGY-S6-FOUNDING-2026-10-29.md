# Morphological evolution S6 — ecological founding (`regional-founding-templates/3`)

S6 of the creator's brief extends founding so it judges each species' real survival capability rather than universal proximity to freshwater:
- keep the `/2` correction for organisms that need drinking water;
- let a genuinely desert-adapted organism establish without permanent surface water;
- create no resources to make founding succeed;
- preserve old policies and saves.

**Status.** Implemented and **on for new games**: `REGIONAL_FOUNDING.policy` is now `/3`, which `SURVIVAL_OPT_IN` already uses. Recorded `/2` and `/1` worlds keep their founding exactly.

## Rule (`ecology/water-founding.js`, `regional-founding.js`)

A land site qualifies for a template's body when either condition holds:
- **Drinking water** (as `/2`): open fresh water is reachable on foot within the 12-tile founding range.
- **Diet water:** the water its diet supplies covers what its body loses there.

Both sides of the budget are measured on the founding body itself, with the existing authorities:

| Side | What it counts |
| --- | --- |
| **Need** (per day) | Resting water cost (anatomy, inherited size, fasting-2 endurance) × the metabolism step's climate term × the wax plates' dry-soil factor. Under `arid-physiology/1`, plus evaporative cooling of the site's heat load, taken from the daily-mean temperature, since founding is a judgement over days. |
| **Diet** (per day) | Renewable plant regrowth the body's mouth reaches (the founding food measure) × each plant's water per unit of tissue, only where plant-meal water is enabled. Under `tissue-water/1`, plus the body water of the prey tissue it can take. Both count only the share its daily food need requires it to eat. |

Templates that fail both conditions are listed as absent with the reason "neither drinking water within reach nor enough water in its diet". Each founded group's receipt records its water basis: how many sites had drinking water, and the lowest diet ratio.

## What it finds today

- **Where drinking water exists,** `/3` founds exactly what `/2` founds: PLANET-B0-A's east region gives the same 10 groups with the same identities. The receipts now record each group's water basis.
- **In the known waterless neighbour** (POPULATION-FOUNDING-PROBE-1, east, all new-game rules on), every land template's diet water covers only 0.3–2.4% of its loss. Founding introduces no land template, the same outcome as `/2`, but now for a measured physiological reason.

  This is the game's own food data. A body loses about 30 water a day. Plant tissue carries little water per unit of food energy: even a marshroot specialist would get only about a quarter of its need from its food. And renewable regrowth limits intake further. It agrees with `/2`'s field evidence that juicy food kept `/1` founders alive for only 35–45 days.
- **No current anatomy is a desert specialist** by these measures. The rule is the versioned door the brief asks for: a lineage whose diet and conservation genuinely cover its loss (in an evolved library template, or with future water-rich foods or conservation parts) will be founded without surface water, and an ordinary drinker never will.

## Evidence

- `tests/regional-founding-physiology.mjs` (new, gated) covers:
  - identical founders to `/2` where water exists, with a water basis on every land group;
  - the waterless region founding no land template, with its absent reason;
  - a real body's measured budget there (no drinking water, diet below 10% of need, not sustainable);
  - receipt validation and save;
  - recorded policies kept.
- `tests/regional-founding-water.mjs` now names `/2` explicitly as `REGIONAL_FOUNDING.drinking` and still passes unchanged in meaning. `tests/regional-founding.mjs` (`/1`) passes.

## Not yet

- **Seasonal water.** Founding judges the season it happens in. A full-year water budget, from the seasonal plant cycle, would be stricter.
- **Reproductive sustainability** beyond the existing food-supported breeding-group check, such as the water cost of lactation and eggs.
- **Dormancy as a bridge.** Aestivation could carry an adapted body through a dry season. It isn't counted toward the budget yet.
- **Desert specialists** need water-rich foods or stronger conservation anatomy; the parts need Codex art.
