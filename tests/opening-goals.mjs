import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {TutorialController} from '../src/ui/tutorial.js';

// v1.28 tutorial: the opening is three broad goals in any order, not a fixed chore list.
function controllerFor(sim){
  const c=Object.create(TutorialController.prototype);c.sim=sim;c.renderer={guideTarget:null};c.stage='goals';sim.uiTutorialStage='goals';c.startPos=null;
  c.shown=null;c.toasts=[];c.render=(title,body,opts={})=>{c.shown={title,body,opts}};c.showToast=msg=>c.toasts.push(msg);
  return c;
}
const fresh=()=>{const sim=new Simulation('GENVO8-OPENING-GOALS',{player:true});return{sim,p:sim.player(),c:controllerFor(sim)}};

// All three goals are listed together from the start.
{
  const {p,c}=fresh();assert.equal(c.renderOpeningGoals(p),true);
  assert.equal(c.shown.title,'Your first goals');assert.match(c.shown.body,/Fed and watered/);assert.match(c.shown.body,/Mate/);assert.match(c.shown.body,/Home/);
  assert.equal(c.shown.opts.step,'0/3');assert.doesNotMatch(c.shown.body,/[—]/,'plain copy, no em dashes');
}

// Any order: pairing first counts even though the creature has not eaten or drunk yet.
{
  const {sim,p,c}=fresh();const mate=sim.animals.find(a=>a.id!==p.id&&a.species==='genvo'&&a.alive);p.lastMate=mate.id;
  c.renderOpeningGoals(p);assert.equal(c.shown.opts.step,'1/3');assert.match(c.shown.body,/✓ Mate/);assert.match(c.shown.body,/○ Fed and watered/);
}

// The suggestion follows the most pressing need instead of a fixed next step.
{
  const {sim,p,c}=fresh();sim.cognition.recordOnce(p,'first-meal:bramble','First ate Berries',{kind:'bramble'});
  p.hydration=sim.player().hydration*.2;c.startPos={x:p.x-5,y:p.y};c.renderOpeningGoals(p);assert.match(c.shown.body,/drink/i,'thirst is the suggested next step');
}

// Finishing all three ends the opening, in whatever order they were done.
{
  const {sim,p,c}=fresh();const mate=sim.animals.find(a=>a.id!==p.id&&a.species==='genvo'&&a.alive);
  sim.shelter.shelters.push({id:1,ownerId:p.id,x:p.x,y:p.y,integrity:100,foodStore:0,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount});
  sim.cognition.recordOnce(p,'first-drink','First drink',{});sim.cognition.recordOnce(p,'first-meal:bramble','First ate Berries',{kind:'bramble'});p.lastMate=mate.id;
  assert.equal(c.renderOpeningGoals(p),false);assert.equal(c.stage,'done');assert.equal(sim.openingGraceEnded,true,'safe start ends once the goals are done');
}

// Under AUTO, moist food can meet the whole water need: fed with water actually
// high counts as watered. In manual control a drink is still required.
{
  const {sim,p,c}=fresh();sim.cognition.recordOnce(p,'first-meal:bramble','First ate Berries',{kind:'bramble'});
  c.renderOpeningGoals(p);assert.match(c.shown.body,/◐ Fed · now drink/,'manual control still asks for a drink');
  sim.setPlayerAutonomy(true);c.renderOpeningGoals(p);assert.match(c.shown.body,/✓ Fed and watered/);
  p.hydration=p.hydration*.3;c.renderOpeningGoals(p);assert.match(c.shown.body,/◐ Fed · now drink/,'AUTO does not count low water as watered');
}

// Old saves stopped mid-sequence resume on the new goals.
{
  const sim=new Simulation('GENVO8-OPENING-LEGACY',{player:true});sim.uiTutorialStage='drink';
  const src=TutorialController.prototype.setSimulation.toString();assert.match(src,/LEGACY_OPENING_STAGES/);
  const c=Object.create(TutorialController.prototype);Object.assign(c,{welcome:{hidden:true},briefing:{hidden:true},transition:{hidden:true},renderer:{guideTarget:null},skip:false});c.update=()=>{};
  c.setSimulation(sim,{resume:true});assert.equal(c.stage,'goals');assert.equal(sim.uiTutorialStage,'goals');
}
console.log('opening goals ok');
