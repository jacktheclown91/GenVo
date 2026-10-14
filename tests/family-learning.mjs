import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {inheritBody} from '../src/lineage/body-inheritance.js';

function family(seed='GENVO8-FAMILY-LEARNING'){
  const sim=new Simulation(seed,{player:true}),parent=sim.player();
  let mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==parent.id&&a.sex!==parent.sex);
  if(!mate){mate=sim.spawnAnimal('genvo',parent.x+.5,parent.y);mate.sex=parent.sex==='F'?'M':'F'}
  parent.age=mate.age=SPECIES.genvo.maturity+3;parent.energy=mate.energy=110;parent.hydration=mate.hydration=104;parent.health=mate.health=100;
  const child=sim.spawnAnimal('genvo',parent.x+.7,parent.y,[parent,mate]);
  sim.lineage.registerBirth(child,[parent,mate]);sim.family.registerBirth(child,parent,mate);const variation=sim.bodyVariationChance;sim.bodyVariationChance=0;inheritBody(sim,child,parent,mate);sim.bodyVariationChance=variation;if(!sim.canOccupy(child,child.x,child.y)){child.x=parent.x;child.y=parent.y}
  child.age=11;child.energy=90;child.hydration=88;child.health=100;child.careStress=.12;
  sim.rebuildSpatial();return{sim,parent,mate,child};
}

{
  const {sim,parent,child}=family('GENVO8-LEARN-OBSERVE');
  const rngBefore=sim.rng.state,water=sim.world.drinkSpots[0];
  parent.x=water.x;parent.y=water.y;child.x=water.x+.55;child.y=water.y+.2;parent.intent='idle';sim.lastPlayerAction={type:'drink',tick:sim.tickCount};sim.rebuildSpatial();
  sim.family.phaseCare();
  assert.equal(child.learningLessons.water,1,'a nearby juvenile learns a water place from an actual caregiver drink');
  assert.ok(child.learningMemory.water,'water lesson keeps a learned place');
  assert.equal(sim.cognition.state(child).water.x,child.learningMemory.water.x,'family teaching writes into the existing cognition memory');
  sim.lastPlayerAction={type:'eat',kind:'bramble',tick:sim.tickCount};sim.family.phaseCare();
  assert.equal(child.learningLessons.food,1,'a juvenile can learn feeding from a caregiver action');
  assert.equal(child.learningMemory.food.kind,'bramble');
  assert.equal(sim.rng.state,rngBefore,'family teaching consumes no simulation RNG');
}

{
  const {sim,parent,child}=family('GENVO8-LEARN-SHELTER-DANGER');
  const sh={id:77,ownerId:parent.id,x:parent.x+.2,y:parent.y+.1,integrity:100,foodStore:6,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount};sim.shelter.shelters.push(sh);
  child.x=parent.x+.7;child.y=parent.y+.2;sim.family.phaseCare();
  assert.equal(child.learningLessons.shelter,1,'safe time beside a caregiver teaches the family shelter');
  const stalker=sim.animals.find(a=>a.alive&&a.species==='needlejaw');stalker.x=child.x+3;stalker.y=child.y;parent.intent='escape';sim.rebuildSpatial();sim.family.phaseCare();
  assert.equal(child.learningLessons.danger,1,'a juvenile learns predator danger from a caregiver response');
  assert.equal(child.learningMemory.danger.species,'needlejaw');
}

{
  const {sim,parent,child}=family('GENVO8-LEARN-INDEPENDENCE');
  child.age=15;child.learningLessons={water:2,food:2,shelter:1,danger:1};child.learningMemory={water:{x:parent.x+4,y:parent.y,lastSeenTick:sim.tickCount},food:{x:parent.x+3,y:parent.y,kind:'bramble',lastSeenTick:sim.tickCount},shelter:{x:parent.x,y:parent.y,shelterId:1,lastSeenTick:sim.tickCount},danger:{x:parent.x+5,y:parent.y,species:'needlejaw',lastSeenTick:sim.tickCount}};
  const profile=sim.family.learningProfile(child);assert.equal(profile.mastered,4);assert.ok(profile.independence>.5,'age plus practiced lessons creates meaningful independence before maturity');
  const bank=sim.world.drinkSpots.find(v=>sim.canOccupy(child,v.x,v.y)&&sim.canReach(child,v.x,v.y));assert.ok(bank,'Learning fixture needs a real reachable drinkable bank');child.learningMemory.water={x:bank.x,y:bank.y,lastSeenTick:sim.tickCount};child.hydration=SPECIES.genvo.maxHydration*.42;parent.intent='idle';const decision=sim.family.learningDecision(child);assert.equal(decision.intent,'drink');assert.equal(decision.target.learned,true,'an older juvenile can use a taught water place without following the caregiver there again');
  child.hydration=SPECIES.genvo.maxHydration*.9;
  let learnedFollow,clingier,found=false;
  for(let distance=.5;distance<=6&&!found;distance+=.1){
    child.x=parent.x+distance;child.y=parent.y;child.learningLessons={water:2,food:2,shelter:1,danger:1};
    learnedFollow=sim.family.followTarget(child);child.learningLessons={water:0,food:0,shelter:0,danger:0};child.careStress=.12;
    clingier=sim.family.followTarget(child);found=learnedFollow===null&&!!clingier;
  }
  assert.ok(found,'Valid inherited bodies must exhibit a wider learned range than the same inexperienced juvenile');
  assert.equal(learnedFollow,null,'a practiced juvenile is allowed a wider independent range');
  assert.ok(clingier,'an inexperienced juvenile at the same distance still regroups with its caregiver');

}

{
  const {sim,parent,child}=family('GENVO8-LEARN-ADOLESCENT');
  child.age=SPECIES.genvo.maturity*.72;
  assert.equal(sim.family.isDependent(child),false,'direct dependency ends before maturity');
  assert.equal(sim.family.isLearning(child),true,'adolescent learning continues after direct dependency ends');
  const water=sim.world.drinkSpots[0];parent.x=water.x;parent.y=water.y;child.x=water.x+.5;child.y=water.y+.2;sim.lastPlayerAction={type:'drink',tick:sim.tickCount};sim.rebuildSpatial();
  sim.family.phaseCare();
  assert.equal(child.learningLessons.water,1,'an older adolescent can still learn the last family skills before handoff');
}

{
  const {sim,child}=family('GENVO8-LEARN-HANDOFF');
  child.age=SPECIES.genvo.maturity;child.learningLessons={water:2,food:1,shelter:2,danger:1};child.careStressTotal=.2*20;child.careStressSamples=20;
  const text=sim.family.upbringingSummary(child);assert.match(text,/4\/4 lessons/);assert.match(text,/independent/,'upbringing history carries learned independence into the handoff recap');
}

console.log('juvenile learning + independence checks: PASS');
