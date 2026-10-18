import assert from 'node:assert/strict';
import {RESOURCE_FOUNDING} from '../src/ecology/resource-founding.js';RESOURCE_FOUNDING.enabled=false;// per-species rule checks need every configured species present (founding itself: tests/seed-shore-niches.mjs)
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {placeSupportedBreedingPair} from './helpers/breeding-pair.js';
import {matePreferencesFor} from '../src/reproduction/mate-preferences.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

for(const species of Object.keys(SPECIES)){
  const sim=new Simulation(`CONCEPTION-PARENTS-${species}`,{player:false});
  const [mother,father]=sim.animals.filter(a=>a.species===species);
  Object.assign(mother,{sex:'F',age:SPECIES[species].maturity+10,reproCooldown:0});
  Object.assign(father,{sex:'M',age:SPECIES[species].maturity+10,reproCooldown:0});
  if(species==='genvo')mother.lineage=true;
  // Inherited tastes kept; the similarity/contrast allele (Phase 3H) is neutralised so a contrast-seeking founder can't decline its staged partner.
  for(const a of [mother,father])a.matePreferences={...matePreferencesFor(sim.seed,a),similarity:0};
  placeSupportedBreedingPair(sim,mother,father);
  assert.ok(sim.tryMate(mother,father));
  assert.notStrictEqual(mother.pregnant.maternalInheritance.genes,mother.genes);
  assert.notStrictEqual(mother.pregnant.paternalInheritance.bodyPlan,father.bodyPlan);
  const saved=structuredClone(createSimulationSnapshot(sim));
  const control=restoreSimulationSnapshot(structuredClone(saved));
  const altered=restoreSimulationSnapshot(structuredClone(saved));
  for(const id of [mother.id,father.id]){
    const parent=altered.animals.find(a=>a.id===id);
    for(const key of Object.keys(parent.genes))parent.genes[key]=1.8;
    parent.bodyPlan=null;
    if(parent.anatomy)for(const key of Object.keys(parent.anatomy))if(typeof parent.anatomy[key]==='number')parent.anatomy[key]=0;
  }
  const traits=children=>children.map(c=>({id:c.id,parentIds:c.parentIds,generation:c.generation,genes:c.genes,bodyPlan:c.bodyPlan,anatomy:c.anatomy}));
  const expected=traits(control.giveBirth(control.animals.find(a=>a.id===mother.id)));
  const actual=traits(altered.giveBirth(altered.animals.find(a=>a.id===mother.id)));
  assert.deepEqual(actual,expected,`${species}: both living parents preserve conception-time inheritance`);
  const legacy=restoreSimulationSnapshot(structuredClone(saved));
  const oldMother=legacy.animals.find(a=>a.id===mother.id);
  delete oldMother.pregnant.maternalInheritance;
  assert.ok(legacy.giveBirth(oldMother).length>0,'existing pregnancies without maternal records remain deliverable');
}
console.log('both living parents preserve conception-time inheritance through save/load: PASS');
