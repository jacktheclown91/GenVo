import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {makePlan,validatePlan} from '../src/lineage/body-plan.js';
import {constructNest,careForNest,chooseCareNest,edibleEggTarget,eatEgg,nestIncubationQuality,NEST_ENERGY,NEST_MATERIAL,nestForEgg} from '../src/reproduction/egg-ecology.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const sim=new Simulation('NEST-CARE-REAL',{player:false,bootstrap:false});
const safe=sim.safeSpawn('genvo');
const mother=sim.spawnAnimal('genvo',safe.x,safe.y),father=sim.spawnAnimal('genvo',safe.x+1,safe.y);
const nodes=founderPlan().nodes.map(n=>({partId:n.partId,parent:n.parent,socket:n.socket}));
const plan=makePlan([...nodes,{partId:'egg-chamber',parent:'root',socket:'flank.left'},{partId:'brood-pouch',parent:'root',socket:'flank.right'}]);
assert.ok(validatePlan(plan).ok);mother.bodyPlan=plan;
mother.sex='F';father.sex='M';mother.age=father.age=SPECIES.genvo.maturity+5;
const idx=sim.world.idx(mother.x,mother.y);
assert.equal(sim.world.water[idx],0);
for(const stock of Object.values(sim.world.plants))stock[idx]=0;
sim.world.plants.marshroot[idx]=.85;
mother.energy=SPECIES.genvo.maxEnergy;mother.hydration=SPECIES.genvo.maxHydration;
const stockBefore=sim.world.plants.marshroot[idx],energyBefore=mother.energy;
mother.pregnant={fatherId:father.id,paternalInheritance:structuredClone(father),maternalInheritance:structuredClone(mother),days:0,totalDays:16,mode:'egg',plannedLitterSize:3,birthCost:40,reserveInvestment:0};
const laid=sim.giveBirth(mother);
assert.equal(laid.length,3);assert.equal(sim.nests.length,1);
assert.ok(laid.every(e=>e.nestId===sim.nests[0].id));
assert.ok(Math.abs(sim.world.plants.marshroot[idx]-(stockBefore-NEST_MATERIAL))<.001);
assert.ok(Math.abs(mother.energy-(energyBefore-NEST_ENERGY-40))<.001);
assert.equal(sim.nests[0].material,'marshroot');
assert.equal(chooseCareNest(sim,mother)?.id,sim.nests[0].id);
const originalIntegrity=sim.nests[0].integrity;
assert.equal(careForNest(sim,mother,sim.nests[0]),true);
assert.ok(sim.nests[0].integrity>originalIntegrity);
assert.equal(careForNest(sim,mother,sim.nests[0]),false,'care is bounded to one action per day');
assert.ok(nestIncubationQuality(sim.nests[0],.4)>.4);
assert.equal(nestIncubationQuality(sim.nests[0],0),0,'flooding cannot be magically fixed');

const snapshot=structuredClone(createSimulationSnapshot(sim));
const loaded=restoreSimulationSnapshot(snapshot);
assert.equal(loaded.nests.length,1);assert.equal(loaded.eggs.length,3);
assert.equal(loaded.nests[0].careCount,1);assert.equal(loaded.eggs[0].nestId,loaded.nests[0].id);
assert.ok(nestForEgg(loaded,loaded.eggs[0]));
// A playable lineage can perform the same costed tending action using E.
const savedMother=loaded.animals.find(a=>a.id===mother.id);
loaded.playerEnabled=true;loaded.playerId=savedMother.id;savedMother.player=true;
loaded.day++;loaded.nests[0].integrity=.65;
const careBefore=loaded.nests[0].careCount,interaction=loaded.playerInteract();if(loaded.interactionOptions().filter(o=>o.enabled).length>1){assert.equal(interaction.type,'interaction-choice');assert.equal(loaded.nests[0].careCount,careBefore,'ambiguous command does not tend or feed silently')}
assert.equal(loaded.playerInteract({kind:'nest',id:loaded.nests[0].id,x:loaded.nests[0].x,y:loaded.nests[0].y},'tend-egg').type,'nest-care');
assert.ok(loaded.nests[0].careCount>=2);
const predator=loaded.spawnAnimal('needlejaw',mother.x+.3,mother.y);
predator.player=false;predator.energy=10;
const target=edibleEggTarget(loaded,predator,{radius:8});
assert.ok(target&&loaded.eggs.includes(target));
const initialEggEnergy=target.energy;
const startEggCount=loaded.eggs.length;
let success=false;
for(let attempt=0;attempt<6;attempt++){if(eatEgg(loaded,predator,target)){success=true;break}loaded.tickCount+=30}
assert.ok(success,'nest cover resists but eventually yields to repeated attacks');
assert.equal(loaded.eggs.length,startEggCount-1);
assert.ok(predator.energy>10-6*.4,'predator actually consumes the egg\'s finite reserves');
assert.ok(initialEggEnergy>0);
// The normal decision/movement path, not just a helper, must find edible eggs.
const hunt=new Simulation('NATURAL-EGG-HUNT',{player:false,bootstrap:false});
const hw=hunt.safeSpawn('needlejaw'),hunter=hunt.spawnAnimal('needlejaw',hw.x,hw.y);
hunter.energy=8;hunter.hydration=SPECIES.needlejaw.maxHydration;
hunt.eggs.push({id:55,x:hw.x+.35,y:hw.y,species:'genvo',motherId:7,fatherId:8,
  energy:13,hydration:5,condition:1,incubationDays:7});
hunt.phaseDecision(null);
assert.equal(hunter.intent,'egg-hunt','hungry predator chooses an eligible physical egg');
assert.equal(hunter.target.eggId,55);
hunt.resolveInteraction(hunter);
assert.equal(hunt.eggs.length,0,'physical egg can be consumed using the live interaction path');
assert.ok(hunter.energy>8,'finite egg reserves become predator energy');
const old=structuredClone(createSimulationSnapshot(sim));delete old.core.nests;delete old.core.nextNestId;
assert.equal(restoreSimulationSnapshot(old).nests.length,0,'older saves tolerate missing nest fields');
// No plant stocks, no constructed nest and no free thermal protection.
const empty=new Simulation('NEST-NO-FREE-MATERIAL',{player:false,bootstrap:false});
const lone=empty.spawnAnimal('genvo',25,25);for(const stock of Object.values(empty.world.plants))stock[empty.world.idx(lone.x,lone.y)]=0;
lone.energy=SPECIES.genvo.maxEnergy;
assert.equal(constructNest(empty,lone),null);
assert.equal(empty.nests.length,0);
console.log('egg ecology: finite nest materials & energy, anatomy-based protection, care cost/cooldown, saved nests, egg predation, non-guaranteed incubation and legacy saves PASS');
