import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {snapshotSignature} from '../tools/snapshot-signature.mjs';

// Candidate identity diagnostic only: no recognition, population, resources,
// inheritance or biological isolation is staged to produce a species.
const options={player:true,worldGenerator:'planetary/1',autonomousPopulations:true};
const sim=new Simulation('REGIONAL-TAXON-IDENTITY',{...options,autonomousEvolution:true});
const snapshot=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'regional-taxon-identity'}));
const signature=s=>snapshotSignature(snapshot(s));
const keys=['natural:-128,0:1','natural:128,0:1','natural:0,-128:1',
  'natural:0,128:1','natural:128,0:1:local:2','natural:128-0:1'];
const traits=[{id:'anatomy:walking-leg:loss',pressure:'locomotion'},
  {id:'anatomy:walking-leg:gain',pressure:'locomotion'}];
const population=key=>({key,label:key,species:'genvo'});
const before=signature(sim),rows=[];
for(const key of keys)for(const trait of traits){
  const branch=sim.speciation.branchFor(population(key),trait);
  rows.push(branch);
  assert.deepEqual(sim.speciation.branchFor(population(key),trait),branch);
}
assert.equal(new Set(rows.map(row=>row.id)).size,keys.length*traits.length,
  'Signed coordinates, separators and inherited trait IDs cannot alias');
assert.equal(signature(sim),before,'Candidate construction is completely read-only');
const restored=restoreSimulationSnapshot(snapshot(sim));
assert.deepEqual(snapshot(restored),snapshot(sim));
for(let n=0;n<rows.length;n++){
  const row=rows[n];
  assert.equal(restored.speciation.branchFor(population(row.populationKey),
    traits.find(trait=>trait.id===row.traitId)).id,row.id);
}

// Controlled historical metadata fixture. Existing rejoined taxa keep their
// old saved ID and name instead of silently becoming a second branch.
const key=keys[0],trait=traits[0];
const legacyId=`${key.replace(/[^a-z0-9]+/gi,'-')}:${trait.id}`;
const root=sim.evolutionTree.root();
const recorded={...structuredClone(root),id:legacyId,
  label:'Recorded regional ancestry',parentId:root.id,parentLabel:root.label,
  depth:1,originPopulationKey:key,originPopulationLabel:key,traitId:trait.id,
  pressure:trait.pressure,status:'rejoined',endedDay:sim.day,
  endedReason:'Recorded gene flow',recognitions:1,memberIds:new Set()};
delete recorded.kind;delete recorded.species;
sim.evolutionTree.nodes.set(legacyId,recorded);
const historical=snapshot(sim),historicalSignature=signature(sim);
const historicalRestore=restoreSimulationSnapshot(structuredClone(historical));
assert.deepEqual(snapshot(historicalRestore),historical);
for(const candidate of [sim,historicalRestore]){
  const branch=candidate.speciation.branchFor(population(key),trait);
  assert.equal(branch.id,legacyId);
  assert.equal(branch.label,'Recorded regional ancestry');
  assert.notEqual(candidate.speciation.branchFor(population(keys[1]),trait).id,legacyId,
    'A different signed population must not reuse a colliding saved branch');
}
assert.equal(signature(sim),historicalSignature);
for(let tick=0;tick<6;tick++){sim.update(null);historicalRestore.update(null)}
assert.deepEqual(snapshot(historicalRestore),snapshot(sim),'Recorded identities continue exactly');

const legacy=new Simulation('REGIONAL-TAXON-IDENTITY',options);
const legacyBefore=signature(legacy);
for(const key of keys)for(const trait of traits){
  assert.equal(legacy.speciation.branchFor(population(key),trait).id,
    `${key.replace(/[^a-z0-9]+/gi,'-')}:${trait.id}`,
    'Absent recognition policy retains historical candidate identity exactly');
}
assert.equal(signature(legacy),legacyBefore);
console.log('Regional taxon identity PASS: signed coordinates and components stay distinct, repeated/restored candidates agree, recorded taxa retain IDs/names, legacy policy and complete state unchanged. No species recognition claim.');
