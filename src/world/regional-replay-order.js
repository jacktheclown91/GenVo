import {CFG} from '../sim/config.js';
export const REGIONAL_REPLAY=Object.freeze({legacy:'bounded-strides/1',synchronized:'synchronized-strides/1'});
// Shared ordering for resident replay and the persisted directory. Inputs are
// clock/identity descriptors only; no biology or time is advanced here.
export function regionalBiologyOrder(tick,regions,policy){
 if(!Object.values(REGIONAL_REPLAY).includes(policy))throw Error('Unknown regional replay policy.');
 if(!Number.isSafeInteger(tick)||tick<0)throw Error('Invalid active regional clock.');
 if(policy!==REGIONAL_REPLAY.synchronized||tick%CFG.lifeStride!==0)return[];
 const due=[],seen=new Set();
 for(const region of regions){
  if(typeof region.key!=='string'||seen.has(region.key))throw Error('Duplicate or invalid replay region.');seen.add(region.key);
  if(region.mode!=='canonical-ticks/1')continue;
  if(!Number.isSafeInteger(region.tick)||region.tick<0||region.tick>tick)throw Error('Archived ecological clock is ahead of the player timeline.');
  if(region.tick<tick)due.push(region);
 }
 return due.sort((a,b)=>a.tick-b.tick||a.key.localeCompare(b.key));
}
