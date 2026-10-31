// Mature-world tick profile (performance pass, October 30). Restores the bundled
// day-100 valley, runs ordinary simulation updates and reports throughput, the
// slowest ticks and a CPU profile summarised by self time per function and file.
// Observation only. Usage: node tools/profile-mature-ticks.mjs [TICKS] [OUTPUT.json]
import fs from 'node:fs';
import zlib from 'node:zlib';
import inspector from 'node:inspector';
import {openScenarioSnapshot} from '../../src/persistence/scenario-library.js';
import {restoreSimulationSnapshot} from '../../src/persistence/save-manager.js';
const ticks=Number(process.argv[2]||240),out=process.argv[3];
const bundle=JSON.parse(zlib.gunzipSync(fs.readFileSync(new URL('../../assets/scenarios/mature-valley-d100.json.gz',import.meta.url))).toString('utf8'));
const sim=restoreSimulationSnapshot(openScenarioSnapshot(bundle));
for(let k=0;k<16;k++)sim.update(null);// warm up
const session=new inspector.Session();session.connect();
const post=(m,p)=>new Promise((res,rej)=>session.post(m,p,(e,r)=>e?rej(e):res(r)));
await post('Profiler.enable');await post('Profiler.setSamplingInterval',{interval:200});await post('Profiler.start');
const times=[];const t0=performance.now();
for(let k=0;k<ticks;k++){const s=performance.now();sim.update(null);times.push(performance.now()-s)}
const elapsed=performance.now()-t0;const {profile}=await post('Profiler.stop');
const self=new Map(),files=new Map(),total=profile.samples.length;const byId=new Map(profile.nodes.map(n=>[n.id,n]));const counts=new Map();
for(const id of profile.samples)counts.set(id,(counts.get(id)||0)+1);
for(const [id,c] of counts){const n=byId.get(id),f=n.callFrame,file=f.url.replace(/^.*\/src\//,'src/'),key=(f.functionName||'(anon)')+' '+file+':'+(f.lineNumber+1);self.set(key,(self.get(key)||0)+c);files.set(file||'(native)',(files.get(file||'(native)')||0)+c)}
const top=(m,n)=>[...m].sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k,v])=>[k,+(100*v/total).toFixed(1)]);
times.sort((a,b)=>a-b);const q=p=>+times[Math.floor(p*(times.length-1))].toFixed(1);
const result={ticks,ticksPerSecond:+(ticks/(elapsed/1000)).toFixed(2),tickMs:{p50:q(.5),p90:q(.9),p99:q(.99),worst:q(1)},animals:sim.animals.filter(a=>a.alive).length,day:sim.day,topFunctions:top(self,30),topFiles:top(files,15)};
console.log(JSON.stringify({ticksPerSecond:result.ticksPerSecond,tickMs:result.tickMs,animals:result.animals,day:result.day}));
for(const [k,v] of result.topFunctions)console.log(String(v).padStart(5),'%',k.slice(0,140));
console.log('-- by file');for(const [k,v] of result.topFiles)console.log(String(v).padStart(5),'%',k);
if(out)fs.writeFileSync(out,JSON.stringify(result,null,1));
