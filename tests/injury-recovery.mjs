import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {visualLifeState} from '../src/render/life.js';
import {behaviorVisualState} from '../src/render/behavior.js';

function setup(seed){const sim=new Simulation(seed,{player:true}),p=sim.player();sim.endOpeningGrace('test');p.health=54;p.energy=SPECIES.genvo.maxEnergy*.9;p.hydration=SPECIES.genvo.maxHydration*.9;p.intent='idle';p.target=null;return{sim,p}}

{
  const {sim,p}=setup('GENVO8-INJURY-BASE'),rng=sim.rng.state;
  const hunter=sim.animals.find(a=>a.alive&&a.species==='needlejaw');
  const snap=sim.injury.onDamage(p,{damage:46,attacker:hunter});
  assert.equal(snap.level,'wounded','a typical surviving Stalker hit creates a meaningful wound');
  assert.ok(snap.movementMultiplier<.9&&snap.movementMultiplier>.8,'wound slows movement without removing escape');
  assert.ok(sim.injury.movementCostMultiplier(p,{sprint:true})>sim.injury.movementCostMultiplier(p,{sprint:false}),'sprinting while wounded is more costly');
  assert.equal(sim.rng.state,rng,'injury classification consumes no simulation RNG');
  const life=visualLifeState(sim,p,{frame:2,moving:true,action:'move'}),behavior=behaviorVisualState({species:'genvo',id:p.id,action:'move',phase:2,moving:true,life});
  assert.equal(life.injured,true,'renderer receives persistent injury state above the old low-health threshold');
  assert.ok(behavior.limp>.5,'persistent wound produces readable limp body language');
}


{
  const {sim,p}=setup('GENVO8-INJURY-COMBAT'),hunter=sim.animals.find(a=>a.alive&&a.species==='needlejaw');assert(hunter,'canonical Stalker exists');
  hunter.x=p.x+.4;hunter.y=p.y;hunter.energy=100;const chance=sim.rng.chance;sim.rng.chance=()=>true;
  const hit=sim.tryKill(hunter,p);sim.rng.chance=chance;assert.equal(hit,true,'canonical predator attack lands in focused integration test');assert.ok(sim.injury.snapshot(p)?.active,'real Stalker damage creates the player wound state');assert.equal(sim.lastPlayerDamage?.attackerId,hunter.id,'existing player-damage record remains authoritative');
}

{
  const rested=setup('GENVO8-INJURY-REST'),active=setup('GENVO8-INJURY-ACTIVE');
  for(const pair of [rested,active]){pair.sim.injury.onDamage(pair.p,{damage:46,attacker:null});pair.sim.shelter.shelters.length=0}
  rested.sim.shelter.shelters.push({id:1,ownerId:rested.p.id,x:rested.p.x,y:rested.p.y,integrity:100,weatherSeal:1,foodStore:4,capacity:28,constructedDay:rested.sim.day,constructedYear:rested.sim.year,lastUsedTick:rested.sim.tickCount});
  rested.p.intent='idle';rested.p.target=null;for(let i=0;i<8;i++)rested.sim.injury.phase();
  active.p.intent='player';active.p.target={dx:1,dy:0,sprint:false};for(let i=0;i<8;i++)active.sim.injury.phase();
  const r0=rested.sim.injury.snapshot(rested.p).remaining,a0=active.sim.injury.snapshot(active.p).remaining;
  rested.sim.injury.advanceDay();active.sim.injury.advanceDay();
  const r1=rested.sim.injury.snapshot(rested.p).remaining,a1=active.sim.injury.snapshot(active.p).remaining;
  assert.ok(r0-r1>a0-a1+.35,'quiet shelter rest materially speeds wound recovery');
}

{
  const {sim,p}=setup('GENVO8-INJURY-STRAIN');sim.injury.onDamage(p,{damage:46});const state=p.injuryCare;
  p.intent='player';p.target={dx:1,dy:0,sprint:true};for(let i=0;i<5;i++)sim.injury.phase();assert.ok(state.strainToday>.25,'sprinting while wounded accumulates recovery strain');
  p.health=28;sim.injury.onDamage(p,{damage:62});assert.equal(sim.injury.snapshot(p).level,'severe','a second major trauma can escalate the wound');
  state.remaining=.2;p.intent='idle';p.target=null;sim.shelter.shelters.push({id:2,ownerId:p.id,x:p.x,y:p.y,integrity:100,weatherSeal:1,foodStore:0,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount});for(let i=0;i<8;i++)sim.injury.phase();sim.injury.advanceDay();assert.equal(sim.injury.snapshot(p).active,false,'supported recovery eventually clears the injury state');
}

{
  const sim=new Simulation('GENVO8-INJURY-HEADLESS',{player:false}),a=sim.animals.find(x=>x.alive&&x.species==='genvo'),rng=sim.rng.state;
  assert.equal(sim.injury.onDamage(a,{damage:50}),null);sim.injury.phase();sim.injury.advanceDay();assert.equal(a.injuryCare,undefined,'player:false ecology creates no injury recovery state');assert.equal(sim.rng.state,rng,'headless injury authority consumes no simulation RNG');
}
console.log('injury recovery checks: PASS');
