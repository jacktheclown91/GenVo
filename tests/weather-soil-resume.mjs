// Save/resume determinism for persistent weather and the soil-water cycle (roadmap stage W). A natural world with
// animals runs N days uninterrupted; the same seed runs k days, is saved, restored from a structured clone of the
// save, and runs the remaining N-k days. Weather state, climate, moisture, groundwater, the daily water budget and
// the whole saved simulation state must be identical. Also: weather never consumes sim.rng, the weather is a pure
// function of seed and day, and the daily water budget closes on every day of the run.
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {WEATHER_PATTERNS,createWeatherState,advanceWeatherTo} from '../src/ecology/weather.js';
import {SOIL_WATER} from '../src/ecology/soil-water.js';
import {CFG} from '../src/sim/config.js';
assert.ok(WEATHER_PATTERNS.enabled&&SOIL_WATER.enabled,'both switches are on by default for this test');
const days=(sim,n)=>{for(let d=0;d<n;d++){const d0=sim.day;while(sim.day===d0)sim.update(null)}};
const N=14,K=6,seed='WEATHER-RESUME';
const control=new Simulation(seed,{player:false});const budget=[];
// Daily budget closure on the uninterrupted run (relative to the land water store).
const ps=control.phaseSoil.bind(control);control.phaseSoil=()=>{ps();const d=control.world.soilWater?.lastDay;if(d&&control.tickCount%CFG.dayTicks===0)budget.push(d)};
days(control,N);
assert.ok(budget.length>=N-1,'a budget record for every day');
for(const d of budget){assert.ok(Math.abs(d.closure)<=1e-6*d.storageBefore+1e-3,`day ${d.day} budget closes: ${d.closure}`);
  assert.ok(Math.abs(d.rain+d.snowmelt-d.snowfall-d.infiltration-d.runoff)<1e-6*Math.max(1,d.rain+d.snowmelt),'precipitation and snowmelt split into snow storage, infiltration and runoff')}
const part=new Simulation(seed,{player:false});days(part,K);
const saved=createSimulationSnapshot(part,{savedAt:'fixed',reason:'test'});
const resumed=restoreSimulationSnapshot(structuredClone(saved));days(resumed,N-K);
assert.deepEqual(resumed.weatherPattern,control.weatherPattern,'weather state continues exactly');
assert.deepEqual(resumed.climate,control.climate,'climate continues exactly');
assert.deepEqual([...resumed.world.moisture],[...control.world.moisture],'moisture continues exactly');
assert.deepEqual([...resumed.world.soilWater.groundwater],[...control.world.soilWater.groundwater],'groundwater continues exactly');
assert.deepEqual(resumed.world.soilWater.lastDay,control.world.soilWater.lastDay,'daily water budget continues exactly');
assert.equal(resumed.rng.state,control.rng.state,'simulation RNG continues exactly');
const strip=s=>{const o=createSimulationSnapshot(s,{savedAt:'fixed',reason:'test'});delete o.meta;return structuredClone(o)};
assert.deepEqual(strip(resumed),strip(control),'the whole saved simulation state matches the uninterrupted run');
// Weather is a pure function of seed and day, and uses its own stream: sim.rng advances identically with weather on or off.
const a=createWeatherState(seed);advanceWeatherTo(a,40);const b=createWeatherState(seed);advanceWeatherTo(b,17);advanceWeatherTo(b,40);assert.deepEqual(a,b,'weather by day is path independent');
const on=new Simulation('WEATHER-RNG',{player:false}),off=new Simulation('WEATHER-RNG',{player:false});
for(let t=0;t<CFG.dayTicks*3;t++){on.phaseClimate();on.tickCount++}
WEATHER_PATTERNS.enabled=false;try{for(let t=0;t<CFG.dayTicks*3;t++){off.phaseClimate();off.tickCount++}}finally{WEATHER_PATTERNS.enabled=true}
assert.equal(on.rng.state,off.rng.state,'weather patterns do not change the simulation random sequence');
assert.equal(off.weatherPattern,undefined,'the old rule keeps no weather state');
console.log(`weather and soil water resume exactly after save at day ${K} of ${N}; daily water budget closes on ${budget.length} days: PASS`);
