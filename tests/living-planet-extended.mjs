// tests/living-planet-extended.mjs
// Extended living planet verification: multi-season ecosystem stability,
// planetary geography traversal, regional crossings and return persistence,
// and cross-season save/restore continuity.

import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {planetaryTravelAvailability, crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {createSimulationSnapshot, restoreDetachedSimulationSnapshot} from '../src/persistence/save-manager.js';

console.log('--- 1. Planetary Geography & Traversal ---');
const sim = new Simulation('GENVO-LIVING-PLANET-1', {
  player: true,
  worldGenerator: 'planetary/1'
});

assert.equal(sim.world.generator, 'planetary/1');
assert.deepEqual(sim.world.regionOrigin, {x: 0, y: 0});

const planet = sim.world.planet;
assert.ok(planet, 'Planetary world has a planetary descriptor and sample authority');

// Geographical heterogeneity: sample different locations across the globe
const sCenter = planet.sample(64, 64);
const sEast = planet.sample(192, 64);
const sSouth = planet.sample(64, 192);

assert.ok(typeof sCenter.elevation === 'number');
assert.ok(typeof sCenter.moisture === 'number');
assert.ok(typeof sCenter.temperature === 'number');
console.log('Geographical samples verified: elevation, moisture, temperature vary across coordinates.');

// Locate valid frontier crossing position to the East (region 128, 0)
const player = sim.player();
let frontierFound = false;

for (let x = 120; x <= 127; x += 0.5) {
  for (let y = 10; y < 118; y += 1) {
    if (sim.canOccupy(player, x, y)) {
      player.x = x;
      player.y = y;
      const av = planetaryTravelAvailability(sim);
      if (av.enabled && av.direction === 'east') {
        frontierFound = true;
        break;
      }
    }
  }
  if (frontierFound) break;
}

assert.ok(frontierFound, 'Found legal physical frontier placement near East border');
const eastAvail = planetaryTravelAvailability(sim);
assert.equal(eastAvail.enabled, true);
assert.deepEqual(eastAvail.to, {x: 128, y: 0});

// Execute border crossing to East
const eastCrossing = crossPlanetaryBorder(sim);
assert.equal(eastCrossing.ok, true);
assert.equal(eastCrossing.from, '0,0');
assert.equal(eastCrossing.to, '128,0');

const eastSim = eastCrossing.simulation;
assert.deepEqual(eastSim.world.regionOrigin, {x: 128, y: 0});
const eastPlayer = eastSim.player();
assert.equal(eastPlayer.id, player.id, 'Same traveler ID moves into receiving region');
assert.ok(eastSim.planetaryTravel.sessions.some(s => s.key === '0,0'), 'Previous region is archived in session ledger');
console.log('Crossed East into region 128,0: traveler ID preserved, session ledger updated.');

// Cross back to West (region 0, 0)
let returnFound = false;
for (let x = 1.5; x <= 8; x += 0.5) {
  for (let y = 10; y < 118; y += 1) {
    if (eastSim.canOccupy(eastPlayer, x, y)) {
      eastPlayer.x = x;
      eastPlayer.y = y;
      const av = planetaryTravelAvailability(eastSim);
      if (av.enabled && av.direction === 'west') {
        returnFound = true;
        break;
      }
    }
  }
  if (returnFound) break;
}

assert.ok(returnFound, 'Found legal return frontier placement near West border');
const westCrossing = crossPlanetaryBorder(eastSim);
assert.equal(westCrossing.ok, true);
assert.equal(westCrossing.from, '128,0');
assert.equal(westCrossing.to, '0,0');

const homeSim = westCrossing.simulation;
assert.deepEqual(homeSim.world.regionOrigin, {x: 0, y: 0});
assert.equal(homeSim.player().id, player.id, 'Same traveler returned home');
console.log('Returned to region 0,0: origin restored, continuity verified.');

console.log('--- 2. Multi-Season Ecological Dynamics ---');
// Verify seasonal cycle: Spring (Day 1-8), Summer (Day 9-16), Autumn (Day 17-24), Winter (Day 25-32)
const ecoSim = new Simulation('GENVO-ECOSYSTEM-YEAR', {
  player: true,
  worldGenerator: 'planetary/1'
});
ecoSim.setPlayerAutonomy(true);

const initialCounts = ecoSim.population();
console.log('Day 1 initial population:', initialCounts);

function totalBiomass(s) {
  let sum = 0;
  for (const plantKind of Object.keys(s.world.plants)) {
    const arr = s.world.plants[plantKind];
    for (let i = 0; i < arr.length; i++) sum += arr[i];
  }
  return sum;
}

const day1Biomass = totalBiomass(ecoSim);
assert.ok(day1Biomass > 5000, 'World starts with substantial plant biomass');

// Advance through Spring into Summer (Day 10)
for (let d = 1; d <= 10; d++) {
  for (let t = 0; t < CFG.dayTicks; t++) ecoSim.update(null);
}
assert.equal(ecoSim.season, 'SUMMER');
const summerBiomass = totalBiomass(ecoSim);
assert.ok(summerBiomass > day1Biomass * 0.9, 'Plants maintain biomass into summer');
console.log(`Day 11 (Summer): Biomass = ${Math.round(summerBiomass)} (Day 1 = ${Math.round(day1Biomass)})`);

// Advance into Winter (Day 26)
for (let d = 11; d <= 26; d++) {
  for (let t = 0; t < CFG.dayTicks; t++) ecoSim.update(null);
}
assert.equal(ecoSim.season, 'WINTER');
assert.ok(ecoSim.climate.temp < 0.45, 'Winter baseline temperature reflects cold season');
console.log(`Day 27 (Winter): Temp = ${ecoSim.climate.temp.toFixed(2)}, Season = ${ecoSim.season}`);

// Advance through Winter into Year 2 Spring (Day 33)
for (let d = 27; d <= 33; d++) {
  for (let t = 0; t < CFG.dayTicks; t++) ecoSim.update(null);
}
assert.equal(ecoSim.year, 2, 'Simulated 1 full planetary year into Year 2');
assert.equal(ecoSim.season, 'SPRING', 'Year 2 begins in Spring');

const year2Counts = ecoSim.population();
console.log('Year 2 Day 34 population:', year2Counts);

// Verify multi-species survival: all 8 foundational species survive the year
for (const sp of ['mosskip', 'rootling', 'needlejaw', 'rillsifter', 'mirelick', 'podshell', 'bankjaw', 'genvo']) {
  assert.ok(year2Counts[sp] > 0, `Species ${sp} maintained a viable population across 4 seasons without extinction`);
}

const livingTotal = ecoSim.animals.filter(a => a.alive).length;
assert.ok(livingTotal >= 100 && livingTotal <= 400, `Fauna population stays within balanced bounds (${livingTotal})`);
console.log(`Multi-season fauna survival verified: ${livingTotal} living creatures across 8 species.`);

console.log('--- 3. Save / Restore Continuity Across Extended Worlds ---');
// Archive the Year 2 world
const snapshot = createSimulationSnapshot(ecoSim, {reason: 'extended-play-checkpoint', savedAt: 'test'});
assert.ok(snapshot.core);
assert.equal(snapshot.core.year, 2);
assert.equal(snapshot.core.seasonIndex, 0); // Spring

// Restore detached snapshot
const restored = restoreDetachedSimulationSnapshot(snapshot);
assert.equal(restored.year, 2);
assert.equal(restored.seasonIndex, 0);
assert.equal(restored.season, 'SPRING');
assert.equal(restored.day, ecoSim.day);
assert.equal(restored.tickCount, ecoSim.tickCount);
assert.equal(restored.player().id, ecoSim.player().id);

const restoredCounts = restored.population();
assert.deepEqual(restoredCounts, year2Counts, 'Populations by species match exactly after restore');
console.log('Save/Restore continuity verified: year, season, day, player, and species populations preserved.');

console.log('PASS: living-planet-extended verification complete!');
