import assert from 'node:assert/strict';
import {PARTS,registryProblems} from '../src/lineage/part-registry.js';
import {TISSUE_PARTS} from '../src/organisms/tissue-structure.js';
import {PART_SPRITES} from '../src/render/part-sprites.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {makePlan,validatePlan} from '../src/lineage/body-plan.js';
import {createDraft,whyNot} from '../src/lineage/evolution-draft.js';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {MAMMAL,canLactate,milkEligible,transferMilk,motherWarmth,thermoregulation,neonatalColdExposure,neonatalWarmthFactor} from '../src/ecology/mammalian-care.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

assert.deepEqual(registryProblems(),[]);
for(const id of ['endothermic-core','mammary-gland']){
 assert.ok(PARTS[id]&&PART_SPRITES[id]&&TISSUE_PARTS[id],id+' must have functional registry, art, tissue');
}
assert.equal(PARTS['endothermic-core'].developmentalPrerequisites[0],'fur-mantle');
assert.deepEqual(PARTS['mammary-gland'].developmentalPrerequisites,['endothermic-core','live-womb']);
assert.match(whyNot(createDraft({base:founderPlan(),ancestry:[],budget:8}),'mammary-gland','root','flank.left'),/Requires/i);

const body=makePlan([
 ...founderPlan().nodes.map(n=>({partId:n.partId==='small-torso'?'soft-torso':n.partId,parent:n.parent,socket:n.socket})),
 {partId:'fur-mantle',parent:'root',socket:'dorsal'},
 {partId:'live-womb',parent:'root',socket:'flank.left'},
 {partId:'endothermic-core',parent:'root',socket:'flank.right'},
 {partId:'mammary-gland',parent:'root',socket:'flank.right'}
]);
assert.ok(validatePlan(body).ok,'physically legal 3-organ torso from evolved extra socket capacity');

const sim=new Simulation('E10-MAMMAL',{player:true}),parent=sim.player(),father=sim.animals.find(a=>a.alive&&a.id!==parent.id&&a.species===parent.species);
assert.ok(father,'the ordinary simulation includes a potential co-parent');
for(const adult of [parent,father]){adult.bodyPlan=structuredClone(body);adult.age=SPECIES[adult.species].maturity+3;adult.energy=SPECIES[adult.species].maxEnergy*.95;adult.hydration=SPECIES[adult.species].maxHydration*.95;}
assert.ok(canLactate(parent));
assert.ok(thermoregulation(parent,.12).coldFactor<1,'endothermy protects from true cold when funded');
assert.ok(thermoregulation(parent,.83).extraEnergy>thermoregulation(parent,.12).extraEnergy,'endothermy costs more in hot climates');
const [child]=sim.spawnFundedOffspring(parent,father,[parent,father],{count:1,x:parent.x,y:parent.y,energyBudget:18,hydrationBudget:12});
assert.ok(child);
assert.equal(child.lactationParentId,parent.id,'live-born child records actual birth parent');
assert.ok(sim.family.isDependent(child),'even a formerly solitary ancestor becomes a dependent mammalian young');
assert.ok(milkEligible(parent,child));
assert.equal(milkEligible(father,child),false,'unrelated caregiver / second parent cannot manufacture milk for this infant');
assert.ok(neonatalColdExposure(child,.12)>1);
const oldChild=child.energy,oldEnergy=parent.energy,oldWater=parent.hydration;
const fed=transferMilk(parent,child);
assert.ok(fed.ok);
assert.ok(child.energy>oldChild&&parent.energy<oldEnergy&&parent.hydration<oldWater);
assert.ok(oldEnergy-parent.energy>child.energy-oldChild,'manufacturing milk loses energy, never creates it');
assert.ok(oldWater-parent.hydration>0,'milk needs actual water');
const cell=sim.world.idx(child.x,child.y);sim.world.temperature[cell]=.12;
const beforeWarmth=parent.energy;
assert.equal(motherWarmth(parent,child,.12),true);
assert.ok(parent.energy<beforeWarmth);
child.lastMaternalWarmthTick=sim.tickCount;
assert.ok(neonatalWarmthFactor(child,sim.tickCount,6)<1);
assert.equal(motherWarmth(parent,child,.8),false,'no invented cold exposure in a hot biome');
// Exercise the real life-cycle family phase, not only the isolated helper.
child.energy-=3;
const lifeBefore=child.energy,lifeParentEnergy=parent.energy,lifeParentWater=parent.hydration;
sim.family.phaseCare();
assert.ok(child.energy>lifeBefore,'existing family phase now feeds nursing offspring');
assert.ok(parent.energy<lifeParentEnergy&&parent.hydration<lifeParentWater,'ordinary simulation phase must fund the feeding');
assert.ok(child.lastMilkTick===sim.tickCount);
assert.ok(child.lastMaternalWarmthTick===sim.tickCount,'cold contact warms newborn in the normal family phase');
const saved=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'e10'})));
const savedChild=saved.animals.find(a=>a.id===child.id);
assert.equal(savedChild.lactationParentId,parent.id,'lactation lineage persists save/load');
assert.ok(milkEligible(saved.animals.find(a=>a.id===parent.id),savedChild));

parent.hydration=SPECIES[parent.species].maxHydration*MAMMAL.parentWaterReserve;
const failed=transferMilk(parent,child);
assert.equal(failed.ok,false,'dehydrated parent may not create milk for free');
parent.hydration=SPECIES[parent.species].maxHydration*.95;
child.x=parent.x+5;child.y=parent.y;
assert.equal(transferMilk(parent,child).ok,false,'remote nursing is impossible');
child.x=parent.x;child.y=parent.y;
child.age=SPECIES[child.species].maturity*.5;
assert.equal(milkEligible(parent,child),false,'weaning ends milk dependence');

// Eggs can inherit a mammary body but cannot claim a maternal milk bond.
const [eggChild]=sim.spawnFundedOffspring(parent,father,[parent,father],{count:1,x:parent.x,y:parent.y,energyBudget:18,hydrationBudget:12,layingId:777});
assert.equal(eggChild.hatchedFromEggId,777);
assert.equal(eggChild.lactationParentId,undefined);
assert.equal(milkEligible(parent,eggChild),false);

// A simple furred or live-bearing animal without the full organ chain is not a mammal.
const incomplete=makePlan(body.nodes.filter(n=>n.partId!=='mammary-gland').map(n=>({partId:n.partId,parent:n.parent,socket:n.socket})));
parent.bodyPlan=incomplete;
assert.equal(canLactate(parent),false);
console.log('E10 mammalian anatomy, funded milk, hydration, cold thermogenesis, maternal contact, inherited live birth vs eggs, save, weaning PASS');
