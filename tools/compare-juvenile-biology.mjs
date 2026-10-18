// Controlled before/after for Milestone A: identical unstaged worlds with juvenile biology off vs on
// (nothing else differs). Records births, juvenile deaths by cause, recruits reaching maturity,
// growth energy, developmental delays, hunter kills by prey stage, populations and integrity.
// Usage: node tools/compare-juvenile-biology.mjs <seed> [days=540] [out.json]
import fs from 'node:fs';import {spawn} from 'node:child_process';import {fileURLToPath} from 'node:url';
const args=process.argv.slice(2);
if(args[0]==='--variant'){
  const [,variant,seed,daysArg]=args,days=Number(daysArg);
  const {JUVENILE_SWITCH}=await import('../src/ecology/juvenile-biology.js');JUVENILE_SWITCH.growthCost=JUVENILE_SWITCH.preyAppraisal=variant==='juvenile';
  const {Simulation}=await import('../src/sim/simulation.js');const {SPECIES}=await import('../src/organisms/species.js');const {canHunt}=await import('../src/ecology/functional-diet.js');const {checkEcologicalIntegrity}=await import('./ecological-integrity.mjs');
  const sim=new Simulation(seed,{player:false}),initial=sim.animals.filter(a=>a.alive).length;let checks=0;const born=new Map();
  const r={births:{},juvenileDeaths:{},recruits:{},kills:{juvenile:0,adult:0},killsBySpecies:{},end:{}};const inc=(o,k,n=1)=>o[k]=(o[k]||0)+n;
  const sb=sim.spawnFundedOffspring.bind(sim);sim.spawnFundedOffspring=(m,...x)=>{const kids=sb(m,...x);for(const k of kids)born.set(k.id,k);if(kids.length)inc(r.births,m.species,kids.length);return kids};
  const kl=sim.kill.bind(sim);sim.kill=(a,c)=>{if(a.alive&&a.age<SPECIES[a.species].maturity)inc(r.juvenileDeaths,a.species+':'+c);return kl(a,c)};
  const tk=sim.tryKill.bind(sim);sim.tryKill=(p,q,...x)=>{const alive=q.alive,juv=q.age<SPECIES[q.species].maturity,res=tk(p,q,...x);if(alive&&!q.alive&&canHunt(p)){r.kills[juv?'juvenile':'adult']++;inc(r.killsBySpecies,q.species+(juv?'(j)':''))}return res};
  for(let d=0;d<days;d++){const d0=sim.day;while(sim.day===d0)sim.update(null);if(sim.day%8===0){checkEcologicalIntegrity(sim,initial);checks++}}
  for(const k of born.values())if(k.age>=SPECIES[k.species].maturity)inc(r.recruits,k.species);
  for(const a of sim.animals)if(a.alive)inc(r.end,a.species);
  console.log('RESULT '+JSON.stringify({variant,...r,growthEnergy:+(sim.stats.growthEnergy||0).toFixed(0),growthDelays:sim.stats.growthDelays||0,integrityChecks:checks}));
}else{
  const seed=args[0]||'JUV-A',days=Number(args[1]||540),out=args[2],self=fileURLToPath(import.meta.url);
  const results=await Promise.all(['before','juvenile'].map(v=>new Promise((res,rej)=>{const c=spawn(process.execPath,[self,'--variant',v,seed,String(days)],{stdio:['ignore','pipe','inherit']});let o='';c.stdout.on('data',d=>o+=d);c.on('exit',code=>{const line=o.split('\n').find(l=>l.startsWith('RESULT '));code===0&&line?res(JSON.parse(line.slice(7))):rej(Error(v+' failed'))})})));
  if(out)fs.writeFileSync(out,JSON.stringify({seed,days,...Object.fromEntries(results.map(r=>[r.variant,r]))},null,1));
  for(const r of results)console.log(seed,r.variant.padEnd(8),'births',JSON.stringify(r.births),'| juvDeaths',JSON.stringify(r.juvenileDeaths),'| recruits',JSON.stringify(r.recruits),'| kills',JSON.stringify(r.kills),'| growthE',r.growthEnergy,'delays',r.growthDelays,'| end',JSON.stringify(r.end),'| checks',r.integrityChecks);
}
