import assert from 'node:assert/strict';import {isDeepStrictEqual} from 'node:util';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot,restoreDetachedSimulationSnapshot} from '../src/persistence/save-manager.js';
import {unpackFloraSeedBanks} from '../src/persistence/flora-seed-codec.js';
const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'owned-restore'})),same=(a,b,m)=>assert.ok(isDeepStrictEqual(a,b),m);
const s=new Simulation('GENVO8-TEST-A',{player:false});while(s.day<3)s.update(null);
const sourceRow=Object.values(s.dispersal.floraState.seeds).flatMap(c=>[...c.values()]).flatMap(r=>[...r.values()])[0];assert.ok(sourceRow);
// Declared metadata-only fixture to exercise mutable value ownership, not a biological trait.
sourceRow.ownershipFixture={order:[1,2],nested:{value:7}};
const source=snap(s),unchanged=structuredClone(source),reference=restoreSimulationSnapshot(structuredClone(source)),owned=restoreDetachedSimulationSnapshot(source);
same(snap(owned),snap(reference),'complete owned restore matches full-clone reference');same(source,unchanged,'restore cannot modify caller input');
const before=snap(owned),tables=source.controllers.dispersal.floraState.seeds.kinds,table=Object.values(tables).find(t=>t.columns.some(c=>c.field==='ownershipFixture'));
assert.ok(table);const metadata=table.columns.find(c=>c.field==='ownershipFixture').values[0];metadata.nested.value=99;table.amounts[0]+=1;source.world.moisture[0]=123;source.controllers.dispersal.floraState.genomes.clear();
same(snap(owned),before,'packed metadata/vectors and other caller state cannot mutate returned runtime');
const ownedRow=Object.values(owned.dispersal.floraState.seeds).flatMap(c=>[...c.values()]).flatMap(r=>[...r.values()]).find(r=>r.ownershipFixture);assert.ok(ownedRow);ownedRow.ownershipFixture.nested.value=11;assert.equal(metadata.nested.value,99,'runtime edits cannot mutate caller metadata');
const legacy=structuredClone(unchanged);legacy.controllers.dispersal.floraState.seeds=unpackFloraSeedBanks(legacy.controllers.dispersal.floraState.seeds);same(snap(restoreDetachedSimulationSnapshot(legacy)),snap(restoreSimulationSnapshot(structuredClone(legacy))),'historical live-map input uses ordinary owned clone');
const bad=structuredClone(unchanged);Object.values(bad.controllers.dispersal.floraState.seeds.kinds).find(t=>t.amounts.length).amounts[0]=NaN;const badBefore=structuredClone(bad);assert.throws(()=>restoreDetachedSimulationSnapshot(bad),/Invalid/);same(bad,badBefore,'failed decoding cannot mutate source');
const future=structuredClone(unchanged);future.controllers.dispersal.floraState.seeds.codec='unknown/99';assert.throws(()=>restoreDetachedSimulationSnapshot(future),/Invalid/);
console.log('owned restore: exact full state, independent metadata/vectors/resources, historical fallback and transactional rejection PASS');
