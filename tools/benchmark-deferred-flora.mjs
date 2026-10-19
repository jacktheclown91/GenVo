import fs from 'node:fs';
import assert from 'node:assert/strict';
import {deserialize} from 'node:v8';
import {isDeepStrictEqual} from 'node:util';
import {createHash} from 'node:crypto';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const [input,out]=process.argv.slice(2);assert.ok(input&&out&&!fs.existsSync(out));
const source=fs.readFileSync(new URL('../docs/performance/save-manager-before-deferred-flora.txt',import.meta.url),'utf8');
assert.equal(createHash('sha256').update(source).digest('hex'),'05e1d59993d90447d5208d1920608dde3b3c19724fe88be54190d784c07c0a12');
const base=new URL('../src/persistence/save-manager.js',import.meta.url);
const old=await import('data:text/javascript;base64,'+Buffer.from(source.replace(/from '([^']+)'/g,(_,s)=>'from '+JSON.stringify(new URL(s,base).href))+'\n//# sourceURL=deferred-flora-benchmark-reference.js').toString('base64'));
const bytes=fs.readFileSync(input),snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'deferred-flora-benchmark'}));
const reference=old.restoreSimulationSnapshot(deserialize(Buffer.from(bytes))),expected=snap(reference);
const rows=[];for(const kind of ['before','after','after','before']){
 global.gc?.();const payload=deserialize(Buffer.from(bytes)),at=performance.now();
 const sim=(kind==='before'?old.restoreSimulationSnapshot:restoreSimulationSnapshot)(payload),ms=performance.now()-at;
 assert.ok(isDeepStrictEqual(snap(sim),expected),'entire checkpoint state differs '+kind);rows.push({kind,ms});console.log(JSON.stringify(rows.at(-1)));
}
const next=restoreSimulationSnapshot(deserialize(Buffer.from(bytes))),day=reference.day;
while(reference.day===day){reference.update(null);next.update(null)}
assert.ok(isDeepStrictEqual(snap(reference),snap(next)),'entire next day differs including regional work');
const mean=kind=>{const a=rows.filter(r=>r.kind===kind);return a.reduce((n,r)=>n+r.ms,0)/a.length};
const receipt={input,bytes:bytes.length,inputSha256:createHash('sha256').update(bytes).digest('hex'),scope:'One existing checkpoint, before/after/after/before warm-process restore comparison; independent transport copies; not browser timing or general scalability',rows,beforeMeanMs:mean('before'),afterMeanMs:mean('after'),exactCheckpointParity:true,exactNextDayParity:true};
fs.writeFileSync(out,JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt,null,2));
