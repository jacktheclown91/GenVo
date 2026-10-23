# Real daily needs: metabolism stage (October 23, 2026)

**Creator decisions:**
- A healthy resting adult starves in about 14–21 days and dies of thirst in about 3–5 days, faster with exertion, heat, cold, injury and reproduction.
- Penalties start before death.
- Shared physiology for every organism.
- Food properties come as a separate, measured stage.

## What was built

`src/ecology/metabolism-policy.js`, policy `metabolism/fasting-1`, saved with each world. It is opt-in with `?day=30`, together with 30-second days.

- **Resting costs.** A species' reference adult has its full reserves calibrated to last 15 days of food and 3.5 days of water at rest.
  - It is a per-species multiplier on the existing resting costs.
  - Everything that already shaped those costs still does: body size and anatomy, inherited metabolism, cold and heat, aridity, sleep and torpor, young exposure.
  - Travel, exertion, reproduction and healing keep their own costs on top.
- **Failure once reserves run out.**

  | Reserve at zero | Fatal within | Health lost per biological step |
  |---|---|---|
  | Food | about 3 days | 4.2 (was 1.1) |
  | Water | about 1 day | 12.5 (was 1.55) |

- **Penalties before death, for every organism:**
  - **Weak:** below 25% energy or 20% water, movement slows, down to 80% when empty.
  - **Tired:** below 40% energy or 35% water, the controlled creature's breath recovers more slowly, down to half.
  - **Already present:** healing slows with poor nourishment (`healing-review.js`) and breeding is gated by condition.
- **Recorded worlds** keep the old physiology exactly: the multipliers are 1 and the damages 1.1 and 1.55.

## Evidence

**Gate:** 100 of 100 checks pass, so recorded worlds are unchanged.

- **`tests/metabolism-policy.mjs`** (gate). It measures the physiology on its own, refilling one resource to isolate the other:
  - From 90% reserves in comfortable conditions, a resting adult **starves in 16.3 days** and **dies of thirst in 3.6 days**.
  - Weak bodies are slower and recover breath more slowly; wildlife follows the same rule.
  - Saves keep the rules, and recorded worlds keep the old physiology.
- **Idle creature, no input** (`tools/probe-survival.mjs idle 40 … v1`, [data](metabolism-2026-10-23/idle-v1.json)): it dies of thirst, or to a predator when dry, on day 4 on all three seeds, with 64–71% of its food left.

## What it exposes

With the player's creature on AUTO under the new needs ([data](metabolism-2026-10-23/auto-v1.json)), the controlled creature died within 4–15 days on all three seeds:
- thirst on day 4;
- starvation on day 15;
- predation while starving on day 13.

In each case its family died out.

`tools/probe-daily-intake.mjs` shows why. The creature has neither the time nor the intake rate to meet real needs:
- **Water.** It loses about 35 water a day and seeks water only below 28%, which is now under a day of reserve. Each sip gives 5.2. On one seed it spent half of every day on "drink" for two days and gained nothing.
- **Alarm flights.** About a third of each day (70–95 ticks) went to fleeing herd alarms. These cascade whenever a predator patrols near the herd, which on the 30-second clock happens many more times per day.
- **Food.** Feeding yields about 1 energy per decision step. Daily needs are about 14, of which roughly 8 is resting and 6 is travel.

These are calibration problems in behaviour and intake, which were all sized for the old, tiny needs. They are not reasons to loosen the needs.

## Stage 2: behaviour under real needs (creator decision)

Every rule below applies on metabolism-policy worlds only, the same for every organism.

- **Seek water by days.** An animal seeks water when about 2 days of it are left at its own resting rate, which depends on body size, anatomy and heat.
- **Top up opportunistically.** At drinkable water, an animal below 90% drinks.
- **Sips scale with the body.** One sip is 10% of maximum water, about 11.4 for a GenVo instead of 5.2. A day's water then takes minutes, not most of the day.
- **Stale drinking places are skipped.** The world's list of drinking places is built at creation, and banks can later turn salty or freeze, so only places still drinkable count. A thirsty animal with no known fresh water searches by holding one heading 12–20 tiles out, instead of resting or circling.
- **Alarm flights end when danger passes.** A herd flees together only from a predator that looks dangerous now (hunting and facing, or too close to judge), the same appraisal an animal already made alone. Before, a resting or passing predator set the whole herd running.

