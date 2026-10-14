import crypto from 'node:crypto';import assert from 'node:assert/strict';
import fs from 'node:fs';import {pathToFileURL} from 'node:url';import path from 'node:path';import {Simulation} from '../src/sim/simulation.js';
const original=fs.readFileSync('src/ecology/freshwater-food.js','utf8').replace("'../core/rng.js'",JSON.stringify(pathToFileURL(path.resolve('src/core/rng.js')).href));
const sourceFileSha256=crypto.createHash('sha256').update(fs.readFileSync('src/ecology/freshwater-food.js')).digest('hex');
assert.equal(original.split('Math.min(needed,source[i]*p.efficiency)').length-1,1,'candidate transformation must match exactly one source feeding expression');
const results=[];
for(const half of [null,.05,.1,.2,.4,.8,'half-source-capacity']){
 const candidate=half===null?original:original.replace('Math.min(needed,source[i]*p.efficiency)',`Math.min(needed*source[i]/(source[i]+${half==='half-source-capacity'?'(FRESHWATER_FOOD[kind].carry||1)*.5':half}),source[i]*p.efficiency)`);
 const {advanceFreshwater}=await import('data:text/javascript;base64,'+Buffer.from(candidate).toString('base64'));
 const sim=new Simulation('FRESHWATER-RESOURCE-CYCLE',{player:false}),samples=[];
 for(let day=0;day<=3000;day++){if(day%500===0)samples.push({day,stocks:Object.fromEntries(Object.entries(sim.world.freshwaterFood).map(([kind,f])=>[kind,Array.from(f).reduce((a,b)=>a+b,0)]))});if(day<3000)advanceFreshwater(sim.world)}
 results.push({halfSaturation:half,samples});console.log(JSON.stringify({half,final:samples.at(-1)}));
}
fs.writeFileSync(process.argv[2]||'reports/pass-u-encounter-candidates.json',JSON.stringify({candidateOnly:true,sourceFileSha256,productionChanged:false,animalSimulationAdvanced:false,seed:'FRESHWATER-RESOURCE-CYCLE',results},null,2));
