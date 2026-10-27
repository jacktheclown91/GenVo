import assert from 'node:assert/strict';
import {CFG} from '../src/sim/config.js';
import {restoreSimulationSnapshot,restoreDetachedSimulationSnapshot} from '../src/persistence/save-manager.js';
import {advanceRemoteBiology} from '../src/world/planetary-offscreen-biology.js';
import {dispersalContextFor,setDispersalContext,emigrate,takeEmigrants,deliverEmigrants} from '../src/world/planetary-dispersal.js';
import {canOccupy} from '../src/lineage/lifestyle.js';
import {regionalIdentity,verifyRegionalIdentity} from '../src/world/regional-identities.js';
import {partitionRegionalSnapshot} from '../src/persistence/regional-records.js';
import {parkRegion,unloadRegion,reloadRegion,validateRegionalResidency} from '../src/world/regional-residency.js';
import {createRegionalHistoryWorld,controlledEastCrossing,recordControlledBranch,
  replaceControlledSession,regionalSnapshot as snapshot} from './helpers/regional-evolution-world.mjs';

// Controlled frontier placement/reserves and recorded classifications; not
// natural emergence or migration-choice acceptance. Normal biological steps,
// real organisms, authoritative ownership and complete saves remain in use.
let sim=createRegionalHistoryWorld();
for(const animal of sim.animals.filter(a=>a.alive)){
  assert.ok(sim.evolutionTree.node(animal.evolutionaryAncestry.rootId).memberIds.has(animal.id));
}
const exactContinuation=(sim,ticks=6)=>{
  const saved=snapshot(sim),restored=restoreSimulationSnapshot(structuredClone(saved));
  assert.deepEqual(snapshot(restored),saved);
  for(let n=0;n<ticks;n++){sim.update(null);restored.update(null)}
  assert.deepEqual(snapshot(restored),snapshot(sim));
};
exactContinuation(sim,0);
let session=sim.planetaryTravel.sessions.find(s=>s.key==='0,0');
let source=restoreDetachedSimulationSnapshot(session.snapshot);
const resident=source.animals.find(a=>a.alive&&!a.lineage&&a.species==='mosskip');assert.ok(resident);
const residentBranch=recordControlledBranch(source,resident,'resident');
replaceControlledSession(session,source);
source=restoreDetachedSimulationSnapshot(session.snapshot);
const carrier=source.animals.find(a=>a.alive&&!a.lineage&&a.species==='mosskip'&&a.id!==resident.id);assert.ok(carrier);
const carrierBranch=recordControlledBranch(source,carrier,'carrier');
const context=dispersalContextFor(sim,'0,0',source.tickCount);assert.ok(context?.open('east'));
let positioned=false;
for(let y=8.5;y<118.5;y++)if(canOccupy(carrier,source.world,125.5,y)&&context.arrival('east',125.5,y,carrier)){
  carrier.x=125.5;carrier.y=y;positioned=true;break;
}
assert.ok(positioned);
const genes=structuredClone(carrier.genes),body=structuredClone(carrier.bodyPlan);
setDispersalContext(source,context);assert.equal(emigrate(source,carrier,'east'),true);
const emigrants=takeEmigrants(source);assert.equal(emigrants.length,1);
replaceControlledSession(session,source);
assert.equal(sim.evolutionTree.node(carrierBranch.id),null);
assert.equal(deliverEmigrants(sim,context,emigrants).length,1);
const immigrant=sim.animals.find(a=>a.id===carrier.id);
assert.deepEqual(immigrant.genes,genes);assert.deepEqual(immigrant.bodyPlan,body);
assert.equal(sim.evolutionTree.taxonFor(immigrant),carrierBranch.id);
assert.equal(sim.speciation.identityFor(immigrant).id,carrierBranch.id);
const remaining=source.animals.find(a=>a.alive&&!a.lineage&&a.id!==resident.id);
assert.ok(remaining);
const batchBefore=snapshot(sim);
const allowed={animal:remaining,direction:'east',from:emigrants[0].from,day:source.day,tick:source.tickCount,
  evolutionaryHistory:source.evolutionTree.recordedHistoryFor([remaining])};
assert.throws(()=>deliverEmigrants(sim,context,[allowed,emigrants[0]]),/identity already present/);
assert.deepEqual(snapshot(sim),batchBefore,'An invalid later delivery cannot partially publish an earlier receiver');
assert.equal(sim.evolutionTree.node(residentBranch.id),null,'Only the actual carrier ancestry was transported');
exactContinuation(sim);
session=sim.planetaryTravel.sessions.find(s=>s.key==='0,0');
if(!sim.evolutionTree.node(residentBranch.id)){
  if(session.snapshot.core.tickCount===sim.tickCount)sim.update(null);
  const replay=advanceRemoteBiology(sim,session,{maxTicks:CFG.lifeStride});
  assert.ok(replay.ticks>0);
}
assert.ok(sim.evolutionTree.node(residentBranch.id),'Canonical offscreen publication retains its actual history');
assert.equal(sim.evolutionTree.snapshot().find(n=>n.id===residentBranch.id).living,1,
  'Living archived carriers cannot be reported extinct by a local-only census');

