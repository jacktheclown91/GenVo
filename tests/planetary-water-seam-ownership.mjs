import assert from 'node:assert/strict';
import {World} from '../src/world/world.js';
import {CFG} from '../src/sim/config.js';
import {regionKey} from '../src/world/planet-regions.js';
import {REGIONAL_REPLAY} from '../src/world/planetary-offscreen-biology.js';
import {advanceEnvironmentWater,saltStorage,validateEnvironment} from '../src/world/environment.js';
import {PLANETARY_BOUNDARY_WATER,boundaryWaterExchange} from '../src/world/planetary-boundary-water.js';
import {syncPlanetaryBoundaryOwnership,reconcilePlanetarySaltSeams} from '../src/world/planetary-seam-salt.js';

const seed='GENVO8-TEST-A',origin={x:0,y:2560},n=128;
const active=new World(seed,{generator:'planetary/1',planetOrigin:origin});
let neighbor=null,edge=null;
for(const [dir,dx,dy] of [['east',128,0],['west',-128,0],['south',0,128],['north',0,-128]]){
 const w=new World(seed,{generator:'planetary/1',planetOrigin:{x:origin.x+dx,y:origin.y+dy}});
 for(let k=0;k<n;k++){
  const i=dir==='east'?k*n+n-1:dir==='west'?k*n:dir==='south'?(n-1)*n+k:k;
  const j=dir==='east'?k*n:dir==='west'?k*n+n-1:dir==='south'?k:(n-1)*n+k;
  if(active.water[i]&&w.water[j]&&active.environment.boundary[i]&&w.environment.boundary[j]){
   neighbor=w;edge=[i,j];break;
  }
 }
 if(neighbor)break;
}
assert.ok(neighbor&&edge,'geography must expose a physically connected water border');
const [i,j]=edge,policy=PLANETARY_BOUNDARY_WATER.pairedPolicy;
assert.equal(active.environment.boundaryWaterPolicy,policy);
assert.equal(neighbor.environment.boundaryWaterPolicy,policy);
const session={key:regionKey(neighbor.regionOrigin),biologicalMode:'canonical-ticks/1',
 snapshot:{core:{tickCount:CFG.dayTicks,day:2},world:{
  regionOrigin:neighbor.regionOrigin,surfaceWater:{mask:neighbor.water.slice()},
  environment:neighbor.environment,terrain:neighbor.terrain}}};
const sim={world:active,day:2,tickCount:CFG.dayTicks,
 regionalReplayPolicy:REGIONAL_REPLAY.synchronized,
 planetaryTravel:{schema:1,nextId:1,sessions:[session]}};
const previous=active.environment.blockedBoundaries.slice();
const originalNeighbor=neighbor.environment;
const assigned=syncPlanetaryBoundaryOwnership(sim);
assert.ok(assigned.pairedCells>=2,'both owners must exclude their common external reservoir');
const direction=neighbor.regionOrigin.x>origin.x?'east':neighbor.regionOrigin.x<origin.x?'west':
 neighbor.regionOrigin.y>origin.y?'south':'north';
const expectedBits=direction==='east'?[2,1]:direction==='west'?[1,2]:direction==='south'?[8,4]:[4,8];
assert.equal(active.environment.blockedBoundaries[i],expectedBits[0]);
assert.equal(session.snapshot.world.environment.blockedBoundaries[j],expectedBits[1]);
assert.equal(previous[i],0,'unvisited water previously reached the external reservoir');
assert.equal(originalNeighbor.blockedBoundaries[j],0,
 'replacing the archive mask does not mutate its previous snapshot');
neighbor.environment=session.snapshot.world.environment;
assert.equal(boundaryWaterExchange(active.environment,i,active.environment.salt[i],active.environment.volume[i]),null);
assert.equal(boundaryWaterExchange(neighbor.environment,j,neighbor.environment.salt[j],neighbor.environment.volume[j]),null);
validateEnvironment(active,active.environment);
validateEnvironment(neighbor,neighbor.environment);
assert.deepEqual(syncPlanetaryBoundaryOwnership(sim),assigned,'repeated sync is idempotent');
const external=e=>e.volume.reduce((sum,v,i)=>sum+(e.boundary[i]&&!e.blockedBoundaries[i]?v*.08:0),0);
const whole=e=>e.volume.reduce((sum,v,i)=>sum+(e.boundary[i]?v*.08:0),0);
const expectedA=external(active.environment),expectedB=external(neighbor.environment);
assert.ok(expectedA<whole(active.environment)&&expectedB<whole(neighbor.environment),
 'each real shared seam excludes imported water from the outside reservoir');

