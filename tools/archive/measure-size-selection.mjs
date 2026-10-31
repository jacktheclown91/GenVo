// Natural size evolution evidence (morphology S8, Scenario E). Runs a new-game world
// (planetary, every current new-game rule, body-size/2) and records, per species:
// adult size mean and spread over time, the midparent-offspring regression of
// inherited size (a heritability estimate), the selection differential (mean size
// of the parents that actually bred minus the adult population mean at the time),
// and mean size at death against the living adults. Observation only; nothing is
// staged, tuned or forced.
// Usage: node --max-old-space-size=8192 tools/measure-size-selection.mjs SEED DAYS OUTPUT.json
import fs from 'node:fs';
import {Simulation} from '../../src/sim/simulation.js';
import {SPECIES} from '../../src/organisms/species.js';
import {adultSizeScale} from '../../src/organisms/body-size.js';

const [seed='SIZE-SELECTION-1',daysArg='200',out]=process.argv.slice(2),days=Number(daysArg);
if(!(days>0&&days<=1000))throw Error('Supply 1..1000 days');
const sim=new Simulation(seed,{player:true,worldGenerator:'planetary/1',regionalFrontier:true,autonomousPopulations:true,courtshipSimilarity:true,
 regionalFounding:'regional-founding-templates/3',dayClock:true,metabolism:true,foodProperties:true,tissueWater:true,winterWater:true,escapeLanding:true,
 tissueEnergy:true,perennialRegrowth:true,bodySize:'body-size/2',inertia:true,structuralSupport:true,aridPhysiology:true,climateWater:true,diurnal:true});
sim.setPlayerAutonomy(true);
const log=Math.log,species={};
const sp=k=>species[k]??={births:[],deaths:[],snapshots:[],selection:[]};
const adults=k=>sim.animals.filter(a=>a.alive&&a.species===k&&a.bodySize&&a.age>=(SPECIES[k]?.maturity||1));
const meanLog=list=>list.length?list.reduce((t,a)=>t+log(adultSizeScale(a)),0)/list.length:null;
const spawn=sim.spawnFundedOffspring.bind(sim);
sim.spawnFundedOffspring=(mother,father,parents,options)=>{
 const kids=spawn(mother,father,parents,options),[m,f]=parents||[];
 if(m?.bodySize&&f?.bodySize){const mid=(log(adultSizeScale(m))+log(adultSizeScale(f)))/2,pop=meanLog(adults(mother.species));
  for(const k of kids)if(k.bodySize)sp(k.species).births.push({day:sim.day,mid,child:log(adultSizeScale(k))});
  if(pop!==null)sp(mother.species).selection.push({day:sim.day,parents:mid,population:pop,offspring:kids.length})}
 return kids};
const kill=sim.kill.bind(sim);
sim.kill=(a,cause)=>{if(a?.alive&&a.bodySize&&!a.player)sp(a.species).deaths.push({day:sim.day,cause,size:log(adultSizeScale(a)),adult:a.age>=(SPECIES[a.species]?.maturity||1),population:meanLog(adults(a.species))});return kill(a,cause)};
const started=Date.now();
for(let d=1;d<=days;d++){const day=sim.day;while(sim.day===day)sim.update(null);
 if(d%20===0||d===1)for(const k of new Set(sim.animals.filter(a=>a.alive&&a.bodySize).map(a=>a.species))){const list=adults(k),m=meanLog(list);
  sp(k).snapshots.push({day:sim.day,adults:list.length,meanScale:m===null?null:+Math.exp(m).toFixed(4),sdLog:list.length>1?+Math.sqrt(list.reduce((t,a)=>t+(log(adultSizeScale(a))-m)**2,0)/(list.length-1)).toFixed(4):null,
   min:list.length?+Math.min(...list.map(adultSizeScale)).toFixed(3):null,max:list.length?+Math.max(...list.map(adultSizeScale)).toFixed(3):null})}}
const slope=rows=>{if(rows.length<8)return null;const mx=rows.reduce((t,r)=>t+r.mid,0)/rows.length,my=rows.reduce((t,r)=>t+r.child,0)/rows.length;let sxy=0,sxx=0;for(const r of rows){sxy+=(r.mid-mx)*(r.child-my);sxx+=(r.mid-mx)**2}return sxx>0?+(sxy/sxx).toFixed(3):null};
const summary=Object.fromEntries(Object.entries(species).map(([k,s])=>{
 const sel=s.selection,weighted=sel.reduce((t,r)=>t+r.offspring,0);
 const differential=weighted?sel.reduce((t,r)=>t+(r.parents-r.population)*r.offspring,0)/weighted:null;
 const adultDeaths=s.deaths.filter(r=>r.adult&&r.population!==null),deathShift=adultDeaths.length?adultDeaths.reduce((t,r)=>t+r.size-r.population,0)/adultDeaths.length:null;
 return[k,{births:s.births.length,heritabilitySlope:slope(s.births),selectionDifferentialLog:differential===null?null:+differential.toFixed(4),
  adultDeaths:adultDeaths.length,deathSizeShiftLog:deathShift===null?null:+deathShift.toFixed(4),first:s.snapshots[0]||null,last:s.snapshots.at(-1)||null,snapshots:s.snapshots}]}));
const result={schema:'genvo.size-selection/1',seed,days,seconds:Math.round((Date.now()-started)/1000),alive:sim.animals.filter(a=>a.alive).length,summary};
if(out)fs.writeFileSync(out,JSON.stringify(result,null,1));
console.log(JSON.stringify({...result,summary:Object.fromEntries(Object.entries(summary).map(([k,v])=>[k,{...v,snapshots:undefined}]))}));
