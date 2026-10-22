// Reusable read-only natural observatory. One instrument for evolution,
// inheritance, population stability, speciation, reproduction, predator-prey,
// resources, climate, migration, survival, performance and persistence.
// Observation only: it wraps the instance's kill() and phase methods to record
// (calling the originals unchanged), never edits organisms, stocks, RNG or
// policies, and never selects or stages outcomes. Memory is bounded: daily rows
// stream to NDJSON, events are capped, lineage state is one entry per
// founding lineage plus one root id per animal ever born.
import fs from 'node:fs';
import {serialize} from 'node:v8';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {canHunt} from '../src/ecology/functional-diet.js';
import {wildBranch,isWildSpecies} from '../src/organisms/wild-bodies.js';
import {visionProfile} from '../src/lineage/vision.js';
import {ecologicalObservation,timeSimulationPhases} from './ecological-observation.mjs';
export const OBSERVATORY_SCHEMA='genvo.observatory/1';
const GENES=['body','motion','metabolism','senses','climate'];
const mean=v=>v.length?v.reduce((a,b)=>a+b,0)/v.length:0;
const round=(v,d=3)=>Number.isFinite(v)?+v.toFixed(d):null;
export function createObservatory(sim,{out,label='run',arm=null,ecologyEvery=10,checkpointEvery=100,maxEvents=4000,serializeHeapCeilingMB=900}={}){
 if(!out)throw Error('observatory needs an output path');
 fs.writeFileSync(out,'',{flag:'wx'});
 const write=row=>fs.appendFileSync(out,JSON.stringify(row)+'\n');
 const started=performance.now(),timing=timeSimulationPhases(sim);
 // Lineage roots: every founder is its own root; a newborn inherits its mother's root.
 const root=new Map(),lineages=new Map(),parts=new Map(),events=[];let eventsDropped=0;
 const event=(kind,data)=>{if(events.length<maxEvents){const e={day:sim.day,kind,...data};events.push(e);write({type:'event',...e})}else eventsDropped++};
 for(const a of sim.animals)if(a.alive){root.set(a.id,a.id);lineages.set(a.id,{root:a.id,species:a.species,founderDay:sim.day,births:0,alive:1,peak:1,extinctDay:null,lastBirthDay:null})}
 let nextSeenId=Math.max(0,...sim.animals.map(a=>a.id))+1;
 const dayDeaths=[],deathsByCause={};const originalKill=sim.kill;
 sim.kill=function(a,cause){const wasAlive=a?.alive;const result=originalKill.call(this,a,cause);
  if(wasAlive&&!a.alive){dayDeaths.push({species:a.species,cause,age:round(a.age,1),generation:a.generation??0,hunter:canHunt(a),root:root.get(a.id)??null});deathsByCause[cause]=(deathsByCause[cause]||0)+1}
  return result};
 let lastDay=null,dayStart=performance.now(),prevThreat={...(sim.stats.threatStages||{})},prevPopulation=null,history=[];
 function partCensus(live){const counts={};for(const a of live)for(const id of new Set((a.bodyPlan?.nodes||[]).map(n=>n.partId)))counts[id]=(counts[id]||0)+1;return counts}
 function daily(){
  const ms=performance.now()-dayStart;dayStart=performance.now();
  const live=sim.animals.filter(a=>a.alive),bySpecies={},hunters=live.filter(a=>canHunt(a)).length,births=[];
  // Newborns since the last row (ids only increase).
  for(const a of sim.animals){if(a.id<nextSeenId)continue;const mother=a.parentIds?.[0],r=root.get(mother)??root.get(a.parentIds?.[1])??a.id;root.set(a.id,r);
   let L=lineages.get(r);if(!L){L={root:r,species:a.species,founderDay:sim.day,births:0,alive:0,peak:0,extinctDay:null,lastBirthDay:null};lineages.set(r,L)}L.births++;L.lastBirthDay=sim.day;births.push(a)}
  nextSeenId=Math.max(nextSeenId,...sim.animals.map(a=>a.id+1));
  const aliveByRoot=new Map();for(const a of live){bySpecies[a.species]=(bySpecies[a.species]||0)+1;const r=root.get(a.id);aliveByRoot.set(r,(aliveByRoot.get(r)||0)+1)}
  for(const L of lineages.values()){L.alive=aliveByRoot.get(L.root)||0;L.peak=Math.max(L.peak,L.alive);if(!L.alive&&L.extinctDay===null){L.extinctDay=sim.day;event('lineage-extinct',{root:L.root,species:L.species,births:L.births,peak:L.peak})}}
  // Evolution: part carriers, first appearance and loss of every part.
  const census=partCensus(live);
  for(const a of births)for(const id of new Set((a.bodyPlan?.nodes||[]).map(n=>n.partId)))if(!parts.has(id)){parts.set(id,{first:sim.day,born:0,lost:null});event('part-first-born',{part:id,species:a.species,generation:a.generation})}
  for(const a of births)for(const id of new Set((a.bodyPlan?.nodes||[]).map(n=>n.partId)))parts.get(id).born++;
  for(const [id,p] of parts)if(!census[id]&&p.lost===null&&p.born){p.lost=sim.day;event('part-lost',{part:id,born:p.born})}else if(census[id])p.lost=null;
  // Inheritance and variation among this day's births.
  const varied=births.filter(a=>a.bodyVariation?.attempted&&a.bodyVariation?.accepted&&a.bodyVariation.from!==a.bodyVariation.to).length;
  // Genes (means across the living), sight capability, diversity.
  const genes=Object.fromEntries(GENES.map(g=>[g,round(mean(live.map(a=>a.genes?.[g]).filter(Number.isFinite)))]));
  const sight=live.map(a=>visionProfile(a)),branches=new Set(live.filter(a=>isWildSpecies(a.species)).map(a=>wildBranch(a).id)),plans=new Set(live.map(a=>a.bodyPlan?.id));
  const threat={};for(const [k,v] of Object.entries(sim.stats.threatStages||{}))threat[k]=v-(prevThreat[k]||0);prevThreat={...(sim.stats.threatStages||{})};
  const deaths={};for(const d of dayDeaths){const k=d.species+':'+d.cause;deaths[k]=(deaths[k]||0)+1}
  const row={type:'day',label,arm,day:sim.day,population:live.length,bySpecies,hunters,prey:live.length-hunters,
   births:births.length,variedBirths:varied,deaths,deathAgeMean:round(mean(dayDeaths.map(d=>d.age)),1),
   genes,sight:{range:round(mean(sight.map(s=>s.range)),2),fov:round(mean(sight.map(s=>s.fieldOfView)),1),maxRange:round(Math.max(0,...sight.map(s=>s.range)),1)},
   diversity:{species:Object.keys(bySpecies).length,branches:branches.size,bodyPlans:plans.size,partsPresent:Object.keys(census).length,lineagesAlive:aliveByRoot.size},
   threat,climate:{temp:round(sim.climate?.temp),rain:round(sim.climate?.rain),season:sim.season??null},
   ms:round(ms,1),heapMB:round(process.memoryUsage().heapUsed/1048576,1),rssMB:round(process.memoryUsage().rss/1048576,1)};
  dayDeaths.length=0;
  // Population crash/boom markers (30-day window).
  history.push(live.length);if(history.length>30)history.shift();
  if(history.length===30&&history[0]>=20&&live.length<=history[0]*.6)event('population-crash',{from:history[0],to:live.length});
  if(prevPopulation>0&&live.length===0)event('total-extinction',{});prevPopulation=live.length;
  for(const sp of Object.keys(lastSpecies))if(!bySpecies[sp])event('species-extinct',{species:sp});lastSpecies=bySpecies;
  write(row);
  // Heavier ecology (resources, producer limits, migration, taxa) every N days.
  if(sim.day%ecologyEvery===0){const e=ecologicalObservation(sim);write({type:'ecology',label,arm,day:sim.day,resources:e.resources,producerFlows:e.producerFlows,producerLimits:e.producerLimits,migration:e.migration,lineage:e.lineage,processingCapacity:e.processingCapacity,structures:e.structures,phases:structuredClone(timing.totals),parts:census})}
  // Persistence cost: snapshot time and serialized size (not written to disk).
  // Serialization is skipped above a heap ceiling so the instrument can never
  // exhaust the process; a failure is recorded as a finding, not raised.
  if(sim.day%checkpointEvery===0){const heap=process.memoryUsage().heapUsed,row={type:'checkpoint',label,arm,day:sim.day,animals:sim.animals.length,heapMB:round(heap/1048576,1)};
   try{const t=performance.now(),snap=createSimulationSnapshot(sim,{savedAt:'observatory',reason:'observatory'}),mid=performance.now();row.snapshotMs=round(mid-t,1);
    if(heap<serializeHeapCeilingMB*1048576){row.bytes=serialize(snap).length;row.serializeMs=round(performance.now()-mid,1)}else row.serializeSkipped='heap above ceiling'}
   catch(error){row.error=String(error?.message||error).slice(0,200)}
   write(row)}
 }
 let lastSpecies={};for(const a of sim.animals)if(a.alive)lastSpecies[a.species]=1;
 write({type:'start',schema:OBSERVATORY_SCHEMA,label,arm,seed:sim.seed,day:sim.day,policies:{vision:sim.visionRules??null,marine:sim.marineFoodRules??null,founding:sim.regionalFoundingRules??null,dispersal:sim.regionalDispersalRules??null},population:sim.animals.filter(a=>a.alive).length,lineages:lineages.size});
 return{
  // Call after each completed simulated day.
  onDay(){if(sim.day===lastDay)return;lastDay=sim.day;daily()},
  finish(){sim.kill=originalKill;delete sim.kill;timing.restore();
   const summary={type:'final',label,arm,day:sim.day,seconds:round((performance.now()-started)/1000,1),deathsByCause,eventsDropped,
    parts:Object.fromEntries([...parts].map(([k,v])=>[k,v])),
    lineages:[...lineages.values()].sort((a,b)=>b.births-a.births).slice(0,400),phases:structuredClone(timing.totals)};
   write(summary);return summary}
 };
}
