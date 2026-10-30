import {DIURNAL,dayPhaseOf} from '../ecology/diurnal-temperature.js';

// One read-only color wash over the *already rendered* world. The ecological
// day/night authority is the only clock; no second cycle or hidden visibility.
// This never changes sensing, plant growth, temperature, UI, or game saves.
const clamp01=n=>Math.max(0,Math.min(1,n));
const proximity=(time,center,width)=>clamp01(1-Math.abs(time-center)/width);

export function diurnalLightReading(sim){
 const phase=dayPhaseOf(sim);
 if(phase.policy!==DIURNAL.policy)return null; // old saves keep old lighting
 const daylight=clamp01(phase.daylight);
 const dawn=proximity(phase.timeOfDay,DIURNAL.sunrise,.09);
 const dusk=proximity(phase.timeOfDay,DIURNAL.sunset,.09);
 const warm=Math.max(dawn,dusk)**2;
 // Preserve the readable pixel-art palette, rather than turning night black.
 // A single translucent fill replaces costly per-tile re-tinting/gradients.
 const alpha=Math.min(.24,.205*(1-daylight)**1.55+.02*warm);
 const red=Math.round(9+98*warm),green=Math.round(18+54*warm),blue=Math.round(38+3*warm);
 return Object.freeze({policy:DIURNAL.policy,alpha,daylight,warmth:warm,
  night:phase.night,color:`rgba(${red},${green},${blue},${alpha.toFixed(3)})`});
}

export function drawDiurnalLight(renderer){
 const sim=renderer?.sim,player=sim?.player?.();
 if(!player||player.underground||(player.diveDepth||0)>.03)return false;
 const light=diurnalLightReading(sim);
 if(!light||light.alpha<.002)return false;
 const c=renderer.ctx;
 c.save();c.fillStyle=light.color;c.fillRect(0,0,renderer.w,renderer.h);c.restore();
 return true;
}
