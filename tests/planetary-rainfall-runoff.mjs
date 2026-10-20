// End-to-end rain -> soil infiltration/runoff -> routed surface water.
// V5 has one authoritative surface inventory. Every credited unit originates
// in real rain/snowmelt or the soil's already-accounted overflow stock.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {World} from '../src/world/world.js';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {advanceEnvironmentWater,validateEnvironment,waterStorage} from '../src/world/environment.js';
import {advanceSoilDay,soilWaterStorage} from '../src/ecology/soil-water.js';
import {routePlanetaryRunoff,totalPlanetarySurfaceWater} from '../src/world/planetary-runoff.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const close=(a,b,eps=1e-7)=>assert.ok(Math.abs(a-b)<=eps,`difference ${a} vs ${b}`);
const snap=s=>structuredClone(createSimulationSnapshot(s,{reason:'rainfall-runoff-parity',savedAt:'fixed'}));
const seed='GENVO8-TEST-A',origin={x:0,y:2560};
const w=new World(seed,{generator:'planetary/1',planetOrigin:origin}),e=w.environment;
assert.equal(e.schema,5);
assert.ok(e.overland instanceof Float64Array&&e.overland.length===w.len);
assert.equal(totalPlanetarySurfaceWater(w),waterStorage(w));
const land=w.water.slice(),bathymetry=e.depth.slice(),bed=w.terrain.elevation.slice();
const climate={temp:.53,rain:.72};
let captured=0,delivered=0,overlandMoved=0,rainRetained=0;
for(let day=1;day<=12;day++){
 const start=totalPlanetarySurfaceWater(w);
 const ocean=advanceEnvironmentWater(w,climate,day);
 const soil=advanceSoilDay(w,climate,day);
 const row=e.lastDay,soilRow=soil.lastDay;
 close(row.soilRunoffReceived,soilRow.surfaceRunoffCaptured);
 close(row.soilRunoffReceived,soilRow.runoff+soilRow.overflow);
 close(row.waterInput,row.surfaceRainInput+soilRow.surfaceRunoffCaptured);
 close(row.waterOutput,row.surfaceRainOutput);
 close(totalPlanetarySurfaceWater(w)-start,row.waterInput-row.waterOutput);
 close(row.waterClosure,0,1e-6);
 close(soilRow.closure,0,1e-3);
 assert.ok(row.surfaceRainInput>0,'rain falls on natural existing water');
 assert.ok(row.soilRunoffReceived>=0,'frozen days may store precipitation as snow instead of running off');
 assert.ok(row.overlandMoved>=0&&row.runoffDelivered>=0);
 captured+=row.soilRunoffReceived;delivered+=row.runoffDelivered;
 overlandMoved+=row.overlandMoved;
 rainRetained+=row.surfaceRainInput-row.surfaceRainOutput;
 validateEnvironment(w,e);
}
assert.ok(captured>0,'land runoff reaches persistent overland state');
assert.ok(overlandMoved>0,'topographic drainage advances surface water downhill');
assert.ok(rainRetained>0,'existing water bodies now retain rain');
assert.ok(e.overland.some(v=>v>0),'closed basins or in-transit headwaters store water');
assert.deepEqual(w.water,land,'soil runoff cannot invent a new river or drown land');
assert.deepEqual(e.depth,bathymetry,'bathymetric initial-depth authority is unchanged');
assert.deepEqual(w.terrain.elevation,bed,'terrain elevations are unchanged');
assert.ok(e.totals.soilRunoffReceived>=captured-1e-8);
assert.ok(e.totals.runoffDelivered>=delivered-1e-8);

// Directly test a real downhill land -> wet mouth with a controlled runoff
// pulse, independently of the soil process, including its persistent receipt.
const mouth=new World(seed,{generator:'planetary/1',planetOrigin:origin});
let source=-1,target=-1;
for(let i=0;i<mouth.len;i++){
 const j=mouth.terrain.downstream[i];
 if(!mouth.water[i]&&j>=0&&mouth.water[j]&&mouth.environment.volume[j]<1.9){
  source=i;target=j;break;
 }
}
assert.ok(source>=0,'planet has a legitimate land-to-water drainage mouth');
advanceEnvironmentWater(mouth,climate,1);
const pulse=new Float64Array(mouth.len);pulse[source]=.04;
const stored=totalPlanetarySurfaceWater(mouth),atMouth=mouth.environment.volume[target];
const transfer=routePlanetaryRunoff(mouth,pulse,1);
assert.ok(transfer.delivered>0,'a real downhill outlet delivers water to the lake/river inventory');
assert.ok(mouth.environment.volume[target]>atMouth);
close(totalPlanetarySurfaceWater(mouth)-stored,.04);
close(mouth.environment.lastDay.waterClosure,0,1e-6);
validateEnvironment(mouth,mouth.environment);

// V4 historical physics still cannot create overland water or retain the
// newly introduced precipitation volume.
const historical=new World(seed,{generator:'planetary/1',planetOrigin:origin});
historical.environment.schema=4;
delete historical.environment.overland;
advanceEnvironmentWater(historical,climate,1);
const fixedVolume=historical.environment.volume.slice();
advanceSoilDay(historical,climate,1);
assert.deepEqual(historical.environment.volume,fixedVolume,
 'historical v4 soil runoff is not silently enabled after loading');
assert.ok(!Object.hasOwn(historical.environment.lastDay,'soilRunoffReceived'));
validateEnvironment(historical,historical.environment);

// Real canonical Sim save restores the inventories, routed receipts and
// subsequent stochastic biological evolution without clock or RNG edits.
const sim=new Simulation(seed,{player:false,bootstrap:false,worldGenerator:'planetary/1',planetOrigin:origin});
for(let tick=0;tick<CFG.dayTicks+5;tick++)sim.update(null);
const reference=snap(sim),restored=restoreSimulationSnapshot(structuredClone(reference));
assert.ok(isDeepStrictEqual(snap(restored),reference),'new surface stocks persist exactly');
for(let tick=0;tick<CFG.dayTicks+3;tick++){sim.update(null);restored.update(null)}
assert.ok(isDeepStrictEqual(snap(sim),snap(restored)),'saved land runoff and fauna continue deterministically');
const corrupt=structuredClone(reference);
const dry=land.findIndex(v=>!v);
corrupt.world.environment.overland[dry]=-1;
assert.throws(()=>restoreSimulationSnapshot(corrupt),/Invalid planetary overland runoff field/);
console.log('Planetary rain and runoff PASS: 12 real soil days, rain retention, runoff captured once, downhill drainage into lake, overland basin storage, conservation, v4 fallback, exact save and fauna replay');
