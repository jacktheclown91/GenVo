// Controlled transfer diagnostic on an untouched genuine mature ecosystem.
// Border placement is explicit diagnostic intervention, never natural-evolution evidence.
// Usage: node tools/measure-mature-regions.mjs SCENARIO.gz OUTPUT.json SOURCE/src [TICKS]
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {serialize} from 'node:v8';
import {snapshotSignature} from './snapshot-signature.mjs';
import {sourceGraph} from './source-graph.mjs';
const [input,out,sourceArg,stepsArg='96']=process.argv.slice(2),source=path.resolve(sourceArg),steps=Number(stepsArg);
assert.ok(!fs.existsSync(out)&&Number.isSafeInteger(steps)&&steps>0&&steps<=480);
const load=file=>import(pathToFileURL(path.join(source,file)).href);
const runtimeRoot=path.dirname(source),graph=sourceGraph(runtimeRoot);
assert.equal(graph.missing.length,0);
const fingerprint=createHash('sha256');
for(const file of [...graph.reachable].filter(file=>file.startsWith('src/')).sort()){
  fingerprint.update(file);fingerprint.update(fs.readFileSync(path.join(runtimeRoot,file)));
}
const {openScenarioSnapshot}=await load('persistence/scenario-library.js');
const {restoreSimulationSnapshot,createSimulationSnapshot}=await load('persistence/save-manager.js');
const {planetaryTravelAvailability,crossPlanetaryBorder}=await load('world/planetary-travel.js');
const {remoteBiologicalDebt,validateRemoteBiologyLedger}=await load('world/planetary-offscreen-biology.js');
const bytes=fs.readFileSync(input),inputSha256=createHash('sha256').update(bytes).digest('hex');
const catalog=JSON.parse(fs.readFileSync(new URL('../assets/scenarios/catalog.json',import.meta.url)));
assert.ok(catalog.scenarios.some(row=>row.sha256===inputSha256),'Exact catalogued checkpoint required');
let snapshot=openScenarioSnapshot(JSON.parse(zlib.gunzipSync(bytes))),sim=restoreSimulationSnapshot(snapshot);snapshot=null;
const receipt={schema:'genvo.mature-regions/1',source,sourceFingerprint:fingerprint.digest('hex'),inputSha256,node:process.version,scope:'Controlled legal border placement only; no age, reserve, anatomy, policy or resource edits. Not natural evolution acceptance.',start:{tick:sim.tickCount,day:sim.day},transfers:[],ticks:[],backlog:[]};
const visited=new Set([`${sim.world.regionOrigin.x},${sim.world.regionOrigin.y}`]);
for(let hop=0;hop<2;hop++){
  const traveler=sim.player();assert.ok(traveler?.alive);
  // Existing worlds normally begin in manual mode. Do not bypass a refusal.
  let crossing=null;
  for(const direction of ['east','south','north','west']){
    for(let coordinate=8.5;coordinate<118.5;coordinate++){
      traveler.x=direction==='east'?125.2:direction==='west'?2.5:coordinate;
      traveler.y=direction==='south'?125.2:direction==='north'?2.5:coordinate;
      const available=planetaryTravelAvailability(sim);
      if(!available.enabled||visited.has(`${available.to.x},${available.to.y}`))continue;
      crossing=available;break;
    }
    if(crossing)break;
  }
  if(!crossing){receipt.refusal='No eligible unvisited physical frontier under original saved rules';break}
  const begin=performance.now(),result=crossPlanetaryBorder(sim);
  assert.equal(result.ok,true,result.message);
  sim=result.simulation;visited.add(`${crossing.to.x},${crossing.to.y}`);
  receipt.transfers.push({ms:performance.now()-begin,to:crossing.to,archives:sim.planetaryTravel.sessions.length,traveler:sim.playerId});
}
for(let index=0;index<steps;index++){
  const previous=sim.tickCount,begin=performance.now();sim.update(null);receipt.ticks.push(performance.now()-begin);
  if(previous===sim.tickCount){receipt.stopped='Canonical update made no progress';break}
  if(index%6===5)receipt.backlog.push({tick:sim.tickCount,regions:sim.planetaryTravel.sessions.map(session=>({key:session.key,mode:session.biologicalMode,tick:session.snapshot.core.tickCount,debt:remoteBiologicalDebt(sim,session)}))});
}
for(const session of sim.planetaryTravel.sessions)validateRemoteBiologyLedger(session);
const begin=performance.now(),final=createSimulationSnapshot(sim,{savedAt:'fixed',reason:'mature-regional-profile'});receipt.captureMs=performance.now()-begin;
receipt.completeStateSha256=snapshotSignature(final);
fs.writeFileSync(out+'.v8',serialize(final));
receipt.end={tick:sim.tickCount,day:sim.day,rng:sim.rng.state,archives:sim.planetaryTravel.sessions.length,live:sim.animals.filter(a=>a.alive).length};
const sorted=receipt.ticks.slice().sort((a,b)=>a-b),at=q=>sorted[Math.min(sorted.length-1,Math.floor(q*sorted.length))]??null;
receipt.tickMs={count:sorted.length,total:sorted.reduce((a,b)=>a+b,0),median:at(.5),p95:at(.95),p99:at(.99),worst:at(1)};
fs.writeFileSync(out,JSON.stringify(receipt,null,2));console.log(JSON.stringify({...receipt,ticks:undefined,backlog:undefined}));
