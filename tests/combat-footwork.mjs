import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {stalkerProfileFor} from '../src/organisms/stalker-profile.js';

function openLane(sim){
  const w=sim.world;
  for(let y=10;y<CFG.worldSize-10;y++)for(let x=10;x<CFG.worldSize-10;x++){
    let ok=true;
    for(let oy=-5;oy<=5&&ok;oy++)for(let ox=-7;ox<=7;ox++){
      const xx=x+ox,yy=y+oy;
      if(w.water[w.idx(xx,yy)]){ok=false;break}
    }
    if(ok)return{x:x+.5,y:y+.5};
  }
  return null;
}

// A windup commits to a straight lane. Moving laterally after the tell must not make
// the charge target home onto the player's new position.
const sim=new Simulation('GENVO8-COMBAT-FOOTWORK',{player:true});
const p=sim.player(),h=sim.animals.find(a=>a.alive&&a.species==='needlejaw');
assert.ok(p&&h);sim.endOpeningGrace('test');const lane=openLane(sim);assert.ok(lane);
p.x=lane.x;p.y=lane.y;h.x=lane.x-3.6;h.y=lane.y;h.genes.temperament=1.08;h.energy=120;h.health=100;
h.playerHunt={targetId:p.id,phase:'stalk',style:'rusher',startedTick:sim.tickCount,untilTick:sim.tickCount,lastOutcome:null,aimX:null,aimY:null};
let decision=sim.predator.decision(h,p);assert.equal(decision.intent,'hunt-windup');
const locked={x:h.playerHunt.aimX,y:h.playerHunt.aimY};assert.ok(Number.isFinite(locked.x)&&Number.isFinite(locked.y));
p.y+=1.15;h.playerHunt.untilTick=sim.tickCount;
decision=sim.predator.decision(h,p);assert.equal(decision.intent,'charge-player');
assert.equal(decision.target.x,locked.x,'committed charge lane keeps its original aim X');
assert.equal(decision.target.y,locked.y,'committed charge lane keeps its original aim Y');
assert.notEqual(decision.target.y,p.y,'charge target does not home onto lateral player movement');

// Running the committed charge out without contact is an explicit evade -> recovery.
h.playerHunt.untilTick=sim.tickCount;
decision=sim.predator.decision(h,p);assert.equal(decision.intent,'hunt-recover');
assert.equal(h.playerHunt.phase,'recover');assert.equal(h.playerHunt.lastOutcome,'evaded');
assert.equal(sim.lastPlayerPredatorOutcome?.outcome,'evaded');

// Recovery is a deliberate punish window with better accuracy/damage and lower effort.
h.x=p.x-.8;h.y=p.y;h.playerHunt={targetId:p.id,phase:'recover',style:'rusher',startedTick:sim.tickCount,untilTick:sim.tickCount+CFG.simHz,lastOutcome:'evaded',aimX:locked.x,aimY:locked.y};
const baseDamage=5.5+Math.max(0,(p.genes.body-1)*18),energyBefore=p.energy;
const oldChance=sim.rng.chance;sim.rng.chance=()=>true;const strike=sim.playerStrike(h);sim.rng.chance=oldChance;
assert.equal(strike.ok,true);assert.equal(strike.opening,true);assert.equal(strike.combatWindow,'recover');
assert.ok(strike.damage>baseDamage,'opening bite receives the recovery damage multiplier');
assert.ok(p.energy<energyBefore,'opening bite still costs energy');
assert.match(strike.message,/Opening bite/i);

// Making real distance during recovery breaks the engagement and gives the player time
// to leave instead of immediately restarting the same stalk loop.
const escape=new Simulation('GENVO8-COMBAT-BREAKAWAY',{player:true});
const ep=escape.player(),eh=escape.animals.find(a=>a.alive&&a.species==='needlejaw');assert.ok(ep&&eh);escape.endOpeningGrace('test');const field=openLane(escape);assert.ok(field);
ep.x=field.x;ep.y=field.y;eh.genes.temperament=1;const profile=stalkerProfileFor(eh);eh.x=ep.x-profile.breakawayRange-.25;eh.y=ep.y;eh.playerHunt={targetId:ep.id,phase:'recover',style:profile.id,startedTick:escape.tickCount,untilTick:escape.tickCount+CFG.simHz,lastOutcome:'evaded'};
const retreat=escape.predator.decision(eh,ep);assert.equal(retreat.intent,'escape');assert.equal(eh.playerHunt,null);assert.ok(eh.playerAversion?.untilTick>escape.tickCount);
assert.equal(escape.lastPlayerPredatorOutcome?.outcome,'escaped');

console.log('combat footwork, committed charges, punish windows and breakaway: PASS');
