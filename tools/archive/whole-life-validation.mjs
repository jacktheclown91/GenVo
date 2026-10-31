// Whole-life validation of reproduction under unstaged natural conditions (observation, not a test).
// For chosen species: do offspring reach maturity, do mothers survive the period after birth, how do
// populations respond to shortage (starvation), and does finite accounting hold (integrity checks).
// One variant per process. Usage: node tools/whole-life-validation.mjs <seed> [days=720] [out.json]
import fs from 'node:fs';import {spawn} from 'node:child_process';import {fileURLToPath} from 'node:url';
const args=process.argv.slice(2),FOCUS=['rillsifter','mirelick','podshell'];
if(args[0]==='--variant'){
  const [,variant,seed,daysArg]=args,days=Number(daysArg);
  const {BREEDING_REVIEW}=await import('../../src/ecology/breeding-calibration.js');BREEDING_REVIEW.enabled=variant==='adopted';
  const {Simulation}=await import('../../src/sim/simulation.js');const {SPECIES}=await import('../../src/organisms/species.js');const {checkEcologicalIntegrity}=await import('../ecological-integrity.mjs');
  const sim=new Simulation(seed,{player:false}),initial=sim.animals.filter(a=>a.alive).length;let checks=0;
  const born=new Map(),mothers=[],deaths={};const r=Object.fromEntries(FOCUS.map(k=>[k,{births:0,matured:0,diedJuvenile:{},juvenileAtEnd:0,motherBirths:0,motherDied60:{},motherEnergyAfter:[]}]));
  const ob=sim.spawnFundedOffspring.bind(sim);sim.spawnFundedOffspring=(m,...rest)=>{const kids=ob(m,...rest);if(r[m.species]){r[m.species].births+=kids.length;r[m.species].motherBirths++;mothers.push({a:m,day:sim.day,species:m.species});r[m.species].motherEnergyAfter.push(m.energy/SPECIES[m.species].maxEnergy);for(const k of kids)born.set(k.id,{k,species:m.species})}return kids};
  const ok=sim.kill.bind(sim);sim.kill=(a,cause)=>{if(a.alive){deaths[a.species+':'+cause]=(deaths[a.species+':'+cause]||0)+1;const b=born.get(a.id);if(b&&a.age<SPECIES[a.species].maturity){const d=r[b.species].diedJuvenile;d[cause]=(d[cause]||0)+1}for(const m of mothers)if(m.a===a&&sim.day-m.day<=60){const d=r[m.species].motherDied60;d[cause]=(d[cause]||0)+1}}return ok(a,cause)};
  const series=[];
  for(let d=0;d<=days;d++){if(d%90===0)series.push({day:d,...Object.fromEntries(FOCUS.map(k=>[k,sim.animals.filter(a=>a.alive&&a.species===k).length]))});const d0=sim.day;while(sim.day===d0)sim.update(null);if(sim.day%8===0){checkEcologicalIntegrity(sim,initial);checks++}}
  // Age stops at death, so age >= maturity means the offspring reached maturity (alive or not).
  for(const {k,species} of born.values()){if(k.age>=SPECIES[species].maturity)r[species].matured++;else if(k.alive)r[species].juvenileAtEnd++}
  for(const k of FOCUS){const e=r[k].motherEnergyAfter.sort((a,b)=>a-b);r[k].motherEnergyAfter=e.length?{min:+e[0].toFixed(3),median:+e[e.length>>1].toFixed(3)}:null}
  console.log('RESULT '+JSON.stringify({variant,days,species:r,series,starvation:Object.fromEntries(Object.entries(deaths).filter(([k])=>k.endsWith(':starvation'))),integrityChecks:checks}));
}else{
  const seed=args[0]||'LIFE-A',days=Number(args[1]||720),out=args[2],self=fileURLToPath(import.meta.url);
  const results=await Promise.all(['previous','adopted'].map(v=>new Promise((res,rej)=>{const c=spawn(process.execPath,[self,'--variant',v,seed,String(days)],{stdio:['ignore','pipe','inherit']});let o='';c.stdout.on('data',d=>o+=d);c.on('exit',code=>{const line=o.split('\n').find(l=>l.startsWith('RESULT '));code===0&&line?res(JSON.parse(line.slice(7))):rej(Error(v+' failed'))})})));
  const result={seed,days,...Object.fromEntries(results.map(r=>[r.variant,r]))};if(out)fs.writeFileSync(out,JSON.stringify(result,null,1));
  for(const r of results)for(const k of FOCUS){const s=r.species[k];console.log(seed,r.variant.padEnd(8),k.padEnd(10),'births',s.births,'matured',s.matured,'juvAtEnd',s.juvenileAtEnd,'diedJuv',JSON.stringify(s.diedJuvenile),'motherDied60',JSON.stringify(s.motherDied60),'motherE',JSON.stringify(s.motherEnergyAfter),'pop',r.series.map(x=>x[k]).join('>'),'checks',r.integrityChecks)}
}
