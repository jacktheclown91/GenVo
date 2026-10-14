import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {inheritBody} from '../src/lineage/body-inheritance.js';

function setup(seed='GENVO8-FAMILY-PRACTICE'){
  const sim=new Simulation(seed,{player:true}),parent=sim.player();
  let mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==parent.id&&a.sex!==parent.sex);
  if(!mate){mate=sim.spawnAnimal('genvo',parent.x+.5,parent.y);mate.sex=parent.sex==='F'?'M':'F'}
  parent.age=mate.age=SPECIES.genvo.maturity+3;parent.energy=mate.energy=115;parent.hydration=mate.hydration=108;parent.health=mate.health=100;
  const child=sim.spawnAnimal('genvo',parent.x+.7,parent.y,[parent,mate]);sim.lineage.registerBirth(child,[parent,mate]);sim.family.registerBirth(child,parent,mate);const variation=sim.bodyVariationChance;sim.bodyVariationChance=0;inheritBody(sim,child,parent,mate);sim.bodyVariationChance=variation;if(!sim.canOccupy(child,child.x,child.y)){child.x=parent.x;child.y=parent.y}
  child.age=23;child.energy=112;child.hydration=105;child.health=100;child.careStress=.10;
  child.learningLessons={water:2,food:2,shelter:1,danger:1};
  const water=sim.world.drinkSpots.find(w=>sim.world.sameLand(parent.x,parent.y,w.x,w.y))||sim.world.drinkSpots[0];
  let food=null;
  for(let r=3;r<10&&!food;r++)for(let a=0;a<Math.PI*2&&!food;a+=Math.PI/8){const x=Math.max(2,Math.min(125,parent.x+Math.cos(a)*r)),y=Math.max(2,Math.min(125,parent.y+Math.sin(a)*r));if(sim.world.water[sim.world.idx(x,y)]||!sim.world.sameLand(parent.x,parent.y,x,y))continue;food={x,y,kind:'bramble'};sim.world.plants.bramble[sim.world.idx(x,y)]=.8}
  if(!food)throw new Error('No food practice cell');
  child.learningMemory={water:{x:water.x,y:water.y,lastSeenTick:sim.tickCount},food:{...food,lastSeenTick:sim.tickCount},shelter:null,danger:{x:parent.x+8,y:parent.y,species:'needlejaw',lastSeenTick:sim.tickCount}};
  sim.shelter.shelters.length=0;const shelter={id:91,ownerId:parent.id,x:parent.x+.2,y:parent.y+.1,integrity:100,foodStore:8,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount};sim.shelter.shelters.push(shelter);child.learningMemory.shelter={x:shelter.x,y:shelter.y,shelterId:shelter.id,lastSeenTick:sim.tickCount};
  sim.rebuildSpatial();return{sim,parent,mate,child,water,food,shelter};
}

{
  const {sim,child,shelter}=setup('GENVO8-PRACTICE-ROUNDTRIP');
  const rngBefore=sim.rng.state;
  const first=sim.family.practiceDecision(child);assert.ok(first,'a taught adolescent begins a solo practice route');
  assert.ok(['water','food'].includes(child.practiceRun.type));assert.equal(sim.rng.state,rngBefore,'starting a practice route consumes no simulation RNG');
  const type=child.practiceRun.type,target=child.practiceRun.target;child.x=target.x;child.y=target.y;child.intent=first.intent;child.target={...target,practice:true};
  sim.resolveInteraction(child);assert.equal(child.practiceRun.phase,'return','actual feeding/drinking completes the outbound practice task');assert.equal(child.practiceRun.outboundSuccess,true);
  const returning=sim.family.practiceDecision(child);assert.equal(returning.intent,'practice-return');
  child.x=shelter.x;child.y=shelter.y;sim.family.practiceDecision(child);
  let profile=sim.family.practiceProfile(child);assert.equal(profile.completed,1);assert.equal(profile.returns,1,'a completed outing requires finding the family shelter again');
  child.practiceCooldownUntil=0;child.energy=112;child.hydration=105;
  const second=sim.family.practiceDecision(child);assert.ok(second);assert.notEqual(child.practiceRun.type,type,'practice prioritizes the survival route not yet completed');
  const t2=child.practiceRun.target;child.x=t2.x;child.y=t2.y;child.intent=second.intent;child.target={...t2,practice:true};sim.resolveInteraction(child);child.x=shelter.x;child.y=shelter.y;sim.family.practiceDecision(child);
  profile=sim.family.practiceProfile(child);assert.equal(profile.completed,2);assert.equal(profile.water,1);assert.equal(profile.food,1);assert.equal(profile.ready,true,'food + water round trips make a well-taught adolescent field-ready');
  assert.match(sim.family.upbringingSummary(child),/2 solo routes/);
}

