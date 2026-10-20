import assert from 'node:assert/strict';
import {THERMAL_WEATHER,createThermalWeather,advanceThermalWeather,validateThermalWeather,thermalWeatherReading} from '../src/ecology/thermal-weather.js';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {coldSurfaceExchange} from '../src/world/snowpack.js';
const state=createThermalWeather('THERMAL-SPELLS'),repeat=createThermalWeather('THERMAL-SPELLS');
let warm=null,cold=null;for(let day=0;day<1500;day++){const delta=advanceThermalWeather(state,day);if(delta>THERMAL_WEATHER.spellThreshold&&warm===null)warm=delta;if(delta< -THERMAL_WEATHER.spellThreshold&&cold===null)cold=delta}
advanceThermalWeather(repeat,1499);assert.deepEqual(state,repeat,'absolute daily advancement is deterministic');assert.ok(warm!==null&&cold!==null,'both signed spells arise without scheduled events');
const continued=structuredClone(state);advanceThermalWeather(state,1500);advanceThermalWeather(continued,1500);assert.deepEqual(state,continued);
assert.throws(()=>advanceThermalWeather(state,1499),/clock/);const corrupt={...state,anomaly:state.anomaly+1};assert.throws(()=>validateThermalWeather(corrupt),/temperature state/);
// Climate-only clock fixture: no claim of elapsed biological history.
const modern=new Simulation('THERMAL-RAIN-PARITY',{player:false,bootstrap:false}),legacy=new Simulation('THERMAL-RAIN-PARITY',{player:false,bootstrap:false});delete legacy.thermalRules;delete legacy.thermalPattern;
for(let day=0;day<100;day++){for(const s of [modern,legacy]){s.tickCount=day*CFG.dayTicks;s.day=day+1;s.seasonIndex=Math.floor(day/CFG.seasonDays)%4;s.phaseClimate()}
 assert.equal(modern.climate.rain,legacy.climate.rain);assert.equal(modern.rng.state,legacy.rng.state);assert.deepEqual(modern.weatherPattern,legacy.weatherPattern);
 assert.ok(Math.abs(modern.climate.temp-legacy.climate.temp-modern.thermalPattern.anomaly)<1e-12,'existing climate receives the signed anomaly');}
// Extreme forcing is a normalization guard, not an ecological-history fixture.
modern.thermalPattern.fast=100;modern.thermalPattern.slow=0;modern.thermalPattern.anomaly=10;modern.phaseClimate();assert.equal(modern.climate.temp,1.5);
modern.thermalPattern.fast=-100;modern.thermalPattern.anomaly=-10;modern.phaseClimate();assert.equal(modern.climate.temp,-.5);
const water={water:new Uint8Array(1),soilWater:{snowpack:new Float64Array(1)}};
const freeze=coldSurfaceExchange(water,0,1,.34+cold);assert.ok(freeze.snowfall>0);const thaw=coldSurfaceExchange(water,0,0,.34+warm);assert.ok(thaw.melt>0);assert.ok(Math.abs(water.soilWater.snowpack[0]+thaw.melt-freeze.snowfall)<1e-12,'thermal thaw uses existing snow water');
const actual=new Simulation('THERMAL-SAVE');for(let tick=0;tick<8;tick++)actual.update({});
const saved=structuredClone(createSimulationSnapshot(actual)),restored=restoreSimulationSnapshot(structuredClone(saved));assert.deepEqual(restored.thermalPattern,actual.thermalPattern);
assert.deepEqual(thermalWeatherReading(restored,actual.player().x,actual.player().y),thermalWeatherReading(actual,actual.player().x,actual.player().y));
for(let tick=0;tick<4;tick++){actual.update({});restored.update({})}assert.deepEqual(restored.thermalPattern,actual.thermalPattern);assert.deepEqual(restored.climate,actual.climate);assert.equal(restored.rng.state,actual.rng.state);
const old=structuredClone(saved);delete old.core.thermalRules;delete old.core.thermalPattern;assert.equal(restoreSimulationSnapshot(old).thermalRules,undefined);
const bad=structuredClone(saved);bad.core.thermalPattern.anomaly++;assert.throws(()=>restoreSimulationSnapshot(bad),/temperature state/);
console.log('Thermal weather PASS: deterministic signed spells, unchanged rain/biological RNG, canonical temperature coupling, funded snow/thaw, real-tick save continuation and corrupt/legacy guards.');
