import {wildTraits} from './wild-bodies.js';
// Shared Stalker temperament profile language.
// Kept outside gameplay/render layers so combat behavior, track-reading UI and
// silhouette presentation all describe the same inherited temperament bands.

export const STALKER_PROFILES=Object.freeze({
  ambusher:Object.freeze({
    id:'ambusher',label:'Flanker',stalkSpeed:.56,triggerRange:3.9,nearDelay:.78,farDelay:1.08,
    windup:.82,chargeSpeed:2.02,chargeDuration:1.08,recovery:1.30,flank:2.15,chargeLead:1.35,breakawayRange:5.15,breakawayAversion:2.2,
    visual:Object.freeze({bodyLength:1.02,bodyHeight:.94,tailLength:1.12,jawLength:1.02,legSpread:1.02,ridge:1.00,shoulder:0,cheek:1,accent:'#e28773'})
  }),
  rusher:Object.freeze({
    id:'rusher',label:'Rusher',stalkSpeed:.84,triggerRange:5.35,nearDelay:.46,farDelay:.70,
    windup:.58,chargeSpeed:2.10,chargeDuration:1.36,recovery:.88,flank:0,chargeLead:1.65,breakawayRange:5.65,breakawayAversion:1.7,
    visual:Object.freeze({bodyLength:1.10,bodyHeight:1.08,tailLength:.86,jawLength:1.13,legSpread:.92,ridge:1.45,shoulder:1,cheek:0,accent:'#ff806d'})
  }),
  wary:Object.freeze({
    id:'wary',label:'Wary',stalkSpeed:.62,triggerRange:4.45,nearDelay:.90,farDelay:1.18,
    windup:1.08,chargeSpeed:1.72,chargeDuration:1.22,recovery:1.52,flank:0,chargeLead:1.20,breakawayRange:4.85,breakawayAversion:2.8,
    visual:Object.freeze({bodyLength:.96,bodyHeight:.98,tailLength:1.06,jawLength:.94,legSpread:1.18,ridge:.72,shoulder:0,cheek:2,accent:'#e7aa82'})
  })
});

function temperamentProfile(animal){
  const temperament=animal?.genes?.temperament??1;
  if(temperament>=1.04)return STALKER_PROFILES.rusher;
  if(temperament<=.96)return STALKER_PROFILES.wary;
  return STALKER_PROFILES.ambusher;
}
// Living wildlife (2026-10-09): an evolved body adjusts the temperament profile: faster legs charge faster,
// better eyes reach farther. Elder Stalkers keep a gold accent for track reading.
const derived=new Map();
export function stalkerProfileFor(animal){
  const base=temperamentProfile(animal),t=wildTraits(animal),elder=!!animal?.elder;if(!elder&&t.chaseSpeed===1&&t.sight===1)return base;
  const key=base.id+"#"+(animal.bodyPlan?.id||"")+(elder?"#elder":"");let p=derived.get(key);if(p)return p;
  p=Object.freeze({...base,chargeSpeed:base.chargeSpeed*t.chaseSpeed,stalkSpeed:base.stalkSpeed*Math.sqrt(t.chaseSpeed),triggerRange:base.triggerRange*t.sight,breakawayRange:base.breakawayRange*Math.sqrt(t.sight),visual:Object.freeze({...base.visual,accent:elder?"#f0c040":base.visual.accent})});derived.set(key,p);return p;
}
export function stalkerProfileIdForTemperament(temperament=1){
  if(temperament>=1.04)return'rusher';
  if(temperament<=.96)return'wary';
  return'ambusher';
}
