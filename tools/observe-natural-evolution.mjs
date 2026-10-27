// Passive observation of normal new-world ecology. No staged breeding or targets.
// Usage: node --expose-gc tools/observe-natural-evolution.mjs OUTPUT.json SEED DAYS balanced|original [--verify-observer]
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {serialize} from 'node:v8';
import assert from 'node:assert/strict';
import {setImmediate as yieldTurn} from 'node:timers/promises';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {CFG} from '../src/sim/config.js';
import {appearanceDistance} from '../src/reproduction/mate-preferences.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {snapshotSignature} from './snapshot-signature.mjs';
import {checkEcologicalIntegrity} from './ecological-integrity.mjs';
import {sourceGraph} from './source-graph.mjs';
import {installFoundingObservation} from './founding-observation.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
function runtimeFingerprint(){
  const {reachable,missing}=sourceGraph(root);assert.equal(missing.length,0);
  const hash=createHash('sha256');
  for(const file of [...reachable].filter(file=>file.startsWith('src/')).sort())hash.update(file).update(fs.readFileSync(path.join(root,file)));
  return hash.digest('hex');
}
const initialRuntime=runtimeFingerprint();

const [out,seed,daysArg,mode]=process.argv.slice(2),days=Number(daysArg);
assert.ok(out&&seed&&!fs.existsSync(out));
assert.ok(Number.isSafeInteger(days)&&days>0&&days<=640);
assert.ok(['balanced','original'].includes(mode));
const verify=process.argv.includes('--verify-observer');
const verifyTicks=Number(process.argv.find(arg=>arg.startsWith('--verify-ticks='))?.split('=')[1]||96);
assert.ok(Number.isSafeInteger(verifyTicks)&&verifyTicks>0&&verifyTicks<=76800);
const options={player:true,worldGenerator:'planetary/1',regionalFrontier:true,
  autonomousPopulations:process.argv.find(arg=>arg.startsWith('--autonomous-policy='))?.slice('--autonomous-policy='.length)??(process.argv.includes('--autonomous-populations-v1')?'autonomous-populations/1':process.argv.includes('--autonomous-populations')),
  courtshipSimilarity:mode==='balanced',dayClock:true,metabolism:true,foodProperties:true,
  tissueWater:true,winterWater:true,escapeLanding:true,tissueEnergy:true,perennialRegrowth:true};
const sim=new Simulation(seed,options);
sim.setPlayerAutonomy(true);
const started=performance.now(),initialPopulation=sim.animals.filter(a=>a.alive).length;
const births=new Map(),depth=new Map(sim.animals.map(a=>[a.id,1]));
const mating={calls:0,completedDisplays:0,refusals:0,accepted:0,conceptions:0,crossTaxonConceptions:0,
  bins:Array.from({length:5},()=>({attempts:0,accepted:0,conceptions:0,crossTaxon:0})),events:[]};
const receipt={schema:'genvo.natural-evolution/1',seed,mode,requestedDays:days,verificationOnly:verify,verifyTicks:verify?verifyTicks:null,node:process.version,
  runtimeFingerprint:initialRuntime,observerSha256:createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).digest('hex'),
  scope:'Normal new-game constructor and native AUTO; canonical updates only. No injected organisms, stock edits, teleportation, forced traits, scripted isolation or speciation targets. Normal constructor founder/mate preparation is retained identically in both policies.',
  options,samples:[],mating,births:[],deaths:[],status:'running'};
