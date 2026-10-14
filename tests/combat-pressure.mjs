import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {stalkerProfileFor} from '../src/organisms/stalker-profile.js';

function dryField(sim){
  const w=sim.world;
  for(let y=14;y<CFG.worldSize-14;y++)for(let x=14;x<CFG.worldSize-14;x++){
    let ok=true;for(let oy=-7;oy<=7&&ok;oy++)for(let ox=-7;ox<=7;ox++)if(w.water[w.idx(x+ox,y+oy)]){ok=false;break}
    if(ok)return{x:x+.5,y:y+.5};
  }
  return null;
}
function stalkers(sim,count=3){
  const found=sim.animals.filter(a=>a.alive&&a.species==='needlejaw');
  while(found.length<count)found.push(sim.spawnAnimal('needlejaw'));
  return found.slice(0,count);
}

// Three nearby Stalkers create pressure, but only one may commit a charge lane at once.
{
  const sim=new Simulation('GENVO8-MULTI-STALKER',{player:true}),p=sim.player();sim.endOpeningGrace('test');const f=dryField(sim);assert.ok(f);
  p.x=f.x;p.y=f.y;const hs=stalkers(sim,3),spots=[[-3.2,0],[2.7,-2.0],[2.9,2.1]];
  hs.forEach((h,i)=>{h.x=p.x+spots[i][0];h.y=p.y+spots[i][1];h.energy=120;h.health=100;h.genes.temperament=i===0?1.08:i===1?1:.92;h.playerHunt={targetId:p.id,phase:'stalk',style:stalkerProfileFor(h).id,role:'stalk',startedTick:sim.tickCount,untilTick:sim.tickCount,lastOutcome:null,aimX:null,aimY:null};});
  const decisions=hs.map(h=>sim.predator.decision(h,p));
  const committed=hs.filter(h=>['windup','charge'].includes(h.playerHunt?.phase));
  assert.equal(committed.length,1,'only one nearby Stalker commits an attack lane');
  assert.equal(decisions.filter(d=>d?.intent==='hunt-windup').length,1,'one windup is exposed at a time');
  assert.equal(decisions.filter(d=>d?.intent==='stalk-player').length,2,'secondary Stalkers keep pressure instead of freezing');
  assert.ok(hs.filter(h=>h.playerHunt?.role==='pressure').length>=2,'secondary hunters are marked as pressure roles');
  const status=sim.predator.playerStatus(p);assert.equal(status.threatCount,3);assert.ok(status.pressureCount>=2);

  // Resolving an attack produces brief breathing room before another hunter may commit.
  const active=committed[0];sim.predator.beginRecover(active,'evaded');sim.predator.noteOutcome(active,p,'evaded');
  const next=hs.find(h=>h!==active);next.playerHunt.phase='stalk';next.playerHunt.untilTick=sim.tickCount;
  let d=sim.predator.decision(next,p);assert.equal(d.intent,'stalk-player','recent outcome prevents an immediate chained windup');
  sim.tickCount+=Math.ceil(CFG.simHz*.5);next.playerHunt.untilTick=sim.tickCount;
  d=sim.predator.decision(next,p);assert.equal(d.intent,'hunt-windup','another hunter may commit after the breathing window');
}

// Mobility changes the escape decision itself, not only raw sprint speed.
{
  const sim=new Simulation('GENVO8-SPRING-BREAKAWAY',{player:true}),p=sim.player(),h=stalkers(sim,1)[0];sim.endOpeningGrace('test');const f=dryField(sim);assert.ok(f);p.x=f.x;p.y=f.y;h.genes.temperament=1;
  const profile=stalkerProfileFor(h),base=sim.predator.breakawayRange(profile,p);p.adaptations=['spring-tendons'];const spring=sim.predator.breakawayRange(profile,p);
  assert.ok(spring<base-.5,'Spring Tendons reduce the distance required to break pursuit');
}

// Defensive adaptations create distinct post-contact outcomes.
{
  const sim=new Simulation('GENVO8-DEFENSE-CONTACT',{player:true}),p=sim.player(),h=stalkers(sim,1)[0];sim.endOpeningGrace('test');const f=dryField(sim);assert.ok(f);p.x=f.x;p.y=f.y;h.x=p.x+.55;h.y=p.y;h.energy=120;h.health=100;h.genes.temperament=1;const profile=stalkerProfileFor(h);
  const old=sim.rng.chance;sim.rng.chance=()=>true;
  p.adaptations=['hardened-mantle'];h.playerHunt={targetId:p.id,phase:'charge',style:profile.id,startedTick:sim.tickCount,untilTick:sim.tickCount+CFG.simHz,lastOutcome:null,aimX:p.x,aimY:p.y};
  assert.equal(sim.predator.resolveCharge(h),true);const armoredRecovery=h.playerHunt.untilTick-sim.tickCount;assert.ok(armoredRecovery>Math.round(CFG.simHz*profile.recovery),'Hardened Mantle creates extra rebound recovery after surviving a hit');

  p.health=100;p.adaptations=['bitter-slime'];h.x=p.x+.55;h.y=p.y;h.playerAversion=null;h.playerHunt={targetId:p.id,phase:'charge',style:profile.id,startedTick:sim.tickCount,untilTick:sim.tickCount+CFG.simHz,lastOutcome:null,aimX:p.x,aimY:p.y};
  assert.equal(sim.predator.resolveCharge(h),true);assert.equal(h.playerHunt,null,'Bitter Slime ends the active hunt after contact');assert.ok(h.playerAversion?.untilTick>sim.tickCount,'Bitter Slime preserves predator aversion instead of being overwritten by recovery');
  sim.rng.chance=old;
}

console.log('multi-Stalker pressure, attack arbitration and tactical adaptations: PASS');
