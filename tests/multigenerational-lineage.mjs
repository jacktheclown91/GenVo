import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {createSimulationSnapshot, restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// Priority 1 Multigenerational Lineage Integration Test
// Validates Gen 1 -> Gen 2 -> Gen 3 across natural mating, gestation, inheritance,
// juvenile growth, succession, outbreeding, death continuation, and save continuity.

const sim = new Simulation('MULTIGEN-INTEGRATION-SUITE-1', {player: true, worldGenerator: 'planetary/1'});
sim.playerAutonomy = false;

const founder = sim.player();
assert.ok(founder, 'Founder exists');
assert.equal(founder.generation, 1, 'Founder is Gen 1');
assert.equal(founder.lineage, true, 'Founder has lineage = true');

// Rebuild spatial partition and select companion
sim.rebuildSpatial();
sim.reproduction.refreshSelection();

// 1. Founder reproduces with companion
const companion = sim.animals.find(a => a.id === sim.starterMateId);
assert.ok(companion, 'Starter companion exists');

const pairCheck = sim.matePairAvailability(founder, companion, {ready: true});
assert.equal(pairCheck.enabled, true, 'Founder and companion are eligible mates');

// Select mate and court
sim.reproduction.selectMate(companion.id);
const courtOk = sim.reproduction.courtSelected();
assert.equal(courtOk, true, 'Courtship started with companion');

// Try mating
const mated = sim.tryMate(founder, companion);
assert.equal(mated, true, 'Founder and companion successfully mated');
const mother = founder.sex === 'F' ? founder : companion;
assert.ok(mother.pregnant, 'Mother is pregnant');

// Advance gestation
const gestationDays = SPECIES.genvo.gestation;
for (let d = 0; d < gestationDays; d++) {
  for (let t = 0; t < CFG.dayTicks; t++) sim.update(null);
}

// Check Gen 2 child born
const gen2Child = sim.animals.find(a => a.alive && a.parentIds?.includes(founder.id));
assert.ok(gen2Child, 'Gen 2 child was born');
assert.equal(gen2Child.generation, 2, 'Child is Gen 2');
assert.equal(gen2Child.lineage, true, 'Child has lineage = true');
assert.ok(gen2Child.parentIds.includes(founder.id), 'Child parentIds includes founder');

// Verify inheritance: genes, phenotype, body plan
assert.ok(gen2Child.genes, 'Gen 2 has genes');
assert.ok(gen2Child.bodyPlan, 'Gen 2 has bodyPlan');
assert.ok(gen2Child.pigmentGenome, 'Gen 2 has pigmentGenome');

// 2. Juvenile development & maturity
while (gen2Child.alive && gen2Child.age < SPECIES[gen2Child.species].maturity) {
  if (gen2Child.energy < 50) gen2Child.energy = 85;
  if (gen2Child.hydration < 50) gen2Child.hydration = 85;
  for (let t = 0; t < CFG.dayTicks; t++) sim.update(null);
}
assert.ok(gen2Child.alive, 'Gen 2 survived to adulthood');
assert.ok(gen2Child.age >= SPECIES[gen2Child.species].maturity, 'Gen 2 reached maturity');

// 3. Succession: handoff to Gen 2
sim.lineage.refreshSelection();
const eligible = sim.lineage.eligibleHeirs();
assert.ok(eligible.some(h => h.id === gen2Child.id), 'Gen 2 child is in eligible heirs');

const handoffSuccess = sim.lineage.handoffTo(gen2Child.id, {manual: true});
assert.equal(handoffSuccess, true, 'Handoff to Gen 2 succeeded');

const activePlayer = sim.player();
assert.equal(activePlayer.id, gen2Child.id, 'Active player is now Gen 2');
assert.equal(activePlayer.generation, 2, 'Active player generation is 2');

// 4. Kinship enforcement: close relatives (founder, siblings) are blocked
const oppositeSexParent = founder.sex !== activePlayer.sex ? founder : companion;
const closeKinCheck = sim.matePairAvailability(activePlayer, oppositeSexParent);
assert.equal(closeKinCheck.enabled, false, 'Mating with parent is forbidden');
assert.equal(closeKinCheck.reason, 'Close relatives cannot pair.');

// 5. Find an unrelated wild mate as seasonal cohorts mature
let wildMate = null;
for (let d = 0; d < 60 && !wildMate; d++) {
  sim.rebuildSpatial();
  wildMate = sim.animals.find(a =>
    a.alive &&
    a.species === 'genvo' &&
    a.sex !== activePlayer.sex &&
    a.age >= SPECIES.genvo.maturity &&
    !a.lineage &&
    !a.pregnant &&
    a.reproCooldown <= 0 &&
    sim.recovery.kinship(activePlayer, a) === 'none'
  );
  if (!wildMate) {
    if (activePlayer.energy < 50) activePlayer.energy = 85;
    if (activePlayer.hydration < 50) activePlayer.hydration = 85;
    for (let t = 0; t < CFG.dayTicks; t++) sim.update(null);
  }
}
assert.ok(wildMate, 'Found ready unrelated wild mate');

// Ensure both have energy and health for courtship
activePlayer.energy = 95;
activePlayer.hydration = 95;
activePlayer.health = 100;
activePlayer.reproCooldown = 0;

wildMate.energy = 95;
wildMate.hydration = 95;
wildMate.health = 100;
wildMate.reproCooldown = 0;

// Move close for courtship
wildMate.x = activePlayer.x + 1.2;
wildMate.y = activePlayer.y;

sim.rebuildSpatial();
sim.reproduction.refreshSelection();

const wildPairCheck = sim.matePairAvailability(activePlayer, wildMate, {ready: true});
assert.equal(wildPairCheck.enabled, true, 'Active Gen 2 and wild mate are eligible');

// 6. Reproduction of Gen 2 -> Gen 3
let gen2Mated = false;
for (let attempt = 0; attempt < 10 && !gen2Mated; attempt++) {
  activePlayer.reproCooldown = 0;
  wildMate.reproCooldown = 0;
  activePlayer.energy = 95;
  wildMate.energy = 95;
  sim.rebuildSpatial();
  sim.reproduction.selectMate(wildMate.id);
  const courtWildOk = sim.reproduction.courtSelected();
  assert.equal(courtWildOk, true, 'Courtship started with wild mate');
  gen2Mated = sim.tryMate(activePlayer, wildMate);
}
assert.equal(gen2Mated, true, 'Gen 2 successfully mated with wild mate');

const gen2Mother = activePlayer.sex === 'F' ? activePlayer : wildMate;
assert.ok(gen2Mother.pregnant, 'Gen 2 mother is pregnant');

for (let d = 0; d < gestationDays; d++) {
  for (let t = 0; t < CFG.dayTicks; t++) sim.update(null);
}

const gen3Child = sim.animals.find(a => a.alive && a.parentIds?.includes(activePlayer.id));
assert.ok(gen3Child, 'Gen 3 child was born');
assert.equal(gen3Child.generation, 3, 'Child is Gen 3');
assert.equal(gen3Child.lineage, true, 'Gen 3 child is part of lineage');

// 7. Mature Gen 3 and handoff
while (gen3Child.alive && gen3Child.age < SPECIES[gen3Child.species].maturity) {
  if (gen3Child.energy < 50) gen3Child.energy = 85;
  if (gen3Child.hydration < 50) gen3Child.hydration = 85;
  for (let t = 0; t < CFG.dayTicks; t++) sim.update(null);
}
assert.ok(gen3Child.alive, 'Gen 3 survived to maturity');

sim.lineage.refreshSelection();
const handoffGen3 = sim.lineage.handoffTo(gen3Child.id, {manual: true});
assert.equal(handoffGen3, true, 'Handoff to Gen 3 succeeded');
assert.equal(sim.player().id, gen3Child.id, 'Player is now Gen 3');
assert.equal(sim.player().generation, 3, 'Player generation is 3');

// 8. Verify Ancestry Path & Lineage History
const ancestry = sim.lineage.ancestryPath(gen3Child.id);
assert.ok(ancestry.length >= 3, 'Ancestry path traces Gen 1 -> Gen 2 -> Gen 3');
assert.equal(ancestry[0].id, founder.id, 'Ancestry root is Founder');
assert.equal(ancestry[1].id, gen2Child.id, 'Ancestry step 1 is Gen 2');
assert.equal(ancestry[2].id, gen3Child.id, 'Ancestry step 2 is Gen 3');

// 9. Death & Legitimate Continuation
const currentP = sim.player();
const livingKin = sim.animals.filter(a => a.alive && a.lineage && a.id !== currentP.id);
assert.ok(livingKin.length > 0, 'Lineage has living kin');

sim.kill(currentP, 'age');
assert.equal(currentP.alive, false, 'Current player died of age');

const newPlayer = sim.player();
assert.ok(newPlayer, 'New player was promoted after death');
assert.ok(newPlayer.alive, 'New player is alive');
assert.equal(newPlayer.lineage, true, 'New player is in lineage');
assert.notEqual(newPlayer.id, currentP.id, 'New player is not the dead creature');

// 10. Save / Continue Across Generations
const snapshot = createSimulationSnapshot(sim, {savedAt: 'multigen-suite'});
assert.ok(snapshot, 'Snapshot created');

const restoredSim = restoreSimulationSnapshot(structuredClone(snapshot));
assert.ok(restoredSim, 'Snapshot restored');

const restoredPlayer = restoredSim.player();
assert.ok(restoredPlayer, 'Restored player exists');
assert.equal(restoredPlayer.id, newPlayer.id, 'Restored player matches saved player id');
assert.equal(restoredPlayer.generation, newPlayer.generation, 'Restored player generation matches');

const restoredAncestry = restoredSim.lineage.ancestryPath(gen3Child.id);
assert.equal(restoredAncestry.length, ancestry.length, 'Restored ancestry path matches');
assert.equal(restoredAncestry[0].id, founder.id, 'Restored ancestry root is Founder');

console.log('multigenerational-lineage: Gen 1 -> Gen 2 -> Gen 3, outbreeding, ancestry, succession, death continuation, save PASS');
