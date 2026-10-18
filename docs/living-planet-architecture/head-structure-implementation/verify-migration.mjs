import fs from 'node:fs';
import assert from 'node:assert/strict';
import {deserialize} from 'node:v8';
import {createHash} from 'node:crypto';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../../../src/persistence/save-manager.js';
import {birthRuleMigrationMessage} from '../../../src/lineage/birth-rules.js';
const inputs=['docs/player-journey/mature-handoff-confirmed-16/checkpoint.snapshot.bin','docs/living-planet-architecture/optional-organ-loss/birth-audit/before-conception.snapshot.bin','docs/living-planet-architecture/optional-organ-loss/birth-audit/mid-gestation.snapshot.bin'];
const rows=[];
for(const file of inputs){
 const bytes=fs.readFileSync(file),raw=deserialize(bytes),unchanged=structuredClone(raw),sim=restoreSimulationSnapshot(structuredClone(raw));
 assert.equal(sim.birthRules.bodyVariation,'neutral-head-structure/1');assert.ok(birthRuleMigrationMessage(sim));
 assert.deepEqual(sim.animals,raw.animals);assert.equal(sim.rng.state,raw.rngState);
 const snapshot=s=>createSimulationSnapshot(s,{savedAt:'fixed',reason:'paired-loss-repair-verification'}),state=snapshot(sim);
 assert.deepEqual(state.world,raw.world);assert.deepEqual(state.controllers,raw.controllers);
 const receipt=sim.birthRuleMigrations.at(-1);assert.equal(receipt.from.bodyVariation,'neutral-optional-loss/1');assert.equal(receipt.to.bodyVariation,'neutral-head-structure/1');
 const restored=restoreSimulationSnapshot(structuredClone(state));assert.deepEqual(snapshot(restored),state);assert.equal(birthRuleMigrationMessage(restored),null);
 sim.paused=false;restored.paused=false;for(let i=0;i<6;i++){sim.update(null);restored.update(null)}assert.deepEqual(snapshot(sim),snapshot(restored));
 const middle=restoreSimulationSnapshot(structuredClone(snapshot(sim)));for(let i=0;i<6;i++){sim.update(null);middle.update(null)}assert.deepEqual(snapshot(sim),snapshot(middle));
 assert.deepEqual(raw,unchanged);
 rows.push({file,sha256:createHash('sha256').update(bytes).digest('hex'),day:raw.core.day,playerId:raw.core.playerId,pendingPregnancies:raw.animals.filter(a=>a.pregnant).length,unchangedAnimalsWorldControllersRng:true,receipt,exactMigratedRoundtrip:true,realUpdates:12,intermediateRestoreAt:6,continuationEqual:true});
}
fs.writeFileSync('docs/living-planet-architecture/head-structure-implementation/save-migration.json',JSON.stringify({scope:'Actual preserved native and optional-loss experimental archives; future-birth migration only, no historical body or pregnancy rewriting. Not live-browser migration acceptance.',status:'PASS',rows},null,2));
console.log(JSON.stringify({status:'PASS',rows:rows.map(({file,pendingPregnancies})=>({file,pendingPregnancies}))}));
