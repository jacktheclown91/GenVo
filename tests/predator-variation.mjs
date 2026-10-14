import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {stalkerProfileFor} from '../src/gameplay/predator-encounter.js';

function openPatch(sim,radius=4){
  const w=sim.world;
  for(let y=8;y<CFG.worldSize-8;y++)for(let x=8;x<CFG.worldSize-8;x++){
    let ok=true;
    for(let oy=-radius;oy<=radius&&ok;oy++)for(let ox=-radius;ox<=radius;ox++){
      if(ox*ox+oy*oy>radius*radius)continue;
      if(w.water[w.idx(x+ox,y+oy)]){ok=false;break}
    }
    if(ok)return{x,y};
  }
  return null;
}

const base=new Simulation('GENVO8-STALKER-VARIATION',{player:true});
const p=base.player(),hunter=base.animals.find(a=>a.alive&&a.species==='needlejaw');assert.ok(p&&hunter);base.endOpeningGrace('test');
assert.equal(stalkerProfileFor({genes:{temperament:1.06}}).id,'rusher');
assert.equal(stalkerProfileFor({genes:{temperament:.94}}).id,'wary');
assert.equal(stalkerProfileFor({genes:{temperament:1}}).id,'ambusher');
const rngBefore=base.rng.state;stalkerProfileFor(hunter);assert.equal(base.rng.state,rngBefore,'Stalker style derivation must not consume simulation RNG');

const patch=openPatch(base);assert.ok(patch,'test world should contain an open same-land patch');
p.x=patch.x;p.y=patch.y;hunter.x=patch.x-5;hunter.y=patch.y;hunter.energy=SPECIES.needlejaw.maxEnergy*.8;

// Ambushers circle to a lateral point and wait until materially closer before committing.
hunter.genes.temperament=1;hunter.playerHunt=null;
let move=base.predator.beginStalk(hunter,p,5);assert.equal(hunter.playerHunt.style,'ambusher');
assert.notDeepEqual({x:move.target.x,y:move.target.y},{x:p.x,y:p.y},'ambusher should stalk toward a flank point instead of always beelining');
hunter.playerHunt.untilTick=base.tickCount;move=base.predator.decision(hunter,p);assert.ok(['stalk-player','chase-player'].includes(move.intent),'ambusher at 5 units keeps pursuing rather than committing early');

// Rushers use the same readable phases but commit earlier and close fastest.
hunter.genes.temperament=1.08;hunter.playerHunt=null;hunter.x=patch.x-5;hunter.y=patch.y;
base.predator.beginStalk(hunter,p,5);hunter.playerHunt.untilTick=base.tickCount;move=base.predator.decision(hunter,p);
assert.equal(move.intent,'hunt-windup','rusher should commit from a wider range');
assert.equal(hunter.playerHunt.style,'rusher');
const rusherWindup=hunter.playerHunt.untilTick-base.tickCount;
hunter.playerHunt.untilTick=base.tickCount;move=base.predator.decision(hunter,p);assert.equal(move.intent,'charge-player');hunter.intent=move.intent;
assert.ok(base.predator.speedMultiplier(hunter)>2,'rusher charge should be the fastest encounter profile');

// Wary hunters telegraph for longer and a successful wound can drive them off.
const wary=new Simulation('GENVO8-STALKER-WARY',{player:true}),wp=wary.player(),wh=wary.animals.find(a=>a.alive&&a.species==='needlejaw');wary.endOpeningGrace('test');assert.ok(wp&&wh);
const wpatch=openPatch(wary);wp.x=wpatch.x;wp.y=wpatch.y;wh.x=wpatch.x-4;wh.y=wpatch.y;wh.genes.temperament=.92;wh.energy=SPECIES.needlejaw.maxEnergy*.8;
wary.predator.beginStalk(wh,wp,4);wh.playerHunt.untilTick=wary.tickCount;let wmove=wary.predator.decision(wh,wp);assert.equal(wmove.intent,'hunt-windup');
const waryWindup=wh.playerHunt.untilTick-wary.tickCount;assert.ok(waryWindup>rusherWindup,'wary hunter should expose a longer counter window');
wh.x=wp.x+.7;wh.y=wp.y;wh.health=100;wh.playerHunt={targetId:wp.id,phase:'windup',style:'wary',startedTick:wary.tickCount,untilTick:wary.tickCount+CFG.simHz};
const oldChance=wary.rng.chance;wary.rng.chance=()=>true;const hit=wary.playerStrike(wh);wary.rng.chance=oldChance;
assert.equal(hit.ok,true);assert.equal(wh.playerHunt,null,'wounded wary Stalker abandons the active hunt');assert.ok(wh.playerAversion?.untilTick>wary.tickCount,'wounded wary Stalker enters the existing retreat/aversion path');
wary.rebuildSpatial();wary.phaseDecision({});assert.equal(wh.intent,'escape','wary Stalker visibly retreats after being wounded');

console.log('Stalker temperament encounter variation: PASS');
