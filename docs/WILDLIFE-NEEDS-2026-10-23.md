# First-month wildlife collapse under real needs (October 23, 2026)

**Creator request:** investigate the first-month wildlife collapse under real needs (pre-winter thirst behaviour, predation and starvation) as one measured step.

**Rules compared:**
- **Real needs (v1fw):** 30-second days, real needs, food properties and winter water.
- **Old physiology (30s):** the 30-second clock with the old physiology, the comparison case.

**Seed:** GENVO8-TEST-A unless stated otherwise. Every death in the first 40 days was recorded with its cause, the animal's reserves and recent behaviour, and for predation the hunter (`tools/probe-first-month.mjs`).

## What the first 40 days look like

| Rules | Predation | Drowning | Starvation | Thirst | Alive at day 41 (of 195) |
|---|---|---|---|---|---|
| Old physiology, before corrections | 19 | 15 | 9 | 0 | 197 |
| Real needs | 78 | 26 | 30 | 32 | 45 |

## Three defects found and corrected

### 1. Escape jumps into water: new policy `escape-landing/1`, opt-in

**What happened:** all 26 drownings were mosskips that cannot swim, fleeing on an escape jump. A wild animal escaping by jump launched straight away from the threat whatever lay there (`simulation.js`). Mosskips drinking at a bank leapt over the river and fell in. This happened on old physiology too (15); thirst simply kept mosskips at the shore more.

**Correction:** `src/ecology/escape-landing.js`.
- Of the directions leading away from the threat (within 90 degrees, nearest first), the animal takes the first whose landing point at its own jump range is ground it could stand on.
- If no direction is safe, it runs instead of jumping.
- Swimmers may land in water.
- The policy is saved with the world and copied on crossings. Recorded worlds keep the old jump.

### 2. A hungry animal was held in place by the rest allowance: correction to `day-clock/30s`

**What happened:**
- Rillsifters starved beside exhausted feeding grounds with full water, "feeding" with no food target for over a day.
- With no food in sight, the hungry branch falls through to the explore fallback. The rest-when-sated allowance (2.2 tiles a day for a rillsifter) held them there.
- The rule says needs are never limited, but the search for food was.

**Correction:** `ambient-allowance.js`. An animal below the 72% reserve at which animals forage is never held by the allowance.

This changes the opt-in 30-second clock (`?day=30`), which no released game path enables.

### 3. Juicy food chosen over a reachable drink when badly dehydrated: correction to `metabolism/fasting-1`

**What happened:**
- Well-fed mosskips and podshells (energy 0.8–0.99) died of thirst 17–58 tiles from water.
- They took a few steps toward the water, then a bramble patch nearer than the water pulled them back (`waterRoute`: juicy food nearer than water is taken first).
- Each bite gave a sliver of water, and hydration fell from 0.30 to −0.5.

**Correction:** `simulation.js waterRoute`. With less than one day of water left (half the water-seeking threshold), a route to open water beats juicy food. Above that, juicy food still comes first.

This changes the opt-in real-needs rules only.

### Measurement switch

`sim.correctionExperiment` is development-only and never set by the game. `{hungrySearch:false}` and `{urgentWater:false}` switch corrections 2 and 3 off for comparison runs, so each correction is measured on the same seed. With both off and escape landing off, the probe reproduces the uncorrected run exactly.

## Evidence

**Tests:** `tests/wildlife-needs.mjs` (gate) checks that:
- an escape jump from a bank lands on ground and still leads away from the threat;
- with no safe landing there is no jump;
- the policy is saved, and recorded worlds keep the old jump;
- a sated animal rests once its allowance is spent, but a hungry one keeps searching;
- below one day of water an animal heads for the water, while with water to spare it takes the juicy food.

**Each correction alone and together, first 40 days, GENVO8-TEST-A** ([data](wildlife-needs-2026-10-23/)):

| Arm | Predation | Drowning | Starvation | Thirst | Alive at day 41 |
|---|---|---|---|---|---|
| No corrections | 78 | 26 | 30 | 32 | 45 |
| Hungry search only | 84 | 20 | 21 | 36 | 52 |
| Urgent water only | 61 | 29 | 29 | 30 | 65 |
| Escape landing only | 61 | 0 | 61 | 34 | 48 |
| All three | 76 | 0 | 62 | 23 | 50 |

