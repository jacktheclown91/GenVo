import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';

const sim=new Simulation('GENVO8-BACKGROUND-MOVE',{player:true}),p=sim.player();assert.ok(p);
const a=sim.animals.find(x=>x.alive&&!x.player&&!x.lineage&&!SPECIES[x.species]?.hunter);assert.ok(a);
const s=SPECIES[a.species];a.energy=s.maxEnergy*.9;a.hydration=s.maxHydration*.9;a.health=100;a.infected=false;a.intent='explore';
a.x=p.x+CFG.farDecisionDistance+8;a.y=p.y;a.target={x:a.x+24,y:a.y};
assert.equal(sim.activity.movementStride(a),CFG.farMovementStride,'far ambient wildlife uses coarse movement cadence');

let advances=0,totalScale=0;
for(let step=0;step<CFG.farMovementStride*3;step++){
  sim.tickCount=step*CFG.lifeStride;
  const b=sim.activity.movementBudget(a);if(b.advance){advances++;totalScale+=b.scale}
}
assert.equal(advances,3,'far movement executes once per configured stride');
assert.equal(totalScale,CFG.farMovementStride*3,'coarse movement compensates skipped beats with equal simulated time');

a.playerThreat={x:p.x,y:p.y,untilTick:sim.tickCount+100};
assert.ok(sim.activity.movementStride(a)<=2,'urgent far wildlife returns to elevated cadence');
a.x=p.x+6;a.y=p.y;a.playerThreat=null;
assert.equal(sim.activity.movementStride(a),1,'wildlife in the gameplay zone remains full-cadence');

const noPlayer=new Simulation('GENVO8-BACKGROUND-MOVE-HEADLESS',{player:false});
const h=noPlayer.animals.find(x=>x.alive);assert.equal(noPlayer.activity.movementStride(h),1,'headless ecology keeps canonical movement cadence');
console.log('background movement budget checks: PASS');
