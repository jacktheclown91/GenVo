import fs from 'node:fs';
import path from 'node:path';
import v8 from 'node:v8';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
const [checkpoint,out,sourceArg='src',horizon='4']=process.argv.slice(2);
assert.ok(checkpoint&&out);
const days=Number(horizon);assert.ok(Number.isInteger(days)&&days>0&&days<=16);
const root=path.resolve(sourceArg),canonical=fileURLToPath(new URL('../src',import.meta.url));
const saved=v8.deserialize(fs.readFileSync(checkpoint)),hash=crypto.createHash('sha256');
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else hash.update(path.join(canonical,path.relative(root,p))).update(fs.readFileSync(p))}}
walk(root);const fingerprint=hash.digest('hex');assert.equal(fingerprint,saved.contract.sourceFingerprint);assert.ok(saved.snapshot);
const {restoreSimulationSnapshot,createSimulationSnapshot}=await import(pathToFileURL(path.join(root,'persistence/save-manager.js')).href);
const sim=restoreSimulationSnapshot(saved.snapshot),startDay=sim.day,events=[],original=sim.tryMate.bind(sim);
sim.tryMate=(a,b)=>{
  // Pressure queries happen on a separate observation copy, preserving the
  // replay's RNG, caches, food and decisions. This never touches the live job.
  const copy=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim)));
  const ca=copy.animals.find(x=>x.id===a.id),cb=copy.animals.find(x=>x.id===b.id);
  const pressureA=copy.carrying.breedingState(ca),pressureB=copy.carrying.breedingState(cb);
  const accepted=original(a,b);
  events.push({day:sim.day,tick:sim.tickCount,a:a.id,b:b.id,species:a.species,accepted,pressureA,pressureB});
  return accepted;
};
while(sim.day<startDay+days)sim.update(null);
const accepted=events.filter(e=>e.accepted),blocked=accepted.filter(e=>!e.pressureA.allowed||!e.pressureB.allowed);
const result={seed:sim.seed,sourceFingerprint:fingerprint,detached:true,intervention:false,startDay,endDay:sim.day,attempts:events.length,accepted:accepted.length,acceptedDespitePressure:blocked.length,events};
fs.writeFileSync(out,JSON.stringify(result,null,2));
console.log(JSON.stringify({...result,events:undefined}));