{
  const {sim,child,shelter}=setup('GENVO8-PRACTICE-RECOVERY');
  child.practiceRun={type:'food',phase:'outbound',target:{...child.learningMemory.food},startedTick:sim.tickCount,outboundSuccess:false,interrupted:false,aborted:false};
  const stalker=sim.animals.find(a=>a.alive&&a.species==='needlejaw');stalker.age=SPECIES.needlejaw.maturity+3;let dangerSpot=null;
  for(let angle=0;angle<Math.PI*2&&!dangerSpot;angle+=Math.PI/8){const x=child.x+Math.cos(angle)*3.2,y=child.y+Math.sin(angle)*3.2;if(sim.canOccupy(stalker,x,y)&&sim.world.sameLand(child.x,child.y,x,y))dangerSpot={x,y}}
  assert.ok(dangerSpot,'Controlled threat must occupy reachable ground on the actual child landmass');Object.assign(stalker,dangerSpot);sim.rebuildSpatial();sim.family.phaseCare();
  assert.equal(child.practiceRun.interrupted,true);assert.equal(child.practiceRun.phase,'return','predator contact ends the solo objective and turns it into a recovery trip');
  stalker.x=child.x+30;stalker.y=child.y+30;child.x=shelter.x;child.y=shelter.y;sim.rebuildSpatial();sim.family.practiceDecision(child);
  const profile=sim.family.practiceProfile(child);assert.equal(profile.recoveries,1,'surviving danger and returning home is retained as practice history');assert.equal(profile.completed,0,'an interrupted outing does not fake a completed resource route');
}

{
  const {sim,child,shelter,food}=setup('GENVO8-PRACTICE-ABORT');
  child.practiceRun={type:'food',phase:'outbound',target:{...food},startedTick:sim.tickCount,outboundSuccess:false,interrupted:false,aborted:false};child.x=food.x;child.y=food.y;sim.world.plants.bramble[sim.world.idx(food.x,food.y)]=0;
  const decision=sim.family.practiceDecision(child);assert.equal(decision.intent,'practice-return');assert.equal(child.practiceRun.aborted,true,'a spent remembered food patch aborts rather than granting practice success');assert.equal(sim.family.practiceProfile(child).aborts,1);
  child.x=shelter.x;child.y=shelter.y;sim.family.practiceDecision(child);assert.equal(sim.family.practiceProfile(child).completed,0);
}


{
  const {sim,child}=setup('GENVO8-PRACTICE-HANDOFF');
  child.age=SPECIES.genvo.maturity;child.practiceStats={water:{attempts:0,successes:0},food:{attempts:0,successes:0},completed:0,returns:0,recoveries:0,aborts:0};
  sim.lineage.refreshSelection();assert.equal(sim.family.practiceProfile(child).ready,false);
  assert.equal(sim.lineage.handoffTo(child.id,{manual:true}),true,'field readiness is visible preparation, not a hard handoff gate');
}

console.log('juvenile solo practice + recovery checks: PASS');