// Local disappearance is not remote gene flow or planet-wide extinction.
session=sim.planetaryTravel.sessions.find(s=>s.key==='0,0');
source=restoreDetachedSimulationSnapshot(session.snapshot);
source.evolutionTree.onBoundaryEnded(carrierBranch,'Recorded source population disappearance',{extinct:true});
replaceControlledSession(session,source);
if(session.snapshot.core.tickCount===sim.tickCount)sim.update(null);
advanceRemoteBiology(sim,session,{maxTicks:CFG.lifeStride});
assert.equal(sim.evolutionTree.node(carrierBranch.id).status,'extinct','Original local event remains recorded');
assert.equal(sim.evolutionTree.taxonFor(immigrant),carrierBranch.id,'An unchanged remote carrier retains its assignment');
assert.equal(sim.evolutionTree.snapshot().find(n=>n.id===carrierBranch.id).status,'living');
assert.equal(sim.evolutionTree.events.find(e=>e.branchId===carrierBranch.id&&e.type==='extinct').scope,'population-boundary');

// Real further crossings make the original region eligible for indexed unload.
sim=controlledEastCrossing(sim);sim=controlledEastCrossing(sim);
session=sim.planetaryTravel.sessions.find(s=>s.key==='0,0');
parkRegion(sim,session);
const slot='world-evolution-history-codec';
const plan=partitionRegionalSnapshot(snapshot(sim),slot);
const entry=plan.root.regionalPersistence.entries.find(e=>e.kind==='session'&&e.key==='0,0');
const record=plan.records.find(r=>r.value.kind==='session'&&r.value.key==='0,0').value;
assert.ok(entry.life.evolution,'New flagged records project the existing authority, not a second species registry');
const before=snapshot(sim),censusBefore=sim.evolutionTree.snapshot(),rng=sim.rng.state;
for(let n=0;n<4;n++)sim.evolutionTree.snapshot();
assert.deepEqual(snapshot(sim),before,'Global census reads are completely pure');
const unloaded=unloadRegion(sim,session,entry);validateRegionalResidency(sim);
assert.deepEqual(sim.evolutionTree.snapshot(),censusBefore,'Unloading changes neither known taxon counts nor status');
assert.equal(sim.rng.state,rng);

const bad=structuredClone(entry.life);
bad.evolution.counts[0].id='unrecorded-taxon';
assert.throws(()=>verifyRegionalIdentity(bad,session.snapshot,{mode:session.biologicalMode}),/taxon/);
const oldHeader=structuredClone(entry.life);delete oldHeader.evolution;
verifyRegionalIdentity(oldHeader,session.snapshot,{mode:session.biologicalMode});
const unknown=structuredClone(unloaded);delete unknown.life.evolution;
sim.planetaryTravel.unloaded=sim.planetaryTravel.unloaded.map(e=>e===unloaded?unknown:e);
const knownButUnobserved=restoreSimulationSnapshot(snapshot(sim));
assert.equal(knownButUnobserved.evolutionTree.snapshot().find(n=>n.id===residentBranch.id).status,'unknown',
  'A missing older projection must not become a false extinction');
const oldSnapshot=snapshot(sim);
// Earlier flagged regional saves could also lack an active copy of a real
// archived node. Loading stays exact; acquiring its actual record restores it.
oldSnapshot.controllers.evolutionTree.nodes.delete(residentBranch.id);
oldSnapshot.controllers.evolutionTree.events=oldSnapshot.controllers.evolutionTree.events.filter(e=>e.branchId!==residentBranch.id);
const older=restoreSimulationSnapshot(structuredClone(oldSnapshot));
assert.deepEqual(snapshot(older),oldSnapshot,'Old absent projections load without an implicit migration');
assert.equal(older.evolutionTree.node(residentBranch.id),null);
assert.ok(older.evolutionTree.snapshot().some(n=>n.censusComplete===false));
assert.ok(older.evolutionTree.treeLines().some(line=>line.includes('last recorded')));
const oldEntry=older.planetaryTravel.unloaded.find(e=>e.key==='0,0');
reloadRegion(older,oldEntry,structuredClone(record.payload));
assert.equal(older.evolutionTree.snapshot().find(n=>n.id===residentBranch.id).living,1,
  'Actual reload recovers its observed census without manufacturing a taxon');
assert.equal(older.evolutionTree.node(residentBranch.id).id,residentBranch.id);
const reloadedSession=older.planetaryTravel.sessions.find(s=>s.key==='0,0');
const dyingSource=restoreDetachedSimulationSnapshot(reloadedSession.snapshot);
const lastCarrier=dyingSource.animals.find(a=>a.id===resident.id);
assert.ok(lastCarrier?.alive);
const deaths=dyingSource.stats.deaths;
dyingSource.kill(lastCarrier,'controlled-last-known-carrier-death');
assert.equal(dyingSource.stats.deaths,deaths+1);
replaceControlledSession(reloadedSession,dyingSource);
older.evolutionTree.mergeRecordedHistory(dyingSource.evolutionTree.recordedHistory());
assert.equal(older.evolutionTree.snapshot().find(n=>n.id===residentBranch.id).status,'extinct',
  'Only a complete actual all-owner census can establish this extinction');
assert.equal(older.evolutionTree.node(residentBranch.id).memberIds.has(resident.id),true,
  'Actual death never discards historical ancestry');
console.log('Regional evolutionary history PASS: real crossings/replay, carrier genotype and ancestry, no distant forced rejoining, pure global resident/unloaded census, exact saves, old absent projections and authoritative reload. Controlled classifications/placement; no natural-emergence claim.');
