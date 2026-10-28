// Multi-region natural field for autonomous evolution. Normal new-world
// constructor, native AUTO and canonical updates only. The single declared
// intervention is the player's itinerary: on day 1 a controlled legal frontier
// placement crosses east through the canonical crossing authority, and on day 2
// a second one returns west. Afterwards both regions are resident and advance in
// synchronized strides with regional dispersal open. No organisms, stocks,
// traits, positions of wildlife, thresholds or targets are touched.
// Usage: node --max-old-space-size=8192 tools/observe-regional-evolution-field.mjs OUTPUT.json SEED DAYS [--policy=autonomous-evolution/3] [--snapshot-days=120,160] [--itinerary=out-back|stay-east]
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {serialize} from 'node:v8';
import {isDeepStrictEqual} from 'node:util';
import {fileURLToPath} from 'node:url';
import {Simulation} from '../src/sim/simulation.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {foreignPopulationKey} from '../src/lineage/regional-reference.js';
import {sourceGraph} from './source-graph.mjs';

const [out,seed,daysArg]=process.argv.slice(2),days=Number(daysArg);
assert.ok(out&&seed&&!fs.existsSync(out)&&Number.isSafeInteger(days)&&days>=3&&days<=640,'Use fresh-OUTPUT.json SEED 3..640');
const root=fileURLToPath(new URL('../',import.meta.url)),{reachable,missing}=sourceGraph(root);assert.equal(missing.length,0);
const hash=createHash('sha256');for(const file of [...reachable].filter(f=>f.startsWith('src/')).sort())hash.update(file).update(fs.readFileSync(path.join(root,file)));
const options={player:true,worldGenerator:'planetary/1',regionalFrontier:true,autonomousPopulations:true,
  autonomousEvolution:process.argv.find(arg=>arg.startsWith('--policy='))?.slice('--policy='.length)||true,
  courtshipSimilarity:true,dayClock:true,metabolism:true,foodProperties:true,tissueWater:true,winterWater:true,escapeLanding:true,tissueEnergy:true,perennialRegrowth:true};
let sim=new Simulation(seed,options);sim.setPlayerAutonomy(true);
const receipt={schema:'genvo.regional-evolution-field/1',seed,requestedDays:days,node:process.version,runtimeFingerprint:hash.digest('hex'),options,
  scope:'Normal constructor and native AUTO; canonical updates only. Declared itinerary: the player takes manual control for one controlled east crossing on day 1 and one west return on day 2 (placement at an approved frontier only), returning to AUTO after each. Wildlife, resources, traits, thresholds and recognition are never touched. Natural-field evidence, not creator acceptance.',
  policies:{populations:sim.autonomousPopulationRules,evolution:sim.autonomousEvolutionRules},itinerary:[],samples:[],status:'running',started:new Date().toISOString()};
const save=()=>fs.writeFileSync(out+'.partial',JSON.stringify(receipt));
function cross(direction){
  // As a player does: take manual control to cross, then hand back to AUTO.
  sim.setPlayerAutonomy(false);
  const actor=sim.player(),visited=new Set([`${sim.world.regionOrigin.x},${sim.world.regionOrigin.y}`]);
  for(let c=8.5;c<118.5;c++){
    // A physical frontier is the region's exact edge line.
    const n=sim.world.n;actor.x=direction==='east'?n:direction==='west'?0:c;actor.y=direction==='south'?n:direction==='north'?0:c;sim.rebuildSpatial();
    const status=planetaryTravelAvailability(sim);if(!status.enabled||status.direction!==direction)continue;
    const trip=crossPlanetaryBorder(sim);if(!trip.ok)continue;
    receipt.itinerary.push({day:sim.day,tick:sim.tickCount,direction,from:[...visited][0],to:`${status.to.x},${status.to.y}`,placement:{x:actor.x,y:actor.y}});
    sim=trip.simulation;sim.setPlayerAutonomy(true);return true;
  }
  sim.setPlayerAutonomy(true);throw Error(`No approved ${direction} crossing for the declared itinerary.`);
}
const regionsOf=s=>[{key:`${s.world.regionOrigin.x},${s.world.regionOrigin.y}`,active:true,mode:'active',
    tick:s.tickCount,day:s.day,animals:s.animals.filter(a=>a.alive).length,stats:{...s.stats},memory:s.populationMemory,speciation:s.speciation,tree:s.evolutionTree},
  ...(s.planetaryTravel?.sessions||[]).map(x=>({key:x.key,active:false,mode:x.biologicalMode,tick:x.snapshot.core.tickCount,day:x.snapshot.core.day,
    animals:x.snapshot.animals.filter(a=>a.alive).length,stats:{...x.snapshot.core.stats},memory:x.snapshot.controllers.populationMemory,
    speciation:x.snapshot.controllers.speciation,tree:x.snapshot.controllers.evolutionTree,emigrants:x.biologicalLedger?.emigrants||0}))];
