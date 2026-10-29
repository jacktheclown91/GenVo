// inertia/1: bodies carry velocity (docs/INERTIA-DESIGN-2026-10-28.md, creator
// approval October 28, 0.20 s reference ramp). Speeding up, braking and turning
// share one bound, a traction circle: |dv/dt| <= min(muscle, traction).
//  - Muscle force grows with cross-section (s^2) and mass with s^3, so the same
//    anatomy scaled by s accelerates at REFERENCE_ACCELERATION / s.
//  - Ground traction is size-independent: firm ground allows twice the reference
//    acceleration (bodies down to half size stay muscle-limited); loose sand and
//    snow reduce it through the existing footing factors; ice allows a fifth.
//  - Swimming has no traction; added mass and drag halve propulsion.
// Top speed stays anatomical: size grants no speed. Reference-size bodies reach
// walking speed (2.15 tiles/s) in 0.20 s and reverse from it in 0.40 s.
// This module imports only the leaf body-size module.
import {structuralScale} from './body-size.js';

export const INERTIA=Object.freeze({policy:'inertia/1',rampSeconds:.2,referenceSpeed:2.15,groundTraction:2,iceTraction:.2,waterPropulsion:.5,
 // Positive kinetic work per unit mass and (tile/s)^2: one start from rest to the
 // reference sprint (3.33 tiles/s) costs about half a tile of travel (0.072 x mass per tile).
 kineticWork:.0065,maxSpeed:25});
export const REFERENCE_ACCELERATION=INERTIA.referenceSpeed/INERTIA.rampSeconds;
export const inertiaEnabled=sim=>sim?.inertiaRules===INERTIA.policy;

export function accelerationLimit(animal,{swimming=false,onIce=false,traction=1}={}){
 const muscle=REFERENCE_ACCELERATION/structuralScale(animal);
 if(swimming)return muscle*INERTIA.waterPropulsion;
 const grip=onIce?INERTIA.iceTraction:Math.max(0,Math.min(1,Number.isFinite(traction)?traction:1));
 return Math.min(muscle,REFERENCE_ACCELERATION*INERTIA.groundTraction*grip);
}
// Highest speed from which the body can still stop on a point `distance` away.
export function arrivalSpeed(maxSpeed,distance,accel){return Math.min(maxSpeed,Math.sqrt(2*Math.max(0,accel)*Math.max(0,distance)))}

// Exact motion over dt toward a constant desired velocity under a bounded
// acceleration: the velocity error closes along a straight line in velocity
// space, so one long step equals many short ones.
export function integrateMotion(vx,vy,desiredX,desiredY,accel,dt){
 const ex=desiredX-vx,ey=desiredY-vy,e=Math.hypot(ex,ey);
 if(!(dt>0))return{dx:0,dy:0,vx,vy};
 if(!(accel>0))return{dx:vx*dt,dy:vy*dt,vx,vy};
 if(e<=accel*dt){
  const t=e/accel,ux=e>0?ex/e:0,uy=e>0?ey/e:0;
  return{dx:vx*t+.5*accel*ux*t*t+desiredX*(dt-t),dy:vy*t+.5*accel*uy*t*t+desiredY*(dt-t),vx:desiredX,vy:desiredY};
 }
 const ux=ex/e,uy=ey/e,reach=accel*dt;
 return{dx:vx*dt+.5*accel*ux*dt*dt,dy:vy*dt+.5*accel*uy*dt*dt,vx:vx+ux*reach,vy:vy+uy*reach};
}
// A body without recorded motion is at rest.
export function velocityOf(animal){const m=animal?.motion;return m?{vx:m.vx,vy:m.vy}:{vx:0,vy:0}}
export function speedOf(animal){const m=animal?.motion;return m?Math.hypot(m.vx,m.vy):0}
// Plan one step: where the body would go and its new velocity. Nothing changes
// until commitMotion, so callers can still refuse an unoccupiable endpoint.
export function planMotion(animal,desiredX,desiredY,dt,travel={}){
 const {vx,vy}=velocityOf(animal),accel=accelerationLimit(animal,{swimming:!!travel.swimming,onIce:!!travel.onIce,traction:travel.traction??1});
 return{...integrateMotion(vx,vy,desiredX,desiredY,accel,dt),from:{vx,vy},accel,dt};
}
export function commitMotion(animal,plan){
 const dt=plan.dt>0?plan.dt:1;
 animal.motion={schema:1,vx:plan.vx,vy:plan.vy,ax:(plan.vx-plan.from.vx)/dt,ay:(plan.vy-plan.from.vy)/dt};
}
// Blocked by terrain or leaving the surface: the body stops.
export function haltMotion(animal){if(animal?.motion)delete animal.motion}
// Food for positive kinetic work (speeding up); braking is free in /1. Work is
// proportional to mass; callers enter it through massCostToReserve (M^1).
export function kineticWork(plan,mass){
 const before=plan.from.vx**2+plan.from.vy**2,after=plan.vx**2+plan.vy**2;
 return after>before?.5*(after-before)*mass*INERTIA.kineticWork:0;
}
// Saved worlds keep their recorded rule. Motion exists only under the rule and is
// finite and bounded; absent motion means at rest.
export function validateMotion(motion){
 if(motion?.schema!==1||!['vx','vy','ax','ay'].every(k=>Number.isFinite(motion[k]))||Math.hypot(motion.vx,motion.vy)>INERTIA.maxSpeed)throw Error('Invalid saved motion.');
}
export function restoreInertiaRules(sim,core){
 if(core.inertiaRules===undefined)delete sim.inertiaRules;
 else if(core.inertiaRules!==INERTIA.policy)throw Error('Unknown saved inertia rules.');
 const enabled=inertiaEnabled(sim);
 for(const a of sim.animals){if(a.motion===undefined)continue;if(!enabled)throw Error('Saved motion without its recorded inertia rule.');validateMotion(a.motion)}
}
// Read-only presentation contract (Codex): velocity, heading, the last step's
// acceleration, whether the body is braking, and its turn rate (rad/s).
export function motionStateOf(animal){
 const m=animal?.motion,vx=m?.vx||0,vy=m?.vy||0,ax=m?.ax||0,ay=m?.ay||0,speed=Math.hypot(vx,vy);
 return Object.freeze({vx,vy,speed,heading:speed>1e-9?Math.atan2(vy,vx):null,ax,ay,acceleration:Math.hypot(ax,ay),
  braking:ax*vx+ay*vy<0,turnRate:speed>1e-9?(vx*ay-vy*ax)/(speed*speed):0});
}
