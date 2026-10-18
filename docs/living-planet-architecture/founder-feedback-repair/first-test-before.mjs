import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {ECOLOGY_RULES,ecologyRuleMigrationMessage} from '../src/ecology/rule-policy.js';
const s=new Simulation('FOUNDER-INDEPENDENT',{player:false,bootstrap:false});for(let i=0;i<6;i++)s.spawnAnimal('rootling');
const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'ecology-policy-test'})),before=snap(s),original=CFG.initial.rootling;
const read=()=>({boost:s.recovery.driveBoost('rootling'),near:s.recovery.mateRadius('rootling'),far:s.recovery.mateRadius('rootling',{far:true}),sparse:s.recovery.sparse('rootling'),critical:s.recovery.critical('rootling'),siblings:s.recovery.mayRelaxSibling(s.animals[0]),resource:s.carrying.breedingState(s.animals[0])});
const first=read();try{for(const count of [1,6,32,1000]){CFG.initial.rootling=count;assert.deepEqual(read(),first,'authoring founder counts cannot alter drive, sensing, kinship or local resource opportunity')}}finally{CFG.initial.rootling=original}
assert.deepEqual(snap(s),before);assert.deepEqual(s.ecologyRules,ECOLOGY_RULES);assert.equal(ecologyRuleMigrationMessage(s),null);
const old=structuredClone(before);delete old.core.ecologyRules;delete old.core.ecologyRuleMigrations;
const migrated=restoreSimulationSnapshot(structuredClone(old));assert.deepEqual(migrated.ecologyRules,ECOLOGY_RULES);assert.equal(migrated.ecologyRuleMigrations.length,1);assert.ok(ecologyRuleMigrationMessage(migrated));assert.equal(migrated.rng.state,old.rngState);assert.deepEqual(migrated.animals,old.animals);assert.deepEqual(snap(migrated).world,old.world);assert.deepEqual(migrated.stats,old.core.stats);
const saved=snap(migrated),again=restoreSimulationSnapshot(structuredClone(saved));assert.deepEqual(snap(again),saved);assert.equal(ecologyRuleMigrationMessage(again),null);for(let i=0;i<12;i++){migrated.update(null);again.update(null)}assert.deepEqual(snap(again),snap(migrated));
for(const rules of [{schema:2,populationFeedback:'local-opportunity/1'},{schema:1,populationFeedback:'unknown'},{schema:1,populationFeedback:'local-opportunity/1',extra:1}]){const bad=structuredClone(before);bad.core.ecologyRules=rules;assert.throws(()=>restoreSimulationSnapshot(bad),/ecology rules/)}
console.log('founder-independent ecology: unchanged local opportunity/biology, explicit future-behavior migration, unknown rejection and exact resume PASS');
