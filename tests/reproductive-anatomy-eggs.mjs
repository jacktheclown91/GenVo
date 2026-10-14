import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {makePlan,validatePlan} from '../src/lineage/body-plan.js';
import {reproductiveMode,eggSiteQuality} from '../src/reproduction/reproductive-anatomy.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {hasComponent} from '../src/render/part-sprites.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';

const sim=new Simulation('EGG-REAL-LIFECYCLE',{player:false,bootstrap:false});
const mother=sim.spawnAnimal('genvo',32,32),father=sim.spawnAnimal('genvo',33,32);
mother.sex='F';father.sex='M';mother.age=father.age=SPECIES.genvo.maturity+4;
const base=founderPlan();assert.ok(validatePlan(base).ok);
const eggPlan=makePlan([...base.nodes.map(n=>({partId:n.partId,parent:n.parent,socket:n.socket})),{partId:'egg-chamber',parent:'root',socket:'flank.left'}]);
assert.equal(validatePlan(eggPlan).ok,true);
assert.equal(hasComponent('egg-chamber'),true);
mother.bodyPlan=eggPlan;
assert.equal(reproductiveMode(mother),'egg');assert.equal(reproductiveMode(father),'live');
const ground=sim.safeSpawn('genvo');mother.x=ground.x;mother.y=ground.y;father.x=ground.x+1;father.y=ground.y;
const before=sim.stats.births;
// The baseline egg regression checks exposed eggs without construction materials.
for(const stock of Object.values(sim.world.plants))stock[sim.world.idx(mother.x,mother.y)]=0;
mother.energy=SPECIES.genvo.maxEnergy;mother.hydration=SPECIES.genvo.maxHydration;
mother.pregnant={fatherId:father.id,paternalInheritance:structuredClone(father),maternalInheritance:structuredClone(mother),days:0,totalDays:16,mode:'egg',plannedLitterSize:2,birthCost:34,reserveInvestment:0};
const laid=sim.giveBirth(mother);
assert.equal(laid.length,2);assert.equal(sim.eggs.length,2);assert.equal(sim.stats.births,before);
assert.equal(mother.pregnant,null);assert.equal(mother.energy, SPECIES.genvo.maxEnergy-34);
assert.equal(laid[0].species,'genvo');
assert.ok(laid.every(e=>e.maternalInheritance.bodyPlan.nodes.some(n=>n.partId==='egg-chamber')),'conception-time anatomy is frozen in every egg');
const save=structuredClone(createSimulationSnapshot(sim));const loaded=restoreSimulationSnapshot(save);
assert.equal(loaded.eggs.length,2);assert.equal(loaded.eggs[0].id,laid[0].id);
// Hatch even if the original father and mother are dead. Inherited parent
// snapshots must keep the original body and preferences rather than using recent changes.
const a=loaded.animals.find(a=>a.id===mother.id),b=loaded.animals.find(a=>a.id===father.id);
a.alive=false;b.alive=false;
for(const e of loaded.eggs){e.x=ground.x;e.y=ground.y;e.incubationDays=1;e.condition=1}
loaded.advanceEggs();
const children=loaded.animals.filter(x=>x.hatchedFromEggId!=null);
assert.equal(children.length,2);assert.equal(loaded.eggs.length,0);
assert.equal(loaded.stats.births,before+2);
assert.equal(children[0].parentIds[0],mother.id);assert.equal(children[0].parentIds[1],father.id);
assert.ok(children.every(c=>Number.isFinite(c.energy)&&c.energy>=0));
assert.ok(children.every(c=>Number.isFinite(c.hydration)&&c.hydration>=0));
assert.equal(children.every(c=>c.bodyPlan&&validatePlan(c.bodyPlan).ok),true,'each hatchling has valid inherited body parts');
// Environmental exposure, no invisible resource injection.
const sim2=new Simulation('EGG-ENV',{player:false,bootstrap:false});
const d=sim2.safeSpawn('genvo'),i=sim2.world.idx(d.x,d.y);sim2.world.water[i]=1;
assert.equal(eggSiteQuality(sim2.world,d.x,d.y),0);
sim2.eggs=[{id:1,x:d.x,y:d.y,motherId:1,fatherId:2,species:'genvo',incubationDays:30,condition:.01}];sim2.advanceEggs();assert.equal(sim2.eggs.length,0);
// Legacy body remains live birth and old current-schema saves omit eggs safely.
const legacy=new Simulation('EGG-LEGACY',{player:false,bootstrap:false});
const old=structuredClone(createSimulationSnapshot(legacy));delete old.core.eggs;delete old.core.nextEggId;
assert.equal(restoreSimulationSnapshot(old).eggs.length,0);
console.log('reproductive anatomy: part gate, real eggs, delayed birth, parent death, persistence, environmental loss, legacy mode passed');
