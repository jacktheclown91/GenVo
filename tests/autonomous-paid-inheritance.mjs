import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {setProto} from '../src/lineage/readings.js';
import {SPECIES} from '../src/organisms/species.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const sim=new Simulation('AUTONOMOUS-PAID-INHERITANCE',{player:false,bootstrap:false,autonomousPopulations:true,autonomousEvolution:true});
const baselinePlayerGeneration=sim.lineage.highestGeneration;
const point=sim.safeSpawn('mosskip',sim.pickHabitatCenter('mosskip')),founders=[];
for(let n=0;n<4;n++){
 const a=sim.spawnAnimal('mosskip',point.x,point.y);a.sex=n%2?'M':'F';a.age=SPECIES.mosskip.maturity+2;
 a.energy=SPECIES.mosskip.maxEnergy;a.hydration=SPECIES.mosskip.maxHydration;a.reproCooldown=0;founders.push(a);
}
sim.rebuildSpatial();sim.populationMemory.observeResidence();sim.populationMemory.advanceDay();
const records=[...sim.populationMemory.natural.records.values()];
const pop=records.find(p=>p.scope==='regional-source');assert.ok(pop,'Controlled actual source candidate created by population authority');
// Stage establishment only to test downstream birth evidence; not a founding claim.
pop.status='established';pop.establishedDay=sim.day;
const mother=founders[0],father=founders[1],before=[mother.energy,father.energy];
const gate=sim.conceptionAvailability(mother,father);assert.ok(gate.enabled,gate.reason);
const result=sim.tryMate(mother,father);
assert.ok(result,'This fixed controlled pair must actually accept through canonical deterministic choice');
assert.ok(mother.pregnant);assert.ok(mother.energy<before[0]||father.energy<before[1]);
assert.equal(mother.pregnant.paternalInheritance.evolutionaryPopulationAtConception.key,pop.key);
assert.equal(mother.pregnant.maternalInheritance.evolutionaryPopulationAtConception.key,pop.key);
const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'paid-autonomous-inheritance'}));
const badWitness=snap(sim);badWitness.animals.find(a=>a.id===mother.id).pregnant.paternalInheritance.evolutionaryPopulationAtConception.rules='unknown/1';assert.throws(()=>restoreSimulationSnapshot(badWitness),/Invalid saved conception population/);
const restored=restoreSimulationSnapshot(snap(sim));assert.deepEqual(snap(restored),snap(sim));
let ticks=0;while(ticks<1200&&sim.stats.births===0){sim.update(null);ticks++}
assert.ok(sim.stats.births>0,'Actual paid gestation must complete through normal biological ticks');
const child=sim.animals.find(a=>a.parentIds.includes(mother.id)&&a.parentIds.includes(father.id));assert.ok(child);
assert.equal(child.lineage,false);assert.ok(child.protoHistory?.physical);assert.equal(child.evolutionaryAncestry.rootId,'founding:mosskip');
assert.equal(sim.lineage.records.size,0);assert.ok(sim.speciation.births.some(e=>e.childId===child.id));
const badAncestry=snap(sim);badAncestry.animals.find(a=>a.id===child.id).evolutionaryAncestry.rootId='unknown-root';assert.throws(()=>restoreSimulationSnapshot(badAncestry),/Invalid saved evolutionary ancestry/);
const badPhysical=snap(sim);badPhysical.animals.find(a=>a.id===child.id).protoHistory.physical.rules='unknown/1';assert.throws(()=>restoreSimulationSnapshot(badPhysical),/Invalid saved inherited physical/);
const afterRestore=restoreSimulationSnapshot(snap(sim));assert.deepEqual(snap(afterRestore),snap(sim));
for(let n=0;n<12;n++){sim.update(null);afterRestore.update(null)}assert.deepEqual(snap(afterRestore),snap(sim));
const receipt={scope:'Controlled four-founder world, adult positions/reserves and establishment staged; actual unfaked acceptance, paid gestation, normal tick birth and exact saves.',ticks,births:sim.stats.births,childId:child.id,sourceKey:pop.key,flow:sim.speciation.geneFlowFor(pop.key),pregnancySavedExactly:true,birthSavedAndContinuedExactly:true};
assert.equal(receipt.flow.local,receipt.births,'Every actual paid child retains its source-level local conception');
// Separate recognition-persistence fixture, not natural qualification evidence.
const stocks=founders.map(a=>[a.energy,a.hydration]),rng=sim.rng.state;
for(const a of founders)setProto(a,{id:'dryland-skin',strength:.55,lineageDepth:3});
const state=sim.speciation.ensureState(pop),branch=sim.speciation.recognize({state,pop,
  trait:{id:'dryland-skin',pressure:'dryness'},axis:{id:'dryness'},cohort:founders});
assert.deepEqual(founders.map(a=>[a.energy,a.hydration]),stocks);assert.equal(sim.rng.state,rng,'Identity adds no resource or RNG benefit');
assert.equal(sim.lineage.records.size,0);assert.equal(sim.lineage.highestGeneration,baselinePlayerGeneration);
const savedRecognition=snap(sim),loadedRecognition=restoreSimulationSnapshot(structuredClone(savedRecognition));
assert.deepEqual(snap(loadedRecognition),savedRecognition,'Recognized unowned identity and full real biological state restore exactly');
assert.equal(loadedRecognition.evolutionTree.taxonFor(loadedRecognition.animals.find(a=>a.id===mother.id)),branch.id);
const forgedIdentity=structuredClone(savedRecognition);forgedIdentity.animals.find(a=>a.id===mother.id).speciesBranch.id='invented-species';
assert.throws(()=>restoreSimulationSnapshot(forgedIdentity),/authoritative tree history/);
console.log('Actual paid autonomous inheritance PASS: canonical acceptance, 576 normal ticks of gestation, unowned births, recorded conception source and exact pregnancy/birth continuation.');
