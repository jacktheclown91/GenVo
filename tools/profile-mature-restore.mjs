// Isolated restore CPU attribution; does not advance biology or modify the checkpoint.
import fs from 'node:fs';import assert from 'node:assert/strict';import inspector from 'node:inspector';
import {deserialize} from 'node:v8';import {createHash} from 'node:crypto';
import {restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const [input,out,profileFile]=process.argv.slice(2);assert.ok(input&&out&&profileFile&&!fs.existsSync(out)&&!fs.existsSync(profileFile));
const bytes=fs.readFileSync(input),saved=deserialize(Buffer.from(bytes));global.gc?.();
const before=process.memoryUsage(),session=new inspector.Session();session.connect();
const post=(method,params={})=>new Promise((resolve,reject)=>session.post(method,params,(e,r)=>e?reject(e):resolve(r)));
await post('Profiler.enable');await post('Profiler.setSamplingInterval',{interval:1000});await post('Profiler.start');
const start=performance.now(),sim=restoreSimulationSnapshot(saved),restoreMs=performance.now()-start;
const {profile}=await post('Profiler.stop');session.disconnect();const after=process.memoryUsage();
const nodes=new Map(profile.nodes.map(n=>[n.id,n])),parents=new Map();for(const n of profile.nodes)for(const child of n.children||[])parents.set(child,n.id);
const key=n=>JSON.stringify({function:n.callFrame.functionName||'(anonymous)',url:n.callFrame.url,line:n.callFrame.lineNumber+1});
const self=new Map(),inclusive=new Map();let sampledUs=0;
for(let i=0;i<(profile.samples||[]).length;i++){
 const id=profile.samples[i],us=profile.timeDeltas[i]||0,n=nodes.get(id);sampledUs+=us;if(!n)continue;
 const k=key(n);self.set(k,(self.get(k)||0)+us);const seen=new Set();
 for(let p=id;p!==undefined;p=parents.get(p)){const node=nodes.get(p);if(!node)break;const k=key(node);if(!seen.has(k)){inclusive.set(k,(inclusive.get(k)||0)+us);seen.add(k)}}
}
const rank=m=>[...m].map(([k,us])=>({...JSON.parse(k),ms:us/1000})).sort((a,b)=>b.ms-a.ms).slice(0,30);
fs.writeFileSync(profileFile+'.pending',JSON.stringify(profile),{flag:'wx'});fs.renameSync(profileFile+'.pending',profileFile);
const report={scope:'Single isolated canonical restore with inspector CPU sampling, input decoding outside capture, initially cold generated-base cache. No simulation ticks, variant removal, coefficient changes, comparative speedup or browser acceptance. Inclusive rows overlap; repeated function frames counted once per sample.',input,inputBytes:bytes.length,inputSha256:createHash('sha256').update(bytes).digest('hex'),profileFile,restoreMs,sampledMs:sampledUs/1000,before,after,tick:sim.tickCount,population:sim.animals.length,self:rank(self),inclusive:rank(inclusive)};
fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify({restoreMs,sampledMs:report.sampledMs,self:report.self.slice(0,12),inclusive:report.inclusive.slice(0,10)},null,2));
