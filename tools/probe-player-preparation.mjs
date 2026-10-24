import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';

// Converts a desired (dx, dy) heading into standard player keyboard input (W/A/S/D + Shift + J).
function dirToInput(dx, dy, sprint = false, brace = false) {
  const input = {sprint, brace};
  if (dx < -0.1) input.left = true;
  else if (dx > 0.1) input.right = true;
  if (dy < -0.1) input.up = true;
  else if (dy > 0.1) input.down = true;
  return input;
}

// Player-accessible KeyC action (matches src/main.js KeyC handler).
function pressCourtKey(sim) {
  if (!sim.reproduction.selectedMate()) sim.reproduction.refreshSelection();
  return sim.reproduction.courtSelected();
}

// Player-accessible thirst resolution: drinks water/snow/ice (Shift+E) or eats juicy plant (E) at waterRoute.
function handlePlayerThirst(sim, p) {
  if (sim.resourceAvailability('drink').enabled) {
    sim.playerDrink();
    return null;
  }
  const wr = sim.waterRoute(p);
  if (!wr) return null;
  if (wr.kind && Math.hypot(wr.x - p.x, wr.y - p.y) <= 1.15 && sim.resourceAvailability('eat').enabled) {
    sim.playerEat();
    return null;
  }
  return dirToInput(wr.x - p.x, wr.y - p.y);
}

