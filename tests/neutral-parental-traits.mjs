import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {setProto,setForm,protoReading,formReading} from '../src/lineage/readings.js';
import {paternalInheritance} from '../src/ecology/gestation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const sim=new Simulation('NEUTRAL-PARENT-TRAITS',{player:false,bootstrap:false});
const mother=sim.spawnAnimal('genvo',32,32),father=sim.spawnAnimal('genvo',33,32);
for(const p of [mother,father]){setProto(p,{id:'dryland-skin',strength:.55,populationKey:'ancestral',populationLabel:'Ancestral',originPopulationKey:'ancestral',lineageDepth:2});setForm(p,{kind:'forager',strength:.6,sourceGeneration:1});p.sex=p===mother?'F':'M';p.age=40;p.energy=100;p.hydration=100}
const state=sim.rng.state;assert.ok(sim.protoSpeciation.candidateFor({generation:1},[mother,father]));assert.equal(sim.rng.state,state,'candidate inspection is read-only');
const snapshot=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'neutral-parental'})),base=snapshot(sim),rows=[];
for(const lineage of [false,true])for(const generation of [1,8])for(const context of ['cold','predation']){
 const s=restoreSimulationSnapshot(structuredClone(base)),[m,f]=s.animals;
 for(const p of [m,f]){p.lineage=lineage;p.generation=generation}
 s.protoSpeciation.sourcePopulationFor=()=>({key:context,label:context});
 s.pressure.lifetimeSummary=()=>[{kind:context,score:100}];
 s.tendency.snapshot=()=>{throw Error('learned behavior used as germline instruction')};
 const [child]=s.spawnFundedOffspring(m,f,[m,f],{count:1,x:32,y:32,energyBudget:12,hydrationBudget:12});
 const proto=protoReading(child),form=formReading(child);
 assert.equal(proto.id,'dryland-skin');assert.equal(proto.strength,.55);assert.equal(form.kind,'forager');assert.equal(form.strength,.6);
 rows.push({genes:child.genes,anatomy:child.anatomy,body:child.bodyPlan,rng:s.rng.state});
}
for(const row of rows)assert.deepEqual(row,rows[0],'generation, location, pressure and lineage flags cannot direct inherited physiology');
const s=restoreSimulationSnapshot(structuredClone(base)),[m,f]=s.animals;
m.pregnant={fatherId:f.id,paternalInheritance:paternalInheritance(f),maternalInheritance:paternalInheritance(m),mode:'live',days:0,plannedLitterSize:1,birthCost:34,reserveInvestment:0};
for(const p of [m,f]){setProto(p,{id:'cold-mantle',strength:.25});setForm(p,{kind:'colony',strength:.3})}
s.kill(f,'fixture-parent-death');
const loaded=restoreSimulationSnapshot(snapshot(s)),liveMother=loaded.animals.find(a=>a.id===m.id),[child]=loaded.giveBirth(liveMother);
assert.ok(child);assert.equal(protoReading(child).id,'dryland-skin');assert.equal(protoReading(child).strength,.55);assert.equal(formReading(child).kind,'forager');assert.equal(formReading(child).strength,.6,'conception state governs even after live parent changes/death and restore');
const resumed=restoreSimulationSnapshot(snapshot(loaded));for(let i=0;i<12;i++){loaded.update(null);resumed.update(null)}assert.deepEqual(snapshot(loaded),snapshot(resumed));
const previous=structuredClone(base);previous.core.birthRules={schema:1,inheritedVariation:'neutral-core/1',populationTraits:'legacy-pressure/1',anatomyProjection:'legacy-axis/1'};const oldAnimals=structuredClone(previous.animals),oldRng=previous.rngState;
const upgraded=restoreSimulationSnapshot(previous);assert.deepEqual(upgraded.animals,oldAnimals);assert.equal(upgraded.rng.state,oldRng);assert.equal(upgraded.birthRules.populationTraits,'neutral-parental/1');assert.equal(upgraded.birthRuleMigrations.length,1);
assert.deepEqual(snapshot(restoreSimulationSnapshot(snapshot(upgraded))),snapshot(upgraded),'partial-policy upgrade is idempotent');
console.log('neutral parental traits: shared context-independent physiology, frozen parental state after death/change, exact resume and partial-policy migration PASS');
