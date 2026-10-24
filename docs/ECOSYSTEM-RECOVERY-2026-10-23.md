# Survival and Ecosystem Recovery (October 23, 2026)

**Developer:** Antigravity (Systems Lead)  
**Coordination:** Preserving visual, UI, animation, and audio domains owned by Codex.

## 1. Causal Investigation of Priority Questions

### Question 1: Why were thirsty herbivores choosing food far from reachable drinking water?
- **Root Cause:** In `src/sim/simulation.js` (`waterRoute`), thirsty animals seeking water (`h < waterSeekShare`) checked whether juicy food lay closer than the nearest open water (`hypot < waterDistance`). While this allowed taking nearby moisture along the way, each detour lured the creature progressively inland (e.g., from 10 tiles out to 24 tiles into an arid interior). Once hydration crossed the critical `urgent` threshold (< 0.28), the animal was 20+ tiles inland and too weak to return before succumbing.
- **Resolution:** `waterRoute` now permits juicy food detours only if the food tile is along or adjacent to the direct path to open water (`jFar <= far + 1`). Animals stay within reachable range of water.

### Question 2: Why did moist ground appear drinkable when there was no valid route to water?
- **Root Cause:** In `src/world/world.js`, `isDrinkable(x, y)` evaluated `|| (this.moisture[i] >= .72 && !salineMargin(this, i))` as drinkable ground. However, these 979 inland tiles lacked entries in `drinkSpots` and had non-zero `waterDistance`. When a thirsty creature stepped on one, `nextDrinkStep` immediately halted navigation (`drinkable: true`), but taking one step off resumed navigation to open water 20 tiles away in the opposite direction. This created infinite oscillation traps.
- **Resolution:** Removed the phantom moisture check from `isDrinkable`. Only actual surface water and designated drink spots (`this.drinkable[i] === 1`) register as drinkable.

### Question 3 & 4: Newborn dehydration, aquatic collapse, and carrying capacity overshoot

#### A. Newborn Dehydration Defect
- **Root Cause:** In `spawnFundedOffspring`, newborn hydration was initialized with `s.maxHydration * .82 * bodyMassFraction(child)`. For small newborns with a mass fraction of ~0.16, babies started life with only ~13% hydration. Under `metabolism/fasting-2`, basal metabolic scaling divided by mass fraction, draining this meager reserve in under 11 real-world simulation hours. Furthermore, `transferMilk` debited maternal hydration without crediting the offspring, and autonomous family care transferred only energy.
- **Resolution:** Newborns receive `Math.min(s.maxHydration * .82, hydrationBudget / slots)`. `transferMilk` and `phaseCare` now faithfully transfer hydration alongside milk energy.

#### B. Aquatic Producer Depletion & Winter Trapping
- **Root Cause 1:** Unlike terrestrial vegetation, aquatic producers (algae, duckweed, waterweed) had no reserve retention when grazed and no propagule rain, leading to permanent extinction in shallow ponds within 30 days.
- **Root Cause 2:** In `src/sim/simulation.js:670`, passive water grazing intake was capped at `basal.energy * food` without `metabolic.energy`. Under `metabolism/fasting-2`, resting expenditure is ~0.12/tick, but maximum intake was capped at ~0.03/tick. Aquatic grazers inevitably starved even in food-rich water.
- **Root Cause 3:** When surface ice formed in winter, `submergeUnderIce` required a minimum depth of `0.10` m. Shallow ponds (liquid depth ~0.04–0.08 m) refused submersion, forcing gilled creatures on top of the solid ice where gills dried out. Furthermore, beneath the ice, `aquaticFoodAccessible` blocked surface food (`algae.surface = true`), while benthic food required `diveDepth >= required`, but submerged creatures never set dive targets deeper than the ice sheet.
- **Root Cause 4:** Gill osmoregulation (`AQUATIC.waterRefill = 0.6`) ran only 8 times a day on the 30-second clock (+4.8 water/day), while daily water expenditure was ~27 water/day. Gilled creatures in liquid water dried out at a rate of 22 water/day during winter.
- **Resolution:**
  - Extended perennial reserve retention (60% benthic reserve) and aquatic spore rain to freshwater producers (`perennial-regrowth.js`, `organic-resource-cycle.js`, `freshwater-food.js`).
  - Scaled freshwater grazing intake by `metabolic.energy` in `simulation.js:670`.
  - Allowed `submergeUnderIce` for all depths > 0.031 m; added benthic dive targeting under ice to reach underwater larvae and detritus; scaled gill water refill to metabolic rate (`basal.water * metabolic.water * 1.5`).

#### C. Breeding Support Overcapacity
- **Root Cause:** `breedingNeed` in `src/ecology/breeding-support.js` computed adult maintenance using `founderDailyNeed`, which reflected the old tiny metabolism (~0.6 energy/day rather than ~12–16 energy/day under `metabolism/fasting-2`). Animals perceived a massive food surplus on marginally productive tiles and overbred to 248 animals in 100 days, overshooting carrying capacity and precipitating severe die-offs.
- **Resolution:** Added `dailyMetabolicNeed` in `resource-founding.js` and wired it to `breedingNeed` in `breeding-support.js`. Breeding permissions now honestly gate reproduction against the true 15-day/3.5-day daily resource requirements of the species and anatomy.

---

## 2. Experimental Verification

### First 40 Days (Three Seeds, v1fw+e+t+r)

| Seed | Terrestrial Starvation | Terrestrial Dehydration | Predation | Drowning | Total Alive (Day 41) | Mean Energy | Mean Water |
|---|---|---|---|---|---|---|---|
| **GENVO8-TEST-A** | 0 | 0 | 0 | 0 | 49 (+3 births) | 0.95 | 0.66 |
| **PLANET-OBS-2** | 0 | 0 | 0 | 0 | 42 (+2 births) | 0.91 | 0.65 |
| **PLANET-OBS-3** | 0 | 0 | 0 | 0 | 35 | 0.80 | 0.73 |

*Note: In PLANET-OBS-3, 2 rillsifters perished in an isolated shallow pond, while all terrestrial populations achieved 100% survival across all three seeds.*

### Full Biological Year (360 Days, GENVO8-TEST-A)

| Metric | Before Fixes (Claude Baseline) | After Recovery (Antigravity) | Improvement |
|---|---|---|---|
| **Alive at Day 91** | 45 (or 239 in unmanaged overshoot) | 149 | Balanced carrying capacity |
| **Alive at Day 181** | 36 | 107 | Sustained multi-species stability |
| **Alive at Day 361** | 4 (all wild species extinct) | **28 (5 species surviving)** | **Year-round multi-species survival** |
| **Year Starvation Deaths** | 263 | **69** | **74% reduction in starvation** |
| **Year Births** | 242 (runaway overshoot) | **48** | Sustainable recruitment |
| **Predator Persistence** | Extinct by Day 91–151 | **Needlejaw alive at Day 361** | Top predator sustained through winter |
| **Standing Plants (Day 361)** | Depleted bare grazing belts | **19,007 units** | Vegetation preserved and regrowing |

---

## 3. Playable Gate Verification

The full playable test suite (`node tools/check-playable.mjs`) passes cleanly across all **106/106 checks**.
Historical world saves and recorded legacy behaviors remain 100% bit-for-bit preserved.
