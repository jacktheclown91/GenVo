import assert from 'node:assert/strict';
import {World} from '../src/world/world.js';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {localRain,localTemperature,salinityAt,saltStorage,advanceEnvironmentWater,validateEnvironment} from '../src/world/environment.js';
import {advanceSoilDay,initializeSoilWater} from '../src/ecology/soil-water.js';
const w=new World('REGIONAL-ENVIRONMENT',{generator:'coastal/1'}),same=new World('REGIONAL-ENVIRONMENT',{generator:'coastal/1'});
assert.deepEqual(w.environment,same.environment,'seeded physical fields are deterministic');validateEnvironment(w,w.environment);
const coast=[],river=[],land=[];for(let i=0;i<w.len;i++){if(w.water[i]){if(salinityAt(w,i)>.9)coast.push(i);if(salinityAt(w,i)<.01)river.push(i);}else land.push(i)}
assert.ok(coast.length>500&&river.length>100,'ordinary world has sea connected to freshwater');
assert.ok(coast.some(i=>w.environment.depth[i]>1),'offshore water has meaningful depth');
const seen=new Set([river[0]]),queue=[river[0]];for(let k=0;k<queue.length;k++){const i=queue[k],x=i%w.n,y=(i/w.n)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,j=ny*w.n+nx;if(nx>=0&&ny>=0&&nx<w.n&&ny<w.n&&w.water[j]&&!seen.has(j)){seen.add(j);queue.push(j)}}}assert.ok(coast.some(i=>seen.has(i)),'freshwater physically connects to sea');
assert.ok(Math.max(...w.environment.temperatureOffset)-Math.min(...w.environment.temperatureOffset)>.4,'local climate contrasts persist');
assert.ok(Math.max(...w.environment.rainScale)-Math.min(...w.environment.rainScale)>.3,'regional rainfall varies');
assert.ok(coast.every(i=>!w.isDrinkable(i%w.n+.5,(i/w.n|0)+.5)),'sea is not potable');
assert.ok(coast.every(i=>w.freshwaterFood.duckweed[i]===0),'sea does not initialize duckweed');
const climate={rain:.6,temp:.55},initialSalt=saltStorage(w);
for(let d=1;d<=8;d++){const r=advanceEnvironmentWater(w,climate,d);assert.ok(Math.abs(r.closure)<1e-8,'salt flux budget closes');validateEnvironment(w,w.environment);}
assert.ok(Math.abs(saltStorage(w)-initialSalt-w.environment.totals.saltInput+w.environment.totals.saltOutput)<1e-8,'cumulative salt budget closes');
assert.equal(w.environment.totals.rainWater,w.environment.totals.displacedWater,'fixed depth accounts for displaced rain water');
// Controlled local rain, with no external water body. Different local inputs, one conserved budget.
const small={n:2,len:4,water:new Uint8Array(4),moisture:new Float32Array(4).fill(.1),environment:{rainScale:Float32Array.of(.1,2,.1,2),temperatureOffset:Float32Array.of(0,0,-.3,-.3)}};
initializeSoilWater(small);advanceSoilDay(small,climate,1);assert.ok(small.moisture[1]>small.moisture[0]);assert.ok(small.moisture[2]>small.moisture[0]);assert.ok(Math.abs(small.soilWater.lastDay.closure)<1e-6);
assert.ok(localTemperature(small,climate,2)<localTemperature(small,climate,0));assert.ok(localRain(small,climate,1)>localRain(small,climate,0));
const sim=new Simulation('REGIONAL-RESUME',{player:false,worldGenerator:'coastal/1'}),step=s=>{const d=s.day;while(s.day===d)s.update(null)};step(sim);
const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'environment-test'}));
const saved=snap(sim),resumed=restoreSimulationSnapshot(structuredClone(saved));step(sim);step(resumed);assert.deepEqual(snap(resumed),snap(sim),'complete regional history resumes exactly');
// A save from before the regional environment also predates diving (which reads its
// bathymetry), so the legacy fixture is a fresh world's snapshot, before any creature
// dives, with the environment and the diving rule removed.
const legacy=snap(new Simulation('REGIONAL-RESUME',{player:false,worldGenerator:'coastal/1'}));delete legacy.world.environment;for(const k of Object.keys(legacy.core))if(/^diving/.test(k))delete legacy.core[k];const old=restoreSimulationSnapshot(legacy);assert.equal(old.world.environment,undefined,'older saves are not retrofitted');step(old);assert.equal(restoreSimulationSnapshot(snap(old)).world.environment,undefined);
const corrupt=structuredClone(saved);corrupt.world.environment.salt[land[0]]=1;assert.throws(()=>restoreSimulationSnapshot(corrupt),/topology mismatch/);
console.log('Regional environment: connected freshwater/sea, persistent climate, potable-water separation, salt/water accounting and exact resume PASS');
