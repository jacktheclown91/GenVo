// Natural, unassisted ecology validation. Each completed seed is saved immediately.
// node tools/ecology-validation.mjs [days=3000] [seeds=8] [output.json] [start=0]
// Optional: --checkpoint=path.bin, --resume, --stop-at=day (intentional incomplete exit).
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import crypto from 'node:crypto';
import v8 from 'node:v8';
import {checkEcologicalIntegrity} from './ecological-integrity.mjs';
import {fileURLToPath} from 'node:url';
const days=Number(process.argv[2]||3000),seeds=Number(process.argv[3]||8),out=process.argv[4]||'reports/pass-a-long-ecology.json';
const start=Number(process.argv[5]||0);
assert.ok(Number.isInteger(days)&&days>0&&Number.isInteger(seeds)&&seeds>0);
const flags=process.argv.slice(6),resume=flags.includes('--resume');
const canonicalRoot=fileURLToPath(new URL('../src',import.meta.url));
const sourceRoot=path.resolve(flags.find(x=>x.startsWith('--source-root='))?.slice(14)||canonicalRoot);
const {pathToFileURL}=await import('node:url');
const sourceImport=file=>import(pathToFileURL(path.join(sourceRoot,file)).href);
const {Simulation}=await sourceImport('sim/simulation.js');
const {createSimulationSnapshot,restoreSimulationSnapshot}=await sourceImport('persistence/save-manager.js');
const {CFG}=await sourceImport('sim/config.js');
const {SPECIES}=await sourceImport('organisms/species.js');
const checkpoint=flags.find(x=>x.startsWith('--checkpoint='))?.slice(13);
const stopAt=Number(flags.find(x=>x.startsWith('--stop-at='))?.slice(10)??Infinity);
assert.ok(!resume||checkpoint,'--resume requires --checkpoint=path');
assert.ok(stopAt===Infinity||(Number.isInteger(stopAt)&&stopAt>0),'stop day must be a positive integer');
assert.ok(flags.every(x=>x==='--resume'||x.startsWith('--checkpoint=')||x.startsWith('--stop-at=')||x.startsWith('--source-root=')),'unknown validation flag');
const hash=crypto.createHash('sha256');
function hashDirectory(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const file=path.join(dir,entry.name);if(entry.isDirectory())hashDirectory(file);else hash.update(path.join(canonicalRoot,path.relative(sourceRoot,file))).update(fs.readFileSync(file))}}
hashDirectory(sourceRoot);
const sourceFingerprint=hash.digest('hex'),contract={days,seeds,start,sourceFingerprint};
// Wall-clock observations stay separate from deterministic ecological receipts.
const progressPath=out+'.progress.json',segmentStarted=performance.now();
let lastProgressAt=segmentStarted,segmentUpdates=0,worldStartedAt=segmentStarted,worldStartTick=0,worldStartDay=1,lastSim=null,lastSeed=null;
function reportProgress(sim,seed,{complete=false,jobComplete=false}={}){
  const now=performance.now(),elapsedSeconds=(now-segmentStarted)/1000,worldElapsedSeconds=(now-worldStartedAt)/1000;
  const row={schema:1,sourceFingerprint,contract,resumed:resume,observedAt:new Date().toISOString(),timingScope:'current process invocation; excludes prior checkpoint execution',seed,day:sim?.day??null,tick:sim?.tickCount??null,completedWorlds:result.runs.length,complete,jobComplete,elapsedSeconds,worldElapsedSeconds,updates:segmentUpdates,updatesPerSecond:elapsedSeconds>0?segmentUpdates/elapsedSeconds:null,worldUpdatesPerSecond:sim&&worldElapsedSeconds>0?(sim.tickCount-worldStartTick)/worldElapsedSeconds:null,worldDaysPerSecond:sim&&worldElapsedSeconds>0?(sim.day-worldStartDay)/worldElapsedSeconds:null,population:sim?.population()??null,memoryBytes:process.memoryUsage(),resourceObservation:result.current?.seed===seed?result.current.timeline?.at(-1)??null:result.runs.find(r=>r.seed===seed)?.timeline?.at(-1)??null};
  fs.writeFileSync(progressPath,JSON.stringify(row,null,2));
  console.log(JSON.stringify({type:'progress',seed,day:row.day,elapsedSeconds,worldUpdatesPerSecond:row.worldUpdatesPerSecond,population:row.population,jobComplete}));
  lastProgressAt=now;
}
const saved=resume?v8.deserialize(fs.readFileSync(checkpoint)):null;
if(saved)assert.deepEqual(saved.contract,contract,'checkpoint requires identical source, horizon and seed range');
const result=saved?.result??{days,seeds,start,sourceFingerprint,player:false,config:structuredClone(CFG.wildHunt),runs:[],complete:false};
function persist(state){fs.writeFileSync(out,JSON.stringify(result,null,2));if(checkpoint){const tmp=checkpoint+'.tmp';fs.writeFileSync(tmp,v8.serialize({contract,result,...state}));fs.renameSync(tmp,checkpoint)}}
function ecologyObservation(sim){
  checkEcologicalIntegrity(sim,Object.values(CFG.initial).reduce((n,v)=>n+v,0));
  // Read-only census: no diagnostic decisions, RNG draws or food harvesting.
  const resources={};for(const [kind,field] of Object.entries({...sim.world.plants,...sim.world.freshwaterFood,carrion:sim.world.carrion})){
    let total=0;for(const value of field)total+=value;resources[kind]=total;
  }
  const regions={},migrations={};for(const a of sim.animals){if(!a.alive)continue;
    const key=String(sim.world.regionAt(a.x,a.y)),row=regions[key]??={};row[a.species]=(row[a.species]||0)+1;
    const state=sim.migration.states.get(a.id);if(state?.status==='outbound'||state?.status==='returning')migrations[a.species]=(migrations[a.species]||0)+1;
  }
  return{resources,regions,migrations};
}
for(let k=saved?.k??0;k<seeds;k++){
  const index=k+start,seed=index<3?['GENVO8-TEST-A','GENVO8-TEST-C','GENVO8-TEST-E'][index]:`ARMS-${index-3}`;
  const current=saved?.k===k?saved:null;
  const integrityCoverage=current?.integrityCoverage??(current?'resumed-unverified-prior-segment':'all-recorded-censuses');
  const sim=current?.snapshot?restoreSimulationSnapshot(current.snapshot):new Simulation(seed,{player:false}),deaths=current?.deaths??{},timeline=current?.timeline??[];
  const kill=sim.kill.bind(sim);
  sim.kill=(a,cause,...args)=>{if(a?.alive){const key=`${a.species}:${cause}`;deaths[key]=(deaths[key]||0)+1}return kill(a,cause,...args)};
  lastSim=sim;lastSeed=seed;worldStartedAt=performance.now();worldStartTick=sim.tickCount;worldStartDay=sim.day;reportProgress(sim,seed);
  let peak=current?.peak??0,next=current?.next??1;
  while(sim.day<=days){const tick=sim.tickCount;sim.update(null);segmentUpdates++;if(performance.now()-lastProgressAt>=30000)reportProgress(sim,seed);assert.ok(sim.tickCount>tick,'simulation stopped advancing');peak=Math.max(peak,Object.values(sim.population()).reduce((a,b)=>a+b,0));if(sim.day>=next||sim.day>=stopAt){timeline.push({day:sim.day,population:sim.population(),births:sim.stats.births,deaths:sim.stats.deaths,...ecologyObservation(sim)});if(sim.day>=next)next+=100;result.current={seed,peak,deaths,timeline};persist({k,peak,next,deaths,timeline,integrityCoverage,snapshot:checkpoint?createSimulationSnapshot(sim):null});if(sim.day>=stopAt){reportProgress(sim,seed);console.log(JSON.stringify({checkpoint,seed,day:sim.day,complete:false}));process.exit(2)}}}
  const population=sim.population(),belowRecovery=Object.entries(SPECIES).filter(([sp,s])=>population[sp]<Math.max(2,Math.floor(CFG.initial[sp]*(s.recovery?.criticalRatio??.42)))).map(([sp])=>sp);
  const run={seed,day:sim.day,population,peak,births:sim.stats.births,deaths,belowRecovery,timeline,integrityCoverage};
  result.runs.push(run);delete result.current;persist({k:k+1});reportProgress(sim,seed,{complete:true});
  console.log(JSON.stringify({seed,day:run.day,population,peak,belowRecovery}));
}
delete result.current;result.complete=true;delete result.passed;
result.validationPolicy='ecological-integrity-v1';
result.automatedIntegrityPassed=result.runs.every(r=>r.integrityCoverage==='all-recorded-censuses');
result.ecologicalAcceptance='pending-causal-persistence-and-runtime-review';
result.performanceDiagnostics=result.runs.map(r=>({seed:r.seed,peak:r.peak,aboveExpectedPopulation:r.peak>CFG.performanceTarget,reachedEmergencyCeiling:r.peak>=CFG.maxAnimals}));
persist({k:seeds});
reportProgress(lastSim,lastSeed,{complete:true,jobComplete:true});
