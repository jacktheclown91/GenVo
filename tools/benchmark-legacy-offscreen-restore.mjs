// Focused transport benchmark for E17 physical-only archived regions.
// Measures just checkpoint restoration, not calendar replay, mature memory,
// browser frames or the normal E18 biological scheduler. Both variants return
// independently mutable runtimes with complete save-byte parity.
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {isDeepStrictEqual} from 'node:util';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {createSimulationSnapshot,restoreSimulationSnapshot,restoreDetachedSimulationSnapshot} from '../src/persistence/save-manager.js';
const sourceWorld=new Simulation('PLANET-B0-A',{player:false,bootstrap:false,worldGenerator:'planetary/1'});
for(let i=0;i<CFG.dayTicks+5;i++)sourceWorld.update(null);
const archived=structuredClone(createSimulationSnapshot(sourceWorld,{reason:'e17-transport-benchmark',savedAt:'fixed'}));
const snap=sim=>structuredClone(createSimulationSnapshot(sim,{reason:'parity',savedAt:'fixed'}));
const paths={
 fullClone:s=>restoreSimulationSnapshot(structuredClone(s)),
 detached:s=>restoreDetachedSimulationSnapshot(s)
};
const expected=snap(paths.fullClone(archived));
const rows={fullClone:[],detached:[]};
for(const label of ['fullClone','detached','detached','fullClone','detached','fullClone']){
 const start=performance.now(),runtime=paths[label](archived),duration=performance.now()-start;
 assert.ok(isDeepStrictEqual(snap(runtime),expected),'restored physical snapshot data differ');
 rows[label].push(Math.round(duration*100)/100);
}
const mean=v=>Math.round(v.reduce((n,x)=>n+x,0)/v.length*100)/100;
console.log(JSON.stringify({
 scope:'Young real planetary region, archived E17 transport only, 3 alternating samples each; not mature-world FPS/memory',
 seed:'PLANET-B0-A',day:sourceWorld.day,cohorts:Object.values(sourceWorld.dispersal.floraState.seeds).reduce((n,m)=>n+[...m.values()].reduce((v,r)=>v+r.size,0),0),
 meanMs:{fullClone:mean(rows.fullClone),detached:mean(rows.detached)},
 samplesMs:rows,exactSaveParity:true
},null,2));
