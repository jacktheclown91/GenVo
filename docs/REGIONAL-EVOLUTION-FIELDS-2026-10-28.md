# Natural two-region evolution fields — `/4` and `/3`

These are natural-field observations of prospective cross-region recognition ([`autonomous-evolution/4`](CROSS-REGION-REFERENCE-2026-10-28.md)). They are not creator acceptance and not a species-emergence claim. No threshold, population, trait or resource was changed or tuned.

## Method

`tools/observe-regional-evolution-field.mjs` uses the normal new-world constructor with the same options as earlier natural fields, plus `autonomousPopulations` and the selected evolution policy. After that, native AUTO and canonical updates only.

- **Itinerary.** It is declared and is the only intervention. The player takes manual control for one controlled east crossing at an approved frontier on day 1 and one west return on day 2, returning to AUTO after each. The crossing authority requires manual control, as it does for a player.
- **Regions.** Afterwards the home valley `0,0` is active and its neighbour `128,0` is a resident canonical region. They advance in synchronized strides with regional dispersal open. Wildlife is never touched.
- **Daily samples.** Each day records every region's demography, its established populations with their recorded parent and source keys, and every population's recognition evidence exactly as the speciation controller recorded it.
- **Persistence.** Each run ends with a strict save, restore and six-tick continuation.

The seeds are the preselected `POPULATION-FOUNDING-PROBE-0` and `-1` used by earlier fields. Each ran 320 days under `/4`, and under `/3` as an attribution control. `tools/summarize-regional-evolution-field.mjs` produced `summary.json`.

## Results

All four fields completed 320 days (Day 321, 76,800 ticks, about an hour each). Terminal restore and six-tick continuation are value-exact in every field. **No population was recognized in any field.**

| Seed | Region | Final animals | Births / deaths | Emigrants | Established populations (end) |
|---|---|---:|---:|---:|---:|
| 0 | `0,0` active | 58 | 81 / 164 | | 3 |
| 0 | `128,0` | 11 | 13 / 121 | 13 | 1 |
| 1 | `0,0` active | 82 | 118 / 158 | | 4 |
| 1 | `128,0` | 1 | 19 / 143 | 29 | 0 (its population lived days 36–288) |

**`/4` and `/3` produce identical worlds** for each seed: the same demography, populations and final states. Recognition evaluation is observational until something is recognized, and nothing was. The only difference is in seed 1's neighbour population:

| Seed 1 `128,0` population | `/3` | `/4` |
|---|---:|---:|
| Distance gate pass rate | 0 | 1.0 |
| Best progress | 0.634 | 0.734 |

**Recognition gate pass rates** (share of daily evaluations, `/4`; `/3` is the same apart from the seed 1 neighbour distance above):

| Seed / region | Evaluations | History | Ecology | Distance | Cohort | Trait | Local pressure | Reproduction | Isolation |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0 / `0,0` | 701 | .96 | 0 | .91 | .90 | 0 | .01 | .30 | .42 |
| 0 / `128,0` | 289 | .97 | 0 | 0 | .89 | 0 | 0 | .17 | .32 |
| 1 / `0,0` | 894 | .96 | .02 | .91 | .94 | 0 | .06 | .52 | .26 |
| 1 / `128,0` | 338 | .95 | 0 | 1.0 | .51 | 0 | 0 | .14 | .33 |

## Natural cross-region ancestry, and why it still did not qualify

In seed 1 the neighbour population `natural:128,0:2` recorded `natural:0,0:1`, the home valley's main population, among its parents. Wildlife had actually dispersed across the border. A rerun of the same `/4` field to day 150 reproduces the full field's day-150 sample exactly. `tools/diagnose-regional-differential.mjs` was then run on the saved world, with the neighbour rebuilt as a replay stride would rebuild it (`day150-differential.jsonl`):

- the reference resolves to the foreign parent `natural:0,0:1`, 125.1 tiles away across the border;
- the archived region lags one day (observed days 147 and 148, against the active region's 148 and 149), so the comparison aligns on day 148;
- the overall pressure contrast is 0.1146, under the unchanged 0.12 score gate. The neighbour population meets much *less* competition than its parent (0.111 against 0.626), and its only higher pressure is dryness (+0.124), under the +0.18 a positive local pressure needs.

So `/4` resolves and aligns real cross-region ancestry as intended, and the ecology gate fails on actual values. Within the home valley, sibling populations face nearly identical pressures (score 0.0185).

## Findings

1. **Inherited anatomical divergence is the dominant block.** The trait gate passed in 0% of all 2,222 evaluations, in both seeds and both regions: no inherited anatomical difference reached the required depth (three generations), share (0.58) and strength. Recognition cannot occur without it, whatever the ecology or geography.
2. **Ecological contrast is close but short.** In the one natural cross-region case it was 0.115 against 0.12, with no positive axis at +0.18.
3. **Neighbour regions decline sharply.** They lose 121–143 animals and end with 1–11. Both home valleys also fall from about 180 to 58–82. Whether that decline is genuine ecology or a defect in founded neighbour templates or offscreen dynamics is not established here; it needs its own investigation.

## Evidence files

- `regional-evolution-fields-2026-10-28/`: the four gzipped field receipts and the day-150 diagnostic receipt, `summary.json`, `day150-differential.jsonl`, and the SHA-256 list of the external snapshots.
- The six terminal and day-150 V8 world snapshots (75–90 MB each) and the run logs are archived outside the repository in `evidence/GenVo-regional-evolution-fields-20261028/`, beside the earlier natural-field evidence.
