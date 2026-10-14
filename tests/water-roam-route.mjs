import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {RNG} from '../src/core/rng.js';
import {roamWater} from '../src/lineage/aquatic.js';
import {wetSegment} from '../src/world/water-route.js';
const sim=new Simulation('WATER-ROAM-ROUTE',{player:false}),w=sim.world;
w.water.fill(0);
// Parallel wet channels with a real connection around a dry peninsula.
for(let y=20;y<=30;y++)for(const x of [24,26])w.water[w.idx(x,y)]=1;
w.water[w.idx(25,20)]=1;w.buildLandRegions();w.buildHydrology();
const rng=new RNG('WET-CHANNEL-ROAM');let targets=0;
for(let n=0;n<100;n++){
  const target=roamWater(w,rng,24.5,25.5,3);if(!target)continue;targets++;
  const length=Math.hypot(target.x-24.5,target.y-25.5),steps=Math.ceil(length*100);
  for(let k=0;k<=steps;k++){
    const f=steps?k/steps:0,x=24.5+(target.x-24.5)*f,y=25.5+(target.y-25.5)*f;
    assert.ok(w.water[w.idx(x,y)],'a water roaming trip cannot shortcut across the dry peninsula');
  }
}
assert.ok(targets>0,'valid near-channel destinations still exist');
assert.equal(wetSegment(w,24.5,25.5,26.5,25.5),false,'wet endpoints do not imply a wet trip');
assert.equal(wetSegment(w,24.5,25.5,24.5,28.5),true);
assert.equal(wetSegment(w,24.5,25.5,24.5,25.5),true);
assert.equal(wetSegment(w,25.5,25.5,24.5,25.5),false,'dry starts do not count as wet roaming');
assert.equal(wetSegment(w,24.5,25.5,NaN,25.5),false);
w.water.fill(0);w.water[w.idx(24,24)]=1;w.water[w.idx(25,25)]=1;
assert.equal(wetSegment(w,24.5,24.5,25.5,25.5),false,'diagonal corner cannot cut between two dry cells');
w.water[w.idx(24,25)]=1;w.water[w.idx(25,24)]=1;
assert.equal(wetSegment(w,24.5,24.5,25.5,25.5),true);
console.log('water roaming follows wet segments: PASS');
