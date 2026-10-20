import assert from 'node:assert/strict';
import {World} from '../src/world/world.js';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {deriveDrainage} from '../src/world/topography.js';
import {routePlanetaryRunoff} from '../src/world/planetary-runoff.js';
import {REGIONAL_REPLAY} from '../src/world/planetary-offscreen-biology.js';
import {PLANETARY_SEAM_RUNOFF} from '../src/world/planetary-seam-runoff.js';
import {reconcilePlanetarySaltSeams,validatePlanetarySeamLedger} from '../src/world/planetary-seam-salt.js';
import {TERRAIN_SEDIMENT,validateTerrainSedimentPolicy} from '../src/world/terrain-sediment.js';

const policy=TERRAIN_SEDIMENT.policy;
function local(modern=true,wet=false){
 const n=4,len=n*n,water=new Uint8Array(len),elevation=new Float32Array(len).fill(.95),
  overland=new Float64Array(len),volume=new Float64Array(len),depth=new Float32Array(len);
 elevation[5]=.85;elevation[6]=.2;overland[5]=.18;
 if(wet){water[6]=1;volume[6]=1;depth[6]=1}
 const total=.18+volume[6],row={day:1,before:0,after:0,input:0,output:0,closure:0,
  waterBefore:total,waterAfter:total,waterInput:0,waterOutput:0,waterClosure:0};
 const w={generator:'planetary/1',n,len,water,
  terrain:{schema:1,elevation,travelEnabled:true},
  environment:{schema:6,overland,volume,depth,day:1,totals:{},lastDay:row,daily:[row],
   ...(modern?{terrainSedimentPolicy:policy}:{})}};
 deriveDrainage(w);return w;
}
const w=local(),oldMass=w.terrain.elevation[5]+w.terrain.elevation[6];
assert.equal(w.terrain.downstream[5],6);
const runoff=routePlanetaryRunoff(w,new Float64Array(w.len),1);
assert.ok(runoff.moved>0&&w.environment.lastDay.sedimentMoved>0);
assert.ok(w.terrain.elevation[5]<.85&&w.terrain.elevation[6]>.2);
assert.ok(Math.abs(w.terrain.elevation[5]+w.terrain.elevation[6]-oldMass)<1e-7);
assert.equal(w.terrain.downstream[5],6,'drainage uses current physical terrain');
assert.ok(Math.abs(w.environment.lastDay.waterClosure)<1e-9);
const legacy=local(false);
routePlanetaryRunoff(legacy,new Float64Array(legacy.len),1);
assert.equal(legacy.environment.lastDay.sedimentMoved,undefined);
assert.equal(legacy.terrain.elevation[5],Math.fround(.85));
const lake=local(true,true);
routePlanetaryRunoff(lake,new Float64Array(lake.len),1);
assert.equal(lake.environment.lastDay.sedimentMoved,0,
 'nutrients can enter lakes but land-height deposition awaits wet-bed authority');
const invalid=local();
invalid.terrain.elevation[5]=NaN;
assert.throws(()=>routePlanetaryRunoff(invalid,new Float64Array(invalid.len),1),
 /Invalid staged terrain elevation/);
assert.equal(invalid.environment.overland[5],.18,
 'bad terrain cannot half-commit water outflow');

