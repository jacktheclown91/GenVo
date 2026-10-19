// Complete modern saves can allocate the World without regenerating and
// immediately discarding identical biome/base arrays. Verify canonical replay.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {Simulation} from '../src/sim/simulation.js';
import {World} from '../src/world/world.js';
import {CFG} from '../src/sim/config.js';
import {createSimulationSnapshot,restoreSimulationSnapshot,completeWorldForDirectRestore} from '../src/persistence/save-manager.js';

const save=sim=>structuredClone(createSimulationSnapshot(sim,{reason:'restore-parity',savedAt:'fixed'}));
for(const [seed,worldGenerator] of [['RESTORE-FAST-FRESH','freshwater/1'],['PLANET-B0-A','planetary/1']]){
  const original=new Simulation(seed,{player:true,worldGenerator});
  for(let i=0;i<CFG.dayTicks+6;i++)original.update(null);
  const checkpoint=save(original);
  assert.equal(completeWorldForDirectRestore(checkpoint),true,'complete current snapshot is eligible');
  // In this mode no world generation is allowed; tests must observe a real
  // generator bypass rather than merely matching the older output.
  const generate=World.prototype.generate;
  let fast;
  try{
    World.prototype.generate=function(){throw Error('Unnecessary world generation in direct restore');};
    fast=restoreSimulationSnapshot(structuredClone(checkpoint));
  }finally{World.prototype.generate=generate}
  const reference=restoreSimulationSnapshot(structuredClone(checkpoint),{regenerateWorld:true});
  assert.ok(isDeepStrictEqual(save(fast),save(reference)),'direct and generated restored states must be byte-structure identical');
  for(let i=0;i<12;i++){fast.update(null);reference.update(null)}
  assert.ok(isDeepStrictEqual(save(fast),save(reference)),'both restored worlds must advance identically using actual ecology');
  assert.ok(isDeepStrictEqual(checkpoint,save(restoreSimulationSnapshot(structuredClone(checkpoint)))),'roundtrip preserves original complete checkpoint');
}
// Incomplete/historical records may have migration needs. They must not
// activate the allocation-only path, even when a few modern fields are present.
const partial=save(new Simulation('RESTORE-LEGACY-FALLBACK',{player:true}));
delete partial.world.soilWater;
assert.equal(completeWorldForDirectRestore(partial),false,'incomplete world falls back to classic generator');
const historical=save(new Simulation('RESTORE-OLD-FALLBACK',{player:true}));
historical.schema=9;
assert.equal(completeWorldForDirectRestore(historical),false,'historical schema gets legacy generator');
console.log('complete world allocation-only restore parity, canonical continuation and old-save fallback PASS');
