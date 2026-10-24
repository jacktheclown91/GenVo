# Wildfire and thunderstorm day-clock correction (October 23, 2026)

**Defect:** Under the 30-second day clock (`day-clock/30s`), wildfire spread, fuel consumption, and convective lightning ignition were executing on fixed tick cadences rather than per biological day.

## The observed defect on PLANET-OBS-3 (Day 90)

A 30-second day runs 240 ticks per day compared to 48 ticks on the legacy 6-second clock (a 5× ratio). Because weather and fire evaluated per tick:
- **Lightning strikes:** `lightningProposal` evaluated every 16 ticks. In 90 days, 1,350 proposals were evaluated on 30s days vs 270 on 6s days, inflating lightning strikes from 1 to 8.
- **Fire spread:** `advanceWildfire` evaluated spread every 8 ticks (30 times per day vs 6 times per day), testing neighbor ignition 5× more frequently per biological day.
- **Biomass burn rate:** `WILDFIRE.burnPerSecond * dt * dry` burned for 30 real seconds per biological day instead of 6 real seconds per biological day (5× more biomass consumed per day), while plants only grow once per day.
- **Result:** Burned biomass exploded from 6,048 to 21,759, and surviving standing plants collapsed from 20,217 to 2,762.

## The correction

1. **Thunderstorms (`src/ecology/thunderstorms.js`):**
   - Lightning proposal interval scales to biological days via `thunderstormInterval(sim)`:
     `Math.round(THUNDERSTORMS.interval * (dayTicks / LEGACY_DAY_TICKS))`.
     On 6s days: 16 ticks (3 proposals/day).
     On 30s days: 80 ticks (3 proposals/day).
   - Diurnal evaluation slots match: slot `d * 3 + k` evaluates the exact same convective window with identical RNG coordinates.
   - Saves validate with the world's interval.

2. **Wildfire (`src/ecology/wildfire.js`):**
   - Spread interval scales via `wildfireSpreadInterval(sim)`:
     `Math.round(WILDFIRE.spreadInterval * (dayTicks / LEGACY_DAY_TICKS))`.
     On 6s days: 8 ticks (6 spread checks/day).
     On 30s days: 40 ticks (6 spread checks/day).
   - Coordinate noise step scales with `Math.round(sim.tickCount * clockScale) + i`, ensuring identical spatial spread rolls across the biological day.
   - Consumption scales by `clockScale = LEGACY_DAY_TICKS / dayTicks`:
     Daily biomass burned per tile per biological day is identical between 6s and 30s.
   - Animal fire damage (`12 * danger * dt`) remains in real-time seconds (`dt = 1/8 s`) so players and animals retain their physical reaction and escape window.

3. **Recorded worlds:**
   - On 48-tick worlds (`dayTicksFor(sim) === 48`), `clockScale === 1`, `spreadInterval === 8`, and `thunderstormInterval === 16`.
   - All legacy code paths, outputs, and save validations are 100% bit-for-bit identical.

## Evidence: 90 days on PLANET-OBS-3

| Measure | 6-second clock | 30-second before fix | 30-second after fix |
|---|---|---|---|
| Lightning strikes | 1 | 8 | 1 |
| Ignitions (Day 75) | 524 | 14,013 | 524 |
| Ignitions (Day 90) | 4,179 | 14,763 | 4,178 |
| Biomass burned (Day 75) | 303 | 19,515 | 302 |
| Biomass burned (Day 90) | 6,048 | 21,759 | 5,946 |
| Standing plants (Day 75) | 24,649 | 5,091 | 24,377 |
| Standing plants (Day 90) | 20,217 | 2,762 | 20,019 |

## Verification

- `tests/wildfire.mjs`: PASS
- `tests/thunderstorms.mjs`: PASS
- `tests/day-clock.mjs`: PASS (added checks for lightning proposal and wildfire spread intervals and clock scaling)
