import assert from 'node:assert/strict';
import {World} from '../src/world/world.js';
import {deriveDrainage,exchangeTerrainGroundwater} from '../src/world/topography.js';
import {initializeSoilWater,advanceSoilDay} from '../src/ecology/soil-water.js';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const a=new World('TOPOGRAPHY'),b=new World('TOPOGRAPHY');
assert.deepEqual(a.terrain,b.terrain,'same seed gives identical terrain');
assert.notDeepEqual(a.terrain.elevation,new World('OTHER-TOPOGRAPHY').terrain.elevation,'seed affects relief');
assert.ok(Math.max(...a.terrain.elevation)>.2,'world contains uplands');
for(let i=0;i<a.len;i++){const j=a.terrain.downstream[i];if(j>=0)assert.ok(a.terrain.elevation[j]<a.terrain.elevation[i],'drainage strictly descends, so cannot cycle');}
// Equal water stores move downhill, not uphill. Internal transfers conserve water.
const w={n:2,len:4,water:new Uint8Array(4),terrain:{schema:1,elevation:Float32Array.of(1,0,1,0)}};deriveDrainage(w);
const g=Float32Array.of(.5,.5,.5,.5),next=new Float32Array(4);
assert.equal(exchangeTerrainGroundwater(w,g,next,.5),0);assert.ok(next[0]<g[0]&&next[1]>g[1]);assert.equal([...next].reduce((x,y)=>x+y),2);
// Extreme dry/saturated configurations, open boundaries, and finite daily budgets.
initializeSoilWater(a);for(let i=0;i<a.len;i++){a.soilWater.groundwater[i]=i%3?0:1;a.moisture[i]=i%2?0:1;}
for(let day=1;day<=12;day++){advanceSoilDay(a,{rain:day%2?0:3,temp:.8},day);assert.ok(Math.abs(a.soilWater.lastDay.closure)<.001,'terrain water budget closes');assert.ok(a.soilWater.groundwater.every(v=>Number.isFinite(v)&&v>=0&&v<=1),'stores remain finite and bounded');}
// New terrain is saved, validated, and resumes exactly. Old saves remain on legacy flow.
const sim=new Simulation('TOPOGRAPHY-RESUME',{player:false});
const step=s=>{const day=s.day;while(s.day===day)s.update(null)};
step(sim);const saved=structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'test'}));
const restored=restoreSimulationSnapshot(structuredClone(saved));step(sim);step(restored);
const snapshot=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'test'}));
assert.deepEqual(snapshot(restored),snapshot(sim),'full state resumes exactly');
// A pre-terrain save predates every underground layer too (natural caves, excavated
// passages and their rules), so the legacy fixture is a fresh world's snapshot with
// terrain and those later layers removed; no creature has burrowed at tick 0.
const legacy=structuredClone(createSimulationSnapshot(new Simulation('TOPOGRAPHY-RESUME',{player:false}),{savedAt:'fixed',reason:'test'}));delete legacy.world.terrain;delete legacy.world.subsurface;for(const k of ['caveRules','caveRuleMigrations','burrowingRules','diggingRules'])delete legacy.core[k];const old=restoreSimulationSnapshot(legacy);assert.equal(old.world.terrain,undefined,'old save never receives new terrain');
assert.equal(restoreSimulationSnapshot(snapshot(old)).world.terrain,undefined,'legacy mode survives subsequent saves');
const corrupt=structuredClone(saved);corrupt.world.terrain.elevation[0]=NaN;assert.throws(()=>restoreSimulationSnapshot(corrupt),/terrain elevation/);
console.log('Topography: deterministic drainage, downhill conservative flow, finite budgets, exact resume and legacy compatibility PASS');
