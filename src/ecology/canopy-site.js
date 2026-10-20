// E9: a persistent canopy stratum backed by the real, finite Woodspire stand.
// Perching requires both flight ancestry and anatomical purchase. A broad tree
// with depleted material cannot magically carry unlimited bodies or eggs.
import {adultBodyMass} from '../organisms/body-mass.js';
import {planPartCounts} from '../lineage/part-abilities.js';
import {hasGlidingSurfaces} from '../lineage/gliding.js';
import {winged,FLIGHT} from '../lineage/flight.js';

export const CANOPY=Object.freeze({
 tree:'woodspire', minimumTree:0.85, maxLoadPerTree:1.65,
 takeoffEnergy:FLIGHT.takeoffEnergy,
 fallingDamage:16, nestFailureDamage:.25
});
export function canopyGrips(animal){
 const c=planPartCounts(animal);
 return (c['climber-leg']||0)+(c.grasper||0);
}
export function canopySupport(world,x,y){
 if(!world?.isPlayable(x,y))return{supported:false,reason:'Outside the playable world.'};
 const i=world.idx(x,y),stand=world.plants?.[CANOPY.tree]?.[i]||0;
 if(world.water[i]||stand<CANOPY.minimumTree)return{supported:false,reason:'No mature, living Woodspire canopy here.',stand,i};
 return{supported:true,i,stand,maxLoad:stand*CANOPY.maxLoadPerTree};
}
export function roostAvailability(animal,world,{climbing=false}={}){
 climbing=climbing&&(animal?.bodyPlan?.nodes||[]).filter(n=>n.partId==='climber-leg').length>=2;
 if(!animal?.alive)return{enabled:false,reason:'No living creature.'};
 if(animal.aerialMode==='jump')return{enabled:false,reason:'Land from the jump before entering the canopy.'};
 if(animal.perched)return{enabled:false,reason:'Already in the canopy. Press 6 to take off or 7 to climb down.'};
 if(!animal.airborne&&!climbing)return{enabled:false,reason:'Take off before roosting in a tree.'};
 if(canopyGrips(animal)<2||(!climbing&&!winged(animal)&&!hasGlidingSurfaces(animal)))return{enabled:false,reason:'Requires two grasping or climbing legs and supported aerial anatomy.'};
 if(!animal.airborne&&(animal.energy<Math.max(8,3*adultBodyMass(animal)+2)||animal.health<35||animal.carryingFood))return{enabled:false,reason:'Climbing requires stored food energy, healthy grips and no carried food.'};
 const site=canopySupport(world,animal.x,animal.y);
 if(!site.supported)return{enabled:false,reason:site.reason};
 if(adultBodyMass(animal)>site.maxLoad)return{enabled:false,reason:'The branches cannot support this body mass.'};
 return{enabled:true,reason:'Grip the branches without spending flight energy.',site};
}
export function perch(animal,world,options={}){
 const status=roostAvailability(animal,world,options);
 if(!status.enabled)return{ok:false,type:'roost',message:status.reason};
 if(!animal.airborne)animal.energy-=3*adultBodyMass(animal);
 delete animal.aerialMode;delete animal.glideAltitude;delete animal.glideHeading;
 animal.airborne=false;animal.perched=true;animal.flightSeconds=0;animal.hidden=false;
 animal.target=null;animal.intent='idle';
 return{ok:true,type:'roost',message:'Perched in living Woodspire. Rest, tend canopy eggs or feed on the tree. Use Fly / 6, Glide / 0 or Descend / 7.'};
}
export function descend(animal,world){
 if(!animal?.perched)return{ok:false,type:'roost',message:'Not perched.'};
 if(world.water[world.idx(animal.x,animal.y)])return{ok:false,type:'roost',message:'Cannot descend into deep water.'};
 animal.perched=false;
 return{ok:true,type:'roost',message:'Climbed down to solid ground.'};
}
export function checkCanopyHold(animal,world){
 if(!animal?.perched)return null;
 const site=canopySupport(world,animal.x,animal.y);
 if(site.supported&&canopyGrips(animal)>=2&&adultBodyMass(animal)<=site.maxLoad)return null;
 animal.perched=false;
 animal.health=Math.max(0,animal.health-CANOPY.fallingDamage);
 return{ok:false,type:'roost',message:'The canopy fails to support the creature. It falls, suffering an injury.',forced:true};
}
export function canopyFeedingPosition(animal,world){
 const site=canopySupport(world,animal?.x,animal?.y);
 return !!animal?.perched&&site.supported&&canopyGrips(animal)>=2&&adultBodyMass(animal)<=site.maxLoad;
}
// Canopy clutches are protected by their real height, not a universal nest
// integrity bonus. Only another canopy occupant can physically raid them.
export function canAccessCanopyNest(animal,world,nest){
 if(nest?.layer!=='canopy')return !animal?.perched&&!animal?.airborne;
 return canopyFeedingPosition(animal,world)&&Math.hypot(animal.x-nest.x,animal.y-nest.y)<=1.4;
}
