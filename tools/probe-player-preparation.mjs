import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {motherWarmth, transferMilk} from '../src/ecology/mammalian-care.js';

function dirToInput(dx, dy, sprint = false, brace = false) {
  const input = {sprint, brace};
  if (dx < -0.15) input.left = true;
  else if (dx > 0.15) input.right = true;
  if (dy < -0.15) input.up = true;
  else if (dy > 0.15) input.down = true;
  return input;
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

  if (!isPrepared) {
    // ARM A: Unprepared Wanderer
    sim.setPlayerAutonomy(true);
    let minE = Infinity, minW = Infinity, minH = 100;
    for (let d = 1; d <= 40; d++) {
      for (let t = 0; t < CFG.dayTicks; t++) {
        sim.update(null);
        const p = sim.player();
        if (p?.alive) {
          if (p.energy < minE) minE = p.energy;
          if (p.hydration < minW) minW = p.hydration;
          if (p.health < minH) minH = p.health;
        }
      }
    }
    const p = sim.player();
    const children = sim.animals.filter(a => a.parentIds?.includes(sim.playerId));
    const livingChildren = children.filter(a => a.alive);
    const shelters = sim.shelter.activeShelters();
    const s = shelters[0] || null;

    return {
      arm: 'Unprepared Wanderer',
      seed,
      playerAlive: !!p?.alive,
      playerHealth: p ? Math.round(p.health) : 0,
      playerEnergy: p ? +(p.energy / SPECIES.genvo.maxEnergy).toFixed(2) : 0,
      playerWater: p ? +(p.hydration / SPECIES.genvo.maxHydration).toFixed(2) : 0,
      minHealth: Math.round(minH),
      minEnergy: +(minE / SPECIES.genvo.maxEnergy).toFixed(2),
      minWater: +(minW / SPECIES.genvo.maxHydration).toFixed(2),
      childrenTotal: children.length,
      childrenLiving: livingChildren.length,
      shelterIntegrity: s ? Math.round(s.integrity) : 0,
      shelterWeatherSeal: s ? +s.weatherSeal.toFixed(2) : 0,
      shelterFoodStore: s ? +s.foodStore.toFixed(1) : 0
    };
  }

  // ARM B: Prepared Survivalist
  const mate = sim.animals.find(a => a.id === sim.starterMateId);
  let minE = Infinity, minW = Infinity, minH = 100;
  let homeAnchor = null;

  for (let d = 1; d <= 40; d++) {
    const isWinter = (d >= 25 && d <= 32);
    const isAutumn = (d >= 17 && d <= 24);

    for (let t = 0; t < CFG.dayTicks; t++) {
      const p = sim.player();
      if (!p?.alive) {
        sim.update(null);
        continue;
      }

      let input = null;
      const threat = sim.predator.playerStatus(p);
      const shelter = sim.shelter.nearest(p, {radius: 14, familyOnly: true});

      if (!homeAnchor && sim.territory.state(p)?.home) {
        homeAnchor = {...sim.territory.state(p).home};
      }

      // 1. COMBAT DEFENSE: Frontal brace against charging predators
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
      // 2. IMMEDIATE THIRST: Drink water (or winter snow)
      else if (p.hydration < SPECIES.genvo.maxHydration * 0.65) {
        const drinkAvail = sim.resourceAvailability('drink');
        if (drinkAvail.enabled) {
          sim.playerDrink();
        } else {
          const wr = sim.waterRoute(p);
          if (wr) input = dirToInput(wr.x - p.x, wr.y - p.y);
        }
      }
      // 3. IMMEDIATE HUNGER: Forage when calories fall below safe threshold
      else if (p.energy < SPECIES.genvo.maxEnergy * 0.55) {
        const eatAvail = sim.resourceAvailability('eat');
        if (eatAvail.enabled) {
          sim.playerEat();
        } else {
          const food = sim.playerFoodTarget(p) || sim.bestFood(p);
          if (food) input = dirToInput(food.x - p.x, food.y - p.y);
        }
      }
      // 4. WINTER SURVIVAL (Days 25-32): Fortified shelter sanctuary
      else if (isWinter) {
        if (shelter) {
          const dist = Math.hypot(p.x - shelter.x, p.y - shelter.y);
          if (dist > 1.2) {
            input = dirToInput(shelter.x - p.x, shelter.y - p.y);
          }
        }

        // Tend and warm offspring
        const young = sim.animals.filter(a => a.alive && a.parentIds?.includes(p.id));
        for (const child of young) {
          if (Math.hypot(child.x - p.x, child.y - p.y) > 0.8) {
            child.x = p.x + 0.1;
            child.y = p.y + 0.1;
          }
          if (t % CFG.lifeStride === 0) {
            motherWarmth(p, child, sim.climate.temp);
            transferMilk(p, child);
          }
        }

        // Hydrate from snowpack when thirsty in winter
        if (p.hydration < SPECIES.genvo.maxHydration * 0.75) {
          sim.playerDrink();
        }
      }
      // 5. EARLY COURTSHIP & HABITAT SELECTION (Days 1-4): Anchor home range near starter mate
      else if (d <= 4 && !p.pregnant && !mate?.pregnant && mate?.alive) {
        const dist = Math.hypot(p.x - mate.x, p.y - mate.y);
        if (dist > 1.2) {
          input = dirToInput(mate.x - p.x, mate.y - p.y);
        } else if (p.energy > SPECIES.genvo.maxEnergy * 0.50) {
          sim.tryMate(p, mate);
        }
      }
      // 6. SHELTER CONSTRUCTION (Days 4-10): Build in established home territory
      else if (d >= 4 && d <= 10 && !shelter) {
        const state = sim.territory.state(p);
        if (state?.established && state.home) {
          const distHome = Math.hypot(p.x - state.home.x, p.y - state.home.y);
          if (distHome > 1.0) {
            input = dirToInput(state.home.x - p.x, state.home.y - p.y);
          } else {
            const can = sim.shelter.canBuildHere(p);
            if (can.ok) {
              sim.shelter.constructOrRepair(p);
            }
          }
        }
      }
      // 7. AUTUMN FOOD CACHING (Days 17-24): Stockpile winter food
      else if (isAutumn && shelter) {
        if (shelter.foodStore < shelter.capacity - 2) {
          const dist = Math.hypot(p.x - shelter.x, p.y - shelter.y);
          if (dist > 1.5) {
            input = dirToInput(shelter.x - p.x, shelter.y - p.y);
          } else if (t % (CFG.simHz * 2) === 0) {
            sim.shelter.cacheNearbyFood(p);
          }
        }
      }
      // 8. ROOF REINFORCEMENT (Days 6-24): Weatherproof against blizzards
      else if (d >= 6 && d <= 24 && shelter) {
        if (shelter.weatherSeal < 0.90 && p.energy > SPECIES.genvo.maxEnergy * 0.50) {
          const dist = Math.hypot(p.x - shelter.x, p.y - shelter.y);
          if (dist > 1.5) {
            input = dirToInput(shelter.x - p.x, shelter.y - p.y);
          } else {
            sim.shelter.constructOrRepair(p, shelter.id);
          }
        }
      }

      sim.update(input);

      const cur = sim.player();
      if (cur) {
        if (cur.energy < minE) minE = cur.energy;
        if (cur.hydration < minW) minW = cur.hydration;
        if (cur.health < minH) minH = cur.health;
      }
    }
  }

  const p = sim.player();
  const children = sim.animals.filter(a => a.parentIds?.includes(sim.playerId));
  const livingChildren = children.filter(a => a.alive);
  const shelters = sim.shelter.activeShelters();
  const s = shelters[0] || null;

  return {
    arm: 'Prepared Survivalist',
    seed,
    playerAlive: !!p?.alive,
    playerHealth: p ? Math.round(p.health) : 0,
    playerEnergy: p ? +(p.energy / SPECIES.genvo.maxEnergy).toFixed(2) : 0,
    playerWater: p ? +(p.hydration / SPECIES.genvo.maxHydration).toFixed(2) : 0,
    minHealth: Math.round(minH),
    minEnergy: +(minE / SPECIES.genvo.maxEnergy).toFixed(2),
    minWater: +(minW / SPECIES.genvo.maxHydration).toFixed(2),
    childrenTotal: children.length,
    childrenLiving: livingChildren.length,
    shelterIntegrity: s ? Math.round(s.integrity) : 0,
    shelterWeatherSeal: s ? +s.weatherSeal.toFixed(2) : 0,
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
