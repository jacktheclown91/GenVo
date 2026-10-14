import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {escapeDestination} from '../src/world/escape-route.js';

function scene(kind,swimmer=false){
  const sim=new Simulation('ESCAPE-TARGET-'+kind,{player:false}),w=sim.world;
  w.water.fill(0);
  if(kind==='bank')for(let y=0;y<w.n;y++)w.water[w.idx(26,y)]=1;
  if(kind==='trapped'){w.water.fill(1);w.water[w.idx(24,40)]=0;w.water[w.idx(22,40)]=0}
  w.buildLandRegions();w.buildHydrology();
  const prey=sim.animals.find(a=>a.species==='mosskip'),hunter=sim.animals.find(a=>a.species==='needlejaw');
  Object.assign(prey,{x:kind==='border'?1.5:24.5,y:40.5,age:30,bodyPlan:null,adaptations:swimmer?['webbed-limbs']:[],ecoLifestyle:null,target:null});
  Object.assign(hunter,{x:kind==='border'?3.5:22.5,y:40.5,age:60,target:null});
  prey.energy=SPECIES.mosskip.maxEnergy*.9;prey.hydration=SPECIES.mosskip.maxHydration*.9;
  sim.animals=[prey,hunter];sim.rebuildSpatial();sim.phaseDecision(null);
  return{sim,prey,hunter};
}
for(const kind of ['border','bank']){
  const {sim,prey,hunter}=scene(kind);
  assert.equal(prey.intent,'escape');assert.ok(prey.target);
  assert.ok(sim.canReach(prey,prey.target.x,prey.target.y),'escape destination remains connected');
  assert.ok(sim.canOccupy(prey,prey.target.x,prey.target.y));
  for(let k=1;k<=80;k++)assert.ok(sim.canOccupy(prey,prey.x+(prey.target.x-prey.x)*k/80,prey.y+(prey.target.y-prey.y)*k/80),'the escape segment never crosses inaccessible water');
  assert.ok(Math.hypot(prey.target.x-hunter.x,prey.target.y-hunter.y)>Math.hypot(prey.x-hunter.x,prey.y-hunter.y),'available bank/border escape increases separation');
  const again=scene(kind);assert.deepEqual(again.prey.target,prey.target,'deterministic alternatives');
}
const wet=scene('bank',true);
assert.equal(wet.prey.intent,'escape');
assert.ok(wet.sim.canReach(wet.prey,wet.prey.target.x,wet.prey.target.y));
assert.ok(wet.sim.world.water[wet.sim.world.idx(wet.prey.target.x,wet.prey.target.y)],'an actual swimming body retains water refuge access');

const enclosed=scene('trapped'),state=enclosed.sim.rng.state;
const trapped=escapeDestination(enclosed.sim,enclosed.prey,{x:28.5,y:40.5});
assert.equal(enclosed.sim.rng.state,state,'escape geometry does not draw RNG');
assert.deepEqual({x:trapped.x,y:trapped.y},{x:enclosed.prey.x,y:enclosed.prey.y});
assert.equal(trapped.blocked,true,'enclosure remains dangerous rather than granting water entry');

const clear=scene('bank'),requested={x:clear.prey.x,y:clear.prey.y+3};
assert.equal(escapeDestination(clear.sim,clear.prey,requested),requested,'valid existing escape is preserved');
console.log('anatomy-accessible escape destinations: PASS');
