#!/usr/bin/env node
// Diagnostic probe (not a test: it asserts nothing). Replaces tests/probe-kills.mjs and
// tests/probe-recovery.mjs, which each simulated GENVO8-TEST-C for 640 days separately.
// One run records both:
//   recovery  per-species condition samples (every 32 days, every 8 days after day 560), births, deaths by cause
//   kills     the first 81 rootling/GenVo kills after day 380, with population and local prey context
// Instrumentation only reads; the world is unchanged.
// Usage: node tools/probe-natural-world.mjs [seed] [days] [out.json]
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {Simulation} from '../../src/sim/simulation.js';
import {SPECIES,canPreyOn} from '../../src/organisms/species.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const seed=process.argv[2]||'GENVO8-TEST-C',days=Number(process.argv[3]||640),out=process.argv[4]||path.join(root,'docs/probes',`natural-world-${seed}.json`);
const sim=new Simulation(seed,{player:false});
const deaths={},births={},kills=[],samples=[];
const origKill=sim.kill.bind(sim);sim.kill=(a,c)=>{(deaths[a.species]??={})[c]=(deaths[a.species]?.[c]||0)+1;return origKill(a,c)};
const origBirth=sim.giveBirth.bind(sim);sim.giveBirth=m=>{const kids=origBirth(m);births[m.species]=(births[m.species]||0)+kids.length;return kids};
const origTry=sim.tryKill.bind(sim);sim.tryKill=(pred,prey)=>{
  const before=prey.alive,record=before&&kills.length<=80&&sim.day>380&&(prey.species==='rootling'||prey.species==='genvo');
  let pop,locals;if(record){pop=sim.population();locals={};sim.forEachNearby(pred,26,b=>{if(b.alive&&canPreyOn(pred.species,b.species))locals[b.species]=(locals[b.species]||0)+1})}
  const r=origTry(pred,prey);
  if(record&&!prey.alive)kills.push({day:sim.day,prey:prey.species,pop,locals,predE:+(pred.energy/SPECIES[pred.species].maxEnergy).toFixed(2)});
  return r;
};
function stat(sp){const arr=sim.animals.filter(a=>a.alive&&a.species===sp),s=SPECIES[sp];const adults=arr.filter(a=>a.age>=s.maturity);const ready=adults.filter(a=>a.reproCooldown<=0&&a.energy/s.maxEnergy>(s.reproduction?.energy??.72));const avg=f=>arr.length?arr.reduce((z,a)=>z+f(a),0)/arr.length:0;return{n:arr.length,adults:adults.length,f:adults.filter(a=>a.sex==='F').length,m:adults.filter(a=>a.sex==='M').length,ready:ready.length,age:+avg(a=>a.age).toFixed(1),e:+avg(a=>a.energy/s.maxEnergy).toFixed(2),h:+avg(a=>a.hydration/s.maxHydration).toFixed(2),drive:+avg(a=>a.reproDrive||0).toFixed(2)}}
for(;sim.day<=days;sim.update(null)){if(sim.tickCount%48===0&&((sim.day-1)%32===0||sim.day>560&&(sim.day-1)%8===0))samples.push({day:sim.day,year:sim.year,root:stat('rootling'),gen:stat('genvo'),pred:stat('needlejaw'),moss:stat('mosskip')})}
const report={schema:'genvo.probe-natural-world/1',seed,days,note:'Diagnostic observation; no pass/fail.',final:sim.population(),births,deaths,samples,kills};
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,1));
console.log(JSON.stringify({seed,days,final:report.final,births,samples:samples.length,kills:kills.length,out:path.relative(root,out)}));
