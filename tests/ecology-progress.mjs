import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'genvo8-progress-'));
const output=path.join(dir,'resume.json'),checkpoint=path.join(dir,'state.bin'),control=path.join(dir,'control.json');
const run=args=>spawnSync(process.execPath,['tools/ecology-validation.mjs',...args],{encoding:'utf8'});
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
try{
  let r=run(['3','1',output,'0',`--checkpoint=${checkpoint}`,'--stop-at=1']);assert.equal(r.status,2,r.stderr);
  let p=read(output+'.progress.json');assert.equal(p.jobComplete,false);assert.equal(p.day,1);assert.ok(p.elapsedSeconds>0&&p.updates>0&&p.worldUpdatesPerSecond>0);
  r=run(['3','1',output,'0',`--checkpoint=${checkpoint}`,'--resume']);assert.equal(r.status,0,r.stderr);
  p=read(output+'.progress.json');assert.equal(p.resumed,true);assert.equal(p.jobComplete,true);assert.equal(p.completedWorlds,1);assert.equal(p.day,4);assert.ok(p.memoryBytes.rss>0);assert.ok(p.resourceObservation.resources);assert.match(p.timingScope,/excludes prior/);
  r=run(['3','1',control,'0']);assert.equal(r.status,0,r.stderr);assert.deepEqual(read(output),read(control),'wall-clock metadata must not change deterministic ecological results');
  assert.equal(read(control).ecologicalAcceptance,'pending-causal-persistence-and-runtime-review');
  console.log('progress sidecar, resumed timing scope and ecological receipt equivalence: PASS');
}finally{assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()));assert.ok(path.basename(dir).startsWith('genvo8-progress-'));fs.rmSync(dir,{recursive:true,force:true});}
