import assert from 'node:assert/strict';import {Simulation} from '../src/sim/simulation.js';import {SPECIES} from '../src/organisms/species.js';import {placeSupportedBreedingPair} from './helpers/breeding-pair.js';import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {RESOURCE_FOUNDING} from '../src/ecology/resource-founding.js';RESOURCE_FOUNDING.enabled=false;// per-species rule checks need every configured species present (founding itself: tests/seed-shore-niches.mjs)
import {conceive} from './helpers/conception.js';
for(const species of Object.keys(SPECIES))for(const water of [SPECIES[species].maxHydration,.25,0]){
  const sim=new Simulation(`BIRTH-WATER-${species}-${water}`,{player:false}),s=SPECIES[species],[mother,father]=sim.animals.filter(a=>a.species===species);Object.assign(mother,{sex:'F',age:s.maturity+1,reproCooldown:0});Object.assign(father,{sex:'M',age:s.maturity+1,reproCooldown:0});placeSupportedBreedingPair(sim,mother,father);assert.ok(conceive(sim,mother,father));mother.hydration=water;
  const saved=structuredClone(createSimulationSnapshot(sim)),restored=restoreSimulationSnapshot(saved),before=mother.hydration,children=sim.giveBirth(mother),total=children.reduce((n,a)=>n+a.hydration,0);
  assert.ok(children.length>0);assert.ok(total<=before+1e-9,`${species}: newborn water cannot exceed actual maternal reserve`);assert.ok(Math.abs(before-mother.hydration-total)<1e-9,'newborn hydration is debited exactly');assert.ok(mother.hydration>=0);assert.ok(children.every(a=>a.hydration>=0&&a.hydration<s.maxHydration*.3),'initial hydration matches developing volume');
  const rm=restored.animals.find(a=>a.id===mother.id),resumed=restored.giveBirth(rm);assert.deepEqual(resumed.map(a=>({id:a.id,hydration:a.hydration})),children.map(a=>({id:a.id,hydration:a.hydration})));assert.equal(rm.hydration,mother.hydration);
  assert.deepEqual(sim.giveBirth(mother),[]);assert.equal(mother.hydration,before-total,'completed gestation cannot spend water twice');
}
console.log('finite maternal-funded newborn hydration and save continuity: PASS');
