import assert from 'node:assert/strict';
import {World} from '../src/world/world.js';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {deriveDrainage} from '../src/world/topography.js';
import {routePlanetaryRunoff} from '../src/world/planetary-runoff.js';
import {TERRAIN_SEDIMENT} from '../src/world/terrain-sediment.js';
import {PLANETARY_WETBED,validateWetbedPolicy} from '../src/world/planetary-wetbed-sediment.js';
import {PLANETARY_SEAM_RUNOFF} from '../src/world/planetary-seam-runoff.js';
import {REGIONAL_REPLAY} from '../src/world/planetary-offscreen-biology.js';
import {reconcilePlanetarySaltSeams,validatePlanetarySeamLedger} from '../src/world/planetary-seam-salt.js';

const policy=PLANETARY_WETBED.policy;
function local({modern=true,outlet=true,wet=true}={}){
 const n=4,len=16,water=new Uint8Array(len),depth=new Float32Array(len),
  volume=new Float64Array(len),overland=new Float64Array(len),
  salt=new Float64Array(len),elevation=new Float32Array(len).fill(.95);
 elevation[5]=.85;elevation[6]=.2;elevation[7]=.1;
 overland[5]=.18;
 if(wet){water[6]=1;depth[6]=.4;volume[6]=.4;salt[6]=.12}
 if(wet&&outlet){water[7]=1;depth[7]=.06;volume[7]=.06}
 const beforeWater=.18+volume[6]+volume[7],beforeSalt=salt[6];
 const row={day:1,before:beforeSalt,after:beforeSalt,input:0,output:0,closure:0,
  waterBefore:beforeWater,waterAfter:beforeWater,waterInput:0,waterOutput:0,waterClosure:0};
 const w={n,len,generator:'planetary/1',water,
  terrain:{schema:1,elevation,travelEnabled:true},
  environment:{schema:6,overland,volume,depth,salt,day:1,totals:{},
   lastDay:row,daily:[row],terrainSedimentPolicy:TERRAIN_SEDIMENT.policy,
   ...(modern?{wetbedSedimentPolicy:policy}:{})}};
 deriveDrainage(w);return w;
}
const w=local(),e=w.environment;
const beforeW=e.overland.reduce((a,v)=>a+v,0)+e.volume.reduce((a,v)=>a+v,0),
 beforeS=e.salt.reduce((a,v)=>a+v,0),
 beforeH=w.terrain.elevation[5]+w.terrain.elevation[6];
const step=routePlanetaryRunoff(w,new Float64Array(w.len),1);
assert.ok(step.delivered>0);
assert.ok(e.lastDay.wetbedSedimentMoved>0);
assert.equal(e.lastDay.wetbedSedimentMoved,e.lastDay.wetbedWaterDisplaced);
assert.ok(w.terrain.elevation[5]<Math.fround(.85)&&w.terrain.elevation[6]>Math.fround(.2));
assert.ok(e.volume[7]>.06,'actual downstream wet inventory receives displaced water');
assert.ok(e.salt[7]>0,'dissolved salt is advected with displaced water');
assert.ok(Math.abs(e.overland.reduce((a,v)=>a+v,0)+e.volume.reduce((a,v)=>a+v,0)-beforeW)<1e-9);
assert.ok(Math.abs(e.salt.reduce((a,v)=>a+v,0)-beforeS)<1e-9);
assert.ok(Math.abs(w.terrain.elevation[5]+w.terrain.elevation[6]-beforeH)<1e-7);
assert.ok(Math.abs(e.lastDay.waterClosure)<1e-8);
assert.equal(w.terrain.downstream[5],6);
validateWetbedPolicy(w,e);
const blocked=local({outlet:false});
routePlanetaryRunoff(blocked,new Float64Array(blocked.len),1);
assert.equal(blocked.environment.lastDay.wetbedSedimentMoved,0);
assert.equal(blocked.environment.salt[6],.12);
const historical=local({modern:false});
routePlanetaryRunoff(historical,new Float64Array(historical.len),1);
assert.equal(historical.environment.lastDay.wetbedSedimentMoved,undefined);
assert.equal(historical.environment.salt[7],0);
const falseReceipt=structuredClone(e);
falseReceipt.lastDay.wetbedWaterDisplaced+=.01;
assert.throws(()=>validateWetbedPolicy(w,falseReceipt),
 /Unbalanced planetary wetbed sediment displacement/);

