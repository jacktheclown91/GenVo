// Summarises paired observe-anatomical-vision.mjs runs (vision vs control).
// Usage: node tools/summarize-anatomical-vision.mjs <dir> [out.json]
import fs from 'node:fs';import path from 'node:path';
const [dir,out]=process.argv.slice(2);
const runs={};
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.ndjson'))){
 const rows=fs.readFileSync(path.join(dir,f),'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
 const start=rows.find(r=>r.kind==='start'),final=rows.find(r=>r.kind==='final')||rows.at(-1),samples=rows.filter(r=>r.kind==='sample');
 if(!start)continue;
 const pops=samples.map(s=>s.population),advanced=['telescopic-eye','raptor-eye','panoramic-eye','sentinel-eye','second-pair'];
 runs[start.seed+'|'+start.mode]={seed:start.seed,mode:start.mode,policy:start.policy,complete:final.kind==='final',lastDay:final.day,seconds:final.seconds,
  population:{start:start.population,final:final.population,min:Math.min(...pops),max:Math.max(...pops),mean:+(pops.reduce((a,b)=>a+b,0)/Math.max(1,pops.length)).toFixed(1)},
  speciesFinal:final.bySpecies,births:final.births,deaths:final.deaths,byCause:final.byCause,threatStages:final.threatStages,
  sightRange:{start:start.sightRange,final:final.sightRange},fieldOfView:{start:start.fieldOfView,final:final.fieldOfView},
  eyeCarriers:{start:start.eyeCarriers,final:final.eyeCarriers},secondPairFinal:final.secondPair,
  advancedEverBorn:Object.fromEntries(advanced.map(k=>[k,final.everBorn?.[k]||0])),advancedFirstBorn:Object.fromEntries(advanced.map(k=>[k,final.firstBorn?.[k]||null])),
  everBorn:final.everBorn,newbornsObserved:final.newbornsObserved};
}
const text=JSON.stringify(runs,null,1);if(out)fs.writeFileSync(out,text);console.log(text);
