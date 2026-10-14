import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';

function setup(seed='GENVO8-FAMILY-WEATHER'){
  const sim=new Simulation(seed,{player:true}),parent=sim.player();sim.endOpeningGrace('test');
  let mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==parent.id&&a.sex!==parent.sex);
  if(!mate){mate=sim.spawnAnimal('genvo',parent.x+.5,parent.y);mate.sex=parent.sex==='F'?'M':'F'}
  parent.age=mate.age=SPECIES.genvo.maturity+4;parent.energy=mate.energy=110;parent.hydration=mate.hydration=106;
  const young=sim.spawnAnimal('genvo',parent.x+5,parent.y,[parent,mate]);sim.lineage.registerBirth(young,[parent,mate]);sim.family.registerBirth(young,parent,mate);young.age=9;young.energy=100;young.hydration=100;young.careStress=.12;
  const adolescent=sim.spawnAnimal('genvo',parent.x+7,parent.y+.8,[parent,mate]);sim.lineage.registerBirth(adolescent,[parent,mate]);sim.family.registerBirth(adolescent,parent,mate);adolescent.age=23;adolescent.energy=106;adolescent.hydration=102;adolescent.careStress=.10;adolescent.learningLessons={water:2,food:2,shelter:2,danger:1};
  adolescent.practiceStats={water:{attempts:1,successes:0},food:{attempts:0,successes:0},completed:0,returns:0,recoveries:0,aborts:0};
  adolescent.practiceRun={type:'water',phase:'outbound',target:{x:adolescent.x+5,y:adolescent.y},startedTick:sim.tickCount,outboundSuccess:false,interrupted:false,aborted:false};
  const shelter={id:77,ownerId:parent.id,x:parent.x+.4,y:parent.y+.2,integrity:98,weatherSeal:.90,foodStore:7,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount};sim.shelter.shelters.length=0;sim.shelter.shelters.push(shelter);
  sim.climate={temp:.30,rain:.82};sim.rebuildSpatial();return{sim,parent,mate,young,adolescent,shelter};
}

{
  const {sim,young,adolescent,shelter}=setup('GENVO8-WEATHER-FAMILY-RETURN');
  const rng=sim.rng.state,youngDecision=sim.familyWeather.decision(young),adolescentDecision=sim.familyWeather.decision(adolescent);
  assert.equal(youngDecision?.intent,'storm-shelter','dependent young seek the real family shelter in severe weather');
  assert.equal(adolescentDecision?.intent,'storm-shelter','nearby learning descendants interrupt low-priority outings for refuge');
  assert.equal(adolescent.practiceRun.phase,'return');assert.equal(adolescent.practiceRun.aborted,true,'rough weather aborts an outbound solo-practice trip instead of granting success');
  assert.match(adolescent.practiceRun.abortReason,/rough weather/);
  assert.equal(youngDecision.target.shelterId,shelter.id);assert.equal(sim.rng.state,rng,'family weather decisions consume no simulation RNG');
}

{
  const {sim,parent,young,adolescent,shelter}=setup('GENVO8-WEATHER-FAMILY-GATHER');
  parent.x=shelter.x;parent.y=shelter.y;young.x=shelter.x+.3;young.y=shelter.y+.2;adolescent.x=shelter.x-.4;adolescent.y=shelter.y+.1;sim.rebuildSpatial();
  const rng=sim.rng.state,snap=sim.familyWeather.phase();
  assert.ok(snap?.active);assert.equal(snap.familyCount,3);assert.equal(snap.insideCount,3);assert.equal(snap.dependentCount,1);assert.equal(snap.dependentInside,1);assert.equal(snap.gathered,true);
  const history=sim.cognition.state(parent).history;assert.ok(history.some(h=>h.type==='family-refuge'||/Family gathered at shelter/.test(h.text)),'storm refuge becomes ordinary family history');
  assert.equal(sim.family.recentEvent()?.type,'weather-refuge');assert.equal(sim.rng.state,rng,'recording a refuge moment consumes no simulation RNG');
}

{
  const {sim,parent,mate,shelter}=setup('GENVO8-WEATHER-FAMILY-THIRST');
  const adult=sim.spawnAnimal('genvo',parent.x+8,parent.y,[parent,mate]);sim.lineage.registerBirth(adult,[parent,mate]);sim.family.registerBirth(adult,parent,mate);adult.age=SPECIES.genvo.maturity+2;adult.energy=100;adult.hydration=SPECIES.genvo.maxHydration*.25;adult.careStress=.1;
  assert.equal(sim.familyWeather.decision(adult),null,'critical adult thirst remains more important than storm refuge');
  adult.hydration=100;assert.equal(sim.familyWeather.decision(adult)?.intent,'storm-shelter','a healthy nearby adult relative joins refuge during severe weather');
  adult.x=shelter.x;adult.y=shelter.y;assert.equal(sim.familyWeather.decision(adult)?.intent,'storm-refuge');
}

{
  const {sim,young}=setup('GENVO8-WEATHER-FAMILY-CALM');sim.climate={temp:.58,rain:.18};assert.equal(sim.familyWeather.decision(young),null);assert.equal(sim.familyWeather.snapshot(sim.player()),null,'calm weather does not create a refuge objective');
}

{
  const sim=new Simulation('GENVO8-WEATHER-FAMILY-HEADLESS',{player:false});sim.climate={temp:.28,rain:.90};const rng=sim.rng.state;assert.equal(sim.familyWeather.phase(),null);assert.equal(sim.familyWeather.episode,null);const lineage=sim.animals.find(a=>a.alive&&a.species==='genvo');assert.equal(sim.familyWeather.decision(lineage),null);assert.equal(sim.rng.state,rng,'player:false family-weather authority is inert');
}

console.log('family storm-refuge + outing interruption checks: PASS');
