// Natural hybridisation observation (diagnostic). Same seed, founding genetics off (shared ancestral
// genome) vs on (anatomy-related lineage genotypes). Records mating attempts (same/cross lineage),
// conceptions, hybrid births, and hybrids' own later conceptions (fertility in the next generation).
// One variant per process. Usage: node tools/hybrid-observation.mjs <seed> [days=300] [out.json]
import fs from 'node:fs';import {spawn} from 'node:child_process';import {fileURLToPath} from 'node:url';
const args=process.argv.slice(2);
if(args[0]==='--variant'){
  const [,variant,seed,daysArg]=args,days=Number(daysArg);
  const {FOUNDING_GENETICS,reproductiveCompatibility}=await import('../src/reproduction/reproductive-compatibility.js');FOUNDING_GENETICS.enabled=variant!=='shared';const {SIMILARITY_PREFERENCE,matePreferencesFor}=await import('../src/reproduction/mate-preferences.js');SIMILARITY_PREFERENCE.enabled=variant==='similarity';
  const {Simulation}=await import('../src/sim/simulation.js');const {checkEcologicalIntegrity}=await import('./ecological-integrity.mjs');
  const sim=new Simulation(seed,{player:false}),initial=sim.animals.filter(a=>a.alive).length;let checks=0;
  const lineageOf=a=>a.hybridOf?'hybrid':a.species;const r={attempts:{same:0,cross:0},conceptions:{same:0,cross:0},births:{pure:0,hybrid:0},hybridAttempts:0,hybridConceptions:0,crossChance:[],bySpecies:{}};
  const S=k=>r.bySpecies[k]??={births:0,hybridBirths:0,attemptsSame:0,attemptsCross:0};
  const tm=sim.tryMate.bind(sim);sim.tryMate=(a,b)=>{const cross=a.species!==b.species,fem=a.sex==='F'?a:b,was=!!fem.pregnant;const isHybrid=!!(a.hybridOf||b.hybridOf);r.attempts[cross?'cross':'same']++;S(a.species)[cross?'attemptsCross':'attemptsSame']++;if(isHybrid)r.hybridAttempts++;if(cross)r.crossChance.push(reproductiveCompatibility(a,b).conceptionChance);const res=tm(a,b);if(!was&&fem.pregnant){r.conceptions[cross?'cross':'same']++;if(isHybrid)r.hybridConceptions++}return res};
  const gb=sim.giveBirth.bind(sim);sim.giveBirth=m=>{const father=m.pregnant&&sim.animals.find(x=>x.id===m.pregnant.fatherId);const kids=gb(m);const hybrid=!!(father&&father.species!==m.species)||!!m.hybridOf||!!father?.hybridOf;for(const k of kids){if(hybrid)k.hybridOf=[m.species,father?.species].join('x')}if(kids.length){r.births[hybrid?'hybrid':'pure']+=kids.length;S(m.species).births+=kids.length;if(hybrid)S(m.species).hybridBirths+=kids.length}return kids};
  for(let d=0;d<days;d++){const d0=sim.day;while(sim.day===d0)sim.update(null);if(sim.day%8===0){checkEcologicalIntegrity(sim,initial);checks++}}
  const cc=r.crossChance.sort((a,b)=>a-b);r.crossChance=cc.length?{median:+cc[cc.length>>1].toFixed(2),min:+cc[0].toFixed(2)}:null;
  const end={};for(const a of sim.animals)if(a.alive)end[a.species]=(end[a.species]||0)+1;
  const simAll=sim.animals.filter(a=>a.alive).map(a=>matePreferencesFor(sim.seed,a).similarity??0),newborn=sim.animals.filter(a=>a.alive&&a.parentIds?.length).map(a=>matePreferencesFor(sim.seed,a).similarity??0),mean=v=>v.length?+(v.reduce((x,y)=>x+y,0)/v.length).toFixed(3):null;
  console.log('RESULT '+JSON.stringify({variant,...r,end,similarityMeanAlive:mean(simAll),similarityMeanBorn:mean(newborn),integrityChecks:checks}));
}else{
  const seed=args[0]||'HYB-A',days=Number(args[1]||300),out=args[2],self=fileURLToPath(import.meta.url);
  const results=await Promise.all((process.env.VARIANTS||'shared,founding').split(',').map(v=>new Promise((res,rej)=>{const c=spawn(process.execPath,[self,'--variant',v,seed,String(days)],{stdio:['ignore','pipe','inherit']});let o='';c.stdout.on('data',d=>o+=d);c.on('exit',code=>{const line=o.split('\n').find(l=>l.startsWith('RESULT '));code===0&&line?res(JSON.parse(line.slice(7))):rej(Error(v+' failed'))})})));
  if(out)fs.writeFileSync(out,JSON.stringify({seed,days,...Object.fromEntries(results.map(r=>[r.variant,r]))},null,1));
  for(const r of results)console.log(seed,r.variant.padEnd(8),'attempts',JSON.stringify(r.attempts),'conceptions',JSON.stringify(r.conceptions),'births',JSON.stringify(r.births),'hybrid parents: attempts',r.hybridAttempts,'conceived',r.hybridConceptions,'crossChance',JSON.stringify(r.crossChance),'| needlejaw',JSON.stringify(r.bySpecies.needlejaw||{}),'| simMean born',r.similarityMeanBorn,'| checks',r.integrityChecks);
}