function sample(){
  const regions=regionsOf(sim).map(r=>{
    const records=[...(r.memory?.natural?.records?.values?.()||[])];
    const established=records.filter(x=>x.establishedDay!==null&&!['extinct','abandoned','merged'].includes(x.status));
    const probe={world:{regionOrigin:Object.fromEntries(r.key.split(',').map((v,i)=>[i?'y':'x',Number(v)]))}};
    const states=[...(r.speciation?.states?.values?.()||[])].filter(st=>st.lastSnapshot);
    const gates={};let foreign=0,qualified=0,best=0;
    for(const st of states){const e=st.lastSnapshot;best=Math.max(best,e.progress||0);if(e.qualified)qualified++;
      if(e.referencePopulationKey&&foreignPopulationKey(probe,e.referencePopulationKey))foreign++;
      for(const [g,ok] of Object.entries(e.gates||{}))gates[g]=(gates[g]||0)+(ok?1:0)}
    const nodes=[...(r.tree?.nodes?.values?.()||[])],formed=(r.tree?.events||[]).filter(e=>e.type==='formed'||e.type==='re-recognized').length;
    return{key:r.key,mode:r.mode,tick:r.tick,day:r.day,animals:r.animals,births:r.stats.births||0,deaths:r.stats.deaths||0,deathCauses:{...(r.stats.byCause||{})},emigrants:r.emigrants??null,
      candidates:records.filter(x=>x.establishedDay===null&&!['extinct','abandoned','merged'].includes(x.status)).length,established:established.length,
      establishedKeys:established.map(x=>({key:x.key,members:x.memberIds?.size??0,parents:x.parentPopulationKeys||[],source:x.sourcePopulationKey??null})),
      evaluated:states.length,qualified,foreignReferences:foreign,bestProgress:+best.toFixed(4),gatePasses:gates,
      recognized:states.filter(st=>st.recognized).length,treeNodes:nodes.length,recognitionEvents:formed,
      evidence:states.map(st=>({key:st.populationKey,day:st.lastSnapshot.day,progress:+(st.lastSnapshot.progress||0).toFixed(4),reference:st.lastSnapshot.referencePopulationKey||null,
        distance:+(st.lastSnapshot.distance||0).toFixed(2),separation:+(st.lastSnapshot.separation||0).toFixed(4),cohort:st.lastSnapshot.cohort,traitDepth:st.lastSnapshot.traitDepth,
        localBirths:st.lastSnapshot.localBirths,unknownBirths:st.lastSnapshot.unknownBirths??null,gates:st.lastSnapshot.gates||null}))};
  });
  receipt.samples.push({day:sim.day,tick:sim.tickCount,elapsedMs:Math.round(performance.now()-started),regions});
}
const started=performance.now();
const runDay=()=>{const day=sim.day;while(sim.day===day){const before=sim.tickCount;sim.update(null);if(sim.tickCount===before)throw Error(`Canonical update stopped at tick ${before} (paused ${sim.paused}).`)}};
try{
  const itinerary=process.argv.find(arg=>arg.startsWith('--itinerary='))?.slice(12)||'out-back';
  assert.ok(['out-back','stay-east'].includes(itinerary));receipt.itineraryPlan=itinerary;
  runDay();cross('east');runDay();if(itinerary==='out-back')cross('west');
  receipt.regionsAfterItinerary=regionsOf(sim).map(r=>({key:r.key,mode:r.mode,animals:r.animals}));
  const snapshotDays=new Set((process.argv.find(arg=>arg.startsWith('--snapshot-days='))?.slice(16)||'').split(',').filter(Boolean).map(Number));
  while(sim.day<=days){runDay();sample();if(snapshotDays.has(sim.day))fs.writeFileSync(`${out}.day${sim.day}.v8`,serialize(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'regional-evolution-field'})));if(sim.day%10===0){save();console.log(JSON.stringify({day:sim.day,elapsedMin:Math.round((performance.now()-started)/60000),regions:receipt.samples.at(-1).regions.map(r=>[r.key,r.animals,r.established,r.evaluated,r.foreignReferences,r.recognized])}))}}
  receipt.status='completed';
  // Strict persistence: the terminal world restores and continues with identical values.
  const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'regional-evolution-field'}));
  const terminal=snap(sim),restored=restoreSimulationSnapshot(structuredClone(terminal));
  receipt.restoreExact=isDeepStrictEqual(snap(restored),terminal);
  for(let i=0;i<6;i++){sim.update(null);restored.update(null)}
  receipt.continuationExact=isDeepStrictEqual(snap(restored),snap(sim));
  fs.writeFileSync(out+'.v8',serialize(terminal));
}catch(error){receipt.status='failed';receipt.failure=error.stack}
finally{receipt.finished=new Date().toISOString();receipt.elapsedMs=Math.round(performance.now()-started);fs.writeFileSync(out,JSON.stringify(receipt,null,1));if(fs.existsSync(out+'.partial'))fs.rmSync(out+'.partial');
  console.log(JSON.stringify({status:receipt.status,day:sim.day,restoreExact:receipt.restoreExact,continuationExact:receipt.continuationExact,failure:receipt.failure?.slice(0,300)}))}
