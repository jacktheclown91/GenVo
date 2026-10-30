import {dayPhaseOf,DIURNAL} from '../ecology/diurnal-temperature.js';

const distance=(a,b)=>Math.min(Math.abs(a-b),1-Math.abs(a-b));
// Cosmetic response to the shared physical clock; never a lighting/sight rule.
export function daylightPresentation(sim){
  const phase=dayPhaseOf(sim);
  if(phase.policy!==DIURNAL.policy)return null;
  const nearest=Math.min(distance(phase.timeOfDay,DIURNAL.sunrise),distance(phase.timeOfDay,DIURNAL.sunset));
  const twilight=Math.max(0,1-nearest/.095)**2;
  const label=phase.night?'Night':phase.daylight<.35?(phase.timeOfDay<.5?'Dawn':'Dusk'):'Day';
  return {...phase,label,shade:.20*(1-phase.daylight),warmth:.065*twilight};
}

export function drawDaylight(renderer){
  const observer=renderer.sim.player();
  if(!observer||observer.underground||(observer.diveDepth||0)>.03)return false;
  const view=daylightPresentation(renderer.sim);
  if(!view)return false;
  const c=renderer.ctx;
  c.save();
  try{
    // Two flat color passes preserve the native grid and avoid frame-generated
    // textures/gradients. Sensing fog and interaction marks are drawn afterwards.
    if(view.shade>1e-6){c.fillStyle=`rgba(15,30,52,${view.shade})`;c.fillRect(0,0,renderer.w,renderer.h)}
    if(view.warmth>1e-6){c.fillStyle=`rgba(215,151,88,${view.warmth})`;c.fillRect(0,0,renderer.w,renderer.h)}
  }finally{
    c.restore();
  }
  return true;
}
