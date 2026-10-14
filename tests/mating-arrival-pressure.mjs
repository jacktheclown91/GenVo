import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {placeSupportedBreedingPair} from './helpers/breeding-pair.js';

for(const failure of ['crowding','food']){
  const sim=new Simulation('GENVO8-MATING-ARRIVAL-'+failure,{player:false}),s=SPECIES.mosskip;
  const [mother,father]=sim.animals.filter(a=>a.species==='mosskip');
  Object.assign(mother,{sex:'F',age:s.maturity+10,reproCooldown:0,pregnant:null,energy:s.maxEnergy*.95});
  Object.assign(father,{sex:'M',age:s.maturity+10,reproCooldown:0,pregnant:null,energy:s.maxEnergy*.95});
  placeSupportedBreedingPair(sim,mother,father);
  mother.intent='mate';mother.target=father;
  if(failure==='crowding')for(let i=0;i<Math.ceil(s.density.softCap*1.18)+2;i++)sim.spawnAnimal('mosskip',mother.x,mother.y);
  else{
    for(const field of Object.values(sim.world.plants))field.fill(0);
    for(const field of Object.values(sim.world.freshwaterFood))field.fill(0);
    sim.world.carrion.fill(0);
  }
  sim.rebuildSpatial();sim.carrying.forageCache.clear();
  assert.equal(sim.carrying.breedingState(mother).allowed,false,'actual habitat changed after courtship began');
  const rng=sim.rng.state,energy=mother.energy+father.energy;
  assert.equal(sim.tryMate(mother,father),false,`${failure} rejection still applies at mating arrival`);
  assert.equal(mother.pregnant,null);
  assert.equal(mother.energy+father.energy,energy,'rejected mating spends no reserves');
  assert.equal(sim.rng.state,rng,'rejected mating consumes no RNG');
}
console.log('mating arrival respects changed carrying pressure: PASS');
