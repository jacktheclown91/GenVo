import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {checkEcologicalIntegrity} from '../tools/ecological-integrity.mjs';
// Unmodified wildlife; this assay MUST NOT force population, conception,
// births, resources, travel or habitat engineering. Zero colonies is an honest
// finding, NOT test failure. Confirm receipts agree with actual anatomy and ID.
const seed=process.argv[2]||'NATURAL-ENGINEERS-A';
const limit=Number(process.argv[3]||130);
const sim=new Simulation(seed,{player:false});
let lastDay=0;
while(sim.day<=limit){sim.update(null);if(lastDay!==sim.day){lastDay=sim.day;if(lastDay%30===0){console.log('EM wildlife day',lastDay);checkEcologicalIntegrity(sim,132);}}}
const evidence=[...sim.regionalEcology.records.values()].flatMap(r=>sim.regionalEcology.engineerColonyEvidence(r.key).map(e=>({key:r.key,...e})));
for(const e of evidence){
  assert.ok(e.localBirths>=e.recruited);
  assert.ok(e.recruited>=e.multigenerationRecruits);
  assert.ok(e.observedMatings>0||e.localBirths===0,'No birth can occur without an observed mating');
  assert.ok(e.localBirths>0||e.recruited===0);
  assert.ok(e.establishedDay===null||e.multigenerationRecruits>0);
  assert.ok(e.births.every(b=>b.conceptionDay>=e.day&&b.day>=b.conceptionDay));
  const o=e.opportunity;assert.ok(o.observations>=o.founderAliveDays&&o.founderAliveDays>=o.founderResidentDays);
  assert.ok(o.founderResidentDays>=o.founderPhysiologicallyReadyDays);
  assert.ok(o.mateResidentDays>=o.mateReadyResidentDays&&o.mateResidentDays<=o.founderResidentDays);
  assert.ok(o.mutuallyReadyResidentDays<=o.mateReadyResidentDays&&o.mutuallyReadyResidentDays<=o.founderPhysiologicallyReadyDays);
  assert.ok(o.founderMatePursuitDays<=o.founderResidentDays);
}
const outcome={seed,days:limit,regionalReturns:evidence.length,returnerMatings:evidence.reduce((a,e)=>a+e.observedMatings,0),locallyBorn:evidence.reduce((a,e)=>a+e.localBirths,0),survivingRecruits:evidence.reduce((a,e)=>a+e.recruited,0),nextGenerationRecruits:evidence.reduce((a,e)=>a+e.multigenerationRecruits,0),historicallyEstablished:evidence.filter(e=>e.establishedDay!==null).length};
const saved=createSimulationSnapshot(sim),loaded=restoreSimulationSnapshot(structuredClone(saved));
assert.deepEqual(loaded.regionalEcology.records,sim.regionalEcology.records);
assert.deepEqual(loaded.regionalEcology.membership,sim.regionalEcology.membership);
assert.deepEqual([...loaded.regionalEcology.records.values()].flatMap(r=>loaded.regionalEcology.engineerColonyEvidence(r.key)),[...sim.regionalEcology.records.values()].flatMap(r=>sim.regionalEcology.engineerColonyEvidence(r.key)));
console.log('natural reproduction receipts, resource integrity, save persistence (not colony success guarantee): PASS');
outcome.returnOpportunity=[...evidence].reduce((a,e)=>{for(const [key,value] of Object.entries(e.opportunity))if(key!=='lastObservationDay')a[key]=(a[key]||0)+value;return a;},{});
console.log(JSON.stringify(outcome));
