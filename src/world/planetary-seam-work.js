import {CFG} from '../sim/config.js';
import {REGIONAL_REPLAY} from './planetary-offscreen-biology.js';
import {planetarySeamTransaction,SEAM_RESTART} from './planetary-seam-salt.js';
const work=new WeakMap();
export function planetarySeamWorkStatus(sim){const pending=work.get(sim);return pending?{phase:pending.phase,units:pending.units}:null;}
export function cancelPlanetarySeams(sim){const pending=work.get(sim);pending?.iterator.return();work.delete(sim);}
// One fixed-region validation or 128-cell pair stage per browser admission.
// The final publish is still atomic. Pending proposals are never save state.
export function preparePlanetarySeams(sim){
 if(!sim?.world?.planet||sim.regionalReplayPolicy!==REGIONAL_REPLAY.synchronized||sim.tickCount<=0||sim.tickCount%CFG.dayTicks||!sim.planetaryTravel?.sessions?.length||sim.planetaryTravel.seamLedger?.lastTick===sim.tickCount){if(sim)cancelPlanetarySeams(sim);return null}
 let pending=work.get(sim);if(!pending){pending={iterator:planetarySeamTransaction(sim),units:0};work.set(sim,pending)}
 try{
  const step=pending.iterator.next();if(step.done){work.delete(sim);return step.value===SEAM_RESTART?{phase:'restart',units:pending.units}:null}
  pending.units++;pending.phase=step.value.phase;return{...step.value,units:pending.units};
 }catch(error){work.delete(sim);throw error}
}
