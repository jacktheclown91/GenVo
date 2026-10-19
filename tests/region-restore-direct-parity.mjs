// Fully saved neighboring planetary regions must restore without generating
// disposable starting ecosystems. The same physical stocks, future biology and
// save bytes must result as from the original generated restore path.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {Simulation} from '../src/sim/simulation.js';
import {World} from '../src/world/world.js';
import {CFG} from '../src/sim/config.js';
import {initializeSoilWater} from '../src/ecology/soil-water.js';
import {createSimulationSnapshot,restoreSimulationSnapshot,completeWorldForDirectRestore} from '../src/persistence/save-manager.js';

const snapshot=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'multi-region-direct-restore'}));
const sim=new Simulation('PLANET-B0-A',{player:true,worldGenerator:'planetary/1'});
for(let tick=0;tick<CFG.dayTicks+6;tick++)sim.update(null);
const origin=sim.world.regionOrigin;
for(const dir of ['east','south','west']){
 const region=sim.planetaryRegions.neighbor(origin,dir,{create:true});
 // An unvisited survey may lack the soil-water controller, and must retain
 // generated fallback. Set up complete, physically initialized surveyed
 // regions to exercise the dedicated fast path, without adding any biology.
 if(!region.soilWater)initializeSoilWater(region);
}
const source=snapshot(sim);
assert.equal(source.regionalWorlds.length,3,'three real surveyed neighboring worlds');
for(const entry of source.regionalWorlds)
  assert.equal(completeWorldForDirectRestore({schema:source.schema,world:entry.world}),true,'complete surveyed region eligible');

const originalGenerate=World.prototype.generate;
let restored;
try{
 World.prototype.generate=function(){throw Error('Redundant generated regional world during complete restore');};
 restored=restoreSimulationSnapshot(structuredClone(source));
}finally{World.prototype.generate=originalGenerate}
const regenerated=restoreSimulationSnapshot(structuredClone(source),{regenerateWorld:true});
assert.ok(isDeepStrictEqual(snapshot(restored),source),'all physically surveyed worlds are saved exactly');
assert.ok(isDeepStrictEqual(snapshot(restored),snapshot(regenerated)),'fast and generated multi-region restores are identical');
for(let tick=0;tick<12;tick++){restored.update(null);regenerated.update(null)}
assert.ok(isDeepStrictEqual(snapshot(restored),snapshot(regenerated)),'replay of real fauna and environment remains identical');

const region=restored.planetaryRegions.neighbor(origin,'east');
const cell=region.idx(20,30),before=source.regionalWorlds.find(r=>r.origin.x===128).world.plants.bramble[cell];
region.plants.bramble[cell]=.42;
assert.equal(source.regionalWorlds.find(r=>r.origin.x===128).world.plants.bramble[cell],before,
 'restored region arrays do not alias the original input');
// Older partially populated surveyed-world payloads retain the generated
// fallback instead of accepting an incomplete direct restore.
const partial=structuredClone(source);
delete partial.regionalWorlds[0].world.soilWater;
assert.equal(completeWorldForDirectRestore({schema:partial.schema,world:partial.regionalWorlds[0].world}),false);
console.log('Direct surveyed-region restore PASS: three persisted neighbors, no redundant generation, exact saved state, replay parity, isolated stocks and incomplete fallback');
