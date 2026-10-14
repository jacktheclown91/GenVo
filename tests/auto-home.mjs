import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';

// v1.33.7: in AUTO the active creature builds the family's first shelter on its own, through the
// same path as N, and the opening grace ends as it does for the player. Not in manual play.

function run(autonomy,days=12){
  const sim=new Simulation('GENVO8-AUTO-HOME',{player:true});sim.setPlayerAutonomy(autonomy);let builtDay=null;
  for(let i=0;i<CFG.dayTicks*days&&builtDay==null;i++){sim.update(null);if(sim.shelter.activeShelters().length)builtDay=sim.day}
  return{sim,builtDay};
}
{
  const {sim,builtDay}=run(true);assert.ok(builtDay!=null,'an AUTO founder builds a home within the first days');
  assert.equal(sim.openingGraceEnded,true);assert.equal(sim.openingGraceReason,'first shelter built','the grace period ends as it does for a player build');
  assert.equal(sim.shelter.activeShelters().length,1,'only the first family shelter');
  assert.ok(sim.cognition.state(sim.player()).history.some(h=>h.type==='auto-home'),'the creature remembers building it');
  assert.match(sim.autoHomeNotice?.text||'built',/built/);
}
{
  const {sim,builtDay}=run(false);assert.equal(builtDay,null,'outside AUTO nothing is built for you');assert.equal(!!sim.openingGraceEnded,false);
}
{
  // With a family shelter already standing, AUTO does not build a second one.
  const {sim}=run(true);const before=sim.shelter.activeShelters().length;for(let i=0;i<CFG.dayTicks*3;i++)sim.update(null);
  assert.equal(sim.shelter.activeShelters().length,before,'AUTO never adds a second home');
}
console.log('auto home ok');
