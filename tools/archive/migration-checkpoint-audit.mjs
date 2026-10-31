import fs from 'node:fs';
import path from 'node:path';
import v8 from 'node:v8';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
const [checkpoint,out,sourceArg='src']=process.argv.slice(2);
assert.ok(checkpoint&&out,'checkpoint output [source-root] required');
const root=path.resolve(sourceArg),canonical=fileURLToPath(new URL('../../src',import.meta.url)),saved=v8.deserialize(fs.readFileSync(checkpoint)),hash=crypto.createHash('sha256');
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else hash.update(path.join(canonical,path.relative(root,p))).update(fs.readFileSync(p))}}
walk(root);const fingerprint=hash.digest('hex');assert.equal(fingerprint,saved.contract.sourceFingerprint);assert.ok(saved.snapshot,'active snapshot required');
const {restoreSimulationSnapshot}=await import(pathToFileURL(path.join(root,'persistence/save-manager.js')).href);
const {SPECIES}=await import(pathToFileURL(path.join(root,'organisms/species.js')).href);
const {CFG}=await import(pathToFileURL(path.join(root,'sim/config.js')).href);
const sim=restoreSimulationSnapshot(saved.snapshot),rng=sim.rng.state,groups={},rows=[];
for(const a of sim.animals){if(!a.alive)continue;const st=sim.migration.states.get(a.id),group=groups[a.species]??={alive:0,active:0,olderThanSeason:0,destinationBlocked:0,unreachable:0,readyCrowded:0};group.alive++;
  const here=sim.carrying.breedingState(a),spec=SPECIES[a.species];if(a.age>=spec.maturity&&a.energy/spec.maxEnergy>.72&&!here.allowed)group.readyCrowded++;
  if(st?.status!=='outbound'||!st.target)continue;
  group.active++;const elapsed=sim.day-st.departedDay,distance=Math.hypot(st.target.x-a.x,st.target.y-a.y),reachable=sim.canReach(a,st.target.x,st.target.y),there=sim.carrying.breedingState(a,{at:st.target});
  if(elapsed>CFG.seasonDays)group.olderThanSeason++;if(!there.allowed)group.destinationBlocked++;if(!reachable)group.unreachable++;
  rows.push({id:a.id,species:a.species,elapsed,distance,reachable,intent:a.intent,energy:a.energy/spec.maxEnergy,hydration:a.hydration/spec.maxHydration,x:a.x,y:a.y,target:st.target,origin:st.origin,current:here,destination:there});
}
assert.equal(sim.rng.state,rng,'audit draws no simulation RNG');
const result={seed:sim.seed,day:sim.day,sourceFingerprint:fingerprint,detached:true,intervention:false,groups,rows};fs.writeFileSync(out,JSON.stringify(result,null,2));console.log(JSON.stringify({seed:result.seed,day:result.day,groups}));
