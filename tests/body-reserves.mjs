import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {METABOLISM,METABOLISM_REFERENCE_BODY,basalScale} from '../src/ecology/metabolism-policy.js';
import {basalResourceCosts,bodyMass} from '../src/organisms/body-mass.js';
import {BIO_STEPS_PER_DAY} from '../src/sim/day-clock.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// Own-body reserves (creator decision 2026-10-23, metabolism/fasting-2): every animal's resting cost is
// calibrated to its own body, so full reserves last 15 days of food and 3.5 of water at rest whatever
// its size or anatomy. Worlds saved under fasting-1 (reference body) keep it.
const make=metabolism=>new Simulation('GENVO8-TEST-A',{player:true,dayClock:true,metabolism,foodProperties:true,worldGenerator:'planetary/1'});
const days=(sim,a)=>{const b=basalResourceCosts(a),k=basalScale(sim,a),s=SPECIES[a.species];return{food:s.maxEnergy/(b.energy*k.energy*BIO_STEPS_PER_DAY),water:s.maxHydration/(b.water*k.water*BIO_STEPS_PER_DAY)}};
{
 const sim=make(true);assert.equal(sim.metabolismRules,METABOLISM.policy);let heavy=0;
 for(const a of sim.animals.filter(x=>x.alive)){const d=days(sim,a);assert.ok(Math.abs(d.food-15)<1e-6&&Math.abs(d.water-3.5)<1e-6,a.species+' lasts '+d.food.toFixed(2)+' / '+d.water.toFixed(2)+' days');if(bodyMass(a)>SPECIES[a.species].mass*1.2)heavy++}
 assert.ok(heavy>10,'the check covers bodies well above their species reference: '+heavy);
}
{
 const ref=make('fasting-1');assert.equal(ref.metabolismRules,METABOLISM_REFERENCE_BODY);
 const a=ref.animals.filter(x=>x.alive&&!x.player).sort((p,q)=>bodyMass(q)/SPECIES[q.species].mass-bodyMass(p)/SPECIES[p.species].mass)[0];
 assert.ok(days(ref,a).food<13,'under fasting-1 a heavy wild body lasts less: '+days(ref,a).food.toFixed(1)+' days');
 const back=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(ref,{savedAt:'t',reason:'t'})));assert.equal(back.metabolismRules,METABOLISM_REFERENCE_BODY,'fasting-1 saves keep their rule');
 const now=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(make(true),{savedAt:'t',reason:'t'})));assert.equal(now.metabolismRules,METABOLISM.policy);
}
console.log('Body reserves PASS: every body lasts 15 days of food and 3.5 of water at rest, fasting-1 saves keep the reference body.');
