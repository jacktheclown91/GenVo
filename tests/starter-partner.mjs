import assert from 'node:assert/strict';
import {Simulation,STARTER_PARTNER} from '../src/sim/simulation.js';

// starter-partner/1: a new game's default partner stands on the founder's own land,
// close enough to sense and court. These worlds placed it across water before the rule.
let stranded=0;
for(const seed of ['TUTORIAL-MATCHING-FOUNDERS','FIRST-PLAY-1','X1','X4','GENVO8-A','GENVO8-B','S9','S17']){
 const before=new Simulation(seed),bp=before.player(),bm=before.animals.find(a=>a.id===before.starterMateId);
 if(!before.world.sameLand(bp.x,bp.y,bm.x,bm.y))stranded++;
 const sim=new Simulation(seed,{starterPartner:STARTER_PARTNER.policy}),p=sim.player(),m=sim.animals.find(a=>a.id===sim.starterMateId);
 assert.ok(m&&m.alive&&m.species===p.species&&m.sex!==p.sex,`${seed}: an opposite-sex partner of the founder's species`);
 assert.ok(sim.world.sameLand(p.x,p.y,m.x,m.y),`${seed}: the partner shares the founder's landmass`);
 assert.ok(sim.reproduction.eligibleMates().some(a=>a.id===m.id),`${seed}: the partner is within sensing range`);
 assert.ok(sim.reproduction.courtshipAvailability({targetId:m.id}).enabled,`${seed}: courtship with the partner is available`);
}
assert.ok(stranded>=3,'the sample includes worlds whose original partner stood across water');
assert.throws(()=>new Simulation('X1',{starterPartner:'nearest-anywhere/9'}),/Unknown starter partner policy/);
console.log(`Starter partner PASS: same landmass, in sensing range and courtable in 8 worlds (${stranded} stranded before the rule); unknown policy refused`);
