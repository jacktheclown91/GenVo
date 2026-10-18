import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const current=new Simulation('WORLD-MODES',{player:false}),regional=new Simulation('WORLD-MODES',{player:false,worldGenerator:'coastal/1'});
assert.equal(current.world.n,128);assert.equal(regional.world.n,128);assert.equal(current.world.generator,'freshwater/1');assert.equal(current.world.environment,undefined);assert.equal(current.world.terrain.travelEnabled,false);
assert.ok(regional.world.environment);assert.equal(regional.world.terrain.travelEnabled,true);assert.notDeepEqual(current.world.water,regional.world.water);
for(const sim of [current,regional]){const saved=structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'modes'})),r=restoreSimulationSnapshot(saved);assert.equal(r.world.generator,sim.world.generator);assert.deepEqual(r.world.environment,sim.world.environment);assert.deepEqual(r.world.terrain,sim.world.terrain);assert.deepEqual(r.world.water,sim.world.water);}
assert.throws(()=>new Simulation('bad',{worldGenerator:'unknown/99'}));console.log('Versioned generators: established current-map default, explicit preserved coastal prototype, unchanged extent and exact saved model PASS');
