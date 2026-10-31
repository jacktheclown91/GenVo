// Life-history candidates on identical unstaged worlds (one variant per process):
//   off | recovery (condition-dependent recovery) | gate (funding-based gate) | both.
// Records births, recruits reaching maturity, adult deaths by cause, end populations, integrity.
// Usage: node tools/compare-life-history.mjs <seed> [days=540] [out.json]
import fs from 'node:fs';import {spawn} from 'node:child_process';import {fileURLToPath} from 'node:url';
const args=process.argv.slice(2);
if(args[0]==='--variant'){
  const [,variant,seed,daysArg]=args,days=Number(daysArg);
  const {LIFE_HISTORY}=await import('../../src/ecology/breeding-calibration.js');LIFE_HISTORY.conditionRecovery=variant==='recovery'||variant==='both';LIFE_HISTORY.fundedGate=variant==='gate'||variant==='both';
  const {Simulation}=await import('../../src/sim/simulation.js');const {SPECIES}=await import('../../src/organisms/species.js');const {checkEcologicalIntegrity}=await import('../ecological-integrity.mjs');
  const sim=new Simulation(seed,{player:false}),initial=sim.animals.filter(a=>a.alive).length,start={};for(const a of sim.animals)start[a.species]=(start[a.species]||0)+1;let checks=0;const born=new Map();const r={births:{},recruits:{},deaths:{},end:{}};const inc=(o,k,n=1)=>o[k]=(o[k]||0)+n;
  const sb=sim.spawnFundedOffspring.bind(sim);sim.spawnFundedOffspring=(m,...x)=>{const kids=sb(m,...x);for(const k of kids)born.set(k.id,k);if(kids.length)inc(r.births,m.species,kids.length);return kids};
  const kl=sim.kill.bind(sim);sim.kill=(a,c)=>{if(a.alive)inc(r.deaths,a.species+':'+c);return kl(a,c)};
  for(let d=0;d<days;d++){const d0=sim.day;while(sim.day===d0)sim.update(null);if(sim.day%8===0){checkEcologicalIntegrity(sim,initial);checks++}}
  for(const k of born.values())if(k.age>=SPECIES[k.species].maturity)inc(r.recruits,k.species);for(const a of sim.animals)if(a.alive)inc(r.end,a.species);
  console.log('RESULT '+JSON.stringify({variant,start,...r,integrityChecks:checks}));
}else{
  const seed=args[0]||'LH-A',days=Number(args[1]||540),out=args[2],self=fileURLToPath(import.meta.url);
  const results=await Promise.all(['off','recovery','gate','both'].map(v=>new Promise((res,rej)=>{const c=spawn(process.execPath,[self,'--variant',v,seed,String(days)],{stdio:['ignore','pipe','inherit']});let o='';c.stdout.on('data',d=>o+=d);c.on('exit',code=>{const line=o.split('\n').find(l=>l.startsWith('RESULT '));code===0&&line?res(JSON.parse(line.slice(7))):rej(Error(v+' failed'))})})));
  if(out)fs.writeFileSync(out,JSON.stringify({seed,days,...Object.fromEntries(results.map(r=>[r.variant,r]))},null,1));
  for(const r of results)console.log(seed,r.variant.padEnd(8),'births',JSON.stringify(r.births),'| end',JSON.stringify(r.end),'| checks',r.integrityChecks);
}
