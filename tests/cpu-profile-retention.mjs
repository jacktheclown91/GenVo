import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {runValidationProcess} from '../tools/validation-process.mjs';
import {summarizeObservation} from '../tools/summarize-observations.mjs';
const root=path.resolve(process.env.GENVO_VALIDATION_ARTIFACTS||'docs/test-runs/artifacts/manual-'+Date.now()+'-'+process.pid,'cpu-keep');fs.mkdirSync(root,{recursive:true});
const run=await runValidationProcess({args:['--expose-gc','tools/observe-ecology.mjs','CPU-KEEP','1000','--profile','--gc','--sample-every','1','--cpu-start','1','--cpu-end','1001','--cpu-chunk-days','1'],cwd:process.cwd(),timeoutMs:3000,logPath:path.join(root,'fixture.log'),env:{...process.env,GENVO_VALIDATION_ARTIFACTS:root}});
assert.equal(run.timedOut,true);assert.equal(run.cleanupError,null);
const dir=path.join(root,'ecology-diagnostic'),profiles=fs.readdirSync(dir).filter(f=>f.endsWith('.cpuprofile'));
assert.ok(profiles.length>0,'completed CPU chunks survive a hard timeout before the full window closes');
for(const file of profiles){const profile=JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'));assert.ok(profile.nodes.length>0&&profile.samples.length>0)}
assert.equal(fs.existsSync(path.join(dir,'CPU-KEEP.json')),false,'unfinished observation has no completed receipt');
const summary=summarizeObservation(path.join(dir,'CPU-KEEP.ndjson'));assert.equal(summary.completed,false);assert.ok(summary.observedThroughDay>1);
console.log('Hard timeout retains completed CPU chunks and partial observations without claiming completion PASS');
