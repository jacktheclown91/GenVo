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
We compare two gameplay arms across 40 biological days (Full Year 1 + Year 2 Spring) on matched seeds under the full realistic survival stack (`dayClock: true`, `metabolism: true`, `foodProperties: true`, `tissueWater: true`, `winterWater: true`, `escapeLanding: true`, `tissueEnergy: true`, `perennialRegrowth: true`, `worldGenerator: 'planetary/1'`).

### Benchmark Methodology (2026-10-24 Verification Update — Zero Test Shortcuts)
Following the October 24 audit, `tools/probe-player-preparation.mjs` was updated to eliminate all test-only shortcuts:
- **Zero direct state or coordinate manipulation:** Neither arm ever modifies `child.x`, `child.y`, `child.energy`, `child.hydration`, or directly calls internal physiology helpers (`motherWarmth`, `transferMilk`).
- **Both arms run under manual player control (`sim.setPlayerAutonomy(false)`):** Both arms use only player-accessible movement/combat inputs (`input.x`, `input.y`, `input.brace`, `sim.playerStrike()`) and supported gameplay actions (`sim.resourceAvailability('eat'|'drink')`, `sim.resourceAction('eat'|'drink')`, `sim.courtship.start()`, `sim.shelter.constructOrRepair()`, `sim.shelter.reinforceRoof()`, `sim.shelter.cacheFood()`, `sim.setFamilyDirective('stay'|'hide'|'follow')`, and `sim.tendSpecificYoung(child)` when within normal interaction reach `<= 2.15` tiles).

1. **Arm A — Unprepared Wanderer (Manual):**
   - Controlled manually (`sim.setPlayerAutonomy(false)`), wandering across the valley and reacting only to immediate moment-to-moment hunger (`energy < 55`), thirst (`hydration < 58`), and imminent predator threats (`distance < 6.5`) without establishing a core territory, building or reinforcing a shelter, caching autumn food, or tending offspring.
2. **Arm B — Prepared Survivalist (Manual):**
   - **Habitat & Territory (Days 1–4):** Remains near its founding core range to establish territorial familiarity (`total >= 2.5`) and courts a nearby compatible mate via `sim.courtship.start(mate)`.
   - **Shelter Construction & Weatherproofing (Days 4–24):** Builds a shelter in the established core territory (`sim.shelter.constructOrRepair()`) and reinforces its roof weather seal (`sim.shelter.reinforceRoof()`, raising `weatherSeal` up to `0.77–0.95` and reducing winter thermal demand by up to 62%).
   - **Autumn Food Caching (Days 16–24):** Harvests local plant surpluses and caches `28.0` food units into `shelter.foodStore` (`sim.shelter.cacheFood()`) before winter dormancy.
   - **Legitimate Family Care:** Sets family directives (`sim.setFamilyDirective('stay')` at the shelter or `'hide'` during danger, and `'follow'` if a juvenile drifts beyond 4 tiles) and physically walks to hungry/cold juveniles to tend them via `sim.tendSpecificYoung(child)` within normal interaction reach (`<= 2.15` tiles).
   - **Winter Sanctuary & Snow Hydration (Days 25–32):** Retreats to the insulated shelter during winter, draws from cached food reserves when hungry, and eats local snow (`sim.resourceAction('drink')`) when open water freezes.
   - **Active Combat Defense:** Faces charging Stalkers with frontal brace (`input.brace = true`) and strikes during recovery/counter windows (`sim.playerStrike()`).

### Results (Day 40 / Year 2 Spring — Manual Arms, Zero Shortcuts)

