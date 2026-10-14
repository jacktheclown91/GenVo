import {performance} from 'node:perf_hooks';
import {Simulation} from '../src/sim/simulation.js';

const arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:fallback};
const steps=Math.max(120,Number(arg('--steps','1200'))||1200);
const repeats=Math.max(1,Number(arg('--repeats','2'))||2);
const seeds=String(arg('--seeds','PERF-A,PERF-B,PERF-C')).split(',').map(s=>s.trim()).filter(Boolean);
const results=[];
for(const seed of seeds){
  const runs=[];
  for(let r=0;r<repeats;r++){
    const sim=new Simulation(seed,{player:true}),t0=performance.now();
    for(let i=0;i<steps;i++)sim.update();
    runs.push({ms:performance.now()-t0,alive:sim.animals.filter(a=>a.alive).length});
  }
  results.push({seed,runs});
}
const samples=results.flatMap(x=>x.runs.map(r=>r.ms)).sort((a,b)=>a-b);
const median=samples.length%2?samples[(samples.length-1)/2]:(samples[samples.length/2-1]+samples[samples.length/2])/2;
console.log(JSON.stringify({version:(await import('../src/sim/config.js')).CFG.version,steps,repeats,seeds,medianMs:+median.toFixed(1),meanMs:+(samples.reduce((a,b)=>a+b,0)/samples.length).toFixed(1),results:results.map(x=>({seed:x.seed,runs:x.runs.map(r=>({ms:+r.ms.toFixed(1),alive:r.alive}))}))},null,2));
