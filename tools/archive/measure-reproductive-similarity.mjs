// Controlled, funded courtship reception trials, not an ecological population target.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Simulation} from '../../src/sim/simulation.js';
import {RNG} from '../../src/core/rng.js';
import {placeSupportedBreedingPair} from '../../tests/helpers/breeding-pair.js';
import {SPECIES, GENETIC_DOMAIN} from '../../src/organisms/species.js';
import {makePlan, validatePlan} from '../../src/lineage/body-plan.js';
import {FOUNDER_PLACEMENTS} from '../../src/lineage/body-inheritance.js';
import {appearanceDistance, founderMatePreferences, inheritMatePreferences, matePreferencesFor, perceptionOf, SAME_TAXON_AFFINITY} from '../../src/reproduction/mate-preferences.js';
import {performCourtship, performedMateChoice} from '../../src/reproduction/courtship-performance.js';
const output = process.argv[2] || 'reports/reproductive-similarity-baseline.json';
const seedCount = Number(process.env.GENVO_SWEEP_SEEDS || 16);
const attempts = Number(process.env.GENVO_SWEEP_ATTEMPTS || 64);
const seedStart = Number(process.env.GENVO_SWEEP_SEED_START || 0);
const balanced = process.env.GENVO_SWEEP_BALANCED === '1';
const rows = new Map();
const projected = new Map();
const candidates = process.env.GENVO_SWEEP_CANDIDATES ? [.55, .60, .65, .70].flatMap(strength => [1.5, 2, 3].map(power => ({strength, power}))) : [];
const legs = ['walking-leg', 'runner-leg', 'webbed-leg'];
function plan(leg) {
  const result = makePlan(FOUNDER_PLACEMENTS.map(p => String(p.socket).startsWith('limb.') ? {...p, partId: leg} : p));
  assert.equal(validatePlan(result).ok, true, 'measurement uses valid socket anatomy');
  return result;
}
function preferences(seed, animal, profile) {
  const own = founderMatePreferences(seed, animal.id, {assortment: true});
  if (profile === 'inherited') return inheritMatePreferences(seed, animal.id, {id: 10001, matePreferences: own}, {id: 10002, matePreferences: founderMatePreferences(seed, 10002, {assortment: true})});
  if (profile === 'similar') return {...own, similarity: 1};
  if (profile === 'unusual') return {...own, similarity: -1};
  if (profile === 'selective') return {...own, selectivity: 1, weights: {...own.weights, size: 1, strength: -1}};
  return own;
}
for (let seedIndex = 0; seedIndex < seedCount; seedIndex++) {
  const seed = `REPRODUCTIVE-SIMILARITY-${seedStart + seedIndex}`;
  const sim = new Simulation(seed, {bootstrap: false, courtshipSimilarity: balanced});
  const a = sim.spawnAnimal('genvo', 30, 30), b = sim.spawnAnimal('genvo', 30.2, 30);
  const baseGenes = {...a.genes}, pigment = {...a.pigmentGenome};
  for (let anatomy = 0; anatomy < legs.length; anatomy++) for (const distance of ['identical', 'near', 'different', 'divergent']) for (const profile of ['founder', 'inherited', 'similar', 'unusual', 'selective']) {
    a.bodyPlan = plan(legs[anatomy]); b.bodyPlan = plan(distance === 'identical' || distance === 'near' ? legs[anatomy] : legs[(anatomy + 1) % legs.length]);
    a.genes = {...baseGenes}; b.genes = {...baseGenes, body: Math.max(GENETIC_DOMAIN.min, Math.min(GENETIC_DOMAIN.max, baseGenes.body * (distance === 'divergent' ? 1.25 : distance === 'different' ? 1.08 : 1)))};
    a.pigmentGenome = {...pigment}; b.pigmentGenome = {...pigment, hue: (pigment.hue + ({identical: 0, near: 1, different: 5, divergent: 12}[distance])) % 24};
    a.matePreferences = preferences(seed, a, profile); b.matePreferences = preferences(seed, b, profile);
    for (const [animal, sex] of [[a, 'M'], [b, 'F']]) Object.assign(animal, {sex, age: SPECIES.genvo.maturity + 5, health: 100, energy: SPECIES.genvo.maxEnergy, hydration: SPECIES.genvo.maxHydration, infected: false, reproCooldown: 0, parentIds: [], grandparentIds: [], pregnant: null, courtshipLearning: {attempts: 0, patterns: {}}, courtshipPerformance: null, completedCourtship: null, intent: 'idle', target: null});
    assert.ok([a, b].every(animal => Object.values(animal.genes).every(value => value >= GENETIC_DOMAIN.min && value <= GENETIC_DOMAIN.max)), 'measurement genomes remain in the inherited domain');
    placeSupportedBreedingPair(sim, a, b);
    assert.equal(sim.recovery.kinship(a, b), 'none');
    assert.equal(sim.canMatePair(a, b, {ready: true}), true);
    const rng = sim.rng.state, key = `${profile}/${distance}`;
    const row = rows.get(key) || {profile, distance, trials: 0, successes: 0, meanAppearanceDistance: 0, probabilitySum: 0, costPaid: 0, bySeed: {}};
    row.bySeed[seed] ||= {trials: 0, successes: 0};
    for (let attempt = 0; attempt < attempts; attempt++) {
      // Declared funded fixture: reset only actor reserves between independent paid trials.
      a.energy = SPECIES.genvo.maxEnergy; a.courtshipPerformance = null; a.completedCourtship = null;
      a.queuedCourtshipSequence = ['approach'];
      assert.equal(performCourtship(sim, a, b), false);
      const performance = a.courtshipPerformance; assert.ok(performance);
      sim.tickCount = performance.endsAt;
      assert.equal(performCourtship(sim, a, b), true);
      const result = performedMateChoice(sim, a, b); assert.ok(result);
      for (const candidate of candidates) {
        const appearance = appearanceDistance(a, b, {assortment: true});
        const sameTaxon = sim.evolutionTree.sameTaxon(a, b);
        const chances = [a, b].map((chooser, index) => {
          const allele = Math.max(-1, Math.min(1, matePreferencesFor(seed, chooser).similarity ?? 0));
          const bonus = (candidate.strength + (sameTaxon ? SAME_TAXON_AFFINITY : 0)) * (1 + allele) / 2 * Math.min(1, perceptionOf(chooser)) * (1 - appearance) ** candidate.power;
          return Math.max(.055, Math.min(.94, result.chances[index] + bonus));
        });
        const draws = [0, 1].map(index => new RNG(`${seed}:courtship-reception:${a.id}:${b.id}:${performance.attempt}:${index}`).next());
        const projectedKey = `${candidate.strength}/${candidate.power}/${profile}/${distance}`;
        const entry = projected.get(projectedKey) || {...candidate, profile, distance, trials: 0, successes: 0, probabilitySum: 0};
        entry.trials++; entry.successes += Number(draws.every((draw, index) => draw < chances[index])); entry.probabilitySum += chances[0] * chances[1]; projected.set(projectedKey, entry);
      }
      row.trials++; row.successes += Number(result.accepted); row.bySeed[seed].trials++; row.bySeed[seed].successes += Number(result.accepted);
      row.probabilitySum += result.chances[0] * result.chances[1];
      row.meanAppearanceDistance += appearanceDistance(a, b, {assortment: true});
      row.costPaid += performance.energySpent;
    }
    assert.equal(sim.rng.state, rng, 'reception must not advance shared ecological RNG');
    rows.set(key, row);
  }
}
const results = [...rows.values()].map(row => ({...row, rate: row.successes / row.trials, expectedRate: row.probabilitySum / row.trials, meanAppearanceDistance: row.meanAppearanceDistance / row.trials}));
const report = {schema: 'genvo.reproductive-similarity-measurement/1', seedCount, seedStart, balanced, pairedDrawsAcrossProfilesAndAnatomies: true, attemptsPerPair: attempts, anatomyCombinations: legs, scope: 'Actual funded performCourtship and performedMateChoice under controlled favorable conditions. Reception only; no conception or long-horizon ecology claim. Independent founder identities and reproductive genomes are retained.', results, projectedCandidates: [...projected.values()].map(row => ({...row, rate: row.successes / row.trials, expectedRate: row.probabilitySum / row.trials})), projectionScope: 'Tool-only hypothesis using original reception draws; final runtime outcomes must be measured independently.'};
fs.mkdirSync(new URL('../../reports/', import.meta.url), {recursive: true}); fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify((candidates.length ? report.projectedCandidates.filter(row => row.distance === 'near' && ['founder', 'inherited'].includes(row.profile)) : results).map(({profile, distance, rate, expectedRate, meanAppearanceDistance}) => ({profile, distance, rate, expectedRate, meanAppearanceDistance})), null, 2));
