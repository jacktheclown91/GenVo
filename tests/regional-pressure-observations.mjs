import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {pressureHistoryProfile,recordRegionalPressureObservation,regionalPressureObservation,
  validateRegionalPressureObservations} from '../src/ecology/population-profile.js';

const history={key:'home',days:1,firstDay:1,lastDay:1,
  exposure:{cold:.8},recent:{cold:.2},peak:{cold:.8}};
recordRegionalPressureObservation(history);
const first=structuredClone(regionalPressureObservation(history,1));
recordRegionalPressureObservation(history);
assert.equal(history.regionalObservations.length,1,'Repeated observation cannot create another day');
history.days=2;history.lastDay=2;history.exposure.cold=1;
recordRegionalPressureObservation(history);
assert.deepEqual(regionalPressureObservation(history,1),first,'Previous actual mean is retained');
assert.equal(regionalPressureObservation(history,2).axes.find(a=>a.id==='cold').mean,.5);
validateRegionalPressureObservations(history);
const borrowed=regionalPressureObservation(history,1);borrowed.axes[0].mean=0;
assert.deepEqual(regionalPressureObservation(history,1),first,'Consumers cannot rewrite observations');
history.days=3;history.lastDay=4;history.exposure.cold=1.2;
recordRegionalPressureObservation(history);
assert.deepEqual(history.regionalObservations.map(row=>row.day),[2,4]);
assert.equal(regionalPressureObservation(history,1),null,'Bounded history releases old observations');
assert.equal(regionalPressureObservation(history,3),null,'Missing biological days cannot be reconstructed');
assert.equal(regionalPressureObservation(history,5),null);
validateRegionalPressureObservations(history);
const legacy=structuredClone(history);delete legacy.regionalObservations;
assert.deepEqual(regionalPressureObservation(legacy,4).axes,pressureHistoryProfile(legacy).axes);
assert.equal(regionalPressureObservation(legacy,2),null,'Old cumulative records do not imply old observations');
for(const damage of [
  h=>h.days=NaN,
  h=>h.firstDay=0,
  h=>h.lastDay=Infinity,
  h=>h.regionalObservations.push(h.regionalObservations[0]),
  h=>h.regionalObservations.reverse(),
  h=>h.regionalObservations[0].day=0,
  h=>h.regionalObservations[0].profile.key='other',
  h=>h.regionalObservations[0].profile.days=100,
  h=>h.regionalObservations[0].profile.axes[0].mean=NaN,
  h=>h.regionalObservations[0].profile.axes[0].id='invented',
  h=>h.regionalObservations[0].profile.axes.reverse(),
  h=>h.regionalObservations[1].profile.axes[0].mean=.99,
]){
  const corrupt=structuredClone(history);damage(corrupt);
  assert.throws(()=>validateRegionalPressureObservations(corrupt),/regional pressure observation/);
}

// Use the actual daily controller and save transport, without changing ecology,
// population membership, reproduction or any species-recognition threshold.
const sim=new Simulation('REGIONAL-OBSERVATIONS',{autonomousPopulations:true,autonomousEvolution:true});
while(sim.day<4)sim.update(null);
assert.ok(sim.populationMemory.histories.size>0);
for(const h of sim.populationMemory.histories.values()){
  assert.ok(h.regionalObservations.length<=2);validateRegionalPressureObservations(h);
}
const snapshot=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'pressure-observations'}));
const saved=snapshot(sim);
assert.deepEqual(snapshot(restoreSimulationSnapshot(saved)),saved,'Actual recorded observations restore exactly');
const current=sim.populationMemory.histories.values().next().value;
current.regionalObservations[0].profile.key='corrupt-owner';
assert.throws(()=>restoreSimulationSnapshot(snapshot(sim)),/regional pressure observation/,
  'Canonical save restoration refuses corrupt biological evidence');
console.log('Regional pressure observations PASS: actual bounded days, independent reads, no backdating, validation and canonical save restoration.');
