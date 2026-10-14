import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import v8 from 'node:v8';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {Simulation} from '../src/sim/simulation.js';import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'genvo8-family-resume-')),base=path.join(dir,'base.json'),out=path.join(dir,'resume.json');
try{
 const run=(args)=>{const r=spawnSync(process.execPath,['tools/family-recruitment-observer.mjs',...args],{encoding:'utf8'});assert.equal(r.status,0,r.stderr)};
 run(['GENVO8-TEST-A','40',base]);const original=fs.readFileSync(base+'.bin');run(['GENVO8-TEST-A','60',out,'--resume='+base+'.bin']);assert.deepEqual(fs.readFileSync(base+'.bin'),original,'original checkpoint preserved');
 const resumed=v8.deserialize(fs.readFileSync(out+'.bin')),sim=new Simulation('GENVO8-TEST-A',{player:true});sim.setPlayerAutonomy(true);while(sim.day<=60)sim.update(null);const control=createSimulationSnapshot(sim);control.savedAt=resumed.snapshot.savedAt;control.meta.savedAt=resumed.snapshot.meta.savedAt;control.reason=resumed.snapshot.reason;assert.deepEqual(resumed.snapshot,control,'checkpoint continuation preserves full biological state and RNG');assert.equal(resumed.result.continuation.startDay,41);assert.equal(resumed.result.observation.lineageBirths,4);assert.ok(resumed.result.records.some(r=>r.lineage&&r.children.length));
 const partial=path.join(dir,'partial.bin'),continued=path.join(dir,'partial-resumed.json'),checkpoint=v8.deserialize(original);
 checkpoint.result.complete=false;fs.writeFileSync(partial,v8.serialize(checkpoint));
 run(['GENVO8-TEST-A','60',continued,'--resume='+partial]);
 const recovered=v8.deserialize(fs.readFileSync(continued+'.bin')).snapshot;
 recovered.savedAt=control.savedAt;recovered.meta.savedAt=control.meta.savedAt;recovered.reason=control.reason;
 assert.deepEqual(recovered,control,'a consistent incomplete checkpoint resumes the same biology and RNG');
 const wrong=spawnSync(process.execPath,['tools/family-recruitment-observer.mjs','WRONG-SEED','60',path.join(dir,'bad.json'),'--resume='+base+'.bin'],{encoding:'utf8'});assert.notEqual(wrong.status,0);assert.ok(!fs.existsSync(path.join(dir,'bad.json')));console.log('family checkpoint continuation full-state/RNG genealogy and original receipt preservation PASS');
}finally{assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()));assert.ok(path.basename(dir).startsWith('genvo8-family-resume-'));fs.rmSync(dir,{recursive:true,force:true});}
