import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {advanceWindPollination,botanicalResourceMass} from '../src/ecology/botanical-reproduction.js';
import {botanicalHash} from '../src/ecology/botanical-genetics.js';
import {planetaryWindSeedOffset,WIND_SEED_POLICIES} from '../src/world/weather-fronts.js';

// Actual planetary terrain and finite flowering plant stocks. No animal,
// pollen, ovule, genotype or reward is fabricated for this test.
const sim=new Simulation('GENVO8-TEST-A',{player:false,bootstrap:false,
 worldGenerator:'planetary/1',planetOrigin:{x:0,y:2560}});
sim.phaseClimate();
sim.phaseVegetation();
const d=sim.dispersal,b=d.botanical,w=sim.world,n=w.n;
// Pollen packets whose next wind draw lands on a living flower.
const downwind=()=>{
 const nextDay=sim.day+1,nextEpoch=b.epoch+1;
 const flowerCells=new Set([...b.flowers.values()].filter(f=>f.mass>0).map(f=>f.i));
 let count=0;
 for(const p of b.pollen.values()){
  const hash=botanicalHash(p.genome.id+'|wind-pollen|'+p.serial+'|'+nextEpoch);
  const [dx,dy]=planetaryWindSeedOffset(w,nextDay,p.i,hash/4294967296);
  const x=p.i%n+dx,y=Math.floor(p.i/n)+dy;
  if(x<1||y<1||x>=n-1||y>=n-1||w.water[y*n+x])continue;
  if(flowerCells.has(y*n+x))count++;
 }
 return count;
};
// This region opens too cold to flower; ordinary days pass until the season
// warms and the existing flora flowers densely enough to have downwind neighbours.
for(let day=0;day<40&&!(b.pollen.size&&b.flowers.size&&downwind());day++)
 for(let t=0;t<CFG.dayTicks;t++)sim.update(null);
assert.equal(sim.dispersal.botanical,b,'the botanical authority persists across days');
assert.equal(d.windSeedPolicy,WIND_SEED_POLICIES.planetary);
assert.ok(b.pollen.size>0&&b.flowers.size>0,'existing flora has funded gametes');
const nextDay=sim.day+1,nextEpoch=b.epoch+1,candidates=downwind();
assert.ok(candidates>0,'naturally located flowering neighbors exist downwind');

const mass=()=>botanicalResourceMass(d)+d.litter.reduce((sum,v)=>sum+v,0);
const before=mass(),pollen=b.pollen.size,deliveredBefore=b.stats.delivered,rng=sim.rng.state;
b.epoch=nextEpoch;sim.day=nextDay;
const moved=advanceWindPollination(d);
assert.ok(moved>0,'funded pollen reaches a nearby receptive flower');
assert.equal(b.pollen.size,pollen-moved,'transport removes exactly one original pollen packet');
assert.equal(b.stats.delivered,deliveredBefore+moved,'every delivery uses canonical pollen rules');
assert.ok(Math.abs(mass()-before)<Math.max(1e-5,before*1e-6),
 'pollen, fertilized ovules and Float32 litter remain accounted within precision');
assert.equal(sim.rng.state,rng,'wind pollination does not consume wildlife RNG');
assert.ok(b.receipts.some(r=>r.route==='wind'),'the actual botanical receipt identifies wind transport');
assert.ok(b.stats.recognized+b.stats.rejected>0,'receptor acceptance or refusal was actually evaluated');

// Disabled and historical missing-policy worlds do not acquire new pollen
// transfers through controller upgrade or a change to the active simulation.
const legacy=d.windSeedPolicy;
d.windSeedPolicy=undefined;
const absentBefore=mass(),packets=b.pollen.size;
assert.equal(advanceWindPollination(d),0);
assert.equal(b.pollen.size,packets);
assert.equal(mass(),absentBefore);
d.windSeedPolicy=legacy;
console.log('Funded planetary pollen transport, inherited recognition, biological receipts, conservation, and historical wind opt-out PASS');
