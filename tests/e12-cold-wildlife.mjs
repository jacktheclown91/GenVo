import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {PLANTS} from '../src/sim/config.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {COLD_BEHAVIOR,winterFatAnatomy,torporStatus,enterTorpor,wakeTorpor,maintainTorpor,torporMetabolism,torporPredationMultiplier,coldMigrationOpportunity} from '../src/ecology/cold-wildlife.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const sim=new Simulation('E12-COLD-SEASON',{player:true,bootstrap:false});
sim.climate={temp:.20,rain:.24,wind:0,frontDay:1}; // ordinary phaseClimate normally initializes this in a bootstrapped world
const root=founderPlan().nodes.map(n=>({partId:n.partId,parent:n.parent,socket:n.socket}));
const fat=makePlan([...root,{partId:'fat-tail',parent:'root',socket:'tail'}]);
const animal=sim.spawnAnimal('genvo',49.5,49.5);
animal.bodyPlan=fat;animal.player=true;sim.playerId=animal.id;animal.age=SPECIES.genvo.maturity+4;
animal.energy=SPECIES.genvo.maxEnergy*.90;animal.hydration=SPECIES.genvo.maxHydration*.90;
const i=sim.world.idx(animal.x,animal.y);sim.world.water[i]=0;sim.world.temperature[i]=.12;
sim.rebuildSpatial();
assert.equal(winterFatAnatomy(animal),true);
assert.equal(sim.torporStatus().enabled,true,'real cold & fat reserves enable deliberate torpor');
const begin=sim.playerToggleTorpor();assert.equal(begin.ok,true);
assert.equal(animal.torpor,true);
assert.equal(animal.intent,'torpor');
const sleep=torporMetabolism(animal);
assert.ok(sleep.energy<1&&sleep.water<1&&sleep.coldExposure>1,'torpor reduces maintenance but costs more cold exposure');
assert.ok(torporPredationMultiplier(animal)>1,'dormant animals are easier prey');
assert.equal(enterTorpor(sim,animal).ok,false,'re-entering torpor is not a second action');
const px=animal.x,py=animal.y,energyBefore=animal.energy,waterBefore=animal.hydration;
sim.phaseMovement();
assert.equal(animal.x,px);assert.equal(animal.y,py);
sim.phaseMetabolism();
assert.ok(animal.energy<energyBefore&&animal.hydration<waterBefore,'dormant animals still burn food and water');
assert.equal(animal.torpor,true);
const save=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'e12'})));
const resumed=save.animals.find(a=>a.id===animal.id);
assert.equal(resumed.torpor,true);assert.equal(resumed.torporStartedDay,sim.day,'torpor carries through save and load');
assert.equal(save.player().id,resumed.id);
assert.ok(save.playerToggleTorpor().ok);
assert.equal(resumed.torpor,false);
assert.equal(sim.playerToggleTorpor().ok,true);
sim.world.temperature[i]=.62;
assert.equal(maintainTorpor(sim,animal,.62),false,'warm ground wakes sleeping creature');
assert.equal(animal.torpor,false);
sim.world.temperature[i]=.12;
animal.energy=SPECIES.genvo.maxEnergy*.20;
assert.equal(torporStatus(sim,animal).enabled,false,'starving creatures cannot initiate protected sleep');
animal.energy=SPECIES.genvo.maxEnergy*.9;
sim.playerToggleTorpor();
animal.hydration=SPECIES.genvo.maxHydration*.24;
assert.equal(maintainTorpor(sim,animal,.12),false,'thirst forces an animal awake');
animal.hydration=SPECIES.genvo.maxHydration*.90;
sim.playerToggleTorpor();
const oldX=animal.x;
assert.equal(sim.phasePlayerMovement({right:true}, {stepHz:8}),true);
assert.equal(animal.torpor,false,'player movement always wakes an animal');
assert.ok(animal.x>=oldX,'normal locomotion resumes');

// Immature, pregnant and actively nursing adults cannot abandon young to torpor.
animal.age=SPECIES.genvo.maturity*.5;
assert.equal(torporStatus(sim,animal).enabled,false);
animal.age=SPECIES.genvo.maturity+5;animal.pregnant={days:2};
assert.equal(torporStatus(sim,animal).enabled,false);
animal.pregnant=null;
// Restore a stable surface and real adult reserves for automatic dormancy.
animal.x=px;animal.y=py;sim.world.temperature[i]=.11;
animal.energy=SPECIES.genvo.maxEnergy*.96;animal.hydration=SPECIES.genvo.maxHydration*.95;
animal.player=false;sim.playerId=null;
assert.equal(sim.phaseDecision(null),undefined);
assert.equal(animal.torpor,true,'wild phenotype with fat stores opts into seasonal torpor autonomously');

// A winter animal with NO fat anatomy instead considers existing connected,
// warmer habitat carrying edible biomass. No teleport or extra wild population.
const wild=sim.spawnAnimal('mosskip',63.5,63.5);
wild.player=false;wild.age=SPECIES.mosskip.maturity+4;
wild.energy=SPECIES.mosskip.maxEnergy*.91;wild.hydration=SPECIES.mosskip.maxHydration*.84;
wild.bodyPlan=makePlan(root);
assert.equal(winterFatAnatomy(wild),false);
const wi=sim.world.idx(wild.x,wild.y);
sim.world.water[wi]=0;sim.world.temperature[wi]=.12;
const winterFood=PLANTS.sunmoss;
sim.world.plants.sunmoss[wi]=.12;
let reachable=null;
for(let dy=-12;dy<=12&&!reachable;dy+=4)for(let dx=-12;dx<=12;dx+=4){
 if(!dx&&!dy||Math.hypot(dx,dy)<3||Math.hypot(dx,dy)>12)continue;
 const x=wild.x+dx,y=wild.y+dy;if(!sim.world.isPlayable(x,y)||!sim.canOccupy(wild,x,y)||!sim.canReach(wild,x,y))continue;
 reachable={x,y,i:sim.world.idx(x,y)};break;
}
assert.ok(reachable,'the existing terrain must offer at least one connected warm patch');
const {x:destX,y:destY,i:destI}=reachable;
sim.world.temperature[destI]=.68;sim.world.plants.sunmoss[destI]=winterFood.carry;
const route=coldMigrationOpportunity(sim,wild);
assert.ok(route,'cold hungry wildlife can discover finite warmer forage');
assert.ok(sim.canReach(wild,route.x,route.y)&&sim.canOccupy(wild,route.x,route.y));
assert.ok(sim.world.temperature[sim.world.idx(route.x,route.y)]>sim.world.temperature[wi]);
const rec=sim.migration.recommendWild(wild);
assert.equal(rec.reason,'cold-season refuge');
assert.equal(rec.shouldMigrate,true);
assert.ok(sim.migration.begin(wild,rec.target,rec.reason));
assert.equal(sim.migration.state(wild).purpose,'cold');
sim.migration.progress(wild);
assert.equal(sim.migration.state(wild).status,'outbound','cold route must not demand breeding availability');
wild.x=route.x;wild.y=route.y;
sim.migration.progress(wild);
assert.equal(sim.migration.state(wild).status,'settled','reaching real destination resolves cold migration');

console.log('E12 torpor: real fat phenotype, paid cold metabolism, no movement, cold/predation cost, autonomous sleep, cold-route migration, save/load, player wake PASS');
