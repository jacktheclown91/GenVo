import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {DIGGING_RULES,enableFiniteDigging} from '../src/lineage/digging-rules.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
const snap=s=>createSimulationSnapshot(s,{savedAt:'fixed',reason:'finite-policy'});
const current=new Simulation('FINITE-POLICY',{player:false});assert.equal(current.diggingRules,DIGGING_RULES.finite);
const historical=snap(current);delete historical.core.diggingRules;
const legacy=restoreSimulationSnapshot(structuredClone(historical));assert.ok(!Object.hasOwn(legacy,'diggingRules'));assert.ok(isDeepStrictEqual(snap(legacy),historical),'missing policy remains absent and legacy');
const before=snap(legacy);assert.throws(()=>enableFiniteDigging(legacy),/explicit source/);assert.ok(isDeepStrictEqual(snap(legacy),before));
assert.equal(enableFiniteDigging(legacy,{source:'controlled-policy-test'}).changed,true);
const migrated=snap(legacy),stripped=structuredClone(migrated);delete stripped.core.diggingRules;delete stripped.core.diggingRuleMigrations;assert.ok(isDeepStrictEqual(stripped,before),'adoption preserves every biological/resource field');
assert.equal(enableFiniteDigging(legacy,{source:'controlled-policy-test'}).changed,false);assert.ok(isDeepStrictEqual(snap(restoreSimulationSnapshot(migrated)),migrated));
for(const value of [null,undefined,'future-unknown/9']){const bad=structuredClone(migrated);bad.core.diggingRules=value;assert.throws(()=>restoreSimulationSnapshot(bad),/Unknown digging rules/)}
const badHistory=structuredClone(migrated);badHistory.core.diggingRuleMigrations[0].globalTick=-1;assert.throws(()=>restoreSimulationSnapshot(badHistory),/Invalid digging migration/);
const badSite=structuredClone(migrated);badSite.controllers.discovery.sites.push({id:999,kind:'root-mound',finiteHarvests:-1});assert.throws(()=>restoreSimulationSnapshot(badSite),/Invalid saved finite mound/);
for(const missing of [false,true]){
 const s=new Simulation('PLANET-B0-A',{player:true,worldGenerator:'planetary/1'});if(missing)delete s.diggingRules;
 let found=false;for(let y=8.5;y<118.5;y++){s.player().x=125.2;s.player().y=y;if(planetaryTravelAvailability(s).enabled){found=true;break}}assert.ok(found);
 const trip=crossPlanetaryBorder(s);assert.equal(trip.ok,true);const dest=trip.simulation;
 assert.equal(Object.hasOwn(dest,'diggingRules'),!missing);assert.equal(dest.diggingRules,missing?undefined:DIGGING_RULES.finite);
 const saved=snap(dest);assert.ok(isDeepStrictEqual(snap(restoreSimulationSnapshot(structuredClone(saved))),saved));
 const mixed=structuredClone(saved);mixed.core.planetaryTravel.sessions[0].snapshot.core.diggingRules=missing?DIGGING_RULES.finite:DIGGING_RULES.legacy;assert.throws(()=>restoreSimulationSnapshot(mixed),/Inconsistent planetary digging rules/);
}
console.log('finite digging policy: defaults, exact legacy representation, atomic adoption, rejection, travel and ordinary restore PASS');
