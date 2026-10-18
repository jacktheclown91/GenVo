import {processingCapacity} from '../src/sim/processing-capacity.js';
// Read-only ecological observations with strict mechanical gates. No population targets.
import assert from 'node:assert/strict';
import {setImmediate as yieldTick} from 'node:timers/promises';
import {Simulation} from '../src/sim/simulation.js';
import {cropYieldCacheStats} from '../src/ecology/dispersal.js';
import {botanicalGenomeCacheStats} from '../src/ecology/botanical-genetics.js';
import {WILD_START,wildStartPlan,wildBranch,isWildSpecies} from '../src/organisms/wild-bodies.js';
import {checkEcologicalIntegrity} from './ecological-integrity.mjs';
export const CANONICAL_HORIZONS=Object.freeze({'GENVO8-TEST-A':640,'GENVO8-TEST-B':320,'GENVO8-TEST-C':640,'GENVO8-TEST-D':320,'GENVO8-TEST-E':640});
const sum=field=>{let total=0;for(const x of field||[])total+=x;return total};
export function ecologicalObservation(sim){
 const living=sim.animals.filter(a=>a.alive),wild=Object.fromEntries(Object.keys(WILD_START).map(kind=>[kind,{alive:0,evolved:0}])),branches=new Set();
 for(const a of living)if(isWildSpecies(a.species)){const r=wild[a.species]??={alive:0,evolved:0};r.alive++;if(a.bodyPlan?.id!==wildStartPlan(a.species).id)r.evolved++;branches.add(wildBranch(a).id)}
 const d=sim.dispersal,f=d.floraState,b=d.botanical;let cohorts=0,seedCells=0;
 for(const cells of Object.values(f.seeds)){seedCells+=cells.size;for(const rows of cells.values())cohorts+=rows.size}
 const migration={states:sim.migration.states.size,statuses:{},reasons:{}};for(const state of sim.migration.states.values()){migration.statuses[state.status]=(migration.statuses[state.status]||0)+1;if(state.reason)migration.reasons[state.reason]=(migration.reasons[state.reason]||0)+1}
 const tree=sim.evolutionTree,producer=sim.world.plantResources;const producerLimits={};for(const [kind,field] of Object.entries(producer.limits)){const counts={};for(const value of field)counts[value]=(counts[value]||0)+1;producerLimits[kind]=counts}
 const resources={};for(const [kind,field] of Object.entries({...sim.world.plants,...sim.world.freshwaterFood,carrion:sim.world.carrion}))resources[kind]=sum(field);
 return{seed:sim.seed,day:sim.day,tick:sim.tickCount,population:sim.population(),processingCapacity:processingCapacity(sim),totalExtinction:living.length===0,births:sim.stats.births,deaths:sim.stats.deaths,deathCauses:{...sim.stats.byCause},extinctions:structuredClone((sim.stats.extinctions||[]).slice(-64)),resources,producerFlows:{...producer.totals},producerLimits,migration,lineage:{taxa:tree.nodes.size,statuses:[...tree.nodes.values()].reduce((out,n)=>{out[n.status]=(out[n.status]||0)+1;return out},{})},recentLineageEvents:structuredClone(tree.events.slice(-32)),climate:{...sim.climate},waterFlows:sim.world.soilWater?{...sim.world.soilWater.totals}:null,recentWaterClosureMax:sim.world.soilWater?.daily?.reduce((max,row)=>Math.max(max,Math.abs(row.closure)),0)??null,waterBudget:sim.world.soilWater?.lastDay?{...sim.world.soilWater.lastDay}:null,wild,branchIds:[...branches].sort(),structures:{animals:sim.animals.length,living:living.length,genomes:f.genomes.size,seedCells,seedCohorts:cohorts,floraBirthHistory:f.births.length,dispersalEvents:d.events.length,flowers:b.flowers.size,pollen:b.pollen.size,embryos:b.embryos.length,botanicalReceipts:b.receipts.length,migrationStates:sim.migration.states.size,lineageEvents:tree.events.length,lineageNodes:tree.nodes.size,producerReceipts:producer.receipts.length},caches:{cropYield:cropYieldCacheStats(d),generatedBotanical:botanicalGenomeCacheStats()},causalLimit:'Observed stocks and receipts; aggregate association alone does not prove a cause.'};
}
const PHASES=['phaseClimate','phaseSoil','phaseVegetation','phasePerception','phaseDecision','phaseMovement','phaseMetabolism','phaseLifecycle'];
export function timeSimulationPhases(sim){
 const totals={},restore=[];
 for(const key of PHASES){const original=sim[key],own=Object.hasOwn(sim,key);totals[key]={calls:0,ms:0};sim[key]=function(...args){const start=performance.now();try{return original.apply(this,args)}finally{totals[key].calls++;totals[key].ms+=performance.now()-start}};restore.push(()=>{if(own)sim[key]=original;else delete sim[key]})}
 return{totals,restore(){for(const fn of restore)fn()}};
}
export async function observeNaturalWorld({seed,days,sim=new Simulation(seed,{player:false}),sampleEvery=20,checkpoints=null,onSample=()=>{},onDay=()=>{},profilePhases=false,collectGc=false,initialPopulation=null}={}){
 assert.ok(Number.isSafeInteger(days)&&days>0,'observation horizon must be a positive integer');
 assert.ok(Number.isSafeInteger(sampleEvery)&&sampleEvery>0,'sample interval must be a positive integer');
 if(checkpoints!==null)assert.ok(Array.isArray(checkpoints)&&checkpoints.every(day=>Number.isSafeInteger(day)&&day>0&&day<=days),'checkpoints must be positive integer completed days within horizon');
 const checkpointDays=checkpoints===null?null:new Set(checkpoints);
 const initial=initialPopulation??sim.animals.filter(a=>a.alive).length,start=performance.now(),timing=profilePhases?timeSimulationPhases(sim):null;assert.ok(Number.isSafeInteger(initial)&&initial>=0,'initial population must be a nonnegative integer');let peak=initial,checkedDays=0,checkpoint=null,checkedInitialTick=false;
 const samples=[];
 const sample=()=>{const heapBeforeGc=process.memoryUsage().heapUsed;if(collectGc&&global.gc)global.gc();const row={...ecologicalObservation(sim),horizon:days,completedDays:checkedDays,seconds:(performance.now()-start)/1000,memory:{...process.memoryUsage(),heapBeforeGc,gcRequested:collectGc,gcCollected:!!(collectGc&&global.gc)},phases:timing?structuredClone(timing.totals):null};samples.push(row);if(samples.length>64)samples.shift();onSample(row);return row};
 try{
  checkEcologicalIntegrity(sim,initial);sample();
  while(sim.day<=days){const day=sim.day,tick=sim.tickCount;sim.update(null);assert.ok(sim.tickCount>tick,'simulation must advance');
   const alive=sim.animals.filter(a=>a.alive).length;peak=Math.max(peak,alive);if(!checkedInitialTick){checkEcologicalIntegrity(sim,initial);checkedInitialTick=true}
   if(sim.day!==day){checkEcologicalIntegrity(sim,initial);checkedDays++;await onDay(sim.day);if(sim.day===321)checkpoint=ecologicalObservation(sim);if((checkpointDays?checkpointDays.has(day):day%sampleEvery===0)||day===days)sample();await yieldTick()}
  }
  const p=sim.population();assert.ok(Object.values(p).every(Number.isFinite),'census values are finite');
  return{schema:'genvo.ecological-observation/1',seed:sim.seed,horizon:days,checkedDays,peak,checkpoint,samples,final:samples.at(-1),integrity:'pass',outcomePolicy:'No mandatory survival, evolved-survivor count, or branch count.',seconds:(performance.now()-start)/1000};
 }finally{timing?.restore()}
}
