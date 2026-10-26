// Paired observed ecosystem consequences; no demographic acceptance targets.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {appearanceDistance} from '../src/reproduction/mate-preferences.js';
import {performedMateChoice} from '../src/reproduction/courtship-performance.js';
import {createSimulationSnapshot, restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const days = Number(process.env.GENVO_ECOLOGY_DAYS || 24);
const seeds = Number(process.env.GENVO_ECOLOGY_SEEDS || 4);
const output = process.argv[2] || 'reports/reproductive-similarity-ecology.json';
const snap = sim => structuredClone(createSimulationSnapshot(sim, {savedAt: 'fixed', reason: 'similarity-ecology'}));
const rows = [];
const modes = process.env.GENVO_ECOLOGY_MODES === 'balanced' ? [true] : [false, true];
for (let index = 0; index < seeds; index++) for (const balanced of modes) {
  const seed = `SIMILARITY-FIELD-${index}`;
  const sim = new Simulation(seed, {player: true, worldGenerator: 'planetary/1', regionalFrontier: true, courtshipSimilarity: balanced, dayClock: true, metabolism: true, foodProperties: true, tissueWater: true, winterWater: true, escapeLanding: true, tissueEnergy: true, perennialRegrowth: true});
  sim.setPlayerAutonomy(true);
  const observations = {completedDisplays: 0, mutuallyAcceptedDisplays: 0, conceptions: 0, crossTaxonConceptions: 0, appearanceDistanceSum: 0};
  const mate = sim.tryMate;
  sim.tryMate = function(a, b) {
    const reception = performedMateChoice(this, a, b);
    if (reception) { observations.completedDisplays++; observations.mutuallyAcceptedDisplays += Number(reception.accepted); }
    const sameTaxon = this.evolutionTree.sameTaxon(a, b);
    const distance = appearanceDistance(a, b, {assortment: true});
    const result = mate.call(this, a, b);
    if (result) { observations.conceptions++; observations.crossTaxonConceptions += Number(!sameTaxon); observations.appearanceDistanceSum += distance; }
    return result;
  };
  while (sim.day <= days && sim.player()?.alive) sim.update(null);
  const row = {seed, balanced, daysObserved: sim.day - 1, stoppedOnPlayerDeath: !sim.player()?.alive, tick: sim.tickCount, rng: sim.rng.state, population: sim.population(), stats: structuredClone(sim.stats), observations: structuredClone(observations), recognizedTaxa: [...sim.evolutionTree.nodes.values()].filter(node => node.id !== 'genvo8-root').length};
  const checkpoint = snap(sim), restored = restoreSimulationSnapshot(structuredClone(checkpoint));
  assert.deepEqual(snap(restored), checkpoint, 'actual field checkpoint restores exactly');
  for (let step = 0; step < 6; step++) { sim.update(null); restored.update(null); }
  assert.deepEqual(snap(restored), snap(sim), 'observed field world continues exactly after restore');
  row.exactContinuation = true; rows.push(row); console.log(JSON.stringify(row));
  fs.writeFileSync(output, JSON.stringify({schema: 'genvo.similarity-field-observation/1', requestedDays: days, seeds, scope: 'Actual untouched starting ecosystems and AUTO, no reserve/animal/trait injection. Canonical callbacks observed externally. Finite horizon, not speciation incidence or equilibrium proof.', rows}, null, 2) + '\n');
}
