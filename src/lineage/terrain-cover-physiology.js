// E3. Physical inherited anatomy influences actual thermal loss and uphill
// locomotion. No named-species switches, no duplicate reserves, no mutation RNG,
// and absolutely no flight/vertical-layer permission in this precursor wave.
import {planPartCounts} from './part-abilities.js';
export const COVER_PHYSICS=Object.freeze({
 'filament-tuft':{cold:.78,hot:1.04,wet:.85},
 'fur-mantle':{cold:.48,hot:1.24,wet:.55},
 'feather-mantle':{cold:.55,hot:1.12,wet:.82},
 'proto-wing':{cold:.83,hot:1.13,wet:.74}
});
export function thermalCoverFactor(animal,temp,comfort,{wet=false}={}){
 const parts=planPartCounts(animal);
 let coverage=null;
 for(const [id,effect] of Object.entries(COVER_PHYSICS))if(parts[id]&&(!coverage||effect.cold<coverage.cold))coverage=effect;
 if(!coverage)return 1;
 if(temp>=comfort)return coverage.hot;
 // Wet fur loses a larger fraction of its insulation than structured feather
 // cover. Current soil/precipitation owns wetness; no fictitious coat-water stock.
 return wet?coverage.cold+(1-coverage.cold)*(1-coverage.wet):coverage.cold;
}
export function inclineGrip(animal,grade){
 const counts=planPartCounts(animal);
 const climber=Math.min(4,counts['climber-leg']||0),pads=Math.min(4,counts['hook-pad']||0);
 const grip=climber+pads;
 if(!grip)return{speed:1,energy:1,grip:0,climbing:false};
 // A true supporting pair is necessary. One claw is not an uphill gait.
 if(grip<2)return{speed:.985,energy:1.01,grip,climbing:false};
 const uphill=Math.max(0,grade);
 const purchase=Math.min(.48,Math.max(0,uphill)*.12)*(Math.min(4,grip)/4);
 // Real slope still slows and costs energy; traction only offsets the
 // already calculated terrain penalty on supported uphill terrain.
 return{speed:uphill>0?1+purchase:.96,energy:uphill>0?1/(1+purchase*.6):1.035,grip,climbing:uphill>0};
}
