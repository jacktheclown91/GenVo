import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';

function prep(seed){
  const sim=new Simulation(seed,{player:true}),p=sim.player();
  p.x=52;p.y=52;p.age=SPECIES.genvo.maturity+6;p.energy=SPECIES.genvo.maxEnergy*.9;p.hydration=SPECIES.genvo.maxHydration*.9;p.health=100;
  for(const a of sim.animals)if(a.id!==p.id&&a.species==='genvo'){a.x=104+(a.id%4);a.y=104+(a.id%5)}
  sim.rebuildSpatial();
  return{sim,p};
}
function learn(sim,p,days=4){
  const state=sim.territory.ensure(p);
  for(let d=1;d<=days;d++)for(let t=0;t<CFG.dayTicks;t++){
    sim.day=d;sim.tickCount=(d-1)*CFG.dayTicks+t;
    p.x=52+(t%2)*.4;p.y=52+((t>>1)%2)*.4;
    sim.territory.visit(p,state);
  }
  sim.territory.recompute(p,state);return state;
}

{
  const {sim,p}=prep('GENVO8-HOME-LEARN'),state=learn(sim,p,4),snap=sim.territory.snapshot(p);
  assert.equal(state.established,true,'repeated use establishes a learned home range');
  assert.ok(snap.home&&snap.home.radius>=5,'learned range has center and radius');
  assert.ok(snap.totalFamiliarity>=2.5,'home establishment comes from accumulated familiarity');
  assert.ok(sim.cognition.snapshot(p).history.some(e=>e.type==='home-established'),'home establishment enters life history');
}

{
  const {sim,p}=prep('GENVO8-HOME-RETURN');learn(sim,p,4);
  p.player=false;p.x=82;p.y=82;
  const target=sim.territory.returnTarget(p);
  assert.ok(target?.home,'lineage individual outside its range gets a return-home target');
  assert.ok(Math.hypot(target.x-52,target.y-52)<8,'return target points toward learned center');
}

{
  const {sim,p}=prep('GENVO8-HOME-ROAM');learn(sim,p,5);
  const snap=sim.territory.snapshot(p),target=sim.territory.roamTarget(p,9);
  assert.ok(target,'established lineage can choose a home-range roam target');
  assert.ok(Math.hypot(target.x-snap.home.x,target.y-snap.home.y)<=snap.home.radius+6,'roaming remains biased around learned/familiar habitat');
}

{
  const {sim,p}=prep('GENVO8-HOME-INTRUDER');learn(sim,p,5);p.player=false;p.genes.temperament=1.1;
  const snap=sim.territory.snapshot(p),intruder=sim.spawnAnimal('genvo',snap.home.x+1,snap.home.y);intruder.age=SPECIES.genvo.maturity+5;
  sim.rebuildSpatial();
  const response=sim.territory.intrusionResponse(p);
  assert.equal(response?.intruder?.id,intruder.id,'unrelated GenVo8 in familiar core is recognized as an intruder');
  assert.equal(response?.intent,'ward','bold lineage individual wards a core intruder');
  assert.equal(sim.territory.applyWard(p,intruder),true);
  assert.equal(intruder.territoryPressure.ownerId,p.id,'warding applies temporary non-lethal displacement pressure');
  assert.ok(sim.territory.pressureTarget(intruder)?.pressure,'displaced intruder receives an escape target');
}

{
  const {sim,p}=prep('GENVO8-HOME-KIN');learn(sim,p,5);p.player=false;
  const mate=sim.spawnAnimal('genvo',52,52);mate.sex=p.sex==='F'?'M':'F';mate.age=SPECIES.genvo.maturity+2;
  const child=sim.spawnAnimal('genvo',52.5,52,[p,mate]);sim.lineage.registerBirth(child,[p,mate]);sim.family.registerBirth(child,p,mate);
  for(const a of sim.animals)if(a.species==='genvo'&&![p.id,mate.id,child.id].includes(a.id)){a.x=110;a.y=110}
  p.lastMate=mate.id;mate.lastMate=p.id;sim.rebuildSpatial();
  assert.equal(sim.territory.findIntruder(p),null,'mate and child are not treated as territory intruders');
}

{
  const sim=new Simulation('GENVO8-HOME-PLAYER-OFF',{player:false});
  for(let i=0;i<64;i++)sim.update(null);
  assert.equal(sim.territory.states.size,0,'player-off ecosystem does not gain founder-line territory state');
}

console.log('territory + learned home-range checks: PASS');
