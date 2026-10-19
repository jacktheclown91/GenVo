#!/usr/bin/env node
// Reproducible young-world restore measurement, NOT mature planetary acceptance.
// Alternate warm-cache generated/direct world hydration with identical snapshot
// inputs; exclude input cloning, use the full canonical restore in both arms.
import {performance} from 'node:perf_hooks';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const result=[];
for(const [seed,generator] of [['RESTORE-MEASURE-FRESH','freshwater/1'],['PLANET-B0-A','planetary/1']]){
  const world=new Simulation(seed,{player:true,worldGenerator:generator});
  for(let i=0;i<CFG.dayTicks+6;i++)world.update(null);
  const source=structuredClone(createSimulationSnapshot(world,{reason:'restore-benchmark',savedAt:'fixed'}));
  const runs={generated:[],direct:[]};
  // Warm both modes and the generated-base cache before timing.
  for(const mode of ['generated','direct'])
    restoreSimulationSnapshot(structuredClone(source),{regenerateWorld:mode==='generated'});
  for(const mode of ['generated','direct','direct','generated','direct','generated','generated','direct']){
    const copy=structuredClone(source);
    const start=performance.now();
    const restored=restoreSimulationSnapshot(copy,{regenerateWorld:mode==='generated'});
    runs[mode].push(performance.now()-start);
    if(restored.tickCount!==world.tickCount||restored.animals.length!==world.animals.length)
      throw Error('Restore benchmark observed mismatching world identity.');
  }
  const mean=v=>Math.round(v.reduce((a,b)=>a+b,0)/v.length*100)/100;
  result.push({generator,day:world.day,animals:world.animals.length,
    meanMs:{generated:mean(runs.generated),direct:mean(runs.direct)},
    samplesMs:Object.fromEntries(Object.entries(runs).map(([k,v])=>[k,v.map(x=>Math.round(x*100)/100)])),
    note:'Node runner, small young-world snapshot, warm restore; no claim for mature 100-day regions, browser frames or resident memory'});
}
console.log(JSON.stringify({scope:'Young-world warm-restore A/B measurement; parity independently verified by tests/world-restore-generation-parity.mjs',result},null,2));
