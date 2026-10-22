import assert from 'node:assert/strict';
import fs from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {CFG} from '../src/sim/config.js';
import {openScenarioSnapshot,validateScenarioCatalog} from '../src/persistence/scenario-library.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const catalog=validateScenarioCatalog(JSON.parse(fs.readFileSync(new URL('../assets/scenarios/catalog.json',import.meta.url),'utf8')));
const canonical=sim=>structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'bundled-regression'}));
for(const entry of catalog){
 console.log('Checking '+entry.id);
 const bytes=fs.readFileSync(new URL('../'+entry.file,import.meta.url));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256,'immutable bundled checkpoint hash');
 const original=openScenarioSnapshot(JSON.parse(gunzipSync(bytes))),seed=original.rngState;
 assert.equal(original.core.marineFoodRules,undefined,'real historical planetary fixture predates marine policy');
 const sim=restoreSimulationSnapshot(structuredClone(original));
 assert.equal(sim.world.generator,'planetary/1');assert.equal(sim.marineFoodRules,undefined);assert.equal(sim.world.marineFood,undefined,'historical ecology is not opted into marine stock');
 assert.equal(sim.day,entry.day);assert.equal(sim.tickCount,original.core.tickCount);assert.equal(sim.rng.state,seed);
 assert.equal(sim.animals.filter(a=>a.alive).length,entry.liveAnimals);assert.ok(isDeepStrictEqual(sim.animals,original.animals),'restored organisms match the authentic checkpoint');
 assert.ok(isDeepStrictEqual(sim.world.plants,original.world.plants),'physical plant stocks');assert.ok(isDeepStrictEqual(sim.world.freshwaterFood,original.world.freshwaterFood),'freshwater stocks');
 const checkpoint=canonical(sim),back=restoreSimulationSnapshot(structuredClone(checkpoint));assert.ok(isDeepStrictEqual(canonical(back),checkpoint),'complete historical roundtrip');
 for(let tick=0;tick<CFG.lifeStride;tick++){sim.update(null);back.update(null)}
 assert.ok(isDeepStrictEqual(canonical(back),canonical(sim)),'complete exact continuation: '+entry.id);
 // The regeneration reference path must retain exactly the same saved policy.
 const generated=restoreSimulationSnapshot(structuredClone(original),{regenerateWorld:true});assert.ok(isDeepStrictEqual(canonical(generated),checkpoint),'regenerated historical scaffold matches direct restore');
 console.log(entry.id+' PASS: authentic historical planetary restore, no marine adoption, unchanged organisms/stocks/RNG, exact roundtrip, continuation and regeneration parity');
}
