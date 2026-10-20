// A real completed physical day in two independently materialized regions
// can transfer actual dissolved salt between their OWN stocks without creating
// or deleting any salt. These tests stage one salinity contrast as a controlled
// physical initial condition, never a creature or ecological outcome.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {Simulation} from '../src/sim/simulation.js';
import {World} from '../src/world/world.js';
import {CFG} from '../src/sim/config.js';
import {regionKey} from '../src/world/planet-regions.js';
import {saltStorage,validateEnvironment} from '../src/world/environment.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {reconcilePlanetarySaltSeams,validatePlanetarySeamLedger} from '../src/world/planetary-seam-salt.js';

const eq=(a,b,msg)=>assert.ok(isDeepStrictEqual(a,b),msg);
const seed='GENVO8-TEST-A',origin={x:0,y:2560};
const active=new Simulation(seed,{player:false,bootstrap:false,worldGenerator:'planetary/1',planetOrigin:origin});
const n=128;
function matchingEdges(a,b,dir){
 const indices=[];
 for(let k=0;k<n;k++){
  const i=dir==='east'?k*n+n-1:dir==='west'?k*n:dir==='south'?(n-1)*n+k:k;
  const j=dir==='east'?k*n:dir==='west'?k*n+n-1:dir==='south'?k:(n-1)*n+k;
  if(a.water[i]&&b.water[j]&&a.environment.boundary[i]&&b.environment.boundary[j])
   indices.push([i,j]);
 }
 return indices;
}
let destination=null,match=null;
for(const [name,dx,dy] of [['east',128,0],['west',-128,0],['south',0,128],['north',0,-128]]){
 const candidate={x:origin.x+dx,y:origin.y+dy};
 const sampled=new World(seed,{generator:'planetary/1',planetOrigin:candidate});
 const pairs=matchingEdges(active.world,sampled,name);
 if(pairs.length){destination=candidate;match=pairs[0];break}
}
assert.ok(destination&&match,'real coastal geography has an open water seam');
const remote=new Simulation(seed,{player:false,bootstrap:false,worldGenerator:'planetary/1',planetOrigin:destination});
const [i,j]=match;
assert.ok(remote.world.water[j]&&active.world.water[i]);
// Staged physicochemical contrast: the completed calendar step will account
// physical inputs and outputs from this controlled starting stock.
remote.world.environment.salt[j]=remote.world.environment.depth[j]*.01;
// A controlled height difference creates a genuine finite-volume gradient.
// This edits an existing physical stock, not an animal, seed or outcome.
remote.world.environment.volume[j]=Math.max(.02,remote.world.environment.volume[j]*.5);
for(let tick=0;tick<CFG.dayTicks;tick++){active.update(null);remote.update(null)}
assert.equal(active.day,2);
assert.equal(remote.day,2);
assert.equal(active.tickCount,remote.tickCount);
const snapshot=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'paired-salt'}));
const session={key:regionKey(destination),biologicalMode:'canonical-ticks/1',
 snapshot:snapshot(remote)};
active.planetaryTravel={schema:1,nextId:Math.max(active.nextId,remote.nextId),sessions:[session]};
const previous=snapshot(active);
const startCombined=saltStorage(active.world)+session.snapshot.world.environment.salt.reduce((a,b)=>a+b,0);
const initialWater=active.world.environment.volume.reduce((a,b)=>a+b,0)+
 session.snapshot.world.environment.volume.reduce((a,b)=>a+b,0);
const previousVolumes=[active.world.environment.volume[i],session.snapshot.world.environment.volume[j]];
assert.ok(previous.world.environment.schema===6&&session.snapshot.world.environment.schema===6);
const oldFirst=active.world.environment.salt[i],oldSecond=session.snapshot.world.environment.salt[j];
// No synthetic day or accelerated animal clock. Exchange occurs just before
// the next legitimate active tick after both regions finished the same day.
active.update(null);
const ledger=active.planetaryTravel.seamLedger;
validatePlanetarySeamLedger(ledger);
assert.equal(ledger.schema,1);
assert.equal(ledger.lastTick,CFG.dayTicks);
assert.ok(ledger.history.length>0,'genuine in-scope neighboring water stocks exchanged salt');
assert.ok(active.world.environment.salt[i]!==oldFirst||session.snapshot.world.environment.salt[j]!==oldSecond);
assert.ok(active.world.environment.volume[i]!==previousVolumes[0]||
 session.snapshot.world.environment.volume[j]!==previousVolumes[1],
 'genuine hydraulic head transfers water volume across the border');
const pairedA=active.world.environment.totals,pairedB=session.snapshot.world.environment.totals;
assert.ok((pairedA.pairedInput||0)+(pairedA.pairedOutput||0)>0);
assert.ok((pairedB.pairedInput||0)+(pairedB.pairedOutput||0)>0);
const waterInput=(pairedA.pairedWaterInput||0)+(pairedB.pairedWaterInput||0);
const waterOutput=(pairedA.pairedWaterOutput||0)+(pairedB.pairedWaterOutput||0);
assert.ok(waterInput>0&&waterOutput>0,'both regions own paired water-volume flow receipts');
assert.ok(Math.abs(waterInput-waterOutput)<1e-9,'paired water is neither created nor destroyed');
const finalWater=active.world.environment.volume.reduce((a,b)=>a+b,0)+
 session.snapshot.world.environment.volume.reduce((a,b)=>a+b,0);
