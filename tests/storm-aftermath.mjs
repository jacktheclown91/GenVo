import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';

function setup(seed='GENVO8-STORM-AFTERMATH'){
  const sim=new Simulation(seed,{player:true}),parent=sim.player();sim.endOpeningGrace('test');
  let mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==parent.id&&a.sex!==parent.sex);
  if(!mate){mate=sim.spawnAnimal('genvo',parent.x+.5,parent.y);mate.sex=parent.sex==='F'?'M':'F'}
  parent.age=mate.age=SPECIES.genvo.maturity+4;parent.energy=mate.energy=110;parent.hydration=mate.hydration=106;
  const shelter={id:88,ownerId:parent.id,x:parent.x+.4,y:parent.y+.2,integrity:98,weatherSeal:.92,foodStore:7,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount};sim.shelter.shelters.length=0;sim.shelter.shelters.push(shelter);
  const young=sim.spawnAnimal('genvo',shelter.x+.4,shelter.y+.2,[parent,mate]);sim.lineage.registerBirth(young,[parent,mate]);sim.family.registerBirth(young,parent,mate);young.age=8;young.energy=100;young.hydration=100;young.careStress=.44;
  const drink=sim.world.nearestDrinkable(shelter.x,shelter.y,28);assert.ok(drink,'test needs a drinkable place');
  const adolescent=sim.spawnAnimal('genvo',shelter.x+4.5,shelter.y,[parent,mate]);sim.lineage.registerBirth(adolescent,[parent,mate]);sim.family.registerBirth(adolescent,parent,mate);adolescent.age=23;adolescent.energy=106;adolescent.hydration=102;adolescent.careStress=.10;adolescent.learningLessons={water:2,food:2,shelter:2,danger:1};
  adolescent.practiceStats={water:{attempts:1,successes:0},food:{attempts:0,successes:0},completed:0,returns:0,recoveries:0,aborts:0};
  adolescent.practiceRun={type:'water',phase:'outbound',target:{x:drink.x,y:drink.y,learned:true},startedTick:sim.tickCount,outboundSuccess:false,interrupted:false,aborted:false};adolescent.intent='drink';adolescent.target={...adolescent.practiceRun.target,practice:true};
  parent.x=shelter.x;parent.y=shelter.y;mate.x=shelter.x-.5;mate.y=shelter.y+.2;sim.climate={temp:.29,rain:.86};sim.rebuildSpatial();
  return{sim,parent,mate,young,adolescent,shelter};
}

{
  const {sim,parent,young,adolescent}=setup('GENVO8-STORM-AFTERMATH-RESUME');const rng=sim.rng.state;
  const refuge=sim.familyWeather.decision(adolescent);assert.equal(refuge?.intent,'storm-shelter');assert.equal(adolescent.practiceRun.phase,'return');assert.equal(adolescent.practiceRun.aborted,true);
  sim.familyWeather.phase();assert.ok(sim.familyWeather.episode,'active storm opens a refuge episode');
  sim.climate={temp:.58,rain:.14};sim.tickCount+=6;sim.familyWeather.phase();const after=sim.familyWeather.aftermathStatus(parent);assert.ok(after?.active);assert.equal(after.pendingCount,1,'dependent young are queued for a post-storm check');assert.equal(sim.rng.state,rng,'opening aftermath consumes no simulation RNG');
  assert.equal(sim.familyWeather.decision(adolescent),null);assert.equal(adolescent.practiceRun.phase,'outbound','storm-aborted solo practice is restored after weather clears');assert.equal(adolescent.practiceRun.resumedAfterStorm,true);assert.equal(sim.familyWeather.aftermathStatus(parent).resumedCount,1);
  const before=young.careStress;const target=sim.familyWeather.aftercareTarget(parent);assert.equal(target?.child.id,young.id);const checked=sim.familyWeather.checkAfterStorm(parent,young);assert.equal(checked.ok,true);assert.ok(young.careStress<before);assert.equal(sim.familyWeather.aftermathStatus(parent).pendingCount,0);assert.equal(sim.rng.state,rng,'resuming routes and checking young consume no simulation RNG');
}

{
  const {sim,parent}=setup('GENVO8-STORM-AFTERMATH-RAIN');sim.familyWeather.phase();sim.climate={temp:.60,rain:.12};sim.tickCount+=6;sim.familyWeather.phase();
  assert.ok(sim.familyWeather.postRainBoost('marshroot')>.15,'recent heavy rain should raise expected Reed recovery');assert.ok(sim.familyWeather.postRainBoost('rotcap')>.10,'recent heavy rain should raise expected Mushroom recovery');assert.equal(sim.familyWeather.postRainBoost('thistlepod'),0,'dry seed forage should not receive a post-rain recovery expectation');
  const after=sim.familyWeather.aftermathStatus(parent);assert.equal(after.recentRain,true);
  sim.tickCount=after.shelter?sim.familyWeather.aftermath.untilTick+1:sim.tickCount;assert.equal(sim.familyWeather.aftermathStatus(parent),null,'aftermath expires instead of becoming permanent state');
}

{
  const sim=new Simulation('GENVO8-STORM-AFTERMATH-HEADLESS',{player:false});sim.climate={temp:.29,rain:.90};const rng=sim.rng.state;assert.equal(sim.familyWeather.phase(),null);assert.equal(sim.familyWeather.aftermathStatus(),null);assert.equal(sim.familyWeather.postRainBoost('marshroot'),0);assert.equal(sim.familyWeather.interrupted.size,0);assert.equal(sim.rng.state,rng,'player:false aftermath authority is inert');
}

console.log('post-storm family checks + route resumption + rain-recovery expectations: PASS');
