import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {predictPlayerPose} from '../src/render/player-prediction.js';

function dryLane(sim){for(let y=5;y<CFG.worldSize-5;y++)for(let x=5;x<CFG.worldSize-8;x++){let ok=true;for(let ox=-1;ox<=4;ox++)for(let oy=-1;oy<=1;oy++)if(sim.world.water[sim.world.idx(x+ox,y+oy)])ok=false;if(ok)return{x:x+.5,y:y+.5}}throw new Error('no dry lane')}
const sim=new Simulation('PRESENTATION-MOTION',{player:true}),p=sim.player(),lane=dryLane(sim);p.x=lane.x;p.y=lane.y;p.energy=100;p.anim=0;
const x0=p.x,still=predictPlayerPose(sim,{right:false},1/120);assert.equal(still.x,x0,'no-input presentation stays exactly on authoritative position');
const preview=predictPlayerPose(sim,{right:true},1/120);assert.ok(preview.x>x0,'held input produces same-frame presentation movement before the next authority step');assert.equal(p.x,x0,'presentation prediction never mutates canonical player position');
sim.playerControlStep({right:true},CFG.controlHz);const authority=p.x,between=predictPlayerPose(sim,{right:true},.5/CFG.controlHz);assert.ok(between.x>authority,'prediction fills the substep between 64 Hz authority updates');
const released=predictPlayerPose(sim,{right:false},.5/CFG.controlHz);assert.equal(released.x,authority,'releasing input removes visual interpolation tail immediately');
sim.paused=true;const paused=predictPlayerPose(sim,{right:true},.5/CFG.controlHz);assert.equal(paused.x,authority,'paused presentation never predicts movement');
console.log('player presentation prediction checks: PASS');
