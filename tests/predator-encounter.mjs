import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';

function sameLandPoint(sim,p,radius){
  for(let oy=-Math.ceil(radius);oy<=Math.ceil(radius);oy++)for(let ox=-Math.ceil(radius);ox<=Math.ceil(radius);ox++){
    const d=Math.hypot(ox,oy);if(d<radius-.45||d>radius+.45)continue;const x=p.x+ox,y=p.y+oy;
    if(x>2&&y>2&&x<CFG.worldSize-2&&y<CFG.worldSize-2&&!sim.world.water[sim.world.idx(x,y)]&&sim.world.sameLand(p.x,p.y,x,y))return{x,y};
  }
  return null;
}

const sim=new Simulation('GENVO8-PREDATOR-PHASES',{player:true});
const p=sim.player();sim.endOpeningGrace('test');
const hunter=sim.animals.find(a=>a.alive&&a.species==='needlejaw');assert.ok(hunter);hunter.genes.temperament=1.08;
const spot=sameLandPoint(sim,p,4.2);assert.ok(spot);hunter.x=spot.x;hunter.y=spot.y;hunter.energy=SPECIES.needlejaw.maxEnergy*.80;
sim.rebuildSpatial();sim.phaseDecision({});
assert.equal(hunter.intent,'stalk-player','player hunt begins as a readable stalk, not immediate contact damage');
assert.equal(hunter.playerHunt?.phase,'stalk');
assert.ok(sim.predator.speedMultiplier(hunter)<1,'stalking deliberately closes more slowly');

hunter.playerHunt.untilTick=sim.tickCount;sim.phaseDecision({});
assert.equal(hunter.intent,'hunt-windup','close stalker telegraphs its committed attack');
assert.equal(sim.predator.playerStatus(p)?.phase,'windup');
assert.ok(sim.lastPlayerPredatorTell?.phase==='windup');

hunter.playerHunt.untilTick=sim.tickCount;sim.phaseDecision({});
assert.equal(hunter.intent,'charge-player','windup becomes a committed charge');
assert.ok(sim.predator.speedMultiplier(hunter)>1.5,'charge is materially faster than ordinary pursuit');
assert.equal(sim.predator.playerStatus(p)?.phase,'charge');

hunter.x=p.x+.7;hunter.y=p.y;hunter.intent='charge-player';hunter.target=p;p.health=100;
const oldChance=sim.rng.chance;sim.rng.chance=()=>true;
sim.resolveInteraction(hunter);sim.rng.chance=oldChance;
assert.ok(p.health<100,'charge can resolve through canonical predation damage');
assert.equal(hunter.playerHunt?.phase,'recover','Stalker has a punishable recovery window after its attempt');
assert.ok(sim.predator.speedMultiplier(hunter)===0);

// Camouflage can break a windup before the charge commits if the player has real cover.
const hideSim=new Simulation('GENVO8-PREDATOR-HIDE',{player:true});const hp=hideSim.player();hideSim.endOpeningGrace('test');hp.adaptations=['camouflage-mantle'];
const hh=hideSim.animals.find(a=>a.alive&&a.species==='needlejaw');const hs=sameLandPoint(hideSim,hp,3.2);assert.ok(hs);hh.x=hs.x;hh.y=hs.y;hh.energy=SPECIES.needlejaw.maxEnergy*.8;
const hi=hideSim.world.idx(hp.x,hp.y);hideSim.world.plants.bramble[hi]=.82;hp.hidden=true;hh.playerHunt={targetId:hp.id,phase:'windup',startedTick:hideSim.tickCount,untilTick:hideSim.tickCount+CFG.simHz};
const hiddenDecision=hideSim.predator.decision(hh,hp);assert.equal(hiddenDecision,null);assert.equal(hh.playerHunt,null,'successful concealment breaks the telegraphed hunt before charge');

// A player counterbite during windup interrupts the commitment even without a repel proc.
const counter=new Simulation('GENVO8-PREDATOR-COUNTER',{player:true});const cp=counter.player();counter.endOpeningGrace('test');const ch=counter.animals.find(a=>a.alive&&a.species==='needlejaw');ch.x=cp.x+.7;ch.y=cp.y;ch.health=100;ch.playerHunt={targetId:cp.id,phase:'windup',startedTick:counter.tickCount,untilTick:counter.tickCount+CFG.simHz};
const chance=counter.rng.chance;counter.rng.chance=()=>true;const bite=counter.playerStrike(ch);counter.rng.chance=chance;
assert.equal(bite.ok,true);assert.equal(ch.playerHunt?.phase,'recover','successful counterbite interrupts windup and creates recovery');

console.log('player-facing Stalker encounter phases: PASS');
