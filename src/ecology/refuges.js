import {CFG} from '../sim/config.js';
import {preyBodyMass} from './prey-biomass.js';
import {wildTraits} from '../organisms/wild-bodies.js';
import {partEffectFactors,WAVE1,hasPart} from '../lineage/part-abilities.js';

// Physical refuges for every organism (Phase 3I, creator decision 2026-10-15). Before this, hollow logs
// and thorn brakes protected only the player, and vegetation cover hid only the player from Stalkers.
// One rule now decides, for any prey and any hunter, whether the prey is protected or hidden:
//  - Hollow log: the prey's current body fits inside (body mass <= LOG_INTERIOR_MASS) and it is sheltering
//    in the log (the player presses V; wildlife enter while fleeing), and the hunter is too large to follow.
//  - Thorn brake: the prey is inside it and the hunter has no body armour (THORN_PROOF); unarmoured
//    occupants are scratched.
//  - Cover: dense vegetation hides a quiet prey beyond a range set by the hunter's senses and eyes; larger
//    bodies need denser cover (scaled by the cube root of body mass relative to GenVo, i.e. by height).
// Existing camouflage (Simulation.camouflageConceals) still applies on top. Nothing guarantees escape: an
// animal must perceive the threat, reach a refuge first and stay there. ?refuges=0 restores the old rules.
// LOG_INTERIOR_MASS and the size scaling are PROPOSALS.
export const REFUGE_PARITY={enabled:true};
export const LOG_INTERIOR_MASS=1.6,COVER_REFERENCE_MASS=1.45,REFUGE_SEARCH=8;

const site=(sim,a,kind,r)=>sim.discovery?.siteAt?.(a,kind,r)||null;
export const fitsLog=a=>preyBodyMass(a)<=LOG_INTERIOR_MASS;
// Thorns are kept out by body covering, not by spines: dorsal ridges, spine clusters and spined tails are
// weapons and leave the flanks exposed. The same anatomy decides who is scratched and who can follow.
export const THORN_PROOF=['armor-plate','reinforced-torso','dome-torso','shell-back','armored-hide'];
export const armoured=(sim,a)=>!!a&&(THORN_PROOF.some(id=>hasPart(a,id))||(a.adaptations||[]).includes('hardened-mantle'));
export function logShelter(sim,a){const s=site(sim,a,'hollow-log',1.2);return s&&fitsLog(a)&&(a.hidden||a.refugeSiteId===s.id)?s:null}
export function inThornBrake(sim,a){return site(sim,a,'thorn-brake',1.8)}

// Why `pred` cannot reach `prey` right now (physical refuge), or null.
export function refugeAgainst(sim,prey,pred){
  if(!REFUGE_PARITY.enabled||!prey||!pred)return null;
  const log=logShelter(sim,prey);if(log&&!fitsLog(pred))return'log';
  if(inThornBrake(sim,prey)&&!armoured(sim,pred))return'thorn-brake';
  return null;
}
export function quiet(sim,a){return !((a.noisyUntilTick||0)>=sim.tickCount)}
// Still = has not moved for half a second, measured the same way for every animal (Simulation records movedTick).
export function still(sim,a){return sim.tickCount-(a.movedTick??-Infinity)>=CFG.simHz*.5}
// Vegetation hides `prey` from `pred` at this distance (any prey, scaled by body size and hunter senses).
// Motion reveals (Phase 3J, provisional): a hunter already TRACKING a prey keeps sight of it in cover while it
// moves; cover hides a tracked prey only once it holds still. First detection (tracking=false) is unchanged.
// No measurable effect on wildlife pursuits (prey being stalked are usually still); it would change how the
// player escapes an engaged Stalker, so it is OFF pending review. ?motionReveals=1 enables.
export const MOTION_REVEALS={enabled:false};
export function coverHides(sim,prey,pred,distance,{tracking=false}={}){
  if(!REFUGE_PARITY.enabled||!prey||!pred||!quiet(sim,prey))return false;
  if(tracking&&MOTION_REVEALS.enabled&&!still(sim,prey))return false;
  const P=CFG.stalkerPursuit,senses=(pred.genes?.senses||1)*(wildTraits(pred).sight||1),size=Math.cbrt(Math.max(.05,preyBodyMass(prey))/COVER_REFERENCE_MASS);
  const cover=sim.coverAt(prey);
  if(cover>=P.coverHide*size&&distance>(still(sim,prey)?P.stillCoverRange:P.coverHideRange)*senses)return true;
  if(cover>=P.lightCoverHide*size&&distance>P.lightCoverRange*senses)return true;
  return false;
}
// Beyond sight (eyes, quiet bodies, visibility) for any prey.
export function beyondSight(prey,pred,distance){
  const P=CFG.stalkerPursuit,senses=(pred.genes?.senses||1)*(wildTraits(pred).sight||1),pf=partEffectFactors(prey);
  return distance>P.sight*senses*(pf?.quiet?WAVE1.quietSight:1)*(pf?.visibility??1);
}
// The nearest refuge that would protect `a` from `threat`, reachable before the threat gets there.
export function refugeTarget(sim,a,threat){
  if(!REFUGE_PARITY.enabled||!sim.discovery?.sites?.length||!a||!threat)return null;
  const r=REFUGE_SEARCH*(a.genes?.senses||1);let best=null,bd=Infinity;
  for(const s of sim.discovery.sites){
    if(s.gone||(s.kind!=='hollow-log'&&s.kind!=='thorn-brake'))continue;
    if(s.kind==='hollow-log'&&(!fitsLog(a)||fitsLog(threat)))continue;
    if(s.kind==='thorn-brake'&&armoured(sim,threat))continue;
    const d=Math.hypot(s.x-a.x,s.y-a.y);if(d>r||d>=Math.hypot(s.x-threat.x,s.y-threat.y)||!sim.world.sameLand(a.x,a.y,s.x,s.y))continue;
    if(d<bd){bd=d;best=s}
  }
  return best;
}
