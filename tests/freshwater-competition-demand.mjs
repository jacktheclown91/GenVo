import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {createDraft,place} from '../src/lineage/evolution-draft.js';
import {PARTS} from '../src/lineage/part-registry.js';
function aquatic(a,mouth){
  const draft=createDraft({base:a.bodyPlan,ancestry:Object.keys(PARTS),budget:99});
  for(const n of a.bodyPlan.nodes.filter(n=>n.socket?.startsWith('limb.')))assert.ok(place(draft,'webbed-leg','root',n.socket).ok);
  for(const [part,socket] of [['paddle-tail','tail'],['gill-slits','flank.left'],[mouth,'mouth']])assert.ok(place(draft,part,'root',socket).ok);
  a.bodyPlan=draft.plan;
}
const sim=new Simulation('FRESHWATER-COMPETITION-DEMAND',{player:false}),a=sim.animals.find(a=>a.species==='mosskip'),b=sim.animals.find(a=>a.species==='genvo'),w=sim.world;
sim.animals=[a,b];a.x=b.x=50.5;a.y=b.y=50.5;
w.water.fill(1);w.buildLandRegions();w.buildHydrology();for(const f of Object.values(w.plants))f.fill(0);for(const f of Object.values(w.freshwaterFood))f.fill(0);w.carrion.fill(0);w.freshwaterFood.algae.fill(1);
aquatic(a,'filter-mouth');aquatic(b,'filter-mouth');sim.rebuildSpatial();
const shared=sim.carrying.breedingState(a);
assert.equal(shared.competitors,1,'two different origins consuming the same available algae count full shared demand once');
aquatic(b,'tearing-jaw');sim.carrying.forageCache.clear();
const separate=sim.carrying.breedingState(a);
assert.equal(separate.competitors,0,'a jaw that cannot eat the available algae does not claim its supply through origin diets');
assert.equal(w.freshwaterFood.algae[w.idx(a.x,a.y)],1,'capacity queries do not consume or create food');
console.log('freshwater competition follows actual mouths and available shared supplies: PASS');
