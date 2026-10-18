import assert from 'node:assert/strict';
import {World} from '../src/world/world.js';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {SOIL_WATER,advanceSoilDay} from '../src/ecology/soil-water.js';
import {advanceEnvironmentWater,localRain,saltStorage,validateEnvironment} from '../src/world/environment.js';
import {rainFrontFactor} from '../src/world/weather-fronts.js';
import {BIOMES,biomeAt,countBiomes} from '../src/world/biomes.js';

const w=new World('E1-FRONTS',{generator:'coastal/1'}),identical=new World('E1-FRONTS',{generator:'coastal/1'});
const climate={temp:.57,rain:.65},day=11,n=w.n;
const probe=Array.from({length:w.len},(_,i)=>i).filter(i=>!w.water[i]&&w.environment.rainScale[i]>.35);
assert.ok(probe.length>1000);
const factors=probe.map(i=>rainFrontFactor(w,day,i));
assert.ok(Math.min(...factors)<.6&&Math.max(...factors)>1.4,'real regional wet and dry front bands');
assert.ok(factors.every(f=>f>=.55&&f<=1.45),'no negative rainfall or unbounded material');
const oneRow=Array.from({length:n},(_,x)=>rainFrontFactor(w,day,30*n+x));
assert.ok(Math.abs(oneRow.reduce((a,b)=>a+b,0)/n-1)<1e-12,'a complete east-west front has mean 1 before physical rain shadows');
assert.equal(rainFrontFactor(w,day,probe[12]),rainFrontFactor(identical,day,probe[12]),'seeded weather fronts repeat identically');
assert.notEqual(rainFrontFactor(w,day,probe[12]),rainFrontFactor(w,day+8,probe[12]),'moving fronts change local rainfall with time');
assert.equal(localRain(w,climate,probe[12]),climate.rain*w.environment.rainScale[probe[12]],'existing direct legacy climate queries are unchanged without frontDay');
const rain=probe.map(i=>localRain(w,{...climate,frontDay:day},i));
assert.ok(rain.every(q=>q>=0),'front precipitation has no negative mass');
assert.ok(rain.some((q,k)=>Math.abs(q-climate.rain*w.environment.rainScale[probe[k]])>.08),'fronts change actual rain, not only biome names');
const beforeSalt=saltStorage(w);
for(let d=1;d<=6;d++){
 const storm=advanceEnvironmentWater(w,climate,d);
 const match=advanceEnvironmentWater(identical,climate,d);
 const soil=advanceSoilDay(w,climate,d),again=advanceSoilDay(identical,climate,d);
 assert.deepEqual(storm,match,'same world inputs generate same actual salt and rain transfers');
 assert.deepEqual(soil.lastDay,again.lastDay,'actual conserved land water responds deterministically to fronts');
 assert.ok(Math.abs(storm.closure)<1e-7,'salt in/out closure remains physical');
 assert.ok(Math.abs(soil.lastDay.closure)<=1e-6*soil.lastDay.storageBefore+1e-3,'soil water budget remains closed');
 const total=Array.from({length:w.len},(_,i)=>w.water[i]?0:localRain(w,{...climate,frontDay:d},i)*SOIL_WATER.rainScale).reduce((a,b)=>a+b,0);
 assert.ok(Math.abs(soil.lastDay.rain-total)<1e-6*Math.max(1,total),'daily credited rain equals actual front-fed local precipitation');
 validateEnvironment(w,w.environment);
}
assert.ok(Math.abs(saltStorage(w)-beforeSalt-w.environment.totals.saltInput+w.environment.totals.saltOutput)<1e-7,'full water salinity material audit reconciles');
assert.deepEqual([...w.moisture],[...identical.moisture],'regional water storage repeats byte-for-byte');

// Habitat names follow REAL fields, not species catalogues, grants or static maps.
const land=probe[30],probeClimate={...climate,frontDay:6};
const landBiome=w.biomeAt(land%n+.5,Math.floor(land/n)+.5,probeClimate);
assert.ok(Object.hasOwn(BIOMES,landBiome.code));
assert.ok(Number.isFinite(landBiome.rain)&&Number.isFinite(landBiome.temperature));
assert.deepEqual(w.biomeAt(land%n+.5,Math.floor(land/n)+.5,climate),landBiome,'world biome query reads the actual current weather front without requiring UI to provide its day');
const classes=w.biomeCounts(probeClimate);
assert.equal(Object.values(classes).reduce((a,b)=>a+b,0),w.len,'every actual world cell has one readable habitat');
assert.deepEqual(classes,countBiomes(w,probeClimate));
assert.ok(classes.ocean>100&&classes.freshwater>20,'different water regimes follow existing salinity');
const fixture={n:2,len:4,water:new Uint8Array(4),moisture:Float32Array.of(.08,.66,.7,.8),
 fertility:new Float32Array(4).fill(.65),seepage:Float32Array.of(0,0,.8,0),
 terrain:{elevation:Float32Array.of(.05,.05,.05,.78)},
 plants:{bramble:Float32Array.of(0,.35,0,0),marshroot:new Float32Array(4)},
 environment:{temperatureOffset:new Float32Array(4),rainScale:new Float32Array(4).fill(1),salt:new Float64Array(4),depth:new Float32Array(4)},
 seedHash:0};
assert.equal(biomeAt(fixture,0,{rain:.25,temp:.6}).code,'arid');
assert.equal(biomeAt(fixture,1,{rain:.7,temp:.6}).code,'thicket');
assert.equal(biomeAt(fixture,2,{rain:.7,temp:.6}).code,'wetland');
assert.equal(biomeAt(fixture,3,{rain:.7,temp:.35}).code,'alpine');
fixture.moisture[0]=.67;fixture.plants.bramble[0]=.3;
assert.equal(biomeAt(fixture,0,{rain:.7,temp:.6}).code,'thicket','physical habitat can change without renaming a species');
fixture.water[0]=1;fixture.environment.depth[0]=1;fixture.environment.salt[0]=.8;
assert.equal(biomeAt(fixture,0,{rain:.7,temp:.6}).code,'ocean');
assert.throws(()=>biomeAt(fixture,99,climate),/Invalid biome observation/);
assert.throws(()=>w.biomeAt(-1,2,climate),/outside world/);

// Save/resume with real climate/soil/biology on the coastal generator.
const sim=new Simulation('E1-COAST-SAVE',{player:false,worldGenerator:'coastal/1'});
for(let t=0;t<96;t++)sim.update(null);
const saved=structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'e1-fronts'}));
const restored=restoreSimulationSnapshot(structuredClone(saved));
for(let t=0;t<96;t++){sim.update(null);restored.update(null);}
const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'e1-fronts'}));
assert.deepEqual(snap(sim),snap(restored),'moving precipitation, salinity, vegetation, genes and animal ecology resume exactly');
console.log('E1 moving fronts and material biome observation: hydrology and salt close, real habitats respond, save/resume PASS');
