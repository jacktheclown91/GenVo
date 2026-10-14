import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';

const sim=new Simulation('GENVO8-ACTIVITY-BUDGET',{player:true});
const p=sim.player();assert.ok(p);
const ambient=sim.animals.find(a=>a.alive&&!a.player&&!a.lineage&&!SPECIES[a.species]?.hunter);assert.ok(ambient);
ambient.energy=SPECIES[ambient.species].maxEnergy*.85;ambient.hydration=SPECIES[ambient.species].maxHydration*.85;ambient.health=100;ambient.intent='explore';ambient.target={x:ambient.x+6,y:ambient.y};
ambient.x=p.x+6;ambient.y=p.y;
assert.equal(sim.carrying.decisionStride(ambient),CFG.nearAmbientDecisionStride,'near ambient wildlife does not rebuild a full decision every ecology beat');
ambient.x=p.x+CFG.backgroundDecisionDistance+3;ambient.y=p.y;
assert.equal(sim.carrying.decisionStride(ambient),CFG.backgroundDecisionStride,'mid-distance wildlife uses background cadence');
ambient.x=p.x+CFG.farDecisionDistance+4;ambient.y=p.y;
assert.equal(sim.carrying.decisionStride(ambient),CFG.farDecisionStride,'far wildlife uses the lowest decision cadence');

const hunter=sim.animals.find(a=>a.alive&&SPECIES[a.species]?.hunter);assert.ok(hunter);hunter.x=p.x+CFG.farDecisionDistance+6;hunter.y=p.y;hunter.energy=SPECIES[hunter.species].maxEnergy*.85;hunter.hydration=SPECIES[hunter.species].maxHydration*.85;hunter.health=100;hunter.intent='explore';hunter.target={x:hunter.x+4,y:hunter.y};
assert.equal(sim.carrying.decisionStride(hunter),CFG.farDecisionStride,'unengaged far Stalkers are budgeted like other distant wildlife');
hunter.playerHunt={targetId:p.id,phase:'stalk',startedTick:sim.tickCount,untilTick:sim.tickCount+8};
assert.equal(sim.carrying.decisionStride(hunter),Math.min(4,CFG.farDecisionStride),'far active threats keep progressing at an elevated off-screen cadence without consuming foreground AI budget');
hunter.x=p.x+6;hunter.y=p.y;
assert.equal(sim.carrying.decisionStride(hunter),1,'active threats in the gameplay view return to full decision cadence');

// Ambient micro-pauses are ID-staggered, so a population no longer starts/stops as one beat.
const candidates=sim.animals.filter(a=>a.alive&&!a.player&&!a.lineage&&!SPECIES[a.species]?.hunter).slice(0,16);
for(const a of candidates){const s=SPECIES[a.species];a.energy=s.maxEnergy*.9;a.hydration=s.maxHydration*.9;a.health=100;a.infected=false;a.intent='explore';a.target={x:a.x+5,y:a.y}}
let sawMove=false,sawRest=false;
for(let k=0;k<20&&!(sawMove&&sawRest);k++){
  sim.tickCount=k*CFG.lifeStride;
  for(const a of candidates){const move=sim.activity.ambientMoveAllowed(a);sawMove||=move;sawRest||=!move}
}
assert.ok(sawMove&&sawRest,'ambient wildlife receives staggered move/rest windows');
console.log('activity budget + staggered wildlife cadence: PASS');
