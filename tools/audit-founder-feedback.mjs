import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
const out='docs/living-planet-architecture/founder-feedback-audit.json';if(fs.existsSync(out))throw Error('Existing audit receipt must be preserved.');
const s=new Simulation('FOUNDER-FEEDBACK-AUDIT',{player:false,bootstrap:false});for(let i=0;i<6;i++)s.spawnAnimal('rootling');const a=s.animals[0],before=structuredClone(createSimulationSnapshot(s,{savedAt:'fixed'})),original=CFG.initial.rootling;
const read=()=>({actualLiving:s.population().rootling,authoringInitial:CFG.initial.rootling,driveBoost:s.recovery.driveBoost('rootling'),nearMateRadius:s.recovery.mateRadius('rootling'),farMateRadius:s.recovery.mateRadius('rootling',{far:true}),critical:s.recovery.critical('rootling'),mayRelaxSibling:s.recovery.mayRelaxSibling(a)});
let first,second;try{first=read();CFG.initial.rootling=1;second=read();assert.deepEqual(createSimulationSnapshot(s,{savedAt:'fixed'}),before,'the runtime world, organisms and RNG are unchanged')}finally{CFG.initial.rootling=original}
assert.notDeepEqual(first,second);assert.notEqual(first.driveBoost,second.driveBoost);assert.notEqual(first.farMateRadius,second.farMateRadius);assert.notEqual(first.mayRelaxSibling,second.mayRelaxSibling);
const files=['src/ecology/recovery.js','src/ecology/carrying.js','src/sim/simulation.js','src/sim/config.js'];
fs.writeFileSync(out,JSON.stringify({schema:'genvo.founder-feedback-audit/1',scope:'Controlled same-runtime-state counterfactual: six explicitly spawned mechanism-fixture organisms, no ancestry claim. Only authoring initial-population configuration changes temporarily, restored afterward. Demonstrates founder-target feedback, not outcomes or rescue spawning.',sourceHashes:Object.fromEntries(files.map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')])),first,second,completeSnapshotUnchanged:true,configurationRestored:CFG.initial.rootling===original,conclusion:'Founder-relative global counts alter reproductive drive, search radius and sibling-relaxation eligibility without changed local environment, organisms or RNG.'},null,2));console.log(JSON.stringify({first,second,completeSnapshotUnchanged:true}));
