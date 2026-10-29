// Autonomous size evolution (morphology S8). Inherited size enters the same
// inherited-physical evidence as anatomy (inherited-parts-size/1, body-size/2
// worlds): each body carries an ancestral baseline size, and a lineage whose
// inherited size has moved from it by ~12% or more reads as a larger- or
// smaller-body divergence whose lineage depth grows across generations. Evolved
// library entries carry their cohort's size so founders keep it. Nothing assigns
// a size; worlds with inherited-parts/1 are unchanged.
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {INHERITED_PARTS,INHERITED_PARTS_SIZE,recordInheritedPhysicalEvidence,inheritedPhysicalReadings,physicalTraitMeta} from '../src/lineage/inherited-anatomy-evidence.js';
import {evolvedFounderSize,adultSizeScale,GIANT_SIZE} from '../src/organisms/body-size.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {RNG} from '../src/core/rng.js';
import {entryFromCohort,libraryFoundingTemplates} from '../src/lineage/evolved-library.js';

const plan=founderPlan(),body=(id,s)=>({id,bodyPlan:plan,bodySize:{schema:1,alleles:[Math.log(s),Math.log(s)]}});
const pop={key:'p',label:'Population'};
// 1. Size divergence is read against inherited ancestry and deepens across generations.
{
 const [g1,g2]=[body(1,1),body(2,1)];
 const p1=body(3,1.3),p2=body(4,1.3);recordInheritedPhysicalEvidence(p1,[g1,g2],pop,10,{size:true});recordInheritedPhysicalEvidence(p2,[g1,g2],pop,10,{size:true});
 assert.equal(p1.protoHistory.physical.rules,INHERITED_PARTS_SIZE);assert.equal(p1.protoHistory.physical.baselineSize,0,'ancestral baseline is the grandparents');
 const r1=inheritedPhysicalReadings(p1).find(r=>r.id==='size:larger');assert.ok(r1&&r1.lineageDepth===1&&Math.abs(r1.strength-Math.log(1.3)/Math.LN2)<1e-12,'a 1.3x lineage reads as a larger body');
 const child=body(5,1.28);recordInheritedPhysicalEvidence(child,[p1,p2],pop,40,{size:true});
 const r2=inheritedPhysicalReadings(child).find(r=>r.id==='size:larger');assert.ok(r2&&r2.lineageDepth===2,'the divergence persists and deepens');assert.equal(child.protoHistory.physical.baselineSize,0,'baseline stays ancestral');
 // A change under the floor (~12%) is not a divergence; smaller bodies read the other way.
 const near=body(6,1.08);recordInheritedPhysicalEvidence(near,[g1,g2],pop,10,{size:true});assert.ok(!inheritedPhysicalReadings(near).some(r=>r.id.startsWith('size:')));
 const small=body(7,.7);recordInheritedPhysicalEvidence(small,[g1,g2],pop,10,{size:true});assert.ok(inheritedPhysicalReadings(small).some(r=>r.id==='size:smaller'));
 assert.equal(physicalTraitMeta('size:larger').label,'Larger body');assert.equal(physicalTraitMeta('size:bigger'),null);
 // Without the size rule the evidence is exactly the parts evidence.
 const plain=body(8,1.3);recordInheritedPhysicalEvidence(plain,[g1,g2],pop,10);assert.equal(plain.protoHistory.physical.rules,INHERITED_PARTS);assert.equal(plain.protoHistory.physical.baselineSize,undefined);
 assert.ok(!inheritedPhysicalReadings(plain).some(r=>r.id.startsWith('size:')));
}
// 2. Real births in a body-size/2 world with autonomous evolution record size evidence and save it.
{
 const sim=new Simulation('SIZE-EVOLUTION',{player:true,dayClock:true,metabolism:true,bodySize:GIANT_SIZE.policy,autonomousPopulations:true,autonomousEvolution:true});
 const sp=sim.player().species,[m,f]=sim.animals.filter(a=>a.species===sp&&a.bodyPlan).slice(0,2);
 const kid=sim.spawnFundedOffspring(m,f,[m,f],{count:1,x:m.x,y:m.y,energyBudget:40,hydrationBudget:40})[0];assert.equal(kid.protoHistory?.physical?.rules,INHERITED_PARTS_SIZE,'births record size-aware evidence');assert.ok(Number.isFinite(kid.protoHistory.physical.baselineSize));
 const snap=structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'size-evolution'}));
 const back=restoreSimulationSnapshot(structuredClone(snap));assert.equal(back.animals.find(a=>a.id===kid.id).protoHistory.physical.baselineSize,kid.protoHistory.physical.baselineSize);
 const bad=structuredClone(snap);bad.animals.find(a=>a.id===kid.id).protoHistory.physical.baselineSize=NaN;assert.throws(()=>restoreSimulationSnapshot(bad),/inherited physical evidence/);
 const mixed=structuredClone(snap);Object.assign(mixed.animals.find(a=>a.id===kid.id).protoHistory.physical,{rules:INHERITED_PARTS});assert.throws(()=>restoreSimulationSnapshot(mixed),/inherited physical evidence/);
 const old=new Simulation('SIZE-EVOLUTION',{player:true,dayClock:true,metabolism:true,bodySize:true,autonomousPopulations:true,autonomousEvolution:true}),[om,of]=old.animals.filter(a=>a.species===sp&&a.bodyPlan).slice(0,2);
 assert.equal(old.spawnFundedOffspring(om,of,[om,of],{count:1,x:om.x,y:om.y,energyBudget:40,hydrationBudget:40})[0].protoHistory?.physical?.rules,INHERITED_PARTS,'body-size/1 worlds keep parts-only evidence');
}
// 3. Evolved configurations keep their size: founders draw around the cohort's recorded mean and spread.
{
 const rng=new RNG('library-size'),mean=Math.log(1.6),sd=.04,founders=Array.from({length:200},()=>evolvedFounderSize(rng,{mean,sd},GIANT_SIZE.policy));
 const logs=founders.flatMap(f=>f.alleles),avg=logs.reduce((t,v)=>t+v,0)/logs.length,dev=Math.sqrt(logs.reduce((t,v)=>t+(v-avg)**2,0)/logs.length);
 assert.ok(Math.abs(avg-mean)<.01&&Math.abs(dev-sd)<.01,`founders centred on the evolved size: mean ${Math.exp(avg).toFixed(3)}x, sd ${dev.toFixed(3)}`);
 assert.ok(founders.every(f=>adultSizeScale({bodySize:f})<=GIANT_SIZE.maxScale+1e-9));
 // A real entry built from a sized cohort records the cohort's size, and its founding template carries it.
 const sim=new Simulation('SIZE-LIBRARY',{player:true,dayClock:true,metabolism:true,bodySize:GIANT_SIZE.policy}),sp=sim.animals.find(a=>!a.player&&a.bodyPlan).species;
 const cohort=sim.animals.filter(a=>a.alive&&a.species===sp&&a.bodyPlan?.id===sim.animals.find(b=>!b.player&&b.species===sp&&b.bodyPlan).bodyPlan.id);
 const entry=entryFromCohort(sim,cohort);assert.ok(Number.isFinite(entry.traits.bodySize?.mean)&&Number.isFinite(entry.traits.bodySize?.sd),'library entries record cohort size');
 sim.foundingLibrary=[entry];const t=libraryFoundingTemplates(sim)[0];assert.deepEqual({...t.bodySize},{mean:entry.traits.bodySize.mean,sd:entry.traits.bodySize.sd});
}
console.log('Size evolution PASS: inherited size read against ancestral baseline (larger/smaller, ~12% floor, deepening lineage), real births record and save size-aware evidence, body-size/1 keeps parts-only evidence, evolved configurations found at their recorded size');
