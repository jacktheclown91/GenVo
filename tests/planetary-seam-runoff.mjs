import assert from 'node:assert/strict';
import {CFG} from '../src/sim/config.js';
import {World} from '../src/world/world.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {Simulation} from '../src/sim/simulation.js';
import {validateEnvironment} from '../src/world/environment.js';
import {REGIONAL_REPLAY} from '../src/world/planetary-offscreen-biology.js';
import {reconcilePlanetarySaltSeams,validatePlanetarySeamLedger} from '../src/world/planetary-seam-salt.js';
import {PLANETARY_SEAM_RUNOFF} from '../src/world/planetary-seam-runoff.js';

const n=128,len=n*n;
function region(x,index,{wet=false,overland=0,volume=0,elevation=.5,policy=true}={}){
 const water=new Uint8Array(len),salt=new Float64Array(len),
  depth=new Float32Array(len),vol=new Float64Array(len),
  over=new Float64Array(len),boundary=new Uint8Array(len),
  ground=new Float32Array(len);
 water[index]=wet?1:0;over[index]=overland;vol[index]=volume;
 depth[index]=wet?volume:0;ground[index]=elevation;
 const waterTotal=overland+volume;
 const day={day:1,before:0,after:0,input:0,output:0,closure:0,
  waterBefore:waterTotal,waterAfter:waterTotal,waterInput:0,waterOutput:0,waterClosure:0};
 const env={schema:6,overland:over,volume:vol,depth,salt,boundary,
  day:1,totals:{saltInput:0,saltOutput:0},daily:[day],lastDay:day};
 if(policy)env.seamRunoffPolicy=PLANETARY_SEAM_RUNOFF.policy;
 return{generator:'planetary/1',planet:{},n,len,regionOrigin:{x,y:0},
  water,terrain:{elevation:ground},environment:env,buildHydrology(){}};
}
function encounter(source,target){
 const session={key:'128,0',biologicalMode:'canonical-ticks/1',
  snapshot:{core:{day:2,tickCount:CFG.dayTicks},world:{
   regionOrigin:target.regionOrigin,surfaceWater:{mask:target.water},
   terrain:target.terrain,environment:target.environment}}};
 const sim={world:source,day:2,tickCount:CFG.dayTicks,
  regionalReplayPolicy:REGIONAL_REPLAY.synchronized,
  planetaryTravel:{schema:1,nextId:1,sessions:[session]}};
 return{sim,session};
}
const left=n-1,right=0;
// Dry-to-dry: a real downhill overflow crossed the absent local drainage edge.
const a=region(0,left,{overland:.6,elevation:.8});
const b=region(128,right,{overland:.1,elevation:.2});
const {sim}=encounter(a,b);
const before=a.environment.overland[left]+b.environment.overland[right];
const receipts=reconcilePlanetarySaltSeams(sim);
assert.equal(receipts.length,1);
const q=receipts[0].runoffAToB;
assert.ok(q>0&&q<=.6*.65);
assert.equal(receipts[0].waterAToB,q);
assert.equal(a.environment.overland[left],.6-q);
assert.equal(b.environment.overland[right],.1+q);
assert.ok(Math.abs(a.environment.overland[left]+b.environment.overland[right]-before)<1e-12);
assert.equal(a.environment.totals.seamRunoffOutput,q);
assert.equal(b.environment.totals.seamRunoffInput,q);
assert.ok(Math.abs(a.environment.lastDay.waterClosure)<1e-12);
assert.ok(Math.abs(b.environment.lastDay.waterClosure)<1e-12);
validatePlanetarySeamLedger(sim.planetaryTravel.seamLedger);
assert.deepEqual(reconcilePlanetarySaltSeams(sim),[],'cannot transfer twice in a biological day');

// Dry-to-wet: water becomes real freshwater channel volume; it is not added
// to salinity, seeds, life or a second overland inventory.
const c=region(0,left,{overland:2,elevation:.9});
const d=region(128,right,{wet:true,volume:1.95,elevation:.1});
const next=encounter(c,d).sim,amountBefore=c.environment.overland[left]+d.environment.volume[right];
const r=reconcilePlanetarySaltSeams(next);
assert.ok(r[0].runoffAToB>0&&r[0].runoffAToB<=.05+1e-12);
assert.ok(Math.abs(c.environment.overland[left]+d.environment.volume[right]-amountBefore)<1e-12);
assert.equal(d.environment.overland[right],0);
assert.ok(d.environment.volume[right]<=2);
assert.equal(d.environment.salt[right],0);
assert.ok(Math.abs(c.environment.lastDay.waterClosure)<1e-12);
assert.ok(Math.abs(d.environment.lastDay.waterClosure)<1e-12);

// No uphill routing, no free bridge from a historical saved rule and no
// speculative outflow toward an unvisited/unsynchronized region.
const uphill=encounter(region(0,left,{overland:.6,elevation:.15}),
 region(128,right,{overland:0,elevation:.7})).sim;
assert.deepEqual(reconcilePlanetarySaltSeams(uphill),[]);
assert.equal(uphill.world.environment.overland[left],.6);
const historic=encounter(region(0,left,{overland:.6,elevation:.8,policy:false}),
 region(128,right,{overland:.1,elevation:.2})).sim;
assert.deepEqual(reconcilePlanetarySaltSeams(historic),[]);
assert.equal(historic.world.environment.overland[left],.6);
const absent=region(0,left,{overland:.6,elevation:.8});
const only={world:absent,tickCount:CFG.dayTicks,day:2,
 regionalReplayPolicy:REGIONAL_REPLAY.synchronized,
 planetaryTravel:{schema:1,nextId:1,sessions:[]}};
assert.deepEqual(reconcilePlanetarySaltSeams(only),[]);
assert.equal(absent.environment.overland[left],.6);

// A corrupt donor stock is rejected before modifying the receiving region.
const failed=encounter(region(0,left,{overland:.7,elevation:.9}),
 region(128,right,{overland:.1,elevation:.1})).sim;
failed.world.environment.overland[left]=NaN;
assert.throws(()=>reconcilePlanetarySaltSeams(failed),/Invalid cross-region overland runoff stock|Invalid paired planetary seam receipt|Contradictory/);
assert.equal(failed.planetaryTravel.sessions[0].snapshot.world.environment.overland[right],.1);

// Real newly generated worlds preserve their policy and stocked overland
// arrays through the canonical save/restore path.
const world=new World('GENVO8-TEST-A',{generator:'planetary/1',planetOrigin:{x:0,y:2560}});
assert.equal(world.environment.seamRunoffPolicy,PLANETARY_SEAM_RUNOFF.policy);
validateEnvironment(world,world.environment);
const live=new Simulation('GENVO8-TEST-A',{player:false,bootstrap:false,
 worldGenerator:'planetary/1',planetOrigin:{x:0,y:2560}});
const saved=structuredClone(createSimulationSnapshot(live,{savedAt:'fixed',reason:'seam-runoff'}));
const replay=restoreSimulationSnapshot(structuredClone(saved));
assert.equal(replay.world.environment.seamRunoffPolicy,PLANETARY_SEAM_RUNOFF.policy);
assert.deepEqual(createSimulationSnapshot(replay,{savedAt:'fixed',reason:'seam-runoff'}),saved);
const old=structuredClone(saved);
delete old.world.environment.seamRunoffPolicy;
const older=restoreSimulationSnapshot(old);
assert.equal(older.world.environment.seamRunoffPolicy,undefined);
console.log('Paired dry-land runoff: downhill dry/wet flows, capacity, reciprocal water ledgers, old saves and persistence PASS');
