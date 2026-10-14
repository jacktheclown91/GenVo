import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {committedFoodTarget} from '../src/ecology/food-commitment.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
function scene(){
  const sim=new Simulation('FOOD-COMMITMENT',{player:false}),w=sim.world;
  w.water.fill(0);for(let y=20;y<=30;y++)w.water[w.idx(25,y)]=1;
  for(const field of Object.values(w.plants))field.fill(0);w.carrion.fill(0);
  w.plants.bramble[w.idx(28,25)]=.7;w.buildLandRegions();w.buildHydrology();
  const a=sim.animals.find(a=>a.species==='rootling');
  Object.assign(a,{x:22.5,y:25.5,age:30,bodyPlan:null,adaptations:[],ecoLifestyle:null,energy:55,hydration:106,intent:'feed',target:{x:28.5,y:25.5,kind:'bramble'}});
  sim.animals=[a];sim.rebuildSpatial();return{sim,a,w};
}
const {sim,a,w}=scene();const target=a.target;
const rng=sim.rng.state,reserve=a.energy,stock=w.plants.bramble[w.idx(28,25)];
assert.equal(committedFoodTarget(sim,a),target);
assert.equal(sim.rng.state,rng,'retaining known food consumes no sampling RNG');
assert.equal(a.energy,reserve);assert.equal(w.plants.bramble[w.idx(28,25)],stock);
const loaded=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim)));
loaded.world.water.set(w.water);loaded.world.buildLandRegions();loaded.world.buildHydrology();
const la=loaded.animals.find(b=>b.id===a.id);
loaded.phaseDecision(null);assert.equal(la.intent,'feed');assert.deepEqual(la.target,target,'known meal survives save/load');
sim.phaseDecision(null);
assert.equal(a.intent,'feed','reachable stocked food remains a feeding goal');
assert.deepEqual(a.target,target);
const startEnergy=a.energy;
for(let k=0;k<1800&&w.plants.bramble[w.idx(28,25)]>.69;k++){
  sim.phaseDecision(null);sim.phaseMovement();sim.tickCount++;
  assert.ok(sim.canOccupy(a,a.x,a.y),'the committed trip never walks through the bank');
}
assert.ok(w.plants.bramble[w.idx(28,25)]<.69,'ordinary decisions and movement reach and consume the selected patch');
assert.ok(a.energy>startEnergy,'the trip supplies an actual finite meal');
const depleted=scene();depleted.w.plants.bramble.fill(0);depleted.sim.phaseDecision(null);
assert.notEqual(depleted.a.intent,'feed','depleted food is released');
const incompatible=scene();incompatible.a.target.kind='carrion';incompatible.w.carrion[incompatible.w.idx(28,25)]=1;
assert.equal(committedFoodTarget(incompatible.sim,incompatible.a),null,'incompatible resources cannot sustain commitment');
const disconnected=scene();for(let y=0;y<disconnected.w.n;y++)disconnected.w.water[disconnected.w.idx(25,y)]=1;
disconnected.w.buildLandRegions();disconnected.w.buildHydrology();
assert.equal(committedFoodTarget(disconnected.sim,disconnected.a),null,'disconnected meals are released');
const failed=scene();failed.a.navigationRoute={failed:true,goal:failed.w.idx(28,25)};
assert.equal(committedFoodTarget(failed.sim,failed.a),null,'a failed actual route cannot be held forever');
const danger=scene();danger.a.playerThreat={x:danger.a.x-1,y:danger.a.y,untilTick:100};danger.sim.phaseDecision(null);
assert.equal(danger.a.intent,'escape','danger overrides food commitment');
const thirsty=scene();thirsty.a.hydration=0;thirsty.sim.phaseDecision(null);
assert.equal(thirsty.a.intent,'drink','critical thirst overrides food commitment');
const satiated=scene();satiated.a.energy=SPECIES.rootling.maxEnergy;satiated.sim.phaseDecision(null);
assert.notEqual(satiated.a.intent,'feed','satiation releases the feeding goal');
console.log('finite food commitment with real bank detour and urgency overrides: PASS');
