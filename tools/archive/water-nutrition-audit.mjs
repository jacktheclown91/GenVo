// Observe natural habitat/body distributions; no intervention or extra RNG draws.
import fs from 'node:fs';
import path from 'node:path';
import v8 from 'node:v8';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
const [seed,limit,out,root='src']=process.argv.slice(2),days=Number(limit);
if(!seed||!Number.isInteger(days)||days<1||!out)throw Error('seed days output [source-root] required');
const canonical=path.resolve('src'),source=path.resolve(root),load=f=>import(pathToFileURL(path.join(source,f)).href);
const {Simulation}=await load('sim/simulation.js'),{waterFoodRate,isWaterDweller}=await load('lineage/aquatic.js'),{createSimulationSnapshot}=await load('persistence/save-manager.js');
const hash=crypto.createHash('sha256');function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const p=path.join(dir,e.name);if(e.isDirectory())scan(p);else hash.update(path.join(canonical,path.relative(source,p))).update(fs.readFileSync(p))}}scan(source);
const sim=new Simulation(seed,{player:false}),result={seed,days,sourceFingerprint:hash.digest('hex'),complete:false,timeline:[]};
function observe(){const cohorts={};for(const species of ['mosskip','rootling','needlejaw','genvo']){const animals=sim.animals.filter(a=>a.alive&&a.species===species);cohorts[species]={count:animals.length,water:animals.filter(a=>sim.world.water[sim.world.idx(a.x,a.y)]).length,passiveFood:animals.filter(a=>waterFoodRate(a)>0).length,waterPassiveFood:animals.filter(a=>sim.world.water[sim.world.idx(a.x,a.y)]&&waterFoodRate(a)>0).length,dwellers:animals.filter(isWaterDweller).length,waterFeedIntent:animals.filter(a=>a.intent==='water-feed').length,pregnant:animals.filter(a=>a.pregnant).length}}result.timeline.push({day:sim.day,cohorts,births:sim.stats.births,deaths:sim.stats.deaths});fs.writeFileSync(out,JSON.stringify(result,null,2))}
let next=1;while(sim.day<=days){sim.update(null);if(sim.day>=next){observe();next+=100}}
observe();result.complete=true;fs.writeFileSync(out,JSON.stringify(result,null,2));fs.writeFileSync(out+'.bin',v8.serialize(createSimulationSnapshot(sim)));console.log(JSON.stringify(result.timeline.at(-1)));
