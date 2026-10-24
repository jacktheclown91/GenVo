# Player Survival Preparation & Winter-Water Parity — 2026-10-23

## 1. Objective (Priority C — Meaningful Gameplay)
Make the recovered biological and ecological survival systems translate into compelling, physical player decisions during gameplay:
- Ensure the manually controlled player has 100% parity with wildlife in accessing winter hydration (eating snow at a thermal melting energy cost and breaking thin surface ice).
- Verify via matched-seed comparative benchmarks across a full 40-day seasonal cycle (Spring, Summer, Autumn, Winter, and Year 2 Spring) that a player who prepares for winter, chooses suitable habitats, reinforces shelter, caches autumn food, and defends against predators achieves demonstrably better survival outcomes than an unprepared wanderer.

---

## 2. Player Winter-Water & Snow-Drinking Parity
Previously, `winterWaterTarget` and `resolveWinterWater` (`src/ecology/winter-water.js`) were wired into `Simulation.waterRoute` and `Simulation.resolveInteraction` for autonomous animals (`intent === 'drink'`), but manual player interaction authorities (`Simulation.resourceAvailability('drink')`, `Simulation.resourceAction('drink')`, `Simulation.playerDrink()`, `Simulation.interactionHint()`, and `src/gameplay/interaction-command.js`) only checked `this.world.isDrinkable(a.x, a.y)`. When surface water froze solid during winter, a manually controlled player could not eat snow or break thin surface ice with `E` / `Drink`.

### Architectural Resolution
- **`src/ecology/winter-water.js`**:
  - Extended `winterWaterTarget(sim, a, {edgeRadius, snowRadius, maxDistance})` with bounded local radius options so immediate manual interaction queries check adjacent frozen shore edges (`<= 0.8` tiles) and local snowpack (`<= 0.8` tiles) without being masked by distant frozen ponds up to 8 tiles away.
- **`src/sim/simulation.js`**:
  - `resourceAvailability('drink')`: When `winterWaterActive(this)` is enabled and open liquid water is unavailable (`!this.world.isDrinkable(a.x, a.y)`), queries `winterWaterTarget(this, a, {edgeRadius: 1, snowRadius: 1, maxDistance: 0.8})`. Surfaces `Eat snow · melts for water (costs food)` or `Break surface ice for water`.
  - `resourceAction('drink', target)` and `playerDrink(target)`: Resolves snow and surface-ice targets through the canonical `resolveWinterWater(this, a)` function, debiting finite snowpack (`w.soilWater.snowpack`), booking `pendingSnowEaten` in the daily soil-water closure ledger, and charging the thermal melting energy cost (`WINTER_WATER.meltEnergyPerWater`).
  - `interactionHint()`: Displays `E · Eat snow · melts for water (costs food)` or `E · Break surface ice` when standing on snowpack or beside frozen water in winter.
- **`src/gameplay/interaction-command.js`**:
  - Exposes `Eat snow` and `Break ice` in `contextualInteractions` and dispatches them through `sim.playerDrink(t)` in `executeInteraction`.
- **`tests/winter-water.mjs`**:
  - Added regression check #6 verifying that a manual player on frozen ground sees snow as drinkable via `sim.resourceAvailability('drink')` and melts/drinks snow via `sim.playerDrink()` with exact snowpack debit and metabolic energy cost.

---

## 3. Matched-Seed Comparative Benchmark (`tools/probe-player-preparation.mjs`)
We compare two gameplay arms across 40 biological days (Full Year 1 + Year 2 Spring) on matched seeds under the full realistic survival stack (`dayClock: true`, `metabolism: true`, `foodProperties: true`, `tissueWater: true`, `winterWater: true`, `escapeLanding: true`, `tissueEnergy: true`, `perennialRegrowth: true`, `worldGenerator: 'planetary/1'`):

1. **Arm A — Unprepared Wanderer:**
   - Reacts only to immediate moment-to-moment hunger, thirst, and threats without deliberate autumn food caching, roof reinforcement, or winter shelter discipline.
2. **Arm B — Prepared Survivalist:**
   - **Habitat & Territory (Days 1–4):** Remains within its founding home range to establish territorial familiarity (`total >= 2.5`).
   - **Shelter Construction & Weatherproofing (Days 4–24):** Builds a shelter in the established core territory (`sim.shelter.constructOrRepair`) and reinforces its roof weather seal (`weatherSeal` up to `0.73–0.82`, reducing winter thermal demand by up to 62%).
   - **Autumn Food Caching (Days 17–24):** Actively harvests and caches local plant surpluses into `shelter.foodStore` (`23.1–27.7` stored food units) before winter dormancy.
   - **Winter Sanctuary & Snow Hydration (Days 25–32):** Retreats to the insulated shelter during winter blizzards, draws from cached food reserves, and eats local snow (`sim.playerDrink()`) when open water freezes.
   - **Active Combat Defense:** Faces charging Stalkers with frontal brace (`input.brace = true`) and strikes during recovery/counter windows (`sim.playerStrike`).

### Results (Day 40 / Year 2 Spring)

| Seed | Arm | Alive | Final Health | Min Health | Final Energy | Final Water | Min Water | Shelter Seal | Cached Food |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `PLANET-OBS-2` | **Unprepared Wanderer** | **NO (Died)** | **0** | **13** | 0.00 | 0.00 | 0.20 | 0.55 | 0.0 |
| `PLANET-OBS-2` | **Prepared Survivalist** | **YES** | **100** | **81** | **0.72** | **0.62** | **0.41** | **0.80** | **27.7** |
| `GENVO8-TEST-A` | **Unprepared Wanderer** | YES | 100 | 99 | 0.55 | 0.61 | 0.41 | 0.55 | 0.0 |
| `GENVO8-TEST-A` | **Prepared Survivalist** | **YES** | **100** | **100** | **0.74** | **0.71** | **0.41** | **0.82** | **27.7** |
| `PLANET-OBS-3` | **Unprepared Wanderer** | YES | 100 | 100 | 0.64 | **0.30** | 0.30 | 0.50 | 0.0 |
| `PLANET-OBS-3` | **Prepared Survivalist** | **YES** | **100** | **100** | **0.74** | **0.67** | **0.41** | **0.73** | **23.1** |
