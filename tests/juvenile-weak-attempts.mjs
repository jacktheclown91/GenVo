import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {bodyMass} from '../src/organisms/body-mass.js';
import {preyPreference,weakBiteAttempt,EFFECTIVE_PREY_RATIO,WEAK_ATTEMPT_RATIO} from '../src/ecology/functional-diet.js';

// Attempting a bite is not the same as subduing prey. Through the real Simulation.tryKill:
// a hunter with attack anatomy may land weak bites on prey beyond its effective size limit, but
// those bites never kill and never feed it. The effective limit still governs real predation.

function pair(predAge,preyAge,seed='JUVENILE-ATTEMPTS'){
  const sim=new Simulation(seed,{player:false}),pred=sim.animals.find(a=>a.species==='needlejaw'),prey=sim.animals.find(a=>a.species==='rootling');
  Object.assign(pred,{age:predAge,energy:SPECIES.needlejaw.maxEnergy*.5,parentIds:[]});Object.assign(prey,{age:preyAge,health:100,parentIds:[]});
  return{sim,pred,prey,ratio:bodyMass(prey)/Math.max(.1,bodyMass(pred))};
}
const always=sim=>{sim.rng.chance=()=>true};

// 1. Small juvenile vs adult prey (newborn is now beyond the attempt limit): an attempt, never a kill, never a meal.
{
  const {sim,pred,prey,ratio}=pair(8,SPECIES.rootling.maturity);always(sim);
  assert.ok(ratio>EFFECTIVE_PREY_RATIO&&ratio<=WEAK_ATTEMPT_RATIO,'fixture is beyond effective size but attemptable: '+ratio.toFixed(2));
  assert.equal(preyPreference(pred,prey),0,'oversized prey is not effective prey (targeting and diet unchanged)');
  assert.equal(weakBiteAttempt(pred,prey),true);
  const energyBefore=pred.energy;let landed=0;
  for(let k=0;k<40&&prey.alive;k++){if(sim.tryKill(pred,prey))landed++;}
  assert.ok(landed>0,'weak bites can land');
  assert.equal(prey.alive,true,'repeated weak bites never subdue oversized prey');
  assert.ok(prey.health>=1&&prey.health<100,'prey is wounded but survives: '+prey.health.toFixed(2));
  assert.ok(pred.energy<=energyBefore+1e-9,'a weak attempt yields no meal');
}
// 2. Kin can never be attempted, however oversized.
{
  const {sim,pred,prey}=pair(8,SPECIES.rootling.maturity);prey.parentIds=[pred.id];always(sim);
  assert.equal(weakBiteAttempt(pred,prey),false);assert.equal(sim.tryKill(pred,prey),false,'no attempt on kin');assert.equal(prey.health,100);
}
// 3. Far beyond the attempt limit: nothing.
{
  const {sim,pred,prey}=pair(8,SPECIES.rootling.maturity);prey.genes={...prey.genes,body:2.2};always(sim);
  const ratio=bodyMass(prey)/Math.max(.1,bodyMass(pred));
  if(ratio>WEAK_ATTEMPT_RATIO){assert.equal(sim.tryKill(pred,prey),false,'prey far beyond the attempt limit cannot be attempted');assert.equal(prey.health,100)}
}
// 4. Within the effective limit, ordinary predation (which can be lethal) is unchanged.
{
  const {sim,pred,prey,ratio}=pair(SPECIES.needlejaw.maturity,0);always(sim);
  assert.ok(ratio<=EFFECTIVE_PREY_RATIO&&preyPreference(pred,prey)>0,'adult hunter vs newborn prey is effective predation');
  for(let k=0;k<40&&prey.alive;k++)sim.tryKill(pred,prey);
  assert.equal(prey.alive,false,'effective predation can still subdue and kill');
}
console.log('Juvenile weak attempts: oversized prey can be bitten but not subdued or eaten; kin and far-oversized prey excluded; effective predation unchanged PASS');
