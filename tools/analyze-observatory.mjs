// Analyses observatory NDJSON runs (tools/run-observatory.mjs).
// Usage: node tools/analyze-observatory.mjs <dir> <out.json>
// Per run: what evolved and how often; what persisted, spread or vanished;
// lineage success and extinction causes; population and food sustainability;
// ecological pressures; biodiversity; simulation/persistence bottlenecks.
// Arms (vision/control) are compared only within a seed, at matched days, and
// summarised across seeds by sign consistency; single-seed differences include
// chaotic divergence and are not causal evidence on their own.
import fs from 'node:fs';import path from 'node:path';
const [dir,out,focusArg='bankjaw,rillsifter']=process.argv.slice(2),FOCUS=focusArg.split(','),PAIRS=[['vision','control'],['foraging','current'],['seeds','unbounded']];
const read=f=>fs.readFileSync(f,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
const mean=v=>v.length?v.reduce((a,b)=>a+b,0)/v.length:0,r=(v,d=3)=>Number.isFinite(v)?+v.toFixed(d):null;
const slope=(xs,ys)=>{const mx=mean(xs),my=mean(ys);let n=0,d=0;for(let i=0;i<xs.length;i++){n+=(xs[i]-mx)*(ys[i]-my);d+=(xs[i]-mx)**2}return d?n/d:0};
function analyse(rows){
 const start=rows.find(x=>x.type==='start'),days=rows.filter(x=>x.type==='day'),eco=rows.filter(x=>x.type==='ecology'),cps=rows.filter(x=>x.type==='checkpoint'),events=rows.filter(x=>x.type==='event'),final=rows.find(x=>x.type==='final');
 const last=days.at(-1)||{},first=days[0]||{},pops=days.map(d=>d.population),peak=Math.max(0,...pops);
 const founding=new Set(Object.keys((eco[0]||{}).parts||{}));
 // 1-2. Evolution: new parts, their frequency and fate.
 const firstBorn=events.filter(e=>e.kind==='part-first-born'),lost=events.filter(e=>e.kind==='part-lost');
 const finalParts=(eco.at(-1)||{}).parts||{};
 const evolved=firstBorn.filter(e=>!founding.has(e.part)&&e.day>1).map(e=>{const p=final?.parts?.[e.part]||{};const carriers=finalParts[e.part]||0;
  return{part:e.part,firstDay:e.day,species:e.species,born:p.born||0,finalCarriers:carriers,fate:carriers===0?'disappeared':carriers>=Math.max(5,(p.born||0)*.5)?'spread':'persisted'}});
 const births=days.reduce((n,d)=>n+d.births,0),varied=days.reduce((n,d)=>n+(d.variedBirths||0),0);
 // 3. Lineages.
 const L=final?.lineages||[],reproduced=L.filter(l=>l.births>0),surviving=L.filter(l=>l.alive>0);
 // Death causes by species, overall and in the 60 days before each species extinction.
 const bySpeciesCause={};for(const d of days)for(const [k,n] of Object.entries(d.deaths||{})){const [sp,c]=k.split(':');(bySpeciesCause[sp]??={})[c]=(bySpeciesCause[sp][c]||0)+n}
 const speciesExtinct=events.filter(e=>e.kind==='species-extinct').map(e=>{const causes={};for(const d of days.filter(d=>d.day>e.day-60&&d.day<=e.day))for(const [k,n] of Object.entries(d.deaths||{})){const [sp,c]=k.split(':');if(sp===e.species)causes[c]=(causes[c]||0)+n}return{species:e.species,day:e.day,causesLast60Days:causes}});
 // 4. Sustainability: population and food trends.
 const tail=days.slice(-100),food=k=>eco.map(e=>e.resources?.[k]).filter(Number.isFinite);
 const resourceTrend={};for(const k of Object.keys(eco[0]?.resources||{})){const v=food(k);if(v.length>1)resourceTrend[k]={start:r(v[0],1),final:r(v.at(-1),1),ratio:v[0]?r(v.at(-1)/v[0]):null}}
 // 5. Pressures.
 const causeTotals={};for(const d of days)for(const [k,n] of Object.entries(d.deaths||{})){const c=k.split(':')[1];causeTotals[c]=(causeTotals[c]||0)+n}
 const animalDays=pops.reduce((a,b)=>a+b,0)||1,threat={};for(const d of days)for(const [k,n] of Object.entries(d.threat||{}))threat[k]=(threat[k]||0)+n;
 // 6. Biodiversity.
 const div=k=>({start:first.diversity?.[k],peak:Math.max(0,...days.map(d=>d.diversity?.[k]||0)),final:last.diversity?.[k]});
 // 7. Bottlenecks.
 const busy=days.filter(d=>d.population>0);
 const phaseTotals=final?.phases||eco.at(-1)?.phases||{},phaseMs=Object.values(phaseTotals).reduce((n,p)=>n+p.ms,0)||1;
 return{seed:start?.seed,arm:start?.arm,policies:start?.policies,lastDay:last.day,complete:!!final,
  evolution:{births,variedBirths:varied,variationRate:r(births?varied/births:0),newParts:evolved,partsLost:lost.map(e=>({part:e.part,day:e.day}))},
  lineages:{founders:L.filter(l=>l.founderDay<=1).length,tracked:L.length,reproduced:reproduced.length,surviving:surviving.length,topByBirths:L.slice(0,8).map(l=>({root:l.root,species:l.species,births:l.births,peak:l.peak,alive:l.alive,extinctDay:l.extinctDay}))},
  species:{start:first.bySpecies,final:last.bySpecies,extinctions:speciesExtinct,deathCausesBySpecies:bySpeciesCause},
  population:{start:first.population,peak,final:last.population,finalTrendPerDay:r(slope(tail.map(d=>d.day),tail.map(d=>d.population)),2),crashes:events.filter(e=>e.kind==='population-crash').length,totalExtinctionDay:events.find(e=>e.kind==='total-extinction')?.day??null},
  food:resourceTrend,
  pressures:{deathCauses:causeTotals,deathsPer1000AnimalDays:Object.fromEntries(Object.entries(causeTotals).map(([k,n])=>[k,r(n/animalDays*1000,2)])),threatPer1000AnimalDays:Object.fromEntries(Object.entries(threat).map(([k,n])=>[k,r(n/animalDays*1000,1)])),hunterShare:r(mean(days.map(d=>d.population?d.hunters/d.population:0))),meanSight:{range:r(mean(days.map(d=>d.sight?.range||0)),2),fov:r(mean(days.map(d=>d.sight?.fov||0)),1)},genesFinal:last.genes},
  biodiversity:{species:div('species'),branches:div('branches'),bodyPlans:div('bodyPlans'),partsPresent:div('partsPresent'),lineagesAlive:div('lineagesAlive')},
  performance:{msPerDay:{mean:r(mean(busy.map(d=>d.ms)),0),max:r(Math.max(0,...busy.map(d=>d.ms)),0)},msPerAnimalDay:r(mean(busy.map(d=>d.ms/d.population)),2),heapMBFinal:last.heapMB,rssMBMax:Math.max(0,...days.map(d=>d.rssMB||0)),
   phaseShare:Object.fromEntries(Object.entries(phaseTotals).map(([k,p])=>[k,r(p.ms/phaseMs)])),checkpoints:cps.map(c=>({day:c.day,animals:c.animals,snapshotMs:c.snapshotMs,serializeMs:c.serializeMs,MB:r(c.bytes/1048576,2)}))},
  _days:days,_lineages:final?.lineages||[]};
}
const runs=fs.readdirSync(dir).filter(f=>f.endsWith('.ndjson')).map(f=>analyse(read(path.join(dir,f)))).filter(x=>x.seed);
// Matched within-seed comparison.
const bySeed={};for(const x of runs)(bySeed[x.seed]??={})[x.arm]=x;
const comparisons=[];
// Species-focused outcomes for the matched window.
const focusOf=(run,rows)=>Object.fromEntries(FOCUS.map(sp=>{const series=rows.map(d=>d.bySpecies?.[sp]||0),alive=series.map((n,i)=>n?rows[i].day:null).filter(Boolean),deaths={};
 for(const d of rows)for(const [k,n] of Object.entries(d.deaths||{}))if(k.startsWith(sp+':'))deaths[k.split(':')[1]]=(deaths[k.split(':')[1]]||0)+n;
 const births=(run._lineages||[]).filter(l=>l.species===sp).reduce((n,l)=>n+l.births,0);
 return[sp,{start:series[0],mean:r(mean(series),1),final:series.at(-1),lastAliveDay:alive.at(-1)??null,births,deaths}]}));
for(const [seed,arms] of Object.entries(bySeed))for(const [treated,untreated] of PAIRS){const v=arms[treated],c=arms[untreated];if(!v||!c)continue;
 const cd=new Map(c._days.map(d=>[d.day,d])),matched=v._days.filter(d=>cd.has(d.day));
 const per=(rows,f)=>{const ad=rows.reduce((n,d)=>n+d.population,0)||1;return rows.reduce((n,d)=>n+f(d),0)/ad*1000};
 const cm=matched.map(d=>cd.get(d.day)),pred=d=>Object.entries(d.deaths||{}).filter(([k])=>k.endsWith(':predation')).reduce((n,[,x])=>n+x,0),alarm=d=>(d.threat?.alarm||0)+(d.threat?.flight||0);
 comparisons.push({seed,pair:treated+' vs '+untreated,focus:{[treated]:focusOf(v,matched),[untreated]:focusOf(c,cm)},matchedDays:matched.length,lastMatchedDay:matched.at(-1)?.day,
  populationMean:{vision:r(mean(matched.map(d=>d.population)),1),control:r(mean(cm.map(d=>d.population)),1)},
  predationPer1000AnimalDays:{vision:r(per(matched,pred),2),control:r(per(cm,pred),2)},
  alarmAndFlightPer1000AnimalDays:{vision:r(per(matched,alarm),1),control:r(per(cm,alarm),1)},
  birthsPer1000AnimalDays:{vision:r(per(matched,d=>d.births),2),control:r(per(cm,d=>d.births),2)},
  meanSightRange:{vision:r(mean(matched.map(d=>d.sight?.range||0)),2),control:r(mean(cm.map(d=>d.sight?.range||0)),2)},
  speciesFinal:{vision:matched.at(-1)?.diversity?.species,control:cm.at(-1)?.diversity?.species}});
}
const sign=(k,pair)=>{const s=comparisons.filter(c=>!pair||c.pair===pair).map(c=>Math.sign((c[k].vision??0)-(c[k].control??0)));return{higherWithTreatment:s.filter(x=>x>0).length,lowerWithTreatment:s.filter(x=>x<0).length,equal:s.filter(x=>x===0).length,replicates:s.length}};
const consistency=Object.fromEntries([...new Set(comparisons.map(c=>c.pair))].map(pair=>[pair,{populationMean:sign('populationMean',pair),predation:sign('predationPer1000AnimalDays',pair),alarmAndFlight:sign('alarmAndFlightPer1000AnimalDays',pair),births:sign('birthsPer1000AnimalDays',pair)}]));
const result={schema:'genvo.observatory-analysis/2',runs:runs.map(({_days,_lineages,...x})=>x),comparisons,consistency,
 interpretation:'Arms share seed, region and days and differ only in anatomical-vision/1; they diverge chaotically from the first differing random draw, so a single-seed difference is not causal. Treat an effect as supported only when its sign is consistent across replicates and has a mechanism.'};
fs.writeFileSync(out,JSON.stringify(result,null,1));
console.log(JSON.stringify({runs:runs.length,comparisons:comparisons.length,consistency:result.consistency}));
