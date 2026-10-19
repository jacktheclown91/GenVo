import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {World,worldForRestore,WORLD_RESTORE_CACHE,restorationWorldCacheStats} from '../src/world/world.js';
import {CFG} from '../src/sim/config.js';
import {AQUATIC_REVIEW} from '../src/ecology/freshwater-food.js';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const same=(a,b,label)=>assert.ok(isDeepStrictEqual(a,b),label);
for(const generator of ['freshwater/1','coastal/1','planetary/1']){
 const opts={generator,...(generator==='planetary/1'?{planetOrigin:{x:0,y:2560}}:{})};
 const fresh=new World('RESTORE-BASE',opts),first=worldForRestore('RESTORE-BASE',opts),second=worldForRestore('RESTORE-BASE',opts);
 same(first,fresh,generator+' first construction');same(second,fresh,generator+' generated clone');
 assert.deepEqual(Object.keys(second),Object.keys(fresh),'own-key ordering retained');
 assert.equal(second.pages.world,second);assert.equal(second.bramble,second.plants.bramble);
 assert.notEqual(first.moisture.buffer,second.moisture.buffer);assert.notEqual(first.plantResources.water.buffer,second.plantResources.water.buffer);
 first.moisture[10]=.123;first.sunmoss[10]=.456;
 same(worldForRestore('RESTORE-BASE',opts),fresh,'published worlds cannot mutate the cached base');
 assert.equal(second.pages.get(0,0).read('plants.sunmoss',10,0),second.sunmoss[10]);
}
const aquatic=AQUATIC_REVIEW.founding;
try{AQUATIC_REVIEW.founding=!aquatic;same(worldForRestore('RESTORE-BASE',{}),new World('RESTORE-BASE'),'generation policy change invalidates cached food founding')}finally{AQUATIC_REVIEW.founding=aquatic}
const size=CFG.worldSize;try{CFG.worldSize=64;same(worldForRestore('RESTORE-BASE',{}),new World('RESTORE-BASE'),'world extent invalidates base')}finally{CFG.worldSize=size}
for(let i=0;i<6;i++)worldForRestore('RESTORE-EVICT-'+i);
assert.ok(restorationWorldCacheStats().entries<=restorationWorldCacheStats().limit,'bounded template retention');
assert.throws(()=>worldForRestore('RESTORE-BASE',{generator:'planetary/1',planetOrigin:null}));
assert.throws(()=>worldForRestore('RESTORE-BASE',{generator:NaN}));
assert.throws(()=>worldForRestore('RESTORE-BASE',{planetOrigin:{x:128,y:0}}));
const frozen=fs.readFileSync(new URL('../docs/performance/save-manager-before-generated-base-cache.txt',import.meta.url),'utf8');
assert.equal(createHash('sha256').update(frozen).digest('hex'),'4e828256204ab0f1938ce913b1eb7083b8df6e8e02b5ffeb61087beebab40063');
const rebased=frozen.replace(/from '([^']+)'/g,(_,s)=>'from '+JSON.stringify(new URL(s,new URL('../src/persistence/save-manager.js',import.meta.url)).href));
const prior=await import('data:text/javascript;base64,'+Buffer.from(rebased).toString('base64'));
const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'restore-base-parity'}));
for(const generator of ['freshwater/1','coastal/1','planetary/1']){
 const sim=new Simulation('RESTORE-FULL-'+generator,{player:false,worldGenerator:generator});for(let n=0;n<50;n++)sim.update(null);
 const saved=snap(sim),left=prior.restoreSimulationSnapshot(structuredClone(saved)),right=restoreSimulationSnapshot(structuredClone(saved));
 same(snap(left),snap(right),'complete restore '+generator);
 const day=left.day;while(left.day===day){left.update(null);right.update(null)}
 same(snap(left),snap(right),'full-day continuation '+generator);
 const historical=structuredClone(saved);historical.schema=9;delete historical.world.freshwaterFood;delete historical.world.plantResources;delete historical.world.organicResources;
 same(snap(prior.restoreSimulationSnapshot(structuredClone(historical))),snap(restoreSimulationSnapshot(structuredClone(historical))),'historical missing-field defaults '+generator);
}
WORLD_RESTORE_CACHE.enabled=false;try{same(worldForRestore('RESTORE-DISABLED'),new World('RESTORE-DISABLED'),'cache disabled fallback')}finally{WORLD_RESTORE_CACHE.enabled=true}
console.log('Fresh/coastal/planet bases, mutable-array isolation, page ownership, policy/size invalidation, bounded eviction, frozen restore parity, historical defaults and full-day continuation PASS');
