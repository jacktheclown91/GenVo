import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {createObservatory} from '../tools/observatory.mjs';
// The observatory is read-only: an observed run (including its ecology rows
// and a persistence checkpoint) ends in exactly the same saved state.
const run=observe=>{const sim=new Simulation('PLANET-B0-A',{player:false,worldGenerator:'planetary/1'});
 const out=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'genvo-obs-')),'run.ndjson'),obs=observe?createObservatory(sim,{out,ecologyEvery:3,checkpointEvery:4}):null;
 for(let d=0;d<8;d++){for(let i=0;i<CFG.dayTicks;i++)sim.update(null);obs?.onDay()}
 const final=obs?.finish();return{snap:structuredClone(createSimulationSnapshot(sim,{savedAt:'t',reason:'t'})),out,final,ownKill:Object.hasOwn(sim,'kill')}};
const plain=run(false),observed=run(true);
assert.deepEqual(observed.snap,plain.snap,'observation does not change the simulation');assert.equal(observed.ownKill,false,'instrumentation is removed');
const rows=fs.readFileSync(observed.out,'utf8').trim().split('\n').map(l=>JSON.parse(l)),types=new Set(rows.map(r=>r.type));
for(const t of ['start','day','ecology','checkpoint','final'])assert.ok(types.has(t),t);
assert.equal(rows.filter(r=>r.type==='day').length,8);
console.log('Observatory neutrality PASS: identical complete saved state after 8 observed days, with daily, ecology, checkpoint and final records.');
