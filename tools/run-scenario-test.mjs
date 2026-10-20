#!/usr/bin/env node
// Resume a recorded GenVo world repeatedly without replaying its history.
// Every run independently decodes and restores the SAME immutable checkpoint.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {CFG} from '../src/sim/config.js';
import {restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {openScenarioSnapshot,validateScenarioCatalog} from '../src/persistence/scenario-library.js';

const args=process.argv.slice(2),arg=(k,defaultValue=null)=>{
 const i=args.indexOf('--'+k);return i===-1?defaultValue:args[i+1]??'';
};
if(args.includes('--help')||!args.length){
 console.log('Usage: node tools/run-scenario-test.mjs --id advanced-valley --days 2 --repeat 2');
 console.log('       node tools/run-scenario-test.mjs --input exported-scenario.json --days 2');
 process.exit(0);
}
const id=arg('id'),input=arg('input'),days=Number(arg('days','1')),repeat=Number(arg('repeat','1'));
if((!!id===!!input)||!Number.isSafeInteger(days)||days<0||days>30||
   !Number.isSafeInteger(repeat)||repeat<1||repeat>6)
 throw Error('Choose --id OR --input, --days 0..30 and --repeat 1..6.');
let file=input;
let entry=null;
if(id){
 if(!/^[a-z0-9][a-z0-9-]{1,63}$/.test(id))throw Error('Invalid scenario ID.');
 const catalog=JSON.parse(fs.readFileSync('assets/scenarios/catalog.json','utf8'));
 entry=validateScenarioCatalog(catalog).find(s=>s.id===id);
 if(!entry)throw Error('No verified curated checkpoint for '+id+'. Generate it first.');
 file=entry.file;
}
const bytes=fs.readFileSync(file),checksum=createHash('sha256').update(bytes).digest('hex');
if(entry&&checksum!==entry.sha256)throw Error('Scenario catalog checksum does not match file.');
const baseline=JSON.parse(bytes.toString('utf8'));
const results=[];
for(let pass=0;pass<repeat;pass++){
 const source=openScenarioSnapshot(baseline);
 const sim=restoreSimulationSnapshot(source);
 const start={seed:sim.seed,day:sim.day,tick:sim.tickCount,rng:sim.rng.state>>>0,
  animals:sim.animals.length};
 const goal=sim.day+days,maxSteps=(days+1)*CFG.dayTicks*3;
 let steps=0;
 while(sim.day<goal){
  if(++steps>maxSteps)throw Error('Scenario progression stalled at day '+sim.day+'.');
  sim.update(null);
 }
 const result={
  seed:sim.seed,startDay:start.day,day:sim.day,initialTick:start.tick,
  tick:sim.tickCount,rng:sim.rng.state>>>0,
  alive:sim.animals.filter(a=>a.alive).length,
  playerAlive:!!sim.player()?.alive,
  births:sim.stats?.births||0,deaths:sim.stats?.deaths||0
 };
 results.push(result);
 if(pass&&JSON.stringify(result)!==JSON.stringify(results[0]))
  throw Error('Deterministic replay divergence detected on repeated scenario restoration.');
}
// Original baseline file and checksum are unchanged, independent of all runs.
if(createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==checksum)
 throw Error('A replay altered the immutable source checkpoint.');
console.log(JSON.stringify({ok:true,checkpoint:file,sha256:checksum,days,repeat,
 startAt:results[0].startDay,results},null,2));
