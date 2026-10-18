import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG,PLANTS} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {ACTIVITY_REVIEW} from '../src/ecology/activity.js';
import {plantPreference} from '../src/ecology/functional-diet.js';

// Phase 3H Milestone E: an animal already at its food or water interacts on every ecology beat, whether
// or not its (distance-compensated) movement advances on that beat, so distant wildlife does not eat or
// drink less often than the same animal near the player. ?lodInteraction=0 restores the old behaviour.
function beatsThatFed(enabled){
  ACTIVITY_REVIEW.continuousInteraction=enabled;
  const sim=new Simulation('LOD-INTERACTION-CONSISTENCY',{player:true}),p=sim.player();
  const a=sim.animals.find(x=>x.alive&&!x.player&&!x.lineage&&x.species==='mosskip');assert.ok(a&&p);
  const s=SPECIES[a.species],w=sim.world;
  const kind=Object.keys(PLANTS).filter(k=>w.plants[k]&&plantPreference(a,k)>0).sort((x,y)=>plantPreference(a,y)-plantPreference(a,x))[0];assert.ok(kind,'mosskip has an edible plant');
  let cell=null;for(let d=CFG.farDecisionDistance+4;d<w.n&&!cell;d++)for(const [dx,dy] of [[d,0],[-d,0],[0,d],[0,-d]]){const x=Math.floor(p.x+dx)+.5,y=Math.floor(p.y+dy)+.5;if(w.isPlayable(x,y)&&!w.water[w.idx(x,y)]&&sim.canOccupy(a,x,y)){cell={x,y};break}}
  assert.ok(cell,'a far land cell exists');
  sim.animals=[p,a];sim.rebuildSpatial();
  Object.assign(a,{x:cell.x,y:cell.y,energy:s.maxEnergy*.6,hydration:s.maxHydration*.9,health:100,infected:false});
  const i=w.idx(cell.x,cell.y);let fed=0,beats=0;
  for(let step=0;step<CFG.farMovementStride*4;step++){
    sim.tickCount=step*CFG.lifeStride;w.plants[kind][i]=1;a.intent='feed';a.target={kind,x:cell.x,y:cell.y};a.energy=s.maxEnergy*.6;
    assert.ok(sim.activity.movementStride(a)>1,'far feeding wildlife is on a coarse movement cadence');
    const before=a.energy;sim.phaseMovement();beats++;if(a.energy>before)fed++;
  }
  return{fed,beats};
}
const on=beatsThatFed(true),off=beatsThatFed(false);ACTIVITY_REVIEW.continuousInteraction=true;
assert.equal(on.fed,on.beats,'at-food wildlife eats on every beat regardless of its movement stride');
assert.ok(off.fed<off.beats&&off.fed>0,'old behaviour (switch off) only ate on movement-advance beats');
console.log(`LOD interaction consistency: fed ${on.fed}/${on.beats} beats (old rule ${off.fed}/${off.beats}): PASS`);