const foundingObservation=installFoundingObservation(sim);
receipt.foundingDiagnostics=foundingObservation.diagnostics;
receipt.autonomousPopulationPolicy=sim.autonomousPopulationRules??null;
receipt.foundingObserverSha256=createHash('sha256').update(fs.readFileSync(new URL('./founding-observation.mjs',import.meta.url))).digest('hex');
const originalMate=sim.tryMate,originalBirth=sim.family.registerBirth,originalKill=sim.kill;
sim.tryMate=function(a,b){
  const previousAttempt=a.lastReproductiveAttempt,previousRefusal=a.lastCourtshipRefusal;
  const display=!!(a.completedCourtship?.partnerId===b.id&&this.tickCount<=a.completedCourtship.endsAt+CFG.lifeStride);
  const distance=appearanceDistance(a,b,{assortment:true}),sameTaxon=this.evolutionTree.sameTaxon(a,b);
  const result=originalMate.call(this,a,b);
  mating.calls++;
  const attempt=a.lastReproductiveAttempt!==previousAttempt&&a.lastReproductiveAttempt?.tick===this.tickCount;
  const refusal=a.lastCourtshipRefusal!==previousRefusal&&a.lastCourtshipRefusal?.tick===this.tickCount;
  if(attempt||refusal){
    mating.completedDisplays+=Number(display);mating.refusals+=Number(refusal);mating.accepted+=Number(attempt);
    const bin=mating.bins[Math.min(4,Math.floor(distance*5))];
    bin.attempts++;bin.accepted+=Number(attempt);bin.conceptions+=Number(!!result);
    bin.crossTaxon+=Number(!!result&&!sameTaxon);
    mating.events.push({day:this.day,tick:this.tickCount,parents:[a.id,b.id],distance,sameTaxon,display,
      accepted:!!attempt,conceived:!!result,preferenceSimilarity:[a.matePreferences?.similarity??null,b.matePreferences?.similarity??null]});
  }
  if(result){mating.conceptions++;mating.crossTaxonConceptions+=Number(!sameTaxon)}
  return result;
};
sim.family.registerBirth=function(child,mother,father){
  const result=originalBirth.call(this,child,mother,father);
  const parentDepth=[depth.get(mother?.id),depth.get(father?.id)];
  const generation=parentDepth.every(Number.isFinite)?1+Math.max(...parentDepth):null;
  if(generation!==null)depth.set(child.id,generation);
  births.set(child.id,{id:child.id,species:child.species,parents:[mother?.id??null,father?.id??null],
    bornDay:sim.day,bornTick:sim.tickCount,ancestryDepth:generation,authorityGeneration:child.generation??null,
    lineage:!!child.lineage,bodyPlan:child.bodyPlan?.id??null,parts:child.bodyPlan?.nodes?.map(n=>n.partId)??[],
    bornWith:[...(child.bornWith||[])],variationSource:child.birthVariationSource??null,
    genes:{...child.genes},maturedDay:null,diedDay:null,cause:null});
  return result;
};
sim.kill=function(animal,cause){
  const before={id:animal.id,species:animal.species,lineage:!!animal.lineage,day:this.day,
    age:animal.age,energy:animal.energy,hydration:animal.hydration,health:animal.health,cause};
  const alive=animal.alive,result=originalKill.call(this,animal,cause);
  const row=births.get(animal.id);
  if(alive&&!animal.alive)receipt.deaths.push(before);
  if(alive&&!animal.alive&&row){row.diedDay=this.day;row.cause=cause}
  return result;
};

