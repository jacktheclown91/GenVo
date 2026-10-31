import fs from 'node:fs';
import path from 'node:path';
import v8 from 'node:v8';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {loadCarryingDemandCandidate} from '../carrying-demand-candidate.mjs';
const [checkpoint,out,sourceArg='src']=process.argv.slice(2);
assert.ok(checkpoint&&out);
const root=path.resolve(sourceArg),saved=v8.deserialize(fs.readFileSync(checkpoint));
const canonical=fileURLToPath(new URL('../../src',import.meta.url)),hash=crypto.createHash('sha256');
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else hash.update(path.join(canonical,path.relative(root,p))).update(fs.readFileSync(p))}}
walk(root);const sourceFingerprint=hash.digest('hex');assert.equal(sourceFingerprint,saved.contract.sourceFingerprint);assert.ok(saved.snapshot);
const {restoreSimulationSnapshot,createSimulationSnapshot}=await import(pathToFileURL(path.join(root,'persistence/save-manager.js')).href);
const baseline=restoreSimulationSnapshot(structuredClone(saved.snapshot));
const candidate=restoreSimulationSnapshot(structuredClone(saved.snapshot));
Object.setPrototypeOf(candidate.carrying,(await loadCarryingDemandCandidate(root)).prototype);
let pressureChecks=0;
for(const a of baseline.animals){if(!a.alive)continue;const b=candidate.animals.find(x=>x.id===a.id);
  for(const at of [null,{x:a.x+2,y:a.y},{x:a.x,y:a.y+2}]){
    assert.deepEqual(candidate.carrying.breedingState(b,{at}),baseline.carrying.breedingState(a,{at}),'candidate preserves resident and prospective pressure');pressureChecks++;
  }
}
const timings={};
for(const [name,sim] of [['baseline',baseline],['candidate',candidate]]){const start=performance.now();for(let i=0;i<48;i++)sim.update(null);timings[name]=performance.now()-start}
const options={savedAt:'equivalence',reason:'diagnostic'};
assert.deepEqual(createSimulationSnapshot(candidate,options),createSimulationSnapshot(baseline,options),'full simulation state including resources, RNG and controller caches remains identical');
const result={seed:baseline.seed,sourceFingerprint,startDay:saved.snapshot.core.day,endDay:baseline.day,pressureChecks,steps:48,fullSnapshotEquivalent:true,productionChanged:false,acceptance:false,concurrentValidation:true,timings};
fs.writeFileSync(out,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