**Two more seeds, no corrections against all three, first 40 days:**

| Seed | Arm | Drowning | Thirst | Starvation | Predation | Alive at day 41 |
|---|---|---|---|---|---|---|
| PLANET-OBS-3 | No corrections | 13 | 16 | 44 | 48 | 54 of 188 |
| PLANET-OBS-3 | All three | 0 | 15 | 57 | 47 | 58 of 189 |
| PLANET-OBS-2 | No corrections | 8 | 80 | 30 | 26 | 44 of 190 |
| PLANET-OBS-2 | All three | 3 | 41 | 52 | 39 | 40 of 188 |

**360 days, all corrections** ([data](wildlife-needs-2026-10-23/arm-v1fw-corrected-360d.json)):
- Wild species are gone by about day 181.
- GenVo survives at 45, with 120 births.
- This is close to the uncorrected winter-water arm: 79 GenVo, wildlife gone by day 211, a gap within run-to-run variation on one seed.

## What the evidence shows

**1. Each correction removes the failure it targets.** Drownings fall to zero or near it, and the thirst-oscillation deaths fall.

**2. The total does not improve, because the losses move to other causes.**
- On every seed the population still falls to about a quarter within 40 days, and starvation rises as other causes fall.
- Animals saved from one cause die of another within weeks. That is the signature of a carrying limit, not of a single defect.

**3. Why the land cannot carry the starting animals under real needs:**
- **Energy turnover rose about five-fold** (`tools/probe-energy-budget.mjs`).
  - A mosskip on old physiology spent 0.03–0.04 of its reserve per day.
  - Under real needs it spends about 0.20: resting metabolism 0.12 (heat and cold multiply the comfortable-rest 0.067, as the approved design intends), plus movement.
  - It eats about 0.19, so its margin is thin, and harassment near water tips it into starvation.
- **The 30-second clock itself raises turnover 1.3–1.8× on old physiology,** because need-driven trips (feeding, drinking) repeat per tick rather than per day.
- **Scarce foods are stripped while the staple food stands** (`tools/probe-plant-demand.mjs`).
  - Bramble falls from 2,301 to about 300 and marshroot from 239 to 33.
  - Sunmoss stays above 11,000, and total plant biomass grows from 17,000 to 20,000 over the year.
  - On both clocks freshwater algae regrow once a day. On the 30-second clock they are eaten out (108 to 6 in 24 days, against 112 to 72 on the 6-second clock), so rillsifters die out even on old physiology (none at day 61, against 17 on the 6-second clock).
  - A starving mosskip was traced standing on good sunmoss (0.7 per tile): its intake per bite and time to feed cannot keep pace.
- **Predators now need to eat.**
  - A kill gives a hunter about 3 days of resting food: a prey of about 44% of its body mass yields about 0.2 of its reserve.
  - Hunters hunt only below 72% reserves, so they are not killing for sport.
  - 20 starting hunters therefore need a kill every 3 days or so: 78 kills in 40 days, against 19 when they barely needed food.
  - By body-composition reasoning, prey of that size should feed a resting predator for nearer 9–10 days. Meat energy (34 per unit of mass) was set when needs were tiny.

## Decision needed

The three corrections are genuine defects and are kept; escape landing stays opt-in with the other v1 rules. The remaining collapse is not a single defect. Productivity, prey yield and starting densities were balanced against needs about five times smaller than the approved real needs, and fixing that is a calibration choice the creator should make. Options, each to be measured on matched seeds without tuning toward a population target:

1. **Recalibrate yields to the same physical basis as the new needs:**
   - meat energy per unit of prey mass from body composition;
   - plant and freshwater productivity per day;
   - intake per bite and handling time.

   This is the most faithful option, and the largest.
2. **Make need-driven activity per day rather than per tick on 30-second days,** so the clock does not inflate turnover (the 1.3–1.8× above). It is narrow and principled, and probably needed whatever else is chosen.
3. **Accept a large founding die-off** while the world settles to what it can carry, and judge stability after it. GenVo already survives and grows.
4. **Start new worlds at densities the land carries under real needs.** This touches world founding.

**Still open:**
- Thirst deaths rise in the second winter in two arms (between days 331 and 361).
- A "health" cause of death appears on the other two seeds (15–30 in 40 days).