**Found while tracing:**
- **No fresh water on PLANET-OBS-2.** All 750 drinkable cells in the region turn salty within the first day. Under real needs that world cannot be lived in on fresh water.
- **Water-distance field and drinkability disagree.** The field can read 0 (water adjacent) on a bank where drinking is not allowed, and then gives no step toward water.

**Measured with the player's creature on AUTO, 64 days, three seeds** ([data](metabolism-2026-10-23/v1e-auto.json)): it still died of thirst, around days 27–36 on two seeds and on day 4 on PLANET-OBS-2.

**360 days** ([data](metabolism-2026-10-23/pop-v1-behaviour.json), an earlier snapshot without the larger sips): the whole ecosystem died out by day 61.

| Cause of death | Count |
|---|---|
| Starvation | 98 |
| Predation | 59 |
| Drowning | 24 |
| Dehydration | 18 |

## Stage 3: food properties (creator decision)

`food-properties/1` in `src/ecology/physiology.js`, saved with each world.

- **Food's own properties.** Every organism eats each food's own bite size and handling and gets water from juicy food: marshroot 9, bramble 5, rotcap 3, sunmoss 1, seed kernels 0. This was previously a global switch; it is now a per-world policy.
- **Juicy food as water.** A thirsty animal now takes water from the nearer of fresh water (by the water-distance field) and the nearest juicy plant patch within 8 tiles.

**Measured with the player's creature on AUTO, 64 days, three seeds** ([data](metabolism-2026-10-23/v1g-auto.json)): it survived on every seed.

| Seed | Deaths | Lineage alive at day 64 |
|---|---|---|
| PLANET-OBS-3 | founder to predation, day 22; an heir took over | 3 |
| PLANET-OBS-2 | founder drowned, day 42; an heir took over | 3 |
| GENVO8-TEST-A | none | 3 |

Daily lows were 31–49% energy and 20–34% water: real pressure, not comfort.

**Wild herbivores** (`tools/probe-wild-intake.mjs`): before the nearest-source rule they spent 120–240 ticks a day walking to water and starved within a week. With it, mosskip and podshell hold steady at 96–98% energy, and mirelick still declines slowly.

**360 days** ([before the nearest-source rule](metabolism-2026-10-23/pop-v1f.json), [with it](metabolism-2026-10-23/pop-v1f2.json)): the ecosystem still collapses.

| | Before the rule | With the rule |
|---|---|---|
| Wildlife | died out in the first month | died out in the first month |
| GenVo by day 181 | 71 (24 by day 361) | 0 |
| Main causes of death | starvation 98, predation 52 | dehydration 63 in the first month, starvation 37, predation 53 |

The deaths fall on animals without a juicy-plant diet: hunters can only drink, and fresh water on these worlds is sparse and can turn salty.

**Recorded worlds are unchanged** by all three stages. The day-clock, metabolism and food tests pass. The world-story and reaction-expression outputs are identical from `96d9f96` (before the clock) to `9ab4adc` (metabolism) when run on worktrees at each commit.

**An open question outside these stages:** those two tests already differed from their first runs at `96d9f96`. Something between `423ead1` and `96d9f96` changed recorded-world outcomes; not yet traced.

## Next steps

1. **Behaviour under real needs**, the same rules for every organism:
   - seek water and food by days of reserve left, not by fixed fractions;
   - herd alarm flights end once the danger has passed, instead of cascading through the day.
2. **Intake capacity: the food-property stage.** Each food's own bite size and handling, and water from juicy food. It is measured on its own, but it is now the binding constraint on whether real needs can be met.
3. Then compare 360-day populations and the survival strategies (passive, prepared, reckless; winter), and only then make the new rules the default.
