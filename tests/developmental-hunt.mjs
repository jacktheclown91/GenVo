import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {preyBodyMass} from '../src/ecology/prey-biomass.js';

function attack(predAge,preyAge){
  const sim=new Simulation('DEVELOPMENTAL-HUNT',{player:false});
  const pred=sim.animals.find(a=>a.species==='needlejaw'),prey=sim.animals.find(a=>a.species==='rootling');
  pred.age=predAge;prey.age=preyAge;pred.energy=0;prey.health=100;
  let chance=null;sim.rng.chance=p=>{if(chance===null)chance=p;return true};
  const hit=sim.tryKill(pred,prey);
  return {hit,damage:100-prey.health,chance,ratio:preyBodyMass(pred)/preyBodyMass(prey)};
}
const adult=attack(SPECIES.needlejaw.maturity,SPECIES.rootling.maturity);
const newborn=attack(0,SPECIES.rootling.maturity);
assert.equal(newborn.hit,false,'newborn hunter is beyond the anatomical weak-attempt size limit');
const young=attack(8,SPECIES.rootling.maturity);
assert.equal(adult.hit,true);assert.equal(young.hit,true,'young hunters can still attempt and land bites');
assert.ok(young.damage<adult.damage*.5,'small juvenile hunter cannot exert full adult bite force against adult prey');
assert.ok(young.chance<adult.chance,'body-size capture advantage follows actual developmental mass');
const equalYoung=attack(0,0);
assert.ok(Math.abs(equalYoung.ratio-adult.ratio)<1e-10,'same developmental scaling preserves relative size');
assert.ok(Math.abs(equalYoung.damage-adult.damage)<1e-10,'same-size-stage contest preserves relative bite force');
console.log('developmental mass in autonomous hunting: PASS');
