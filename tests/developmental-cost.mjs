import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';

function costs(species,age){
  const sim=new Simulation('DEVELOPMENTAL-COST',{player:false});sim.phaseClimate();
  const a=sim.animals.find(a=>a.species===species);
  sim.world.water.fill(0);sim.world.buildLandRegions();sim.world.buildHydrology();
  Object.assign(a,{x:40.5,y:40.5,age,health:100,genes:{body:1,motion:1,metabolism:1,digestion:1,senses:1,climate:1,immunity:1,temperament:1},adaptations:[],ecoLifestyle:null,energy:SPECIES[species].maxEnergy*.9,intent:'explore',target:{x:60.5,y:40.5}});
  sim.animals=[a];sim.rebuildSpatial();sim.activity.movementBudget=()=>({advance:true,scale:1});sim.activity.ambientMoveAllowed=()=>true;
  const initial=a.energy,water=a.hydration;sim.phaseMetabolism();const maintenance=initial-a.energy;
  const start=a.energy;sim.phaseMovement();return {maintenance,water:water-a.hydration,movement:start-a.energy,distance:a.x-40.5};
}
for(const species of Object.keys(SPECIES)){
  const adult=costs(species,SPECIES[species].maturity),young=costs(species,0),mid=costs(species,SPECIES[species].maturity/2);
  assert.ok(young.maintenance<adult.maintenance*.5,`${species}: newborn tissue does not pay full adult maintenance`);
  assert.ok(young.movement<adult.movement*.5,`${species}: moving a newborn costs less than moving an adult`);
  assert.ok(young.water<adult.water*.5,'hydration demand follows the same developing tissue');
  assert.ok(young.maintenance<mid.maintenance&&mid.maintenance<adult.maintenance,'maintenance grows gradually with body development');
  assert.equal(young.distance,adult.distance,'this cost correction does not grant movement speed');
}
function manual(age){
  const sim=new Simulation('MANUAL-DEVELOPMENT',{player:true}),a=sim.player();
  sim.world.water.fill(0);a.x=40.5;a.y=40.5;a.age=age;a.energy=100;
  const before=a.energy;sim.phasePlayerMovement({right:true});return{cost:before-a.energy,distance:a.x-40.5};
}
const adult=manual(SPECIES.genvo.maturity),young=manual(0);
assert.ok(young.cost<adult.cost*.5,'playable young use the same physical mass as autonomous young');
assert.equal(young.distance,adult.distance,'manual steering speed stays unchanged');
console.log('developmental movement and maintenance costs: PASS');
