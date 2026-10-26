import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES,phenotypeFor} from '../src/organisms/species.js';
import {setForm,setProto,formReading,protoReading,migrateLegacyReadings} from '../src/lineage/readings.js';

const sim=new Simulation('GENVO8-SPECIATION-THRESHOLD',{player:true,courtshipSimilarity:process.argv.includes('--balanced')}),memory=sim.populationMemory,speciation=sim.speciation;
const founder=sim.player(),starter=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==founder.id);assert.ok(founder&&starter);

// Give population memory stable, separated anchors without inventing pressure inside the speciation controller.
const home={x:founder.x,y:founder.y};
sim.shelter.shelters=[{id:801,ownerId:founder.id,x:home.x,y:home.y,integrity:100,weatherSeal:.9,foodStore:8,capacity:28,kind:'primary',constructedDay:1,constructedYear:1,lastUsedTick:0}];
let outer=null;for(let y=20;y<108&&!outer;y+=8)for(let x=20;x<108&&!outer;x+=8){if(Math.hypot(x-home.x,y-home.y)<28)continue;if(!sim.world.water[sim.world.idx(x,y)])outer={x:x+.5,y:y+.5}}
assert.ok(outer,'found separated dry staging site');
const center=sim.generationProgress.addPopulationCenter({kind:'range-band',form:'forager',x:outer.x,y:outer.y,label:'Ranging Band',generation:3,animalId:founder.id}),key=`center:${center.id}`;
const days=12,history=(key,label,kind,means)=>({key,label,kind,centerId:key==='home'?null:center.id,days,firstDay:1,lastDay:days,exposure:Object.fromEntries(Object.entries(means).map(([k,v])=>[k,v*days])),peak:{...means},recent:{...means},last:{...means},lastAssessment:null});
memory.histories.set('home',history('home','Home Range','home',{dryness:.82,heat:.62,competition:.04,scarcity:.05,wetness:.02,predation:.08,crowding:.10,cold:.01}));
memory.histories.set(key,history(key,'Ranging Band','range-band',{competition:.92,scarcity:.78,wetness:.60,predation:.36,crowding:.32,dryness:.04,heat:.04,cold:.05}));

function resident(id,key,days=9){memory.residence.set(id,{days:{[key]:days},lastKey:key,lastDay:sim.day})}
function adult(i){const a=sim.spawnAnimal('genvo',outer.x+i*.35,outer.y+(i%2)*.3);a.age=SPECIES.genvo.maturity+8;a.generation=6;a.lineage=true;a.energy=110;a.hydration=105;setProto(a,{id:'range-sense',pressure:'competition',populationKey:key,populationLabel:'Ranging Band',originPopulationKey:key,originPopulationLabel:'Ranging Band',strength:.50+i*.015,sourceDays:12,sourceDifference:.62,separation:.44,emergedGeneration:4,bornDay:5,inherited:true,inheritanceState:'reinforced',lineageDepth:3+i%2,geneFlow:0,mixedFrom:[],support:.92});sim.lineage.register(a,[]);resident(a.id,key);return a}
const cohort=[adult(0),adult(1),adult(2)];
resident(founder.id,'home');resident(starter.id,'home');

function localBirth(n){const child=migrateLegacyReadings({id:9000+n,species:'genvo',lineage:true,generation:7,x:outer.x+.2,y:outer.y+.2,populationTrait:{...protoReading(cohort[0]),strength:.52,lineageDepth:4}});speciation.noteBirth(child,[cohort[n%3],cohort[(n+1)%3]]);return child}
for(let i=0;i<4;i++)localBirth(i);
let ev=speciation.evidenceFor(memory.populationByKey(key));
assert.ok(ev.qualified,'demanding threshold qualifies only after history, reinforced trait, resident cohort and local reproduction all align');
assert.equal(ev.flow.cross,0);assert.ok(ev.flow.isolation>=.99);assert.ok(ev.trait.maxDepth>=3);assert.ok(ev.diff.score>=.18);

const rngBefore=sim.rng.state;
speciation.evaluatePopulation(memory.populationByKey(key));assert.equal(speciation.stateFor(key).recognized,false,'one qualifying day is not enough to declare a species');
sim.day++;speciation.evaluatePopulation(memory.populationByKey(key));
const state=speciation.stateFor(key);assert.equal(state.recognized,true,'second sustained qualifying day recognizes the species split');assert.match(state.branch.label,/^Genvo [A-Za-z]+$/,'new branch gets an anatomy/behavior-informed taxonomic label');assert.ok(state.branch.nameOrigin?.anatomy,'recognized name records real body-part evidence');assert.equal(sim.rng.state,rngBefore,'speciation threshold consumes no simulation RNG');
for(const a of cohort)assert.equal(speciation.identityFor(a)?.label,state.branch.label,'resident reinforced cohort receives the recognized species identity');
assert.equal(cohort[0].species,'genvo','base ecology species remains GenVo-compatible after recognition');
assert.equal(sim.lineage.records.get(cohort[0].id)?.speciesBranch?.label,state.branch.label,'lineage record preserves recognized species identity for generation presentation');
assert.equal(phenotypeFor(cohort[0]).speciesBranch,state.branch.id,'recognized species identity reaches the shared GenVo visual phenotype');

const bornAfter=migrateLegacyReadings({id:9900,species:'genvo',lineage:true,generation:7,x:outer.x+.1,y:outer.y+.1,populationTrait:{...protoReading(cohort[0]),strength:.54,lineageDepth:4}});
speciation.noteBirth(bornAfter,[cohort[0],cohort[1]]);assert.equal(speciation.identityFor(bornAfter)?.label,state.branch.label,'new locally adapted descendants inherit the recognized species branch');

// Renewed breeding with the ancestral/wild population must push the boundary backward.
for(let i=0;i<6;i++){const mixed=migrateLegacyReadings({id:10000+i,species:'genvo',lineage:true,generation:7,x:outer.x+.1,y:outer.y+.1,populationTrait:{...protoReading(cohort[0]),strength:.42,lineageDepth:4,geneFlow:.3,inheritanceState:'mixed'}});speciation.noteBirth(mixed,[cohort[i%3],starter])}
ev=speciation.evidenceFor(memory.populationByKey(key));assert.ok(ev.flow.ratio>=.48,'renewed inter-population breeding creates collapse-level gene flow');
sim.day++;speciation.evaluatePopulation(memory.populationByKey(key));assert.equal(speciation.stateFor(key).recognized,true,'young species boundary weakens before it collapses');
sim.day++;speciation.evaluatePopulation(memory.populationByKey(key));assert.equal(speciation.stateFor(key).recognized,false,'sustained renewed gene flow can reverse the young species boundary');
for(const a of cohort)assert.equal(speciation.identityFor(a),null,'collapsed branch is no longer presented as a current separate species');
assert.match(speciation.statusLine(),/Speciation threshold/i);

console.log('speciation-threshold checks: PASS');
