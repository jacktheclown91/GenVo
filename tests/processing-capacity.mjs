import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {processingCapacity,processingCapacityMessage} from '../src/sim/processing-capacity.js';
import {createSimulationSnapshot,restoreSimulationSnapshot as restore} from '../src/persistence/save-manager.js';
import {placeSupportedBreedingPair} from './helpers/breeding-pair.js';
import {conceive} from './helpers/conception.js';

const snapshot=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'capacity-test'}));
const sim=new Simulation('CAPACITY-FUNDED-BIRTH',{player:false,bootstrap:false});
const mother=sim.spawnAnimal('rootling',32,32),father=sim.spawnAnimal('rootling',33,32);
Object.assign(mother,{sex:'F',age:SPECIES.rootling.maturity+4,energy:SPECIES.rootling.maxEnergy,hydration:SPECIES.rootling.maxHydration,reproCooldown:0});
Object.assign(father,{sex:'M',age:SPECIES.rootling.maturity+4,energy:SPECIES.rootling.maxEnergy,hydration:SPECIES.rootling.maxHydration,reproCooldown:0});
placeSupportedBreedingPair(sim,mother,father);assert.ok(conceive(sim,mother,father),'real conception funds the tested litter');
const initial=structuredClone(snapshot(sim)),reference=CFG.maxAnimals;
try{
  const normal=restore(structuredClone(initial)),limited=restore(structuredClone(initial));
  const normalMother=normal.animals.find(a=>a.id===mother.id),limitedMother=limited.animals.find(a=>a.id===mother.id);

  const children=normal.giveBirth(normalMother);
  CFG.maxAnimals=1; // diagnostic reference only; same funded conception and RNG
  const retained=limited.giveBirth(limitedMother);
  assert.ok(children.length>0);assert.equal(retained.length,children.length);
  assert.deepEqual(snapshot(limited),snapshot(normal),'capacity reference cannot change paid births, inheritance, parent reserves, history or RNG');
  assert.ok(processingCapacity(limited).exceeded);assert.match(processingCapacityMessage(processingCapacity(limited)),/All offspring are retained/);
  const resumed=restore(structuredClone(snapshot(limited)));
  for(let i=0;i<12;i++){limited.update(null);resumed.update(null)}
  assert.deepEqual(snapshot(resumed),snapshot(limited),'over-reference births resume deterministically');
  CFG.maxAnimals=reference;
  const crowded=new Simulation('CAPACITY-ACTUAL-900',{player:false,bootstrap:false});
  for(let i=0;i<reference;i++)crowded.spawnAnimal('rootling',32+i%10,32+Math.floor(i/10)%10);
  const [m,f]=crowded.animals;
  const born=crowded.spawnFundedOffspring(m,f,[m,f],{count:3,x:m.x,y:m.y,energyBudget:12,hydrationBudget:12});
  assert.equal(born.length,3);assert.equal(processingCapacity(crowded).living,reference+3);
  assert.ok(born.reduce((n,c)=>n+c.energy,0)<=12);assert.ok(born.reduce((n,c)=>n+c.hydration,0)<=12);
  // Controlled stored egg fixtures isolate laying/hatching capacity from exposure.
  const eggs=restore(structuredClone(initial)),em=eggs.animals.find(a=>a.id===mother.id);
  em.pregnant.mode='egg';em.pregnant.plannedLitterSize=2;
  const template=structuredClone(em.pregnant),first=eggs.giveBirth(em);
  assert.equal(first.length,2);
  eggs.eggs=Array.from({length:128},(_,i)=>({...structuredClone(first[0]),id:i+1}));eggs.nextEggId=129;
  em.pregnant=template;em.energy=SPECIES.rootling.maxEnergy;em.hydration=SPECIES.rootling.maxHydration;
  const laid=eggs.giveBirth(em);assert.equal(laid.length,2);assert.equal(eggs.eggs.length,130);
  assert.ok(processingCapacity(eggs).exceeded);
  const eggSave=structuredClone(snapshot(eggs));assert.deepEqual(snapshot(restore(eggSave)),eggSave);
  for(const egg of eggs.eggs){egg.incubationDays=1;egg.condition=1}
  CFG.maxAnimals=1;
  const before=eggs.stats.births;eggs.advanceEggs();
  assert.equal(eggs.eggs.length,0);assert.equal(eggs.stats.births-before,130,'all viable paid eggs hatch even above former actor and egg limits');
}finally{CFG.maxAnimals=reference}
console.log('processing capacity: complete funded births, laying, hatching, accounting and deterministic resume PASS');
