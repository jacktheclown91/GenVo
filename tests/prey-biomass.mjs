import {makePlan} from '../src/lineage/body-plan.js';
import {applyLineageTarget} from '../src/lineage/reproduction-bridge.js';
import {preyPreference} from '../src/ecology/functional-diet.js';
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {preyBodyMass,remainingPreyBiomass,consumePreyBiomass,regrowPreyBiomass} from '../src/ecology/prey-biomass.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

for(const species of ['mosskip','rootling','genvo']){
  const sim=new Simulation(`BODY-BUDGET-${species}`,{player:false});
  const hunter=sim.animals.find(a=>a.species==='needlejaw');
  const prey=sim.animals.find(a=>a.species===species);
  const mass=SPECIES[species].mass;
  hunter.energy=0;prey.age=SPECIES[species].maturity;prey.health=100;const eff=preyPreference(hunter,prey);sim.rng.chance=()=>true;
  const i=sim.world.idx(prey.x,prey.y);sim.world.carrion[i]=0;
  sim.tryKill(hunter,prey);
  assert.ok(prey.alive,'first unarmored wild bite wounds every prey origin');
  assert.ok(remainingPreyBiomass(prey)<mass,'wound meal consumes the body budget');
  assert.equal(sim.world.carrion[i],0,'living wounds do not also create a corpse');
  const snapshot=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim)));
  assert.equal(remainingPreyBiomass(snapshot.animals.find(a=>a.id===prey.id)),remainingPreyBiomass(prey));
  for(let attempt=0;prey.alive&&attempt<10;attempt++)sim.tryKill(hunter,prey);
  assert.equal(prey.alive,false);
  assert.ok(Math.abs(hunter.energy-mass*34*eff)<1e-7,'all hunt meals total one body, not full mass plus wounds');
  assert.ok(sim.world.carrion[i]<1e-7,'consumed kill meal is removed from the deposited carcass');
  const energy=hunter.energy;
  assert.equal(sim.tryKill(hunter,prey),false);
  assert.equal(hunter.energy,energy,'dead prey cannot be eaten repeatedly');
}
{
  const sim=new Simulation('BODY-BUDGET-AGE',{player:false}),prey=sim.animals.find(a=>a.species==='mosskip');
  prey.age=SPECIES.mosskip.maturity;
  const mass=SPECIES.mosskip.mass,i=sim.world.idx(prey.x,prey.y);sim.world.carrion[i]=0;
  assert.equal(consumePreyBiomass(prey,mass*.3),mass*.3);
  sim.kill(prey,'age');
  assert.ok(Math.abs(sim.world.carrion[i]-mass*.7)<1e-7,'later non-hunting death deposits only remaining body mass');
}
{
  const animal={species:'mosskip',energy:40,predationConsumedMass:.4};
  const before=remainingPreyBiomass(animal),energy=animal.energy;
  const restored=regrowPreyBiomass(animal,10);
  assert.ok(restored>0);
  assert.ok(Math.abs(remainingPreyBiomass(animal)-before-restored)<1e-10);
  assert.ok(Math.abs(energy-animal.energy-restored*34)<1e-10,'new tissue is paid for with food energy');
  animal.energy=0;assert.equal(regrowPreyBiomass(animal,10),0,'starving prey cannot produce free meat');
}
{
  const sim=new Simulation('BODY-BUDGET-PLAYER',{player:true}),player=sim.player();
  const target=sim.animals.find(a=>a.species==='needlejaw');
  applyLineageTarget(player,makePlan(player.bodyPlan.nodes.map(n=>({...n,partId:n.socket==='mouth'?'tearing-jaw':n.partId}))));
  assert.ok(preyPreference(player,target)>0,'Combat-meal fixture has actual flesh-feeding anatomy');
  target.x=player.x+.5;target.y=player.y;target.health=1;player.energy=50;
  const mass=remainingPreyBiomass(target),i=sim.world.idx(target.x,target.y);sim.world.carrion[i]=0;
  sim.rng.chance=()=>true;
  const result=sim.playerStrike(target);
  assert.equal(result.killed,true);
  assert.ok(Math.abs(sim.world.carrion[i]-(mass-target.predationConsumedMass))<1e-7,'combat meal and corpse share the same body');
  assert.ok(target.predationConsumedMass>0&&target.predationConsumedMass<mass,'combat leaves an actual partly eaten carcass');
}
{
  const sim=new Simulation('BODY-BUDGET-HERBIVORE',{player:true}),player=sim.player(),target=sim.animals.find(a=>a.species==='needlejaw');
  target.x=player.x+.5;target.y=player.y;target.health=1;player.energy=50;
  const mass=remainingPreyBiomass(target),i=sim.world.idx(target.x,target.y);sim.world.carrion[i]=0;sim.rng.chance=()=>true;
  assert.equal(sim.playerStrike(target).killed,true);
  assert.equal(target.predationConsumedMass||0,0,'A grazing attacker does not consume flesh');
  assert.ok(Math.abs(sim.world.carrion[i]-mass)<1e-7,'A grazing kill deposits the full remaining body');
}
{
  const wounded=new Simulation('BODY-BUDGET-HEALING',{player:false});
  const control=new Simulation('BODY-BUDGET-HEALING',{player:false});
  const a=wounded.animals.find(a=>a.species==='mosskip'),b=control.animals.find(a=>a.species==='mosskip');
  for(const animal of [a,b]){animal.health=80;animal.energy=SPECIES.mosskip.maxEnergy;animal.hydration=SPECIES.mosskip.maxHydration}
  a.predationConsumedMass=.4;
  wounded.phaseClimate();control.phaseClimate();
  wounded.phaseMetabolism();control.phaseMetabolism();
  const restored=.4-a.predationConsumedMass;
  assert.ok(restored>0,'normal metabolic healing restores edible tissue');
  assert.equal(a.health,b.health,'tissue accounting does not grant extra healing');
  assert.ok(Math.abs(b.energy-a.energy-restored*34)<1e-7,'metabolic tissue regrowth pays exactly its food-energy cost');
}
for(const species of Object.keys(SPECIES)){
  const sim=new Simulation(`JUVENILE-BODY-${species}`,{player:false});
  const prey=sim.animals.find(a=>a.species===species);
  prey.age=0;prey.predationConsumedMass=0;
  const newborn=preyBodyMass(prey),adult=SPECIES[species].mass;
  assert.ok(Math.abs(newborn-adult*.55**3)<1e-12,'newborn biomass follows shared rendered growth');
  assert.ok(newborn<adult*.2,'newborn is not an adult-sized meal');
  consumePreyBiomass(prey,newborn*.25);
  const restored=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim)));
  assert.equal(remainingPreyBiomass(restored.animals.find(a=>a.id===prey.id)),remainingPreyBiomass(prey));
  const i=sim.world.idx(prey.x,prey.y);sim.world.carrion[i]=0;
  sim.kill(prey,'predation');
  assert.ok(Math.abs(sim.world.carrion[i]-newborn*.75)<1e-7,'juvenile corpse excludes previously eaten tissue');
  const ages=[0,SPECIES[species].maturity*.18,SPECIES[species].maturity*.55,SPECIES[species].maturity];
  let previous=0;for(const age of ages){const mass=preyBodyMass({species,age});assert.ok(mass>=previous&&mass<=adult);previous=mass}
  assert.equal(previous,adult,'adult body budget is unchanged');
}
for(const species of ['mosskip','rootling','genvo']){
  const sim=new Simulation(`JUVENILE-HUNT-${species}`,{player:false});
  const hunter=sim.animals.find(a=>a.species==='needlejaw'),prey=sim.animals.find(a=>a.species===species);
  hunter.energy=0;prey.age=0;prey.health=100;prey.predationConsumedMass=0;
  const mass=preyBodyMass(prey),eff=preyPreference(hunter,prey),i=sim.world.idx(prey.x,prey.y);sim.world.carrion[i]=0;sim.rng.chance=()=>true;
  for(let attempt=0;prey.alive&&attempt<10;attempt++)sim.tryKill(hunter,prey);
  assert.equal(prey.alive,false,'ordinary juvenile predation still kills');
  assert.ok(Math.abs(hunter.energy-mass*34*eff)<1e-7,'juvenile wound and kill meals total only the juvenile body');
  assert.ok(sim.world.carrion[i]<1e-7,'juvenile hunt cannot duplicate its consumed meal into carrion');
}
console.log('finite developmental prey biomass, healing, combat meals, carcasses and persistence: PASS');
