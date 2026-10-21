import {igniteWildfire,fireFuel,WILDFIRE} from '../src/ecology/wildfire.js';
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {THUNDERSTORMS} from '../src/ecology/thunderstorms.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const s=new Simulation('THUNDER-REGIONS',{worldGenerator:'planetary/1'}),climate=s.phaseClimate;
// Controlled warm wet forcing; all hydrology, organisms and clocks advance
// normally. This isolates regional event ownership, not natural frequency.
s.phaseClimate=function(...args){const r=climate.apply(this,args);this.climate={...this.climate,temp:.95,rain:2};return r};
for(let k=0;k<160&&!s.thunderstorms.events.length;k++)s.update(null);
assert.ok(s.thunderstorms.events.length);const history=structuredClone(s.thunderstorms);
s.climate={temp:1,rain:0};const fireSite=Array.from({length:s.world.len},(_,i)=>i).find(i=>s.world.isPlayable(i%s.world.n+.5,(i/s.world.n|0)+.5)&&!s.world.water[i]&&s.world.moisture[i]<.6&&fireFuel(s,i)>.08);assert.ok(igniteWildfire(s,fireSite));const fireHistory=structuredClone(s.wildfire);
const frontier=(sim,x,direction)=>{const p=sim.player();for(let y=10.5;y<118.5;y++){p.x=x;p.y=y;const status=planetaryTravelAvailability(sim);if(status.enabled&&status.direction===direction)return true}return false};
assert.ok(frontier(s,125.2,'east'));const crossing=crossPlanetaryBorder(s);assert.ok(crossing.ok,crossing.message);const next=crossing.simulation;
assert.equal(next.thunderRules,THUNDERSTORMS.policy);assert.equal(next.thunderstorms.events.length,0,'new region does not inherit a strike at another region\'s local coordinates');assert.deepEqual(next.planetaryTravel.sessions[0].snapshot.core.thunderstorms,history);
assert.equal(next.fireRules,WILDFIRE.policy);assert.equal(next.wildfire.cells.size,0);assert.deepEqual(next.planetaryTravel.sessions[0].snapshot.core.wildfire,fireHistory);
const saved=structuredClone(createSimulationSnapshot(next,{savedAt:'regional'})),restored=restoreSimulationSnapshot(structuredClone(saved));next.update(null);restored.update(null);assert.deepEqual(createSimulationSnapshot(restored,{savedAt:'same'}),createSimulationSnapshot(next,{savedAt:'same'}));
const old=new Simulation('THUNDER-REGIONS-OLD',{worldGenerator:'planetary/1',stormWeather:false,fireWeather:false});assert.ok(frontier(old,125.2,'east'));const legacy=crossPlanetaryBorder(old);assert.ok(legacy.ok);assert.equal(Object.hasOwn(legacy.simulation,'thunderRules'),false);assert.equal(Object.hasOwn(legacy.simulation,'thunderstorms'),false);assert.equal(Object.hasOwn(legacy.simulation,'fireRules'),false);assert.equal(Object.hasOwn(legacy.simulation,'wildfire'),false);restoreSimulationSnapshot(createSimulationSnapshot(legacy.simulation));
console.log('Regional thunderstorms PASS: actual controlled-weather ticks, independent local events, exact archive/save continuation and historical opt-out.');