// Paired border: sediment entering the neighbor must conserve terrain mass.
// Internally displaced wet water and salt remain in the recipient region.
const n=128,len=n*n;
function region(x){
 const water=new Uint8Array(len),depth=new Float32Array(len),volume=new Float64Array(len),
  overland=new Float64Array(len),salt=new Float64Array(len),
  boundary=new Uint8Array(len),elevation=new Float32Array(len).fill(.95);
 if(x===0){overland[n-1]=1.2;elevation[n-1]=.85}
 else{water[0]=water[1]=1;depth[0]=volume[0]=.4;
  depth[1]=volume[1]=.06;salt[0]=.12;elevation[0]=.2;elevation[1]=.1}
 const surface=overland.reduce((a,v)=>a+v,0)+volume.reduce((a,v)=>a+v,0),
  saltAmount=salt.reduce((a,v)=>a+v,0);
 const row={day:1,before:saltAmount,after:saltAmount,input:0,output:0,closure:0,
  waterBefore:surface,waterAfter:surface,waterInput:0,waterOutput:0,waterClosure:0};
 const world={n,len,generator:'planetary/1',planet:{},regionOrigin:{x,y:0},
  water,terrain:{schema:1,elevation},environment:{schema:6,depth,volume,overland,
   salt,boundary,day:1,lastDay:row,daily:[row],totals:{saltInput:0,saltOutput:0},
   seamRunoffPolicy:PLANETARY_SEAM_RUNOFF.policy,terrainSedimentPolicy:TERRAIN_SEDIMENT.policy,
   wetbedSedimentPolicy:policy},buildHydrology(){}};
 deriveDrainage(world);return world;
}
const a=region(0),b=region(128),session={key:'128,0',biologicalMode:'canonical-ticks/1',
 snapshot:{core:{day:2,tickCount:CFG.dayTicks},world:{
  regionOrigin:b.regionOrigin,surfaceWater:{mask:b.water},terrain:b.terrain,environment:b.environment}}};
const sim={world:a,day:2,tickCount:CFG.dayTicks,
 regionalReplayPolicy:REGIONAL_REPLAY.synchronized,planetaryTravel:{sessions:[session]}};
const beforeHeight=a.terrain.elevation[n-1]+b.terrain.elevation[0];
const receipts=reconcilePlanetarySaltSeams(sim);
assert.equal(receipts.length,1);
assert.ok(receipts[0].bedSedimentAToB>0);
assert.equal(receipts[0].sedimentAToB,receipts[0].bedSedimentAToB);
assert.ok(Math.abs(a.terrain.elevation[n-1]+b.terrain.elevation[0]-beforeHeight)<1e-7);
assert.ok(Math.abs(a.environment.overland[n-1]+b.environment.volume[0]+b.environment.volume[1]-1.66)<1e-8);
assert.ok(Math.abs(b.environment.salt[0]+b.environment.salt[1]-.12)<1e-10);
assert.equal(b.environment.totals.wetbedWaterDisplaced,receipts[0].bedSedimentAToB);
validatePlanetarySeamLedger(sim.planetaryTravel.seamLedger);
assert.deepEqual(reconcilePlanetarySaltSeams(sim),[]);
const bogus=structuredClone(sim.planetaryTravel.seamLedger);
bogus.history[0].bedSedimentAToB=bogus.history[0].sedimentAToB+1;
assert.throws(()=>validatePlanetarySeamLedger(bogus),/Invalid paired planetary seam receipt/);

// New planetary saves retain the bed authority. Old policy-free saves are
// not silently migrated to modern riverbed rules.
const playable=new Simulation('GENVO8-TEST-A',{player:false,bootstrap:false,
 worldGenerator:'planetary/1',planetOrigin:{x:0,y:2560}});
assert.equal(playable.world.environment.wetbedSedimentPolicy,policy);
const checkpoint=structuredClone(createSimulationSnapshot(playable,{savedAt:'fixed',reason:'wetbed'}));
const restored=restoreSimulationSnapshot(structuredClone(checkpoint));
assert.equal(restored.world.environment.wetbedSedimentPolicy,policy);
const old=structuredClone(checkpoint);
delete old.world.environment.wetbedSedimentPolicy;
assert.equal(restoreSimulationSnapshot(old).world.environment.wetbedSedimentPolicy,undefined);
const corrupt=structuredClone(checkpoint);
corrupt.world.environment.wetbedSedimentPolicy='unreviewed-wetbed/9';
assert.throws(()=>restoreSimulationSnapshot(corrupt),/Invalid planetary wetbed-sediment policy/);
console.log('Planetary wetbeds: funded riverbed deposition, displaced volume/salt, paired receipts, isolated pools, historical save behavior PASS');
