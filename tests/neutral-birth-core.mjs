import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {BIRTH_RULES} from '../src/lineage/birth-rules.js';
const source=new Simulation('NEUTRAL-CORE-CONTEXT',{player:false,bootstrap:false});
source.spawnAnimal('genvo',32,32);source.spawnAnimal('genvo',33,32);
const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'neutral-core'}));
const saved=snap(source),rows=[];
for(const lineage of [false,true])for(const pressure of ['none','wetness','predation','dryness']){
 const s=restoreSimulationSnapshot(structuredClone(saved));const parents=s.animals;
 for(const p of parents)p.lineage=lineage;
 s.pressure.lifetimeSummary=()=>pressure==='none'?[]:[{kind:pressure,score:100}];
 const [child]=s.spawnFundedOffspring(parents[0],parents[1],parents,{count:1,x:32,y:32,energyBudget:12,hydrationBudget:12});
 rows.push({genes:structuredClone(child.genes),anatomy:structuredClone(child.anatomy),adaptations:[...child.adaptations],body:structuredClone(child.bodyPlan),rng:s.rng.state});
}
for(const row of rows)assert.deepEqual(row,rows[0],'exposure or lineage membership must not instruct this newborn germline/structural variation');
const old=structuredClone(saved);delete old.core.birthRules;delete old.core.birthRuleMigrations;
const oldAnimals=structuredClone(old.animals),oldWorld=structuredClone(old.world),oldRng=old.rngState;
const migrated=restoreSimulationSnapshot(old);
assert.deepEqual(migrated.animals,oldAnimals);assert.deepEqual(snap(migrated).world,oldWorld);assert.equal(migrated.rng.state,oldRng);
assert.deepEqual(migrated.birthRules,BIRTH_RULES);assert.equal(migrated.birthRuleMigrations.length,1);assert.match(migrated.birthRuleMigrations[0].scope,/existing organisms/);
const current=snap(migrated),resumed=restoreSimulationSnapshot(structuredClone(current));assert.deepEqual(snap(resumed),current,'migration is recorded exactly once');
for(let i=0;i<12;i++){migrated.update(null);resumed.update(null)}assert.deepEqual(snap(migrated),snap(resumed));
const bad=structuredClone(saved);bad.core.birthRules.inheritedVariation='unknown';assert.throws(()=>restoreSimulationSnapshot(bad),/birth rules/);
console.log('neutral newborn core: exposure/control-lineage independence, unchanged old organisms/world/RNG, explicit migration and exact new-policy resume PASS');
