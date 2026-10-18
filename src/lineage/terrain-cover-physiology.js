// Real inherited physiology, evaluated from existing canonical immutable body plans.
// P1: resolve mounted cover and traction once per body-plan object; do not scan
// the full part registry or allocate transient objects on every movement tick.
// This is a derived WeakMap cache, never a secondary actor/material authority.
import {planPartCounts} from './part-abilities.js';
export const COVER_PHYSICS=Object.freeze({
 'filament-tuft':{cold:.78,hot:1.04,wet:.85},
 'fur-mantle':{cold:.48,hot:1.24,wet:.55},
 'feather-mantle':{cold:.55,hot:1.12,wet:.82},
 'proto-wing':{cold:.83,hot:1.13,wet:.74}
});
const COVER_ENTRIES=Object.entries(COVER_PHYSICS);
const EMPTY_TRACTION=Object.freeze({speed:1,energy:1,grip:0,climbing:false});
const SINGLE_TRACTION=Object.freeze({
  speed:.985,energy:1.01,grip:1,climbing:false
});
const profileCache=new WeakMap();
function mountedProfile(animal){
 const plan=animal?.bodyPlan;
 if(!plan||!Array.isArray(plan.nodes))return null;
 let found=profileCache.get(plan);
 if(found)return found;
 const parts=planPartCounts(animal);
 let coverage=null;
 for(const [id,coating] of COVER_ENTRIES)
   if(parts[id]&&(!coverage||coating.cold<coverage.cold))coverage=coating;
 const climber=Math.min(4,parts['climber-leg']||0);
 const pads=Math.min(4,parts['hook-pad']||0);
 found=Object.freeze({coverage,grip:climber+pads});
 profileCache.set(plan,found);
 return found;
}
export function thermalCoverFactor(animal,temp,comfort,{wet=false}={}){
 const coverage=mountedProfile(animal)?.coverage;
 if(!coverage)return 1;
 if(temp>=comfort)return coverage.hot;
 return wet?coverage.cold+(1-coverage.cold)*(1-coverage.wet):coverage.cold;
}
export function inclineGrip(animal,grade){
 const grip=mountedProfile(animal)?.grip||0;
 if(!grip)return EMPTY_TRACTION;
 if(grip<2)return SINGLE_TRACTION;
 const uphill=Math.max(0,grade);
 if(!(uphill>0))return {speed:.96,energy:1.035,grip,climbing:false};
 const purchase=Math.min(.48,uphill*.12)*(Math.min(4,grip)/4);
 return{speed:1+purchase,energy:1/(1+purchase*.6),grip,climbing:true};
}
