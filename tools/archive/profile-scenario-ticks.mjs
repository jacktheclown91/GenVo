// Bounded diagnostic on an immutable real scenario. No population/resource/
// scheduling intervention. Restore and final snapshot encoding are not timed
// as biology. The optional V8 snapshot supports exact before/after replay.
import fs from 'node:fs';import zlib from 'node:zlib';import inspector from 'node:inspector';import {createHash} from 'node:crypto';import {serialize} from 'node:v8';
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {openScenarioSnapshot} from '../../src/persistence/scenario-library.js';
import {restoreSimulationSnapshot,createSimulationSnapshot} from '../../src/persistence/save-manager.js';
const [input,out,stepsArg='48',snapshotOut]=process.argv.slice(2),steps=Number(stepsArg);
if(!input||!out||!Number.isSafeInteger(steps)||steps<1||steps>96)throw Error('Use input.gz output.json 1..96 [snapshot.v8]');
if(fs.existsSync(out)||snapshotOut&&fs.existsSync(snapshotOut))throw Error('Preserve existing profiling receipts; choose unused output paths.');
const sourceRoot=fileURLToPath(new URL('../../src/',import.meta.url)),fingerprint=createHash('sha256');
function visit(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const file=path.join(dir,e.name);if(e.isDirectory())visit(file);else{fingerprint.update(path.relative(sourceRoot,file).replaceAll('\\','/'));fingerprint.update(fs.readFileSync(file))}}}visit(sourceRoot);
const sourceFingerprint=fingerprint.digest('hex');
const bytes=fs.readFileSync(input),snapshot=openScenarioSnapshot(JSON.parse(zlib.gunzipSync(bytes))),startRestore=performance.now(),sim=restoreSimulationSnapshot(snapshot),restoreMs=performance.now()-startRestore;
const phases={};for(const name of ['phaseClimate','phaseSoil','phaseVegetation','phasePerception','phaseDecision','phaseMovement','phaseMetabolism','phaseLifecycle','advanceDay']){const f=sim[name];if(!f)continue;sim[name]=function(...args){const start=performance.now();try{return f.apply(this,args)}finally{const ms=performance.now()-start,row=phases[name]??={calls:0,totalMs:0,maxMs:0};row.calls++;row.totalMs+=ms;row.maxMs=Math.max(row.maxMs,ms)}}}
const session=new inspector.Session();session.connect();const post=(m,p={})=>new Promise((r,j)=>session.post(m,p,(e,v)=>e?j(e):r(v)));
await post('Profiler.enable');await post('Profiler.setSamplingInterval',{interval:500});await post('Profiler.start');
const startTick=sim.tickCount,startDay=sim.day,times=[];
for(let k=0;k<steps;k++){const t=performance.now();sim.update(null);times.push(performance.now()-t)}
const {profile}=await post('Profiler.stop');session.disconnect();
const sampled=new Map();for(let k=0;k<(profile.samples||[]).length;k++){const id=profile.samples[k];sampled.set(id,(sampled.get(id)||0)+(profile.timeDeltas[k]||0))}
const hot=profile.nodes.map(n=>({fn:n.callFrame.functionName,file:n.callFrame.url,line:n.callFrame.lineNumber+1,selfMs:(sampled.get(n.id)||0)/1000})).sort((a,b)=>b.selfMs-a.selfMs).slice(0,35);
const sorted=[...times].sort((a,b)=>a-b),report={input,inputSha256:createHash('sha256').update(bytes).digest('hex'),sourceFingerprint,node:process.version,steps,startTick,endTick:sim.tickCount,startDay,endDay:sim.day,live:sim.animals.filter(a=>a.alive).length,restoreMs,totalMs:times.reduce((a,b)=>a+b,0),medianMs:sorted[Math.floor(steps*.5)],p95Ms:sorted[Math.floor(steps*.95)],maxMs:sorted.at(-1),phases,hot,times,scope:'Bounded canonical real-scenario ticks, inspector sampling; no body/resource/population/policy interventions. Node CPU timing is not Chromium frame acceptance.'};
fs.writeFileSync(out,JSON.stringify(report,null,2));if(snapshotOut)fs.writeFileSync(snapshotOut,serialize(createSimulationSnapshot(sim,{savedAt:'fixed'})));
console.log(JSON.stringify({...report,times:undefined,hot:hot.slice(0,15)},null,2));
