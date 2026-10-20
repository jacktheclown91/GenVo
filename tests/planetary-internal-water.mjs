// New version-4 planetary hydrology: equal and opposite local wet-tile
// water and salt transfers with no synthetic ecological outcomes. Legacy
// version-3 worlds keep the prior fixed-interior law on restoration.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {World} from '../src/world/world.js';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {advanceEnvironmentWater,saltStorage,waterStorage,validateEnvironment} from '../src/world/environment.js';
import {advanceInternalPlanetaryWater} from '../src/world/planetary-internal-water.js';
import {simulateHistoricalPlanetaryEnvironment} from './helpers/historical-planetary-environment.mjs';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const seed='GENVO8-TEST-A',origin={x:0,y:2560};
const w=new World(seed,{generator:'planetary/1',planetOrigin:origin}),e=w.environment;
assert.equal(e.schema,6,'new regions use versioned flood-capable internal wet-tile transport');
const wet=w.water.slice(),geography=e.depth.slice(),bed=w.terrain.elevation.slice();
let site=null;
for(let i=0;i<w.len;i++){
 const j=i%w.n<w.n-1?i+1:-1;
 if(j>=0&&wet[i]&&wet[j]&&e.volume[i]>.12&&e.volume[j]>.12&&
    e.volume[i]<1.4&&e.volume[j]<1.4&&e.salt[i]>.01){site=[i,j];break}
}
assert.ok(site,'natural planet contains adjacent connected saline water tiles');
const [i,j]=site;
// A controlled but legal starting hydraulic head and salinity difference.
e.volume[i]=Math.min(1.8,e.volume[i]+.18);
e.volume[j]=Math.max(.04,e.volume[j]-.1);
e.salt[i]=e.volume[i]*1.2;
e.salt[j]=e.volume[j]*.02;
validateEnvironment(w,e);
const startWater=waterStorage(w),startSalt=saltStorage(w);
const initialConcentration=e.salt[i]/e.volume[i];
const newSalt=e.salt.slice();
const receipt=advanceInternalPlanetaryWater(w,newSalt);
e.salt.set(newSalt);
assert.ok(receipt.internalWetEdges>0&&receipt.internalWaterMoved>0);
assert.ok(receipt.internalSaltMoved>0&&initialConcentration>0);
assert.ok(Math.abs(waterStorage(w)-startWater)<1e-8,'actual inland water mass conserved');
assert.ok(Math.abs(saltStorage(w)-startSalt)<1e-8,'actual inland dissolved salt mass conserved');
assert.ok(Math.abs(receipt.waterClosure)<1e-8);
assert.deepEqual(w.water,wet,'land/water masks unchanged by intrawater transfers');
assert.deepEqual(e.depth,geography,'immutable geography depth was not rewritten');
assert.deepEqual(w.terrain.elevation,bed,'bed elevation was not rewritten');
validateEnvironment(w,e);
const climate={temp:.47,rain:.18};
const cumulativeWater=waterStorage(w),cumulativeSalt=saltStorage(w);
let retainedRain=0,exportedRain=0;
for(let day=1;day<=10;day++){
 const row=advanceEnvironmentWater(w,climate,day);
 assert.ok(row.internalWetEdges>0,'real flow was calculated within the wet network');
 assert.ok(row.internalWaterMoved>0);
 assert.ok(row.internalSaltMoved>=0);
 assert.ok(Math.abs(row.waterClosure)<1e-6);
 assert.ok(Math.abs(row.closure)<1e-6);
 assert.equal(row.waterInput,row.surfaceRainInput+row.boundaryWaterInput,
  'every rainfall and real ocean-boundary input has an explicit receipt');
 assert.equal(row.waterOutput,row.surfaceRainOutput+row.boundaryWaterOutput,
  'unretained rainfall and real boundary-water replacement both have output receipts');
 retainedRain+=row.waterInput;exportedRain+=row.waterOutput;
 validateEnvironment(w,e);
}
assert.ok(Math.abs(waterStorage(w)-cumulativeWater-retainedRain+exportedRain)<1e-8,
 '10 wet-cell days account for actual retained precipitation and full-capacity exports');
assert.ok(Math.abs(saltStorage(w)-cumulativeSalt-e.totals.saltInput+e.totals.saltOutput)<1e-7,
 'salinity drift entirely explained by existing external reservoir and rain export');
assert.ok(e.totals.internalWaterMoved>receipt.internalWaterMoved);
assert.deepEqual(w.water,wet);

const old=new World(seed,{generator:'planetary/1',planetOrigin:origin});
simulateHistoricalPlanetaryEnvironment(old,3);
const oldVolume=old.environment.volume.slice(),oldSalt=old.environment.salt.slice();
assert.equal(advanceInternalPlanetaryWater(old,oldSalt),null);
assert.deepEqual(old.environment.volume,oldVolume,'historical schema-3 interiors do not start flowing');
assert.deepEqual(old.environment.salt,oldSalt,'historical schema-3 salt inventories retain old laws');
const oldDay=advanceEnvironmentWater(old,climate,1);
assert.ok(!Object.hasOwn(oldDay,'internalWetEdges'),'historical receipts do not invent inland transfer fields');
validateEnvironment(old,old.environment);

// Genuine simulation snapshots and subsequent ecology must remain replayable.
const simulation=new Simulation(seed,{player:false,bootstrap:false,worldGenerator:'planetary/1',planetOrigin:origin});
for(let k=0;k<CFG.dayTicks+3;k++)simulation.update(null);
const snapshot=s=>structuredClone(createSimulationSnapshot(s,{reason:'internal-water-parity',savedAt:'fixed'}));
const saved=snapshot(simulation),restored=restoreSimulationSnapshot(structuredClone(saved));
assert.ok(isDeepStrictEqual(snapshot(restored),saved),'all internal water quantities and daily receipts survive save');
for(let k=0;k<CFG.lifeStride+3;k++){simulation.update(null);restored.update(null)}
assert.ok(isDeepStrictEqual(snapshot(simulation),snapshot(restored)),'biological day replay matches after volume flow restore');
const corrupt=structuredClone(saved);
corrupt.world.environment.volume[site[0]]=-1;
assert.throws(()=>restoreSimulationSnapshot(corrupt),/Invalid planetary water-volume field/);
console.log('Planetary internal hydrology PASS: connected wet-cell water/salt conservation, actual moving inventories, 10 real physical days, legacy v3 law, exact biological save/replay');