// Real independent region owners. One water transfer produces exactly two
// opposite terrain-height deltas and no new region or surface-water authority.
const n=128,len=n*n;
function region(x,index,{wet=false,modern=true}={}){
 const water=new Uint8Array(len),depth=new Float32Array(len),
  volume=new Float64Array(len),overland=new Float64Array(len),
  salt=new Float64Array(len),boundary=new Uint8Array(len),
  elevation=new Float32Array(len).fill(.95);
 water[index]=wet?1:0;elevation[index]=x===0?.85:.2;
 if(x===0)overland[index]=.6;
 else if(wet){depth[index]=1;volume[index]=1}
 else overland[index]=.05;
 const amount=overland[index]+volume[index];
 const row={day:1,before:0,after:0,input:0,output:0,closure:0,
  waterBefore:amount,waterAfter:amount,waterInput:0,waterOutput:0,waterClosure:0};
 const environment={schema:6,overland,volume,depth,salt,boundary,day:1,
  lastDay:row,daily:[row],totals:{saltInput:0,saltOutput:0},
  seamRunoffPolicy:PLANETARY_SEAM_RUNOFF.policy,
  ...(modern?{terrainSedimentPolicy:policy}:{})};
 const r={generator:'planetary/1',n,len,planet:{},regionOrigin:{x,y:0},
  water,terrain:{schema:1,elevation,travelEnabled:true},
  environment,buildHydrology(){}};
 deriveDrainage(r);return r;
}
function joined(a,b){return{world:a,day:2,tickCount:CFG.dayTicks,
 regionalReplayPolicy:REGIONAL_REPLAY.synchronized,
 planetaryTravel:{schema:1,nextId:1,sessions:[{key:'128,0',biologicalMode:'canonical-ticks/1',
 snapshot:{core:{day:2,tickCount:CFG.dayTicks},world:{
  regionOrigin:b.regionOrigin,terrain:b.terrain,environment:b.environment,
  surfaceWater:{mask:b.water}}}}]}}}
for(const [wet,modern] of [[false,true],[true,true],[false,false]]){
 const a=region(0,127,{modern}),b=region(128,0,{wet,modern}),sim=joined(a,b);
 const before=a.terrain.elevation[127]+b.terrain.elevation[0];
 const entries=reconcilePlanetarySaltSeams(sim),receipt=entries[0];
 assert.equal(entries.length,1);
 assert.ok(receipt.runoffAToB>0);
 if(modern&&!wet)assert.ok(receipt.sedimentAToB>0);
 else assert.equal(receipt.sedimentAToB,undefined);
 assert.ok(Math.abs(a.terrain.elevation[127]+b.terrain.elevation[0]-before)<1e-7);
 assert.ok(Math.abs(a.environment.lastDay.waterClosure)<1e-7);
 assert.ok(Math.abs(b.environment.lastDay.waterClosure)<1e-7);
 validatePlanetarySeamLedger(sim.planetaryTravel.seamLedger);
 assert.deepEqual(reconcilePlanetarySaltSeams(sim),[],'only one seam settlement per day');
 if(modern&&!wet){
  assert.ok(Math.abs(a.environment.totals.seamSedimentOutput-
   b.environment.totals.seamSedimentInput)<1e-9);
  const fake=structuredClone(sim.planetaryTravel.seamLedger);
  fake.history[0].runoffAToB=0;
  assert.throws(()=>validatePlanetarySeamLedger(fake),
   /Invalid paired planetary seam receipt/,
   'a recorded silt transfer must be backed by moving water');
 }
}

// A real generated World and its save persist actual altered terrain, while
// missing-policy historical saves retain their old elevations.
const seed='GENVO8-TEST-A';
const sim=new Simulation(seed,{player:false,bootstrap:false,
 worldGenerator:'planetary/1',planetOrigin:{x:0,y:2560}});
assert.equal(sim.world.environment.terrainSedimentPolicy,policy);
const i=sim.world.terrain.elevation.findIndex(v=>v>.02&&v<.9);
assert.ok(i>=0);
sim.world.terrain.elevation[i]=Math.fround(sim.world.terrain.elevation[i]-.001);
deriveDrainage(sim.world);
const save=structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'sediment'}));
const restored=restoreSimulationSnapshot(structuredClone(save));
assert.equal(restored.world.terrain.elevation[i],sim.world.terrain.elevation[i]);
assert.equal(restored.world.environment.terrainSedimentPolicy,policy);
const older=structuredClone(save);
delete older.world.environment.terrainSedimentPolicy;
assert.equal(restoreSimulationSnapshot(older).world.environment.terrainSedimentPolicy,undefined);
const forged=structuredClone(save);
forged.world.environment.terrainSedimentPolicy='unreviewed-erosion/99';
assert.throws(()=>restoreSimulationSnapshot(forged),/Invalid planetary terrain-sediment policy/);
console.log('Planetary terrain sediment: downhill erosion/deposition, round-trip terrain, regional mass closure, lake and legacy protection PASS');
