import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {makePlan,validatePlan} from '../src/lineage/body-plan.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {careVisualAction} from '../src/render/care-expression.js';
import {visualActionFromIntent,behaviorVisualState} from '../src/render/behavior.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
const sim=new Simulation('CARE-RECEIPTS-20261022',{player:true}),mother=sim.player(),father=sim.animals.find(a=>a.species==='genvo'&&a.id!==mother.id);
const nodes=founderPlan().nodes.map(n=>({partId:!n.parent?'soft-torso':n.partId,parent:n.parent,socket:n.socket}));
const plan=makePlan([...nodes,{partId:'fur-mantle',parent:'root',socket:'dorsal'},{partId:'live-womb',parent:'root',socket:'flank.left'},{partId:'endothermic-core',parent:'root',socket:'flank.right'},{partId:'mammary-gland',parent:'root',socket:'flank.right'}]);assert.ok(validatePlan(plan).ok);
for(const a of [mother,father]){a.bodyPlan=plan;a.age=40;a.reproCooldown=0;a.energy=SPECIES.genvo.maxEnergy;a.hydration=SPECIES.genvo.maxHydration;a.intent='idle'}
mother.sex='F';father.sex='M';father.x=mother.x+.4;father.y=mother.y;sim.rebuildSpatial();sim.reproduction.courtTargetId=father.id;
assert.ok(sim.tryMate(mother,father),'A staged pair must actually conceive through the unchanged authority');
const children=sim.giveBirth(mother);assert.ok(children.length);const child=children[0];child.x=mother.x+.3;child.y=mother.y;child.intent='idle';child.energy=1;mother.intent='idle';
assert.equal(careVisualAction(sim,mother),null,'Anatomy and offspring alone cannot claim nursing');
const energy=mother.energy,water=mother.hydration,fed=sim.family.tend(mother,child);assert.ok(fed.ok&&fed.type==='nursing');assert.ok(mother.energy<energy&&mother.hydration<water&&child.energy>1);
assert.equal(visualActionFromIntent(sim,mother),'nurse');assert.equal(visualActionFromIntent(sim,child),'suckle');
const before=structuredClone(createSimulationSnapshot(sim,{savedAt:'care-proof'}));for(let i=0;i<100;i++){careVisualAction(sim,mother);careVisualAction(sim,child);behaviorVisualState({bodyPlan:mother.bodyPlan,action:'nurse',phase:i%8});}assert.deepEqual(createSimulationSnapshot(sim,{savedAt:'care-proof'}),before,'Presentation changes canonical state');
assert.equal(careVisualAction(sim,mother,{moving:true}),null);mother.bracing=true;assert.equal(careVisualAction(sim,mother),null);mother.bracing=false;mother.intent='escape';assert.equal(visualActionFromIntent(sim,mother),'flee');mother.intent='idle';
child.x+=5;assert.equal(careVisualAction(sim,mother),null,'Separated infants cannot replay nursing');child.x-=5;const time=sim.tickCount;sim.tickCount+=20;assert.equal(careVisualAction(sim,mother),null,'Care expires');sim.tickCount=time;
const old=child.lactationParentId;child.lactationParentId=father.id+10000;assert.equal(careVisualAction(sim,child),null,'A stale owner cannot nurse');child.lactationParentId=old;
console.log('Care receipts PASS: actual conception, funded birth and paid milk transfer; matching parent/child poses, immutable complete snapshot, expiry, separation, actor ownership, movement and combat precedence.');
// A separate real egg operation: no presentation event or egg stock is invented.
const eggs=new Simulation('CARE-EGG-RECEIPTS-20261022',{player:true}),layer=eggs.player(),partner=eggs.animals.find(a=>a.species==='genvo'&&a.id!==layer.id);
const eggPlan=makePlan([...founderPlan().nodes.map(n=>({partId:n.partId,parent:n.parent,socket:n.socket})),{partId:'egg-chamber',parent:'root',socket:'flank.left'}]);assert.ok(validatePlan(eggPlan).ok);
for(const a of [layer,partner]){a.bodyPlan=eggPlan;a.age=40;a.reproCooldown=0;a.energy=SPECIES.genvo.maxEnergy;a.hydration=SPECIES.genvo.maxHydration;a.intent='idle'}
layer.sex='F';partner.sex='M';partner.x=layer.x+.4;partner.y=layer.y;eggs.rebuildSpatial();eggs.reproduction.courtTargetId=partner.id;
assert.ok(eggs.tryMate(layer,partner),'The egg pair must actually conceive');assert.equal(careVisualAction(eggs,layer),null,'Pregnancy alone cannot display laying');
const laid=eggs.giveBirth(layer);assert.ok(laid.length);layer.intent='idle';assert.equal(careVisualAction(eggs,layer),'lay-settle');assert.equal(visualActionFromIntent(eggs,layer),'lay-settle');
const layState=structuredClone(createSimulationSnapshot(eggs,{savedAt:'lay-proof'}));careVisualAction(eggs,layer);assert.deepEqual(createSimulationSnapshot(eggs,{savedAt:'lay-proof'}),layState);
const incubation=laid[0].incubationDays;for(let i=0;i<incubation;i++)eggs.advanceEggs();
const hatchling=eggs.animals.find(a=>a.hatchedFromEggId===laid[0].id);assert.ok(hatchling,'Only a genuinely hatched funded egg may settle');hatchling.intent='idle';assert.equal(careVisualAction(eggs,hatchling),'hatch-settle');
assert.equal(careVisualAction(eggs,{...hatchling,id:hatchling.id+10000}),null,'Hatching cannot transfer to another actor');
hatchling.hatchedFromEggId+=10000;assert.equal(careVisualAction(eggs,hatchling),null,'Hatching requires the exact recorded egg identity');hatchling.hatchedFromEggId-=10000;
const hatchState=structuredClone(createSimulationSnapshot(eggs,{savedAt:'hatch-proof'}));careVisualAction(eggs,hatchling);assert.deepEqual(createSimulationSnapshot(eggs,{savedAt:'hatch-proof'}),hatchState);eggs.tickCount+=20;assert.equal(careVisualAction(eggs,hatchling),null);
for(const action of ['nurse','suckle','lay-settle','hatch-settle']){
 const first=behaviorVisualState({bodyPlan:mother.bodyPlan,action,phase:0}),next=behaviorVisualState({bodyPlan:mother.bodyPlan,action,phase:3});assert.ok(first.bodyDrop>0);assert.ok(Object.values(first).filter(v=>typeof v==='number').every(Number.isFinite));if(action==='suckle')assert.notEqual(first.mouthPulse,next.mouthPulse);
}
console.log('Laying/hatching receipts PASS: successful canonical conception, paid egg creation, complete incubation operations, exact actor/egg identity, no pregnancy-only pose and no snapshot writes.');
import {genvoVisualPose} from '../src/render/genvo.js';
import {assemblyFor} from '../src/render/creature-assembler.js';
let poses=0;
for(const action of ['nurse','suckle','lay-settle','hatch-settle'])for(let dir=0;dir<8;dir++)for(let phase=0;phase<8;phase++){
 const behavior=behaviorVisualState({bodyPlan:mother.bodyPlan,action,phase});
 const pose=genvoVisualPose({id:mother.id,dir,frame:phase,action,moving:false,legSlots:assemblyFor(mother).legSlots,behavior});
 assert.equal(pose.legs.length,assemblyFor(mother).legSlots.length);
 for(const leg of pose.legs)for(const point of [leg.root,leg.knee,leg.foot])assert.ok(Number.isFinite(point.x+point.y),'Care animation lost a mounted anatomical contact');
 poses++;
}
console.log(poses+' care action/facing/phase assemblies preserve finite native joints PASS');
