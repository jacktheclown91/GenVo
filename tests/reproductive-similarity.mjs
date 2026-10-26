import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES, GENETIC_DOMAIN} from '../src/organisms/species.js';
import {ancestralReproductiveGenome} from '../src/reproduction/reproductive-compatibility.js';
import {COURTSHIP_SIMILARITY, courtshipSimilarityAdvantage, founderMatePreferences} from '../src/reproduction/mate-preferences.js';
import {performCourtship, performedMateChoice} from '../src/reproduction/courtship-performance.js';
import {placeSupportedBreedingPair} from './helpers/breeding-pair.js';
import {makePlan, validatePlan} from '../src/lineage/body-plan.js';
import {FOUNDER_PLACEMENTS} from '../src/lineage/body-inheritance.js';
import {partEffectFactors} from '../src/lineage/part-abilities.js';
import {partnerAvailability, COURTSHIP_READINESS} from '../src/reproduction/partner-encounters.js';
import {createSimulationSnapshot, restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {preparePlanetaryDestination, planetaryPreparationKey} from '../src/world/planetary-travel.js';
const sim = new Simulation('SIMILARITY-CONTRACT', {bootstrap: false, courtshipSimilarity: true});
const a = sim.spawnAnimal('genvo', 30, 30), b = sim.spawnAnimal('genvo', 30.2, 30);
b.bodyPlan = structuredClone(a.bodyPlan); b.genes = {...a.genes}; b.pigmentGenome = {...a.pigmentGenome};
function ready() {
  for (const [animal, sex] of [[a, 'M'], [b, 'F']]) Object.assign(animal, {sex, age: SPECIES.genvo.maturity + 5, health: 100, energy: SPECIES.genvo.maxEnergy, hydration: SPECIES.genvo.maxHydration, infected: false, pregnant: null, reproCooldown: 0, parentIds: [], grandparentIds: [], intent: 'idle', target: null});
}
ready();
// Normal courtship does not inherit the stricter colony-only readiness profile.
for (const animal of [a, b]) {
  animal.energy = SPECIES.genvo.maxEnergy * ((partEffectFactors(animal)?.courtship ?? .62) + .001);
  animal.hydration = SPECIES.genvo.maxHydration * .3; animal.health = COURTSHIP_READINESS.minHealth;
}
assert.equal(partnerAvailability(sim, a, b, COURTSHIP_READINESS).available, true);
assert.equal(partnerAvailability(sim, a, b).available, false, 'colony readiness stays distinct and unchanged');
assert.equal(sim.canMatePair(a, b, {ready: true}), true, 'existing ordinary courtship thresholds remain available');
ready();
function paid() {
  a.energy = SPECIES.genvo.maxEnergy; a.courtshipPerformance = null; a.completedCourtship = null; a.queuedCourtshipSequence = ['approach'];
  const before = a.energy; assert.equal(performCourtship(sim, a, b), false);
  assert.ok(a.courtshipPerformance); assert.equal(before - a.energy > 0, true);
  sim.tickCount = a.courtshipPerformance.endsAt; assert.equal(performCourtship(sim, a, b), true);
  return performedMateChoice(sim, a, b);
}
const rng = sim.rng.state;
const result = paid(); assert.deepEqual(performedMateChoice(sim, a, b), result, 'same encounter and attempt remain deterministic');
const originalGenome = structuredClone(b.reproductiveGenome);
const originalPlayer = a.player; a.player = true; assert.deepEqual(performedMateChoice(sim, a, b), result, 'player and autonomous reception use identical rules'); a.player = originalPlayer;
const snapshot = structuredClone(createSimulationSnapshot(sim, {savedAt: 'fixed', reason: 'similarity'}));
const restored = restoreSimulationSnapshot(structuredClone(snapshot));
assert.equal(restored.courtshipSimilarityRules, COURTSHIP_SIMILARITY.policy);
assert.deepEqual(performedMateChoice(restored, restored.animals[0], restored.animals[1]), result, 'reception draws and chances survive save/load');
// The advantage is not awarded when the shared receptive-partner authority refuses.
for (const field of ['infected', 'hydration']) {
  const saved = b[field]; b[field] = field === 'infected' ? true : 0;
  const balancedRefusal = performedMateChoice(sim, a, b);
  delete sim.courtshipSimilarityRules;
  assert.deepEqual(performedMateChoice(sim, a, b), balancedRefusal, 'unwell/thirsty partners receive no resemblance override');
  sim.courtshipSimilarityRules = COURTSHIP_SIMILARITY.policy; b[field] = saved;
}
const historical = structuredClone(snapshot); delete historical.core.courtshipSimilarityRules;
const legacy = restoreSimulationSnapshot(historical); assert.equal(Object.hasOwn(legacy, 'courtshipSimilarityRules'), false);
const oldResult = performedMateChoice(legacy, legacy.animals[0], legacy.animals[1]);
assert.ok(result.chances[0] > oldResult.chances[0]); assert.ok(result.chances[1] > oldResult.chances[1]);
const corrupt = structuredClone(snapshot); corrupt.core.courtshipSimilarityRules = 'unknown';
assert.throws(() => restoreSimulationSnapshot(corrupt), /reproductive similarity policy/);
const inconsistent = structuredClone(snapshot); delete inconsistent.core.mateAssortmentRules;
assert.throws(() => restoreSimulationSnapshot(inconsistent), /reproductive similarity policy/);
assert.throws(() => new Simulation('BAD-SIMILARITY', {localAssortment: false, courtshipSimilarity: true}), /local appearance/);

// A taste for contrast remains free to prefer a divergent, compatible individual.
const ordinary = {...a.matePreferences};
a.matePreferences = {...founderMatePreferences(sim.seed, a.id, {assortment: true}), similarity: -1};
const contrast = {...b, pigmentGenome: {...b.pigmentGenome, hue: (b.pigmentGenome.hue + 12) % 24}};
assert.equal(courtshipSimilarityAdvantage(a, b, sim.seed, {sameTaxon: true}), 0);
assert.equal(courtshipSimilarityAdvantage(a, contrast, sim.seed, {sameTaxon: true}), 0);
a.matePreferences = ordinary;
assert.ok(courtshipSimilarityAdvantage(a, b, sim.seed) > courtshipSimilarityAdvantage(a, contrast, sim.seed));
// Existing recognized evolutionary taxa remain a soft affinity, never a compatibility barrier.
sim.speciation.states.set('other', {recognized: true, branch: {id: 'other-branch'}});
b.speciesBranch = {id: 'other-branch', populationKey: 'other'};
assert.equal(sim.evolutionTree.sameTaxon(a, b), false);
assert.equal(sim.canMatePair(a, b, {ready: true}), true);
const cross = performedMateChoice(sim, a, b); assert.ok(cross.chances.every(chance => chance > 0 && chance < 1));
let accepted = 0, declined = 0;
for (let attempt = 0; attempt < 128; attempt++) { const response = paid(); accepted += Number(response.accepted); declined += Number(!response.accepted); }
assert.ok(accepted > 0 && declined > 0, 'compatible cross-taxon gene flow is possible and never guaranteed');
assert.equal(sim.rng.state, rng, 'display selection, receipt and reception add no ecology RNG draws');

// The existing gates still reject forbidden pairs, regardless of resemblance.
ready(); b.parentIds = [a.id]; assert.equal(sim.canMatePair(a, b, {ready: true}), false);
ready(); b.age = 0; assert.equal(sim.canMatePair(a, b, {ready: true}), false);
ready(); b.pregnant = {days: 5}; assert.equal(sim.canMatePair(a, b, {ready: true}), false);
ready(); b.energy = 0; assert.equal(sim.canMatePair(a, b, {ready: true}), false);
ready(); b.health = 0; assert.equal(sim.canMatePair(a, b, {ready: true}), false);
ready(); b.sex = a.sex; assert.equal(sim.canMatePair(a, b, {ready: true}), false);
ready(); a.infected = true; a.courtshipPerformance = null; assert.equal(performCourtship(sim, a, b), false); assert.equal(a.courtshipPerformance, null);
ready(); b.infected = true; assert.equal(partnerAvailability(sim, a, b).reason, 'unwell');
ready(); b.hydration = 0; assert.equal(partnerAvailability(sim, a, b).reason, 'survival-priority');
ready(); b.reproductiveGenome = {schema: 1, loci: {gamete: [GENETIC_DOMAIN.min, GENETIC_DOMAIN.min], development: [GENETIC_DOMAIN.min, GENETIC_DOMAIN.max]}};
assert.equal(sim.canMatePair(a, b, {ready: true}), false, 'reproductive inheritance incompatibility outranks similarity');

// Distinct signed preferences still change reception for the same similar bodies.
ready(); b.reproductiveGenome = originalGenome;
const oldGenesA = {...a.genes}, oldGenesB = {...b.genes};
a.genes = {...a.genes, body: 1.25}; b.genes = {...a.genes};
const oldTasteA = a.matePreferences;
a.matePreferences = {...oldTasteA, similarity: .3, weights: {size: 1, strength: 0, ornament: 0, display: 0, behavior: 0}};
paid(); const likesLarge = performedMateChoice(sim, a, b).chances[0];
a.matePreferences = {...a.matePreferences, weights: {...a.matePreferences.weights, size: -1}};
assert.ok(performedMateChoice(sim, a, b).chances[0] < likesLarge, 'inherited absolute phenotype tastes retain influence');
a.matePreferences = oldTasteA; a.genes = oldGenesA; b.genes = oldGenesB;
ready();
b.bodyPlan = makePlan(FOUNDER_PLACEMENTS.map(part => String(part.socket).startsWith('limb.') ? {...part, partId: 'runner-leg'} : part));
assert.equal(validatePlan(b.bodyPlan).ok, true);
b.pigmentGenome = {...b.pigmentGenome, hue: (b.pigmentGenome.hue + 12) % 24};
b.genes = {...b.genes, body: b.genes.body * 1.15};
placeSupportedBreedingPair(sim, a, b);
let conceived = false;
for (let attempt = 0; attempt < 128 && !conceived; attempt++) {
  paid(); conceived = sim.tryMate(a, b);
}
assert.equal(conceived, true, 'ordinary paid reciprocal courtship can conceive across recognized compatible taxa');
assert.ok(b.pregnant);
const young = sim.giveBirth(b); // Controlled birth timing, actual finite funded birth authority.
assert.ok(young.length > 0);
assert.ok(young.every(child => child.parentIds.includes(a.id) && child.parentIds.includes(b.id)), 'actual offspring retain both cross-taxon parents');

const planet = new Simulation('PLANET-B0-A', {bootstrap: false, worldGenerator: 'planetary/1', courtshipSimilarity: true});
const enabledKey = planetaryPreparationKey(planet, {x: 128, y: 0});
const destination = preparePlanetaryDestination(planet, {x: 128, y: 0});
assert.equal(destination.courtshipSimilarityRules, COURTSHIP_SIMILARITY.policy);
delete planet.courtshipSimilarityRules;
assert.notEqual(planetaryPreparationKey(planet, {x: 128, y: 0}), enabledKey, 'prepared region cache is policy specific');
assert.equal(Object.hasOwn(preparePlanetaryDestination(planet, {x: 128, y: 0}), 'courtshipSimilarityRules'), false);
// An unavailable look-alike cannot monopolize autonomous search over a fit
// divergent candidate. Player lists and wildlife now reuse the same eligibility.
const search = new Simulation('SIMILARITY-ELIGIBLE-SEARCH', {bootstrap: false, courtshipSimilarity: true});
const chooser = search.spawnAnimal('genvo', 30, 30), unavailable = search.spawnAnimal('genvo', 30.1, 30), divergent = search.spawnAnimal('genvo', 30.6, 30);
for (const [animal, sex] of [[chooser, 'M'], [unavailable, 'F'], [divergent, 'F']]) Object.assign(animal, {sex, age: SPECIES.genvo.maturity + 5, health: 100, energy: SPECIES.genvo.maxEnergy, hydration: SPECIES.genvo.maxHydration, reproCooldown: 0, pregnant: null, parentIds: [], grandparentIds: [], reproductiveGenome: ancestralReproductiveGenome(), matePreferences: {weights: {size: 0, strength: 0, ornament: 0, display: 0, behavior: 0}, similarity: .2, selectivity: .5}});
unavailable.bodyPlan = structuredClone(chooser.bodyPlan); unavailable.genes = {...chooser.genes}; unavailable.pigmentGenome = {...chooser.pigmentGenome};
divergent.bodyPlan = makePlan(FOUNDER_PLACEMENTS.map(part => String(part.socket).startsWith('limb.') ? {...part, partId: 'runner-leg'} : part));
divergent.pigmentGenome = {...chooser.pigmentGenome, hue: (chooser.pigmentGenome.hue + 12) % 24};
placeSupportedBreedingPair(search, chooser, divergent);
unavailable.x = chooser.x + .1; unavailable.y = chooser.y; divergent.x = chooser.x + .6; divergent.y = chooser.y;
search.speciation.states.set('divergent', {recognized: true, branch: {id: 'divergent-branch'}}); divergent.speciesBranch = {id: 'divergent-branch', populationKey: 'divergent'};
unavailable.energy = 0; search.rebuildSpatial();
assert.equal(search.autonomousMateTarget(chooser)?.id, divergent.id, 'available gene flow is not hidden by an exhausted same-taxon look-alike');

// Existing illness/conception rules and mating-transmission hooks remain intact.
// An infected receiver is not granted the resemblance bonus; it is still governed
// by the original disease/reproduction authorities, not a new blanket ban.
const illnessOutcomes = [];
for (const balanced of [false, true]) {
  const world = new Simulation('SIMILARITY-ILLNESS-COMPATIBILITY', {bootstrap: false, courtshipSimilarity: balanced});
  const x = world.spawnAnimal('genvo', 30, 30), y = world.spawnAnimal('genvo', 30.2, 30);
  y.bodyPlan = structuredClone(x.bodyPlan); y.genes = {...x.genes}; y.pigmentGenome = {...x.pigmentGenome};
  for (const [animal, sex] of [[x, 'M'], [y, 'F']]) Object.assign(animal, {sex, age: SPECIES.genvo.maturity + 5, health: 100, energy: SPECIES.genvo.maxEnergy, hydration: SPECIES.genvo.maxHydration, reproCooldown: 0, pregnant: null, reproductiveGenome: ancestralReproductiveGenome(), matePreferences: {weights: {size: 0, strength: 0, ornament: 0, display: 0, behavior: 0}, similarity: 1, selectivity: .5}});
  placeSupportedBreedingPair(world, x, y); world.disease.infect(y, {force: true, source: 'test'});
  let accepted = false;
  for (let attempt = 0; attempt < 128 && !accepted; attempt++) {
    x.energy = SPECIES.genvo.maxEnergy; x.courtshipPerformance = null; x.completedCourtship = null; x.queuedCourtshipSequence = ['approach'];
    performCourtship(world, x, y); assert.ok(x.courtshipPerformance); world.tickCount = x.courtshipPerformance.endsAt; performCourtship(world, x, y);
    accepted = performedMateChoice(world, x, y).accepted;
  }
  assert.ok(accepted, 'a genuine paid receipt exercises the original disease pathway');
  let matingHook = false; const onMate = world.disease.onMate;
  world.disease.onMate = function(...parents) { matingHook = true; return onMate.apply(this, parents); };
  assert.equal(world.tryMate(x, y), true, 'existing receiver/conception rules remain authoritative');
  assert.ok(matingHook, 'the canonical mating-transmission mechanism remains reachable');
  illnessOutcomes.push({actorInfected: x.infected, energy: [x.energy, y.energy], hydration: [x.hydration, y.hydration], rng: world.rng.state, disease: {...world.disease.stats}});
}
assert.deepEqual(illnessOutcomes[1], illnessOutcomes[0], 'no bonus or biological override for an ill receiver');

const speciation = spawnSync(process.execPath, ['tests/speciation-threshold.mjs', '--balanced'], {encoding: 'utf8'});
assert.equal(speciation.status, 0, speciation.stderr || speciation.stdout);
console.log('Reproductive similarity: smooth reception, individual contrast, shared controls, funded display, deterministic RNG/save, historical rules, biological gates, cross-taxon flow, regional policy and speciation recognition PASS');
