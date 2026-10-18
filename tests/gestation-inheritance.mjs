import assert from 'node:assert/strict';
import {RESOURCE_FOUNDING} from '../src/ecology/resource-founding.js';RESOURCE_FOUNDING.enabled=false;// per-species rule checks need every configured species present (founding itself: tests/seed-shore-niches.mjs)
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {placeSupportedBreedingPair} from './helpers/breeding-pair.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

for(const species of Object.keys(SPECIES)){
  const sim=new Simulation(`GENVO8-GESTATION-${species}`,{player:false});
  const [mother,father]=sim.animals.filter(a=>a.species===species&&!a.player);
  mother.sex='F';father.sex='M';mother.reproCooldown=father.reproCooldown=0;
  mother.age=father.age=SPECIES[species].maturity+10;
  // Staged as well-fed, as in the other conception fixtures; this suite tests gestation inheritance.
  for(const a of [mother,father])Object.assign(a,{energy:SPECIES[species].maxEnergy*.9,hydration:SPECIES[species].maxHydration*.9,health:100,infected:false});
  if(species==='genvo')father.lineage=true;
  placeSupportedBreedingPair(sim,mother,father);
  assert.ok(sim.tryMate(mother,father));
  const inherited=mother.pregnant.paternalInheritance;
  assert.equal(inherited.id,father.id);
  assert.notStrictEqual(inherited.genes,father.genes,'inheritance is detached from the live parent');
  assert.equal(inherited.target,undefined,'no live target graph is stored');
  const genes=structuredClone(inherited.genes);
  father.genes.speed=99;
  assert.deepEqual(inherited.genes,genes);
  sim.kill(father,'age');sim.animals=sim.animals.filter(a=>a.alive);
  const restored=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim)));
  const rm=restored.animals.find(a=>a.id===mother.id);
  assert.deepEqual(rm.pregnant.paternalInheritance.genes,genes,'paternal inheritance survives save/load');
  const children=restored.giveBirth(rm);
  assert.ok(children.length>0,`${species} conceived litter survives paternal death`);
  for(const child of children){
    assert.deepEqual(child.parentIds,[mother.id,father.id]);
    assert.equal(child.generation,Math.max(mother.generation,father.generation)+1);
    assert.ok(child.bodyPlan,'body inheritance remains present');
    assert.equal(child.lineage,species==='genvo','paternal lineage survives even when the mother is outside it');
  }
  assert.equal(rm.pregnant,null);
  assert.equal(restored.animals.some(a=>a.id===father.id),false,'dead father is not resurrected');
}
console.log('gestation inheritance after paternal death and save/load: PASS');
