import assert from 'node:assert/strict';
import {createPaidRegionalMotherWorld,reachPendingRegionalBirth} from './helpers/paid-regional-mother.mjs';
import {regionalSnapshot as snapshot} from './helpers/regional-evolution-world.mjs';
import {restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {prepareRegionalBiology} from '../src/world/planetary-offscreen-biology.js';
import {regionalIdentity,verifyRegionalIdentity} from '../src/world/regional-identities.js';

// Initial adult position/reserves/sex, inherited dry-mantle phenotype and prior
// classification are controlled. Conception, migration, gestation, real child
// anatomy, water/energy use and every update are authoritative and unfaked.
for(const modern of [false,true]){
  const fixture=createPaidRegionalMotherWorld({modern,inheritedPhenotype:true});
  const sim=fixture.simulation,pregnancy=snapshot(sim),control=restoreSimulationSnapshot(structuredClone(pregnancy));
  assert.deepEqual(snapshot(control),pregnancy);
  assert.ok(fixture.afterEnergy<fixture.beforeEnergy);
  const baselineGeneration=sim.lineage.highestGeneration;
  const initialTaxa=sim.evolutionTree.nodes.size,initialFormations=sim.evolutionTree.events.filter(e=>e.type==='formed').length;
  const {session,ticks}=reachPendingRegionalBirth(fixture,{controls:[control]});
  assert.deepEqual(snapshot(control),snapshot(sim),'All actual gestation from the saved pregnancy continues exactly');
  assert.ok(ticks>0&&session.snapshot.animals.find(a=>a.id===fixture.motherId).pregnant);
  assert.deepEqual(session.snapshot.animals.find(a=>a.id===fixture.motherId).pregnant.maternalInheritance.evolutionaryPopulationAtConception,fixture.witness,
    'Later migration cannot rewrite conception source or parental taxon');
  const birth=prepareRegionalBiology(sim),controlBirth=prepareRegionalBiology(control);
  assert.ok(birth.births>0);assert.equal(controlBirth.births,birth.births);
  assert.deepEqual(snapshot(control),snapshot(sim));
  const children=session.snapshot.animals.filter(a=>a.parentIds?.includes(fixture.motherId)&&a.parentIds?.includes(fixture.fatherId));
  assert.ok(children.length);
  for(const child of children){
    const trait=sim.protoSpeciation.traitsFor(child).find(t=>t.id==='dryland-skin');
    assert.ok(trait&&trait.strength>=.24,'Actual inherited phenotype must match the existing assignment threshold');
    assert.deepEqual(child.evolutionaryAncestry.parentTaxonIds,[fixture.branchId,fixture.branchId]);
    assert.equal(sim.evolutionTree.taxonFor(child),fixture.branchId);
    assert.equal(sim.evolutionTree.node(fixture.branchId).memberIds.has(child.id),true);
    assert.equal(child.lineage,false);
    assert.ok(child.bodyInheritance&&child.protoHistory.physical);
  }
  assert.equal(sim.evolutionTree.nodes.size,initialTaxa,'Inheriting an identity creates no new species');
  assert.equal(sim.evolutionTree.events.filter(e=>e.type==='formed').length,initialFormations);
  assert.equal(sim.lineage.highestGeneration,baselineGeneration);assert.equal(sim.lineage.records.size,0);
  const header=regionalIdentity(session.snapshot,{mode:session.biologicalMode});
  verifyRegionalIdentity(header,session.snapshot,{mode:session.biologicalMode});
  assert.ok(header.evolution.counts.some(row=>row.id===fixture.branchId&&row.living>=children.length));
  const saved=snapshot(sim),loaded=restoreSimulationSnapshot(structuredClone(saved));
  assert.deepEqual(snapshot(loaded),saved);
  for(let n=0;n<6;n++){sim.update(null);loaded.update(null)}
  assert.deepEqual(snapshot(loaded),snapshot(sim));

  // Classification counterexamples use isolated copies, never rewrite a real
  // child's anatomy or claim that a mixed conception must form a new taxon.
  const reader=restoreSimulationSnapshot(snapshot(sim)),child=structuredClone(children[0]);
  delete child.speciesBranch;const before=snapshot(reader);
  const mixed=structuredClone(child);mixed.evolutionaryAncestry.parentTaxonIds[1]='founding:mosskip';
  assert.equal(reader.speciation.assignIdentity(mixed,null),null);
  const mismatching=structuredClone(child);mismatching.anatomy.dryMantle=0;
  assert.equal(reader.speciation.assignIdentity(mismatching,null),null);
  assert.deepEqual(snapshot(reader),before,'Rejected classifications add no history, resources or RNG changes');
  const origin={key:reader.evolutionTree.node(fixture.branchId).originPopulationKey,label:'Controlled closed origin'};
  reader.speciation.ensureState(origin);
  assert.equal(reader.speciation.assignIdentity(structuredClone(child),origin),null,
    'Known local rejoining cannot be resurrected by old conception ancestry');
  console.log(`Regional paid inheritance PASS: ${modern?'modern':'original'} physiology, ${ticks} actual pre-birth ticks, ${children.length} real archived offspring, matching inherited taxon, unchanged conception witnesses, no new species/G3, exact saves and mixed/mismatching/locally closed negatives.`);
}
