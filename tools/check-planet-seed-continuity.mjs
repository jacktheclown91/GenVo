import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {PlanetGeography} from '../src/world/planet-geography.js';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {validateEnvironment} from '../src/world/environment.js';
import {checkEcologicalIntegrity} from './ecological-integrity.mjs';
const out='docs/planet-geography/seed-continuity.json';if(fs.existsSync(out))throw Error('Existing receipt must be preserved before rerun.');
const seeds=Array.from({length:8},(_,i)=>`B0-CONTINUITY-${String(i).padStart(3,'0')}`),rows=[];
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex'),snapshot=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'planet-seed-continuity'}));
const staticState=p=>({descriptor:p.descriptor,samples:[[-64,-64],[0,0],[64,64],[127,127],[256,-128]].map(([x,y])=>p.sample(x+.5,y+.5)),negativeBoundary:p.pageCrossings(-1,-1),regionHash:hash(p.region(32,-32,64,64))});
const references=seeds.map(seed=>staticState(new PlanetGeography(seed)));
// More than four distinct seeds evicts the bounded macro cache; revisit all in reverse.
for(let i=seeds.length-1;i>=0;i--)assert.deepEqual(staticState(new PlanetGeography(seeds[i])),references[i],'geography must not depend on cache eviction or request order');
for(let i=0;i<seeds.length;i++){
 const s=new Simulation(seeds[i],{player:true,worldGenerator:'planetary/1'}),initial=s.animals.filter(a=>a.alive).length,before=snapshot(s),resumed=restoreSimulationSnapshot(structuredClone(before));
 assert.deepEqual(snapshot(resumed),before);let dailyChecks=0;
 for(let step=0;step<64;step++){const day=s.day;s.update(null);resumed.update(null);if(s.day!==day){validateEnvironment(s.world,s.world.environment);checkEcologicalIntegrity(s,initial);assert.deepEqual(snapshot(resumed),snapshot(s));dailyChecks++}}
 assert.deepEqual(snapshot(resumed),snapshot(s));validateEnvironment(s.world,s.world.environment);const integrity=checkEcologicalIntegrity(s,initial);
 const wet=s.world.water.reduce((n,v)=>n+v,0),row={seed:seeds[i],staticHash:hash(references[i]),descriptor:s.world.planet.descriptor,updates:64,dailyChecks,day:s.day,initialPopulation:initial,finalPopulation:s.animals.filter(a=>a.alive).length,waterTiles:wet,integrity,exactResume:true};rows.push(row);console.log(JSON.stringify({seed:row.seed,day:row.day,waterTiles:wet,initialPopulation:initial,finalPopulation:row.finalPopulation,exactResume:true}));
}
const files=['src/world/planet-geography.js','src/world/planet-world.js','src/world/world.js','src/persistence/save-manager.js'];
fs.writeFileSync(out,JSON.stringify({schema:'genvo.planet-seed-continuity/1',scope:'Eight declared current-size planetary worlds, bounded-cache eviction/order independence and 64 ordinary updates with exact save continuation each. Finite environment/resource/identity checks, no population survival target. Not a mature performance or 100-day ecology trial.',sourceHashes:Object.fromEntries(files.map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')])),seeds,allPassed:true,rows},null,2));
