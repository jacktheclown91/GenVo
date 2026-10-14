import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {hasPart} from '../src/lineage/part-abilities.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const sim=new Simulation('EN-OPPORTUNITY',{player:false});
const founder=sim.animals.find(a=>a.species==='rootling'&&hasPart(a,'digging-forelimb'));
const mate=sim.animals.find(a=>a.species==='rootling'&&a.id!==founder.id);
assert.ok(founder&&mate);
sim.animals=[founder,mate];founder.sex='F';mate.sex='M';
for(const a of [founder,mate]){a.age=100;a.reproCooldown=0;a.energy=111;a.health=100;a.hydration=100;a.pregnant=null;a.parentIds=[];a.infected=false;}
const move=(a,x,y)=>{a.x=x+.5;a.y=y+.5;};
const sample=day=>{sim.day=day;sim.tickCount=day*CFG.dayTicks;sim.regionalEcology.observe();};
const r=sim.regionalEcology.keyAt(33,33);
move(founder,33,33);move(mate,65,33);sample(1);sample(2);
for(let day=3;day<=8;day++){move(founder,65,33);sample(day);}
for(let day=9;day<=11;day++){move(founder,33,33);sample(day);}
const get=()=>sim.regionalEcology.engineerColonyEvidence(r).at(-1).opportunity;
assert.equal(sim.regionalEcology.engineerTransitions(r).at(-1).type,'reoccupation');
assert.equal(get().observations,1);assert.equal(get().founderResidentDays,1);
assert.equal(get().mateResidentDays,0);
const rng=sim.rng.state,plant=structuredClone(sim.world.plants),seedBank=structuredClone(sim.world.seedBank);
move(mate,33,33);founder.intent='mate';sample(12);
assert.equal(get().observations,2);assert.equal(get().mateResidentDays,1);
assert.equal(get().mateReadyResidentDays,1);assert.equal(get().mutuallyReadyResidentDays,1);
assert.equal(get().founderMatePursuitDays,1);
sample(12);assert.equal(get().observations,2,'double day observation must not double-count');
founder.energy=10;sample(13);assert.equal(get().mutuallyReadyResidentDays,1,'energy-starved founders are not ready');
assert.equal(get().mateReadyResidentDays,2);
move(founder,65,33);sample(14);assert.equal(get().founderResidentDays,3,'founder residency ends at regional boundary');
assert.equal(get().founderAliveDays,4,'departed founder is alive but not local');
const copy=get();copy.mateResidentDays=-20;assert.notEqual(get().mateResidentDays,-20);
assert.equal(sim.rng.state,rng,'the new evidence must not consume RNG');
assert.deepEqual(sim.world.plants,plant);assert.deepEqual(sim.world.seedBank,seedBank);
const restored=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim)));
assert.deepEqual(restored.regionalEcology.engineerColonyEvidence(r),sim.regionalEcology.engineerColonyEvidence(r));
console.log('returnee residence, physiological mating opportunity, no false colony, daily idempotence, immutability, RNG/stocks, persistence: PASS',get());
