import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {createSimulationSnapshot,createActiveRegionalSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {partitionRegionalSnapshot,partitionRegionalJournal,assembleRegionalSnapshot,validateRegionalIndex} from '../src/persistence/regional-records.js';
import {RegionalDirtyJournal} from '../src/persistence/regional-dirty.js';
import {validatePlanetAnimalOwnership} from '../src/world/planet-regions.js';
import {REGIONAL_RESIDENCY,unloadCandidates,reloadCandidates,parkRegion,unloadRegion,reloadRegion,validateRegionalResidency,rotationCandidate} from '../src/world/regional-residency.js';
import {POPULATION_MODE,remoteBiologicalDebt,advanceRemoteBiology} from '../src/world/planetary-offscreen-biology.js';

// The same plan application as commitRegionalPlan, over an in-memory store.
const slot='world-residency-test-0001',store=new Map(),journal=new RegionalDirtyJournal();let root=null,writes=[];
function save(sim){
 const ticket=journal.capture(sim,slot,root);
 const plan=ticket.plan?partitionRegionalJournal(createActiveRegionalSnapshot(sim,{savedAt:'t',reason:'t'}),slot,root,ticket.plan.map(o=>o.payload&&o.kind==='survey'?{...o,payload:{origin:o.payload.origin,world:structuredClone(o.payload.world)}}:o))
  :partitionRegionalSnapshot(createSimulationSnapshot(sim,{savedAt:'t',reason:'t'}),slot);
 const index=validateRegionalIndex(plan.root,slot),keep=new Set([...index.entries,index.active].map(e=>e.id));
 for(const e of index.entries)if(e.unloaded)assert.ok(store.has(e.id),'an unloaded reference names an existing record');
 writes=plan.records.map(r=>r.value.key+':'+r.value.kind);
 for(const r of plan.records)store.set(r.id,structuredClone(r.value));
 for(const id of [...store.keys()])if(!keep.has(id))store.delete(id);
 root=structuredClone(plan.root);journal.acknowledge(ticket,root.regionalPersistence.capture);return plan;
}
const recordsFor=(residentOnly)=>{const index=root.regionalPersistence;return[...(residentOnly?index.entries.filter(e=>!e.unloaded):index.entries),index.active].map(e=>store.get(e.id))};
const load=(residentOnly)=>restoreSimulationSnapshot(structuredClone(assembleRegionalSnapshot(root,slot,recordsFor(residentOnly),{residentOnly})));
function cross(sim,x){
 const p=sim.player();p.energy=SPECIES[p.species].maxEnergy*.94;p.hydration=SPECIES[p.species].maxHydration*.95;
 for(let y=8.5;y<118.5;y++){p.x=x;p.y=y;sim.rebuildSpatial();const status=planetaryTravelAvailability(sim);if(status.enabled){const r=crossPlanetaryBorder(sim);assert.equal(r.ok,true,r.message);return r.simulation}if(/loading|catching up/.test(status.reason))return status}
 throw Error('no traversable border');
}
// Bring every far region to unloaded storage exactly as the runtime does.
function settle(sim){
 for(let guard=0;guard<40;guard++){
  const far=unloadCandidates(sim)[0];if(!far)return;
  if(!far.parked)parkRegion(sim,far);
  const entry=root?.regionalPersistence.entries.find(e=>e.kind==='session'&&e.key===far.key&&!e.unloaded);
  if(entry&&journal.clean(sim,slot,root,far))unloadRegion(sim,far,entry);else save(sim);
 }
 throw Error('far regions did not settle');
}

let sim=new Simulation('PLANET-B0-A',{player:true,worldGenerator:'planetary/1'});
assert.equal(sim.regionalResidencyRules,REGIONAL_RESIDENCY.policy);
save(sim);
const visited=[];
for(let k=0;k<4;k++){sim=cross(sim,125.2);visited.push(sim.world.regionOrigin.x);save(sim);settle(sim)}
assert.deepEqual(sim.world.regionOrigin,{x:512,y:0});
const unloaded=sim.planetaryTravel.unloaded.map(e=>e.key).sort();
assert.deepEqual(unloaded,['0,0','128,0'],'regions beyond two steps leave memory');
assert.deepEqual(sim.planetaryTravel.sessions.map(s=>s.key).sort(),['256,0','384,0']);
validateRegionalResidency(sim);validatePlanetAnimalOwnership(sim.animals,sim.planetaryTravel);
for(const e of sim.planetaryTravel.unloaded)assert.equal(e.life.mode,POPULATION_MODE);

// Saves retain unloaded records by reference and write only changed owners.
const homeRecord=store.get(sim.planetaryTravel.unloaded.find(e=>e.key==='0,0').id);
for(let i=0;i<CFG.lifeStride;i++)sim.update();
save(sim);
assert.ok(!writes.some(w=>w.startsWith('0,0')||w.startsWith('128,0')),'unloaded regions are never rewritten from memory');
assert.strictEqual(store.get(root.regionalPersistence.entries.find(e=>e.key==='0,0').id),homeRecord);

// Live loading keeps unloaded regions on disk; complete reads hydrate them.
const resident=load(true);
assert.deepEqual(resident.planetaryTravel.unloaded.map(e=>e.key).sort(),['0,0','128,0']);
assert.equal(resident.planetaryTravel.sessions.length,2);
const complete=load(false);
assert.equal(complete.planetaryTravel.unloaded,undefined);
assert.deepEqual(complete.planetaryTravel.sessions.map(s=>s.key).sort(),['0,0','128,0','256,0','384,0'],'export/fork reads stay complete');
const forged=structuredClone(root);forged.regionalPersistence.entries.find(e=>e.unloaded).unloaded='yes';
assert.throws(()=>validateRegionalIndex(forged,slot),/unloaded/);

// Returning: a region the crossing needs nearby must be resident and caught up.
sim=cross(sim,2.6);save(sim);settle(sim);
assert.deepEqual(sim.world.regionOrigin,{x:384,y:0});
assert.deepEqual(reloadCandidates(sim).map(e=>e.key),['128,0']);
let status=cross(sim,2.6);
assert.equal(status.enabled,false);assert.match(status.reason,/128,0 is still loading/);
const entry=reloadCandidates(sim)[0],payload=store.get(entry.id).payload;
assert.throws(()=>reloadRegion(sim,entry,{...structuredClone(payload),key:'0,0'}),/does not belong/);
const back=reloadRegion(sim,entry,structuredClone(payload));
assert.ok(remoteBiologicalDebt(sim,back)>0,'a reloaded region resumes from its committed clock');
while(remoteBiologicalDebt(sim,back)>0)advanceRemoteBiology(sim,back,{maxTicks:CFG.dayTicks});
sim=cross(sim,2.6);save(sim);settle(sim);
assert.deepEqual(sim.world.regionOrigin,{x:256,y:0});
assert.equal(sim.planetaryTravel.sessions.find(s=>s.key==='128,0').biologicalMode,'canonical-ticks/1','the reloaded region returns to individual simulation');
validatePlanetAnimalOwnership(sim.animals,sim.planetaryTravel);

// Rotation picks the unloaded region furthest behind.
for(let i=0;i<CFG.dayTicks;i++)sim.update();
const rotation=rotationCandidate(sim);assert.ok(rotation,'an unloaded region behind by a day is offered for rotation');

// Exploration is not capped at sixteen regions.
for(let k=0;k<17;k++){const next=cross(sim,125.2);assert.ok(next instanceof Simulation,next.reason);sim=next;save(sim);settle(sim)}
const explored=1+sim.planetaryTravel.sessions.length+sim.planetaryTravel.unloaded.length;
assert.ok(explored>16,'explored '+explored+' regions');
assert.ok(sim.planetaryTravel.sessions.length<=REGIONAL_RESIDENCY.maxResident);
save(sim);const reopened=load(true);validateRegionalResidency(reopened);
assert.equal(reopened.planetaryTravel.unloaded.length,sim.planetaryTravel.unloaded.length);
console.log('Regional residency PASS: far regions unload to committed records, saves retain them by reference, resident-only and complete reads, gated reload with genuine catch-up, rotation choice and '+explored+' explored regions beyond the former sixteen-region ceiling.');
