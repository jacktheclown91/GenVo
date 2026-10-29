import {iceSupports,settleIceLoad} from './ice-locomotion.js';
// E8: actual first-generation aerial traversal, funded by the organism's existing
// energy and mounted, inherited bilateral flight-wing structure. The wing is one
// symmetrical dorsal organ, not a wing granted by a species name or an edit of a
// living adult. This module owns no independent energy or locomotion authority.
import {adultBodyMass} from '../organisms/body-mass.js';
import {massCostToReserve,structuralScale,SIZE_PHYSICS} from '../organisms/body-size.js';
import {SPECIES} from '../organisms/species.js';
import {planPartCounts} from './part-abilities.js';
import {flightWindReading} from './flight-wind.js';

export const FLIGHT=Object.freeze({
 maxAdultMass:2.25, takeoffEnergy:6, minimumEnergy:14,
 basalEnergyPerSecond:.42, movingEnergyPerSecond:.24,
 airSpeed:1.48, airEnergy:1.85, minHealth:35,
 emergencyDamage:24
});
export function winged(animal){return (planPartCounts(animal)['flight-wing']||0)>0}
export function flightMass(animal){return adultBodyMass(animal)}
// What the wings must carry, as the anatomy's adult mass equivalent: wing loading
// grows as s (mass s^3 over wing area s^2) and the power margin shrinks as s^0.5
// (available ∝ M, needed ∝ M^7/6), so the same anatomy scaled by s loads its wings
// as if it weighed mass·s^-1.5. Reference-size bodies are unchanged.
export function flightLoading(animal){return animal?.bodySize?flightMass(animal)*structuralScale(animal)**-1.5:flightMass(animal)}
export function flightAvailability(animal,world){
 if(animal?.underground||animal?.burrowWork||animal?.caveTransit)return{enabled:false,reason:'Leave the underground passages and finish the current movement before flight.'};
 if(animal?.climb)return{enabled:false,reason:'Finish climbing before taking off.'};
 if(!animal?.alive)return{enabled:false,reason:'No living creature.'};
 if((animal.diveDepth||0)>.03)return{enabled:false,reason:'Surface before takeoff.'};
 if(animal.aerialMode)return{enabled:false,reason:'Finish the current aerial movement before powered flight.'};
 if(!winged(animal))return{enabled:false,reason:'Evolve a flight wing from an ancestral proto-wing.'};
 if(animal.airborne)return{enabled:true,airborne:true,reason:'Already flying. Land on ground to feed, drink or mate.'};
 if(flightLoading(animal)>FLIGHT.maxAdultMass)return{enabled:false,reason:'This body is too heavy to lift. Evolve a lighter torso or shed mass.'};
 const maturity=SPECIES[animal.species]?.maturity??0;
 if(animal.age<maturity*.75)return{enabled:false,reason:'Flight muscles are not developed yet.'};
 if(animal.health<FLIGHT.minHealth)return{enabled:false,reason:'Too injured to take off.'};
 if(animal.energy<FLIGHT.minimumEnergy)return{enabled:false,reason:'Need more stored food energy for powered flight.'};
 if(animal.carryingFood)return{enabled:false,reason:'Drop carried food before taking off.'};
 if(!world?.isPlayable(animal.x,animal.y)||(!animal.perched&&world.water[world.idx(animal.x,animal.y)]&&!iceSupports(world,animal)))return{enabled:false,reason:'Take off from firm ground or a stable canopy perch.'};
 return{enabled:true,airborne:false,reason:'Lift off with inherited wings. Flapping consumes energy. '+(flightWindReading(animal,world)?.description||'')};
}
export function takeoff(animal,world){
 const available=flightAvailability(animal,world);
 if(!available.enabled||available.airborne)return{ok:false,type:'flight',message:available.reason};
 delete animal.iceImmersion;animal.energy-=FLIGHT.takeoffEnergy;
 animal.airborne=true;animal.perched=false;animal.flightSeconds=0;animal.hidden=false;
 return{ok:true,type:'flight',message:'Airborne. Movement crosses water and slopes. Land on solid ground to recover.'};
}
export function landingAvailability(animal,world,{swimmer=false}={}){
 if(animal?.aerialMode)return{enabled:false,reason:animal.aerialMode==='glide'?'Use Glide / 0 to fold the membranes.':'Finish the jump before another landing action.'};
 if(!animal?.airborne)return{enabled:false,reason:'Already on the surface.'};
 if(!world?.isPlayable(animal.x,animal.y))return{enabled:false,reason:'Cannot land beyond the world boundary.'};
 if(world.water[world.idx(animal.x,animal.y)]&&!swimmer&&!iceSupports(world,animal))return{enabled:false,reason:'Open water below. Reach solid land before descending.'};
 return{enabled:true,reason:'Land here and return to surface movement. '+(flightWindReading(animal,world)?.description||'')};
}
export function land(animal,world,{swimmer=false}={}){
 const availability=landingAvailability(animal,world,{swimmer});
 if(!availability.enabled)return{ok:false,type:'flight',message:availability.reason};
 settleIceLoad(world,animal); animal.airborne=false;animal.flightSeconds=0;
 return{ok:true,type:'flight',message:'Landed. Ground interactions are available again.'};
}
export function toggleFlight(animal,world,{swimmer=false}={}){
 return animal?.airborne?land(animal,world,{swimmer}):takeoff(animal,world);
}
// Called at the existing metabolism cadence, once per life step, including
// when idle. There is no free hovering, infinite flight or hidden fuel stock.
// Emergency descent is a physical fall. A non-swimmer above open water remains
// stranded in water with real survival pressure instead of being teleported.
export function advanceFlight(animal,world,elapsedSeconds,{rain=0,swimmer=false,moving=false}={}){
 if(!animal?.alive||!animal.airborne||animal.aerialMode)return null;
 const mass=flightMass(animal),load=Math.max(.7,mass/1.5);
 const wetPenalty=1+Math.max(0,rain-.45)*.5;
 const cost=(FLIGHT.basalEnergyPerSecond+FLIGHT.movingEnergyPerSecond*(moving?1:0))*load*wetPenalty*elapsedSeconds;
 animal.energy-=massCostToReserve(animal,cost,SIZE_PHYSICS.flight);animal.flightSeconds=(animal.flightSeconds||0)+elapsedSeconds;
 if(animal.energy>0&&animal.health>=FLIGHT.minHealth&&winged(animal)&&flightLoading(animal)<=FLIGHT.maxAdultMass)return null;
 settleIceLoad(world,animal,2); animal.airborne=false;animal.flightSeconds=0;
 animal.health=Math.max(0,animal.health-FLIGHT.emergencyDamage);
 return{ok:false,type:'flight',message:world.water[world.idx(animal.x,animal.y)]&&!swimmer&&!iceSupports(world,animal)?'Flight exhausted over water. The creature falls into the water.':'Flight exhausted. Emergency landing causes injury.',cost,forced:true};
}
