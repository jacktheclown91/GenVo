// Natural recruitment audit. Inspect detached snapshots so diagnostic queries
// cannot influence live RNG, controller caches, decisions or ecological results.
import fs from 'node:fs';
import v8 from 'node:v8';
import assert from 'node:assert/strict';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
const seed=process.argv[2]||'GENVO8-TEST-E',days=Number(process.argv[3]||1400),out=process.argv[4]||'reports/cohort-demography.json';
assert.ok(Number.isInteger(days)&&days>0);
const flags=process.argv.slice(5),canonicalRoot=fileURLToPath(new URL('../../src',import.meta.url));
const sourceRoot=path.resolve(flags.find(x=>x.startsWith('--source-root='))?.slice(14)||canonicalRoot);
const checkpoint=flags.find(x=>x.startsWith('--checkpoint='))?.slice(13);
assert.ok(flags.every(x=>x.startsWith('--source-root=')||x.startsWith('--checkpoint=')||x==='--dispersal-audit'||x==='--perceived-dispersal-audit'),'unknown audit flag');
const sourceImport=file=>import(pathToFileURL(path.join(sourceRoot,file)).href);
const {Simulation}=await sourceImport('sim/simulation.js'),{SPECIES}=await sourceImport('organisms/species.js');
const {createSimulationSnapshot,restoreSimulationSnapshot}=await sourceImport('persistence/save-manager.js');
const {forageRangeEffect}=await sourceImport('lineage/effects.js');
const hash=crypto.createHash('sha256');
function hashSource(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const file=path.join(dir,e.name);if(e.isDirectory())hashSource(file);else hash.update(path.join(canonicalRoot,path.relative(sourceRoot,file))).update(fs.readFileSync(file))}}
hashSource(sourceRoot);const sourceFingerprint=hash.digest('hex');
const saved=checkpoint?v8.deserialize(fs.readFileSync(checkpoint)):null;
if(saved){assert.equal(saved.contract?.sourceFingerprint,sourceFingerprint,'checkpoint audit requires identical source');assert.ok(saved.snapshot,'checkpoint has no active world snapshot')}
const sim=saved?restoreSimulationSnapshot(saved.snapshot):new Simulation(seed,{player:false}),timeline=[];
assert.equal(sim.seed,seed,'checkpoint is for another seed');
const metadata={seed,days,sourceFingerprint,checkpointOnly:!!checkpoint};
let next=1;
function observe(){
  const copy=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim)));
  const rows=copy.animals.filter(a=>a.alive).map(a=>{
    const spec=SPECIES[a.species],cohort=copy.animals.filter(b=>b.alive&&b.species===a.species);
    const candidates=cohort.filter(b=>b!==a&&b.sex!==a.sex&&b.age>=spec.maturity&&b.reproCooldown<=0&&!b.pregnant);
    const kin={none:0,sibling:0,direct:0,close:0};let reachable=0;
    for(const b of candidates){kin[copy.recovery.kinship(a,b)]++;if(copy.canReach(a,b.x,b.y))reachable++}
    const target=a.target&&Number.isFinite(a.target.x)&&Number.isFinite(a.target.y)?{id:a.target.id??null,x:a.target.x,y:a.target.y,distance:Math.hypot(a.x-a.target.x,a.y-a.target.y),reachable:copy.canReach(a,a.target.x,a.target.y),occupiable:copy.canOccupy(a,a.target.x,a.target.y)}:null;
    let dispersal=null;
    if((flags.includes('--dispersal-audit')||flags.includes('--perceived-dispersal-audit'))&&a.species==='rootling'&&a.age>=spec.maturity&&a.energy/spec.maxEnergy>.72&&a.reproCooldown<=0&&!a.pregnant){
      const here=copy.carrying.breedingState(a),perceived=flags.includes('--perceived-dispersal-audit'),radius=perceived?9*a.genes.senses*forageRangeEffect(copy,a):24,step=perceived?2:8;let best=null,candidatesTested=0;
      if(!here.allowed)for(let oy=-Math.ceil(radius);oy<=radius;oy+=step)for(let ox=-Math.ceil(radius);ox<=radius;ox+=step){
        const x=a.x+ox,y=a.y+oy;if(Math.hypot(ox,oy)<(perceived?2:8)||perceived&&Math.hypot(ox,oy)>radius||!copy.world.isPlayable(x,y)||!copy.canOccupy(a,x,y)||!copy.canReach(a,x,y))continue;
        candidatesTested++;const quality=copy.carrying.breedingState({...a,x,y});
        if(quality.allowed&&quality.ratio<here.ratio&&(!best||quality.ratio<best.ratio))best={x,y,ratio:quality.ratio,resourceValue:quality.resourceValue,distance:Math.hypot(ox,oy)};
      }
      dispersal={blocked:!here.allowed,radius,perceived,candidatesTested,best,hypotheticalOnly:true};
    }
    return {id:a.id,species:a.species,sex:a.sex,age:a.age,x:a.x,y:a.y,region:copy.world.regionAt(a.x,a.y),energy:a.energy/spec.maxEnergy,health:a.health,hydration:a.hydration/spec.maxHydration,infected:!!a.infected,cooldown:a.reproCooldown,pregnant:!!a.pregnant,drive:a.reproDrive||0,intent:a.intent,target,dispersal,carrying:copy.carrying.breedingState(a),mate:copy.autonomousMateTarget(a,{far:true})?.id??null,candidates:candidates.length,reachable,kin};
  });
  timeline.push({day:sim.day,population:sim.population(),births:sim.stats.births,deaths:sim.stats.deaths,byCause:{...sim.stats.byCause},rows});
  fs.writeFileSync(out,JSON.stringify({...metadata,complete:false,timeline},null,2));
}
if(!checkpoint)while(sim.day<=days){sim.update(null);if(sim.day>=next){next+=100;observe()}}
observe();
fs.writeFileSync(out,JSON.stringify({...metadata,complete:true,timeline},null,2));
fs.writeFileSync(out+'.bin',v8.serialize(createSimulationSnapshot(sim)));
console.log(JSON.stringify({seed,day:sim.day,population:sim.population(),births:sim.stats.births,byCause:sim.stats.byCause}));
