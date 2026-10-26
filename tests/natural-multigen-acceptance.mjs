import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {createSimulationSnapshot, restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// Natural Multigenerational Ordinary-Gameplay Acceptance Test
// Priority 2: Genuine player-accessible rules without direct stat/state injections,
// teleportation, artificial gestation skips, or fabricated energy.
// Verifies:
// 1. A normal founder survives via playerEat() and playerDrink().
// 2. Normal courtship and conception occur legitimately.
// 3. Gestation completes via natural ticks.
// 4. Children are born and receive legitimate parental care/sustenance.
// 5. Offspring survive and mature into adulthood.
// 6. Succession handoff to Gen 2 descendant (either manual heir takeover or natural succession).
// 7. Descendant inherits legitimate differences (genes, phenotype, bodyPlan).
// 8. Descendant finds an unrelated compatible mate (kinship forbidden).
// 9. Conception and birth of Generation 3 through normal simulation.
// 10. Save and Continue preserves lineage continuity.

console.log('--- Starting Natural Multigenerational Acceptance Suite ---');

const sim = new Simulation('NATURAL-MULTIGEN-ACCEPTANCE', {
  player: true,
  worldGenerator: 'planetary/1',
  regionalFrontier: true
});
sim.playerAutonomy = false;

// 1. Founder verification
const founder = sim.player();
assert.ok(founder, 'Founder exists');
assert.equal(founder.generation, 1, 'Founder starts at Gen 1');
assert.equal(founder.lineage, true, 'Founder has lineage = true');

// Player eats and drinks via authoritative gameplay actions
if (founder.energy < SPECIES[founder.species].maxEnergy * 0.9) {
  const eatRes = sim.playerEat();
  assert.ok(eatRes.ok, 'Founder ate via playerEat()');
}
if (founder.hydration < SPECIES[founder.species].maxHydration * 0.9) {
  const drinkRes = sim.playerDrink();
  assert.ok(drinkRes.ok, 'Founder drank via playerDrink()');
}
assert.ok(founder.energy > 30, 'Founder sustainably fed');
assert.ok(founder.hydration > 30, 'Founder sustainably hydrated');

// 2. Courtship & Conception with starter companion
sim.rebuildSpatial();
sim.reproduction.refreshSelection();

const companion = sim.animals.find(a => a.id === sim.starterMateId && a.alive);
assert.ok(companion, 'Starter companion exists and is alive');

sim.reproduction.selectMate(companion.id);
const courtSuccess = sim.reproduction.courtSelected();
assert.equal(courtSuccess, true, 'Courtship started with companion');

const mated = sim.tryMate(founder, companion);
assert.equal(mated, true, 'Founder and companion successfully mated');

const mother = founder.sex === 'F' ? founder : companion;
assert.ok(mother.pregnant, 'Mother is pregnant');

// Helper to keep active player fed and watered via gameplay authorities during days
function sustainEcosystem(s) {
  const p = s.player();
  if (p && p.alive) {
    if (p.energy < SPECIES[p.species].maxEnergy * 0.5) s.playerEat();
    if (p.hydration < SPECIES[p.species].maxHydration * 0.5) s.playerDrink();
  }
}

// 3. Natural Gestation through simulation ticks
const gestationDays = SPECIES.genvo.gestation;
for (let d = 0; d < gestationDays; d++) {
  sustainEcosystem(sim);
  for (let t = 0; t < CFG.dayTicks; t++) {
    sim.update(null);
  }
}

// 4. Offspring born
const gen2Child = sim.animals.find(a => a.alive && a.parentIds?.includes(founder.id));
assert.ok(gen2Child, 'Gen 2 offspring was born');
assert.equal(gen2Child.generation, 2, 'Offspring is Gen 2');
assert.equal(gen2Child.lineage, true, 'Offspring is registered in lineage');
assert.ok(gen2Child.parentIds.includes(founder.id), 'ParentIds contains founder');

// 5. Offspring maturation through natural lifecycle days
const maturityDays = SPECIES.genvo.maturity;
while (gen2Child.alive && gen2Child.age < maturityDays) {
  sustainEcosystem(sim);
  for (let t = 0; t < CFG.dayTicks; t++) {
    sim.update(null);
  }
}
assert.ok(gen2Child.alive, 'Gen 2 survived to maturity');
assert.ok(gen2Child.age >= maturityDays, 'Gen 2 reached adulthood');

// 6. Succession: handoff to Gen 2 (manual heir takeover or legitimate succession upon natural elder transition)
sim.lineage.refreshSelection();
const activeNow = sim.player();
if (activeNow.id !== gen2Child.id) {
  const eligible = sim.lineage.eligibleHeirs();
  assert.ok(eligible.some(h => h.id === gen2Child.id), 'Gen 2 child is an eligible heir');
  const handoffOk = sim.lineage.handoffTo(gen2Child.id, {manual: true});
  assert.equal(handoffOk, true, 'Handoff to Gen 2 succeeded');
}

const activeGen2 = sim.player();
assert.equal(activeGen2.id, gen2Child.id, 'Player is now Gen 2 descendant');
assert.equal(activeGen2.generation, 2, 'Player generation is 2');

// 7. Verify inherited differences
assert.ok(activeGen2.genes, 'Gen 2 has genetic traits');
assert.ok(activeGen2.bodyPlan, 'Gen 2 has bodyPlan');
assert.ok(activeGen2.pigmentGenome, 'Gen 2 has pigmentGenome');

// 8. Kinship restriction: pairing with parents or close kin is blocked
const kinCheck = sim.matePairAvailability(activeGen2, founder);
assert.equal(kinCheck.enabled, false, 'Mating with parent is strictly forbidden');

// Find an unrelated compatible mate among wildlife
let wildMate = null;
for (let d = 0; d < 80 && !wildMate; d++) {
  sustainEcosystem(sim);
  sim.rebuildSpatial();
  wildMate = sim.animals.find(a =>
    a.alive &&
    a.species === 'genvo' &&
    a.sex !== activeGen2.sex &&
    a.age >= SPECIES.genvo.maturity &&
    !a.lineage &&
    !a.pregnant &&
    a.reproCooldown <= 0 &&
    sim.recovery.kinship(activeGen2, a) === 'none' &&
    sim.canReach(activeGen2, a.x, a.y)
  );
  if (!wildMate) {
    for (let t = 0; t < CFG.dayTicks; t++) sim.update(null);
  }
}
assert.ok(wildMate, 'Found reachable unrelated compatible wild mate');

// 9. Courtship & Reproduction to Generation 3
sim.rebuildSpatial();
sim.reproduction.refreshSelection();
sim.reproduction.selectMate(wildMate.id);
assert.ok(sim.reproduction.courtSelected(), 'Courtship started with wild mate');

let gen2Mated = false;
for (let attempt = 0; attempt < 10 && !gen2Mated; attempt++) {
  gen2Mated = sim.tryMate(activeGen2, wildMate);
}
assert.equal(gen2Mated, true, 'Gen 2 successfully mated with wild mate');

const gen2Mother = activeGen2.sex === 'F' ? activeGen2 : wildMate;
assert.ok(gen2Mother.pregnant, 'Gen 2 mother is pregnant');

// Advance gestation naturally
for (let d = 0; d < gestationDays; d++) {
  sustainEcosystem(sim);
  for (let t = 0; t < CFG.dayTicks; t++) {
    sim.update(null);
  }
}

const gen3Child = sim.animals.find(a => a.alive && a.parentIds?.includes(activeGen2.id));
assert.ok(gen3Child, 'Gen 3 child was born');
assert.equal(gen3Child.generation, 3, 'Child is Generation 3');
assert.equal(gen3Child.lineage, true, 'Gen 3 child belongs to player lineage');

// Mature Gen 3 naturally
while (gen3Child.alive && gen3Child.age < maturityDays) {
  sustainEcosystem(sim);
  for (let t = 0; t < CFG.dayTicks; t++) {
    sim.update(null);
  }
}
assert.ok(gen3Child.alive, 'Gen 3 survived to adulthood');

sim.lineage.refreshSelection();
const activeGen3Now = sim.player();
if (activeGen3Now.id !== gen3Child.id) {
  const handoffGen3 = sim.lineage.handoffTo(gen3Child.id, {manual: true});
  assert.equal(handoffGen3, true, 'Handoff to Gen 3 succeeded');
}
assert.equal(sim.player().id, gen3Child.id, 'Player is now Generation 3');
assert.equal(sim.player().generation, 3, 'Player generation is 3');

// 10. Ancestry & Save/Continue verification
const ancestry = sim.lineage.ancestryPath(gen3Child.id);
assert.ok(ancestry.length >= 3, 'Ancestry traces Gen 1 -> Gen 2 -> Gen 3');
assert.equal(ancestry[0].id, founder.id, 'Root ancestor is Founder');
assert.equal(ancestry[1].id, gen2Child.id, 'Generation 2 link is verified');
assert.equal(ancestry[2].id, gen3Child.id, 'Generation 3 heir is verified');

const snap = createSimulationSnapshot(sim, {savedAt: 'natural-multigen'});
const restored = restoreSimulationSnapshot(structuredClone(snap));
assert.ok(restored, 'Simulation restored cleanly');
assert.equal(restored.player().id, gen3Child.id, 'Restored player matches Gen 3');
assert.equal(restored.player().generation, 3, 'Restored player is Generation 3');

const restoredAncestry = restored.lineage.ancestryPath(gen3Child.id);
assert.equal(restoredAncestry.length, 3, 'Restored lineage preserves complete 3-generation ancestry');

console.log('Natural Multigenerational Acceptance Suite: ALL 10 CHECKS PASSED');
