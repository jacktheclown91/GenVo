import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {ObserverController} from '../src/ui/observer.js';

// v1.29 Observer Play: 1x/2x/4x tied to AUTO, automatic danger slowdown, and a summary.
function quietWorld(seed){
  const sim=new Simulation(seed,{player:true});sim.endOpeningGrace('test');const p=sim.player();
  for(const a of sim.animals)if(a.alive&&a.species==='needlejaw')a.x=Math.abs(a.x-p.x)<30?(p.x>64?4:124):a.x;
  sim.rebuildSpatial();return{sim,p,obs:new ObserverController(()=>sim)};
}
// Advance like the browser does at the given speed for `seconds` of real time.
function play(sim,obs,seconds){
  const steps=Math.round(CFG.controlHz*seconds*obs.speed),ratio=Math.round(CFG.controlHz/CFG.simHz);let r=null;
  for(let i=0;i<steps;i++){sim.playerControlStep(null,CFG.controlHz);if(i%ratio===ratio-1)sim.update(null,{externalPlayerControl:true});if(i%32===31&&!r)r=obs.observe();}
  return r;
}

// Speeding up hands the creature to AUTO, and manual input returns to 1x with a summary.
{
  const {sim,obs}=quietWorld('GENVO8-OBSERVER-A');
  const up=obs.setSpeed(4);assert.equal(up.ok,true);assert.equal(obs.speed,4);assert.equal(sim.playerAutonomy,true,'2x/4x turns on AUTO');
  const day0=sim.day;play(sim,obs,6);assert.ok(sim.day>day0,'time keeps advancing through the normal ecology ticks');
  const back=obs.onManualInput();assert.equal(obs.speed,1);assert.ok(back.summary,'returning to 1x reports what happened');
  assert.match(back.summary.text,/^Back to 1x · \d+ days? passed/);assert.doesNotMatch(back.summary.text,/—/,'plain copy');
  assert.equal(obs.onManualInput(),null,'no summary when already at 1x');
  assert.equal(obs.cycle(1).speed,2);assert.equal(obs.cycle(1).speed,4);assert.equal(obs.cycle(1).speed,4,'4x is the top speed');
  assert.equal(obs.cycleWrap().speed,1,'the speed button wraps back to 1x');
}

// A hunting Stalker slows time down and blocks speeding up.
{
  const {sim,p,obs}=quietWorld('GENVO8-OBSERVER-B');obs.setSpeed(2);
  const h=sim.animals.find(a=>a.alive&&a.species==='needlejaw');h.x=p.x-5;h.y=p.y;sim.predator.beginStalk(h,p,5);sim.rebuildSpatial();
  const r=obs.observe();assert.equal(obs.speed,1);assert.equal(r.summary.danger,true);assert.match(r.summary.text,/Slowed to 1x · a Stalker is hunting your creature/);
  const blocked=obs.setSpeed(4);assert.equal(blocked.ok,false);assert.equal(obs.speed,1);assert.match(blocked.message,/Not now/);
}

// Losing a family member while sped up slows down and the summary names the cause.
{
  const {sim,p,obs}=quietWorld('GENVO8-OBSERVER-C');
  const child=sim.spawnAnimal('genvo',p.x+1,p.y,[p,sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id)]);sim.lineage.registerBirth(child,[p,p]);
  obs.setSpeed(4);sim.kill(child,'predation');const r=obs.observe();
  assert.equal(obs.speed,1);assert.match(r.summary.text,/a family member died/);assert.match(r.summary.text,/1 died \(1 to predators\)/);
}

// Turning AUTO off by any route ends the fast-forward.
{
  const {sim,obs}=quietWorld('GENVO8-OBSERVER-D');obs.setSpeed(2);sim.setPlayerAutonomy(false);
  const r=obs.observe();assert.equal(obs.speed,1);assert.match(r.summary.text,/^Back to 1x/);
}

// 4x cost budget with a large population: ecology work per real second stays well inside a frame budget.
{
  const sim=new Simulation('GENVO8-OBSERVER-PERF',{player:true});sim.endOpeningGrace('test');
  while(sim.animals.filter(a=>a.alive).length<CFG.performanceTarget){const k=['mosskip','rootling','genvo','mosskip'][sim.animals.length%4];sim.spawnAnimal(k)}
  const obs=new ObserverController(()=>sim);obs.setSpeed(4);for(let i=0;i<40;i++)sim.update(null,{externalPlayerControl:true});
  const t0=performance.now();play(sim,obs,2);const msPerRealSecond=(performance.now()-t0)/2;
  assert.ok(msPerRealSecond<500,`4x with ${CFG.performanceTarget}+ animals costs ${msPerRealSecond.toFixed(0)} ms per real second of play`);
  console.log(`4x large-population cost: ${msPerRealSecond.toFixed(0)} ms simulation per real second (${sim.animals.filter(a=>a.alive).length} animals)`);
}
console.log('observer play ok');
