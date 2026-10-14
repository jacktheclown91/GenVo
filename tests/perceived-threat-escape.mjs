import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {escapeDestination} from '../src/world/escape-route.js';
function scene(species,unseen=false,refuge=false){
  const sim=new Simulation('PERCEIVED-ESCAPE-'+species,{player:false}),w=sim.world;
  w.water.fill(0);if(refuge)for(let y=0;y<w.n;y++)w.water[w.idx(41,y)]=1;
  w.buildLandRegions();w.buildHydrology();
  const prey=sim.animals.find(a=>a.species===species),allHunters=sim.animals.filter(a=>a.species==='needlejaw'),hunters=allHunters.slice(0,2);
  const swimmer=refuge?structuredClone(prey.bodyPlan):null;
  if(swimmer)for(const n of swimmer.nodes)if(/^root\/limb\.\d+$/.test(n.id))n.partId='webbed-leg';
  Object.assign(prey,{x:40.5,y:40.5,age:SPECIES[species].maturity+2,energy:SPECIES[species].maxEnergy*.9,hydration:SPECIES[species].maxHydration,bodyPlan:swimmer,adaptations:[],ecoLifestyle:null});
  prey.genes.senses=1;
  Object.assign(hunters[0],{x:39.5,y:40.5,age:60});Object.assign(hunters[1],{x:42.5,y:40.5,age:60});
  const distant=allHunters[2];Object.assign(distant,{x:70.5,y:40.5,age:60});
  sim.animals=[prey,...hunters,...(unseen?[distant]:[])];sim.rebuildSpatial();sim.phaseDecision(null);
  return{sim,prey,hunters};
}
for(const species of ['mosskip','rootling','genvo']){
  const {sim,prey,hunters}=scene(species);
  assert.equal(prey.intent,'escape');
  const start=Math.min(...hunters.map(h=>Math.hypot(h.x-prey.x,h.y-prey.y)));
  const end=Math.min(...hunters.map(h=>Math.hypot(h.x-prey.target.x,h.y-prey.target.y)));
  assert.ok(end>start,'escaping one perceived hunter cannot choose the other hunter as its destination when open alternatives exist');
  for(let k=0;k<=100;k++){
    const x=prey.x+(prey.target.x-prey.x)*k/100,y=prey.y+(prey.target.y-prey.y)*k/100;
    assert.ok(Math.min(...hunters.map(h=>Math.hypot(h.x-x,h.y-y)))>=start-1e-9,'the escape segment does not pass through another sensed hunter');
  }
  assert.ok(sim.canOccupy(prey,prey.target.x,prey.target.y));
  const repeat=scene(species);assert.deepEqual(repeat.prey.target,prey.target);
  const outside=scene(species,true);assert.deepEqual(outside.prey.target,prey.target,'unperceived predators do not steer the route');
  const state=sim.rng.state,energy=prey.energy,health=prey.health,population=sim.population();
  escapeDestination(sim,prey,{x:42.5,y:40.5},hunters);
  assert.equal(sim.rng.state,state,'route scoring draws no simulation RNG');
  assert.equal(prey.energy,energy);assert.equal(prey.health,health);assert.deepEqual(sim.population(),population);
}
const wet=scene('mosskip',false,true);
assert.equal(wet.prey.intent,'escape');
assert.ok(wet.sim.world.water[wet.sim.world.idx(wet.prey.target.x,wet.prey.target.y)],'a real webbed body retains a refuge unavailable to both hunters');
assert.ok(wet.hunters.every(h=>!wet.sim.canReach(h,wet.prey.target.x,wet.prey.target.y)),'predator body access is still authoritative');
console.log('escape considers simultaneously perceived predators: PASS');
