import fs from 'node:fs';
import path from 'node:path';
import v8 from 'node:v8';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
const [checkpoint,out,sourceArg='src',stepsArg='48']=process.argv.slice(2);
assert.ok(checkpoint&&out);
const steps=Number(stepsArg);assert.ok(Number.isInteger(steps)&&steps>0&&steps<=480);
const root=path.resolve(sourceArg),canonical=fileURLToPath(new URL('../../src',import.meta.url));
const saved=v8.deserialize(fs.readFileSync(checkpoint)),hash=crypto.createHash('sha256');
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else hash.update(path.join(canonical,path.relative(root,p))).update(fs.readFileSync(p))}}
walk(root);const fingerprint=hash.digest('hex');assert.equal(fingerprint,saved.contract.sourceFingerprint);assert.ok(saved.snapshot);
const {restoreSimulationSnapshot}=await import(pathToFileURL(path.join(root,'persistence/save-manager.js')).href);
const sim=restoreSimulationSnapshot(saved.snapshot),startDay=sim.day,durations=[];
const candidate=process.argv.includes('--candidate');
if(candidate){const {loadCarryingDemandCandidate}=await import('../carrying-demand-candidate.mjs');Object.setPrototypeOf(sim.carrying,(await loadCarryingDemandCandidate(root)).prototype)}
for(let i=0;i<steps;i++){const start=performance.now();sim.update(null);durations.push(performance.now()-start)}
const sorted=[...durations].sort((a,b)=>a-b);
const result={seed:sim.seed,sourceFingerprint:fingerprint,candidate,detached:true,intervention:false,acceptance:false,concurrentValidation:true,startDay,endDay:sim.day,steps,population:sim.population(),totalMs:durations.reduce((a,b)=>a+b,0),medianMs:sorted[Math.floor(steps*.5)],p95Ms:sorted[Math.floor(steps*.95)],maxMs:sorted.at(-1),durations};
fs.writeFileSync(out,JSON.stringify(result,null,2));console.log(JSON.stringify({...result,durations:undefined}));
