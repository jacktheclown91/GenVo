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

## Next steps

1. **Behaviour under real needs**, the same rules for every organism:
   - seek water and food by days of reserve left, not by fixed fractions;
   - herd alarm flights end once the danger has passed, instead of cascading through the day.
2. **Intake capacity: the food-property stage.** Each food's own bite size and handling, and water from juicy food. It is measured on its own, but it is now the binding constraint on whether real needs can be met.
3. Then compare 360-day populations and the survival strategies (passive, prepared, reckless; winter), and only then make the new rules the default.
