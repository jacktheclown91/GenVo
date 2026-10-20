#!/usr/bin/env node
// Generate a real evolved GenVo world once, or promote a browser-exported
// checkpoint into the curated quick-start catalog. No simulated history,
// seeded fake populations, offline topology changes, or developer-only boosts.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {packageScenarioSnapshot,openScenarioSnapshot,validateScenarioCatalog} from '../src/persistence/scenario-library.js';

const argv=process.argv.slice(2),arg=(flag,fallback=null)=>{const at=argv.indexOf('--'+flag);return at===-1?fallback:argv[at+1]??'';};
if(argv.includes('--help')||!argv.length){
 console.log('Usage: node tools/create-world-scenario.mjs --id mature-valley --label "Established Valley" --seed GENVO-VALLEY --days 30 --generator planetary/1');
 console.log('   Or: node tools/create-world-scenario.mjs --id shared-valley --label "Shared Valley" --input exports/valley.json');
 console.log('   Add --replace to intentionally replace a catalog entry and its original file.');
 process.exit(0);
}
const id=arg('id'),label=arg('label'),description=arg('description',''),input=arg('input');
if(!/^[a-z0-9][a-z0-9-]{1,63}$/.test(id||''))throw Error('Scenario id must use lowercase letters, digits and hyphens.');
if(!label?.trim())throw Error('Scenario label required.');
const directory=path.resolve('assets/scenarios'),destination=path.join(directory,id+'.json'),catalogPath=path.join(directory,'catalog.json');
fs.mkdirSync(directory,{recursive:true});
const existing=fs.existsSync(catalogPath)?JSON.parse(fs.readFileSync(catalogPath,'utf8')):{schema:1,scenarios:[]};
validateScenarioCatalog(existing);
if(!argv.includes('--replace')&&(existing.scenarios.some(s=>s.id===id)||fs.existsSync(destination)))
 throw Error('Scenario exists. Use --replace to explicitly replace its immutable baseline.');
let snapshot;
if(input){
 const bundle=JSON.parse(fs.readFileSync(path.resolve(input),'utf8'));
 snapshot=openScenarioSnapshot(bundle);
}else{
 const seed=arg('seed'),generator=arg('generator','planetary/1'),days=Number(arg('days','0'));
 if(!seed||!['planetary/1','freshwater/1'].includes(generator)||!Number.isSafeInteger(days)||days<0||days>1000)
  throw Error('Real simulation generation requires --seed, supported --generator, and --days 0..1000.');
 const sim=new Simulation(seed,{player:true,worldGenerator:generator});
 const target=sim.day+days,maxTicks=(days+1)*CFG.dayTicks*3;
 let ticks=0;
 while(sim.day<target){
  if(++ticks>maxTicks)throw Error('Simulation did not advance to requested day; refusing synthetic checkpoint.');
  sim.update(null);
 }
 snapshot=structuredClone(createSimulationSnapshot(sim,{reason:'verified-scenario-export',savedAt:'2026-10-20T00:00:00.000Z'}));
}
const bundle=packageScenarioSnapshot(snapshot,{id,label,description});
// Decode and restore the actual recorded World once to catch incomplete or
// incompatible saves BEFORE publishing any manifest entry or overwriting.
const restored=restoreSimulationSnapshot(openScenarioSnapshot(bundle));
if(restored.seed!==snapshot.seed||restored.day!==snapshot.core.day||
   restored.tickCount!==snapshot.core.tickCount||restored.rng.state!==(snapshot.rngState>>>0)||
   restored.animals.length!==snapshot.animals.length)
 throw Error('Scenario failed canonical replay identity.');
const data=JSON.stringify(bundle);
const sha256=createHash('sha256').update(data,'utf8').digest('hex');
const entry={id,label:bundle.metadata.label,description:bundle.metadata.description,
 seed:bundle.metadata.seed,day:bundle.metadata.day,year:bundle.metadata.year,
 generation:bundle.metadata.generation,liveAnimals:bundle.metadata.liveAnimals,
 file:'assets/scenarios/'+id+'.json',sha256};
const catalog={schema:1,scenarios:[...existing.scenarios.filter(s=>s.id!==id),entry]};
validateScenarioCatalog(catalog);
fs.writeFileSync(destination,data);
fs.writeFileSync(catalogPath,JSON.stringify(catalog,null,2)+'\n');
console.log(JSON.stringify({ok:true,scenario:entry,animals:restored.animals.length,ticks:restored.tickCount,
 note:'Real source progression and one canonical restore verified. Browser gameplay and long-run balancing not implied.'},null,2));
