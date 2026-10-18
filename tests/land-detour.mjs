import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// A reachable food/mate destination across a peninsula needs a temporary
// increase in straight-line distance. Greedy wall sliding oscillates here.
function scene(){
  const sim=new Simulation('LAND-DETOUR',{player:false}),w=sim.world;
  w.water.fill(0);
  for(let y=20;y<=30;y++)w.water[w.idx(25,y)]=1;
  w.buildLandRegions();w.buildHydrology();
  const a=sim.animals.find(a=>a.species==='rootling');
  a.x=22.5;a.y=25.5;a.adaptations=[];a.ecoLifestyle=null;
  a.intent='explore';a.target={x:28.5,y:25.5};a.pursuitEngaged=false;
  sim.animals=[a];sim.rebuildSpatial();
  sim.activity.movementBudget=()=>({advance:true,scale:1});
  sim.activity.ambientMoveAllowed=()=>true;
  return {sim,a};
}
const {sim,a}=scene();
assert.ok(sim.canReach(a,a.target.x,a.target.y),'destination is genuinely connected');
for(let k=0;k<2400&&Math.hypot(a.x-28.5,a.y-25.5)>.2;k++){
  sim.phaseMovement();assert.ok(sim.canOccupy(a,a.x,a.y),'detour never enters water or unplayable border');
}
assert.ok(Math.hypot(a.x-28.5,a.y-25.5)<.2,'autonomous movement reaches connected destination around the long bank');

const checkpointScene=scene();
for(let k=0;k<1000&&!checkpointScene.a.navigationRoute;k++)checkpointScene.sim.phaseMovement();
assert.ok(checkpointScene.a.navigationRoute,'blocked movement stores a real detour');
const saved=structuredClone(createSimulationSnapshot(checkpointScene.sim));
const restored=restoreSimulationSnapshot(saved),copy=restored.animals[0];
// Water topology is regenerated from seeds in production saves. Reapply this
// deliberately artificial obstacle fixture to both otherwise identical states.
restored.world.water.set(checkpointScene.sim.world.water);
restored.world.buildLandRegions();restored.world.buildHydrology();
restored.activity.movementBudget=()=>({advance:true,scale:1});
restored.activity.ambientMoveAllowed=()=>true;
assert.deepEqual(copy.navigationRoute,checkpointScene.a.navigationRoute,'save retains the next detour waypoint');
for(let k=0;k<1800;k++){checkpointScene.sim.phaseMovement();restored.phaseMovement()}
assert.deepEqual({x:copy.x,y:copy.y,energy:copy.energy,route:copy.navigationRoute},
  {x:checkpointScene.a.x,y:checkpointScene.a.y,energy:checkpointScene.a.energy,route:checkpointScene.a.navigationRoute},
  'checkpoint continuation is exact while following a detour');
assert.ok(Math.hypot(copy.x-28.5,copy.y-25.5)<.2);

// Fast bodies must stop at a waypoint rather than overshooting it forever.
const fast=scene();fast.a.species='needlejaw';fast.a.genes.motion=1.3;
for(let k=0;k<1000&&Math.hypot(fast.a.x-28.5,fast.a.y-25.5)>.2;k++){
  fast.sim.phaseMovement();assert.ok(fast.sim.canOccupy(fast.a,fast.a.x,fast.a.y));
}
assert.ok(Math.hypot(fast.a.x-28.5,fast.a.y-25.5)<.2,JSON.stringify({x:fast.a.x,y:fast.a.y,route:fast.a.navigationRoute}));

const swimmer={...a,adaptations:['webbed-limbs']};
assert.equal(sim.canReach(swimmer,-1,25.5),false,'swimming does not advertise an off-world route');
console.log('connected land detour: PASS');