function census(){
  const living=sim.animals.filter(a=>a.alive),population={},bodyPlans={},parts={},geography={};
  const lineageParts={},lineageBodyPlans={};
  let maxAncestryDepth=1,lineage=0;
  for(const a of living){
    population[a.species]=(population[a.species]||0)+1;
    maxAncestryDepth=Math.max(maxAncestryDepth,depth.get(a.id)||1);lineage+=Number(!!a.lineage);
    const plan=a.bodyPlan?.id??'none';bodyPlans[plan]=(bodyPlans[plan]||0)+1;
    for(const part of a.bodyPlan?.nodes||[])parts[part.partId]=(parts[part.partId]||0)+1;
    if(a.lineage){
      lineageBodyPlans[plan]=(lineageBodyPlans[plan]||0)+1;
      for(const part of a.bodyPlan?.nodes||[])lineageParts[part.partId]=(lineageParts[part.partId]||0)+1;
    }
    const key=`${a.species}:${Math.min(3,Math.max(0,Math.floor(a.x/32)))},${Math.min(3,Math.max(0,Math.floor(a.y/32)))}`;
    const g=geography[key]??={count:0,genes:{},plans:{}};g.count++;
    g.plans[plan]=(g.plans[plan]||0)+1;
    for(const [name,value] of Object.entries(a.genes))if(Number.isFinite(value)){
      const gene=g.genes[name]??={sum:0,sumSquares:0,count:0};gene.sum+=value;gene.sumSquares+=value*value;gene.count++;
    }
    const child=births.get(a.id);
    if(child&&child.maturedDay===null&&a.age>=SPECIES[a.species].maturity)child.maturedDay=sim.day;
  }
  return{tick:sim.tickCount,day:sim.day,year:sim.year,live:living.length,lineage,maxAncestryDepth,population,bodyPlans,parts,lineageBodyPlans,lineageParts,geography,
    births:sim.stats.births,deaths:sim.stats.deaths,causes:{...sim.stats.byCause},
    recognizedStates:[...sim.speciation.states.values()].map(state=>structuredClone(state)),
    taxa:[...sim.evolutionTree.nodes.values()].map(node=>({id:node.id,status:node.status,formedDay:node.formedDay,endedDay:node.endedDay,recognitions:node.recognitions})),
    pressureHistories:[...sim.populationMemory.histories.entries()].map(([key,value])=>[key,structuredClone(value)]),
    populationCenters:structuredClone(sim.generationProgress.populationCenters),
    naturalPopulations:[...(sim.populationMemory.natural?.records.values()||[])].map(record=>structuredClone({
      ...record,members:[...record.members],memberIds:[...record.memberIds],everMembers:[...record.everMembers],
      recruits:[...record.recruits],litters:[...record.litters]})),
    naturalPopulationEvents:structuredClone(sim.populationMemory.natural?.events||[]),
    seconds:(performance.now()-started)/1000,memory:process.memoryUsage()};
}
function checkpoint(status='running'){
  receipt.status=status;receipt.mating=mating;receipt.births=[...births.values()];
  fs.writeFileSync(out,JSON.stringify(receipt,null,2)+'\n');
}
function removeObservers(){delete sim.tryMate;delete sim.kill;delete sim.family.registerBirth;foundingObservation.remove()}
try{
  receipt.samples.push(census());checkpoint();
  const endTick=verify?sim.tickCount+verifyTicks:Infinity;
  while(sim.day<=days&&sim.tickCount<endTick){
    const previousDay=sim.day,previousTick=sim.tickCount;
    sim.update(null);
    assert.ok(sim.tickCount>previousTick,'Canonical world must advance without forced unpausing');
    if(sim.day!==previousDay){
      // Daily tracking preserves juvenile survival even between larger report samples.
      const row=census();checkEcologicalIntegrity(sim,initialPopulation);
      if((sim.day-1)%10===0||sim.day>days){
        receipt.samples.push(row);checkpoint();
        console.log(JSON.stringify({seed,mode,day:sim.day,tick:sim.tickCount,live:row.live,lineage:row.lineage,maxDepth:row.maxAncestryDepth,births:sim.stats.births,conceptions:mating.conceptions,naturalEstablished:row.naturalPopulations.filter(p=>p.establishedDay!==null).length,naturalRegionalSources:row.naturalPopulations.filter(p=>p.establishedDay!==null&&p.scope==='regional-source').length,naturalLocalCommunities:row.naturalPopulations.filter(p=>p.establishedDay!==null&&p.scope!=='regional-source').length,seconds:row.seconds,heap:row.memory.heapUsed}));
      }
      await yieldTurn();
    }
  }
  receipt.samples.push(census());removeObservers();
  const snapshot=createSimulationSnapshot(sim,{savedAt:'fixed',reason:'natural-evolution'});
  fs.writeFileSync(out+'.snapshot.v8',serialize(snapshot));
  receipt.completeStateSha256=snapshotSignature(snapshot);
  if(verify){
    const control=new Simulation(seed,options);control.setPlayerAutonomy(true);
    while(control.tickCount<sim.tickCount)control.update(null);
    assert.deepEqual(createSimulationSnapshot(control,{savedAt:'fixed',reason:'natural-evolution'}),snapshot);
    receipt.observerParity={scope:'Complete original/control snapshot equal',ticks:sim.tickCount,calls:mating.calls,conceptions:mating.conceptions,births:births.size};
  }else{
    const restored=restoreSimulationSnapshot(structuredClone(snapshot));
    for(let tick=0;tick<6;tick++){sim.update(null);restored.update(null)}
    assert.deepEqual(createSimulationSnapshot(restored,{savedAt:'fixed',reason:'natural-evolution'}),createSimulationSnapshot(sim,{savedAt:'fixed',reason:'natural-evolution'}));
    receipt.saveContinuation='Complete snapshot and six-tick restored continuation equal';
  }
  assert.equal(runtimeFingerprint(),initialRuntime,'Runtime source must remain unchanged throughout the observation');
  checkpoint('complete');
}catch(error){
  receipt.error=error.stack;removeObservers();checkpoint('failed');
  // Keep strict failure evidence without dumping the entire ecosystem graph.
  throw Error(`Natural observation failed; see ${out}: ${String(error.message).split('\n')[0]}`);
}
