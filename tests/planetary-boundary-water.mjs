import assert from 'node:assert/strict';
import {World} from '../src/world/world.js';
import {advanceEnvironmentWater,saltStorage,validateEnvironment} from '../src/world/environment.js';
import {PLANETARY_BOUNDARY_WATER,boundaryWaterExchange} from '../src/world/planetary-boundary-water.js';

// Pure exchange: a finite quantity of external water replaces precisely
// the same local water volume. Salinity is advected, not reset.
const policy=PLANETARY_BOUNDARY_WATER.policy;
const e={schema:6,boundaryWaterPolicy:policy,boundary:Uint8Array.of(2,1,3,0)};
for(const [i,salt,expectedSalinity] of [[0,.2,1],[1,.8,0],[2,.1,.5]]){
 const r=boundaryWaterExchange(e,i,salt,1);
 assert.ok(r.waterInput>0&&r.waterInput===r.waterOutput);
 assert.ok(Math.abs(r.saltInput-r.waterInput*expectedSalinity)<1e-12);
 assert.ok(Math.abs(r.saltOutput-r.waterOutput*salt)<1e-12);
 assert.ok(Math.abs(r.saltAfter-salt-r.saltInput+r.saltOutput)<1e-12);
 assert.ok(r.saltAfter>=0&&r.saltAfter<=2);
}
assert.equal(boundaryWaterExchange(e,3,0,1),null);
assert.equal(boundaryWaterExchange({...e,boundaryWaterPolicy:undefined},0,.2,1),null);
assert.throws(()=>boundaryWaterExchange(e,0,5,1),/Invalid planetary boundary-water stock/);

// Live planetary integration: conservation receipts use exactly the ocean
// fluxes and physical water inventories. No artificially added biology.
const origin={x:0,y:2560},seed='GENVO8-TEST-A';
const w=new World(seed,{generator:'planetary/1',planetOrigin:origin});
assert.equal(w.environment.schema,6);
assert.equal(w.environment.boundaryWaterPolicy,PLANETARY_BOUNDARY_WATER.pairedPolicy);
assert.ok(w.environment.blockedBoundaries instanceof Uint8Array);
assert.equal(w.environment.blockedBoundaries.length,w.len);
const salinityBefore=saltStorage(w);
const climate={temp:.6,rain:.48};
let input=0,output=0;
for(let day=1;day<=3;day++){
 const row=advanceEnvironmentWater(w,climate,day);
 validateEnvironment(w,w.environment);
 assert.ok(Math.abs(row.closure)<1e-7,'daily salt must conserve');
 assert.ok(Math.abs(row.waterClosure)<1e-7,'daily water must conserve');
 assert.ok(row.boundaryWaterInput>0&&row.boundaryWaterOutput>0);
 assert.ok(Math.abs(row.boundaryWaterInput-row.boundaryWaterOutput)<1e-8);
 assert.ok(row.boundarySaltInput>0&&row.boundarySaltOutput>0);
 assert.ok(row.boundarySaltInput<=row.input+1e-8);
 assert.ok(row.boundarySaltOutput<=row.output+1e-8);
 input+=row.input;output+=row.output;
}
assert.ok(Math.abs(saltStorage(w)-salinityBefore-input+output)<1e-7,
 'three days of salt inputs and outputs close across open water');
const totals=w.environment.totals;
assert.ok(Math.abs(totals.boundaryWaterInput-totals.boundaryWaterOutput)<1e-8);
assert.ok(totals.boundarySaltInput>0&&totals.boundarySaltOutput>0);

// The historic schema-6 version omitted this policy: a loaded historical
// world continues to use the legacy salt-only boundary law.
const historic=new World(seed,{generator:'planetary/1',planetOrigin:origin});
delete historic.environment.boundaryWaterPolicy;
for(const key of ['boundaryWaterInput','boundaryWaterOutput','boundarySaltInput','boundarySaltOutput'])
 delete historic.environment.totals[key];
const historicRow=advanceEnvironmentWater(historic,climate,1);
assert.equal(historicRow.boundaryWaterInput,undefined);
assert.equal(historicRow.boundarySaltInput,undefined);
assert.equal(historic.environment.totals.boundaryWaterInput,undefined);
validateEnvironment(historic,historic.environment);
console.log('Planetary open-water exchange: finite replacement, fresh/mixed/ocean reservoirs, multi-day conservation and historic no-policy fallback PASS');
