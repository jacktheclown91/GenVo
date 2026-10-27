// Diagnostic only: reserve-gain lower bounds are not a replacement food or
// maintenance authority. Full state must match the prior frozen ordinary run.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {breedingNeed,BREEDING_SUPPORT} from '../src/ecology/breeding-support.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {snapshotSignature} from './snapshot-signature.mjs';
import {installFoundingObservation} from './founding-observation.mjs';
const [referenceFile,out]=process.argv.slice(2);
assert.ok(referenceFile&&out&&!fs.existsSync(out));
const reference=JSON.parse(fs.readFileSync(referenceFile,'utf8'));
assert.equal(reference.status,'complete');assert.equal(reference.verificationOnly,false);
assert.equal(reference.node,process.version,'The complete-state reference must use this Node engine');
const sim=new Simulation(reference.seed,reference.options);sim.setPlayerAutonomy(true);
const founding=installFoundingObservation(sim),income=new Map(),examples=[];
let previous=new Map(sim.animals.filter(a=>a.alive).map(a=>[a.id,{energy:a.energy,adult:a.age>=SPECIES[a.species].maturity}]));
const begin=performance.now();
while(sim.day<=reference.requestedDays){
 const day=sim.day;sim.update(null);
 if(sim.tickCount%CFG.lifeStride===0){
  let rows=income.get(day);if(!rows){rows=new Map();income.set(day,rows)}
  const next=new Map();
  for(const animal of sim.animals){
   if(!animal.alive)continue;
   const adult=animal.age>=SPECIES[animal.species].maturity,old=previous.get(animal.id);
   if(adult&&old?.adult){const gain=Math.max(0,animal.energy-old.energy);if(gain)rows.set(animal.id,(rows.get(animal.id)||0)+gain)}
   next.set(animal.id,{energy:animal.energy,adult});
  }
  previous=next;
 }
 if(sim.day!==day&&day>=8){
  const animals=new Map(sim.animals.filter(a=>a.alive).map(a=>[a.id,a]));
  for(const near of founding.diagnostics.nearMisses.filter(row=>row.day===day&&!row.gates.resources)){
   const record=sim.populationMemory.natural.records.get(near.key),supported=[];
   for(const id of record.memberIds){
    const animal=animals.get(id);if(!animal||animal.age<SPECIES[animal.species].maturity)continue;
    let observed=0;for(let d=day-7;d<=day;d++)observed+=income.get(d)?.get(id)||0;
    const required=breedingNeed(animal,sim)/BREEDING_SUPPORT.reproductiveMargin*8;
    if(observed>=required)supported.push({id,species:animal.species,observed,required,
     energy:animal.energy,health:animal.health,hydration:animal.hydration,
     parts:animal.bodyPlan?.nodes.map(n=>n.partId)||[]});
   }
   examples.push({day,key:near.key,members:near.members,recruits:near.recruits,litters:near.litters,
    continuityDays:near.continuityDays,projectedSupportedAdults:near.supportedAdults,
    observedReserveSupportedAdults:supported});
  }
  for(const d of income.keys())if(d<day-7)income.delete(d);
 }
}
founding.remove();
const signature=snapshotSignature(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'natural-evolution'}));
const report={scope:'Passive adult positive-reserve-change lower bounds across life strides. Costs within a stride can hide intake. These are reserve observations, not certified meal receipts or a new resource rule.',
 reference:referenceFile,referenceSha256:createHash('sha256').update(fs.readFileSync(referenceFile)).digest('hex'),
 seed:reference.seed,days:reference.requestedDays,ticks:sim.tickCount,births:sim.stats.births,examples,
 completeStateSha256:signature,expectedStateSha256:reference.completeStateSha256,
 completeStateEqual:signature===reference.completeStateSha256,seconds:(performance.now()-begin)/1000};
fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
assert.equal(report.completeStateEqual,true,'Passive maintenance measurement must preserve the complete frozen ecosystem');
console.log(JSON.stringify({seed:report.seed,ticks:report.ticks,births:report.births,completeStateEqual:report.completeStateEqual,
 resourceNearMisses:examples.length,withTwoObservedBudgetAdults:examples.filter(row=>row.observedReserveSupportedAdults.length>=2).length}));