assert.ok(Math.abs(finalWater-initialWater)<1e-9,'actual combined regional water inventories are conserved');
const pairedInput=(pairedA.pairedInput||0)+(pairedB.pairedInput||0);
const pairedOutput=(pairedA.pairedOutput||0)+(pairedB.pairedOutput||0);
assert.ok(Math.abs(pairedInput-pairedOutput)<1e-9,'every source salt debit has an equal destination credit');
const afterCombined=saltStorage(active.world)+session.snapshot.world.environment.salt.reduce((a,b)=>a+b,0);
assert.ok(Math.abs(afterCombined-startCombined)<1e-8,'paired flux is mass conservative across both physical stocks');
validateEnvironment(active.world,active.world.environment);
validateEnvironment(remote.world,session.snapshot.world.environment);
for(const environment of [active.world.environment,session.snapshot.world.environment]){
 assert.ok(Math.abs(environment.lastDay.closure)<1e-7,'every region retains a closed post-transfer salt receipt');
 assert.ok(environment.lastDay.pairedInput>=0||environment.lastDay.pairedOutput>=0);
 assert.ok(Math.abs(environment.lastDay.waterClosure)<1e-8,
  'each regional physical volume receipt remains closed after paired transport');
}
const finalized=snapshot(active);
eq(snapshot(restoreSimulationSnapshot(structuredClone(finalized))),finalized,'cross-region salt and ledger survive an exact save');
const resumed=restoreSimulationSnapshot(structuredClone(finalized));
for(let k=0;k<CFG.lifeStride+2;k++){active.update(null);resumed.update(null)}
eq(snapshot(active),snapshot(resumed),'real canonical regional biology resumes identically with saved seam receipts');
// Duplicate calls during the same synchronized tick cannot exchange twice.
const last=structuredClone(active.planetaryTravel.seamLedger);
assert.deepEqual(reconcilePlanetarySaltSeams(active),[]);
eq(active.planetaryTravel.seamLedger,last,'no re-use of the already accounted daily seam');
const invalid=snapshot(active);
invalid.core.planetaryTravel.seamLedger.history[0].aToB=-1;
assert.throws(()=>restoreSimulationSnapshot(invalid),/Invalid paired planetary seam receipt/);
// Existing schema-1 archival regions do not silently migrate to new flux rules.
const older=restoreSimulationSnapshot(structuredClone(previous));
older.planetaryTravel.sessions[0].snapshot.world.environment.schema=1;
older.planetaryTravel.sessions[0].snapshot.world.environment.boundary.fill(0);
delete older.planetaryTravel.sessions[0].snapshot.world.environment.totals.boundaryInput;
delete older.planetaryTravel.sessions[0].snapshot.world.environment.totals.boundaryOutput;
assert.deepEqual(reconcilePlanetarySaltSeams(older),[],'historical isolated salt environment retains its old laws');
// The previous planetary boundary schema (v2) had no dynamic water volume.
// Preserve its saved physical inventory unchanged and allow only the older
// salinity-only seam behavior when visited from a v3 world.
const v2=structuredClone(previous);
const v2Environment=v2.core.planetaryTravel.sessions[0].snapshot.world.environment;
v2Environment.schema=2;
// The v2 archive predates both geography-reservoir policy versions.
delete v2Environment.boundaryWaterPolicy;
delete v2Environment.blockedBoundaries;
delete v2Environment.volume;
for(const row of v2Environment.daily){
 delete row.waterBefore;delete row.waterAfter;delete row.waterInput;
 delete row.waterOutput;delete row.waterClosure;
}
if(v2Environment.lastDay){
 for(const key of ['waterBefore','waterAfter','waterInput','waterOutput','waterClosure'])
  delete v2Environment.lastDay[key];
}
const restoredV2=restoreSimulationSnapshot(structuredClone(v2));
assert.equal(restoredV2.planetaryTravel.sessions[0].snapshot.world.environment.schema,2);
const v2Volume=restoredV2.world.environment.volume.slice();
reconcilePlanetarySaltSeams(restoredV2);
assert.deepEqual(restoredV2.world.environment.volume,v2Volume,
 'legacy v2 region cannot secretly modify the new v3 water-volume stock');
assert.equal(restoredV2.planetaryTravel.sessions[0].snapshot.world.environment.volume,undefined,
 'old saves are not silently upgraded to an invented water inventory');
const corruptVolume=structuredClone(finalized);
corruptVolume.world.environment.volume[i]=-1;
assert.throws(()=>restoreSimulationSnapshot(corruptVolume),/Invalid planetary water-volume field/);
const corruptWaterReceipt=structuredClone(finalized);
corruptWaterReceipt.world.environment.lastDay.waterClosure=999;
assert.throws(()=>restoreSimulationSnapshot(corruptWaterReceipt),/Invalid planetary water-volume receipt/);

console.log('Paired planetary salt PASS: same-day real wet seam, reciprocal stock ownership, conserved pair inputs and outputs, historic fallback, duplicate avoidance, full save and regional biological replay');
