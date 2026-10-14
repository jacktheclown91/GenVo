import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import v8 from 'node:v8';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {Simulation} from '../src/sim/simulation.js';import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'genvo8-family-observer-')),out=path.join(dir,'result.json');
try{
  const r=spawnSync(process.execPath,['tools/family-recruitment-observer.mjs','GENVO8-TEST-A','60',out],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);
  const recorded=v8.deserialize(fs.readFileSync(out+'.bin'));assert.equal(recorded.result.complete,true);assert.equal(recorded.result.acceptance,false);assert.ok(recorded.result.observation.lineageBirths>0,'equivalence must cover actual lineage births');
  const sim=new Simulation('GENVO8-TEST-A',{player:true});sim.setPlayerAutonomy(true);while(sim.day<=60)sim.update(null);
  const control=createSimulationSnapshot(sim);control.savedAt=recorded.snapshot.savedAt;control.reason=recorded.snapshot.reason;control.meta.savedAt=recorded.snapshot.meta.savedAt;
  assert.deepEqual(recorded.snapshot,control,'birth observer must preserve full simulation state and RNG');
  for(const row of recorded.result.records)for(const id of row.parentIds)assert.ok(recorded.result.records.some(p=>p.id===id),'all biological parent records retained');
  for(const sample of recorded.result.timeline){
    const integrity=sample.mechanicalIntegrity;
    assert.equal(integrity.day,sample.day);
    assert.equal(Object.values(integrity.population).reduce((sum,n)=>sum+n,0),132+integrity.births-integrity.deaths);
    assert.ok(Object.values(integrity.resources).every(n=>Number.isFinite(n)&&n>=0));
    assert.equal(Object.values(sample.mortalityCauses).reduce((sum,n)=>sum+n,0),integrity.deaths);
  }
  for(const row of recorded.result.records.filter(r=>!r.alive)){
    assert.ok(row.cause&&Number.isFinite(row.deathState.energy),'actual deaths retain cause and reserves');
    assert.ok(Number.isFinite(row.deathState.x)&&Number.isFinite(row.deathState.y));
  }
  console.log('family observer full-state/RNG equivalence: PASS');
}finally{assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()));assert.ok(path.basename(dir).startsWith('genvo8-family-observer-'));fs.rmSync(dir,{recursive:true,force:true});}
