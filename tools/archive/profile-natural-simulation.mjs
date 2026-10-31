// Natural simulation diagnostic: no renderer, unchanged simulation inputs and phase ordering.
// node tools/profile-natural-simulation.mjs [seed] [days] [output]
import fs from 'node:fs';
import inspector from 'node:inspector';
import assert from 'node:assert/strict';
import {pruneUnusedFloraGenomes} from '../../src/ecology/flora-genome-lifetime.js';
import {Simulation} from '../../src/sim/simulation.js';
const [seed='GENVO8-WILD-RUN',days='120',output='docs/timeout-investigation/profile.json']=process.argv.slice(2);
const comparisons=[];
let oldPrune;
if(process.env.COMPARE_PRUNING==='1'){
  const before=fs.readFileSync(new URL('../../docs/timeout-investigation/flora-genome-lifetime-before.txt',import.meta.url),'utf8').replace("'./flora-genotype.js'",JSON.stringify(new URL('../../src/ecology/flora-genotype.js',import.meta.url).href));
  oldPrune=(await import('data:text/javascript;base64,'+Buffer.from(before).toString('base64'))).pruneUnusedFloraGenomes;
}
function compare(d,day){
  if(!oldPrune)return;
  const state={floraState:d.floraState,bankGenomes:d.bankGenomes,producerOrigins:d.producerOrigins,events:d.events,botanical:d.botanical,sim:{animals:d.sim.animals.map(a=>({pollenCargo:a.pollenCargo,lastPlantMeal:a.lastPlantMeal,seedCargo:a.seedCargo}))}};
  const a=structuredClone(state),b=structuredClone(state);
  // Exercise deletion as well as retention on each real-world snapshot.
  for(const x of [a,b]){x.floraState.genomes.set('diagnostic-unused',{id:'diagnostic-unused'});for(const cells of Object.values(x.floraState.seeds)){const rows=cells.values().next().value;if(rows)rows.set('diagnostic-zero',{amount:0})}}
  const t0=performance.now(),ra=oldPrune(a),t1=performance.now(),rb=pruneUnusedFloraGenomes(b),t2=performance.now();
  assert.deepEqual(rb,ra);assert.deepEqual(b,a,'pruning preserves all records and exact retained genotype definitions');comparisons.push({day,oldMs:t1-t0,newMs:t2-t1,retained:rb.retained});
}
const session=new inspector.Session();session.connect();
const post=(method,params={})=>new Promise((resolve,reject)=>session.post(method,params,(err,r)=>err?reject(err):resolve(r)));
await post('Profiler.enable');await post('Profiler.setSamplingInterval',{interval:1000});await post('Profiler.start');
const sim=new Simulation(seed,{player:false}),rows=[],start=performance.now();let block=start;
while(sim.day<=Number(days)){const day=sim.day;sim.update(null);if(sim.day!==day&&(day%20===0||day===Number(days))){const now=performance.now();const row={day:sim.day,seconds:(now-start)/1000,blockSeconds:(now-block)/1000,alive:sim.animals.filter(a=>a.alive).length,genomes:sim.dispersal.floraState.genomes.size};rows.push(row);console.log(JSON.stringify(row));compare(sim.dispersal,sim.day);block=performance.now()}}
const {profile}=await post('Profiler.stop');session.disconnect();
const times=new Map();for(let i=0;i<(profile.samples||[]).length;i++)times.set(profile.samples[i],(times.get(profile.samples[i])||0)+(profile.timeDeltas[i]||0));
const hot=profile.nodes.map(n=>({fn:n.callFrame.functionName,file:n.callFrame.url,line:n.callFrame.lineNumber+1,ms:(times.get(n.id)||0)/1000})).sort((a,b)=>b.ms-a.ms).slice(0,40);
fs.writeFileSync(output,JSON.stringify({seed,days:Number(days),seconds:(performance.now()-start)/1000,rows,hot,comparisons},null,2));console.log(JSON.stringify(hot.slice(0,12)));