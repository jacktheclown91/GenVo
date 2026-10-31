// Aquatic food-web candidates on identical unstaged worlds, one variant per process:
//   base | forage (amphibiousForage) | growth (+fryGrowth) | founding (+founding) | both (all three)
//   | shore (both + shoreHabitat founding sites).
// Records water-food stocks, Bankjaw water meals/energy/births, Rillsifter numbers, integrity.
// Usage: node tools/compare-aquatic-review.mjs <seed> [days=540] [out.json]
import fs from 'node:fs';import {spawn} from 'node:child_process';import {fileURLToPath} from 'node:url';
const args=process.argv.slice(2);
if(args[0]==='--variant'){
  const [,variant,seed,daysArg]=args,days=Number(daysArg);
  const {AQUATIC_REVIEW,freshwaterField}=await import('../../src/ecology/freshwater-food.js');const {ECOLOGY_REVIEW}=await import('../../src/ecology/ecology-review.js');
  AQUATIC_REVIEW.fryGrowth=variant==='growth'||variant==='both';AQUATIC_REVIEW.founding=variant==='founding'||variant==='both';AQUATIC_REVIEW.crowding=variant==='crowding';if(variant==='crowding'||variant==='integrated'){AQUATIC_REVIEW.fryGrowth=AQUATIC_REVIEW.founding=true;AQUATIC_REVIEW.crowding=true}if(variant==='integrated-nocrowd'){AQUATIC_REVIEW.fryGrowth=AQUATIC_REVIEW.founding=true;AQUATIC_REVIEW.crowding=false}ECOLOGY_REVIEW.amphibiousForage=variant!=='base';ECOLOGY_REVIEW.shoreHabitat=variant==='shore'||variant.startsWith('integrated')||variant==='crowding';if(variant==='shore'){AQUATIC_REVIEW.fryGrowth=AQUATIC_REVIEW.founding=true}
  const {Simulation}=await import('../../src/sim/simulation.js');const {SPECIES}=await import('../../src/organisms/species.js');const {checkEcologicalIntegrity}=await import('../ecological-integrity.mjs');
  const sim=new Simulation(seed,{player:false}),w=sim.world,initial=sim.animals.filter(a=>a.alive).length,births={},deaths={},meals={};let checks=0;
  const ob=sim.spawnFundedOffspring.bind(sim);sim.spawnFundedOffspring=(m,...r)=>{const c=ob(m,...r);births[m.species]=(births[m.species]||0)+c.length;return c};
  const ok=sim.kill.bind(sim);sim.kill=(a,cause)=>{if(a.alive)deaths[a.species+':'+cause]=(deaths[a.species+':'+cause]||0)+1;return ok(a,cause)};
  const cells=[];for(let i=0;i<w.len;i++)if(w.water[i]&&w.isPlayable(i%w.n+.5,(i/w.n|0)+.5))cells.push(i);const tot=k=>+cells.reduce((n,i)=>n+(freshwaterField(w,k)[i]||0),0).toFixed(2);
  const series=[];
  for(let d=0;d<=days;d++){
    if(d%60===0){const bj=sim.animals.filter(a=>a.alive&&a.species==='bankjaw').map(a=>a.energy/SPECIES.bankjaw.maxEnergy).sort((a,b)=>a-b);series.push({day:d,algae:tot('algae'),larvae:tot('larvae'),fry:tot('fry'),detritus:tot('detritus'),bankjaw:bj.length,bankjawEnergyMedian:bj.length?+bj[bj.length>>1].toFixed(3):null,rillsifter:sim.animals.filter(a=>a.alive&&a.species==='rillsifter').length})}
    const d0=sim.day;while(sim.day===d0){sim.update(null);for(const a of sim.animals)if(a.alive&&a.lastFreshwaterMeal?.tick===sim.tickCount){const k=a.species+':'+a.lastFreshwaterMeal.kind;meals[k]=+((meals[k]||0)+a.lastFreshwaterMeal.amount).toFixed(3)}}
    if(sim.day%8===0){checkEcologicalIntegrity(sim,initial);checks++}
  }
  console.log('RESULT '+JSON.stringify({variant,days,series,births,deaths,meals,integrityChecks:checks}));
}else{
  const seed=args[0]||'AQ-CMP-A',days=Number(args[1]||540),out=args[2],self=fileURLToPath(import.meta.url),variants=(process.env.VARIANTS||'base,forage,growth,founding,both,shore').split(',');
  const results=await Promise.all(variants.map(v=>new Promise((res,rej)=>{const c=spawn(process.execPath,[self,'--variant',v,seed,String(days)],{stdio:['ignore','pipe','inherit']});let o='';c.stdout.on('data',d=>o+=d);c.on('exit',code=>{const line=o.split('\n').find(l=>l.startsWith('RESULT '));code===0&&line?res(JSON.parse(line.slice(7))):rej(Error(v+' failed'))})})));
  const result={seed,days,...Object.fromEntries(results.map(r=>[r.variant,r]))};if(out)fs.writeFileSync(out,JSON.stringify(result,null,1));
  for(const r of results){const last=r.series.at(-1),peakFry=Math.max(...r.series.map(s=>s.fry));console.log(seed,r.variant.padEnd(8),'fry end',last.fry,'peak',peakFry,'larvae',last.larvae,'algae',last.algae,'| bankjaw',last.bankjaw,'E',last.bankjawEnergyMedian,'births',r.births.bankjaw||0,'fry meals',r.meals['bankjaw:fry']||0,'| rill',last.rillsifter,'births',r.births.rillsifter||0,'| checks',r.integrityChecks)}
}
