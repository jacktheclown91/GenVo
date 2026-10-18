import {interactAs} from './helpers/interaction.js';
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {TutorialController} from '../src/ui/tutorial.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// v1.32.6: drinking registers on the opening goals, and keeps registering.
function controllerFor(sim){
  const c=Object.create(TutorialController.prototype);c.sim=sim;c.renderer={guideTarget:null};c.stage='goals';sim.uiTutorialStage='goals';c.startPos=null;
  c.shown=null;c.toasts=[];c.render=(title,body,opts={})=>{c.shown={title,body,opts}};c.showToast=msg=>c.toasts.push(msg);
  return c;
}
const sim=new Simulation('GENVO8-DRINK-GOAL',{player:true}),p=sim.player(),c=controllerFor(sim);

// A real drink at a bank shows on the goal list straight away, before the creature has eaten.
{
  const bank=sim.world.nearestDrinkable(p.x,p.y,60);assert.ok(bank);p.x=bank.x;p.y=bank.y;p.hydration=40;
  assert.equal(interactAs(sim,assert,'drink').type,'drink');
  c.renderOpeningGoals(p);assert.match(c.shown.body,/◐ Watered · now feed/,'the water half of the first goal is shown as done');
  assert.equal(c.shown.opts.step,'0/3','the goal itself still needs food too');
}

// More than 24 later events used to push the first drink out of recent history for good.
{
  for(let i=0;i<40;i++)sim.cognition.record(p,`test-event:${i}`,'Something happened');
  assert.equal(sim.cognition.state(p).history.some(h=>h.type==='first-drink'),false,'the drink has left recent history');
  c.renderOpeningGoals(p);assert.match(c.shown.body,/◐ Watered/,'the drink still counts once it scrolls out of history');
  sim.cognition.recordOnce(p,'first-meal:bramble','First ate Berries',{kind:'bramble'});
  c.shown=null;c.renderOpeningGoals(p);assert.match(c.shown?.body||'',/✓ Fed and watered/,'eating then completes the first goal');
}

// It survives a save and load.
{
  const restored=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim))),rc=controllerFor(restored);
  assert.equal(rc.historyHas('first-drink'),true,'a loaded save remembers the first drink');
}
console.log('drink goal ok');
