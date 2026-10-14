import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {hasPart} from '../src/lineage/part-abilities.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {ENGINEER_COLONY} from '../src/ecology/engineer-colonies.js';

const sim=new Simulation('EM-LOCAL-BREEDING',{player:false});
const a=sim.animals.find(x=>x.species==='rootling'&&hasPart(x,'digging-forelimb'));
assert.ok(a,'needs anatomy-qualified existing animal');
const b=sim.animals.find(x=>x.species==='rootling'&&x.id!==a.id&&hasPart(x,'digging-forelimb'));
assert.ok(b);
sim.animals=[a,b];a.sex='F';b.sex='M';
for(const parent of [a,b]){parent.age=100;parent.reproCooldown=0;parent.energy=110;parent.health=100;parent.hydration=100;parent.pregnant=null;parent.parentIds=[];}
const at=(animal,x,y)=>{animal.x=x+.5;animal.y=y+.5;};
const observe=day=>{sim.day=day;sim.tickCount=day*CFG.dayTicks;sim.regionalEcology.observe();};
const A=sim.regionalEcology.keyAt(33,33),B=sim.regionalEcology.keyAt(65,33);
const rng=sim.rng.state,plants=structuredClone(sim.world.plants),seeds=structuredClone(sim.world.seedBank);
// Establish an actual local occupancy, vacancy, then return of one identified founder.
for(let day=1;day<=2;day++){at(a,33,33);at(b,65,33);observe(day);}
for(let day=3;day<=8;day++){at(a,65,33);observe(day);}
for(let day=9;day<=11;day++){at(a,33,33);observe(day);}
assert.equal(sim.regionalEcology.engineerTransitions(A).at(-1).type,'reoccupation');
const get=()=>sim.regionalEcology.engineerColonyEvidence(A).at(-1);
assert.equal(get().founderId,a.id);
// Confirm return and a local mating are separate events.
at(b,33,33);sim.day=12;
let success=sim.tryMate(a,b);
console.log('real tryMate?',success);
assert.equal(success,true,'must come from real mating, not manually fabricated conception');
assert.equal(get().observedMatings,1);
assert.equal(get().localBirths,0);
const beforeChild=sim.animals.length;
// Birth after a real gestation; no artificially conjured offspring in production.
sim.day=28;sim.tickCount=28*CFG.dayTicks;
const children=sim.giveBirth(a);
assert.ok(children.length>0);assert.ok(sim.animals.length>beforeChild);
assert.ok(children.every(c=>c.parentIds.includes(a.id)&&c.parentIds.includes(b.id)));
assert.equal(get().localBirths,children.filter(c=>hasPart(c,'digging-forelimb')).length);
assert.equal(get().recruited,0,'Birth != surviving recruitment');
for(let day=29;day<=28+ENGINEER_COLONY.juvenileResidenceDays;day++){sim.day=day;sim.tickCount=day*CFG.dayTicks;sim.regionalEcology.observe();}
assert.ok(get().recruited>0,'Identified, continuously resident young count as recruited');
assert.equal(get().multigenerationRecruits,0);
assert.equal(get().establishedDay,null,'One litter cannot be a sustained multi-generation colony');
assert.equal(sim.rng.state!==rng,true,'Actual mating/birth may use RNG');
assert.deepEqual(sim.world.plants,plants);
assert.deepEqual(sim.world.seedBank,seeds);
const evidence=get();evidence.births[0].parentIds[0]=-999;
assert.notEqual(get().births[0].parentIds[0],-999,'Evidence returns must be immutable copies');
const snap=createSimulationSnapshot(sim),loaded=restoreSimulationSnapshot(structuredClone(snap));
assert.deepEqual(loaded.regionalEcology.engineerColonyEvidence(A),sim.regionalEcology.engineerColonyEvidence(A));
// A separate local mating involving an ACTUAL recruited child tests the next generation.
// The prospective mate is a normal unrelated founder and must also be in-region.
const growing=children.find(c=>hasPart(c,'digging-forelimb'));
assert.ok(growing);
growing.age=90;growing.reproCooldown=0;growing.sex='F';growing.energy=110;growing.hydration=100;growing.health=100;
const outsider=sim.spawnAnimal('rootling',33.5,33.5);
outsider.sex='M';outsider.age=100;outsider.reproCooldown=0;outsider.energy=110;outsider.hydration=100;outsider.health=100;
assert.equal(sim.regionalEcology.noteMating(growing,{...outsider,x:65.5,y:33.5}),false,'Off-region mating cannot qualify');
// Use a real mating, not only the observer, to check that the reproduction
// controller and child parentId chain connect to the regional study.
sim.day=35;assert.equal(sim.tryMate(growing,outsider),true);
sim.day=51;sim.tickCount=51*CFG.dayTicks;
const grandchildren=sim.giveBirth(growing);
assert.ok(grandchildren.length>0,'Actual third generation born');
const beforeRecruit=get();
assert.equal(beforeRecruit.establishedDay,null,'Birth does not immediately establish a multigeneration colony');
for(let day=52;day<=51+ENGINEER_COLONY.juvenileResidenceDays;day++){sim.day=day;sim.tickCount=day*CFG.dayTicks;sim.regionalEcology.observe();}
assert.ok(get().multigenerationRecruits>0,'Recruited local offspring became a parent of recruited local descendants');
assert.ok(get().establishedDay>=52,'Colony established only after another generation remained resident');
const evidenceCopy=sim.regionalEcology.engineerTransitions(A);evidenceCopy.at(-1).breeding.relatedIds.splice(0);
assert.ok(sim.regionalEcology.engineerTransitions(A).at(-1).breeding.relatedIds.length>0,'Nested copies cannot mutate study');
const snap2=createSimulationSnapshot(sim),restored2=restoreSimulationSnapshot(structuredClone(snap2));
assert.deepEqual(restored2.regionalEcology.engineerColonyEvidence(A),sim.regionalEcology.engineerColonyEvidence(A));
console.log('real local mating + births + postnatal residence + next recruited generation + no false one-litter claim + save/restore: PASS',JSON.stringify({births:get().localBirths,recruited:get().recruited,multigenerationRecruits:get().multigenerationRecruits,establishedDay:get().establishedDay}));
