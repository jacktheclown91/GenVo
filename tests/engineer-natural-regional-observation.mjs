import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {hasPart} from '../src/lineage/part-abilities.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {checkEcologicalIntegrity} from '../tools/ecological-integrity.mjs';
// Live baseline: no translocations, mortality injection, population seeding, or dig suppression.
// This test does NOT require chance occurrence of true regional loss/return.
const seed=process.argv[2]||'NATURAL-ENGINEERS-B',limit=Number(process.argv[3]||110);
const sim=new Simulation(seed,{player:false}),initialPopulation=sim.animals.filter(a=>a.alive).length;
let lastDay=0,realDigs=0;
const original=sim.partAbilities.dig.bind(sim.partAbilities);
sim.partAbilities.dig=a=>{const result=original(a);if(result.ok){assert.ok(hasPart(a,'digging-forelimb'));realDigs++;}return result;};
while(sim.day<=limit){sim.update(null);if(lastDay!==sim.day){lastDay=sim.day;if(lastDay%30===0){console.log('natural EL day',lastDay);checkEcologicalIntegrity(sim,initialPopulation);}}}
const regions=[...sim.regionalEcology.records.values()];
const events=regions.flatMap(r=>sim.regionalEcology.engineerTransitions(r.key).map(e=>({region:r.key,...e})));
const vacancies=events.filter(e=>e.type==='vacancy'),returns=events.filter(e=>e.type==='reoccupation');
const workAfterReturn=returns.filter(e=>e.workSinceReturn>0);
assert.ok(realDigs>15,'Ordinary wildlife must produce actual anatomy-gated habitat work');
assert.ok(regions.some(r=>r.engineerSuccession?.everEstablished));
assert.ok(events.every(e=>e.day<=sim.day));
assert.ok(events.every(e=>e.type!=='reoccupation'||e.source==='observed-crossing'||e.source==='birth'||e.source==='unresolved'));
assert.ok(vacancies.length>0&&returns.length>0,`${seed}: demonstrate naturally unforced regional vacancy and sustained reoccupation`);
assert.ok(returns.some(e=>e.source==='observed-crossing'),`${seed}: at least one reoccupation must have observed movement evidence`);
assert.ok(workAfterReturn.length>0,`${seed}: naturally reoccupied regions must show subsequent completed work`);
const result={seed,days:limit,regions:regions.length,naturalDigs:realDigs,vacancies:vacancies.length,returns:returns.length,returnSource:returns.reduce((out,e)=>(out[e.source]=(out[e.source]||0)+1,out),{}),returnsWithLaterWork:workAfterReturn.length,returnsByGeneration:returns.reduce((out,e)=>(out[e.generation]=(out[e.generation]||0)+1,out),{}),exampleVacancies:vacancies.slice(0,4),exampleReturns:returns.slice(0,4)};
const saved=createSimulationSnapshot(sim),loaded=restoreSimulationSnapshot(structuredClone(saved));
assert.deepEqual(loaded.regionalEcology.records,sim.regionalEcology.records);
assert.deepEqual(loaded.regionalEcology.membership,sim.regionalEcology.membership);
console.log('natural regional occupancy observational run (NOT extinction/colony acceptance): PASS');console.log(JSON.stringify(result));
