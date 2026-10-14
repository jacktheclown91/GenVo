import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

const [input,output,sourceArg='src']=process.argv.slice(2);
assert.ok(input&&output,'usage: receipt output [exact source root]');
const receipt=JSON.parse(fs.readFileSync(input,'utf8'));
const root=path.resolve(sourceArg),canonical=fileURLToPath(new URL('../src',import.meta.url));
const hash=crypto.createHash('sha256');
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
    const p=path.join(dir,entry.name);
    if(entry.isDirectory())walk(p);
    else hash.update(path.join(canonical,path.relative(root,p))).update(fs.readFileSync(p));
  }
}
walk(root);const sourceFingerprint=hash.digest('hex');
assert.equal(sourceFingerprint,receipt.sourceFingerprint,'audit source must match the receipt');
const {CFG}=await import(pathToFileURL(path.join(root,'sim/config.js')).href);
const expectedSeeds=['GENVO8-TEST-A','GENVO8-TEST-C','GENVO8-TEST-E'];
const sum=obj=>Object.values(obj).reduce((n,v)=>n+v,0);
const issues=[],runs=[];
for(const run of receipt.runs){
  const timeline=run.timeline;
  assert.ok(timeline?.length,'completed world requires censuses');
  const first=timeline[0],last=timeline.at(-1),initial=sum(first.population);
  for(const row of timeline){
    const actual=sum(row.population),expected=initial+row.births-first.births-row.deaths+first.deaths;
    if(actual!==expected)issues.push({seed:run.seed,day:row.day,kind:'population-accounting',actual,expected});
    const regional={};
    for(const populations of Object.values(row.regions))for(const [species,count] of Object.entries(populations))regional[species]=(regional[species]||0)+count;
    for(const species of new Set([...Object.keys(row.population),...Object.keys(regional)])){
      if((regional[species]||0)!==(row.population[species]||0))issues.push({seed:run.seed,day:row.day,kind:'regional-accounting',species});
    }
    for(const [kind,value] of Object.entries(row.resources))if(!Number.isFinite(value)||value<0)issues.push({seed:run.seed,day:row.day,kind:'invalid-resource',resource:kind,value});
  }
  const final=sum(run.population),deaths=sum(run.deaths);
  const cohorts={};
  if(first.births===0&&first.deaths===0){
    const species=new Set([...Object.keys(first.population),...Object.keys(run.population),...Object.keys(run.deaths).map(key=>key.split(':')[0])]);
    for(const name of species){
      const causes={};
      for(const [key,count] of Object.entries(run.deaths))if(key.startsWith(name+':'))causes[key.slice(name.length+1)]=count;
      const count=run.population[name]||0,starting=first.population[name]||0,totalDeaths=sum(causes);
      const inferredBirths=count-starting+totalDeaths;
      if(!Number.isInteger(inferredBirths)||inferredBirths<0)issues.push({seed:run.seed,kind:'invalid-inferred-cohort-births',species:name,inferredBirths});
      const maximum=timeline.reduce((best,row)=>(row.population[name]||0)>best.count?{day:row.day,count:row.population[name]}:best,{day:first.day,count:starting});
      cohorts[name]={initial:starting,final:count,recordedDeaths:totalDeaths,deathCauses:causes,birthsInferredFromAccounting:inferredBirths,sampledMaximum:maximum};
    }
    if(Object.values(cohorts).reduce((n,c)=>n+c.birthsInferredFromAccounting,0)!==run.births)issues.push({seed:run.seed,kind:'cohort-birth-accounting'});
  }
  if(initial+run.births-first.births-deaths+first.deaths!==final)issues.push({seed:run.seed,kind:'terminal-population-accounting'});
  if(JSON.stringify(last.population)!==JSON.stringify(run.population)||last.day!==run.day)issues.push({seed:run.seed,kind:'terminal-census-mismatch'});
  runs.push({seed:run.seed,day:run.day,initialPopulation:initial,births:run.births,deaths,finalPopulation:final,population:run.population,deathCauses:run.deaths,cohorts,peak:run.peak,withinPerformanceTarget:run.peak<=CFG.performanceTarget,reachedEmergencyCeiling:run.peak>=CFG.maxAnimals,belowRecovery:run.belowRecovery,finalResources:last.resources,finalRegions:last.regions,finalActiveMigrations:last.migrations});
}
const reportedSeeds=runs.map(run=>run.seed);
if(new Set(reportedSeeds).size!==reportedSeeds.length)issues.push({kind:'duplicate-seeds'});
const missingSeeds=expectedSeeds.filter(seed=>!reportedSeeds.includes(seed));
const unexpectedSeeds=reportedSeeds.filter(seed=>!expectedSeeds.includes(seed));
if(unexpectedSeeds.length)issues.push({kind:'unexpected-seeds',seeds:unexpectedSeeds});
const result={sourceReceipt:path.resolve(input),sourceFingerprint,sourceVerified:true,wholeJobComplete:receipt.complete===true,requiredDays:1400,expectedSeeds,missingSeeds,performanceTarget:CFG.performanceTarget,emergencyCeiling:CFG.maxAnimals,issues,runs,recordedAccountingPass:issues.length===0,allRequiredWorldsTerminal:receipt.complete===true&&!missingSeeds.length&&runs.every(run=>run.day>=1401),ecologicalAcceptance:false,limitations:['Recorded census consistency cannot establish per-update conservation or explain extinction.','Active migration states do not establish successful recruitment.','An emergency-ceiling plateau does not establish natural carrying regulation.','Full regression and runtime acceptance are separate required evidence.']};
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({finishedWorlds:runs.length,missingSeeds,issues,wholeJobComplete:result.wholeJobComplete,ecologicalAcceptance:false}));
if(issues.length)process.exitCode=1;
