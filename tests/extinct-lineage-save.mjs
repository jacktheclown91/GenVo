import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const snapshot=sim=>structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'extinct-lineage'}));
for(const modern of [false,true]){
  // Controlled death diagnostic, not a natural ecological acceptance run.
  const sim=new Simulation('SIMILARITY-LONG-0',{player:true,worldGenerator:'planetary/1',
    regionalFrontier:true,dayClock:modern,metabolism:modern,foodProperties:modern,
    tissueWater:modern,winterWater:modern,escapeLanding:modern,tissueEnergy:modern,perennialRegrowth:modern});
  sim.setPlayerAutonomy(true);
  const player=sim.player(),selected=sim.reproduction.selectedMate();
  assert.ok(player&&selected,'Normal bootstrap selects an existing compatible partner');
  assert.equal(sim.controllableFamily().length,1,'No replacement relative is staged');
  const rng=sim.rng.state,deaths=sim.stats.deaths;
  sim.kill(player,'controlled-save-diagnostic');
  assert.equal(sim.stats.deaths,deaths+1);
  assert.equal(sim.rng.state,rng,'Selection cleanup must consume no biology RNG');
  assert.equal(sim.playerId,null);
  assert.equal(sim.player(),null);
  assert.equal(sim.reproduction.selectedMateId,null,'No actor may retain a stale selected partner');
  assert.equal(sim.reproduction.courtTargetId,null);
  assert.deepEqual(sim.reproduction.ritualQueue,[]);
  const saved=snapshot(sim),restored=restoreSimulationSnapshot(structuredClone(saved));
  assert.deepEqual(snapshot(restored),saved,'Extinct-lineage restore is complete-state exact');
  for(let tick=0;tick<6;tick++){sim.update(null);restored.update(null)}
  assert.deepEqual(snapshot(restored),snapshot(sim),'Ecology continues exactly without a controlled lineage');

  // The long field failure surfaced once that formerly selected partner died:
  // restore already removes dead IDs, while the actorless live controller had
  // kept its stale ID indefinitely. New snapshots must agree in this case too.
  sim.kill(selected,'controlled-selected-partner-death');
  const terminal=snapshot(sim),terminalRestore=restoreSimulationSnapshot(structuredClone(terminal));
  assert.deepEqual(snapshot(terminalRestore),terminal,'Dead former partner cannot change restoration state');
  for(let tick=0;tick<6;tick++){sim.update(null);terminalRestore.update(null)}
  assert.deepEqual(snapshot(terminalRestore),snapshot(sim));

  // Retain historical saved selection fields on load; this is not a migration.
  // The correction prevents newly produced actorless snapshots retaining them.
  const historical=structuredClone(saved);
  historical.controllers.reproduction.selectedMateId=selected.id;
  const historicalRestore=restoreSimulationSnapshot(historical);
  assert.equal(historicalRestore.reproduction.selectedMateId,selected.id);
}
console.log('Extinct-lineage save PASS: real death cleanup, no RNG, original/modern clocks, complete restore and continued ecology, historical stale-selection compatibility.');
