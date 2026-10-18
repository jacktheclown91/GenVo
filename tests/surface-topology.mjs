import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {saltStorage,validateEnvironment} from '../src/world/environment.js';
import {WORLD_GENERATORS,generatedWaterAt} from '../src/world/surface-topology.js';
const s=new Simulation('TOPOLOGY-TRANSACTION',{player:false,worldGenerator:'coastal/1'}),w=s.world,snap=()=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'topology-test'}));
const i=w.water.findIndex(v=>!v),food=structuredClone(w.freshwaterFood),before=saltStorage(w);
const r=w.setSurfaceWater([{i,water:1,depth:.7,salinity:2}],{reason:'controlled external saline inlet'});assert.ok(Math.abs(saltStorage(w)-before-r.saltInput)<1e-9);assert.equal(r.waterInput,w.environment.depth[i]);validateEnvironment(w,w.environment);assert.deepEqual(w.freshwaterFood,food,'topology never creates food');
const output=w.setSurfaceWater([{i,water:0}],{reason:'controlled drainage export'});assert.ok(Math.abs(output.saltOutput-r.saltInput)<1e-9);assert.ok(Math.abs(saltStorage(w)-before)<1e-9,'salt is exported, never silently deleted');assert.equal(output.waterOutput,r.waterInput);
const clean=snap();for(const changes of [[{i,water:1,depth:0,salinity:0}],[{i,water:1,depth:.2,salinity:3}],[{i,water:0},{i,water:1,depth:.2,salinity:0}]]){assert.throws(()=>w.setSurfaceWater(changes,{reason:'bad'}));assert.deepEqual(snap(),clean,'rejected transaction leaves full state unchanged');}
const restored=restoreSimulationSnapshot(snap());assert.deepEqual(restored.world.topology,w.topology);assert.equal(restored.world.generator,w.generator);
for(const mutate of [d=>d.world.environment.salt[i]=1,d=>d.world.environment.depth[w.water.findIndex(Boolean)]=0,d=>d.world.generator='unknown/99',d=>d.world.topology.waterInput=NaN]){const d=snap();mutate(d);assert.throws(()=>restoreSimulationSnapshot(d),'bad serialized state is rejected, not repaired');}
// Truly old no-mask/no-environment saves retain the old generator, not the coastal default.
const old=snap();delete old.world.environment;delete old.world.generator;delete old.world.surfaceWater;delete old.world.topology;const legacy=restoreSimulationSnapshot(old);assert.equal(legacy.world.generator,WORLD_GENERATORS.legacy);for(let y=0;y<w.n;y++)for(let x=0;x<w.n;x++)assert.equal(legacy.world.water[y*w.n+x],generatedWaterAt(w,x,y,WORLD_GENERATORS.legacy));assert.equal(legacy.world.environment,undefined);
console.log('Topology transactions: exact water/salt boundaries, no food creation, atomic rejection, strict saved corruption checks and old generator fallback PASS');
