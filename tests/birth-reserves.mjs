import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {placeSupportedBreedingPair} from './helpers/breeding-pair.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

function conceived(species){
  const sim=new Simulation('RESERVE-ALLOCATION-'+species,{player:false}),s=SPECIES[species];
  const [mother,father]=sim.animals.filter(a=>a.species===species);
  Object.assign(mother,{sex:'F',age:s.maturity,energy:s.maxEnergy,reproCooldown:0});
  Object.assign(father,{sex:'M',age:s.maturity,energy:s.maxEnergy,reproCooldown:0});
  placeSupportedBreedingPair(sim,mother,father);
  const total=mother.energy+father.energy;assert.ok(sim.tryMate(mother,father));
  return{sim,mother,father,total};
}
for(const species of Object.keys(SPECIES)){
  const {sim,mother,father,total}=conceived(species);
  const restored=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim)));
  const children=sim.giveBirth(mother),energy=children.reduce((n,c)=>n+c.energy,0);
  const debit=total-mother.energy-father.energy;
  assert.ok(children.length>0);
  assert.ok(energy<=debit+1e-9,`${species}: newborn reserve cannot exceed actual parent investment`);
  assert.ok(children.every(c=>c.energy>0&&c.energy<SPECIES[species].maxEnergy*.3),'newborn reserves match a small developing body');
  const rm=restored.animals.find(a=>a.id===mother.id),rf=restored.animals.find(a=>a.id===father.id);
  const resumed=restored.giveBirth(rm);
  assert.deepEqual(resumed.map(c=>({id:c.id,energy:c.energy,genes:c.genes})),children.map(c=>({id:c.id,energy:c.energy,genes:c.genes})), 'conception investment and birth RNG survive save/load');
  assert.equal(rm.energy,mother.energy);assert.equal(rf.energy,father.energy);
}
const poor=conceived('rootling');
poor.mother.energy=.25;
const invested=poor.mother.pregnant.reserveInvestment;
const poorChildren=poor.sim.giveBirth(poor.mother);
assert.ok(poorChildren.reduce((n,c)=>n+c.energy,0)<=invested+.25+1e-9);
assert.equal(poor.mother.energy,0,'birth cannot borrow negative maternal reserves');
assert.deepEqual(poor.sim.giveBirth(poor.mother),[],'investment cannot be spent twice');

const legacy=conceived('genvo');
delete legacy.mother.pregnant.reserveInvestment;
legacy.mother.energy=2;
const legacyChildren=legacy.sim.giveBirth(legacy.mother);
assert.ok(legacyChildren.length>0,'older current-schema gestation and inheritance survive');
assert.ok(legacyChildren.reduce((n,c)=>n+c.energy,0)<=2+1e-9,'missing historical investment cannot mint new reserves');
assert.equal(legacy.mother.energy,0);
console.log('finite parent-funded developmental newborn reserves: PASS');
