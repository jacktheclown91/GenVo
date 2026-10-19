// Exact mature-save comparison; no live cohort, quantity, ancestry or schema changes.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {deserialize} from 'node:v8';
import {isDeepStrictEqual} from 'node:util';
import {createHash} from 'node:crypto';
import {packFloraSeedBanks,unpackFloraSeedBanks} from '../src/persistence/flora-seed-codec.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const input=process.argv[2],output=process.argv[3],stateOnly=process.argv.includes('--state-only'),sameDecoder=process.argv.includes('--same-decoder');assert.ok(input&&output,'Supply snapshot.bin and a fresh receipt path');assert.ok(!fs.existsSync(output),'Never overwrite earlier measurements');
const hash=b=>createHash('sha256').update(b).digest('hex'),data=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const frozen=fs.readFileSync(new URL('../docs/performance/flora-seed-codec-before-metadata-fastpath.txt',import.meta.url),'utf8');
assert.equal(hash(frozen),'888a8fc4b97c4418021d01159e47e2cafc14af09300815d4aab37afc89713419');
const oldUrl=data(frozen),before=await import(oldUrl),bytes=fs.readFileSync(input),snapshot=deserialize(bytes),table=snapshot.controllers.dispersal.floraState.seeds;
let rows=stateOnly?null:before.unpackFloraSeedBanks(table);const results=[];
for(const mode of stateOnly?[]:['before','after','after','before']){
 if(global.gc)global.gc();let t=performance.now();let packed=(mode==='before'?before.packFloraSeedBanks:packFloraSeedBanks)(rows);const encodeMs=performance.now()-t;
 assert.deepEqual(packed,table,'The complete historical save table must be unchanged');packed=null;if(global.gc)global.gc();
 t=performance.now();let decoded=(mode==='before'?before.unpackFloraSeedBanks:unpackFloraSeedBanks)(table);const decodeMs=performance.now()-t;
 assert.deepEqual(decoded,rows,'Every cohort and metadata field must decode identically');if(global.gc)global.gc();const decodedHeap=process.memoryUsage().heapUsed;
 results.push({mode,encodeMs,decodeMs,decodedHeap});console.log('CODEC '+JSON.stringify(results.at(-1)));decoded=null;
}
rows=null;if(global.gc)global.gc();
// Load the same save-manager source against the frozen decoder for a genuine
// old/new restored-world comparison, with all other live authorities shared.
const managerUrl=new URL('../src/persistence/save-manager.js',import.meta.url);
const manager=fs.readFileSync(managerUrl,'utf8').replace(/from '([^']+)'/g,(_,s)=>'from '+JSON.stringify(s==='./flora-seed-codec.js'?oldUrl:new URL(s,managerUrl).href));
console.log('RESTORE_STAGE import reference manager');
const legacy=await import(data(manager));
console.log('RESTORE_STAGE reference restore');
let t=performance.now();const left=(sameDecoder?restoreSimulationSnapshot:legacy.restoreSimulationSnapshot)(deserialize(Buffer.from(bytes)));const beforeRestoreMs=performance.now()-t;
console.log('RESTORE_STAGE optimized restore');
t=performance.now();const right=restoreSimulationSnapshot(deserialize(Buffer.from(bytes)));const afterRestoreMs=performance.now()-t;
assert.notEqual(left.world.soilWater.groundwater.buffer,right.world.soilWater.groundwater.buffer,'Each binary transport must own its mutable arrays');
const snap=s=>createSimulationSnapshot(s,{savedAt:'fixed',reason:'mature-codec-parity'});
function checkSame(a,b,label){
 if(isDeepStrictEqual(a,b))return;
 let where='',x=a,y=b;
 for(let depth=0;depth<5&&x&&y&&typeof x==='object'&&typeof y==='object';depth++){
  const keys=[...new Set([...Object.keys(x),...Object.keys(y)])];
  const key=keys.find(k=>!isDeepStrictEqual(x[k],y[k]));if(key===undefined)break;
  where+=(where?'.':'')+key;x=x[key];y=y[key];
 }
 const brief=v=>v===null?'null':typeof v==='object'?v.constructor?.name:typeof v==='string'?v.slice(0,120):String(v);
 fs.writeFileSync(output,JSON.stringify({status:'mismatch',sameDecoder,stage:label,path:where,before:brief(x),after:brief(y),input:path.resolve(input)},null,2));
 throw Error(label+' differs at '+where+' ('+brief(x)+' versus '+brief(y)+')');
}
console.log('RESTORE_STAGE exact initial state comparison');
checkSame(snap(left),snap(right),'Complete restored worlds');
console.log('RESTORE_STAGE advance one real day');
const day=left.day;while(left.day===day){left.update(null);right.update(null)}
console.log('RESTORE_STAGE compare continued state');
checkSame(snap(left),snap(right),'One-day continuation');
const mean=(mode,key)=>{const a=results.filter(r=>r.mode===mode);return a.reduce((s,r)=>s+r[key],0)/a.length};
const receipt={independentBinaryTransports:true,sameDecoder,stateOnly,schema:'genvo.seed-codec-mature-benchmark/1',input:path.resolve(input),inputBytes:bytes.length,inputSha256:hash(bytes),artifactHashScope:'V8 artifact identity only',calendarDay:snapshot.core.day,cohorts:Object.values(table.kinds).reduce((n,t)=>n+t.amounts.length,0),beforeCodecSha256:hash(frozen),afterCodecSha256:hash(fs.readFileSync(new URL('../src/persistence/flora-seed-codec.js',import.meta.url))),gcBeforeTiming:!!global.gc,results,beforeEncodeMeanMs:mean('before','encodeMs'),afterEncodeMeanMs:mean('after','encodeMs'),beforeDecodeMeanMs:mean('before','decodeMs'),afterDecodeMeanMs:mean('after','decodeMs'),beforeRestoreMs,afterRestoreMs,exactPackedTable:true,exactDecodedRows:true,exactFullRestoredState:true,exactFullDayContinuation:true,finalCalendarDay:left.day,scope:'Alternated in-process codec diagnostic and one before/after complete restore using independent byte buffers; browser save time and live cohort memory are separate'};
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt,null,2));
