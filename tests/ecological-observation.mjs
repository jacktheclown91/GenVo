import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {summarizeObservation} from '../tools/summarize-observations.mjs';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {observeNaturalWorld,ecologicalObservation} from '../tools/ecological-observation.mjs';
const seed='OBSERVATION-DETERMINISM',plain=new Simulation(seed,{player:false}),observed=new Simulation(seed,{player:false});
while(plain.day<=2)plain.update(null);
const result=await observeNaturalWorld({sim:observed,days:2,checkpoints:[1,2],profilePhases:true});
const snapshot=s=>structuredClone(createSimulationSnapshot(s,{reason:'observation-parity',savedAt:'2000-01-01T00:00:00.000Z'}));
assert.deepEqual(snapshot(observed),snapshot(plain),'observation, profiling wrappers and yields preserve exact saved state');
assert.deepEqual(result.samples.map(row=>row.completedDays),[0,1,2],'explicit checkpoints include initial baseline and requested completed days');
assert.equal(result.checkedDays,2);assert.equal(result.final.day,3);assert.ok(result.final.phases.phaseSoil.calls>0);
const before=snapshot(observed);ecologicalObservation(observed);assert.deepEqual(snapshot(observed),before,'readout does not mutate biological state');
const extinct=new Simulation('OBSERVATION-EXTINCTION',{player:false}),initial=extinct.animals.filter(a=>a.alive).length;
for(const a of extinct.animals)if(a.alive)extinct.kill(a,'observation-fixture');
const extinction=await observeNaturalWorld({sim:extinct,days:1,initialPopulation:initial});
assert.equal(extinction.integrity,'pass');assert.equal(extinction.final.totalExtinction,true);assert.equal(extinction.final.deaths,initial);assert.ok(Object.values(extinction.final.wild).every(row=>row.alive===0&&row.evolved===0),'extinct species are explicitly recorded with zero counts');
const bad=new Simulation('OBSERVATION-CORRUPTION',{player:false});bad.world.plants.sunmoss[0]=NaN;
await assert.rejects(()=>observeNaturalWorld({sim:bad,days:1}),/invalid finite resource stock/);
assert.equal(Object.hasOwn(observed,'phaseSoil'),false,'profiling restores prototype methods');
console.log('Exact full-state observation parity; accounted extinction accepted; corrupted stock rejected PASS');

const temp=fs.mkdtempSync(path.join(os.tmpdir(),'genvo-observation-summary-'));
try{const file=path.join(temp,'partial.ndjson');fs.writeFileSync(file,JSON.stringify(result.samples[0])+'\n'+JSON.stringify(result.samples[1])+'\n'+ '{"incomplete":');const summary=summarizeObservation(file);assert.equal(summary.completed,false);assert.equal(summary.truncatedTail,true);assert.equal(summary.requestedHorizon,2);assert.equal(summary.integrity,'not completed; partial samples only');fs.appendFileSync(file,'\n');assert.throws(()=>summarizeObservation(file),'a malformed complete record is not ignored');}
finally{assert.equal(path.dirname(path.resolve(temp)),path.resolve(os.tmpdir()));fs.rmSync(temp,{recursive:true,force:true})}
