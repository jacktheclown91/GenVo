import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {CFG} from '../src/sim/config.js';
import {MOVEMENT_PARITY} from '../src/ecology/movement-parity.js';

// Phase 3K: autonomous animals move every tick like the player (locomotion only between ecology steps);
// interactions stay on the ecology step.
assert.equal(MOVEMENT_PARITY.enabled,true);
const S=SPECIES.genvo,day=CFG.dayTicks,ratio=Math.round(CFG.controlHz/CFG.simHz);
function lane(sim){const W=sim.world;for(let y=10;y<W.n-10;y++)for(let x=8;x<W.n-60;x++){let ok=true;for(let k=0;k<52;k++){const i=W.idx(x+k+.5,y+.5);if(W.water[i]||!W.isPlayable(x+k+.5,y+.5)){ok=false;break}}if(ok)return{x:x+.5,y:y+.5}}return null}
function walk(auto){const sim=new Simulation('MOVEMENT-PARITY',{player:true});sim.endOpeningGrace?.('t');const p=sim.player(),L=lane(sim);sim.animals=[p];Object.assign(p,{x:L.x,y:L.y,energy:S.maxEnergy*.9,hydration:S.maxHydration*.9});sim.rebuildSpatial();if(auto)sim.setPlayerAutonomy(true);
  const goal={x:L.x+50,y:L.y},x0=p.x,e0=p.energy;if(auto){const pm=sim.phaseMovement.bind(sim);sim.phaseMovement=(...a)=>{p.intent='explore';p.target=goal;return pm(...a)}}/* hold the same walking goal against the AUTO decision step */for(let t=0;t<day;t++){if(auto){p.intent='explore';p.target=goal;sim.update(null)}else{for(let k=0;k<ratio;k++)sim.playerControlStep({right:true},CFG.controlHz);sim.update({right:true},{externalPlayerControl:true})}}return{dist:p.x-x0,energy:e0-p.energy}}
const manual=walk(false),autoWalk=walk(true);
assert.ok(Math.abs(autoWalk.dist/manual.dist-1)<.02,`same body, same effort: AUTO ${autoWalk.dist.toFixed(2)} vs manual ${manual.dist.toFixed(2)} tiles per day`);
assert.ok(Math.abs(autoWalk.energy/manual.energy-1)<.05,`and the same energy for that walk (${autoWalk.energy.toFixed(3)} vs ${manual.energy.toFixed(3)})`);
// Interactions stay on the ecology step: a grazer standing on food takes the same number of meals per day.
function meals(enabled){MOVEMENT_PARITY.enabled=enabled;const sim=new Simulation('MOVEMENT-PARITY-MEALS',{player:false});const a=sim.animals.find(x=>x.alive&&x.species==='mosskip'&&x.age>=SPECIES.mosskip.maturity);sim.animals=[a];sim.rebuildSpatial();let n=0;const ri=sim.resolveInteraction.bind(sim);sim.resolveInteraction=x=>{n++;return ri(x)};for(let t=0;t<day;t++)sim.update(null);MOVEMENT_PARITY.enabled=true;return n}
assert.equal(meals(true),meals(false),'interaction calls per day are unchanged by continuous locomotion');
// A hand-steered player stops when its key is released: the locomotion substep never moves it on the steering
// vector of its last input (that slide made a sprint into cover overshoot by 0.8 tiles).
{MOVEMENT_PARITY.enabled=true;const sim=new Simulation('MOVEMENT-PARITY',{player:true});sim.endOpeningGrace?.('t');const p=sim.player(),L=lane(sim);sim.animals=[p];Object.assign(p,{x:L.x,y:L.y});sim.rebuildSpatial();
  let t=0;for(;t<CFG.lifeStride*3+1;t++){for(let k=0;k<ratio;k++)sim.playerControlStep({right:true,sprint:true},CFG.controlHz);sim.update({right:true,sprint:true},{externalPlayerControl:true})}
  const x=p.x;for(let k=0;k<CFG.lifeStride-1;k++){for(let j=0;j<ratio;j++)sim.playerControlStep({},CFG.controlHz);sim.update({},{externalPlayerControl:true})}
  assert.ok(Math.abs(p.x-x)<1e-9,`a released key stops the player (slid ${(p.x-x).toFixed(3)} tiles)`)}
console.log(`movement parity: AUTO ${autoWalk.dist.toFixed(2)} = manual ${manual.dist.toFixed(2)} tiles/day, same energy, interactions unchanged: PASS`);
