import {DIVING,submerged,waterColumn} from '../lineage/diving.js';
import {surfaceIceCovered} from '../world/surface-ice.js';

const clamp=v=>Math.max(0,Math.min(1,v));

// These are viewing treatments, never water transparency or biological sight.
// Eligibility and observation remain with the existing diving/sensory owners.
export function underwaterView(sim){
  const observer=sim.player();
  if(sim.divingRules!==DIVING.policy||!observer||observer.underground||!submerged(observer))return null;
  const column=waterColumn(sim.world,observer.x,observer.y);
  if(column<=0)return null;
  const depth=Math.min(column,Math.max(0,observer.diveDepth));
  const covered=surfaceIceCovered(sim.world.environment,sim.world.idx(observer.x,observer.y));
  return {depth,covered,strength:clamp((depth-.03)/.8)};
}

export function submergedActorOpacity(observer,actor){
  if(!submerged(actor))return 1;
  if(!observer||observer.underground||!submerged(observer))return .55;
  // Animals already admitted by canonical sight remain readable at our depth.
  // This changes painted contrast only, never which animals can be observed.
  const separation=Math.abs(observer.diveDepth-actor.diveDepth);
  return Math.max(.55,.96-clamp(separation/.65)*.41);
}

export function showDiveSurfaceCue(observer,actor){
  return submerged(actor)&&!submerged(observer);
}

export function drawUnderwaterView(renderer){
  const view=underwaterView(renderer.sim);
  if(!view)return false;
  const c=renderer.ctx;
  c.save();
  try{
    // No particles, bubbles, fake seabed plants or implied suspended sediment.
    // A depth-weighted color cast preserves the existing native artwork.
    c.fillStyle=`rgba(13,65,72,${(.035+view.strength*.065).toFixed(3)})`;
    c.fillRect(0,0,renderer.w,renderer.h);
    c.fillStyle=`rgba(6,22,36,${(view.strength*.07+(view.covered ? .025 : 0)).toFixed(3)})`;
    c.fillRect(0,0,renderer.w,renderer.h);
  }finally{
    c.restore();
  }
  return true;
}