export function simulateArm(seed, isPrepared) {
  const sim = new Simulation(seed, {
    player: true,
    dayClock: true,
    metabolism: true,
    foodProperties: true,
    tissueWater: true,
    winterWater: true,
    escapeLanding: true,
    tissueEnergy: true,
    perennialRegrowth: true,
    worldGenerator: 'planetary/1'
  });

  // Both arms run under manual player control (no AUTO handicap and no direct state edits).
  sim.setPlayerAutonomy(false);

  let minE = Infinity, minW = Infinity, minH = 100, peakFoodStore = 0;
  let wanderAngle = 0;

  for (let d = 1; d <= 40; d++) {
    for (let t = 0; t < CFG.dayTicks; t++) {
      const p = sim.player();
      if (!p?.alive) {
        sim.update(null);
        continue;
      }

      const spec = SPECIES[p.species];
      const energyRatio = p.energy / spec.maxEnergy;
      const waterRatio = p.hydration / spec.maxHydration;
      const season = sim.season; // HUD-visible season ('SPRING', 'SUMMER', 'AUTUMN', 'WINTER')
      const threat = sim.predator.playerStatus(p);
      const expectingOffspring = !!p.pregnant || sim.animals.some(a => a.alive && a.pregnant?.fatherId === p.id);
      let input = null;

      if (!isPrepared) {
        // =========================================================================
        // ARM A: Unprepared Wanderer (Manual Controls Only)
        // Reacts to immediate hunger, thirst, courtship, and danger, but wanders
        // without anchoring a territory, weatherproofing a shelter, caching autumn
        // food, or sheltering/tending young in winter.
        // =========================================================================
        if (threat && threat.distance < 7.5) {
          input = dirToInput(p.x - threat.x, p.y - threat.y, true, false);
        } else if (sim.reproduction.courtTargetId && energyRatio >= 0.45 && waterRatio >= 0.40) {
          input = {};
        } else if (waterRatio < 0.55) {
          input = handlePlayerThirst(sim, p);
        } else if (energyRatio < 0.55) {
          if (sim.resourceAvailability('eat').enabled) {
            sim.playerEat();
          } else {
            const food = sim.playerFoodTarget(p) || sim.bestFood(p);
            if (food) input = dirToInput(food.x - p.x, food.y - p.y);
          }
        } else if (!expectingOffspring && p.reproCooldown <= 0 && energyRatio >= 0.65 && waterRatio >= 0.55 && sim.tickCount >= CFG.lifeStride) {
          if (pressCourtKey(sim)) {
            input = {};
          } else {
            if (t % (CFG.simHz * 4) === 0) wanderAngle += 0.9;
            input = dirToInput(Math.cos(wanderAngle), Math.sin(wanderAngle));
          }
        } else {
          if (t % (CFG.simHz * 4) === 0) wanderAngle += 0.9;
          input = dirToInput(Math.cos(wanderAngle), Math.sin(wanderAngle));
        }
      } else {
        // =========================================================================
        // ARM B: Prepared Survivalist (Manual Controls Only)
        // Uses strictly player-accessible controls: W/A/S/D, J (brace), Space (strike),
        // E (interact/eat/tend), Shift+E (drink/snow), C (court), N (build/reinforce),
        // F (cache food), and Digit4 (family directive: HOME).
        // =========================================================================
        const shelter = sim.shelter.nearest(p, {radius: 18, familyOnly: true});
        const priorityCare = sim.family.priorityChild(p);

        // Family directive: command independent family members HOME in Autumn/Winter (Digit4)
        if ((season === 'AUTUMN' || season === 'WINTER') && sim.familyDirectives.mode !== 'home') {
          sim.familyDirectives.setByIndex(3);
        } else if (season === 'SPRING' && sim.familyDirectives.mode !== 'auto') {
          sim.familyDirectives.setByIndex(0);
        }

        // 1. COMBAT DEFENSE: Frontal brace (J) against charging predators, counterbite (Space) in opening
        if (threat && threat.distance < 7.5) {
          const hunter = sim.animals.find(a => a.id === threat.hunterId);
          if (threat.phase === 'charge') {
            input = dirToInput(threat.x - p.x, threat.y - p.y, false, true);
          } else if (threat.counterWindow && threat.distance <= 1.6) {
            sim.playerStrike(hunter);
          } else if (shelter) {
            input = dirToInput(shelter.x - p.x, shelter.y - p.y, true);
          } else {
            input = dirToInput(p.x - threat.x, p.y - threat.y, true);
          }
        }
        // 2. ONGOING COURTSHIP: Let active courtship display finish unless urgent need intervenes
        else if (sim.reproduction.courtTargetId && energyRatio >= 0.45 && waterRatio >= 0.40) {
          input = {};
        }
        // 3. IMMEDIATE THIRST: Drink liquid water, winter snow/ice (Shift+E), or juicy plant (E)
        else if (waterRatio < (season === 'WINTER' ? 0.72 : 0.62)) {
          input = handlePlayerThirst(sim, p);
        }
        // 4. IMMEDIATE HUNGER: Forage when calories fall below threshold (E)
        else if (energyRatio < (d <= 6 && !expectingOffspring ? 0.66 : 0.55)) {
          if (sim.resourceAvailability('eat').enabled) {
            sim.playerEat();
          } else {
            const food = sim.playerFoodTarget(p) || sim.bestFood(p);
            if (food) input = dirToInput(food.x - p.x, food.y - p.y);
          }
        }
        // 5. LEGITIMATE OFFSPRING CARE: Walk to dependent young and press E ('care')
        else if (priorityCare && (priorityCare.urgent || priorityCare.separated)) {
          const child = priorityCare.child;
          if (priorityCare.distance > 1.55) {
            input = dirToInput(child.x - p.x, child.y - p.y);
          } else {
            sim.playerInteract({kind: 'creature', id: child.id, x: child.x, y: child.y}, 'care');
          }
        }
        // 6. SHELTER CONSTRUCTION (KeyN): Build in established home range
        else if (!shelter && sim.territory.state(p)?.established && sim.territory.state(p)?.home) {
          const home = sim.territory.state(p).home;
          const distHome = Math.hypot(p.x - home.x, p.y - home.y);
          if (distHome > 1.0) {
            input = dirToInput(home.x - p.x, home.y - p.y);
          } else if (sim.shelter.canBuildHere(p).ok) {
            sim.shelter.constructOrRepair(p);
          } else {
            const food = sim.playerFoodTarget(p) || sim.bestFood(p);
            if (food) input = dirToInput(food.x - p.x, food.y - p.y);
          }
        }
        // 7. COURTSHIP & REPRODUCTION (KeyC): Court eligible partner when well-fed
        else if (!expectingOffspring && p.reproCooldown <= 0 && energyRatio >= 0.65 && waterRatio >= 0.55 && sim.tickCount >= CFG.lifeStride && pressCourtKey(sim)) {
          input = {};
        }
        // 8. WINTER SANCTUARY: Stay inside the weatherproofed shelter during Winter
        else if (season === 'WINTER' && shelter) {
          const dist = Math.hypot(p.x - shelter.x, p.y - shelter.y);
          if (dist > 1.2) {
            input = dirToInput(shelter.x - p.x, shelter.y - p.y);
          }
        }
        // 9. AUTUMN/LATE-SUMMER FOOD CACHING (KeyF): Stockpile winter food reserves in shelter
        else if ((season === 'AUTUMN' || (season === 'SUMMER' && shelter.weatherSeal >= 0.80)) && shelter && shelter.foodStore < shelter.capacity - 2) {
          const dist = Math.hypot(p.x - shelter.x, p.y - shelter.y);
          if (dist > 1.5) {
            input = dirToInput(shelter.x - p.x, shelter.y - p.y);
          } else if (t % (CFG.simHz * 2) === 0) {
            sim.shelter.cacheNearbyFood(p);
          }
        }
        // 10. ROOF REINFORCEMENT (KeyN): Weatherproof shelter before Winter
        else if (shelter && shelter.weatherSeal < 0.85 && energyRatio > 0.55) {
          const dist = Math.hypot(p.x - shelter.x, p.y - shelter.y);
          if (dist > 1.5) {
            input = dirToInput(shelter.x - p.x, shelter.y - p.y);
          } else {
            sim.shelter.constructOrRepair(p, shelter.id);
          }
        }
        // 11. TERRITORY ANCHORING: Stay near home center and top up reserves
        else if (energyRatio < 0.85) {
          if (sim.resourceAvailability('eat').enabled) {
            sim.playerEat();
          } else {
            const food = sim.playerFoodTarget(p) || sim.bestFood(p);
            if (food && Math.hypot(food.x - p.x, food.y - p.y) <= 6) {
              input = dirToInput(food.x - p.x, food.y - p.y);
            }
          }
        }
      }

      sim.update(input);

      const cur = sim.player();
      if (cur?.alive) {
        if (cur.energy < minE) minE = cur.energy;
        if (cur.hydration < minW) minW = cur.hydration;
        if (cur.health < minH) minH = cur.health;
      } else if (cur && !cur.alive) {
        minH = 0;
      }
      const activeShelter = sim.shelter.activeShelters()[0];
      if (activeShelter && activeShelter.foodStore > peakFoodStore) {
        peakFoodStore = activeShelter.foodStore;
      }
    }
  }

  const p = sim.player();
  const children = sim.animals.filter(a => a.parentIds?.includes(sim.playerId));
  const livingChildren = children.filter(a => a.alive);
  const shelters = sim.shelter.activeShelters();
  const s = shelters[0] || null;

  return {
    arm: isPrepared ? 'Prepared Survivalist (Manual)' : 'Unprepared Wanderer (Manual)',
    seed,
    playerAlive: !!p?.alive,
    playerHealth: p?.alive ? Math.round(p.health) : 0,
    playerEnergy: p?.alive ? +(p.energy / SPECIES.genvo.maxEnergy).toFixed(2) : 0,
    playerWater: p?.alive ? +(p.hydration / SPECIES.genvo.maxHydration).toFixed(2) : 0,
    minHealth: Math.round(minH),
    minEnergy: Number.isFinite(minE) ? +(minE / SPECIES.genvo.maxEnergy).toFixed(2) : 0,
    minWater: Number.isFinite(minW) ? +(minW / SPECIES.genvo.maxHydration).toFixed(2) : 0,
    childrenTotal: children.length,
    childrenLiving: livingChildren.length,
    shelterIntegrity: s ? Math.round(s.integrity) : 0,
    shelterWeatherSeal: s ? +s.weatherSeal.toFixed(2) : 0,
    peakFoodStore: +peakFoodStore.toFixed(1),
    shelterFoodStore: s ? +s.foodStore.toFixed(1) : 0
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  for (const seed of ['GENVO8-TEST-A', 'PLANET-OBS-2', 'PLANET-OBS-3']) {
    console.log(`\n========================================\nMatched Seed: ${seed}\n========================================`);
    const resA = simulateArm(seed, false);
    console.log('Result A (Wanderer):', JSON.stringify(resA));
    const resB = simulateArm(seed, true);
    console.log('Result B (Prepared):', JSON.stringify(resB));
  }
}
