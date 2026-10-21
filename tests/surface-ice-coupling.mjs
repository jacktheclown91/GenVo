import assert from 'node:assert/strict';
import {initializeSurfaceIce,advanceSurfaceIce,validateSurfaceIce} from '../src/world/surface-ice.js';
import {reconcilePlanetarySaltSeams} from '../src/world/planetary-seam-salt.js';
import {REGIONAL_REPLAY} from '../src/world/planetary-offscreen-biology.js';
import {CFG} from '../src/sim/config.js';
import {deriveDrainage} from '../src/world/topography.js';
import {routePlanetaryRunoff,totalPlanetarySurfaceWater} from '../src/world/planetary-runoff.js';
import {TERRAIN_SEDIMENT} from '../src/world/terrain-sediment.js';
import {PLANETARY_WETBED} from '../src/world/planetary-wetbed-sediment.js';
import {Simulation} from '../src/sim/simulation.js';
const sum=a=>a.reduce((s,v)=>s+v,0);
// Explicit physical-region fixtures; no claimed organism history.
function region(x,index,volume,salt){
 const n=128,len=n*n,water=new Uint8Array(len),depth=new Float32Array(len),v=new Float64Array(len),s=new Float64Array(len),boundary=new Uint8Array(len);water[index]=1;depth[index]=volume;v[index]=volume;s[index]=salt;boundary[index]=x===0?2:1;
 const w={generator:'planetary/1',planet:{},n,len,regionOrigin:{x,y:0},water,terrain:{schema:1,elevation:new Float32Array(len)},environment:{schema:6,day:0,depth,volume:v,salt:s,boundary,temperatureOffset:new Float32Array(len),overland:new Float64Array(len),totals:{saltInput:0,saltOutput:0}},buildHydrology(){}};
 initializeSurfaceIce(w);for(let day=1;day<=14;day++)advanceSurfaceIce(w,{temp:.1,rain:0},day);w.environment.day=14;
 const row={day:14,before:salt,after:salt,input:0,output:0,closure:0,waterBefore:volume,waterAfter:volume,waterInput:0,waterOutput:0,waterClosure:0};w.environment.lastDay=row;w.environment.daily=[row];return w;
}
const i=20*128+127,j=20*128,a=region(0,i,.8,.4),b=region(128,j,.35,.1),frozen=[a.environment.ice.slice(),b.environment.ice.slice()];
const session={key:'128,0',biologicalMode:'canonical-ticks/1',snapshot:{core:{day:15,tickCount:14*CFG.dayTicks},world:{regionOrigin:b.regionOrigin,surfaceWater:{mask:b.water},environment:b.environment,terrain:b.terrain}}};
const sim={world:a,day:15,tickCount:14*CFG.dayTicks,regionalReplayPolicy:REGIONAL_REPLAY.synchronized,planetaryTravel:{sessions:[session]}};
const waterBefore=sum(a.environment.volume)+sum(b.environment.volume),saltBefore=sum(a.environment.salt)+sum(b.environment.salt);
const rows=reconcilePlanetarySaltSeams(sim);assert.ok(rows.length&&rows[0].waterAToB>0);assert.deepEqual(a.environment.ice,frozen[0]);assert.deepEqual(b.environment.ice,frozen[1]);validateSurfaceIce(a);validateSurfaceIce(b);
assert.ok(Math.abs(sum(a.environment.volume)+sum(b.environment.volume)-waterBefore)<1e-12);assert.ok(Math.abs(sum(a.environment.salt)+sum(b.environment.salt)-saltBefore)<1e-12);
const n=4,len=16,w={generator:'planetary/1',n,len,water:new Uint8Array(len),terrain:{schema:1,elevation:new Float32Array(len).fill(.95)},buildHydrology(){}};
w.terrain.elevation[5]=.85;w.terrain.elevation[6]=.2;w.terrain.elevation[7]=.1;w.water[6]=w.water[7]=1;
const e=w.environment={schema:6,day:0,volume:new Float64Array(len),salt:new Float64Array(len),depth:new Float32Array(len),boundary:new Uint8Array(len),overland:new Float64Array(len),temperatureOffset:new Float32Array(len),totals:{},terrainSedimentPolicy:TERRAIN_SEDIMENT.policy,wetbedSedimentPolicy:PLANETARY_WETBED.policy};e.volume[6]=e.depth[6]=.4;e.volume[7]=e.depth[7]=.06;e.salt[6]=.12;e.overland[5]=.18;deriveDrainage(w);initializeSurfaceIce(w);for(let day=1;day<=4;day++)advanceSurfaceIce(w,{temp:.1,rain:0},day);e.day=4;
const initial=totalPlanetarySurfaceWater(w),saltStock=sum(e.salt),ice=e.ice.slice(),row={day:4,before:saltStock,after:saltStock,input:0,output:0,closure:0,waterBefore:initial,waterAfter:initial,waterInput:0,waterOutput:0,waterClosure:0};e.lastDay=row;e.daily=[row];
routePlanetaryRunoff(w,new Float64Array(len),4);assert.ok(e.lastDay.wetbedSedimentMoved>0);assert.deepEqual(e.ice,ice);validateSurfaceIce(w);assert.ok(Math.abs(totalPlanetarySurfaceWater(w)-initial)<1e-12);assert.ok(Math.abs(sum(e.salt)-saltStock)<1e-12);
const actual=new Simulation('ICE-TOPOLOGY',{worldGenerator:'planetary/1',bootstrap:false,player:false});initializeSurfaceIce(actual.world);advanceSurfaceIce(actual.world,{temp:-.5,rain:0},1);const env=actual.world.environment,k=env.ice.findIndex(v=>v>0);assert.ok(k>=0);
const before={water:actual.world.water.slice(),volume:env.volume.slice(),salt:env.salt.slice(),ice:env.ice.slice()};assert.throws(()=>actual.world.setSurfaceWater([{i:k,water:0}],{reason:'invalid frozen export'}),/Thaw owned surface ice/);assert.deepEqual(actual.world.water,before.water);assert.deepEqual(env.volume,before.volume);assert.deepEqual(env.salt,before.salt);assert.deepEqual(env.ice,before.ice);
console.log('Surface ice coupling PASS: actual paired liquid/salt transfers, unchanged frozen subsets, funded wetbed displacement and atomic rejection of frozen topology export.');
