// Morphology S9 long-run validation: a new-game planetary world with every current
// rule, run for a year (or DAYS). Records, observation only:
//  - population, births and deaths by cause each 30 days;
//  - per-day simulation cost;
//  - the worst daily soil-water closure (conservation);
//  - Scenario D: every cell that rainfall runoff floods into surface water
//    (rainfall-runoff-inundation), which of them animals drink from, how long
//    each lasts, and how many disappear again through funded seasonal-channel
//    recession;
//  - inherited size range and recognised wild species.
// --baseline runs the new-game rules as they were before the morphology work (no
// body size, inertia, structure, arid physiology, climate water, day-night, founding /2,
// no autonomous evolution), for attribution.
// Usage: node --max-old-space-size=8192 tools/measure-year-validation.mjs SEED DAYS OUTPUT.json [--baseline]
import fs from 'node:fs';
import {Simulation} from '../src/sim/simulation.js';
import {adultSizeScale} from '../src/organisms/body-size.js';

const args=process.argv.slice(2).filter(a=>!a.startsWith('--')),baseline=process.argv.includes('--baseline');
const [seed='S9-YEAR-1',daysArg='365',out]=args,days=Number(daysArg);
if(!(days>0&&days<=1000))throw Error('Supply 1..1000 days');
const common={player:true,worldGenerator:'planetary/1',regionalFrontier:true,autonomousPopulations:true,courtshipSimilarity:true,dayClock:true,metabolism:true,
 foodProperties:true,tissueWater:true,winterWater:true,escapeLanding:true,tissueEnergy:true,perennialRegrowth:true};
const sim=new Simulation(seed,baseline?{...common,regionalFounding:'regional-founding-templates/2'}:{...common,regionalFounding:'regional-founding-templates/3',
 bodySize:'body-size/2',inertia:true,structuralSupport:true,aridPhysiology:true,climateWater:true,diurnal:true,autonomousEvolution:true});
sim.setPlayerAutonomy(true);
const w=sim.world,ponds=new Map(),closed=[];let flooded=0,receded=0,maxClosure=0,drinksOnPonds=0,drinksTotal=0;
const set=w.setSurfaceWater.bind(w);
w.setSurfaceWater=(changes,options={})=>{
 const receipt=set(changes,options);
 for(const c of changes){
  if(options.reason==='rainfall-runoff-inundation'&&c.water){flooded++;ponds.set(c.i,{day:sim.day,drinks:0})}
  else if(options.reason==='funded-seasonal-channel-recession'&&!c.water&&ponds.has(c.i)){receded++;const p=ponds.get(c.i);closed.push({days:sim.day-p.day,drinks:p.drinks});ponds.delete(c.i)}
 }
 return receipt};
const rows=[],started=Date.now();let dayStart=Date.now(),slowest=0;
for(let d=1;d<=days;d++){
 const day=sim.day;
 while(sim.day===day){sim.update(null);
  if(sim.tickCount%6===0)for(const a of sim.animals){if(!a.alive||a.intent!=='drink')continue;drinksTotal++;const i=w.idx(a.x,a.y);for(const j of [i,i-1,i+1,i-w.n,i+w.n]){const p=ponds.get(j);if(p){p.drinks++;drinksOnPonds++;break}}}}
 const closure=Math.abs(w.soilWater?.lastDay?.closure??0);if(closure>maxClosure)maxClosure=closure;
 const ms=Date.now()-dayStart;dayStart=Date.now();if(ms>slowest)slowest=ms;
 if(d%30===0||d===days){const live=sim.animals.filter(a=>a.alive&&!a.player),sizes=live.filter(a=>a.bodySize).map(adultSizeScale);
  rows.push({day:sim.day,alive:live.length,births:sim.stats.births,deaths:{...sim.stats.byCause},openPonds:ponds.size,flooded,receded,
   size:sizes.length?{min:+Math.min(...sizes).toFixed(3),max:+Math.max(...sizes).toFixed(3)}:null,
   recognisedSpecies:sim.evolutionTree?.nodes?[...sim.evolutionTree.nodes.values()].filter(n=>n.parentId!=null).length:null,seconds:Math.round((Date.now()-started)/1000)});
  console.log(JSON.stringify(rows.at(-1)))}
}
const lifetimes=closed.map(c=>c.days).sort((a,b)=>a-b),used=closed.filter(c=>c.drinks>0).length;
const result={schema:'genvo.year-validation/1',seed,days,baseline,seconds:Math.round((Date.now()-started)/1000),slowestDayMs:slowest,maxSoilClosure:maxClosure,
 seasonalWater:{riverDischarge:+(w.environment?.totals?.riverDischarge??0).toFixed(3),surfaceEvaporation:+(w.environment?.totals?.surfaceEvaporation??0).toFixed(3),flooded,receded,stillOpen:ponds.size,drinksOnRunoffWater:drinksOnPonds,drinkDecisions:drinksTotal,recededThatWereUsed:used,
  lifetimeDays:lifetimes.length?{p10:lifetimes[Math.floor(.1*(lifetimes.length-1))],p50:lifetimes[Math.floor(.5*(lifetimes.length-1))],p90:lifetimes[Math.floor(.9*(lifetimes.length-1))]}:null},rows};
if(out)fs.writeFileSync(out,JSON.stringify(result,null,1));
console.log(JSON.stringify({...result,rows:undefined}));
