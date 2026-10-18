// Paired comparison of the review candidates on identical unstaged worlds:
//   current | breeding (aquatic forage values) | ecology (amphibious foraging) | both.
// One variant per process (review flags are module state). Reports births/deaths/end population,
// bankjaw hunting receipts and energy, and mechanical integrity. Outcomes are observations only.
// Usage: node tools/compare-ecology-review.mjs <seed> [years=2] [out.json]
//        node tools/compare-ecology-review.mjs --variant <name> <seed> <years>   (worker)
import fs from 'node:fs';import {spawn} from 'node:child_process';import {fileURLToPath} from 'node:url';
const args=process.argv.slice(2);
if(args[0]==='--variant'){
  const [,variant,seed,yearsArg]=args,years=Number(yearsArg);
  const {Simulation}=await import('../src/sim/simulation.js');const {BREEDING_REVIEW}=await import('../src/ecology/breeding-calibration.js');const {ECOLOGY_REVIEW}=await import('../src/ecology/ecology-review.js');const {SPECIES}=await import('../src/organisms/species.js');const {checkEcologicalIntegrity}=await import('./ecological-integrity.mjs');
  BREEDING_REVIEW.enabled=variant==='breeding'||variant==='both';ECOLOGY_REVIEW.amphibiousForage=variant==='ecology'||variant==='both';
  const sim=new Simulation(seed,{player:false}),initial=sim.animals.filter(a=>a.alive).length,births={},deaths={},start={},hunt={attempts:0,bites:0,kills:0,targets:{}},energy=[];
  for(const a of sim.animals)start[a.species]=(start[a.species]||0)+1;
  const ob=sim.spawnFundedOffspring.bind(sim);sim.spawnFundedOffspring=(m,...r)=>{const c=ob(m,...r);births[m.species]=(births[m.species]||0)+c.length;return c};
  const ok=sim.kill.bind(sim);sim.kill=(a,cause)=>{if(a.alive)deaths[a.species]=(deaths[a.species]||0)+1;return ok(a,cause)};
  const tk=sim.tryKill.bind(sim);sim.tryKill=(p,q)=>{if(p.species!=='bankjaw')return tk(p,q);hunt.attempts++;const h=q.health,alive=q.alive,r=tk(p,q);if(q.health<h)hunt.bites++;if(alive&&!q.alive)hunt.kills++;hunt.targets[q.species]=(hunt.targets[q.species]||0)+1;return r};
  let integrityChecks=0,lastDay=sim.day;
  while(sim.year<=years){sim.update(null);if(sim.day!==lastDay){lastDay=sim.day;if(sim.day%8===0){checkEcologicalIntegrity(sim,initial);integrityChecks++;for(const a of sim.animals)if(a.alive&&a.species==='bankjaw'&&a.age>=SPECIES.bankjaw.maturity)energy.push(a.energy/SPECIES.bankjaw.maxEnergy)}}}
  const end={};for(const a of sim.animals)if(a.alive)end[a.species]=(end[a.species]||0)+1;energy.sort((a,b)=>a-b);
  console.log('RESULT '+JSON.stringify({variant,start,births,deaths,end,bankjaw:{...hunt,energyMedian:energy.length?+energy[energy.length>>1].toFixed(3):null,energyGatePass:energy.length?+(energy.filter(e=>e>.74).length/energy.length).toFixed(3):null},integrityChecks}));
}else{
  const seed=args[0]||'ECO-CMP-A',years=Number(args[1]||2),out=args[2],self=fileURLToPath(import.meta.url);
  const variants=['current','breeding','ecology','both'];
  const results=await Promise.all(variants.map(v=>new Promise((res,rej)=>{const c=spawn(process.execPath,[self,'--variant',v,seed,String(years)],{stdio:['ignore','pipe','inherit']});let o='';c.stdout.on('data',d=>o+=d);c.on('exit',code=>{const line=o.split('\n').find(l=>l.startsWith('RESULT '));code===0&&line?res(JSON.parse(line.slice(7))):rej(Error(v+' failed'))})})));
  const result={seed,years,...Object.fromEntries(results.map(r=>[r.variant,r]))};if(out)fs.writeFileSync(out,JSON.stringify(result,null,1));console.log(JSON.stringify({seed,years,bankjaw:Object.fromEntries(results.map(r=>[r.variant,r.bankjaw]))}));
}
