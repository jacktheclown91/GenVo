import {founderMatePreferences} from '../src/reproduction/mate-preferences.js';
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {PlanetaryPreparation} from '../src/world/planetary-preparation.js';
import {planetaryTravelAvailability,crossPlanetaryBorder,preparePlanetaryDestination} from '../src/world/planetary-travel.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const s=new Simulation('PLANET-B0-A',{worldGenerator:'planetary/1'}),p=s.player();let status;
for(let y=8.5;y<119;y++){p.x=125.2;p.y=y;const q=planetaryTravelAvailability(s);if(q.enabled){status=q;break}}assert.ok(status);
const snapshot=structuredClone(createSimulationSnapshot(s,{savedAt:'preparation'})),jobs=[],cache=new PlanetaryPreparation({schedule:job=>jobs.push(job)});
const first=cache.request(s,status.to),duplicate=cache.request(s,status.to);assert.equal(first,duplicate);assert.equal(cache.has(s,status.to),false);assert.equal(jobs.length,1);jobs.shift()();assert.equal(await first,true);assert.equal(cache.stats.generated,1);assert.equal(cache.has(s,status.to),true);assert.deepEqual(createSimulationSnapshot(s,{savedAt:'preparation'}),snapshot,'preparation never advances source ecology or changes stocks/RNG');
const ready=cache.take(s,status.to);assert.equal(ready.animals.length,0);assert.equal(ready.tickCount,0);assert.equal(cache.size,0);assert.equal(cache.take(s,status.to),null,'one scaffold is promoted only once');
const direct=crossPlanetaryBorder(restoreSimulationSnapshot(structuredClone(snapshot))),prepared=crossPlanetaryBorder(s,{preparedDestination:ready});assert.ok(prepared.ok);assert.equal(prepared.simulation,ready,'the prepared Simulation is promoted, not regenerated');assert.deepEqual(createSimulationSnapshot(prepared.simulation,{savedAt:'same'}),createSimulationSnapshot(direct.simulation,{savedAt:'same'}),'prepared and ordinary crossings produce exactly identical full ecology');
const next=prepared.simulation;assert.equal(next.planetaryRegions.entries().length,1,'archived physical state does not retain a redundant live World');assert.equal(next.planetaryTravel.sessions.length,1);assert.ok(next.planetaryTravel.sessions[0].snapshot.animals.length>0,'the actual inactive organisms remain owned by their archive');
const saved=structuredClone(createSimulationSnapshot(next,{savedAt:'resume'}));assert.deepEqual(createSimulationSnapshot(restoreSimulationSnapshot(structuredClone(saved)),{savedAt:'resume'}),saved);
const beforeInvalid=structuredClone(createSimulationSnapshot(s,{savedAt:'invalid'}));assert.throws(()=>crossPlanetaryBorder(s,{preparedDestination:ready}),/Invalid or already owned/);assert.deepEqual(createSimulationSnapshot(s,{savedAt:'invalid'}),beforeInvalid,'invalid reuse does not alter source ownership');
const other=preparePlanetaryDestination(s,{x:0,y:128});assert.throws(()=>crossPlanetaryBorder(s,{preparedDestination:other}),/Invalid/);
const pending=[],bounded=new PlanetaryPreparation({schedule:job=>pending.push(job),capacity:2});const a=bounded.request(s,{x:0,y:128}),b=bounded.request(s,{x:-128,y:0}),c=bounded.request(s,{x:0,y:-128});assert.equal(await a,false);assert.equal(bounded.size,2);bounded.clear();while(pending.length)pending.shift()();assert.equal(await b,false);assert.equal(await c,false);assert.equal(bounded.stats.generated,0);assert.equal(bounded.size,0,'cancelled queued jobs release their source and scaffolds');
// Replacing a world may cancel an already scheduled callback, then immediately
// request a destination for the new owner. The old callback cannot drain it.
const lifecycleJobs=[],lifecycle=new PlanetaryPreparation({schedule:job=>lifecycleJobs.push(job)});
const obsolete=lifecycle.request(s,{x:0,y:128});const staleJob=lifecycleJobs.shift();lifecycle.clear();
assert.equal(await obsolete,false);const fresh=lifecycle.request(s,{x:0,y:-128});
staleJob();assert.equal(lifecycle.stats.generated,0);assert.equal(lifecycleJobs.length,1);
lifecycleJobs.shift()();assert.equal(await fresh,true);assert.equal(lifecycle.stats.generated,1);
// A non-visited survey remains a real owner and cannot be discarded just
// because a different visited World has an equivalent archived owner.
const source=restoreSimulationSnapshot(structuredClone(snapshot)),survey=source.planetaryRegions.neighbor(source.world.regionOrigin,'north',{create:true}),crossed=crossPlanetaryBorder(source);assert.ok(crossed.ok);assert.equal(crossed.simulation.planetaryRegions.get(survey.regionOrigin),survey);
const historical=restoreSimulationSnapshot(structuredClone(snapshot));delete historical.mateAssortmentRules;const oldDestination=preparePlanetaryDestination(historical,status.to);assert.equal(Object.hasOwn(oldDestination,'mateAssortmentRules'),false);const historicalCross=crossPlanetaryBorder(historical,{preparedDestination:oldDestination});assert.ok(historicalCross.ok);for(const animal of historicalCross.simulation.animals)if(animal.id!==historical.playerId)assert.deepEqual(animal.matePreferences,founderMatePreferences(historical.seed,animal.id),'new regional founders preserve the historical mate-policy distribution');

