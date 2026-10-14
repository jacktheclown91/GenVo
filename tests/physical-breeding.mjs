import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {makePlan,validatePlan} from '../src/lineage/body-plan.js';
import {founderPlan,recombineBodyPlans,samePhysicalBuild} from '../src/lineage/body-inheritance.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const original=founderPlan();
const placements=plan=>plan.nodes.map(n=>({partId:n.partId,parent:n.parent,socket:n.socket}));
const modified=(pairs,extras=[])=>makePlan([...placements(original).map(n=>({ ...n,partId:pairs[n.socket]||n.partId})),...extras]);
const spring=modified({'limb.3':'spring-leg','limb.5':'spring-leg'},[{partId:'signal-crest',parent:'root',socket:'dorsal'}]);
const runner=modified({'limb.1':'runner-leg','limb.7':'runner-leg'},[{partId:'flag-tail',parent:'root',socket:'tail'}]);
for(const plan of [original,spring,runner])assert.equal(validatePlan(plan).ok,true,'candidate body plan is legal');
const genesOf=part=>new Set(part.nodes.map(n=>n.partId));
const sim=new Simulation('GENVO8-PHYSICAL-CROSS',{player:true});
const p=sim.player(),m=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.sex!==p.sex&&a.id!==p.id);
assert.ok(m);
p.bodyPlan=spring;m.bodyPlan=runner;
p.learnedRituals={dance:2};m.learnedRituals={call:3};
assert.equal(samePhysicalBuild(p,m),false,'different physical parts do not unlock editing');
const mother=p.sex==='F'?p:m,father=p.sex==='M'?p:m;
for(const a of [p,m])a.age=SPECIES.genvo.maturity+3;
mother.pregnant={fatherId:father.id,days:1,totalDays:16,startedDay:sim.day,startedYear:sim.year,plannedLitterSize:2};
assert.equal(sim.evolutionEditor.onMated(p,m),null,'mixed partner pair cannot override litter with a full editor');
assert.equal(sim.evolutionEditor.pending(),null);
const beforeRng=sim.rng.state;
const plans=[];
for(let i=0;i<120;i++){
  const plan=recombineBodyPlans(sim.rng,spring,runner);
  assert.equal(validatePlan(plan).ok,true,'no invalid socket combinations');
  plans.push(plan);
}
assert.ok(plans.some(x=>genesOf(x).has('spring-leg')&&genesOf(x).has('runner-leg')),'real hybrids inherit both parental limb types');
assert.ok(plans.some(x=>genesOf(x).has('flag-tail')&&genesOf(x).has('signal-crest')),'hybrids can combine multiple external appendages');
assert.ok(new Set(plans.map(x=>x.id)).size>=3,'cross produces differentiated offspring, not copies of one parent');
assert.notEqual(sim.rng.state,beforeRng,'variation uses existing seeded ecology RNG');
// Exercise the actual birth pipeline too; hybrid parts must be registered on living offspring.
sim.bodyVariationChance=0;
const born=[];
for(let i=0;i<7;i++){
  mother.pregnant={fatherId:father.id,days:0,totalDays:16,startedDay:sim.day,startedYear:sim.year,plannedLitterSize:2};
  mother.energy=SPECIES.genvo.maxEnergy;mother.hydration=SPECIES.genvo.maxHydration;
  born.push(...sim.giveBirth(mother));
}
assert.ok(born.length>=5,'mixed pair produces real offspring');
assert.ok(born.every(a=>validatePlan(a.bodyPlan).ok),'actual newborns have valid plans');
assert.ok(born.some(a=>genesOf(a.bodyPlan).has('spring-leg')&&genesOf(a.bodyPlan).has('runner-leg')),'real descendants can combine both limb types');
const hatchSnapshot=structuredClone(createSimulationSnapshot(sim));
const hatchRestored=restoreSimulationSnapshot(structuredClone(hatchSnapshot));
assert.deepEqual(born.map(a=>a.bodyPlan.id),born.map(a=>hatchRestored.animals.find(x=>x.id===a.id)?.bodyPlan?.id),'new mixed bodies survive save/load');
// Same plan but different rituals, preferences and lineage history: the editor still unlocks.
m.bodyPlan=spring;
mother.pregnant={fatherId:father.id,days:1,totalDays:16,startedDay:sim.day,startedYear:sim.year};
assert.equal(samePhysicalBuild(p,m),true);
assert.ok(sim.evolutionEditor.onMated(p,m),'matching physical builds always unlock the editor');
assert.ok(sim.evolutionEditor.openDraft(),'editor starts from parent body');
const snapshot=structuredClone(createSimulationSnapshot(sim));
const restored=restoreSimulationSnapshot(structuredClone(snapshot));
assert.equal(restored.evolutionEditor.pending()?.motherId,mother.id,'pending matched-parent editor survives saving');
// Physical distinction does not require different root bodies.
const differentTorso=makePlan(placements(original).map(x=>x.parent===null?{...x,partId:'soft-torso'}:x));
assert.equal(validatePlan(differentTorso).ok,true);
for(let i=0;i<25;i++)assert.equal(validatePlan(recombineBodyPlans(sim.rng,original,differentTorso)).ok,true,'compatible torso sockets retained');
console.log('physical parental inheritance, stabilization editor gate and save continuity ok');
