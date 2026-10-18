import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {interactAs} from './helpers/interaction.js';
import {PLANTS} from '../src/sim/config.js';
import {groundDiet} from '../src/ecology/functional-diet.js';

function setup(seed='GENVO8-HANDOFF-TRANSITION'){
  const sim=new Simulation(seed,{player:true}),parent=sim.player();
  let mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==parent.id&&a.sex!==parent.sex);
  if(!mate){mate=sim.spawnAnimal('genvo',parent.x+1,parent.y);mate.sex=parent.sex==='F'?'M':'F'}
  parent.age=mate.age=SPECIES.genvo.maturity+4;parent.energy=mate.energy=112;parent.hydration=mate.hydration=106;parent.health=mate.health=100;
  const child=sim.spawnAnimal('genvo',parent.x+5,parent.y,[parent,mate]);sim.lineage.registerBirth(child,[parent,mate]);sim.family.registerBirth(child,parent,mate);
  child.age=SPECIES.genvo.maturity;child.energy=108;child.hydration=101;child.health=100;child.careStress=.08;
  sim.shelter.shelters.length=0;const shelter={id:401,ownerId:parent.id,x:parent.x+.5,y:parent.y+.2,integrity:100,foodStore:7,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount};sim.shelter.shelters.push(shelter);
  const water=sim.world.drinkSpots.find(w=>sim.world.sameLand(child.x,child.y,w.x,w.y))||sim.world.drinkSpots[0];
  let food=null;for(let y=2;y<126&&!food;y++)for(let x=2;x<126&&!food;x++){if(sim.world.water[sim.world.idx(x,y)]||sim.world.isDrinkable(x,y)||!sim.world.sameLand(parent.x,parent.y,x,y))continue;const i=sim.world.idx(x,y);for(const [kind] of Object.entries(groundDiet(child)).filter(([k,e])=>PLANTS[k]&&e>0)){const stock=sim.world.plants[kind]?.[i]||0;if(stock>.3&&(sim.dispersal.seedReserve[kind]?sim.dispersal.cropYield(child,kind,i)>0:true)){food={x:x+.2,y:y+.2,kind};break}}}if(!food)throw new Error('No dry handoff food cell with naturally grown edible food');
  child.learningLessons={water:2,food:2,shelter:1,danger:1};child.learningMemory={water:{x:water.x,y:water.y,lastSeenTick:sim.tickCount},food:{...food,lastSeenTick:sim.tickCount},shelter:{x:shelter.x,y:shelter.y,shelterId:shelter.id,lastSeenTick:sim.tickCount},danger:{x:child.x+8,y:child.y,species:'needlejaw',lastSeenTick:sim.tickCount}};
  child.practiceStats={water:{attempts:1,successes:1},food:{attempts:1,successes:1},completed:2,returns:2,recoveries:0,aborts:0};
  sim.rebuildSpatial();return{sim,parent,child,shelter,water,food};
}

{
  const {sim,parent,child}=setup('GENVO8-HANDOFF-READY');
  const before=sim.rng.state;assert.equal(sim.family.practiceProfile(child).ready,true);
  assert.equal(sim.lineage.handoffTo(child.id,{manual:true}),true);assert.equal(sim.rng.state,before,'handoff orientation consumes no simulation RNG');
  const status=sim.lineage.successionStatus();assert.ok(status);assert.equal(status.stage,'resource');assert.equal(status.preparedness.fieldReady,true,'field-ready heirs begin with a familiar resource bearing');
  const handoff=sim.lineage.lastHandoff();assert.equal(handoff.preparedness.fieldReady,true);assert.equal(handoff.preparedness.routes,2);
  child.x=status.target.x;child.y=status.target.y;const intended=status.target.type==='food'?'eat':'drink',choiceId=intended==='eat'?`eat:${status.target.kind}:${sim.world.idx(child.x,child.y)}`:'drink',interaction=interactAs(sim,assert,choiceId);assert.equal(interaction.type,intended,'succession bearing is confirmed through the ordinary player interaction authority');sim.lineage.updateSuccession();
  assert.equal(sim.lineage.successionStatus(),null,'using the familiar resource completes the playable handoff transition');
  assert.equal(handoff.succession.completed,true);assert.match(handoff.succession.result,/confirmed/);
  const history=sim.cognition.state(child)?.history||[];assert.ok(history.some(h=>h.type==='succession-ready'),'the new active generation records finding its footing');
  assert.equal(parent.alive,true,'manual handoff still leaves the previous generation alive');
}

{
  const {sim,child,shelter}=setup('GENVO8-HANDOFF-UNPRACTICED');
  child.practiceStats={water:{attempts:0,successes:0},food:{attempts:0,successes:0},completed:0,returns:0,recoveries:0,aborts:0};
  child.learningLessons={water:1,food:1,shelter:1,danger:1};child.x=shelter.x+8;child.y=shelter.y;
  assert.equal(sim.lineage.handoffTo(child.id,{manual:true}),true);
  let status=sim.lineage.successionStatus();assert.ok(status);assert.equal(status.preparedness.fieldReady,false);assert.equal(status.stage,'home','an underpracticed heir must first reconnect with the family anchor');
  assert.equal(status.target.kind,'shelter');child.x=shelter.x;child.y=shelter.y;sim.lineage.updateSuccession();
  assert.equal(sim.lineage.successionStatus(),null);assert.match(sim.lineage.lastHandoff().succession.result,/family home/);
}

console.log('playable generation handoff transition checks: PASS');
