import assert from 'node:assert/strict';
import {ProtoSpeciationController} from '../src/lineage/proto-speciation.js';
import {SpeciationController} from '../src/lineage/speciation.js';
import {EvolutionaryTreeController} from '../src/lineage/evolution-tree.js';
import {AUTONOMOUS_EVOLUTION} from '../src/lineage/autonomous-evolution.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {paternalInheritance} from '../src/ecology/gestation.js';
import {conceptionPopulationEvidence} from '../src/lineage/population-birth-evidence.js';

// Controlled reachability fixture: bodies, maturity, demography, paid-birth
// witnesses and ten days of profiles are staged. This is NOT a natural field.
function fixture(){
  const source={key:'natural:source',kind:'autonomous',scope:'regional-source',species:'mosskip',
    x:0,y:0,label:'Ancestral source',memberIds:new Set()};
  const local={key:'natural:local',kind:'autonomous',scope:'local',sourcePopulationKey:source.key,
    species:'mosskip',x:40,y:0,label:'Separated deme',memberIds:new Set()};
  const unrelated={key:'natural:unrelated',kind:'autonomous',scope:'regional-source',species:'rootling',
    x:80,y:0,label:'Unrelated rootling source',memberIds:new Set()};
  const populations=[source,local,unrelated];let nextId=1,converged=false;
  const axes=['scarcity','competition','predation','crowding','dryness','wetness','heat','cold'];
  const profile=key=>({days:10,axes:axes.map(id=>({id,label:id,mean:key===local.key&&!converged&&['scarcity','dryness','heat'].includes(id)?.9:.1}))});
  const sim={autonomousEvolutionRules:AUTONOMOUS_EVOLUTION.policy,autonomousPopulationRules:'autonomous-populations/3',
    day:20,tickCount:800,animals:[],lineage:{highestGeneration:1,records:new Map()},
    rng:{next(){throw Error('Recognition must not consume biological RNG')}},
    populationMemory:{populations:()=>populations,populationByKey:key=>populations.find(p=>p.key===key),
      populationForAnimal:a=>populations.find(p=>p.key===a.currentPopulation),
      profile,snapshots:()=>populations.map(population=>({population,profile:profile(population.key)}))}};
  sim.evolutionTree=new EvolutionaryTreeController(sim);sim.protoSpeciation=new ProtoSpeciationController(sim);sim.speciation=new SpeciationController(sim);
  function body(pop,leg='walking-leg',parents=[]){
    const a={id:nextId++,alive:true,lineage:false,species:pop.species,x:pop.x,y:0,age:100,
      generation:parents.length?Math.max(...parents.map(p=>p.generation))+1:1,genes:{body:1,motion:1,senses:1},
      anatomy:{},currentPopulation:pop.key,bodyPlan:makePlan([{partId:'soft-torso',parent:null,socket:null},
        {partId:leg,parent:'root',socket:'limb.1'},{partId:leg,parent:'root',socket:'limb.7'}],{headMode:'torso'})};
    sim.animals.push(a);sim.evolutionTree.observeBiologicalAncestry(a,parents);return a;
  }
  const parents=[body(source),body(source)];body(unrelated);
  const first=body(local,'arid-pad',parents);sim.protoSpeciation.onBirth(first,parents);
  const second=body(local,'arid-pad',[first,first]);sim.protoSpeciation.onBirth(second,[first,first]);
  const cohort=[];
  for(let n=0;n<3;n++){const a=body(local,'arid-pad',[second,second]);sim.protoSpeciation.onBirth(a,[second,second]);local.memberIds.add(a.id);cohort.push(a)}
  const conceived=a=>paternalInheritance(a,{population:conceptionPopulationEvidence(sim,a)});
  for(let n=0;n<4;n++){const child=body(local,'arid-pad',cohort.slice(0,2));sim.speciation.noteBirth(child,[],cohort.slice(0,2).map(conceived))}
  return{sim,source,local,cohort,parents,body,conceived,converge:()=>{converged=true}};
}
const f=fixture(),{sim,local,source,cohort}=f;
assert.equal(sim.evolutionTree.referencePopulationFor(local,cohort),source,'Compare actual related source, not the most different unrelated species');
const evidence=sim.speciation.evidenceFor(local);
assert.deepEqual(evidence.gates,{history:true,ecology:true,distance:true,cohort:true,trait:true,localPressure:true,reproduction:true,isolation:true});
assert.equal(evidence.trait.maxDepth,3);assert.equal(evidence.cohort.length,3);assert.match(evidence.trait.id,/arid-pad:gain/);
sim.speciation.evaluatePopulation(local);assert.equal(sim.speciation.stateFor(local.key).recognized,false,'Original two-day qualification remains mandatory');
sim.day++;sim.speciation.evaluatePopulation(local);
const branch=sim.speciation.stateFor(local.key).branch;assert.ok(branch);
assert.equal(branch.parentId,'founding:mosskip');assert.equal(branch.recognizedGeneration,4,'Wild genealogy does not borrow player progression');
assert.equal(sim.lineage.highestGeneration,1);assert.equal(sim.lineage.records.size,0);assert.ok(sim.animals.every(a=>a.lineage===false));
assert.equal(sim.evolutionTree.leadershipTaxa().length,0,'Wild biodiversity grants no family ownership or leadership scope');
assert.ok(cohort.every(a=>sim.evolutionTree.taxonFor(a)===branch.id));
assert.equal(sim.evolutionTree.referencePopulationFor(local,cohort),source,'Recognized population cannot become its own zero-distance reference');
f.converge();
for(let day=0;day<6;day++){sim.day++;sim.speciation.evaluatePopulation(local)}
assert.equal(sim.speciation.stateFor(local.key).recognized,true,'Ecological stability alone never forces the anatomy to keep evolving');
for(let n=0;n<4;n++){
  const child=f.body(local,'arid-pad',[cohort[0],f.parents[0]]);
  sim.speciation.noteBirth(child,[],[f.conceived(cohort[0]),f.conceived(f.parents[0])]);
}
assert.equal(sim.speciation.geneFlowFor(local.key).ratio,.5);
for(let day=0;day<2;day++){sim.day++;sim.speciation.evaluatePopulation(local)}
assert.equal(sim.speciation.stateFor(local.key).recognized,false,'Actual renewed gene flow can rejoin the boundary');
assert.equal(sim.evolutionTree.node(branch.id).status,'rejoined');
assert.ok(sim.evolutionTree.node(branch.id).memberIds.size>=3,'Historical ancestry survives rejoining');
const extinct=fixture();extinct.sim.speciation.evaluatePopulation(extinct.local);extinct.sim.day++;extinct.sim.speciation.evaluatePopulation(extinct.local);
const extinctId=extinct.sim.speciation.stateFor(extinct.local.key).branch.id;
for(const a of extinct.sim.animals)if(a.speciesBranch?.id===extinctId)a.alive=false;
extinct.sim.day++;extinct.sim.speciation.evaluatePopulation(extinct.local);
assert.equal(extinct.sim.evolutionTree.node(extinctId).status,'extinct');
assert.equal(extinct.sim.lineage.records.size,0);
// A still-unmixed carrier in another actual population is not erased when
// the origin's recorded mixed births rejoin that local boundary.
const separate=fixture(),foreign=separate.sim;
foreign.speciation.evaluatePopulation(separate.local);foreign.day++;
foreign.speciation.evaluatePopulation(separate.local);
const retained=foreign.speciation.stateFor(separate.local.key).branch;
const migrant=separate.body(separate.source,'arid-pad',separate.cohort.slice(0,2));
foreign.protoSpeciation.onBirth(migrant,separate.cohort.slice(0,2));
migrant.speciesBranch={...retained};foreign.evolutionTree.onIdentityAssigned(migrant,retained);
separate.source.memberIds.add(migrant.id);
for(let n=0;n<4;n++){
  const parents=[separate.cohort[0],separate.parents[0]];
  const child=separate.body(separate.local,'arid-pad',parents);
  foreign.speciation.noteBirth(child,[],parents.map(separate.conceived));
}
for(let day=0;day<2;day++){foreign.day++;foreign.speciation.evaluatePopulation(separate.local)}
assert.equal(foreign.speciation.stateFor(separate.local.key).recognized,false);
assert.ok(separate.cohort.every(a=>!a.speciesBranch),'Actual origin cohort still rejoins');
assert.equal(foreign.evolutionTree.taxonFor(migrant),retained.id,'A separate unmixed carrier keeps its existing identity');
assert.equal(foreign.speciation.identityFor(migrant).id,retained.id);
assert.equal(foreign.evolutionTree.snapshot().find(n=>n.id===retained.id).status,'living');
console.log('Controlled autonomous recognition PASS: unchanged gates without G3/player flags, actual anatomy history, related ancestry/reference, stable identity, renewed compatible flow and retained extinction. Natural emergence remains unproven.');