// Force a finite physical contrast, not a synthetic food or organism outcome.
neighbor.environment.volume[j]=Math.max(.02,neighbor.environment.volume[j]*.5);
neighbor.environment.salt[j]=neighbor.environment.volume[j]*.01;
const newExpectedB=external(neighbor.environment);
const climate={temp:.5,rain:0};
const aRow=advanceEnvironmentWater(active,climate,1),bRow=advanceEnvironmentWater(neighbor,climate,1);
assert.ok(Math.abs(aRow.boundaryWaterInput-expectedA)<1e-7);
assert.ok(Math.abs(bRow.boundaryWaterInput-newExpectedB)<1e-7);
assert.ok(Math.abs(aRow.boundaryWaterInput-aRow.boundaryWaterOutput)<1e-9);
assert.ok(Math.abs(bRow.boundaryWaterInput-bRow.boundaryWaterOutput)<1e-9);
const before=saltStorage(active)+saltStorage(neighbor);
const waterBefore=active.environment.volume.reduce((s,v)=>s+v,0)+
 neighbor.environment.volume.reduce((s,v)=>s+v,0);
// Corrupt an ownership marker: reject before either physical stock changes.
const pairedBit=neighbor.environment.blockedBoundaries[j];
neighbor.environment.blockedBoundaries[j]=0;
const rejectSalt=saltStorage(active)+saltStorage(neighbor);
assert.throws(()=>reconcilePlanetarySaltSeams(sim),/Unsynchronized planetary seam water ownership/);
assert.equal(saltStorage(active)+saltStorage(neighbor),rejectSalt,
 'ownership mismatch must not half-commit an ocean transfer');
neighbor.environment.blockedBoundaries[j]=pairedBit;
const transfers=reconcilePlanetarySaltSeams(sim);
assert.ok(transfers.length>0,'true synchronized neighbors pair their water and dissolved salt');
const after=saltStorage(active)+saltStorage(neighbor);
const waterAfter=active.environment.volume.reduce((s,v)=>s+v,0)+
 neighbor.environment.volume.reduce((s,v)=>s+v,0);
assert.ok(Math.abs(after-before)<1e-8,'all paired region-to-region salt stays within the two owners');
assert.ok(Math.abs(waterAfter-waterBefore)<1e-8,'all paired water stays within the two owners');
assert.ok(Math.abs(active.environment.lastDay.closure)<1e-7);
assert.ok(Math.abs(neighbor.environment.lastDay.closure)<1e-7);
assert.ok(Math.abs(active.environment.lastDay.waterClosure)<1e-7);
assert.ok(Math.abs(neighbor.environment.lastDay.waterClosure)<1e-7);
validateEnvironment(active,active.environment);
validateEnvironment(neighbor,neighbor.environment);

// Historic /1 worlds continue using their original independent reservoir.
const historical=new World(seed,{generator:'planetary/1',planetOrigin:origin});
historical.environment.boundaryWaterPolicy=PLANETARY_BOUNDARY_WATER.policy;
delete historical.environment.blockedBoundaries;
assert.ok(boundaryWaterExchange(historical.environment,i,
 historical.environment.salt[i],historical.environment.volume[i]));
// A physically flowing freshwater seam must still publish reciprocal
// receipts when dissolved salt is exactly zero.
function freshwaterRegion(origin,index,volume){
 const wet=new Uint8Array(n*n),edge=new Uint8Array(n*n);
 const salt=new Float64Array(n*n),water=new Float64Array(n*n),depth=new Float32Array(n*n);
 wet[index]=1;edge[index]=1;water[index]=volume;depth[index]=volume;
 const row={day:1,before:0,after:0,input:0,output:0,closure:0,
  waterBefore:volume,waterAfter:volume,waterInput:0,waterOutput:0,waterClosure:0};
 return{n,len:n*n,generator:'planetary/1',planet:{},regionOrigin:origin,
  water:wet,terrain:{elevation:new Float32Array(n*n)},
  environment:{schema:6,salt,volume:water,depth,boundary:edge,
   day:1,totals:{saltInput:0,saltOutput:0},lastDay:row,daily:[row]},
  buildHydrology(){}};
}
const freshA=freshwaterRegion({x:0,y:0},n-1,1);
const freshB=freshwaterRegion({x:128,y:0},0,.5);
const freshSession={key:'128,0',biologicalMode:'canonical-ticks/1',
 snapshot:{core:{day:2,tickCount:CFG.dayTicks},world:{
  regionOrigin:freshB.regionOrigin,environment:freshB.environment,
  surfaceWater:{mask:freshB.water},terrain:freshB.terrain}}};
const freshSim={world:freshA,day:2,tickCount:CFG.dayTicks,
 regionalReplayPolicy:REGIONAL_REPLAY.synchronized,
 planetaryTravel:{schema:1,nextId:1,sessions:[freshSession]}};
const freshReceipts=reconcilePlanetarySaltSeams(freshSim);
assert.equal(freshReceipts.length,1,'the water-only pair must not disappear');
assert.ok((freshReceipts[0].waterAToB||0)>0);
assert.equal(freshReceipts[0].aToB+freshReceipts[0].bToA,0);
assert.ok(Math.abs(freshA.environment.volume[n-1]+freshB.environment.volume[0]-1.5)<1e-12,
 'zero-salt freshwater transfers conserve both independently owned stocks');

console.log('Planetary paired water ownership: external exclusion, real conservation, copy-on-write, idempotence and legacy fallback PASS');