| Seed | Arm | Alive | Final Health | Min Health | Final Energy | Final Water | Min Water | Young Alive | Shelter Seal | Peak Cache |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `GENVO8-TEST-A` | **Unprepared Wanderer (Manual)** | **NO (Died)** | **0** | **25** | 0.00 | 0.00 | 0.00 | 0 / 0 | 0.00 | 0.0 |
| `GENVO8-TEST-A` | **Prepared Survivalist (Manual)** | **YES** | **100** | **93** | **0.55** | **0.82** | **0.41** | **4 / 4** | **0.77** | **28.0** |
| `PLANET-OBS-2` | **Unprepared Wanderer (Manual)** | **NO (Died)** | **0** | **29** | 0.00 | 0.00 | 0.00 | 0 / 0 | 0.00 | 0.0 |
| `PLANET-OBS-2` | **Prepared Survivalist (Manual)** | **YES** | **100** | **100** | **0.85** | **0.68** | **0.42** | 0 / 0 | **0.95** | **28.0** |
| `PLANET-OBS-3` | **Unprepared Wanderer (Manual)** | YES | 78 | 25 | 0.56 | 0.61 | 0.05 | 0 / 0 | 0.00 | 0.0 |
| `PLANET-OBS-3` | **Prepared Survivalist (Manual)** | **YES** | **87** | **74** | **0.85** | **0.88** | **0.41** | **4 / 4** | **0.90** | **28.0** |

---

## 4. Exported-Browser Winter Survival Session (`tools/verify-winter-survival-browser.mjs`)
To verify that an ordinary player can execute the full seasonal preparation and winter survival loop in the exported public web build (`node tools/export-public.mjs`) using only real browser UI/keyboard controls (`W/A/S/D`, `C`, `N`, `F`, `Digit4`, `J`, `Space`, `E`, `Shift+E`, `P`), `tools/verify-winter-survival-browser.mjs` drives a headless Chromium session from the Main Menu (`/?day=30`) through Winter (`Day 26`) on `GENVO8-TEST-A`:

- **Evidence & Screenshots:** `docs/test-runs/winter-survival-browser-2026-10-24/` (`receipt.json`, `01-shelter-reinforced.png`, `02-caching-and-offspring-care.png`, `03-combat-brace-and-strike.png`, `04-winter-snow-hydration.png`, `05-winter-save-continue-restored.png`).
- **Verified Player Milestones (`receipt.json`):**
  - **Courtship (`KeyC`):** Conceived on Day 4 (`tickCount: 765`, `manualControl: true`) and raised `3` living offspring through Day 18+.
  - **Shelter Construction & Weatherproofing (`KeyN`):** Constructed family shelter (`id: 1`, `integrity: 100`) and reinforced roof weather seal to `0.78` on Day 4.
  - **Autumn Food Caching (`KeyF`) & Family Care (`Digit4` / `KeyE`):** Cached `13.8 / 28` food units in the family shelter and set family directive `'home'` (`Stay at shelter`) with `3` living children.
  - **Active Combat (`KeyJ` / `Space`):** Verified frontal brace stance (`bracing: true`, `bracingDuringHold: true`) and strike execution.
  - **Winter Snow Hydration (`Shift+KeyE`):** On Day 26 (`WINTER`), walked to inland snow (`48.5, 45.5`), confirmed HUD hint `E · Eat snow · melts for water (costs food)`, and pressed `Shift+KeyE`:
    - `hydration`: `95.38` → `99.76` (`+4.38`)
    - `energy`: `83.63` → `83.49` (`-0.14` thermal melting cost)
    - `snowpack[5808]`: `0.00876` → `0` (finite snowpack debited)
    - `lastPlayerAction`: `{type: 'drink', actorId: 109, snow: true, breakIce: false, tick: 6008}`
  - **Native Pause → Save & Continue (`KeyP`):** Saved at `tickCount: 6012` (`Day 26, WINTER`), reloaded `/`, clicked `Continue`, and verified `exactMatch: true` across seed, day, season, tick, player ID, survival rules, and shelter state.
- **Core Bug Uncovered & Resolved (`src/world/planetary-dispersal.js` & `src/world/planet-regions.js`):**
  - During multi-season regional replay, `takeEmigrants(sim)` removed emigrating animals from `sim.animals` without calling `compactRegionalTravelerPositions`, which could leave `regionalTravelerSlot > sim.animals.length` when wildlife dispersed out of a region with a remembered traveler slot. `takeEmigrants` now calls `compactRegionalTravelerPositions(sim, a => leaving.has(a))`, preserving exact traveler-slot invariants across regional dispersal.
