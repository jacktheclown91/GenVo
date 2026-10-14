import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {createDraft,place} from '../src/lineage/evolution-draft.js';
import {preyNormalization} from '../src/ecology/prey-normalization.js';
import {bodyMass,bodyMassFraction} from '../src/organisms/body-mass.js';
import {PARTS} from '../src/lineage/part-registry.js';
const sim=new Simulation('FRESHWATER-HUNTER-CAPACITY',{player:false}),a=sim.animals.find(a=>a.species==='needlejaw'),w=sim.world;
const terrestrialPlan=a.bodyPlan;const draft=createDraft({base:a.bodyPlan,ancestry:Object.keys(PARTS),budget:99});
for(const n of a.bodyPlan.nodes.filter(n=>n.socket?.startsWith('limb.')))assert.ok(place(draft,'webbed-leg','root',n.socket).ok);
for(const [part,socket] of [['paddle-tail','tail'],['gill-slits','flank.left']])assert.ok(place(draft,part,'root',socket).ok);
a.bodyPlan=draft.plan;a.x=50.5;a.y=50.5;sim.animals=[a];sim.rebuildSpatial();w.water.fill(1);w.buildLandRegions();w.buildHydrology();
for(const f of Object.values(w.plants))f.fill(0);for(const f of Object.values(w.freshwaterFood))f.fill(0);w.carrion.fill(0);
const empty=sim.carrying.breedingState(a);assert.equal(empty.allowed,false);
w.freshwaterFood.fry.fill(.35);sim.carrying.forageCache.clear();const rng=sim.rng.state;
const fed=sim.carrying.breedingState(a);assert.ok(fed.resource>empty.resource,'finite accessible aquatic prey contributes to hunter resource capacity');
assert.equal(fed.preyReference.source,'mounted-adult-anatomy');const ref=preyNormalization(sim,a);assert.equal(preyNormalization(sim,{...a,bodyPlan:null}).mass,0,'No ancestry template can fabricate a missing physical reference');assert.deepEqual(ref,preyNormalization(sim,{...a,species:'genvo'}),'Fallback units cannot be selected by a founding name');assert.ok(fed.allowed,'an abundant actual prey supply can support reproduction without animal prey agents');
assert.equal(sim.rng.state,rng);assert.equal(w.freshwaterFood.fry[w.idx(a.x,a.y)],Math.fround(.35),'survey does not harvest or replenish prey');
// Access, not raw water stock, owns usable supply. Remove lawful swimming/gills.
const aquaticPlan=a.bodyPlan;a.bodyPlan=terrestrialPlan;sim.animals=[a];sim.carrying.forageCache.clear();assert.equal(sim.carrying.breedingState(a).allowed,false,'Inaccessible aquatic biomass grants no capacity');a.bodyPlan=aquaticPlan;sim.carrying.forageCache.clear();
// A real mixed community keeps the established living adult-prey unit.
w.water[w.idx(a.x+2,a.y)]=0;w.buildLandRegions();w.buildHydrology();const prey=sim.spawnAnimal('mosskip',a.x+2,a.y);prey.age=100;const mixed=preyNormalization(sim,a);assert.equal(mixed.source,'living-eligible-adult-unit');assert.equal(mixed.mass,bodyMass(prey)/bodyMassFraction(prey));sim.animals=[a];sim.carrying.forageCache.clear();
w.freshwaterFood.fry.fill(.00001);sim.carrying.forageCache.clear();assert.equal(sim.carrying.breedingState(a).allowed,false,'sparse aquatic prey cannot satisfy the unchanged breeding requirement');
console.log('hunter capacity counts finite accessible aquatic nutrition conservatively: PASS');
