// Cross-region groundwater stays in the World-owned soil store. It does not
// enter surface-water volumes or create a new regional water source.
import assert from 'node:assert/strict';
import {CFG} from '../src/sim/config.js';
import {World} from '../src/world/world.js';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {validateSoilWater,soilWaterStorage} from '../src/ecology/soil-water.js';
import {PLANETARY_SEAM_GROUNDWATER} from '../src/world/planetary-seam-groundwater.js';
import {REGIONAL_REPLAY} from '../src/world/planetary-offscreen-biology.js';
import {reconcilePlanetarySaltSeams,validatePlanetarySeamLedger} from '../src/world/planetary-seam-salt.js';

const n=128,len=n*n,west=n-1,east=0;
function region(x,i,ground,elevation,{wet=false,policy=true}={}){
 const water=new Uint8Array(len),salt=new Float64Array(len),volume=new Float64Array(len),
  depth=new Float32Array(len),boundary=new Uint8Array(len),overland=new Float64Array(len);
 water[i]=wet?1:0;
 const land=new Float32Array(len),gw=new Float32Array(len),fc=new Float32Array(len).fill(.5),
  top=new Float32Array(len);
 gw[i]=ground;top[i]=elevation;
 const original=ground;
 const srow={day:1,inputs:0,outputs:0,storageBefore:original,storageAfter:original,
  storageChange:0,closure:0};
 const soil={schema:1,fieldCapacity:fc,groundwater:gw,snowpack:new Float64Array(len),
  totals:{},day:1,daily:[srow],lastDay:srow};
 if(policy)soil.seamGroundwaterPolicy=PLANETARY_SEAM_GROUNDWATER.policy;
 const row={day:1,before:0,after:0,input:0,output:0,closure:0,waterBefore:0,
  waterAfter:0,waterInput:0,waterOutput:0,waterClosure:0};
 const env={schema:6,volume,overland,salt,depth,boundary,day:1,
  totals:{saltInput:0,saltOutput:0},lastDay:row,daily:[row]};
 return{generator:'planetary/1',planet:{},n,len,regionOrigin:{x,y:0},
  water,moisture:land,terrain:{elevation:top},environment:env,soilWater:soil,buildHydrology(){}};
}
function pair(a,b){
 return{world:a,day:2,tickCount:CFG.dayTicks,
 regionalReplayPolicy:REGIONAL_REPLAY.synchronized,
 planetaryTravel:{schema:1,nextId:1,sessions:[{key:'128,0',biologicalMode:'canonical-ticks/1',
 snapshot:{core:{day:2,tickCount:CFG.dayTicks},world:{regionOrigin:b.regionOrigin,
 surfaceWater:{mask:b.water},terrain:b.terrain,moisture:b.moisture,
 environment:b.environment,soilWater:b.soilWater}}}]}};
}
// Finite head difference moves groundwater from a high source to a lower
// adjacent land cell, with conservation despite Float32 storage rounding.
const a=region(0,west,.8,.8),b=region(128,east,.2,.2),sim=pair(a,b);
const previous=soilWaterStorage(a)+soilWaterStorage(b);
const entries=reconcilePlanetarySaltSeams(sim);
assert.equal(entries.length,1,'a groundwater-only pair must be retained');
assert.ok(entries[0].groundwaterAToB>0);
assert.equal(entries[0].aToB+entries[0].bToA,0);
assert.equal((entries[0].waterAToB||0)+(entries[0].waterBToA||0),0);
assert.ok(a.soilWater.groundwater[west]<.8&&b.soilWater.groundwater[east]>.2);
assert.ok(Math.abs(soilWaterStorage(a)+soilWaterStorage(b)-previous)<1e-6);
for(const world of [a,b]){
 assert.ok(Math.abs(world.soilWater.lastDay.closure)<1e-6);
 assert.ok(world.environment.lastDay.waterInput===0&&world.environment.lastDay.waterOutput===0,
  'groundwater must never appear as extra surface water');
 validateSoilWater(world,world.soilWater);
}
assert.ok(a.soilWater.totals.seamGroundwaterOutput>0);
assert.ok(b.soilWater.totals.seamGroundwaterInput>0);
validatePlanetarySeamLedger(sim.planetaryTravel.seamLedger);
assert.deepEqual(reconcilePlanetarySaltSeams(sim),[],'no double transfer in the same day');

// Flow reverses when the second region has higher hydraulic head.
const reverseA=region(0,west,.2,.1),reverseB=region(128,east,.8,.9);
const reversed=reconcilePlanetarySaltSeams(pair(reverseA,reverseB));
assert.ok(reversed[0].groundwaterBToA>0);
assert.ok(Math.abs(reverseA.soilWater.lastDay.closure)<1e-6);
assert.ok(Math.abs(reverseB.soilWater.lastDay.closure)<1e-6);

// No water at an unknown region, no free uphill transfer when source is dry,
// and historic worlds with no groundwater policy remain unchanged.
const alone=region(0,west,.8,.8);
assert.deepEqual(reconcilePlanetarySaltSeams({world:alone,day:2,tickCount:CFG.dayTicks,
 regionalReplayPolicy:REGIONAL_REPLAY.synchronized,
 planetaryTravel:{schema:1,nextId:1,sessions:[]}}),[]);
assert.equal(alone.soilWater.groundwater[west],Math.fround(.8));
const history=pair(region(0,west,.8,.8,{policy:false}),region(128,east,.2,.2));
assert.deepEqual(reconcilePlanetarySaltSeams(history),[]);
const dry=pair(region(0,west,0,.8),region(128,east,.2,.1));
assert.deepEqual(reconcilePlanetarySaltSeams(dry),[]);
const wet=pair(region(0,west,.8,.8,{wet:true}),region(128,east,.2,.2));
assert.deepEqual(reconcilePlanetarySaltSeams(wet),[]);

// Reject non-finite soil stock before touching the other independent owner.
const brokenA=region(0,west,.8,.8),brokenB=region(128,east,.2,.2);
const bad=pair(brokenA,brokenB);
brokenA.soilWater.groundwater[west]=NaN;
assert.throws(()=>reconcilePlanetarySaltSeams(bad),/Invalid cross-region groundwater stock/);
assert.equal(brokenB.soilWater.groundwater[east],Math.fround(.2));
const forgery=structuredClone(sim.planetaryTravel.seamLedger);
forgery.history[0].groundwaterAToB=-1;
assert.throws(()=>validatePlanetarySeamLedger(forgery),/Invalid paired planetary seam receipt/);

// The new policy is versioned and the canonical save path retains both old and
// new semantics rather than reconstructing unseen historical groundwater.
const live=new Simulation('GENVO8-TEST-A',{player:false,bootstrap:false,
 worldGenerator:'planetary/1',planetOrigin:{x:0,y:2560}});
assert.equal(live.world.soilWater.seamGroundwaterPolicy,PLANETARY_SEAM_GROUNDWATER.policy);
const save=structuredClone(createSimulationSnapshot(live,{savedAt:'fixed',reason:'seam-groundwater'}));
const restored=restoreSimulationSnapshot(structuredClone(save));
assert.deepEqual(createSimulationSnapshot(restored,{savedAt:'fixed',reason:'seam-groundwater'}),save);
const old=structuredClone(save);
delete old.world.soilWater.seamGroundwaterPolicy;
assert.equal(restoreSimulationSnapshot(old).world.soilWater.seamGroundwaterPolicy,undefined);
console.log('Paired land groundwater: head-driven transfers, Float32 conservation, dry/wet guards, old saves and receipts PASS');
