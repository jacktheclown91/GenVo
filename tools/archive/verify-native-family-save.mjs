import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {serialize} from 'node:v8';
import {createHash} from 'node:crypto';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../../src/persistence/save-manager.js';
const out=process.argv[2]||'docs/player-journey/saved-family-continuation';
function decode(graph){const constructors={Uint8Array,Uint16Array,Uint32Array,Int8Array,Int16Array,Int32Array,Float32Array,Float64Array};const values=graph.nodes.map(n=>constructors[n.t]?new constructors[n.t](n.v):n.t==='Map'?new Map():n.t==='Set'?new Set():n.t==='Array'?[]:{}),d=v=>v&&typeof v==='object'?(v.u?undefined:values[v.r]):v;for(let i=0;i<values.length;i++){const n=graph.nodes[i],v=values[i];if(constructors[n.t])continue;if(n.t==='Map')for(const[k,w]of n.v)v.set(d(k),d(w));else if(n.t==='Set')for(const w of n.v)v.add(d(w));else for(const[k,w]of n.v)v[k]=d(w)}return d(graph.root)}
const checks=[];
for(const name of ['checkpoint','birth','offspring-controlled'].filter(n=>fs.existsSync(path.join(out,n+'.snapshot.json.gz')))){const file=path.join(out,name+'.snapshot.json.gz'),bytes=fs.readFileSync(file),raw=decode(JSON.parse(gunzipSync(bytes).toString())),sim=restoreSimulationSnapshot(structuredClone(raw));
 const restored=createSimulationSnapshot(sim,{savedAt:raw.savedAt,reason:raw.reason});
 // SaveManager attaches only slot metadata after the canonical snapshot is built.
 for(const key of ['key','worldName'])if(Object.hasOwn(raw.meta,key))restored.meta[key]=raw.meta[key];
 assert.deepEqual(restored,raw,'Exact native IndexedDB snapshot roundtrip: '+name);
 fs.writeFileSync(path.join(out,name+'.snapshot.bin'),serialize(raw));
 sim.paused=false;const start=sim.tickCount;for(let i=0;i<6;i++)sim.update(null);assert.equal(sim.tickCount,start+6,'Resume must advance real updates');
 const snap=s=>createSimulationSnapshot(s,{savedAt:'fixed',reason:'native-family-resume'}),mid=snap(sim),resumed=restoreSimulationSnapshot(structuredClone(mid));for(let i=0;i<6;i++){sim.update(null);resumed.update(null)}assert.equal(sim.tickCount,start+12);assert.deepEqual(snap(resumed),snap(sim),'Actual lineage uninterrupted versus restored intermediate save');
 const p=raw.animals.find(a=>a.id===raw.core.playerId);checks.push({name,sha256:createHash('sha256').update(bytes).digest('hex'),worldSlot:raw.meta.key,seed:raw.seed,day:raw.core.day,tick:raw.core.tickCount,playerId:raw.core.playerId,age:p.age,parentIds:p.parentIds,bodyId:p.bodyPlan.id,exactRawRoundtrip:true,realUpdates:12,intermediateSaveAfterUpdates:6,completeStateEqual:true});
}
assert.ok(checks.length,'At least one real native archive is required');
fs.writeFileSync(path.join(out,'save-verification.json'),JSON.stringify({scope:'Actual native UI save archives; raw complete state roundtrip, then normal unpause and12 real ecology updates with intermediate restore at6. No biology edits. Not a live browser frame/input performance or completed juvenile development trial.',status:'PASS',checks},null,2));console.log(JSON.stringify({status:'PASS',checks}));
