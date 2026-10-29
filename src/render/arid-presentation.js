import {aridPhysiologyEnabled,aridExpressionOf} from '../ecology/arid-physiology.js';

// Only the biological authority decides whether tissue is flushed/sealed.
// Historical worlds retain their original paint. No reserves or state are set.
export function aridVisualState(sim,animal){
 if(!aridPhysiologyEnabled(sim)||!animal?.alive||!animal.bodyPlan)return null;
 const state=aridExpressionOf(sim,animal);
 if(!state.frillFlushed&&!state.waxSealed&&!state.aestivating)return null;
 return Object.freeze({frillFlushed:state.frillFlushed,waxSealed:state.waxSealed,aestivating:state.aestivating,
  cacheToken:[+state.frillFlushed,+state.waxSealed,+state.aestivating].join('')});
}

// A temporary surface appearance above the inherited ramp. Protected part
// accents and the organism's pigmentation remain unchanged; the native renderer
// caches the two bounded palettes just like its ordinary inherited tints.
export function aridPartPigment(partId,pigment,state){
 const flush=partId==='heat-frill'&&state?.frillFlushed,sealed=partId==='wax-plates'&&state?.waxSealed;
 if((!flush&&!sealed)||!Array.isArray(pigment))return pigment;
 const warm=flush?[170,62,44]:[218,204,153],mix=flush?.34:.18;
 return pigment.map(rgb=>rgb.map((value,channel)=>Math.round(value*(1-mix)+warm[channel]*mix)));
}
