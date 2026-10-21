import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {regionKey} from '../src/world/planet-regions.js';
import {RegionalDirtyJournal} from '../src/persistence/regional-dirty.js';
import {partitionRegionalSnapshot} from '../src/persistence/regional-records.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {reconcilePlanetarySaltSeams,syncPlanetaryBoundaryOwnership} from '../src/world/planetary-seam-salt.js';
import {preparePlanetarySeams,cancelPlanetarySeams} from '../src/world/planetary-seam-work.js';
const snapshot=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'seam-work',reason:'seam-work'}));
// Real generated coastal geography and one ordinary completed physical day.
// Empty bootstrap isolates conservation; it is not a population acceptance run.
const regions=[{x:0,y:2560},{x:128,y:2560},{x:0,y:2688}].map(planetOrigin=>new Simulation('GENVO8-TEST-A',{player:false,bootstrap:false,worldGenerator:'planetary/1',planetOrigin}));
for(const s of regions)for(let k=0;k<CFG.dayTicks;k++)s.update(null);
const active=regions[0];active.planetaryTravel={schema:1,nextId:1,sessions:regions.slice(1).map(s=>({key:regionKey(s.world.regionOrigin),biologicalMode:'canonical-ticks/1',snapshot:snapshot(s)}))};syncPlanetaryBoundaryOwnership(active);
const before=snapshot(active),direct=restoreSimulationSnapshot(structuredClone(before)),paced=restoreSimulationSnapshot(structuredClone(before));
const journal=new RegionalDirtyJournal(),slot='world-seam-journal-test',root=partitionRegionalSnapshot(snapshot(direct),slot).root,baseline=journal.capture(direct,slot,root),priorSnapshots=direct.planetaryTravel.sessions.map(s=>s.snapshot);journal.acknowledge(baseline,root.regionalPersistence.capture);
const expected=reconcilePlanetarySaltSeams(direct);assert.ok(expected.length>0,'actual finite stocks generate seam exchanges');
assert.ok(direct.planetaryTravel.sessions.every((s,i)=>s.snapshot===priorSnapshots[i]),'seam test exercises in-place snapshot publication');assert.equal(journal.capture(direct,slot,root).changed.length,2,'all actual paired physical owners become dirty despite unchanged snapshot identities');
let units=0,pairs=0,progress;
while((progress=preparePlanetarySeams(paced))){assert.equal(paced.tickCount,before.core.tickCount);assert.equal(paced.rng.state,before.rngState);assert.equal(paced.planetaryTravel.seamLedger,undefined,'no partial ledger is published');if(progress.phase==='pair-staging'){pairs++;assert.deepEqual(snapshot(paced),before,'pair staging does not publish any stock or receipt')}assert.ok(++units<40)}
assert.ok(units>=8);assert.equal(pairs,2,'three L-shaped regions process exactly their two real adjacent pairs');assert.deepEqual(snapshot(paced),snapshot(direct),'yielded and direct fluxes, resources, receipts and all simulation state are exact');assert.equal(preparePlanetarySeams(paced),null,'completed day cannot exchange twice');
const interrupted=restoreSimulationSnapshot(structuredClone(before));assert.ok(preparePlanetarySeams(interrupted));const mid=snapshot(interrupted),resumed=restoreSimulationSnapshot(structuredClone(mid));cancelPlanetarySeams(interrupted);while(preparePlanetarySeams(interrupted)){}while(preparePlanetarySeams(resumed)){}assert.deepEqual(snapshot(interrupted),snapshot(resumed),'save/reload and cancellation restart uncommitted work exactly');
const edited=restoreSimulationSnapshot(structuredClone(before));while(preparePlanetarySeams(edited)?.phase!=='pair-staging'){};
// A representable boundary mineral transfer between two existing cells models
// an intervening physical action without inventing mineral stock.
const minerals=edited.world.plantResources.minerals,a=0,b=1,amount=Math.min(.0001,minerals[a]);minerals[a]-=amount;minerals[b]+=amount;const changed=snapshot(edited),clean=restoreSimulationSnapshot(structuredClone(changed));reconcilePlanetarySaltSeams(clean);
let restarted=false;while((progress=preparePlanetarySeams(edited))){if(progress.phase==='restart'){restarted=true;assert.deepEqual(snapshot(edited),changed,'stale work is discarded without overwriting the actual intervening transfer')}assert.ok(++units<90)}assert.ok(restarted);assert.deepEqual(snapshot(edited),snapshot(clean),'restarted transaction uses the new actual stocks');
const corrupt=restoreSimulationSnapshot(structuredClone(before));assert.ok(preparePlanetarySeams(corrupt));corrupt.planetaryTravel.sessions[1].snapshot.world.environment.salt[0]=NaN;assert.throws(()=>{while(preparePlanetarySeams(corrupt)){}},/Invalid frozen\/liquid water partition/);assert.equal(corrupt.planetaryTravel.seamLedger,undefined,'invalid late region cannot half-publish a transaction');
console.log('Incremental seam work PASS: genuine three-region day, one pair per unit, atomic no-write staging, exact direct parity, resume/cancel, changed-stock restart and malformed-source rejection.');
