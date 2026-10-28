# Regional founding needs drinking water — `regional-founding-templates/2`

This follows the [neighbour-region collapse diagnosis](NEIGHBOUR-REGION-COLLAPSE-2026-10-28.md). Founded neighbour regions had no open water. Founding checked food and thermal load but not drinking water, so founded drinkers died of thirst within about 45 days.

## Rule

`regional-founding-templates/2` keeps the `/1` habitat, food, thermal, role and placement measures unchanged and adds one requirement. A land template is measured and founded only at sample sites with open fresh water reachable on foot within the existing founding range: the world's own `waterDistance` from the site is at most `FOUNDING_RANGE` (12 steps). Water-dwelling templates are founded in water, as before.

When no measured site reaches water, the template is recorded as absent with the reason `no drinking water within reach`. Juicy food and snow are not counted as year-round supply. In the diagnosed waterless regions they kept `/1` founders alive for about 35–45 days only.

## Policy and compatibility

- **New games.** `SURVIVAL_OPT_IN` in `src/main.js` (shared file, one option) now records `/2` on new planetary worlds. Regions entered later inherit the world's rule through the existing rule copy, and receipts and founder provenance record the policy actually used.
- **Existing worlds.** The constructor default stays `/1` (`regionalFounding: true`), and saved worlds keep their recorded rule. So every existing save, bundled scenario and frozen fixture world founds exactly as before. Non-planetary worlds never record a founding rule.
- **Validation.** Both policies are accepted, a founder whose policy disagrees with its region's receipt is rejected, and an unknown policy is rejected by the constructor and by founding.

## Evidence

`tests/regional-founding-water.mjs` (new, gated, Node 22 and 24) uses real crossings through manual control at an approved frontier. It checks:

- the waterless neighbour of `POPULATION-FOUNDING-PROBE-1`, which has 0 water cells, gets no land founders under `/2`, against 56 under `/1`, and its receipt records why;
- the watered neighbour of `PLANET-B0-A` gets 70 founders, with every land site within 12 steps of drinking water and every aquatic site in water;
- the rule is inherited by new regions, saved, restored and validated, and founding is deterministic.

`tests/regional-founding.mjs` now names the `/1` default it was always testing (`REGIONAL_FOUNDING.legacy`), with every assertion kept. The `/1`–`/3` autonomous-evolution controls, modernization fixtures, interleaved clocks and the regional suites pass unchanged.

## Field effect

The same 120-day out-and-back fields were re-run under `/2` (`regional-evolution-fields-2026-10-28/founding-water/`), with all other options and the itinerary unchanged. Restore and six-tick continuation are exact.

| Seed | Neighbour animals at day 30 / 60 / 120 | Neighbour dehydration deaths by day 120 |
|---|---|---|
| 0, `/1` | 64 / 7 / 22 | 77 |
| 0, `/2` | 3 / 7 / 20 | 0 |
| 1, `/1` | 58 / 4 / 12 | 72 |
| 1, `/2` | 5 / 24 / 34 | 2 |

Under `/2` the waterless neighbour starts with no founders. It is occupied only by animals that actually disperse there, and the mass die-off is gone. The home valley stays within the same range as under `/1`: 115 and 108 animals at day 120, against 117 and 110.

The full local playable gate passes 151 of 151; no budget or assertion was relaxed.

## Not addressed

- **Geography.** Most regions still have no surface water, because geography produces only ocean, coarse macro rivers and closed-basin lakes. Regional streams, ponds and springs remain a creator-level decision ([options](NEIGHBOUR-REGION-COLLAPSE-2026-10-28.md)).
- **The player.** The player's creature still enters waterless regions with only food water and snow, and this change does not alter that.
- **Dispersal.** Long-run persistence of animals that disperse into waterless regions has not been measured beyond 120 days.
