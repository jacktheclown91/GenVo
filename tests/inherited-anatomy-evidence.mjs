import assert from 'node:assert/strict';
import {makePlan,serializePlan} from '../src/lineage/body-plan.js';
import {ProtoSpeciationController,protoTraitMeta} from '../src/lineage/proto-speciation.js';
import {AUTONOMOUS_EVOLUTION} from '../src/lineage/autonomous-evolution.js';
import {INHERITED_PARTS,inheritedPhysicalReadings} from '../src/lineage/inherited-anatomy-evidence.js';
import {paternalInheritance} from '../src/ecology/gestation.js';
import {setProto} from '../src/lineage/readings.js';

// Controlled anatomy/history fixtures, not forced natural mutations or species.
let nextId=1;
function animal(leg='walking-leg',eye='simple-eye'){
  return{id:nextId++,alive:true,lineage:false,species:'genvo',x:2,y:2,energy:80,
    genes:{body:1,motion:1,senses:1},anatomy:{},
    bodyPlan:makePlan([{partId:'soft-torso',parent:null,socket:null},
      {partId:leg,parent:'root',socket:'limb.1'},
      {partId:leg,parent:'root',socket:'limb.7'},
      {partId:eye,parent:'root',socket:'eye.left'},
      {partId:eye,parent:'root',socket:'eye.right'}],{headMode:'torso'})};
}
const population={key:'natural:fixture',label:'Controlled autonomous population'};
const sim={autonomousEvolutionRules:AUTONOMOUS_EVOLUTION.policy,
  autonomousPopulationRules:'autonomous-populations/3',day:1,
  rng:{next(){throw Error('Physical observation must not consume RNG')}},
  world:{idx:()=>0,moisture:[.8],water:[0]},
  populationMemory:{populationForAnimal:()=>population}};
const controller=new ProtoSpeciationController(sim);
const a=animal(),b=animal();
assert.equal(controller.traitFor(a),null,'A founding body is its own baseline, not a new taxon trait');
const unchanged=animal();controller.onBirth(unchanged,[a,b]);
assert.equal(controller.traitFor(unchanged),null,'No environment creates an absent anatomical change');
for(const [leg,eye] of [['webbed-leg','simple-eye'],['spring-leg','simple-eye'],['walking-leg','wide-field-eye']]){
  const child=animal(leg,eye),body=serializePlan(child.bodyPlan),stocks=child.energy,genes={...child.genes};
  controller.onBirth(child,[a,b]);const reading=controller.traitFor(child);
  assert.ok(reading&&reading.reading===INHERITED_PARTS);assert.equal(reading.lineageDepth,1);
  assert.equal(reading.direction,'gain');assert.equal(reading.pressure,null,'Ecology is not assigned as an inherited body feature');
  assert.equal(serializePlan(child.bodyPlan),body);assert.equal(child.energy,stocks);assert.deepEqual(child.genes,genes);
  for(const method of ['movementMultiplier','forageRangeMultiplier','sensoryMultiplier','metabolismMultiplier','waterUseMultiplier','shelterProtectionMultiplier'])
    assert.equal(controller[method](child),1,'Physical readings never duplicate part bonuses: '+method);
  assert.equal(controller.thermalMultiplier(child,'heat'),1);assert.equal(controller.thermalMultiplier(child,'cold'),1);
  const second=animal(leg,eye);controller.onBirth(second,[paternalInheritance(child),paternalInheritance(child)]);
  const third=animal(leg,eye);controller.onBirth(third,[paternalInheritance(second),paternalInheritance(second)]);
  assert.equal(controller.traitFor(third).lineageDepth,3,'Three actual parent/child fixture links retain the same expressed feature');
  assert.equal(controller.traitFor(third).strength,reading.strength,'Persistence never demands escalating anatomy');
  assert.equal(protoTraitMeta(reading.id).label,reading.label);
  const restored=structuredClone(third);restored.bodyPlan.id='a-different-display-hash';
  assert.deepEqual(inheritedPhysicalReadings(restored),inheritedPhysicalReadings(third),'Recognition evidence never uses body-plan hashes');
  const converged=animal();controller.onBirth(converged,[third,third]);
  assert.equal(controller.traitFor(converged),null,'Actual anatomical convergence removes the old expressed difference');
}
const advancedFounder=animal('spring-leg','wide-field-eye'),sameAdvanced=animal('spring-leg','wide-field-eye');
controller.onBirth(sameAdvanced,[advancedFounder,advancedFounder]);assert.equal(controller.traitFor(sameAdvanced),null,'Initial advanced anatomy is not novel merely because it is advanced');
const historical=animal('webbed-leg');delete sim.autonomousEvolutionRules;controller.onBirth(historical,[a,b]);
assert.equal(historical.protoHistory,undefined,'Historical worlds retain absent new history and legacy RNG behavior');
const explicitLegacy=animal();setProto(explicitLegacy,{id:'splayfoot',strength:.55,lineageDepth:3});
assert.ok(controller.movementMultiplier(explicitLegacy)>1,'Existing legacy body effects remain intact');
console.log('Inherited anatomy evidence PASS: actual part changes, ancestral baselines, neutral persistence across three parent links, gestational snapshots, no new abilities/RNG and historical absence.');
