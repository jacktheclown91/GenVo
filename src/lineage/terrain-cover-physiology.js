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
 // Existing dorsal fur/feathers remain the only insulation-cover authority.
 // Dryland organs then apply distinct, physically conditional tradeoffs.
 let factor=coverage?(temp>=comfort?coverage.hot:wet?coverage.cold+(1-coverage.cold)*(1-coverage.wet):coverage.cold):1;
 if(parts['heat-frill'])factor*=temp>=comfort?.72:1.14;
 if(parts['wax-plates']&&temp>=comfort)factor*=1.18;
 return factor;
}

// A mounted wax barrier reduces evaporative water demand on actually dry soil.
// It cannot grant water, alter freshwater access or cancel other basal costs.
export function aridityWaterFactor(animal,moisture){
 const count=planPartCounts(animal)['wax-plates']||0;
 if(!count)return 1;
 if(!Number.isFinite(moisture))throw Error('Dryland water use needs physical soil moisture.');
 const dryness=Math.max(0,Math.min(1,(.48-moisture)/.48));
 return 1-.24*dryness;
}

// A two-foot support gait spreads body weight across loose dry soil.
// Single modified feet are incomplete; saturated ground impairs wide pads.
export function aridFooting(animal,moisture){
 const pads=planPartCounts(animal)['arid-pad']||0;
 if(pads<2)return{speed:1,energy:1,pads};
 if(!Number.isFinite(moisture))throw Error('Dryland footing needs physical soil moisture.');
 const dry=Math.max(0,Math.min(1,(.46-moisture)/.46));
 const wet=Math.max(0,Math.min(1,(moisture-.60)/.40));
 return{speed:1+.18*dry-.10*wet,energy:1-.12*dry+.14*wet,pads};
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
