// Observe ordinary simulation updates without drawing RNG or injecting actors.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
const seed=process.argv[2]||'GENVO8-TEST-A',days=Number(process.argv[3]||640),out=process.argv[4]||'reports/daily-ecology.json';
assert.ok(Number.isInteger(days)&&days>0);
const canonicalRoot=fileURLToPath(new URL('../../src',import.meta.url));
const sourceRoot=path.resolve(process.argv.slice(5).find(x=>x.startsWith('--source-root='))?.slice(14)||canonicalRoot);
const sourceImport=file=>import(pathToFileURL(path.join(sourceRoot,file)).href);
const {Simulation}=await sourceImport('sim/simulation.js'),{SPECIES}=await sourceImport('organisms/species.js'),{CFG}=await sourceImport('sim/config.js');
const hash=crypto.createHash('sha256');
function hashSource(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const file=path.join(dir,e.name);if(e.isDirectory())hashSource(file);else hash.update(path.join(canonicalRoot,path.relative(sourceRoot,file))).update(fs.readFileSync(file))}}
hashSource(sourceRoot);
const sim=new Simulation(seed,{player:false}),result={seed,days,sourceRoot,sourceFingerprint:hash.digest('hex'),config:structuredClone(CFG.wildHunt),complete:false,timeline:[]};
const newEvents=()=>({hunts:{},deaths:{},births:{},meals:{},conceptions:0,parentConceptionCost:0,parentBirthCost:0,newbornEnergy:0});
let events=newEvents(),observedDay=sim.day;
const stage=a=>a.age<SPECIES[a.species].maturity?'young':'adult';
const hunt=sim.tryKill.bind(sim),kill=sim.kill.bind(sim),birth=sim.giveBirth.bind(sim),mate=sim.tryMate.bind(sim),interact=sim.resolveInteraction.bind(sim);
sim.tryKill=(pred,prey,...args)=>{
  const alive=!!prey?.alive,before=pred?.energy||0,key=`${pred?.species}:${pred?stage(pred):'unknown'}>${prey?.species}:${prey?stage(prey):'unknown'}`;
  const row=events.hunts[key]??={attempts:0,invalidTargets:0,hits:0,kills:0,energyChange:0};row.attempts++;if(!alive)row.invalidTargets++;
  const hit=hunt(pred,prey,...args);if(hit)row.hits++;if(alive&&!prey.alive)row.kills++;row.energyChange+=(pred?.energy||0)-before;return hit;
};
sim.kill=(a,cause,...args)=>{if(a?.alive){const key=`${a.species}:${cause}`;events.deaths[key]=(events.deaths[key]||0)+1}return kill(a,cause,...args)};
sim.giveBirth=(mother,...args)=>{const energy=mother.energy,children=birth(mother,...args);events.parentBirthCost+=energy-mother.energy;events.newbornEnergy+=children.reduce((n,a)=>n+a.energy,0);events.births[mother.species]=(events.births[mother.species]||0)+children.length;return children};
sim.tryMate=(a,b,...args)=>{const before=a.energy+b.energy,ok=mate(a,b,...args);if(ok){events.conceptions++;events.parentConceptionCost+=before-a.energy-b.energy}return ok};
sim.resolveInteraction=a=>{const kind=a.target?.kind,before=a.energy,result=interact(a);if(kind&&a.energy>before){const key=`${a.species}:${kind}`,row=events.meals[key]??={meals:0,energyGain:0};row.meals++;row.energyGain+=a.energy-before}return result};
function observe(day){
  const cohorts={};for(const [species,s] of Object.entries(SPECIES)){const live=sim.animals.filter(a=>a.alive&&a.species===species),n=Math.max(1,live.length);cohorts[species]={count:live.length,young:live.filter(a=>a.age<s.maturity).length,meanEnergy:live.reduce((sum,a)=>sum+a.energy/s.maxEnergy,0)/n,meanHealth:live.reduce((sum,a)=>sum+a.health,0)/n,pregnant:live.filter(a=>a.pregnant).length,sex:live.reduce((counts,a)=>(counts[a.sex]=(counts[a.sex]||0)+1,counts),{})}}
  result.timeline.push({day,stateDay:sim.day,population:sim.population(),cohorts,events});
  if(day%20===0){fs.writeFileSync(out+'.tmp',JSON.stringify(result,null,2));fs.renameSync(out+'.tmp',out)}
}
while(sim.day<=days){sim.update(null);if(sim.day!==observedDay){observe(observedDay);observedDay=sim.day;events=newEvents()}}
result.complete=true;result.finalPopulation=sim.population();fs.writeFileSync(out+'.tmp',JSON.stringify(result,null,2));fs.renameSync(out+'.tmp',out);
console.log(JSON.stringify({seed,days,complete:true,population:sim.population(),records:result.timeline.length}));
