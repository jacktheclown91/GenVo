// Offscreen regional checkpoints take ownership of a detached simulation
// that is discarded immediately after publication. Prove that transferring
// seed metadata preserves every packed byte, while ordinary saves still copy.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot,restoreDetachedSimulationSnapshot} from '../src/persistence/save-manager.js';
import {unpackFloraSeedBanks} from '../src/persistence/flora-seed-codec.js';
import {CFG} from '../src/sim/config.js';

const equal=(a,b,message)=>assert.ok(isDeepStrictEqual(a,b),message);
const sim=new Simulation('GENVO8-TEST-A',{player:false});
while(sim.day<3)sim.update(null);
const allRecords=Object.values(sim.dispersal.floraState.seeds)
  .flatMap(cells=>[...cells.values()])
  .flatMap(rows=>[...rows.values()]);
assert.ok(allRecords.length>0,'living world has real seed cohorts');
const row=allRecords[0];
// Metadata fixture is not a new inherited trait or fabricated seed biomass.
row.snapshotOwnershipFixture={lineage:['alpha','beta'],nested:{evidence:[4,5],flag:true}};
const ordinary=createSimulationSnapshot(sim,{reason:'regional-metadata-parity',savedAt:'fixed'});
const transferred=createSimulationSnapshot(sim,{
 reason:'regional-metadata-parity',savedAt:'fixed',ownedRegionalSeedMetadata:true
});
equal(ordinary,transferred,'ownership transfer cannot alter full stored world bytes or cohort fields');
const findMetadata=snapshot=>{
 for(const table of Object.values(snapshot.controllers.dispersal.floraState.seeds.kinds)){
  const column=table.columns.find(c=>c.field==='snapshotOwnershipFixture');
  if(column)return column.values[0];
 }
 throw Error('Ownership fixture missing from stored seed columns');
};
assert.notEqual(findMetadata(ordinary),row.snapshotOwnershipFixture,
 'normal save must continue deep-copying mutable metadata');
assert.equal(findMetadata(transferred),row.snapshotOwnershipFixture,
 'owned temporary regional runtime transfers its already-independent metadata');
// Clone the independently stored region checkpoint before restoring as normal.
const source=structuredClone(ordinary);
const detached=restoreDetachedSimulationSnapshot(source);
const detachedBefore=createSimulationSnapshot(detached,{reason:'regional-metadata-parity',savedAt:'fixed'});
const detachedOwned=createSimulationSnapshot(detached,{
 reason:'regional-metadata-parity',savedAt:'fixed',ownedRegionalSeedMetadata:true
});
equal(detachedBefore,detachedOwned,'transferred snapshots match ordinary packing of detached flora');
equal(source,ordinary,'detached restore and owned pack never change archived input bytes');
const a=restoreSimulationSnapshot(structuredClone(detachedBefore));
const b=restoreSimulationSnapshot(structuredClone(detachedOwned));
for(let i=0;i<CFG.lifeStride+3;i++){a.update(null);b.update(null)}
const snap=s=>structuredClone(createSimulationSnapshot(s,{reason:'continued',savedAt:'fixed'}));
equal(snap(a),snap(b),'real next ecological stride is unchanged after transferred metadata checkpoint');
equal(unpackFloraSeedBanks(ordinary.controllers.dispersal.floraState.seeds),
 unpackFloraSeedBanks(transferred.controllers.dispersal.floraState.seeds),
 'decoded rare cohorts and nested ownership metadata match');
const bad=structuredClone(ordinary);
Object.values(bad.controllers.dispersal.floraState.seeds.kinds).find(t=>t.amounts.length).amounts[0]=NaN;
assert.throws(()=>restoreDetachedSimulationSnapshot(bad),/Invalid/,'corrupt cohorts must still fail');
console.log('Owned seed metadata: exact packed and unpacked state, normal-save copying, archived-input isolation, ecological continuation and corruption rejection PASS');
