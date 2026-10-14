import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';

function dryLane(sim){for(let y=5;y<CFG.worldSize-5;y++)for(let x=5;x<CFG.worldSize-8;x++){let ok=true;for(let ox=-1;ox<=4;ox++)for(let oy=-1;oy<=1;oy++)if(sim.world.water[sim.world.idx(x+ox,y+oy)])ok=false;if(ok)return{x:x+.5,y:y+.5}}throw new Error('no dry lane')}
const baseline=new Simulation('CONTROL-BASELINE',{player:true}),fast=new Simulation('CONTROL-BASELINE',{player:true});
const lane=dryLane(baseline),a=baseline.player(),b=fast.player();a.x=b.x=lane.x;a.y=b.y=lane.y;a.energy=b.energy=100;a.anim=b.anim=0;
baseline.phasePlayerMovement({right:true});
for(let i=0;i<CFG.controlHz/CFG.simHz;i++)fast.playerControlStep({right:true},CFG.controlHz);
assert.ok(Math.abs(a.x-b.x)<1e-9,'four 32 Hz control steps preserve canonical 8 Hz travel distance');
assert.ok(Math.abs(a.energy-b.energy)<1e-9,'higher-rate control preserves movement energy cost');
assert.ok(Math.abs(a.anim-b.anim)<1e-9,'higher-rate control preserves gait timing');
const before=b.x;fast.update({right:true},{externalPlayerControl:true});assert.equal(b.x,before,'ecology update does not double-apply externally stepped movement');
assert.equal(fast.tickCount,1,'ecology clock still advances at its canonical rate');
console.log('live control response checks: PASS');
