// Schema-6 inundation: real overland water becomes new shallow wet tiles,
// without an external topology import or lost seed/organism identities.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {World} from '../src/world/world.js';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {advanceEnvironmentWater,validateEnvironment} from '../src/world/environment.js';
import {advanceSoilDay} from '../src/ecology/soil-water.js';
import {totalPlanetarySurfaceWater} from '../src/world/planetary-runoff.js';
import {simulateHistoricalPlanetaryEnvironment} from './helpers/historical-planetary-environment.mjs';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const seed='GENVO8-TEST-A',origin={x:0,y:2560},climate={temp:.7,rain:.4};
const equal=(a,b,label)=>assert.ok(isDeepStrictEqual(a,b),label);
const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'flood-topology'}));
// The first naturally connected inland shoreline, or with warmest set the one
// with the highest regional temperature offset: cold land stores precipitation
// as snow, and snowy land is deliberately never inundated.
const candidate=(w,{warmest=false}={})=>{
 const n=w.n;let best=-1;
 for(let i=n+1;i<w.len-n-1;i++){
  const x=i%n;
  if(x<=1||x>=n-2||w.water[i])continue;
  if(!(w.water[i-1]||w.water[i+1]||w.water[i-n]||w.water[i+n]))continue;
  if(!warmest)return i;
  if(best<0||w.environment.temperatureOffset[i]>w.environment.temperatureOffset[best])best=i;
 }
 if(best>=0)return best;
 throw Error('No naturally connected inland shoreline');
};
// An existing dry shoreline has a truly owned overland water stock.
const world=new World(seed,{generator:'planetary/1',planetOrigin:origin}),env=world.environment;
assert.equal(env.schema,6);
const i=candidate(world),beforeMask=world.water.slice(),beforeDepth=env.depth.slice();
const original=totalPlanetarySurfaceWater(world);
assert.throws(()=>world.setSurfaceWater([{i,water:1,depth:.5,salinity:0,source:'overland'}],
 {reason:'unfunded-flood'}),/Runoff inundation lacks owned physical water/);
assert.equal(world.water[i],0,'unfunded conversion cannot change land');
assert.equal(world.topology.revision,0);
env.overland[i]=1.2; // Controlled genuine physical source, not synthetic flora.
const stocked=totalPlanetarySurfaceWater(world);
const saltBefore=env.salt.reduce((a,b)=>a+b,0);
const wave=advanceEnvironmentWater(world,climate,1);
const soil=advanceSoilDay(world,climate,1);
assert.equal(world.water[i],1,'retained runoff forms a real, persistent new wet tile');
assert.equal(world.topology.revision,1);
const event=world.topology.events.at(-1);
assert.equal(event.reason,'rainfall-runoff-inundation');
assert.equal(event.waterInput,0,'flooding does not import water from outside the World');
assert.equal(event.saltInput,0,'rainwater cannot fabricate ocean salt');
assert.ok(event.internalWater>.24,'flood water is supplied by recorded land runoff');
assert.equal(world.environment.overland[i],0,'new wet tile cannot also retain the same runoff stock');
assert.ok(world.environment.volume[i]>.24);
assert.ok(world.environment.depth[i]>0,'new wet topology carries a geographic water-depth baseline');
assert.equal(world.environment.salt[i],0,'runoff-derived freshwater begins unsalted');
assert.ok(Math.abs(totalPlanetarySurfaceWater(world)-stocked-
  (world.environment.lastDay.waterInput-world.environment.lastDay.waterOutput))<1e-7,
 'flooding changes representation without changing the physically conserved World water sum');
assert.ok(world.environment.lastDay.newWetCells>=1);
assert.ok(world.environment.lastDay.inundatedWater>=event.internalWater);
assert.equal(world.terrain.elevation[i],world.terrain.elevation[i],'original elevation is finite');
assert.equal(world._topologyMask[i],1,'derived hydrology knows the new shoreline');
assert.equal(world.topology.waterInput,0,'no external water credited to the topology');
assert.equal(world.topology.saltInput,0);
validateEnvironment(world,world.environment);
// Saved topology, runoff stores and immersion receipts are authoritative
// even though the immutable global planet generator still marks the cell dry.
const sim=new Simulation(seed,{player:false,bootstrap:false,worldGenerator:'planetary/1',planetOrigin:origin});
// This region opens below the snow line; snowy land is never inundated, so wait
// for the season to warm and the candidate's own snow to melt (real time, no edits).
const ci=candidate(sim.world,{warmest:true});
for(let d=0;d<60&&!(sim.world.soilWater?.lastDay?.climateTemp>.45&&!(sim.world.soilWater.snowpack[ci]>1e-8));d++)
 for(let t=0;t<CFG.dayTicks;t++)sim.update(null);
assert.ok(sim.world.soilWater&&!(sim.world.soilWater.snowpack[ci]>1e-8),'the season thaws the candidate shoreline');
sim.world.environment.overland[ci]=1.2;
for(let t=0;t<CFG.dayTicks+4;t++)sim.update(null);
assert.equal(sim.world.water[ci],1);
const saved=snap(sim),restored=restoreSimulationSnapshot(structuredClone(saved));
equal(snap(restored),saved,'a flooded shoreline round trips without regeneration of old geography');
assert.equal(restored.world.water[ci],1);
assert.equal(restored.world.environment.overland[ci],0);
assert.equal(restored.world.topology.events.at(-1).reason,'rainfall-runoff-inundation');
for(let t=0;t<CFG.lifeStride+4;t++){sim.update(null);restored.update(null)}
equal(snap(sim),snap(restored),'actual animals, seed banks and physical flood stages continue identically');
// Corruption can never double-count the same water as land runoff and open water.
const bad=structuredClone(saved);
bad.world.environment.overland[ci]=.1;
assert.throws(()=>restoreSimulationSnapshot(bad),/Invalid planetary overland runoff field/);
// The historical fifth-version environment must never change wet topology
// automatically, even with the exact same stock and regional geography.
const old=new World(seed,{generator:'planetary/1',planetOrigin:origin});
const oi=candidate(old);
simulateHistoricalPlanetaryEnvironment(old,5);
old.environment.overland[oi]=1.2;
advanceEnvironmentWater(old,climate,1);advanceSoilDay(old,climate,1);
assert.equal(old.water[oi],0,'existing schema-5 world retains previous non-flooding rules');
assert.equal(old.topology.revision,0);
console.log('Rain-funded inundation PASS: real wet mask, exact internal volume conversion, no external imports, unchanged salt conservation, historical v5, valid saved topology, deterministic animal and seed continuation');