// Historical and modern worlds cannot share a destination scaffold: marine
// stocks are generated before promotion, and rules copied afterward cannot
// repair a scaffold generated under a different policy.
const noMarine=new Simulation(s.seed,{worldGenerator:'planetary/1',marineFood:false});
noMarine.player().x=p.x;noMarine.player().y=p.y;
const marineJobs=[],policyCache=new PlanetaryPreparation({schedule:job=>marineJobs.push(job)});
const marineRequest=policyCache.request(s,status.to),legacyRequest=policyCache.request(noMarine,status.to);
assert.notEqual(marineRequest,legacyRequest,'marine policy participates in preparation identity');
while(marineJobs.length)marineJobs.shift()();
assert.equal(await marineRequest,true);assert.equal(await legacyRequest,true);
const marineReady=policyCache.take(s,status.to),legacyReady=policyCache.take(noMarine,status.to);
assert.ok(marineReady.world.marineFood);assert.equal(Object.hasOwn(legacyReady,'marineFoodRules'),false);
const untouched=structuredClone(createSimulationSnapshot(noMarine,{savedAt:'wrong-policy'}));
assert.throws(()=>crossPlanetaryBorder(noMarine,{preparedDestination:marineReady}),/Invalid/);
assert.deepEqual(createSimulationSnapshot(noMarine,{savedAt:'wrong-policy'}),untouched);
const modernUntouched=structuredClone(createSimulationSnapshot(s,{savedAt:'modern-policy'}));
assert.throws(()=>crossPlanetaryBorder(s,{preparedDestination:legacyReady}),/Invalid/);
assert.deepEqual(createSimulationSnapshot(s,{savedAt:'modern-policy'}),modernUntouched);
const legacyDirect=crossPlanetaryBorder(restoreSimulationSnapshot(structuredClone(untouched)));
const legacyPrepared=crossPlanetaryBorder(noMarine,{preparedDestination:legacyReady});
assert.ok(legacyDirect.ok);assert.ok(legacyPrepared.ok);
assert.equal(Object.hasOwn(legacyPrepared.simulation,'marineFoodRules'),false);
assert.deepEqual(createSimulationSnapshot(legacyPrepared.simulation,{savedAt:'legacy-parity'}),createSimulationSnapshot(legacyDirect.simulation,{savedAt:'legacy-parity'}));
// A pending request captures its authority key, not permission to prepare
// under whatever rules the mutable source happens to have at execution time.
const driftSource=restoreSimulationSnapshot(structuredClone(snapshot)),driftJobs=[];
const driftCache=new PlanetaryPreparation({schedule:job=>driftJobs.push(job)});
const obsoletePolicy=driftCache.request(driftSource,status.to);
delete driftSource.marineFoodRules;
driftJobs.shift()();
assert.equal(await obsoletePolicy,false);assert.equal(driftCache.size,0);
assert.equal(driftCache.stats.generated,0);assert.equal(driftCache.stats.discarded,1);
const currentPolicy=driftCache.request(driftSource,status.to);
driftJobs.shift()();assert.equal(await currentPolicy,true);
assert.equal(Object.hasOwn(driftCache.take(driftSource,status.to),'marineFoodRules'),false);

console.log('Planetary preparation PASS: bounded/deduplicated canonical scaffolds, no source mutation, exact prepared/direct crossing, one-time promotion, archive-owned World eviction, retained survey/save identity and marine-policy isolation.');
