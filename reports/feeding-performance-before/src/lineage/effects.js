import {partEffectFactors} from './part-abilities.js';
// v1.32 consolidation Stage C: one place where a creature's inherited and learned biology
// combine into what it can do. Forms, proto-traits, lifestyles, habits and adaptations still
// supply their own factors, but they meet here, once, under a shared limit. Before this,
// each call site multiplied them separately and nothing stopped them stacking: the widest
// ranging lineage searched 2.6 times as far as a plain one and walked almost at sprint speed.
// The limits are set so no single system is reduced; only stacks are.
export const EFFECT_LIMITS=Object.freeze({
  movement:[.9,1.12],
  forageRange:[.7,1.75],
  familyForageRange:[.7,1.75],
  threatSense:[.8,1.7],
  shelterExposure:[.78,1.1],
  metabolism:[.82,1.2],
  waterUse:[.62,1.3]
});
const limit=(key,v)=>{const [lo,hi]=EFFECT_LIMITS[key];return Math.max(lo,Math.min(hi,Number.isFinite(v)?v:1))};

// Land travel from lineage biology (form, proto-trait, lifestyle). Genes, carrying, injury
// and stance stay outside: they are the creature's own body and state, not lineage stacking.
export function movementEffect(sim,a,landLifestyle=sim.speciesLifestyle?.movementMultiplier?.(a,{swimming:false})||1){
  return limit('movement',(sim.divergence?.movementMultiplier?.(a)||1)*(sim.protoSpeciation?.movementMultiplier?.(a)||1)*landLifestyle);
}
export function forageRangeEffect(sim,a){
  return limit('forageRange',(partEffectFactors(a)?.forage??1)*(a?.lineage?sim.habits?.forageRangeMultiplier?.(a)??1:1)*(sim.divergence?.forageRangeMultiplier?.(a)||1)*(sim.protoSpeciation?.forageRangeMultiplier?.(a)||1)*(sim.speciesLifestyle?.forageRangeMultiplier?.(a)||1));
}
// Family-guided foraging (behavioral tendency) uses the family's range instead of habits.
export function familyForageRangeEffect(sim,a){
  return limit('familyForageRange',(sim.tendency?.forageRangeMultiplier?.()||1)*(sim.divergence?.forageRangeMultiplier?.(a)||1)*(sim.protoSpeciation?.forageRangeMultiplier?.(a)||1));
}
// How far threats are noticed, before cognition's learned flight radius.
export function threatSenseEffect(sim,a){
  return limit('threatSense',(partEffectFactors(a)?.threatSense??1)*(sim.divergence?.sensoryMultiplier?.(a)||1)*(sim.protoSpeciation?.sensoryMultiplier?.(a,'threat')||1)*(sim.speciesLifestyle?.threatSenseMultiplier?.(a)||1)*(a?.lineage?sim.habits?.threatRadiusMultiplier?.(a)??1:1));
}
// Share of predator damage that still gets through while sheltering (lower is safer).
export function shelterExposureEffect(sim,a){
  return limit('shelterExposure',(sim.divergence?.shelterProtectionMultiplier?.(a)||1)*(sim.protoSpeciation?.shelterProtectionMultiplier?.(a)||1)*(sim.speciesLifestyle?.shelterProtectionMultiplier?.(a)||1));
}
export function metabolismEffect(sim,a,fx){return limit('metabolism',(fx?.metabolism??1)*(sim.protoSpeciation?.metabolismMultiplier?.(a)||1))}
export function waterUseEffect(sim,a,fx){return limit('waterUse',(fx?.waterUse??1)*(sim.protoSpeciation?.waterUseMultiplier?.(a)||1))}
