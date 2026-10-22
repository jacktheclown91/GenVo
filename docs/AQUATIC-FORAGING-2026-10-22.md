# Aquatic foraging — October 22, 2026

New planetary worlds record `aquatic-foraging/1`. It implements fixes 1–3 from the [bankjaw and rillsifter extinction diagnosis](PREDATOR-FILTERER-EXTINCTION-2026-10-22.md). Historical worlds keep their behaviour exactly: with the policy absent, the three matched seeds reproduce the earlier observatory runs to the animal at day 15.

The recalibration of rillsifter's `minForage` is left for the creator and is unchanged.

## What changed (`src/ecology/aquatic-foraging.js`)

1. **Foraging dives.**
   - **Before:** on arriving at an underwater meal (fry, larvae, detritus), wildlife tried to eat immediately, failed because it was not yet deep enough, and dropped the target. With no target, the existing dive rule then surfaced it.
   - **Now:** the meal is kept while the shared diving authority carries the animal down, with finite held air or gills and paid descent. Patience is bounded at 4 seconds, after which the meal is abandoned.
2. **Life under ice.**
   - **Before:** a surfaced body that the sheet couldn't support broke thin ice wherever it sat. A gilled fish therefore kept one open hole and was sealed off from all the water around it.
   - **Now:** a gilled water dweller slips just beneath a forming sheet (depth 0.06, within its real liquid column) before the ice takes its load. It can then move under the ice and reach underwater food.
   - **Limits kept:** surface food stays sealed off. Air-breathers are unchanged. Water frozen too close to the bed for a body to fit beneath stays inaccessible.
3. **Water-dweller forage score.** Breeding forage for a water dweller (`carrying.surveyAt`) is now scored over the water cells it can use. It is no longer diluted by land cells and land plants. Land animals are unchanged.

The policy is recorded in the simulation, saved and validated on restore (unknown values are rejected), and copied on regional travel.

## Verification

- **`tests/aquatic-foraging.mjs`** (in the playable gate):
  - a hungry bankjaw dives to underwater fry and eats it, where current behaviour never does;
  - a gilled rillsifter stays beneath a thin sheet, moves under it, reaches underwater food at depth and is sealed off from surface food;
  - an air-breather is never placed under the ice, and historical worlds keep the old behaviour;
  - only water food is scored for water dwellers, and land animals score identically;
  - exact save, restore and continuation, historical restore and unknown-policy rejection.
- **Mechanism probe** (`PLANET-OBS-2`, 20 days):

  | Measure | Current | Policy |
  |---|---|---|
  | Bankjaw fry meals | 0 | 11 |
  | Bankjaw mean energy | 0.51 | 0.73 |
  | Rillsifter time submerged | 1% | 22% |
  | Rillsifter larvae meals | 7 | 126 |
  | Rillsifter forage score | 1.85 | 2.79 |
  | Rillsifters approved to breed | 0 | 5 of 17 |

- **Matched observatory runs:** seeds OBS-1/2/3, 300 days, policy (`foraging`) against `current`, which is otherwise identical ([datasets and analysis](test-runs/observatory-2026-10-22/aquatic-foraging/)):

  | Seed | Bankjaw last alive (P / C) | Rillsifter last alive (P / C) | Mean hunters (P / C) | Mean population (P / C) | Predation /1000 animal-days (P / C) |
  |---|---|---|---|---|---|
  | OBS-1 | 301 / 243 | 172 / 301 | 9.7 / 7.1 | 212 / 234 | 1.04 / 0.53 |
  | OBS-2 | 259 / 144 | 259 / 259 | 11.6 / 7.7 | 239 / 281 | 0.76 / 0.37 |
  | OBS-3 | 301 / 301 | 196 / 301 | 8.4 / 9.0 | 198 / 250 | 0.84 / 0.48 |

## Interpretation

- **The mechanisms work.** Bankjaw now eats underwater prey, fish live under ice, and water dwellers are scored fairly.
- **Predators persist better.** Bankjaw survived longer in two of three seeds, and the hunter guild (bankjaw and needlejaw) was larger in two of three.
- **Prey pays for it.** Predation per animal-day roughly doubled in all three seeds, falling mainly on mosskip and genvo, and mean population was 10–21% lower. This is the expected trophic consequence of predators that can feed again, not a defect. It is consistent across replicates, but the arms diverge chaotically, so its size is uncertain.
- **Rillsifter is still not rescued.** Starvation deaths were essentially unchanged (16, 16 and 16 with the policy, against 16, 16 and 11 without). Its breeding score rose but stays below `minForage: 4`, so births remain 0–1 per run, and it was lost earlier in two seeds. Its persistence now depends on the pending recalibration decision.
- **Bankjaw still barely breeds** (0–1 births). Its energy now reaches the breeding range, but three or four founders with a skewed sex ratio leave it demographically fragile (diagnosis item 6).

## Limits

- **Small sample:** three seeds, 300 days.
- **Wildfire:** it varied between arms and remains the largest single killer in some seeds.
- **No under-ice breathing logic for air-breathers:** they are unchanged and don't go under ice.
