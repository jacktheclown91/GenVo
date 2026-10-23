import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {TISSUE_ENERGY,tissueEnergy,meatEnergy,killMealLimit} from '../src/ecology/tissue-energy.js';
import {remainingPreyBiomass} from '../src/ecology/prey-biomass.js';
import {bodyMass} from '../src/organisms/body-mass.js';
import {canHunt} from '../src/ecology/functional-diet.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// Tissue energy from a physical basis (2026-10-23): with real needs, a unit of tissue holds what a
// carcass holds in each eater's own energy units; a kill meal is at most what fills the eater and a
// 20% body-mass gorge, the rest staying as carrion; growing and repairing tissue cost the same energy;
// recorded worlds keep 34.
const make=(tissueEnergy=true)=>new Simulation('GENVO8-TEST-A',{player:true,dayClock:true,metabolism:true,foodProperties:true,tissueEnergy,worldGenerator:'planetary/1'});

// 1. The derivation: a resting animal needs about 4–7% of its body mass in meat a day.
{
 const sim=make();for(const [k,s] of Object.entries(SPECIES)){const a={species:k},perDay=s.maxEnergy/15/meatEnergy(sim,a)/s.mass;assert.ok(perDay>.035&&perDay<.075,k+' needs '+(perDay*100).toFixed(1)+'% of body mass in meat a day at rest')}
 const old=make(false);assert.equal(meatEnergy(old,{species:'needlejaw'}),34,'recorded worlds keep 34');assert.equal(killMealLimit(old,{species:'needlejaw'},34),Infinity);
}
// 2. A kill: the hunter eats what fits, at most a gorge; the rest stays on the carcass as carrion
// (recorded worlds eat the whole body at the kill).
{
 const kill=(tissueEnergy)=>{const sim=make(tissueEnergy),pred=sim.animals.find(a=>a.alive&&canHunt(a)&&!a.player),prey=sim.animals.find(a=>a.alive&&!canHunt(a)&&!a.player&&a.species==='rootling');
  const P=SPECIES[pred.species];pred.energy=P.maxEnergy*.6;prey.x=pred.x;prey.y=pred.y;prey.health=1;const i=sim.world.idx(prey.x,prey.y),before=sim.world.carrion[i];
  for(let k=0;k<40&&prey.alive;k++)sim.tryKill(pred,prey);assert.ok(!prey.alive,'the prey dies');assert.ok(pred.energy<=P.maxEnergy);return{left:sim.world.carrion[i]-before,sim,pred}};
 const now=kill(true),then=kill(false);assert.ok(now.left>.1,'the uneaten carcass stays as carrion: '+now.left.toFixed(3));assert.ok(then.left<1e-9,'recorded worlds eat the whole body');
 const {sim,pred}=now,P=SPECIES[pred.species],per=meatEnergy(sim,pred);pred.energy=P.maxEnergy*.2;
 assert.ok(Math.abs(killMealLimit(sim,pred,per)-bodyMass(pred)*TISSUE_ENERGY.gorgeShare)<1e-9,'a hungry hunter is limited by its gorge');
 pred.energy=P.maxEnergy*.95;assert.ok(Math.abs(killMealLimit(sim,pred,per)-P.maxEnergy*.05/per)<1e-9,'a nearly full one by its reserves');
}
// 3. Growth and repair keep the recorded cost (creator decision 2026-10-23); the measurement switch
// applies the physical one.
{
 const sim=make(),young={species:'mosskip'};assert.equal(tissueEnergy(sim,young),TISSUE_ENERGY.recorded,'growth keeps the recorded cost');
 sim.correctionExperiment={tissueGrowth:true};assert.ok(tissueEnergy(sim,young)>TISSUE_ENERGY.recorded*3,'the switch applies the physical cost');
}
// 4. Saves keep the policy; planetary crossings copy it.
{
 const sim=make(),back=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim,{savedAt:'t',reason:'t'})));assert.equal(back.tissueEnergyRules,TISSUE_ENERGY.policy);
 const old=make(false);assert.equal(restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(old,{savedAt:'t',reason:'t'}))).tissueEnergyRules,undefined);
}
console.log('Tissue energy PASS: meat energy from carcass energy and resting needs, gorge-limited kills leave carrion, growth at the recorded cost, saved, recorded worlds keep 34.');
