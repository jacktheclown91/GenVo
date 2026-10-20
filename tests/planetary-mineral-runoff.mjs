import assert from 'node:assert/strict';
import {PLANETARY_MINERAL_RUNOFF,validateMineralRunoffPolicy} from '../src/world/planetary-mineral-runoff.js';
import {routePlanetaryRunoff} from '../src/world/planetary-runoff.js';
import {reconcilePlanetarySaltSeams,validatePlanetarySeamLedger} from '../src/world/planetary-seam-salt.js';
import {PLANETARY_SEAM_RUNOFF} from '../src/world/planetary-seam-runoff.js';
import {REGIONAL_REPLAY} from '../src/world/planetary-offscreen-biology.js';
import {CFG} from '../src/sim/config.js';
import {World} from '../src/world/world.js';
import {validateEnvironment} from '../src/world/environment.js';

const policy=PLANETARY_MINERAL_RUNOFF.policy;
function local(enabled=true){
 const n=4,len=n*n,water=new Uint8Array(len),overland=new Float64Array(len),
  volume=new Float64Array(len),salt=new Float64Array(len),depth=new Float32Array(len),
  elevation=new Float32Array(len),downstream=new Int32Array(len).fill(-1),
  boundary=new Uint8Array(len),minerals=new Float64Array(len);
 water[6]=1;volume[6]=1;depth[6]=1;overland[5]=.18;
 minerals[5]=.8;minerals[6]=.12;downstream[5]=6;elevation[5]=.8;elevation[6]=.2;
 const row={day:1,waterBefore:1.18,waterAfter:1.18,waterInput:0,waterOutput:0,
  waterClosure:0,before:0,after:0,input:0,output:0,closure:0};
 return{n,len,generator:'planetary/1',water,terrain:{elevation,downstream},
  environment:{schema:6,...(enabled?{mineralRunoffPolicy:policy}:{}),overland,
   volume,depth,boundary,salt,day:1,totals:{},lastDay:row,daily:[row]},
  plantResources:{minerals,totals:{}}};
}
const world=local(),before=world.plantResources.minerals[5]+world.plantResources.minerals[6];
const receipt=routePlanetaryRunoff(world,new Float64Array(world.len),1);
assert.ok(receipt.delivered>0);
assert.ok(world.plantResources.minerals[5]<.8);
assert.ok(world.plantResources.minerals[6]>.12);
assert.ok(Math.abs(world.plantResources.minerals[5]+world.plantResources.minerals[6]-before)<1e-12);
assert.ok(Math.abs(world.environment.lastDay.waterClosure)<1e-9);
assert.equal(world.environment.lastDay.runoffMineralsMoved,
 world.plantResources.minerals[6]-.12);
const legacy=local(false);
routePlanetaryRunoff(legacy,new Float64Array(legacy.len),1);
assert.equal(legacy.plantResources.minerals[5],.8);
assert.equal(legacy.plantResources.minerals[6],.12);
const corrupt=local();
corrupt.plantResources.minerals[5]=NaN;
assert.throws(()=>routePlanetaryRunoff(corrupt,new Float64Array(corrupt.len),1),
 /Invalid runoff-mineral source stock/);
assert.equal(corrupt.plantResources.minerals[6],.12,
 'a malformed source cannot partially credit the recipient');

const n=128,len=n*n;
function region(x,index,{wet=false,runoff=0,nutrient=0,modern=true}={}){
 const water=new Uint8Array(len),depth=new Float32Array(len),
  volume=new Float64Array(len),overland=new Float64Array(len),
  salt=new Float64Array(len),boundary=new Uint8Array(len),
  minerals=new Float64Array(len),elevation=new Float32Array(len);
 water[index]=wet?1:0;volume[index]=wet?1:0;depth[index]=wet?1:0;
 overland[index]=wet?0:runoff;minerals[index]=nutrient;
 elevation[index]=x===0?.8:.2;
 const amount=overland[index]+volume[index];
 const row={day:1,before:0,after:0,input:0,output:0,closure:0,
  waterBefore:amount,waterAfter:amount,waterInput:0,waterOutput:0,waterClosure:0};
 const environment={schema:6,volume,depth,salt,boundary,overland,day:1,
  lastDay:row,daily:[row],totals:{saltInput:0,saltOutput:0},
  ...(modern?{seamRunoffPolicy:PLANETARY_SEAM_RUNOFF.policy,
   mineralRunoffPolicy:policy}:{})};
 return{generator:'planetary/1',n,len,planet:{},regionOrigin:{x,y:0},
  water,terrain:{elevation},environment,plantResources:{minerals},buildHydrology(){}};
}
function link(a,b){
 return{world:a,day:2,tickCount:CFG.dayTicks,regionalReplayPolicy:REGIONAL_REPLAY.synchronized,
 planetaryTravel:{schema:1,nextId:1,sessions:[{key:'128,0',biologicalMode:'canonical-ticks/1',
  snapshot:{core:{day:2,tickCount:CFG.dayTicks},world:{
   regionOrigin:b.regionOrigin,surfaceWater:{mask:b.water},terrain:b.terrain,
   environment:b.environment,plantResources:b.plantResources}}}]}};
}
for(const wet of [false,true]){
 const a=region(0,127,{runoff:.6,nutrient:.9}),b=region(128,0,{wet,runoff:wet?0:.1,nutrient:.1}),sim=link(a,b);
 const total=.9+.1,rows=reconcilePlanetarySaltSeams(sim);
 assert.equal(rows.length,1);
 assert.ok(rows[0].waterAToB>0&&rows[0].mineralsAToB>0);
 assert.ok(rows[0].mineralsAToB<=.9*PLANETARY_MINERAL_RUNOFF.maxMobileFraction+1e-9);
 assert.ok(Math.abs(a.plantResources.minerals[127]+b.plantResources.minerals[0]-total)<1e-10);
 assert.ok(Math.abs(a.environment.lastDay.waterClosure)<1e-8);
 assert.ok(Math.abs(b.environment.lastDay.waterClosure)<1e-8);
 assert.ok(Math.abs(a.environment.totals.seamMineralsOutput-b.environment.totals.seamMineralsInput)<1e-10);
 validatePlanetarySeamLedger(sim.planetaryTravel.seamLedger);
 assert.deepEqual(reconcilePlanetarySaltSeams(sim),[]);
 const forged=structuredClone(sim.planetaryTravel.seamLedger);
 forged.history[0].mineralsAToB=-1;
 assert.throws(()=>validatePlanetarySeamLedger(forged),/Invalid paired planetary seam receipt/);
}
const oldA=region(0,127,{runoff:.6,nutrient:.9,modern:false});
const oldB=region(128,0,{runoff:.1,nutrient:.1,modern:false});
assert.deepEqual(reconcilePlanetarySaltSeams(link(oldA,oldB)),[]);
assert.equal(oldA.plantResources.minerals[127],.9);
assert.equal(oldB.plantResources.minerals[0],.1);

const actual=new World('GENVO8-TEST-A',{generator:'planetary/1',planetOrigin:{x:0,y:2560}});
assert.equal(actual.environment.mineralRunoffPolicy,policy);
validateEnvironment(actual,actual.environment);
const invalid=local();
invalid.environment.mineralRunoffPolicy='imaginary-mineral-system/9';
assert.throws(()=>validateMineralRunoffPolicy(invalid,invalid.environment),
 /Invalid planetary runoff-mineral policy/);
console.log('Planetary mineral runoff: finite land and aquatic nutrient transport, local/paired conservation, invalid stock rejection and historical isolation PASS');
