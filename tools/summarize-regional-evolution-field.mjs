// Summarizes genvo.regional-evolution-field/1 receipts: demography per region,
// established populations, how often each recognition gate actually passed,
// foreign references and recognitions. Read-only.
// Usage: node tools/summarize-regional-evolution-field.mjs RECEIPT.json [...]
import fs from 'node:fs';

const files=process.argv.slice(2);if(!files.length)throw Error('Supply one or more field receipts.');
const summaries=files.map(file=>{
  const r=JSON.parse(fs.readFileSync(file,'utf8')),last=r.samples.at(-1),regions={};
  for(const sample of r.samples)for(const region of sample.regions){
    const s=regions[region.key]||={key:region.key,mode:region.mode,evaluations:0,gatePasses:{},foreignEvaluations:0,qualifiedEvaluations:0,
      bestProgress:0,firstEstablishedDay:null,maxEstablished:0,maxEvaluated:0,recognized:0,referenceKinds:{none:0,local:0,foreign:0}};
    s.mode=region.mode;s.maxEstablished=Math.max(s.maxEstablished,region.established);s.maxEvaluated=Math.max(s.maxEvaluated,region.evaluated);
    if(region.established&&s.firstEstablishedDay===null)s.firstEstablishedDay=sample.day;
    s.recognized=Math.max(s.recognized,region.recognized);s.bestProgress=Math.max(s.bestProgress,region.bestProgress);
    // Count each population's evidence once per biological evaluation day.
    for(const e of region.evidence){
      // Each region evaluates on its own (possibly lagging) biological day.
      if(e.day!==region.day&&e.day!==region.day-1)continue;
      s.evaluations++;if(e.gates&&Object.values(e.gates).every(Boolean))s.qualifiedEvaluations++;
      for(const [g,ok] of Object.entries(e.gates||{}))s.gatePasses[g]=(s.gatePasses[g]||0)+(ok?1:0);
      const kind=!e.reference?'none':e.reference.startsWith(`natural:${region.key}:`)||!e.reference.startsWith('natural:')?'local':'foreign';
      s.referenceKinds[kind]++;if(kind==='foreign')s.foreignEvaluations++;
    }
  }
  for(const s of Object.values(regions))s.gateRates=Object.fromEntries(Object.entries(s.gatePasses).map(([g,n])=>[g,+(n/Math.max(1,s.evaluations)).toFixed(3)]));
  return{file,seed:r.seed,policy:r.policies?.evolution,status:r.status,days:last?.day??null,elapsedMin:Math.round((r.elapsedMs||0)/60000),
    restoreExact:r.restoreExact??null,continuationExact:r.continuationExact??null,itinerary:r.itinerary,
    final:last?.regions.map(x=>({key:x.key,mode:x.mode,animals:x.animals,births:x.births,deaths:x.deaths,emigrants:x.emigrants,established:x.established,treeNodes:x.treeNodes,recognitionEvents:x.recognitionEvents})),
    regions:Object.values(regions).map(({gatePasses,...s})=>s),failure:r.failure?.slice(0,300)??null};
});
console.log(JSON.stringify(summaries,null,1));
